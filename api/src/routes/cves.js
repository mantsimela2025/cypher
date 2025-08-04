const express = require('express');
const { db } = require('../db');
const { cves, cveMappings } = require('../db/schema');
const { eq, like, gte, lte, desc, asc, and, or, sql } = require('drizzle-orm');

const router = express.Router();

/**
 * GET /api/cves
 * Get CVEs with filtering, sorting, and pagination
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      severity,
      exploitAvailable,
      patchAvailable,
      search,
      sortBy = 'publishedDate',
      sortOrder = 'desc',
      minScore,
      maxScore,
      dateFrom,
      dateTo
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query conditions
    let conditions = [];

    // Severity filter (derived from CVSS score)
    if (severity) {
      switch (severity.toLowerCase()) {
        case 'critical':
          conditions.push(or(gte(cves.cvss3BaseScore, 9.0), gte(cves.cvss2BaseScore, 9.0)));
          break;
        case 'high':
          conditions.push(or(
            and(gte(cves.cvss3BaseScore, 7.0), lte(cves.cvss3BaseScore, 8.9)),
            and(gte(cves.cvss2BaseScore, 7.0), lte(cves.cvss2BaseScore, 8.9))
          ));
          break;
        case 'medium':
          conditions.push(or(
            and(gte(cves.cvss3BaseScore, 4.0), lte(cves.cvss3BaseScore, 6.9)),
            and(gte(cves.cvss2BaseScore, 4.0), lte(cves.cvss2BaseScore, 6.9))
          ));
          break;
        case 'low':
          conditions.push(or(
            and(gte(cves.cvss3BaseScore, 0.1), lte(cves.cvss3BaseScore, 3.9)),
            and(gte(cves.cvss2BaseScore, 0.1), lte(cves.cvss2BaseScore, 3.9))
          ));
          break;
      }
    }

    // Exploit availability filter
    if (exploitAvailable !== undefined) {
      conditions.push(eq(cves.exploitAvailable, exploitAvailable === 'true'));
    }

    // Patch availability filter
    if (patchAvailable !== undefined) {
      conditions.push(eq(cves.patchAvailable, patchAvailable === 'true'));
    }

    // CVSS score range filter
    if (minScore) {
      conditions.push(or(gte(cves.cvss3BaseScore, parseFloat(minScore)), gte(cves.cvss2BaseScore, parseFloat(minScore))));
    }
    if (maxScore) {
      conditions.push(or(lte(cves.cvss3BaseScore, parseFloat(maxScore)), lte(cves.cvss2BaseScore, parseFloat(maxScore))));
    }

    // Date range filter
    if (dateFrom) {
      conditions.push(gte(cves.publishedDate, new Date(dateFrom)));
    }
    if (dateTo) {
      conditions.push(lte(cves.publishedDate, new Date(dateTo)));
    }

    // Search filter
    if (search) {
      conditions.push(or(
        like(cves.cveId, `%${search}%`),
        like(cves.description, `%${search}%`),
        like(cves.searchVector, `%${search}%`)
      ));
    }

    // Build sort order
    const sortColumn = cves[sortBy] || cves.publishedDate;
    const orderFn = sortOrder.toLowerCase() === 'asc' ? asc : desc;

    // Execute query
    const query = db.select().from(cves);
    
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    
    const results = await query
      .orderBy(orderFn(sortColumn))
      .limit(parseInt(limit))
      .offset(offset);

    // Get total count for pagination
    const countQuery = db.select({ count: sql`count(*)` }).from(cves);
    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }
    const [{ count }] = await countQuery;

    // Add severity classification to results
    const enrichedResults = results.map(cve => ({
      ...cve,
      severity: getSeverityFromScore(cve.cvss3BaseScore || cve.cvss2BaseScore),
      cvssScore: cve.cvss3BaseScore || cve.cvss2BaseScore || null
    }));

    res.json({
      cves: enrichedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(count),
        pages: Math.ceil(count / parseInt(limit))
      },
      filters: {
        severity,
        exploitAvailable,
        patchAvailable,
        search,
        minScore,
        maxScore,
        dateFrom,
        dateTo
      }
    });

  } catch (error) {
    console.error('Error fetching CVEs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/cves/:cveId
 * Get specific CVE with full details including CWE mappings
 */
