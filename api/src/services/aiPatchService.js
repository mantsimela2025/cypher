const { db } = require('../db');
const {
  patches,
  patchJobs,
  patchSchedules,
  patchAssets,
  patchVulnerabilities,
  vulnerabilities,
  assets,
  users,
  aiAssistanceRequests,
  aiModelConfigurations
} = require('../db/schema');
const { eq, and, gte, lte, like, desc, asc, sql, or, inArray, isNull, isNotNull } = require('drizzle-orm');
const aiAssistanceService = require('./aiAssistanceService');

class AiPatchService {
  
  // ==================== PATCH PRIORITIZATION AI ====================
  
  /**
   * Generate AI-powered patch prioritization recommendations
   */
  async generatePatchPriorities(patchIds = null, criteria = {}, userId) {
    try {
      console.log('🤖 Generating AI patch prioritization recommendations');

      // Get patches to analyze
      let query = db.select({
        id: patches.id,
        patchId: patches.patchId,
        title: patches.title,
        severity: patches.severity,
        type: patches.type,
        vendor: patches.vendor,
        status: patches.status,
        releaseDate: patches.releaseDate,
        businessImpact: patches.businessImpact,
        technicalComplexity: patches.technicalComplexity,
        estimatedDowntime: patches.estimatedDowntime,
        rebootRequired: patches.rebootRequired,
        cveIds: patches.cveIds,
        complianceFrameworks: patches.complianceFrameworks,
        affectedProducts: patches.affectedProducts,
        // Calculate affected asset count
        affectedAssetCount: sql`(
          SELECT COUNT(DISTINCT pa.asset_uuid) 
          FROM patch_assets pa 
          WHERE pa.patch_id = ${patches.id} 
          AND pa.is_applicable = true
        )`,
        // Calculate critical asset count
        criticalAssetCount: sql`(
          SELECT COUNT(DISTINCT pa.asset_uuid) 
          FROM patch_assets pa 
          JOIN assets a ON pa.asset_uuid = a.asset_uuid
          WHERE pa.patch_id = ${patches.id} 
          AND pa.is_applicable = true
          AND a.criticality = 'critical'
        )`
      }).from(patches);

      // Filter by specific patches if provided
      if (patchIds && patchIds.length > 0) {
        query = query.where(inArray(patches.id, patchIds));
      } else {
        // Only analyze available or approved patches
        query = query.where(inArray(patches.status, ['available', 'approved']));
      }

      // Apply additional criteria filters
      if (criteria.severity) {
        query = query.where(inArray(patches.severity, criteria.severity));
      }
      if (criteria.vendor) {
        query = query.where(inArray(patches.vendor, criteria.vendor));
      }

      const patchData = await query.limit(100); // Limit for AI processing

      // Get vulnerability data for patches
      const vulnerabilityData = await this._getVulnerabilityContext(patchData.map(p => p.id));
      
      // Get asset criticality data
      const assetContext = await this._getAssetContext(patchData.map(p => p.id));

      const requestData = {
        requestType: 'patch_prioritization',
        title: 'Patch Prioritization Analysis',
        description: `Analyze and prioritize ${patchData.length} patches for deployment`,
        context: {
          patches: patchData,
          vulnerabilities: vulnerabilityData,
          assets: assetContext,
          criteria,
          analysisDate: new Date()
        },
        priority: 'high'
      };

      const request = await aiAssistanceService.createAssistanceRequest(requestData, userId);
      const result = await aiAssistanceService.processAssistanceRequest(request.id);

      // Parse and structure the AI response
      const prioritizedPatches = this._parsePrioritizationResponse(result.response, patchData);

      return {
        request: result,
        prioritization: prioritizedPatches,
        metadata: {
          totalPatches: patchData.length,
          analysisDate: new Date(),
          criteria
        }
      };
    } catch (error) {
      console.error('Error generating patch priorities:', error);
      throw error;
    }
  }

