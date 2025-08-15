const axios = require('axios');
const { db } = require('../db');
const { cves, cveMappings } = require('../db/schema');
const { eq, like, gte, lte, desc, asc, and, or, sql } = require('drizzle-orm');

class CveService {
  constructor() {
    this.baseURL = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
    this.apiKey = process.env.NVD_API_KEY;
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'User-Agent': 'RAS Dashboard - CVE Service',
        ...(this.apiKey && { 'apiKey': this.apiKey })
      }
    });
  }

  // ✅ CORRECT: Service method for getting all CVEs with filtering and pagination
  async getAllCves(filters = {}, options = {}) {
    try {
      const { limit = 50, offset = 0, sortBy = 'publishedDate', sortOrder = 'desc' } = options;
      const {
        severity,
        exploitAvailable,
        patchAvailable,
        search,
        minScore,
        maxScore,
        dateFrom,
        dateTo
      } = filters;
      
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

      // Other filters
      if (exploitAvailable !== undefined) {
        conditions.push(eq(cves.exploitAvailable, exploitAvailable === 'true'));
      }
      if (patchAvailable !== undefined) {
        conditions.push(eq(cves.patchAvailable, patchAvailable === 'true'));
      }
      if (minScore) {
        conditions.push(or(gte(cves.cvss3BaseScore, parseFloat(minScore)), gte(cves.cvss2BaseScore, parseFloat(minScore))));
      }
      if (maxScore) {
        conditions.push(or(lte(cves.cvss3BaseScore, parseFloat(maxScore)), lte(cves.cvss2BaseScore, parseFloat(maxScore))));
      }
      if (dateFrom) {
        conditions.push(gte(cves.publishedDate, new Date(dateFrom)));
      }
      if (dateTo) {
        conditions.push(lte(cves.publishedDate, new Date(dateTo)));
      }
      if (search) {
        conditions.push(or(
          sql`${cves.cveId} ILIKE ${`%${search}%`}`,
          sql`${cves.description} ILIKE ${`%${search}%`}`,
          sql`${cves.searchVector} ILIKE ${`%${search}%`}`
        ));
      }

      // ✅ CORRECT: Build sort order
      const sortColumn = cves[sortBy] || cves.publishedDate;
      const orderFn = sortOrder.toLowerCase() === 'asc' ? asc : desc;

      // ✅ CORRECT: Execute query with proper conditions
      const query = db.select().from(cves);
      if (conditions.length > 0) {
        query.where(and(...conditions));
      }
      
      const results = await query
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset);

      // ✅ CORRECT: Get total count with proper table reference
      const countQuery = db.select({ count: sql`COUNT(*)` }).from(cves);
      if (conditions.length > 0) {
        countQuery.where(and(...conditions));
      }
      const [{ count }] = await countQuery;

      // Add severity classification to results
      const enrichedResults = results.map(cve => ({
        ...cve,
        severity: this.getSeverityFromScore(cve.cvss3BaseScore || cve.cvss2BaseScore),
        cvssScore: cve.cvss3BaseScore || cve.cvss2BaseScore || null
      }));

      return { data: enrichedResults, total: parseInt(count) };
    } catch (error) {
      console.error('Error in getAllCves:', error);
      throw error;
    }
  }

  // ✅ CORRECT: Service method combining NVD API and local database
  async getCveById(cveId) {
    try {
      // Try NVD API first
      try {
        const cveDetails = await this.getCveDetailsFromNVD(cveId);
        return { ...cveDetails, source: 'NVD API' };
      } catch (nvdError) {
        console.log(`NVD API failed for ${cveId}, falling back to local database:`, nvdError.message);
        
        // Fallback to local database
        const [cve] = await db.select()
          .from(cves)
          .where(eq(cves.cveId, cveId))
          .limit(1);

        if (!cve) {
          throw new Error(`CVE ${cveId} not found in NVD API or local database`);
        }

        // Get CWE mappings from local database
        const cweMappings = await db.select()
          .from(cveMappings)
          .where(eq(cveMappings.cveId, cveId));

        // Format to match NVD API response structure
        const enrichedCve = {
          cveId: cve.cveId,
          description: cve.description,
          publishedDate: cve.publishedDate,
          lastModifiedDate: cve.lastModifiedDate,
          cvss3: cve.cvss3BaseScore ? {
            baseScore: parseFloat(cve.cvss3BaseScore),
            vectorString: cve.cvss3Vector,
            exploitabilityScore: null,
            impactScore: null
          } : null,
          cvss2: cve.cvss2BaseScore ? {
            baseScore: parseFloat(cve.cvss2BaseScore),
            vectorString: cve.cvss2Vector,
            exploitabilityScore: null,
            impactScore: null
          } : null,
          cwes: cweMappings.map(mapping => ({
            cweId: mapping.cweId,
            description: mapping.cweName || mapping.cweId
          })),
          references: [],
          severity: this.getSeverityFromScore(parseFloat(cve.cvss3BaseScore || cve.cvss2BaseScore || 0)),
          cvssScore: parseFloat(cve.cvss3BaseScore || cve.cvss2BaseScore || 0),
          sourceIdentifier: cve.source || 'Local Database',
          source: 'Local Database (NVD API fallback)'
        };

        return enrichedCve;
      }
    } catch (error) {
      console.error('Error in getCveById:', error);
      throw error;
    }
  }

  // ✅ CORRECT: Service method for statistics
  async getCveStats() {
    try {
      // ✅ CORRECT: Get all CVEs for analysis
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
        const severity = this.getSeverityFromScore(score);
        stats.bySeverity[severity]++;
      });

      // Calculate recent CVEs (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      stats.recentCves = allCves.filter(cve =>
        cve.publishedDate && new Date(cve.publishedDate) > thirtyDaysAgo
      ).length;

      return stats;
    } catch (error) {
      console.error('Error in getCveStats:', error);
      throw error;
    }
  }

  // ✅ CORRECT: Service method for advanced search
  async advancedSearch(searchTerm, type = 'all', limit = 50) {
    try {
      let results = [];

      switch (type) {
        case 'exploitable':
          results = await db.select()
            .from(cves)
            .where(and(
              eq(cves.exploitAvailable, true),
              or(
                sql`${cves.searchVector} ILIKE ${`%${searchTerm}%`}`,
                sql`${cves.description} ILIKE ${`%${searchTerm}%`}`
              )
            ))
            .limit(limit);
          break;

        case 'critical':
          results = await db.select()
            .from(cves)
            .where(and(
              or(gte(cves.cvss3BaseScore, 9.0), gte(cves.cvss2BaseScore, 9.0)),
              or(
                sql`${cves.searchVector} ILIKE ${`%${searchTerm}%`}`,
                sql`${cves.description} ILIKE ${`%${searchTerm}%`}`
              )
            ))
            .limit(limit);
          break;

        default:
          results = await db.select()
            .from(cves)
            .where(or(
              sql`${cves.cveId} ILIKE ${`%${searchTerm}%`}`,
              sql`${cves.description} ILIKE ${`%${searchTerm}%`}`,
              sql`${cves.searchVector} ILIKE ${`%${searchTerm}%`}`
            ))
            .limit(limit);
      }

      // Enrich results
      const enrichedResults = results.map(cve => ({
        ...cve,
        severity: this.getSeverityFromScore(cve.cvss3BaseScore || cve.cvss2BaseScore),
        cvssScore: cve.cvss3BaseScore || cve.cvss2BaseScore || null
      }));

      return { results: enrichedResults, count: enrichedResults.length };
    } catch (error) {
      console.error('Error in advancedSearch:', error);
      throw error;
    }
  }

  // Rename existing method for clarity
  async getCveDetailsFromNVD(cveId) {
    try {
      const response = await this.axiosInstance.get('/', {
        params: {
          cveId: cveId,
          resultsPerPage: 1
        }
      });

      if (response.data && response.data.vulnerabilities && response.data.vulnerabilities.length > 0) {
        const vulnerability = response.data.vulnerabilities[0];
        const cve = vulnerability.cve;

        // Extract CVSS scores
        const cvss3 = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0];
        const cvss2 = cve.metrics?.cvssMetricV2?.[0];

        // Extract CWE information
        const cwes = cve.weaknesses?.map(weakness => ({
          cweId: weakness.description[0]?.value || 'Unknown',
          description: weakness.description[0]?.value || 'Unknown'
        })) || [];

        // Extract references
        const references = cve.references?.map(ref => ({
          url: ref.url,
          name: ref.source || 'Reference',
          tags: ref.tags || []
        })) || [];

        // Determine severity
        const cvssScore = cvss3?.cvssData?.baseScore || cvss2?.cvssData?.baseScore;
        let severity = 'Unknown';
        if (cvssScore) {
          if (cvssScore >= 9.0) severity = 'Critical';
          else if (cvssScore >= 7.0) severity = 'High';
          else if (cvssScore >= 4.0) severity = 'Medium';
          else if (cvssScore >= 0.1) severity = 'Low';
        }

        return {
          cveId: cve.id,
          description: cve.descriptions?.[0]?.value || 'No description available',
          publishedDate: cve.published,
          lastModifiedDate: cve.lastModified,
          cvss3: cvss3 ? {
            baseScore: cvss3.cvssData.baseScore,
            baseSeverity: cvss3.cvssData.baseSeverity,
            vectorString: cvss3.cvssData.vectorString,
            exploitabilityScore: cvss3.exploitabilityScore,
            impactScore: cvss3.impactScore
          } : null,
          cvss2: cvss2 ? {
            baseScore: cvss2.cvssData.baseScore,
            baseSeverity: cvss2.baseSeverity,
            vectorString: cvss2.cvssData.vectorString,
            exploitabilityScore: cvss2.exploitabilityScore,
            impactScore: cvss2.impactScore
          } : null,
          cwes,
          references,
          severity,
          cvssScore: cvssScore || null,
          sourceIdentifier: cve.sourceIdentifier || 'Unknown'
        };
      }

      throw new Error('CVE not found in NVD');

    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`CVE ${cveId} not found in NVD database`);
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. NVD API is not responding.');
      }
      
      console.error(`Error fetching CVE ${cveId} from NVD:`, error.message);
      throw new Error(`Failed to fetch CVE details: ${error.message}`);
    }
  }

  async searchCves(searchTerm, options = {}) {
    try {
      const params = {
        keywordSearch: searchTerm,
        resultsPerPage: options.limit || 20,
        startIndex: options.offset || 0
      };

      if (options.pubStartDate) {
        params.pubStartDate = options.pubStartDate;
      }
      if (options.pubEndDate) {
        params.pubEndDate = options.pubEndDate;
      }
      if (options.cvssV3Severity) {
        params.cvssV3Severity = options.cvssV3Severity;
      }

      const response = await this.axiosInstance.get('/', { params });

      if (response.data && response.data.vulnerabilities) {
        const cves = response.data.vulnerabilities.map(vulnerability => {
          const cve = vulnerability.cve;
          const cvss3 = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0];
          const cvss2 = cve.metrics?.cvssMetricV2?.[0];
          const cvssScore = cvss3?.cvssData?.baseScore || cvss2?.cvssData?.baseScore;

          let severity = 'Unknown';
          if (cvssScore) {
            if (cvssScore >= 9.0) severity = 'Critical';
            else if (cvssScore >= 7.0) severity = 'High';
            else if (cvssScore >= 4.0) severity = 'Medium';
            else if (cvssScore >= 0.1) severity = 'Low';
          }

          return {
            cveId: cve.id,
            description: cve.descriptions?.[0]?.value || 'No description available',
            publishedDate: cve.published,
            lastModifiedDate: cve.lastModified,
            cvssScore,
            severity,
            baseSeverity: cvss3?.cvssData?.baseSeverity || cvss2?.baseSeverity || 'Unknown'
          };
        });

        return {
          cves,
          totalResults: response.data.totalResults || 0,
          resultsPerPage: response.data.resultsPerPage || 20,
          startIndex: response.data.startIndex || 0
        };
      }

      return { cves: [], totalResults: 0 };

    } catch (error) {
      console.error('Error searching CVEs from NVD:', error.message);
      throw new Error(`Failed to search CVEs: ${error.message}`);
    }
  }

  // ✅ CORRECT: Helper method for severity classification
  getSeverityFromScore(score) {
    if (!score) return 'unscored';
    if (score >= 9.0) return 'critical';
    if (score >= 7.0) return 'high';
    if (score >= 4.0) return 'medium';
    if (score >= 0.1) return 'low';
    return 'unscored';
  }
}

module.exports = new CveService();