const { db } = require('../../db');
const { 
  systems, 
  systemSecurityPosture,
  systemConfigurationDrift,
  vulnerabilities,
  assetVulnerabilities,
  assets,
  systemAssets,
  vulnerabilityRiskScores,
  enterpriseRiskAggregation
} = require('../../db/schema');
const { eq, and, sql, desc, gte, lte, count, avg, sum } = require('drizzle-orm');

/**
 * Risk Scoring Algorithm Service
 * Dynamic risk assessment based on vulnerabilities, configuration drift, 
 * patch status, and threat intelligence
 */
class RiskScoringService {
  constructor() {
    this.isInitialized = false;
    this.riskModels = new Map();
    this.threatIntelligence = new Map();
    this.riskCache = new Map();
  }

  /**
   * Initialize risk scoring service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load risk scoring models
      this.loadRiskScoringModels();
      
      // Load threat intelligence data
      await this.loadThreatIntelligence();
      
      this.isInitialized = true;
      console.log('✅ Risk scoring algorithm service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize risk scoring service:', error);
      throw error;
    }
  }

  /**
   * Load risk scoring models
   */
  loadRiskScoringModels() {
    // CVSS-based vulnerability risk model
    this.riskModels.set('cvss_vulnerability', {
      name: 'CVSS Vulnerability Risk Model',
      version: '1.0',
      weights: {
        cvssScore: 0.4,
        exploitability: 0.2,
        assetCriticality: 0.2,
        threatContext: 0.1,
        patchAvailability: 0.1
      },
      calculate: this.calculateCvssVulnerabilityRisk.bind(this)
    });

    // Configuration drift risk model
    this.riskModels.set('configuration_drift', {
      name: 'Configuration Drift Risk Model',
      version: '1.0',
      weights: {
        driftSeverity: 0.3,
        securityImpact: 0.25,
        businessImpact: 0.2,
        detectionTime: 0.15,
        remediationComplexity: 0.1
      },
      calculate: this.calculateConfigurationDriftRisk.bind(this)
    });

    // System-level composite risk model
    this.riskModels.set('system_composite', {
      name: 'System Composite Risk Model',
      version: '1.0',
      weights: {
        vulnerabilityRisk: 0.35,
        configurationRisk: 0.25,
        patchRisk: 0.15,
        threatExposure: 0.15,
        businessImpact: 0.1
      },
      calculate: this.calculateSystemCompositeRisk.bind(this)
    });

    // Enterprise-level aggregated risk model
    this.riskModels.set('enterprise_aggregate', {
      name: 'Enterprise Aggregate Risk Model',
      version: '1.0',
      weights: {
        systemRisks: 0.4,
        crossSystemCorrelations: 0.2,
        threatLandscape: 0.2,
        complianceGaps: 0.1,
        businessContinuity: 0.1
      },
      calculate: this.calculateEnterpriseAggregateRisk.bind(this)
    });

    console.log(`🧮 Loaded ${this.riskModels.size} risk scoring models`);
  }

  /**
   * Load threat intelligence data
   */
  async loadThreatIntelligence() {
    try {
      // Mock threat intelligence data - in production would integrate with threat feeds
      this.threatIntelligence.set('cve_exploits', {
        'CVE-2023-1234': { exploitAvailable: true, exploitComplexity: 'low', threatActors: ['APT1', 'Ransomware'] },
        'CVE-2023-5678': { exploitAvailable: false, exploitComplexity: 'high', threatActors: [] }
      });

      this.threatIntelligence.set('attack_patterns', {
        'lateral_movement': { frequency: 'high', impact: 'critical', indicators: ['smb', 'rdp', 'wmi'] },
        'privilege_escalation': { frequency: 'medium', impact: 'high', indicators: ['uac_bypass', 'token_manipulation'] }
      });

      this.threatIntelligence.set('industry_threats', {
        'financial': { topThreats: ['ransomware', 'data_theft', 'fraud'], riskMultiplier: 1.2 },
        'healthcare': { topThreats: ['ransomware', 'data_breach', 'system_disruption'], riskMultiplier: 1.3 },
        'government': { topThreats: ['apt', 'espionage', 'data_theft'], riskMultiplier: 1.4 }
      });

      console.log('🔍 Loaded threat intelligence data');
    } catch (error) {
      console.error('Error loading threat intelligence:', error);
    }
  }

