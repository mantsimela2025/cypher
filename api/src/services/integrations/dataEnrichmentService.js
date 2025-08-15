const { db } = require('../../db');
const { 
  vulnerabilities, 
  assets, 
  vulnerabilityRiskScores, 
  assetVulnerabilities,
  enrichmentJobs,
  enrichmentResults 
} = require('../../db/schema');
const { eq, and, sql, desc, gte, lte } = require('drizzle-orm');

/**
 * Data Enrichment Service
 * Augments external data with AI-generated risk scores, remediation priorities, and predictive analytics
 */
class DataEnrichmentService {
  constructor() {
    this.isInitialized = false;
    this.enrichmentQueue = [];
    this.processingQueue = false;
    this.riskFactors = new Map();
    this.mlModels = new Map();
  }

  /**
   * Initialize data enrichment service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load risk factor configurations
      await this.loadRiskFactors();
      
      // Initialize ML models
      await this.initializeMLModels();
      
      // Start background processing
      this.startBackgroundProcessing();
      
      this.isInitialized = true;
      console.log('✅ Data enrichment service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize data enrichment service:', error);
      throw error;
    }
  }

  /**
   * Load risk factor configurations
   */
  async loadRiskFactors() {
    // Define risk factors for vulnerability scoring
    this.riskFactors.set('cvss_score', { weight: 0.3, type: 'numeric' });
    this.riskFactors.set('exploit_available', { weight: 0.25, type: 'boolean' });
    this.riskFactors.set('asset_criticality', { weight: 0.2, type: 'categorical' });
    this.riskFactors.set('exposure_level', { weight: 0.15, type: 'categorical' });
    this.riskFactors.set('patch_availability', { weight: 0.1, type: 'boolean' });

    console.log(`📊 Loaded ${this.riskFactors.size} risk factors`);
  }

  /**
   * Initialize ML models (mock implementation)
   */
  async initializeMLModels() {
    // In a real implementation, this would load trained ML models
    this.mlModels.set('risk_predictor', {
      type: 'regression',
      version: '1.0',
      accuracy: 0.85,
      lastTrained: new Date()
    });

    this.mlModels.set('remediation_prioritizer', {
      type: 'classification',
      version: '1.0',
      accuracy: 0.78,
      lastTrained: new Date()
    });

    this.mlModels.set('threat_predictor', {
      type: 'time_series',
      version: '1.0',
      accuracy: 0.72,
      lastTrained: new Date()
    });

    console.log(`🤖 Initialized ${this.mlModels.size} ML models`);
  }

  /**
   * Start background processing queue
   */
  startBackgroundProcessing() {
    setInterval(async () => {
      if (!this.processingQueue && this.enrichmentQueue.length > 0) {
        await this.processEnrichmentQueue();
      }
    }, 5000); // Process every 5 seconds
  }

  /**
   * Enrich vulnerability data
   */
  async enrichVulnerability(vulnerabilityId, options = {}) {
    try {
      console.log(`🔍 Enriching vulnerability: ${vulnerabilityId}`);

      // Get vulnerability data
      const vulnerability = await this.getVulnerabilityData(vulnerabilityId);
      if (!vulnerability) {
        throw new Error(`Vulnerability ${vulnerabilityId} not found`);
      }

      // Calculate AI-enhanced risk score
      const riskScore = await this.calculateEnhancedRiskScore(vulnerability);

      // Generate remediation priority
      const remediationPriority = await this.calculateRemediationPriority(vulnerability, riskScore);

      // Generate predictive analytics
      const predictiveAnalytics = await this.generatePredictiveAnalytics(vulnerability);

      // Store enrichment results
      const enrichmentResult = await this.storeEnrichmentResults(vulnerabilityId, {
        riskScore,
        remediationPriority,
        predictiveAnalytics,
        enrichedAt: new Date(),
        version: '1.0'
      });

      console.log(`✅ Enriched vulnerability ${vulnerabilityId} with risk score: ${riskScore.overall}`);
      return enrichmentResult;

    } catch (error) {
      console.error(`❌ Failed to enrich vulnerability ${vulnerabilityId}:`, error);
      throw error;
    }
  }