  /**
   * Generate risk assessment for patch deployment
   */
  async generatePatchRiskAssessment(patchId, targetAssets = null, userId) {
    try {
      console.log('🎯 Generating patch risk assessment for:', patchId);

      // Get patch details
      const patch = await this._getPatchDetails(patchId);
      if (!patch) {
        throw new Error('Patch not found');
      }

      // Get affected assets
      const assets = targetAssets || await this._getPatchAssets(patchId);
      
      // Get vulnerability context
      const vulnerabilities = await this._getPatchVulnerabilities(patchId);
      
      // Get deployment history for similar patches
      const deploymentHistory = await this._getDeploymentHistory(patch.vendor, patch.type);

      const requestData = {
        requestType: 'patch_risk_assessment',
        title: `Risk Assessment: ${patch.title}`,
        description: `Conduct comprehensive risk assessment for patch deployment`,
        context: {
          patch,
          assets,
          vulnerabilities,
          deploymentHistory,
          riskFactors: this._calculateRiskFactors(patch, assets, vulnerabilities)
        },
        priority: patch.severity === 'critical' ? 'critical' : 'high'
      };

      const request = await aiAssistanceService.createAssistanceRequest(requestData, userId);
      const result = await aiAssistanceService.processAssistanceRequest(request.id);

      return {
        request: result,
        riskAssessment: this._parseRiskAssessment(result.response),
        metadata: {
          patchId,
          assessmentDate: new Date(),
          assetCount: assets.length
        }
      };
    } catch (error) {
      console.error('Error generating patch risk assessment:', error);
      throw error;
    }
  }

  /**
   * Generate deployment strategy recommendations
   */
  async generateDeploymentStrategy(patchIds, deploymentOptions = {}, userId) {
    try {
      console.log('📋 Generating deployment strategy for patches:', patchIds);

      // Get patch details
      const patches = await Promise.all(patchIds.map(id => this._getPatchDetails(id)));
      
      // Get asset inventory
      const affectedAssets = await this._getAffectedAssetsForPatches(patchIds);
      
      // Get current maintenance windows
      const maintenanceWindows = await this._getMaintenanceWindows();
      
      // Get dependency relationships
      const dependencies = await this._getPatchDependencies(patchIds);

      const requestData = {
        requestType: 'deployment_strategy',
        title: 'Patch Deployment Strategy',
        description: `Generate optimal deployment strategy for ${patchIds.length} patches`,
        context: {
          patches,
          affectedAssets,
          maintenanceWindows,
          dependencies,
          deploymentOptions,
          constraints: {
            maxDowntime: deploymentOptions.maxDowntime || 240, // minutes
            allowedWindows: deploymentOptions.allowedWindows || ['weekend', 'maintenance'],
            riskTolerance: deploymentOptions.riskTolerance || 'medium',
            rollbackRequirement: deploymentOptions.rollbackRequirement || true
          }
        },
        priority: 'medium'
      };

      const request = await aiAssistanceService.createAssistanceRequest(requestData, userId);
      const result = await aiAssistanceService.processAssistanceRequest(request.id);

      return {
        request: result,
        strategy: this._parseDeploymentStrategy(result.response),
        metadata: {
          patchCount: patchIds.length,
          assetCount: affectedAssets.length,
          strategyDate: new Date()
        }
      };
    } catch (error) {
      console.error('Error generating deployment strategy:', error);
      throw error;
    }
  }

  /**
   * Generate maintenance window recommendations
   */
  async generateMaintenanceWindowRecommendations(patchIds, constraints = {}, userId) {
    try {
      console.log('⏰ Generating maintenance window recommendations');

      const patches = await Promise.all(patchIds.map(id => this._getPatchDetails(id)));
      const affectedAssets = await this._getAffectedAssetsForPatches(patchIds);
      const existingSchedules = await this._getExistingSchedules();

      // Calculate estimated deployment time
      const estimatedDuration = this._calculateDeploymentDuration(patches, affectedAssets);

      const requestData = {
        requestType: 'maintenance_window_planning',
        title: 'Maintenance Window Planning',
        description: `Recommend optimal maintenance windows for patch deployment`,
        context: {
          patches,
          affectedAssets,
          existingSchedules,
          estimatedDuration,
          constraints: {
            businessHours: constraints.businessHours || { start: 8, end: 17 },
            allowedDays: constraints.allowedDays || ['saturday', 'sunday'],
            maxWindowDuration: constraints.maxWindowDuration || 480, // minutes
            bufferTime: constraints.bufferTime || 60, // minutes
            timezone: constraints.timezone || 'UTC'
          }
        },
        priority: 'medium'
      };

      const request = await aiAssistanceService.createAssistanceRequest(requestData, userId);
      const result = await aiAssistanceService.processAssistanceRequest(request.id);

      return {
        request: result,
        recommendations: this._parseMaintenanceWindowRecommendations(result.response),
        metadata: {
          estimatedDuration,
          affectedAssets: affectedAssets.length,
          recommendationDate: new Date()
        }
      };
    } catch (error) {
      console.error('Error generating maintenance window recommendations:', error);
      throw error;
    }
  }