  /**
   * Calculate dynamic risk score for a system
   */
  async calculateSystemRiskScore(systemId, options = {}) {
    try {
      console.log(`🎯 Calculating risk score for system ${systemId}`);

      const { model = 'system_composite', forceRefresh = false } = options;

      // Check cache first
      const cacheKey = `${systemId}_${model}`;
      if (!forceRefresh && this.riskCache.has(cacheKey)) {
        const cached = this.riskCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 30 * 60 * 1000) { // 30 minutes cache
          return cached.data;
        }
      }

      // Get system information
      const [system] = await db.select()
        .from(systems)
        .where(eq(systems.id, systemId))
        .limit(1);

      if (!system) {
        throw new Error(`System ${systemId} not found`);
      }

      // Get risk model
      const riskModel = this.riskModels.get(model);
      if (!riskModel) {
        throw new Error(`Risk model ${model} not found`);
      }

      // Calculate risk using the specified model
      const riskScore = await riskModel.calculate(system, options);

      // Cache the result
      this.riskCache.set(cacheKey, {
        data: riskScore,
        timestamp: Date.now()
      });

      console.log(`✅ Risk score calculated for system ${systemId}: ${riskScore.overallRisk}`);

      return riskScore;

    } catch (error) {
      console.error(`Error calculating risk score for system ${systemId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate CVSS-based vulnerability risk
   */
  async calculateCvssVulnerabilityRisk(system, options = {}) {
    try {
      // Get system assets
      const systemAssetIds = await db.select({ assetId: systemAssets.assetId })
        .from(systemAssets)
        .where(eq(systemAssets.systemId, system.id));

      if (systemAssetIds.length === 0) {
        return {
          overallRisk: 0,
          riskLevel: 'low',
          vulnerabilityCount: 0,
          highRiskVulnerabilities: 0,
          riskFactors: [],
          recommendations: []
        };
      }

      const assetIds = systemAssetIds.map(a => a.assetId);

      // Get vulnerability data with CVSS scores
      const vulnerabilityData = await db.select({
        id: vulnerabilities.id,
        severity: vulnerabilities.severityName,
        cvssScore: vulnerabilities.cvss3BaseScore,
        pluginId: vulnerabilities.pluginId,
        firstFound: vulnerabilities.firstFound,
        lastFound: vulnerabilities.lastFound
      })
      .from(vulnerabilities)
      .innerJoin(assetVulnerabilities, eq(vulnerabilities.id, assetVulnerabilities.vulnerabilityId))
      .innerJoin(assets, eq(assetVulnerabilities.assetUuid, assets.assetUuid))
      .where(sql`${assets.id} = ANY(${assetIds})`);

      // Calculate individual vulnerability risks
      const vulnerabilityRisks = vulnerabilityData.map(vuln => {
        const cvssScore = parseFloat(vuln.cvssScore) || 0;
        const exploitability = this.getExploitabilityScore(vuln.pluginId);
        const assetCriticality = this.getAssetCriticalityScore(system);
        const threatContext = this.getThreatContextScore(vuln.pluginId);
        const patchAge = this.getPatchAgeScore(vuln.firstFound);

        const weights = this.riskModels.get('cvss_vulnerability').weights;
        
        const riskScore = (
          (cvssScore / 10 * 100) * weights.cvssScore +
          exploitability * weights.exploitability +
          assetCriticality * weights.assetCriticality +
          threatContext * weights.threatContext +
          patchAge * weights.patchAvailability
        );

        return {
          vulnerabilityId: vuln.id,
          pluginId: vuln.pluginId,
          severity: vuln.severity,
          cvssScore,
          riskScore: Math.round(riskScore),
          riskLevel: this.getRiskLevel(riskScore)
        };
      });

      // Aggregate vulnerability risks
      const totalVulnerabilities = vulnerabilityRisks.length;
      const highRiskVulnerabilities = vulnerabilityRisks.filter(v => v.riskScore >= 70).length;
      const averageRisk = totalVulnerabilities > 0 
        ? vulnerabilityRisks.reduce((sum, v) => sum + v.riskScore, 0) / totalVulnerabilities 
        : 0;

      // Apply risk aggregation logic
      let overallRisk = averageRisk;
      
      // Increase risk for high number of vulnerabilities
      if (totalVulnerabilities > 50) overallRisk *= 1.2;
      else if (totalVulnerabilities > 20) overallRisk *= 1.1;

      // Increase risk for high-risk vulnerabilities
      if (highRiskVulnerabilities > 10) overallRisk *= 1.3;
      else if (highRiskVulnerabilities > 5) overallRisk *= 1.15;

      overallRisk = Math.min(100, Math.round(overallRisk));

      const riskFactors = [];
      if (highRiskVulnerabilities > 0) riskFactors.push(`${highRiskVulnerabilities} high-risk vulnerabilities`);
      if (totalVulnerabilities > 50) riskFactors.push('High vulnerability count');
      
      const oldVulns = vulnerabilityRisks.filter(v => 
        new Date() - new Date(v.firstFound) > 90 * 24 * 60 * 60 * 1000
      ).length;
      if (oldVulns > 0) riskFactors.push(`${oldVulns} vulnerabilities older than 90 days`);

      return {
        overallRisk,
        riskLevel: this.getRiskLevel(overallRisk),
        vulnerabilityCount: totalVulnerabilities,
        highRiskVulnerabilities,
        averageRisk: Math.round(averageRisk),
        vulnerabilityRisks: vulnerabilityRisks.slice(0, 10), // Top 10 for performance
        riskFactors,
        recommendations: this.generateVulnerabilityRecommendations(vulnerabilityRisks),
        calculatedAt: new Date(),
        model: 'cvss_vulnerability'
      };

    } catch (error) {
      console.error('Error calculating CVSS vulnerability risk:', error);
      throw error;
    }
  }

  /**
   * Calculate configuration drift risk
   */
  async calculateConfigurationDriftRisk(system, options = {}) {
    try {
      // Get configuration drift data
      const driftData = await db.select({
        id: systemConfigurationDrift.id,
        driftType: systemConfigurationDrift.driftType,
        severity: systemConfigurationDrift.severity,
        detectedAt: systemConfigurationDrift.detectedAt,
        status: systemConfigurationDrift.status,
        businessImpact: systemConfigurationDrift.businessImpact
      })
      .from(systemConfigurationDrift)
      .where(eq(systemConfigurationDrift.systemId, system.id));

      if (driftData.length === 0) {
        return {
          overallRisk: 0,
          riskLevel: 'low',
          driftCount: 0,
          criticalDrifts: 0,
          riskFactors: [],
          recommendations: []
        };
      }

      // Calculate individual drift risks
      const driftRisks = driftData.map(drift => {
        const severityScore = this.getSeverityScore(drift.severity);
        const securityImpact = this.getSecurityImpactScore(drift.driftType);
        const businessImpact = this.getBusinessImpactScore(drift.businessImpact);
        const detectionTime = this.getDetectionTimeScore(drift.detectedAt);
        const remediationComplexity = this.getRemediationComplexityScore(drift.driftType);

        const weights = this.riskModels.get('configuration_drift').weights;
        
        const riskScore = (
          severityScore * weights.driftSeverity +
          securityImpact * weights.securityImpact +
          businessImpact * weights.businessImpact +
          detectionTime * weights.detectionTime +
          remediationComplexity * weights.remediationComplexity
        );

        return {
          driftId: drift.id,
          driftType: drift.driftType,
          severity: drift.severity,
          riskScore: Math.round(riskScore),
          riskLevel: this.getRiskLevel(riskScore),
          status: drift.status
        };
      });

      // Aggregate drift risks
      const totalDrifts = driftRisks.length;
      const criticalDrifts = driftRisks.filter(d => d.severity === 'critical').length;
      const openDrifts = driftRisks.filter(d => d.status === 'open').length;
      const averageRisk = totalDrifts > 0 
        ? driftRisks.reduce((sum, d) => sum + d.riskScore, 0) / totalDrifts 
        : 0;

      // Apply risk aggregation logic
      let overallRisk = averageRisk;
      
      // Increase risk for unresolved drifts
      if (openDrifts > 10) overallRisk *= 1.3;
      else if (openDrifts > 5) overallRisk *= 1.15;

      // Increase risk for critical drifts
      if (criticalDrifts > 0) overallRisk *= (1 + criticalDrifts * 0.1);

      overallRisk = Math.min(100, Math.round(overallRisk));

      const riskFactors = [];
      if (criticalDrifts > 0) riskFactors.push(`${criticalDrifts} critical configuration drifts`);
      if (openDrifts > 5) riskFactors.push(`${openDrifts} unresolved configuration issues`);

      return {
        overallRisk,
        riskLevel: this.getRiskLevel(overallRisk),
        driftCount: totalDrifts,
        criticalDrifts,
        openDrifts,
        averageRisk: Math.round(averageRisk),
        driftRisks: driftRisks.slice(0, 10), // Top 10 for performance
        riskFactors,
        recommendations: this.generateDriftRecommendations(driftRisks),
        calculatedAt: new Date(),
        model: 'configuration_drift'
      };

    } catch (error) {
      console.error('Error calculating configuration drift risk:', error);
      throw error;
    }
  }

  /**
   * Calculate system composite risk
   */
  async calculateSystemCompositeRisk(system, options = {}) {
    try {
      // Get individual risk components
      const vulnerabilityRisk = await this.calculateCvssVulnerabilityRisk(system, options);
      const configurationRisk = await this.calculateConfigurationDriftRisk(system, options);
      const patchRisk = await this.calculatePatchRisk(system);
      const threatExposure = await this.calculateThreatExposure(system);
      const businessImpact = await this.calculateBusinessImpactRisk(system);

      const weights = this.riskModels.get('system_composite').weights;

      // Calculate composite risk score
      const compositeRisk = (
        vulnerabilityRisk.overallRisk * weights.vulnerabilityRisk +
        configurationRisk.overallRisk * weights.configurationRisk +
        patchRisk.overallRisk * weights.patchRisk +
        threatExposure.overallRisk * weights.threatExposure +
        businessImpact.overallRisk * weights.businessImpact
      );

      // Collect all risk factors
      const allRiskFactors = [
        ...vulnerabilityRisk.riskFactors,
        ...configurationRisk.riskFactors,
        ...patchRisk.riskFactors,
        ...threatExposure.riskFactors,
        ...businessImpact.riskFactors
      ];

      // Generate composite recommendations
      const recommendations = [
        ...vulnerabilityRisk.recommendations.slice(0, 3),
        ...configurationRisk.recommendations.slice(0, 2),
        ...patchRisk.recommendations.slice(0, 2)
      ];

      return {
        overallRisk: Math.round(compositeRisk),
        riskLevel: this.getRiskLevel(compositeRisk),
        components: {
          vulnerabilityRisk: vulnerabilityRisk.overallRisk,
          configurationRisk: configurationRisk.overallRisk,
          patchRisk: patchRisk.overallRisk,
          threatExposure: threatExposure.overallRisk,
          businessImpact: businessImpact.overallRisk
        },
        riskFactors: allRiskFactors,
        recommendations,
        calculatedAt: new Date(),
        model: 'system_composite'
      };

    } catch (error) {
      console.error('Error calculating system composite risk:', error);
      throw error;
    }
  }

  /**
   * Calculate patch risk
   */
  async calculatePatchRisk(system) {
    // Mock patch risk calculation
    const mockPatchData = {
      totalPatches: 45,
      installedPatches: 38,
      criticalPatches: 2,
      lastPatchDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    };

    const patchCompliance = (mockPatchData.installedPatches / mockPatchData.totalPatches) * 100;
    let riskScore = 100 - patchCompliance;

    // Increase risk for critical patches
    riskScore += mockPatchData.criticalPatches * 15;

    // Increase risk for old patch dates
    const daysSinceLastPatch = (Date.now() - mockPatchData.lastPatchDate.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceLastPatch > 30) riskScore += 20;

    riskScore = Math.min(100, Math.max(0, riskScore));

    const riskFactors = [];
    if (mockPatchData.criticalPatches > 0) riskFactors.push(`${mockPatchData.criticalPatches} critical patches pending`);
    if (daysSinceLastPatch > 30) riskFactors.push('No patches in 30+ days');

    return {
      overallRisk: Math.round(riskScore),
      patchCompliance: Math.round(patchCompliance),
      criticalPatches: mockPatchData.criticalPatches,
      daysSinceLastPatch: Math.round(daysSinceLastPatch),
      riskFactors,
      recommendations: mockPatchData.criticalPatches > 0 ? ['Install critical patches immediately'] : []
    };
  }

  /**
   * Calculate threat exposure
   */
  async calculateThreatExposure(system) {
    // Mock threat exposure calculation
    const exposureFactors = {
      publicFacing: 2,
      unencryptedServices: 1,
      weakAuthentication: 0,
      knownVulnerableServices: 3
    };

    let exposureScore = 0;
    exposureScore += exposureFactors.publicFacing * 20;
    exposureScore += exposureFactors.unencryptedServices * 15;
    exposureScore += exposureFactors.weakAuthentication * 25;
    exposureScore += exposureFactors.knownVulnerableServices * 10;

    exposureScore = Math.min(100, exposureScore);

    const riskFactors = [];
    if (exposureFactors.publicFacing > 0) riskFactors.push(`${exposureFactors.publicFacing} public-facing services`);
    if (exposureFactors.knownVulnerableServices > 0) riskFactors.push(`${exposureFactors.knownVulnerableServices} vulnerable services`);

    return {
      overallRisk: Math.round(exposureScore),
      exposureFactors,
      riskFactors,
      recommendations: exposureScore > 50 ? ['Reduce external attack surface'] : []
    };
  }

  /**
   * Calculate business impact risk
   */
  async calculateBusinessImpactRisk(system) {
    // Mock business impact calculation
    const impactFactors = {
      criticality: 'high',
      financialImpact: 'medium',
      userImpact: 'high',
      regulatoryImpact: 'low'
    };

    const impactScores = { 'critical': 100, 'high': 80, 'medium': 60, 'low': 40, 'minimal': 20 };
    
    const businessRisk = (
      impactScores[impactFactors.criticality] * 0.4 +
      impactScores[impactFactors.financialImpact] * 0.3 +
      impactScores[impactFactors.userImpact] * 0.2 +
      impactScores[impactFactors.regulatoryImpact] * 0.1
    );

    return {
      overallRisk: Math.round(businessRisk),
      impactFactors,
      riskFactors: businessRisk > 70 ? ['High business criticality'] : [],
      recommendations: []
    };
  }

  /**
   * Helper methods for risk calculations
   */
  getExploitabilityScore(pluginId) {
    // Mock exploitability scoring
    return Math.random() * 100; // 0-100
  }

  getAssetCriticalityScore(system) {
    const criticalityMap = { 'critical': 100, 'high': 80, 'medium': 60, 'low': 40 };
    return criticalityMap[system.criticality] || 50;
  }

  getThreatContextScore(pluginId) {
    // Mock threat context scoring
    return Math.random() * 100;
  }

  getPatchAgeScore(firstFound) {
    const daysSinceFound = (Date.now() - new Date(firstFound).getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceFound > 90) return 100;
    if (daysSinceFound > 30) return 70;
    if (daysSinceFound > 7) return 40;
    return 20;
  }

  getSeverityScore(severity) {
    const severityMap = { 'critical': 100, 'high': 80, 'medium': 60, 'low': 40 };
    return severityMap[severity] || 50;
  }

  getSecurityImpactScore(driftType) {
    const impactMap = { 'security': 100, 'configuration': 70, 'service': 50, 'patch': 80 };
    return impactMap[driftType] || 50;
  }

  getBusinessImpactScore(businessImpact) {
    const impactMap = { 'critical': 100, 'high': 80, 'medium': 60, 'low': 40 };
    return impactMap[businessImpact] || 50;
  }

  getDetectionTimeScore(detectedAt) {
    const hoursAgo = (Date.now() - new Date(detectedAt).getTime()) / (60 * 60 * 1000);
    if (hoursAgo > 168) return 100; // > 1 week
    if (hoursAgo > 24) return 70;   // > 1 day
    if (hoursAgo > 1) return 40;    // > 1 hour
    return 20;
  }

  getRemediationComplexityScore(driftType) {
    const complexityMap = { 'security': 80, 'configuration': 60, 'service': 70, 'patch': 40 };
    return complexityMap[driftType] || 50;
  }

  getRiskLevel(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Generate vulnerability recommendations
   */
  generateVulnerabilityRecommendations(vulnerabilityRisks) {
    const recommendations = [];
    const highRiskVulns = vulnerabilityRisks.filter(v => v.riskScore >= 70);
    
    if (highRiskVulns.length > 0) {
      recommendations.push(`Prioritize patching ${highRiskVulns.length} high-risk vulnerabilities`);
    }
    
    const criticalVulns = vulnerabilityRisks.filter(v => v.severity === 'Critical');
    if (criticalVulns.length > 0) {
      recommendations.push(`Address ${criticalVulns.length} critical vulnerabilities immediately`);
    }

    return recommendations;
  }

  /**
   * Generate drift recommendations
   */
  generateDriftRecommendations(driftRisks) {
    const recommendations = [];
    const criticalDrifts = driftRisks.filter(d => d.severity === 'critical');
    
    if (criticalDrifts.length > 0) {
      recommendations.push(`Resolve ${criticalDrifts.length} critical configuration drifts`);
    }

    const openDrifts = driftRisks.filter(d => d.status === 'open');
    if (openDrifts.length > 5) {
      recommendations.push('Implement automated configuration management');
    }

    return recommendations;
  }

  /**
   * Get risk scoring statistics
   */
  async getRiskScoringStats() {
    try {
      // Get system risk distribution
      const [riskDistribution] = await db.select({
        totalSystems: sql`COUNT(*)`,
        lowRisk: sql`COUNT(*) FILTER (WHERE overall_score < 40)`,
        mediumRisk: sql`COUNT(*) FILTER (WHERE overall_score >= 40 AND overall_score < 60)`,
        highRisk: sql`COUNT(*) FILTER (WHERE overall_score >= 60 AND overall_score < 80)`,
        criticalRisk: sql`COUNT(*) FILTER (WHERE overall_score >= 80)`,
        averageRisk: sql`AVG(overall_score)`
      })
      .from(systemSecurityPosture);

      return {
        ...riskDistribution,
        averageRisk: riskDistribution.averageRisk ? Math.round(riskDistribution.averageRisk * 100) / 100 : 0,
        modelsLoaded: this.riskModels.size,
        cacheSize: this.riskCache.size,
        threatIntelligenceLoaded: this.threatIntelligence.size
      };

    } catch (error) {
      console.error('Error getting risk scoring stats:', error);
      throw error;
    }
  }

  /**
   * Calculate enterprise aggregate risk
   */
  async calculateEnterpriseAggregateRisk(system, options = {}) {
    try {
      // Get individual system risk components
      const systemCompositeRisk = await this.calculateSystemCompositeRisk(system, options);

      // Mock cross-system correlations
      const crossSystemCorrelations = {
        sharedVulnerabilities: 15,
        commonMisconfigurations: 8,
        interconnectedSystems: 12,
        cascadingRiskPotential: 'high'
      };

      // Mock threat landscape assessment
      const threatLandscape = {
        activeThreatCampaigns: 3,
        industryTargeting: 'high',
        geopoliticalRisk: 'medium',
        emergingThreats: 5
      };

      // Mock compliance gaps
      const complianceGaps = {
        totalControls: 150,
        implementedControls: 128,
        gapCount: 22,
        criticalGaps: 3
      };

      // Mock business continuity assessment
      const businessContinuity = {
        rtoCompliance: 85,
        rpoCompliance: 90,
        backupStatus: 'good',
        drTestStatus: 'overdue'
      };

      const weights = this.riskModels.get('enterprise_aggregate').weights;

      // Calculate enterprise aggregate risk score
      const systemRiskScore = systemCompositeRisk.overallRisk * weights.systemRisks;
      const correlationRiskScore = this.calculateCorrelationRisk(crossSystemCorrelations) * weights.crossSystemCorrelations;
      const threatRiskScore = this.calculateThreatLandscapeRisk(threatLandscape) * weights.threatLandscape;
      const complianceRiskScore = this.calculateComplianceRisk(complianceGaps) * weights.complianceGaps;
      const continuityRiskScore = this.calculateContinuityRisk(businessContinuity) * weights.businessContinuity;

      const enterpriseRisk = systemRiskScore + correlationRiskScore + threatRiskScore + complianceRiskScore + continuityRiskScore;

      const riskFactors = [];
      const recommendations = [];

      // Add risk factors and recommendations based on components
      if (correlationRiskScore > 15) {
        riskFactors.push('High cross-system risk correlation');
        recommendations.push('Implement network segmentation');
      }
      if (threatRiskScore > 20) {
        riskFactors.push('Elevated threat landscape');
        recommendations.push('Enhance threat monitoring');
      }
      if (complianceRiskScore > 15) {
        riskFactors.push('Significant compliance gaps');
        recommendations.push('Address critical compliance gaps');
      }
      if (continuityRiskScore > 10) {
        riskFactors.push('Business continuity concerns');
        recommendations.push('Update disaster recovery plans');
      }

      return {
        overallRisk: Math.round(enterpriseRisk),
        riskLevel: this.getRiskLevel(enterpriseRisk),
        components: {
          systemRisk: Math.round(systemRiskScore),
          correlationRisk: Math.round(correlationRiskScore),
          threatRisk: Math.round(threatRiskScore),
          complianceRisk: Math.round(complianceRiskScore),
          continuityRisk: Math.round(continuityRiskScore)
        },
        riskFactors,
        recommendations,
        enterpriseContext: {
          crossSystemCorrelations,
          threatLandscape,
          complianceGaps,
          businessContinuity
        }
      };

    } catch (error) {
      console.error('Error calculating enterprise aggregate risk:', error);
      throw error;
    }
  }

  /**
   * Calculate correlation risk score
   */
  calculateCorrelationRisk(correlations) {
    const baseScore = correlations.sharedVulnerabilities * 2 + correlations.commonMisconfigurations * 1.5;
    const cascadingMultiplier = correlations.cascadingRiskPotential === 'high' ? 1.5 : 1.0;
    return Math.min(baseScore * cascadingMultiplier, 100);
  }

  /**
   * Calculate threat landscape risk score
   */
  calculateThreatLandscapeRisk(landscape) {
    const threatScore = landscape.activeThreatCampaigns * 10 + landscape.emergingThreats * 2;
    const industryMultiplier = landscape.industryTargeting === 'high' ? 1.3 : 1.0;
    return Math.min(threatScore * industryMultiplier, 100);
  }

  /**
   * Calculate compliance risk score
   */
  calculateComplianceRisk(gaps) {
    const gapPercentage = (gaps.gapCount / gaps.totalControls) * 100;
    const criticalMultiplier = gaps.criticalGaps > 0 ? 1.5 : 1.0;
    return Math.min(gapPercentage * criticalMultiplier, 100);
  }

  /**
   * Calculate business continuity risk score
   */
  calculateContinuityRisk(continuity) {
    const rtoScore = (100 - continuity.rtoCompliance) * 0.4;
    const rpoScore = (100 - continuity.rpoCompliance) * 0.3;
    const backupScore = continuity.backupStatus === 'good' ? 0 : 20;
    const drScore = continuity.drTestStatus === 'overdue' ? 15 : 0;
    return rtoScore + rpoScore + backupScore + drScore;
  }

  /**
   * Clear risk cache
   */
  clearCache() {
    this.riskCache.clear();
    console.log('🗑️ Risk scoring cache cleared');
  }
}

module.exports = new RiskScoringService();
