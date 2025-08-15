const { db } = require('../../db');
const { 
  systems, 
  systemSecurityPosture,
  systemConfigurationDrift,
  vulnerabilities,
  assetVulnerabilities,
  controls,
  assets,
  systemAssets,
  complianceControls
} = require('../../db/schema');
const { eq, and, sql, desc, gte, lte, count, avg } = require('drizzle-orm');

/**
 * Security Posture Assessment Service
 * Real-time security posture assessment with continuous monitoring of system configurations,
 * patch levels, and security controls
 */
class SecurityPostureService {
  constructor() {
    this.isInitialized = false;
    this.assessmentQueue = [];
    this.postureCache = new Map();
    this.assessmentInterval = null;
  }

  /**
   * Initialize security posture service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Start continuous posture monitoring
      this.startContinuousMonitoring();
      
      this.isInitialized = true;
      console.log('✅ Security posture assessment service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize security posture service:', error);
      throw error;
    }
  }

  /**
   * Start continuous posture monitoring
   */
  startContinuousMonitoring() {
    // Assess security posture every 30 minutes
    this.assessmentInterval = setInterval(async () => {
      await this.performScheduledAssessments();
    }, 30 * 60 * 1000);

    console.log('📊 Started continuous security posture monitoring');
  }

  /**
   * Assess security posture for a specific system
   */
  async assessSystemSecurityPosture(systemId, options = {}) {
    try {
      console.log(`🔍 Assessing security posture for system ${systemId}`);

      const { forceRefresh = false, includeRecommendations = true } = options;

      // Check cache first
      if (!forceRefresh && this.postureCache.has(systemId)) {
        const cached = this.postureCache.get(systemId);
        if (Date.now() - cached.timestamp < 15 * 60 * 1000) { // 15 minutes cache
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

      // Perform comprehensive assessment
      const assessment = await this.performComprehensiveAssessment(system);

      // Calculate overall posture score
      const postureScore = this.calculateOverallPostureScore(assessment);

      // Generate recommendations if requested
      const recommendations = includeRecommendations 
        ? await this.generateSecurityRecommendations(system, assessment)
        : [];

      // Store assessment results
      await this.storePostureAssessment(systemId, postureScore, assessment, recommendations);

      // Cache results
      this.postureCache.set(systemId, {
        data: { ...postureScore, recommendations, assessment },
        timestamp: Date.now()
      });

      console.log(`✅ Security posture assessment completed for system ${systemId}: ${postureScore.postureStatus}`);

      return {
        systemId,
        systemName: system.name,
        ...postureScore,
        recommendations,
        assessment,
        lastAssessment: new Date()
      };

    } catch (error) {
      console.error(`Error assessing security posture for system ${systemId}:`, error);
      throw error;
    }
  }

  /**
   * Perform comprehensive security assessment
   */
  async performComprehensiveAssessment(system) {
    try {
      const assessment = {
        vulnerabilityAssessment: await this.assessVulnerabilities(system.id),
        configurationAssessment: await this.assessConfiguration(system.id),
        patchAssessment: await this.assessPatchStatus(system.id),
        complianceAssessment: await this.assessCompliance(system.id),
        controlAssessment: await this.assessSecurityControls(system.id),
        threatAssessment: await this.assessThreatExposure(system.id),
        businessImpactAssessment: await this.assessBusinessImpact(system.id)
      };

      return assessment;

    } catch (error) {
      console.error('Error performing comprehensive assessment:', error);
      throw error;
    }
  }

  /**
   * Assess vulnerabilities for system
   */
  async assessVulnerabilities(systemId) {
    try {
      // Get system assets
      const systemAssetIds = await db.select({ assetId: systemAssets.assetId })
        .from(systemAssets)
        .where(eq(systemAssets.systemId, systemId));

      if (systemAssetIds.length === 0) {
        return {
          score: 100, // No assets, no vulnerabilities
          totalVulnerabilities: 0,
          criticalVulnerabilities: 0,
          highVulnerabilities: 0,
          mediumVulnerabilities: 0,
          lowVulnerabilities: 0,
          averageCvssScore: 0,
          oldestVulnerability: null,
          riskFactors: []
        };
      }

      const assetIds = systemAssetIds.map(a => a.assetId);

      // Get vulnerability statistics
      const [vulnStats] = await db.select({
        total: sql`COUNT(*)`,
        critical: sql`COUNT(*) FILTER (WHERE ${vulnerabilities.severityName} = 'Critical')`,
        high: sql`COUNT(*) FILTER (WHERE ${vulnerabilities.severityName} = 'High')`,
        medium: sql`COUNT(*) FILTER (WHERE ${vulnerabilities.severityName} = 'Medium')`,
        low: sql`COUNT(*) FILTER (WHERE ${vulnerabilities.severityName} = 'Low')`,
        avgCvss: sql`AVG(${vulnerabilities.cvss3BaseScore})`,
        oldestDate: sql`MIN(${vulnerabilities.firstFound})`
      })
      .from(vulnerabilities)
      .innerJoin(assetVulnerabilities, eq(vulnerabilities.id, assetVulnerabilities.vulnerabilityId))
      .innerJoin(assets, eq(assetVulnerabilities.assetUuid, assets.assetUuid))
      .where(sql`${assets.id} = ANY(${assetIds})`);

      // Calculate vulnerability score (0-100, higher is better)
      const totalVulns = vulnStats.total || 0;
      const criticalVulns = vulnStats.critical || 0;
      const highVulns = vulnStats.high || 0;

      let score = 100;
      if (totalVulns > 0) {
        // Penalize based on severity
        score -= (criticalVulns * 20) + (highVulns * 10) + ((vulnStats.medium || 0) * 5) + ((vulnStats.low || 0) * 1);
        score = Math.max(0, score);
      }

      const riskFactors = [];
      if (criticalVulns > 0) riskFactors.push(`${criticalVulns} critical vulnerabilities`);
      if (highVulns > 5) riskFactors.push(`${highVulns} high severity vulnerabilities`);
      if (vulnStats.oldestDate && new Date() - new Date(vulnStats.oldestDate) > 90 * 24 * 60 * 60 * 1000) {
        riskFactors.push('Vulnerabilities older than 90 days');
      }

      return {
        score: Math.round(score),
        totalVulnerabilities: totalVulns,
        criticalVulnerabilities: criticalVulns,
        highVulnerabilities: highVulns,
        mediumVulnerabilities: vulnStats.medium || 0,
        lowVulnerabilities: vulnStats.low || 0,
        averageCvssScore: vulnStats.avgCvss ? Math.round(vulnStats.avgCvss * 10) / 10 : 0,
        oldestVulnerability: vulnStats.oldestDate,
        riskFactors
      };

    } catch (error) {
      console.error('Error assessing vulnerabilities:', error);
      return { score: 0, error: error.message };
    }
  }

  /**
   * Assess configuration status
   */
  async assessConfiguration(systemId) {
    try {
      // Get configuration drift issues
      const [driftStats] = await db.select({
        total: sql`COUNT(*)`,
        critical: sql`COUNT(*) FILTER (WHERE severity = 'critical')`,
        high: sql`COUNT(*) FILTER (WHERE severity = 'high')`,
        open: sql`COUNT(*) FILTER (WHERE status = 'open')`,
        recent: sql`COUNT(*) FILTER (WHERE detected_at >= NOW() - INTERVAL '7 days')`
      })
      .from(systemConfigurationDrift)
      .where(eq(systemConfigurationDrift.systemId, systemId));

      const totalDrift = driftStats.total || 0;
      const criticalDrift = driftStats.critical || 0;
      const highDrift = driftStats.high || 0;
      const openDrift = driftStats.open || 0;

      // Calculate configuration score
      let score = 100;
      if (totalDrift > 0) {
        score -= (criticalDrift * 25) + (highDrift * 15) + (openDrift * 5);
        score = Math.max(0, score);
      }

      const riskFactors = [];
      if (criticalDrift > 0) riskFactors.push(`${criticalDrift} critical configuration issues`);
      if (openDrift > 10) riskFactors.push(`${openDrift} unresolved configuration drifts`);
      if (driftStats.recent > 5) riskFactors.push('Recent configuration changes detected');

      return {
        score: Math.round(score),
        totalDriftIssues: totalDrift,
        criticalDriftIssues: criticalDrift,
        highDriftIssues: highDrift,
        openDriftIssues: openDrift,
        recentDriftIssues: driftStats.recent || 0,
        riskFactors
      };

    } catch (error) {
      console.error('Error assessing configuration:', error);
      return { score: 50, error: error.message }; // Default middle score on error
    }
  }

  /**
   * Assess patch status
   */
  async assessPatchStatus(systemId) {
    try {
      // Mock patch assessment - in production would integrate with patch management systems
      const mockPatchData = {
        totalPatches: 45,
        installedPatches: 38,
        pendingPatches: 7,
        criticalPatches: 2,
        lastPatchDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
      };

      const patchCompliance = (mockPatchData.installedPatches / mockPatchData.totalPatches) * 100;
      let score = patchCompliance;

      // Penalize for critical patches
      if (mockPatchData.criticalPatches > 0) {
        score -= mockPatchData.criticalPatches * 15;
      }

      // Penalize for old patch dates
      const daysSinceLastPatch = (Date.now() - mockPatchData.lastPatchDate.getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceLastPatch > 30) {
        score -= 20;
      }

      score = Math.max(0, Math.min(100, score));

      const riskFactors = [];
      if (mockPatchData.criticalPatches > 0) riskFactors.push(`${mockPatchData.criticalPatches} critical patches pending`);
      if (daysSinceLastPatch > 30) riskFactors.push('No patches installed in 30+ days');
      if (patchCompliance < 80) riskFactors.push('Low patch compliance rate');

      return {
        score: Math.round(score),
        patchCompliance: Math.round(patchCompliance),
        totalPatches: mockPatchData.totalPatches,
        installedPatches: mockPatchData.installedPatches,
        pendingPatches: mockPatchData.pendingPatches,
        criticalPatches: mockPatchData.criticalPatches,
        lastPatchDate: mockPatchData.lastPatchDate,
        daysSinceLastPatch: Math.round(daysSinceLastPatch),
        riskFactors
      };

    } catch (error) {
      console.error('Error assessing patch status:', error);
      return { score: 50, error: error.message };
    }
  }

  /**
   * Assess compliance status
   */
  async assessCompliance(systemId) {
    try {
      // Get compliance control statistics
      const [complianceStats] = await db.select({
        total: sql`COUNT(*)`,
        implemented: sql`COUNT(*) FILTER (WHERE implementation_status = 'fully_implemented')`,
        partiallyImplemented: sql`COUNT(*) FILTER (WHERE implementation_status = 'partially_implemented')`,
        notImplemented: sql`COUNT(*) FILTER (WHERE implementation_status = 'not_implemented')`,
        assessed: sql`COUNT(*) FILTER (WHERE assessment_status = 'assessed')`,
        overdue: sql`COUNT(*) FILTER (WHERE assessment_status = 'overdue')`
      })
      .from(complianceControls);

      const totalControls = complianceStats.total || 1; // Avoid division by zero
      const implementedControls = complianceStats.implemented || 0;
      const partiallyImplemented = complianceStats.partiallyImplemented || 0;

      // Calculate compliance score
      const implementationScore = ((implementedControls * 1.0) + (partiallyImplemented * 0.5)) / totalControls * 100;
      const assessmentScore = ((complianceStats.assessed || 0) / totalControls) * 100;
      
      const score = (implementationScore * 0.7) + (assessmentScore * 0.3);

      const riskFactors = [];
      if (implementationScore < 70) riskFactors.push('Low control implementation rate');
      if (complianceStats.overdue > 0) riskFactors.push(`${complianceStats.overdue} overdue assessments`);
      if (complianceStats.notImplemented > totalControls * 0.3) riskFactors.push('High number of unimplemented controls');

      return {
        score: Math.round(score),
        implementationScore: Math.round(implementationScore),
        assessmentScore: Math.round(assessmentScore),
        totalControls,
        implementedControls,
        partiallyImplementedControls: partiallyImplemented,
        notImplementedControls: complianceStats.notImplemented || 0,
        assessedControls: complianceStats.assessed || 0,
        overdueAssessments: complianceStats.overdue || 0,
        riskFactors
      };

    } catch (error) {
      console.error('Error assessing compliance:', error);
      return { score: 50, error: error.message };
    }
  }

  /**
   * Assess security controls effectiveness
   */
  async assessSecurityControls(systemId) {
    try {
      // Get security control statistics
      const [controlStats] = await db.select({
        total: sql`COUNT(*)`,
        implemented: sql`COUNT(*) FILTER (WHERE status = 'implemented')`,
        effective: sql`COUNT(*) FILTER (WHERE status = 'implemented' AND effectiveness_score >= 80)`,
        failing: sql`COUNT(*) FILTER (WHERE status = 'implemented' AND effectiveness_score < 50)`
      })
      .from(controls);

      const totalControls = controlStats.total || 1;
      const implementedControls = controlStats.implemented || 0;
      const effectiveControls = controlStats.effective || 0;

      const implementationRate = (implementedControls / totalControls) * 100;
      const effectivenessRate = implementedControls > 0 ? (effectiveControls / implementedControls) * 100 : 0;

      const score = (implementationRate * 0.6) + (effectivenessRate * 0.4);

      const riskFactors = [];
      if (implementationRate < 80) riskFactors.push('Low security control implementation');
      if (effectivenessRate < 70) riskFactors.push('Poor control effectiveness');
      if (controlStats.failing > 0) riskFactors.push(`${controlStats.failing} failing security controls`);

      return {
        score: Math.round(score),
        implementationRate: Math.round(implementationRate),
        effectivenessRate: Math.round(effectivenessRate),
        totalControls,
        implementedControls,
        effectiveControls,
        failingControls: controlStats.failing || 0,
        riskFactors
      };

    } catch (error) {
      console.error('Error assessing security controls:', error);
      return { score: 50, error: error.message };
    }
  }

  /**
   * Assess threat exposure
   */
  async assessThreatExposure(systemId) {
    try {
      // Mock threat exposure assessment
      const mockThreatData = {
        exposureScore: 75,
        externalExposure: 'medium',
        attackSurfaceSize: 12,
        criticalServices: 3,
        publicFacingAssets: 2,
        unencryptedConnections: 1,
        weakAuthentication: 0
      };

      let score = mockThreatData.exposureScore;

      const riskFactors = [];
      if (mockThreatData.publicFacingAssets > 0) {
        riskFactors.push(`${mockThreatData.publicFacingAssets} public-facing assets`);
        score -= mockThreatData.publicFacingAssets * 10;
      }
      if (mockThreatData.unencryptedConnections > 0) {
        riskFactors.push(`${mockThreatData.unencryptedConnections} unencrypted connections`);
        score -= mockThreatData.unencryptedConnections * 15;
      }
      if (mockThreatData.weakAuthentication > 0) {
        riskFactors.push(`${mockThreatData.weakAuthentication} weak authentication mechanisms`);
        score -= mockThreatData.weakAuthentication * 20;
      }

      score = Math.max(0, Math.min(100, score));

      return {
        score: Math.round(score),
        externalExposure: mockThreatData.externalExposure,
        attackSurfaceSize: mockThreatData.attackSurfaceSize,
        criticalServices: mockThreatData.criticalServices,
        publicFacingAssets: mockThreatData.publicFacingAssets,
        unencryptedConnections: mockThreatData.unencryptedConnections,
        weakAuthentication: mockThreatData.weakAuthentication,
        riskFactors
      };

    } catch (error) {
      console.error('Error assessing threat exposure:', error);
      return { score: 50, error: error.message };
    }
  }

  /**
   * Assess business impact
   */
  async assessBusinessImpact(systemId) {
    try {
      // Mock business impact assessment
      const mockBusinessData = {
        criticality: 'high',
        financialImpact: 'high',
        operationalImpact: 'medium',
        reputationalImpact: 'medium',
        regulatoryImpact: 'low',
        userImpact: 'high'
      };

      // Convert impact levels to scores
      const impactScores = {
        'critical': 100,
        'high': 80,
        'medium': 60,
        'low': 40,
        'minimal': 20
      };

      const businessImpactScore = (
        impactScores[mockBusinessData.financialImpact] * 0.3 +
        impactScores[mockBusinessData.operationalImpact] * 0.25 +
        impactScores[mockBusinessData.reputationalImpact] * 0.2 +
        impactScores[mockBusinessData.regulatoryImpact] * 0.15 +
        impactScores[mockBusinessData.userImpact] * 0.1
      );

      return {
        score: Math.round(businessImpactScore),
        criticality: mockBusinessData.criticality,
        financialImpact: mockBusinessData.financialImpact,
        operationalImpact: mockBusinessData.operationalImpact,
        reputationalImpact: mockBusinessData.reputationalImpact,
        regulatoryImpact: mockBusinessData.regulatoryImpact,
        userImpact: mockBusinessData.userImpact,
        riskFactors: []
      };

    } catch (error) {
      console.error('Error assessing business impact:', error);
      return { score: 50, error: error.message };
    }
  }

  /**
   * Calculate overall posture score
   */
  calculateOverallPostureScore(assessment) {
    try {
      // Weight different assessment components
      const weights = {
        vulnerability: 0.25,
        configuration: 0.20,
        patch: 0.15,
        compliance: 0.15,
        controls: 0.15,
        threat: 0.10
      };

      const overallScore = (
        (assessment.vulnerabilityAssessment.score * weights.vulnerability) +
        (assessment.configurationAssessment.score * weights.configuration) +
        (assessment.patchAssessment.score * weights.patch) +
        (assessment.complianceAssessment.score * weights.compliance) +
        (assessment.controlAssessment.score * weights.controls) +
        (assessment.threatAssessment.score * weights.threat)
      );

      // Determine posture status
      let postureStatus;
      if (overallScore >= 90) postureStatus = 'excellent';
      else if (overallScore >= 80) postureStatus = 'good';
      else if (overallScore >= 70) postureStatus = 'fair';
      else if (overallScore >= 50) postureStatus = 'poor';
      else postureStatus = 'critical';

      // Collect all risk factors
      const allRiskFactors = [
        ...assessment.vulnerabilityAssessment.riskFactors,
        ...assessment.configurationAssessment.riskFactors,
        ...assessment.patchAssessment.riskFactors,
        ...assessment.complianceAssessment.riskFactors,
        ...assessment.controlAssessment.riskFactors,
        ...assessment.threatAssessment.riskFactors
      ];

      return {
        overallScore: Math.round(overallScore),
        postureStatus,
        vulnerabilityScore: assessment.vulnerabilityAssessment.score,
        configurationScore: assessment.configurationAssessment.score,
        patchScore: assessment.patchAssessment.score,
        complianceScore: assessment.complianceAssessment.score,
        controlEffectiveness: assessment.controlAssessment.score,
        threatExposure: 100 - assessment.threatAssessment.score, // Invert for exposure
        businessImpact: assessment.businessImpactAssessment.score,
        riskFactors: allRiskFactors
      };

    } catch (error) {
      console.error('Error calculating overall posture score:', error);
      throw error;
    }
  }

  /**
   * Generate security recommendations
   */
  async generateSecurityRecommendations(system, assessment) {
    try {
      const recommendations = [];

      // Vulnerability recommendations
      if (assessment.vulnerabilityAssessment.criticalVulnerabilities > 0) {
        recommendations.push({
          priority: 'critical',
          category: 'vulnerability',
          title: 'Address Critical Vulnerabilities',
          description: `System has ${assessment.vulnerabilityAssessment.criticalVulnerabilities} critical vulnerabilities that require immediate attention.`,
          action: 'Patch or mitigate critical vulnerabilities within 24 hours',
          impact: 'high'
        });
      }

      // Configuration recommendations
      if (assessment.configurationAssessment.criticalDriftIssues > 0) {
        recommendations.push({
          priority: 'high',
          category: 'configuration',
          title: 'Fix Configuration Drift',
          description: `${assessment.configurationAssessment.criticalDriftIssues} critical configuration issues detected.`,
          action: 'Review and remediate configuration drift issues',
          impact: 'medium'
        });
      }

      // Patch recommendations
      if (assessment.patchAssessment.criticalPatches > 0) {
        recommendations.push({
          priority: 'high',
          category: 'patching',
          title: 'Install Critical Patches',
          description: `${assessment.patchAssessment.criticalPatches} critical patches are pending installation.`,
          action: 'Schedule and install critical patches during next maintenance window',
          impact: 'high'
        });
      }

      // Compliance recommendations
      if (assessment.complianceAssessment.implementationScore < 70) {
        recommendations.push({
          priority: 'medium',
          category: 'compliance',
          title: 'Improve Compliance Posture',
          description: `Control implementation rate is ${assessment.complianceAssessment.implementationScore}%, below recommended 70%.`,
          action: 'Implement missing security controls and update compliance documentation',
          impact: 'medium'
        });
      }

      // Control effectiveness recommendations
      if (assessment.controlAssessment.failingControls > 0) {
        recommendations.push({
          priority: 'medium',
          category: 'controls',
          title: 'Fix Failing Security Controls',
          description: `${assessment.controlAssessment.failingControls} security controls are not functioning effectively.`,
          action: 'Review and repair failing security controls',
          impact: 'medium'
        });
      }

      return recommendations;

    } catch (error) {
      console.error('Error generating security recommendations:', error);
      return [];
    }
  }

  /**
   * Store posture assessment results
   */
  async storePostureAssessment(systemId, postureScore, assessment, recommendations) {
    try {
      // Check if assessment already exists
      const [existingAssessment] = await db.select()
        .from(systemSecurityPosture)
        .where(eq(systemSecurityPosture.systemId, systemId))
        .limit(1);

      const assessmentData = {
        systemId,
        overallScore: postureScore.overallScore,
        postureStatus: postureScore.postureStatus,
        vulnerabilityScore: postureScore.vulnerabilityScore,
        configurationScore: postureScore.configurationScore,
        patchScore: postureScore.patchScore,
        complianceScore: postureScore.complianceScore,
        controlEffectiveness: postureScore.controlEffectiveness,
        threatExposure: postureScore.threatExposure,
        businessImpact: postureScore.businessImpact,
        riskFactors: JSON.stringify(postureScore.riskFactors),
        recommendations: JSON.stringify(recommendations),
        lastAssessment: new Date(),
        nextAssessment: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
        assessedBy: 'system',
        updatedAt: new Date()
      };

      if (existingAssessment) {
        // Update existing assessment
        await db.update(systemSecurityPosture)
          .set(assessmentData)
          .where(eq(systemSecurityPosture.systemId, systemId));
      } else {
        // Create new assessment
        await db.insert(systemSecurityPosture)
          .values({
            ...assessmentData,
            createdAt: new Date()
          });
      }

      console.log(`💾 Stored security posture assessment for system ${systemId}`);

    } catch (error) {
      console.error('Error storing posture assessment:', error);
      throw error;
    }
  }

  /**
   * Get security posture for system
   */
  async getSystemSecurityPosture(systemId) {
    try {
      const [posture] = await db.select()
        .from(systemSecurityPosture)
        .where(eq(systemSecurityPosture.systemId, systemId))
        .limit(1);

      if (!posture) {
        // Perform assessment if none exists
        return await this.assessSystemSecurityPosture(systemId);
      }

      // Parse JSON fields
      posture.riskFactors = JSON.parse(posture.riskFactors || '[]');
      posture.recommendations = JSON.parse(posture.recommendations || '[]');

      return posture;

    } catch (error) {
      console.error(`Error getting security posture for system ${systemId}:`, error);
      throw error;
    }
  }

  /**
   * Get security posture for all systems
   */
  async getAllSystemsSecurityPosture(filters = {}) {
    try {
      let query = db.select({
        systemId: systemSecurityPosture.systemId,
        systemName: systems.name,
        overallScore: systemSecurityPosture.overallScore,
        postureStatus: systemSecurityPosture.postureStatus,
        lastAssessment: systemSecurityPosture.lastAssessment,
        nextAssessment: systemSecurityPosture.nextAssessment
      })
      .from(systemSecurityPosture)
      .innerJoin(systems, eq(systemSecurityPosture.systemId, systems.id));

      if (filters.postureStatus) {
        query = query.where(eq(systemSecurityPosture.postureStatus, filters.postureStatus));
      }

      if (filters.minScore) {
        query = query.where(gte(systemSecurityPosture.overallScore, filters.minScore));
      }

      if (filters.maxScore) {
        query = query.where(lte(systemSecurityPosture.overallScore, filters.maxScore));
      }

      const results = await query.orderBy(desc(systemSecurityPosture.overallScore));

      return results;

    } catch (error) {
      console.error('Error getting all systems security posture:', error);
      throw error;
    }
  }

  /**
   * Perform scheduled assessments
   */
  async performScheduledAssessments() {
    try {
      // Get systems that need assessment
      const systemsNeedingAssessment = await db.select({ systemId: systems.id })
        .from(systems)
        .leftJoin(systemSecurityPosture, eq(systems.id, systemSecurityPosture.systemId))
        .where(
          sql`${systemSecurityPosture.nextAssessment} IS NULL OR ${systemSecurityPosture.nextAssessment} <= NOW()`
        )
        .limit(10); // Process 10 systems at a time

      console.log(`📊 Found ${systemsNeedingAssessment.length} systems needing security posture assessment`);

      for (const system of systemsNeedingAssessment) {
        try {
          await this.assessSystemSecurityPosture(system.systemId, { forceRefresh: true });
        } catch (error) {
          console.error(`Error assessing system ${system.systemId}:`, error);
        }
      }

    } catch (error) {
      console.error('Error performing scheduled assessments:', error);
    }
  }

  /**
   * Get security posture statistics
   */
  async getSecurityPostureStats() {
    try {
      const [stats] = await db.select({
        totalSystems: sql`COUNT(*)`,
        excellentSystems: sql`COUNT(*) FILTER (WHERE posture_status = 'excellent')`,
        goodSystems: sql`COUNT(*) FILTER (WHERE posture_status = 'good')`,
        fairSystems: sql`COUNT(*) FILTER (WHERE posture_status = 'fair')`,
        poorSystems: sql`COUNT(*) FILTER (WHERE posture_status = 'poor')`,
        criticalSystems: sql`COUNT(*) FILTER (WHERE posture_status = 'critical')`,
        averageScore: sql`AVG(overall_score)`,
        recentAssessments: sql`COUNT(*) FILTER (WHERE last_assessment >= NOW() - INTERVAL '24 hours')`
      })
      .from(systemSecurityPosture);

      return {
        ...stats,
        averageScore: stats.averageScore ? Math.round(stats.averageScore * 100) / 100 : 0,
        cacheSize: this.postureCache.size,
        queueSize: this.assessmentQueue.length
      };

    } catch (error) {
      console.error('Error getting security posture stats:', error);
      throw error;
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.assessmentInterval) {
      clearInterval(this.assessmentInterval);
      this.assessmentInterval = null;
      console.log('⏹️ Stopped security posture monitoring');
    }
  }
}

module.exports = new SecurityPostureService();