  /**
   * Generate rollback recommendations
   */
  async generateRollbackRecommendations(jobId, userId) {
    try {
      console.log('🔄 Generating rollback recommendations for job:', jobId);

      // Get job details and results
      const job = await this._getJobDetails(jobId);
      const jobTargets = await this._getJobTargets(jobId);
      const jobLogs = await this._getJobLogs(jobId);

      const requestData = {
        requestType: 'rollback_analysis',
        title: `Rollback Analysis: ${job.jobName}`,
        description: `Analyze deployment results and provide rollback recommendations`,
        context: {
          job,
          targets: jobTargets,
          logs: jobLogs.slice(-100), // Last 100 log entries
          failureMetrics: this._calculateFailureMetrics(jobTargets),
          rollbackComplexity: this._assessRollbackComplexity(job, jobTargets)
        },
        priority: 'high'
      };

      const request = await aiAssistanceService.createAssistanceRequest(requestData, userId);
      const result = await aiAssistanceService.processAssistanceRequest(request.id);

      return {
        request: result,
        rollbackRecommendations: this._parseRollbackRecommendations(result.response),
        metadata: {
          jobId,
          analysisDate: new Date(),
          failureRate: this._calculateFailureRate(jobTargets)
        }
      };
    } catch (error) {
      console.error('Error generating rollback recommendations:', error);
      throw error;
    }
  }

