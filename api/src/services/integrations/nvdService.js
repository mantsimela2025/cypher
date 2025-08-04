const axios = require('axios');
const { db } = require('../../db');
const { cves, cveMappings } = require('../../db/schema');
const { eq, and, gte, lte } = require('drizzle-orm');

class NVDService {
  constructor() {
    this.baseUrl = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
    this.apiKey = process.env.NVD_API_KEY; // Optional but recommended for higher rate limits
    this.rateLimitDelay = this.apiKey ? 50 : 6000; // 50ms with API key, 6s without
    this.maxRetries = 3;
    this.requestsPerMinute = this.apiKey ? 100 : 10;
    this.lastRequestTime = 0;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    console.log('🔧 Initializing NVD service...');
    
    if (this.apiKey) {
      console.log('✅ NVD API key configured - higher rate limits available');
    } else {
      console.log('⚠️  No NVD API key - using public rate limits (slower)');
      console.log('   Set NVD_API_KEY environment variable for better performance');
    }

    try {
      // Test API connectivity
      await this.testConnection();
      console.log('✅ NVD API connection established');
    } catch (error) {
      console.error('❌ NVD API connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Test API connection
   */
  async testConnection() {
    const response = await this.makeRequest('', { resultsPerPage: 1 });
    return response.data;
  }

  /**
   * Make rate-limited API request to NVD
   */
  async makeRequest(endpoint, params = {}) {
    // Implement rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    const config = {
      method: 'GET',
      url: `${this.baseUrl}${endpoint}`,
      params: {
        ...params,
        resultsPerPage: params.resultsPerPage || 100
      },
      headers: {
        'User-Agent': 'RAS-DASH-API/1.0'
      },
      timeout: 30000
    };

    if (this.apiKey) {
      config.headers['apiKey'] = this.apiKey;
    }

    this.lastRequestTime = Date.now();

    let retries = 0;
    while (retries < this.maxRetries) {
      try {
        const response = await axios(config);
        return response;
      } catch (error) {
        retries++;
        
        if (error.response?.status === 429) {
          // Rate limited - wait longer
          const waitTime = Math.pow(2, retries) * 10000; // Exponential backoff
          console.log(`⏳ Rate limited, waiting ${waitTime/1000}s before retry ${retries}/${this.maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (retries === this.maxRetries) {
          throw error;
        } else {
          // Other error - short wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }

  /**
   * Get CVEs by date range
   */
  async getCVEsByDateRange(startDate, endDate, options = {}) {
    const params = {
      pubStartDate: startDate.toISOString(),
      pubEndDate: endDate.toISOString(),
      ...options
    };

    const response = await this.makeRequest('', params);
    return response.data;
  }

  /**
   * Get recent CVEs (last N days)
   */
  async getRecentCVEs(days = 7, options = {}) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.getCVEsByDateRange(startDate, endDate, options);
  }

  /**
   * Get CVE by ID
   */
  async getCVEById(cveId) {
    const response = await this.makeRequest('', { cveId });
    return response.data;
  }

  /**
   * Search CVEs by keyword
   */
  async searchCVEs(keyword, options = {}) {
    const params = {
      keywordSearch: keyword,
      ...options
    };

    const response = await this.makeRequest('', params);
    return response.data;
  }

  /**
   * Sync CVEs to local database
   */
  async syncCVEs(options = {}) {
    try {
      console.log('🔄 Syncing CVEs from NVD...');

      const {
        days = 30,
        batchSize = 100,
        maxCVEs = 1000
      } = options;

      const syncResults = {
        total: 0,
        created: 0,
        updated: 0,
        errors: [],
        startTime: new Date()
      };

      // Get recent CVEs
      let startIndex = 0;
      let totalResults = 0;
      let processedCount = 0;

      do {
        console.log(`📊 Fetching CVEs batch starting at index ${startIndex}...`);
        
        const cveData = await this.getRecentCVEs(days, {
          startIndex,
          resultsPerPage: batchSize
        });

        totalResults = cveData.totalResults;
        const vulnerabilities = cveData.vulnerabilities || [];

        console.log(`📥 Processing ${vulnerabilities.length} CVEs...`);

        for (const vuln of vulnerabilities) {
          try {
            if (processedCount >= maxCVEs) {
              console.log(`⏹️  Reached maximum CVE limit (${maxCVEs})`);
              break;
            }

            await this.processCVE(vuln);
            syncResults.total++;
            processedCount++;

            // Progress indicator
            if (syncResults.total % 50 === 0) {
              console.log(`📊 Processed ${syncResults.total} CVEs...`);
            }

          } catch (error) {
            console.error(`❌ Error processing CVE ${vuln.cve?.id}:`, error.message);
            syncResults.errors.push({
              cveId: vuln.cve?.id,
              error: error.message
            });
          }
        }

        startIndex += batchSize;

        if (processedCount >= maxCVEs) break;

      } while (startIndex < totalResults && startIndex < maxCVEs);

      const duration = (new Date() - syncResults.startTime) / 1000;
      console.log(`✅ NVD CVE sync completed in ${duration}s:`);
      console.log(`   - Total processed: ${syncResults.total}`);
      console.log(`   - Errors: ${syncResults.errors.length}`);

      return syncResults;

    } catch (error) {
      console.error('❌ NVD CVE sync failed:', error.message);
      throw error;
    }
  }

  /**
   * Process individual CVE and store in database
   */
  async processCVE(vulnData) {
    const cve = vulnData.cve;
    const cveId = cve.id;

    // Check if CVE already exists
    const [existingCVE] = await db.select()
      .from(cves)
      .where(eq(cves.cveId, cveId))
      .limit(1);

    // Extract CVSS scores with better error handling and logging
    const metrics = cve.metrics || {};
    const cvssV31 = metrics.cvssMetricV31?.[0];
    const cvssV30 = metrics.cvssMetricV30?.[0];
    const cvssV2 = metrics.cvssMetricV2?.[0];

    // Try different CVSS versions in order of preference
    const cvssV3 = cvssV31 || cvssV30;

    // Extract CVSS scores with fallbacks
    let cvss3BaseScore = null;
    let cvss3Vector = null;
    let cvss2BaseScore = null;
    let cvss2Vector = null;

    if (cvssV3 && cvssV3.cvssData) {
      cvss3BaseScore = cvssV3.cvssData.baseScore || null;
      cvss3Vector = cvssV3.cvssData.vectorString || null;
      console.log(`✅ CVSS v3 extracted for ${cveId}: score=${cvss3BaseScore}, vector=${cvss3Vector}`);
    }

    if (cvssV2 && cvssV2.cvssData) {
      cvss2BaseScore = cvssV2.cvssData.baseScore || null;
      cvss2Vector = cvssV2.cvssData.vectorString || null;
      console.log(`✅ CVSS v2 extracted for ${cveId}: score=${cvss2BaseScore}, vector=${cvss2Vector}`);
    }

    // Debug logging for missing CVSS data
    if (!cvss3BaseScore && !cvss2BaseScore) {
      console.log(`⚠️  No CVSS scores found for ${cveId}`);
      console.log(`   Available metrics keys: ${Object.keys(metrics)}`);
      if (cvssV3) {
        console.log(`   CVSS v3 data keys: ${Object.keys(cvssV3)}`);
        console.log(`   CVSS v3 cvssData keys: ${Object.keys(cvssV3.cvssData || {})}`);
      }
    }

    // Extract CWE information
    const weaknesses = cve.weaknesses || [];
    const cweIds = weaknesses
      .flatMap(w => w.description || [])
      .filter(d => d.lang === 'en')
      .map(d => d.value)
      .filter(v => v.startsWith('CWE-'));

    // Extract references for analysis
    const references = cve.references || [];

    // Analyze exploit availability from references and description
    const exploitAvailable = this.analyzeExploitAvailability(cve.descriptions, references);

    // Analyze patch availability from references and status
    const patchAvailable = this.analyzePatchAvailability(cve, references);

    // Generate remediation guidance
    const remediationGuidance = this.generateRemediationGuidance(cve, cvss3BaseScore || cvss2BaseScore, cweIds);

    // Generate search vector for full-text search
    const searchVector = this.generateSearchVector(cve, cweIds);

    // Build CVE record matching your database schema
    const cveRecord = {
      cveId: cveId,
      description: cve.descriptions?.find(d => d.lang === 'en')?.value || '',
      publishedDate: cve.published ? new Date(cve.published) : null,
      lastModifiedDate: cve.lastModified ? new Date(cve.lastModified) : null,
      cvss3BaseScore: cvss3BaseScore,
      cvss3Vector: cvss3Vector,
      cvss2BaseScore: cvss2BaseScore,
      cvss2Vector: cvss2Vector,
      exploitAvailable: exploitAvailable,
      patchAvailable: patchAvailable,
      source: 'NVD',
      remediationGuidance: remediationGuidance,
      searchVector: searchVector
    };



    let cveDbId;

    if (existingCVE) {
      // Update existing CVE
      await db.update(cves)
        .set({
          ...cveRecord,
          updatedAt: new Date()
        })
        .where(eq(cves.cveId, cveId));

      cveDbId = existingCVE.id;
    } else {
      // Create new CVE
      const [newCVE] = await db.insert(cves)
        .values(cveRecord)
        .returning({ id: cves.id });

      cveDbId = newCVE.id;
    }

    // Store CWE mappings in separate table
    if (cweIds.length > 0) {
      // Clear existing CWE mappings
      await db.delete(cveMappings)
        .where(eq(cveMappings.cveId, cveId));

      // Insert new CWE mappings
      const cweMappingRecords = cweIds.map(cweId => ({
        cveId: cveId,
        cweId: cweId,
        cweName: null // Could be enhanced to fetch CWE names
      }));

      await db.insert(cveMappings).values(cweMappingRecords);
    }
  }

  /**
   * Analyze exploit availability from CVE data
   */
  analyzeExploitAvailability(descriptions, references) {
    // Check description for exploit indicators
    const description = descriptions?.find(d => d.lang === 'en')?.value?.toLowerCase() || '';
    const exploitKeywords = [
      'exploit', 'exploited', 'exploitation', 'proof of concept', 'poc',
      'metasploit', 'exploit-db', 'exploitdb', 'in the wild', 'active exploitation'
    ];

    const hasExploitInDescription = exploitKeywords.some(keyword =>
      description.includes(keyword)
    );

    // Check references for exploit sources
    const exploitSources = [
      'exploit-db.com', 'exploitdb.com', 'metasploit.com', 'rapid7.com',
      'packetstormsecurity.com', 'seclists.org', 'github.com'
    ];

    const hasExploitReference = references.some(ref =>
      exploitSources.some(source => ref.url?.toLowerCase().includes(source))
    );

    return hasExploitInDescription || hasExploitReference;
  }

  /**
   * Analyze patch availability from CVE data
   */
  analyzePatchAvailability(cve, references) {
    // Check CVE status
    const status = cve.vulnStatus?.toLowerCase() || '';
    const hasStatusIndicator = [
      'modified', 'analyzed', 'undergoing analysis'
    ].some(s => status.includes(s));

    // Check references for patch sources
    const patchSources = [
      'security.', 'patch', 'update', 'advisory', 'bulletin',
      'microsoft.com', 'apple.com', 'redhat.com', 'ubuntu.com',
      'debian.org', 'oracle.com', 'cisco.com'
    ];

    const hasPatchReference = references.some(ref =>
      patchSources.some(source => ref.url?.toLowerCase().includes(source))
    );

    // Check if CVE is recent (less than 30 days) - patches may not be available yet
    const publishedDate = new Date(cve.published);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isRecent = publishedDate > thirtyDaysAgo;

    return hasPatchReference || (hasStatusIndicator && !isRecent);
  }

  /**
   * Generate remediation guidance based on CVE data
   */
  generateRemediationGuidance(cve, cvssScore, cweIds) {
    const guidance = [];
    const description = cve.descriptions?.find(d => d.lang === 'en')?.value?.toLowerCase() || '';

    // Priority based on CVSS score (with fallback for unscored CVEs)
    if (cvssScore >= 9.0) {
      guidance.push('🔴 CRITICAL: Immediate action required. Apply patches or mitigations within 24 hours.');
    } else if (cvssScore >= 7.0) {
      guidance.push('🟠 HIGH: Apply patches or mitigations within 7 days.');
    } else if (cvssScore >= 4.0) {
      guidance.push('🟡 MEDIUM: Apply patches or mitigations within 30 days.');
    } else if (cvssScore > 0) {
      guidance.push('🟢 LOW: Apply patches during next maintenance window.');
    } else {
      // Fallback for CVEs without CVSS scores
      guidance.push('⚪ UNSCORED: Monitor for CVSS score assignment and vendor advisories.');
    }

    // CWE-specific guidance (expanded)
    if (cweIds.includes('CWE-79')) {
      guidance.push('• XSS vulnerability: Implement input validation and output encoding.');
    }
    if (cweIds.includes('CWE-89')) {
      guidance.push('• SQL Injection: Use parameterized queries and input validation.');
    }
    if (cweIds.includes('CWE-22')) {
      guidance.push('• Path Traversal: Validate and sanitize file paths.');
    }
    if (cweIds.includes('CWE-78')) {
      guidance.push('• Command Injection: Avoid system calls with user input.');
    }
    if (cweIds.includes('CWE-119') || cweIds.includes('CWE-120')) {
      guidance.push('• Buffer Overflow: Update to patched version immediately.');
    }
    if (cweIds.includes('CWE-352')) {
      guidance.push('• CSRF vulnerability: Implement anti-CSRF tokens.');
    }
    if (cweIds.includes('CWE-434')) {
      guidance.push('• File Upload: Validate file types and scan for malware.');
    }
    if (cweIds.includes('CWE-287')) {
      guidance.push('• Authentication Bypass: Review authentication mechanisms.');
    }
    if (cweIds.includes('CWE-200')) {
      guidance.push('• Information Disclosure: Review data exposure and access controls.');
    }

    // Description-based guidance (when CWE is not available)
    if (cweIds.length === 0) {
      if (description.includes('remote code execution') || description.includes('rce')) {
        guidance.push('• Remote Code Execution: Isolate affected systems and apply patches immediately.');
      }
      if (description.includes('privilege escalation')) {
        guidance.push('• Privilege Escalation: Review user permissions and access controls.');
      }
      if (description.includes('denial of service') || description.includes('dos')) {
        guidance.push('• Denial of Service: Implement rate limiting and monitoring.');
      }
      if (description.includes('authentication')) {
        guidance.push('• Authentication Issue: Review login mechanisms and multi-factor authentication.');
      }
      if (description.includes('cross-site') || description.includes('xss')) {
        guidance.push('• Cross-Site Scripting: Implement input validation and output encoding.');
      }
    }

    // Vendor-specific guidance
    if (description.includes('wordpress')) {
      guidance.push('• WordPress: Update plugins/themes and review wp-config.php security.');
    }
    if (description.includes('microsoft')) {
      guidance.push('• Microsoft: Check Windows Update and Microsoft Security Response Center.');
    }
    if (description.includes('apache')) {
      guidance.push('• Apache: Review server configuration and apply security patches.');
    }
    if (description.includes('nginx')) {
      guidance.push('• Nginx: Update to latest version and review configuration.');
    }

    // Status-based guidance
    const status = cve.vulnStatus?.toLowerCase() || '';
    if (status.includes('awaiting analysis')) {
      guidance.push('• Status: Awaiting NVD analysis - monitor for updates and CVSS scoring.');
    }

    // General guidance (always included)
    guidance.push('• Monitor vendor security advisories for official patches.');
    guidance.push('• Implement defense-in-depth security controls.');
    guidance.push('• Consider temporary mitigations if patches are unavailable.');
    guidance.push('• Test patches in non-production environment before deployment.');

    // Ensure we always return some guidance
    if (guidance.length === 0) {
      guidance.push('• General: Follow security best practices and monitor for updates.');
    }

    return guidance.join('\n');
  }

  /**
   * Generate search vector for full-text search
   */
  generateSearchVector(cve, cweIds) {
    const searchTerms = [];

    // Add CVE ID
    searchTerms.push(cve.id);

    // Add description keywords
    const description = cve.descriptions?.find(d => d.lang === 'en')?.value || '';
    const keywords = description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 20); // Limit to first 20 keywords

    searchTerms.push(...keywords);

    // Add CWE IDs
    searchTerms.push(...cweIds);

    // Add vendor/product names if found in description
    const vendorPatterns = [
      /microsoft/i, /apple/i, /google/i, /oracle/i, /adobe/i,
      /cisco/i, /vmware/i, /redhat/i, /ubuntu/i, /debian/i
    ];

    vendorPatterns.forEach(pattern => {
      const match = description.match(pattern);
      if (match) searchTerms.push(match[0].toLowerCase());
    });

    // Remove duplicates and join
    return [...new Set(searchTerms)].join(' ');
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      service: 'nvd',
      status: 'connected',
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      rateLimitDelay: this.rateLimitDelay,
      health: 'healthy'
    };
  }

  /**
   * Get CVE statistics from local database
   */
  async getCVEStats() {
    try {
      const totalCVEs = await db.select().from(cves);

      // Get CVEs by severity (derive from CVSS score since severity isn't stored)
      const severityStats = {};
      totalCVEs.forEach(cve => {
        const score = cve.cvss3BaseScore || cve.cvss2BaseScore;
        let severity = 'unknown';

        if (score) {
          if (score >= 9.0) severity = 'CRITICAL';
          else if (score >= 7.0) severity = 'HIGH';
          else if (score >= 4.0) severity = 'MEDIUM';
          else if (score >= 0.1) severity = 'LOW';
        }

        severityStats[severity] = (severityStats[severity] || 0) + 1;
      });

      // Get recent CVEs (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentCVEs = await db.select()
        .from(cves)
        .where(gte(cves.publishedDate, thirtyDaysAgo));

      return {
        total: totalCVEs.length,
        recent: recentCVEs.length,
        bySeverity: severityStats,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error getting CVE stats:', error.message);
      throw error;
    }
  }
}

module.exports = NVDService;