router.get('/:cveId', async (req, res) => {
  try {
    const { cveId } = req.params;

    // Get CVE details
    const [cve] = await db.select()
      .from(cves)
      .where(eq(cves.cveId, cveId))
      .limit(1);

    if (!cve) {
      return res.status(404).json({ error: 'CVE not found' });
    }

    // Get CWE mappings
    const cweMappings = await db.select()
      .from(cveMappings)
      .where(eq(cveMappings.cveId, cveId));

    // Enrich with computed fields
    const enrichedCve = {
      ...cve,
      severity: getSeverityFromScore(cve.cvss3BaseScore || cve.cvss2BaseScore),
      cvssScore: cve.cvss3BaseScore || cve.cvss2BaseScore || null,
      cweMappings: cweMappings.map(mapping => ({
        cweId: mapping.cweId,
        cweName: mapping.cweName
      }))
    };

    res.json(enrichedCve);

  } catch (error) {
    console.error('Error fetching CVE:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/cves/stats/summary
 * Get CVE statistics and summary
 */
router.get('/stats/summary', async (req, res) => {
  try {
    // Get all CVEs for analysis
    const allCves = await db.select().from(cves);
    
    // Calculate statistics
    const stats = {
      total: allCves.length,
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        unscored: 0
      },
      exploitAvailable: allCves.filter(cve => cve.exploitAvailable).length,
      patchAvailable: allCves.filter(cve => cve.patchAvailable).length,
      withGuidance: allCves.filter(cve => cve.remediationGuidance).length,
      recentCves: 0
    };

    // Calculate severity distribution
    allCves.forEach(cve => {
      const score = cve.cvss3BaseScore || cve.cvss2BaseScore;
      const severity = getSeverityFromScore(score);
      stats.bySeverity[severity]++;
    });

    // Calculate recent CVEs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    stats.recentCves = allCves.filter(cve => 
      cve.publishedDate && new Date(cve.publishedDate) > thirtyDaysAgo
    ).length;

    res.json(stats);

  } catch (error) {
    console.error('Error fetching CVE stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/cves/search/advanced
 * Advanced search with full-text capabilities
 */
router.get('/search/advanced', async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    let results = [];

    switch (type) {
      case 'exploitable':
        results = await db.select()
          .from(cves)
          .where(and(
            eq(cves.exploitAvailable, true),
            or(
              like(cves.searchVector, `%${q}%`),
              like(cves.description, `%${q}%`)
            )
          ))
          .limit(50);
        break;

      case 'critical':
        results = await db.select()
          .from(cves)
          .where(and(
            or(gte(cves.cvss3BaseScore, 9.0), gte(cves.cvss2BaseScore, 9.0)),
            or(
              like(cves.searchVector, `%${q}%`),
              like(cves.description, `%${q}%`)
            )
          ))
          .limit(50);
        break;

      default:
        results = await db.select()
          .from(cves)
          .where(or(
            like(cves.cveId, `%${q}%`),
            like(cves.description, `%${q}%`),
            like(cves.searchVector, `%${q}%`)
          ))
          .limit(50);
    }

    // Enrich results
    const enrichedResults = results.map(cve => ({
      ...cve,
      severity: getSeverityFromScore(cve.cvss3BaseScore || cve.cvss2BaseScore),
      cvssScore: cve.cvss3BaseScore || cve.cvss2BaseScore || null
    }));

    res.json({
      query: q,
      type,
      results: enrichedResults,
      count: enrichedResults.length
    });

  } catch (error) {
    console.error('Error in advanced search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Helper function to determine severity from CVSS score
 */
function getSeverityFromScore(score) {
  if (!score) return 'unscored';
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  if (score >= 0.1) return 'low';
  return 'unscored';
}

module.exports = router;