  /**
   * Get vulnerability data with related information
   */
  async getVulnerabilityData(vulnerabilityId) {
    try {
      const [vulnerability] = await db.select({
        id: vulnerabilities.id,
        pluginId: vulnerabilities.pluginId,
        name: vulnerabilities.name,
        description: vulnerabilities.description,
        severity: vulnerabilities.severity,
        cvssScore: vulnerabilities.cvssScore,
        cvssVector: vulnerabilities.cvssVector,
        solution: vulnerabilities.solution,
        synopsis: vulnerabilities.synopsis,
        exploitAvailable: vulnerabilities.exploitAvailable,
        patchPublicationDate: vulnerabilities.patchPublicationDate,
        vulnerabilityPublicationDate: vulnerabilities.vulnerabilityPublicationDate,
        // Asset count
        assetCount: sql`(
          SELECT COUNT(DISTINCT ${assetVulnerabilities.assetId})
          FROM ${assetVulnerabilities}
          WHERE ${assetVulnerabilities.vulnerabilityId} = ${vulnerabilities.id}
        )`.as('asset_count'),
        // Critical asset count
        criticalAssetCount: sql`(
          SELECT COUNT(DISTINCT av.asset_id)
          FROM ${assetVulnerabilities} av
          JOIN ${assets} a ON av.asset_id = a.id
          WHERE av.vulnerability_id = ${vulnerabilities.id}
          AND a.criticality = 'critical'
        )`.as('critical_asset_count')
      })
      .from(vulnerabilities)
      .where(eq(vulnerabilities.id, vulnerabilityId))
      .limit(1);

      return vulnerability;
    } catch (error) {
      console.error('Error fetching vulnerability data:', error);
      throw error;
    }
  }

  /**
   * Calculate enhanced risk score using AI
   */
  async calculateEnhancedRiskScore(vulnerability) {
    try {
      const factors = {
        cvss_score: vulnerability.cvssScore || 0,
        exploit_available: vulnerability.exploitAvailable || false,
        asset_criticality: this.calculateAssetCriticalityScore(vulnerability),
        exposure_level: this.calculateExposureLevel(vulnerability),
        patch_availability: this.hasPatchAvailable(vulnerability)
      };

      // Calculate weighted score
      let weightedScore = 0;
      let totalWeight = 0;

      for (const [factor, config] of this.riskFactors.entries()) {
        const value = factors[factor];
        const normalizedValue = this.normalizeFactorValue(value, config.type);
        weightedScore += normalizedValue * config.weight;
        totalWeight += config.weight;
      }

      const baseScore = (weightedScore / totalWeight) * 10; // Scale to 0-10

      // Apply AI enhancement (mock ML prediction)
      const aiEnhancement = await this.applyAIEnhancement(factors, baseScore);

      return {
        overall: Math.min(10, Math.max(0, baseScore + aiEnhancement)),
        base: baseScore,
        aiEnhancement,
        factors,
        confidence: 0.85,
        model: 'risk_predictor_v1.0'
      };

    } catch (error) {
      console.error('Error calculating enhanced risk score:', error);
      throw error;
    }
  }

  /**
   * Calculate asset criticality score
   */
  calculateAssetCriticalityScore(vulnerability) {
    const criticalRatio = vulnerability.criticalAssetCount / Math.max(1, vulnerability.assetCount);
    
    if (criticalRatio >= 0.5) return 'high';
    if (criticalRatio >= 0.2) return 'medium';
    return 'low';
  }

  /**
   * Calculate exposure level
   */
  calculateExposureLevel(vulnerability) {
    // Simple heuristic based on asset count
    if (vulnerability.assetCount >= 100) return 'high';
    if (vulnerability.assetCount >= 10) return 'medium';
    return 'low';
  }

  /**
   * Check if patch is available
   */
  hasPatchAvailable(vulnerability) {
    return vulnerability.patchPublicationDate !== null;
  }

  /**
   * Normalize factor value based on type
   */
  normalizeFactorValue(value, type) {
    switch (type) {
      case 'numeric':
        return Math.min(1, Math.max(0, value / 10)); // Assume 0-10 scale
      case 'boolean':
        return value ? 1 : 0;
      case 'categorical':
        const categoryMap = { 'low': 0.2, 'medium': 0.6, 'high': 1.0 };
        return categoryMap[value] || 0;
      default:
        return 0;
    }
  }

  /**
   * Apply AI enhancement to base score
   */
  async applyAIEnhancement(factors, baseScore) {
    // Mock AI enhancement - in reality, this would use trained ML models
    let enhancement = 0;

    // Boost score for exploitable vulnerabilities
    if (factors.exploit_available) {
      enhancement += 0.5;
    }

    // Boost score for high-criticality assets
    if (factors.asset_criticality === 'high') {
      enhancement += 0.3;
    }

    // Reduce score if patch is available
    if (factors.patch_availability) {
      enhancement -= 0.2;
    }

    // Add some randomness to simulate ML prediction variance
    enhancement += (Math.random() - 0.5) * 0.2;

    return Math.max(-2, Math.min(2, enhancement));
  }