  /**
   * Generate compliance impact analysis
   */
  async generateComplianceImpactAnalysis(patchIds, frameworks = [], userId) {
    try {
      console.log('📊 Generating compliance impact analysis');

      const patches = await Promise.all(patchIds.map(id => this._getPatchDetails(id)));
      const complianceContext = await this._getComplianceContext(frameworks);

      const requestData = {
        requestType: 'compliance_impact_analysis',
        title: 'Patch Compliance Impact Analysis',
        description: `Analyze compliance implications of patch deployment`,
        context: {
          patches,
          frameworks,
          complianceContext,
          analysisScope: {
            includeSecurityControls: true,
            includeAuditRequirements: true,
            includeReportingNeeds: true
          }
        },
        priority: 'medium'
      };

      const request = await aiAssistanceService.createAssistanceRequest(requestData, userId);
      const result = await aiAssistanceService.processAssistanceRequest(request.id);

      return {
        request: result,
        complianceImpact: this._parseComplianceImpact(result.response),
        metadata: {
          frameworks,
          patchCount: patchIds.length,
          analysisDate: new Date()
        }
      };
    } catch (error) {
      console.error('Error generating compliance impact analysis:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  async _getPatchDetails(patchId) {
    const [patch] = await db.select()
      .from(patches)
      .where(eq(patches.id, patchId))
      .limit(1);
    return patch;
  }

  async _getPatchAssets(patchId) {
    return await db.select({
      assetUuid: patchAssets.assetUuid,
      hostname: assets.hostname,
      ipv4: assets.ipv4,
      operatingSystem: assets.operatingSystem,
      criticality: assets.criticality,
      isApplicable: patchAssets.isApplicable,
      isInstalled: patchAssets.isInstalled
    })
    .from(patchAssets)
    .leftJoin(assets, eq(patchAssets.assetUuid, assets.assetUuid))
    .where(eq(patchAssets.patchId, patchId));
  }

  async _getPatchVulnerabilities(patchId) {
    return await db.select({
      id: vulnerabilities.id,
      cveId: vulnerabilities.cveId,
      severity: vulnerabilities.severity,
      baseScore: vulnerabilities.baseScore,
      description: vulnerabilities.description,
      effectiveness: patchVulnerabilities.effectiveness
    })
    .from(patchVulnerabilities)
    .leftJoin(vulnerabilities, eq(patchVulnerabilities.vulnerabilityId, vulnerabilities.id))
    .where(eq(patchVulnerabilities.patchId, patchId));
  }

  async _getVulnerabilityContext(patchIds) {
    return await db.select({
      patchId: patchVulnerabilities.patchId,
      cveId: vulnerabilities.cveId,
      severity: vulnerabilities.severity,
      baseScore: vulnerabilities.baseScore,
      exploitabilityScore: vulnerabilities.exploitabilityScore,
      impactScore: vulnerabilities.impactScore
    })
    .from(patchVulnerabilities)
    .leftJoin(vulnerabilities, eq(patchVulnerabilities.vulnerabilityId, vulnerabilities.id))
    .where(inArray(patchVulnerabilities.patchId, patchIds));
  }

  async _getAssetContext(patchIds) {
    return await db.select({
      patchId: patchAssets.patchId,
      criticality: assets.criticality,
      environment: assets.environment,
      businessFunction: assets.businessFunction,
      count: sql`COUNT(*)`
    })
    .from(patchAssets)
    .leftJoin(assets, eq(patchAssets.assetUuid, assets.assetUuid))
    .where(and(
      inArray(patchAssets.patchId, patchIds),
      eq(patchAssets.isApplicable, true)
    ))
    .groupBy(patchAssets.patchId, assets.criticality, assets.environment, assets.businessFunction);
  }

  async _getDeploymentHistory(vendor, type) {
    return await db.select({
      patchId: patches.patchId,
      totalTargets: patchJobs.totalTargets,
      successfulTargets: patchJobs.successfulTargets,
      failedTargets: patchJobs.failedTargets,
      actualDuration: patchJobs.actualDuration,
      completedTime: patchJobs.completedTime
    })
    .from(patchJobs)
    .leftJoin(patches, eq(patchJobs.patchId, patches.id))
    .where(and(
      eq(patches.vendor, vendor),
      eq(patches.type, type),
      eq(patchJobs.status, 'completed')
    ))
    .orderBy(desc(patchJobs.completedTime))
    .limit(20);
  }

  async _getAffectedAssetsForPatches(patchIds) {
    return await db.select({
      assetUuid: patchAssets.assetUuid,
      hostname: assets.hostname,
      criticality: assets.criticality,
      environment: assets.environment,
      patchCount: sql`COUNT(DISTINCT ${patchAssets.patchId})`
    })
    .from(patchAssets)
    .leftJoin(assets, eq(patchAssets.assetUuid, assets.assetUuid))
    .where(and(
      inArray(patchAssets.patchId, patchIds),
      eq(patchAssets.isApplicable, true)
    ))
    .groupBy(patchAssets.assetUuid, assets.hostname, assets.criticality, assets.environment);
  }

  async _getMaintenanceWindows() {
    return await db.select()
      .from(patchSchedules)
      .where(and(
        eq(patchSchedules.status, 'active'),
        isNotNull(patchSchedules.maintenanceWindowType)
      ))
      .orderBy(patchSchedules.nextRunTime);
  }

  async _getPatchDependencies(patchIds) {
    // This would get patch dependencies - simplified for now
    return [];
  }

  async _getExistingSchedules() {
    return await db.select({
      name: patchSchedules.name,
      nextRunTime: patchSchedules.nextRunTime,
      maintenanceWindowStart: patchSchedules.maintenanceWindowStart,
      maintenanceWindowEnd: patchSchedules.maintenanceWindowEnd,
      estimatedDuration: sql`60` // Placeholder
    })
    .from(patchSchedules)
    .where(eq(patchSchedules.status, 'active'))
    .orderBy(patchSchedules.nextRunTime)
    .limit(10);
  }

  async _getJobDetails(jobId) {
    const [job] = await db.select()
      .from(patchJobs)
      .where(eq(patchJobs.id, jobId))
      .limit(1);
    return job;
  }

  async _getJobTargets(jobId) {
    return await db.select()
      .from(patchJobTargets)
      .where(eq(patchJobTargets.jobId, jobId));
  }

  async _getJobLogs(jobId) {
    return await db.select()
      .from(patchJobLogs)
      .where(eq(patchJobLogs.jobId, jobId))
      .orderBy(desc(patchJobLogs.timestamp))
      .limit(100);
  }

  async _getComplianceContext(frameworks) {
    // This would get compliance framework context - simplified for now
    return {
      frameworks,
      applicableControls: [],
      auditRequirements: []
    };
  }

  _calculateRiskFactors(patch, assets, vulnerabilities) {
    return {
      severityScore: this._mapSeverityToScore(patch.severity),
      assetCriticalityScore: this._calculateAssetCriticalityScore(assets),
      vulnerabilityScore: this._calculateVulnerabilityScore(vulnerabilities),
      complexityScore: this._mapComplexityToScore(patch.technicalComplexity),
      businessImpactScore: this._mapBusinessImpactToScore(patch.businessImpact)
    };
  }

  _calculateDeploymentDuration(patches, assets) {
    // Simplified calculation - 5 minutes per asset per patch + 30 minutes overhead
    return (patches.length * assets.length * 5) + 30;
  }

  _calculateFailureMetrics(jobTargets) {
    const total = jobTargets.length;
    const failed = jobTargets.filter(t => t.status === 'failed').length;
    const successful = jobTargets.filter(t => t.status === 'completed').length;
    
    return {
      totalTargets: total,
      failedTargets: failed,
      successfulTargets: successful,
      failureRate: total > 0 ? (failed / total) * 100 : 0,
      successRate: total > 0 ? (successful / total) * 100 : 0
    };
  }

  _assessRollbackComplexity(job, targets) {
    // Simplified assessment
    const factors = {
      rebootRequired: job.rebootRequired || false,
      multipleAssets: targets.length > 10,
      criticalAssets: targets.some(t => t.criticality === 'critical'),
      crossPlatform: new Set(targets.map(t => t.operatingSystem)).size > 1
    };

    const complexity = Object.values(factors).filter(Boolean).length;
    return complexity <= 1 ? 'low' : complexity <= 2 ? 'medium' : 'high';
  }

  _calculateFailureRate(jobTargets) {
    const total = jobTargets.length;
    const failed = jobTargets.filter(t => t.status === 'failed').length;
    return total > 0 ? (failed / total) * 100 : 0;
  }

  _mapSeverityToScore(severity) {
    const scores = { critical: 10, high: 8, medium: 5, low: 2, informational: 1 };
    return scores[severity] || 5;
  }

  _calculateAssetCriticalityScore(assets) {
    if (!assets.length) return 5;
    const scores = { critical: 10, high: 8, medium: 5, low: 2 };
    const totalScore = assets.reduce((sum, asset) => sum + (scores[asset.criticality] || 5), 0);
    return Math.round(totalScore / assets.length);
  }

  _calculateVulnerabilityScore(vulnerabilities) {
    if (!vulnerabilities.length) return 0;
    const totalScore = vulnerabilities.reduce((sum, vuln) => sum + (vuln.baseScore || 0), 0);
    return Math.round(totalScore / vulnerabilities.length);
  }

  _mapComplexityToScore(complexity) {
    const scores = { high: 8, medium: 5, low: 2 };
    return scores[complexity] || 5;
  }

  _mapBusinessImpactToScore(impact) {
    const scores = { critical: 10, high: 8, medium: 5, low: 2 };
    return scores[impact] || 5;
  }

  // Response parsing methods - these would parse structured AI responses
  _parsePrioritizationResponse(response, patches) {
    // This would parse the AI response and return structured prioritization
    return patches.map((patch, index) => ({
      ...patch,
      aiPriority: Math.max(1, 10 - index), // Simplified scoring
      aiRecommendation: 'AI recommendation would be parsed here',
      riskScore: Math.random() * 10 // Placeholder
    }));
  }

  _parseRiskAssessment(response) {
    return {
      overallRisk: 'medium',
      riskFactors: [],
      mitigations: [],
      recommendation: response.substring(0, 500) + '...'
    };
  }

  _parseDeploymentStrategy(response) {
    return {
      strategy: 'phased',
      phases: [],
      timeline: 'AI-generated timeline would be here',
      recommendations: response.substring(0, 500) + '...'
    };
  }

  _parseMaintenanceWindowRecommendations(response) {
    return {
      recommendedWindows: [],
      reasoning: response.substring(0, 500) + '...',
      alternatives: []
    };
  }

  _parseRollbackRecommendations(response) {
    return {
      shouldRollback: false,
      rollbackStrategy: 'selective',
      affectedAssets: [],
      reasoning: response.substring(0, 500) + '...'
    };
  }

  _parseComplianceImpact(response) {
    return {
      overallImpact: 'low',
      affectedControls: [],
      requiredActions: [],
      documentation: response.substring(0, 500) + '...'
    };
  }
}

module.exports = new AiPatchService();