  /**
   * Calculate remediation priority
   */
  async calculateRemediationPriority(vulnerability, riskScore) {
    try {
      const factors = {
        riskScore: riskScore.overall,
        exploitAvailable: vulnerability.exploitAvailable,
        assetCount: vulnerability.assetCount,
        criticalAssetCount: vulnerability.criticalAssetCount,
        patchAge: this.calculatePatchAge(vulnerability),
        businessImpact: this.calculateBusinessImpact(vulnerability)
      };

      // Calculate priority score (0-100)
      let priorityScore = 0;

      // Risk score contribution (40%)
      priorityScore += (riskScore.overall / 10) * 40;

      // Asset impact contribution (30%)
      const assetImpact = (factors.criticalAssetCount * 2 + factors.assetCount) / 100;
      priorityScore += Math.min(30, assetImpact * 30);

      // Exploit availability contribution (20%)
      if (factors.exploitAvailable) {
        priorityScore += 20;
      }

      // Patch age contribution (10%)
      priorityScore += Math.min(10, factors.patchAge * 2);

      // Determine priority level
      let level;
      if (priorityScore >= 80) level = 'critical';
      else if (priorityScore >= 60) level = 'high';
      else if (priorityScore >= 40) level = 'medium';
      else level = 'low';

      return {
        level,
        score: Math.min(100, priorityScore),
        factors,
        recommendedTimeframe: this.getRecommendedTimeframe(level),
        confidence: 0.78
      };

    } catch (error) {
      console.error('Error calculating remediation priority:', error);
      throw error;
    }
  }

  /**
   * Calculate patch age in days
   */
  calculatePatchAge(vulnerability) {
    if (!vulnerability.patchPublicationDate) return 0;
    
    const patchDate = new Date(vulnerability.patchPublicationDate);
    const now = new Date();
    const ageInDays = (now - patchDate) / (1000 * 60 * 60 * 24);
    
    return Math.max(0, ageInDays);
  }

  /**
   * Calculate business impact
   */
  calculateBusinessImpact(vulnerability) {
    // Simple heuristic - in reality, this would consider business context
    const criticalityWeight = vulnerability.criticalAssetCount / Math.max(1, vulnerability.assetCount);
    return criticalityWeight * vulnerability.cvssScore;
  }

  /**
   * Get recommended timeframe for remediation
   */
  getRecommendedTimeframe(priority) {
    const timeframes = {
      'critical': '24 hours',
      'high': '7 days',
      'medium': '30 days',
      'low': '90 days'
    };
    return timeframes[priority] || '90 days';
  }

  /**
   * Generate predictive analytics
   */
  async generatePredictiveAnalytics(vulnerability) {
    try {
      // Mock predictive analytics - in reality, this would use time series models
      const analytics = {
        exploitProbability: this.predictExploitProbability(vulnerability),
        spreadRisk: this.predictSpreadRisk(vulnerability),
        remediationComplexity: this.predictRemediationComplexity(vulnerability),
        businessImpactForecast: this.predictBusinessImpact(vulnerability),
        trendAnalysis: this.analyzeTrends(vulnerability)
      };

      return {
        ...analytics,
        generatedAt: new Date(),
        model: 'threat_predictor_v1.0',
        confidence: 0.72
      };

    } catch (error) {
      console.error('Error generating predictive analytics:', error);
      throw error;
    }
  }

  /**
   * Predict exploit probability
   */
  predictExploitProbability(vulnerability) {
    let probability = 0.1; // Base probability

    if (vulnerability.exploitAvailable) probability += 0.4;
    if (vulnerability.cvssScore >= 7) probability += 0.3;
    if (vulnerability.assetCount >= 50) probability += 0.2;

    return {
      probability: Math.min(1, probability),
      timeframe: '30 days',
      factors: ['exploit_availability', 'cvss_score', 'asset_exposure']
    };
  }

  /**
   * Predict spread risk
   */
  predictSpreadRisk(vulnerability) {
    const networkSpread = vulnerability.assetCount / 1000; // Normalize
    const criticalityFactor = vulnerability.criticalAssetCount / Math.max(1, vulnerability.assetCount);
    
    return {
      risk: Math.min(1, networkSpread + criticalityFactor),
      affectedAssets: Math.ceil(vulnerability.assetCount * 0.3),
      timeToSpread: '7 days'
    };
  }

  /**
   * Predict remediation complexity
   */
  predictRemediationComplexity(vulnerability) {
    let complexity = 'medium';
    let effort = 5; // Hours

    if (vulnerability.assetCount > 100) {
      complexity = 'high';
      effort = 20;
    } else if (vulnerability.assetCount < 10) {
      complexity = 'low';
      effort = 2;
    }

    return {
      level: complexity,
      estimatedEffort: effort,
      requiredSkills: ['system_admin', 'security_analyst'],
      dependencies: []
    };
  }

  /**
   * Predict business impact
   */
  predictBusinessImpact(vulnerability) {
    const impact = vulnerability.criticalAssetCount * vulnerability.cvssScore;
    
    return {
      financialImpact: Math.min(1000000, impact * 1000), // Mock financial impact
      operationalImpact: impact > 50 ? 'high' : 'medium',
      reputationalRisk: vulnerability.exploitAvailable ? 'high' : 'low'
    };
  }

  /**
   * Analyze trends
   */
  analyzeTrends(vulnerability) {
    return {
      similarVulnerabilities: Math.floor(Math.random() * 10) + 1,
      industryTrend: 'increasing',
      seasonalPattern: 'none',
      attackerInterest: vulnerability.exploitAvailable ? 'high' : 'medium'
    };
  }

  /**
   * Store enrichment results
   */
  async storeEnrichmentResults(vulnerabilityId, enrichmentData) {
    try {
      // Store in vulnerability_risk_scores table
      await db.insert(vulnerabilityRiskScores)
        .values({
          vulnerabilityId,
          riskScore: enrichmentData.riskScore.overall,
          baseScore: enrichmentData.riskScore.base,
          aiEnhancement: enrichmentData.riskScore.aiEnhancement,
          confidence: enrichmentData.riskScore.confidence,
          factors: JSON.stringify(enrichmentData.riskScore.factors),
          model: enrichmentData.riskScore.model,
          calculatedAt: enrichmentData.enrichedAt
        })
        .onConflictDoUpdate({
          target: vulnerabilityRiskScores.vulnerabilityId,
          set: {
            riskScore: enrichmentData.riskScore.overall,
            baseScore: enrichmentData.riskScore.base,
            aiEnhancement: enrichmentData.riskScore.aiEnhancement,
            confidence: enrichmentData.riskScore.confidence,
            factors: JSON.stringify(enrichmentData.riskScore.factors),
            model: enrichmentData.riskScore.model,
            calculatedAt: enrichmentData.enrichedAt,
            updatedAt: new Date()
          }
        });

      return {
        vulnerabilityId,
        enriched: true,
        ...enrichmentData
      };

    } catch (error) {
      console.error('Error storing enrichment results:', error);
      throw error;
    }
  }

  /**
   * Bulk enrich vulnerabilities
   */
  async bulkEnrichVulnerabilities(vulnerabilityIds, options = {}) {
    try {
      console.log(`🔄 Starting bulk enrichment of ${vulnerabilityIds.length} vulnerabilities`);

      const results = [];
      const batchSize = options.batchSize || 10;

      for (let i = 0; i < vulnerabilityIds.length; i += batchSize) {
        const batch = vulnerabilityIds.slice(i, i + batchSize);
        const batchPromises = batch.map(id => this.enrichVulnerability(id, options));
        
        try {
          const batchResults = await Promise.allSettled(batchPromises);
          results.push(...batchResults);
        } catch (error) {
          console.error(`Error processing batch ${i / batchSize + 1}:`, error);
        }

        // Add delay between batches to avoid overwhelming the system
        if (i + batchSize < vulnerabilityIds.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`✅ Bulk enrichment completed: ${successful} successful, ${failed} failed`);

      return {
        total: vulnerabilityIds.length,
        successful,
        failed,
        results
      };

    } catch (error) {
      console.error('Error in bulk enrichment:', error);
      throw error;
    }
  }

  /**
   * Process enrichment queue
   */
  async processEnrichmentQueue() {
    if (this.processingQueue || this.enrichmentQueue.length === 0) return;

    this.processingQueue = true;

    try {
      const batch = this.enrichmentQueue.splice(0, 5); // Process 5 at a time
      
      for (const item of batch) {
        try {
          await this.enrichVulnerability(item.vulnerabilityId, item.options);
        } catch (error) {
          console.error(`Failed to process queued enrichment for ${item.vulnerabilityId}:`, error);
        }
      }
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Queue vulnerability for enrichment
   */
  queueForEnrichment(vulnerabilityId, options = {}) {
    this.enrichmentQueue.push({ vulnerabilityId, options, queuedAt: new Date() });
    console.log(`📋 Queued vulnerability ${vulnerabilityId} for enrichment`);
  }

  /**
   * Get enrichment statistics
   */
  async getEnrichmentStats() {
    try {
      const [stats] = await db.select({
        totalEnriched: sql`COUNT(*)`,
        avgRiskScore: sql`AVG(${vulnerabilityRiskScores.riskScore})`,
        highRiskCount: sql`COUNT(*) FILTER (WHERE ${vulnerabilityRiskScores.riskScore} >= 7)`,
        recentEnrichments: sql`COUNT(*) FILTER (WHERE ${vulnerabilityRiskScores.calculatedAt} >= NOW() - INTERVAL '24 hours')`
      })
      .from(vulnerabilityRiskScores);

      return {
        ...stats,
        queueSize: this.enrichmentQueue.length,
        modelsLoaded: this.mlModels.size,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error fetching enrichment stats:', error);
      throw error;
    }
  }
}

module.exports = new DataEnrichmentService();
