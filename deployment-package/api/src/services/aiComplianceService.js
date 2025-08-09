const aiAssistanceService = require('./aiAssistanceService');
const { db } = require('../db');
const { assets, vulnerabilities, controls, auditLogs } = require('../db/schema');
const { eq, and, desc, asc, sql, count, gte, lte, like, ilike, inArray, isNull, isNotNull, or } = require('drizzle-orm');

class AiComplianceService {

  // ==================== AUTOMATED COMPLIANCE ASSESSMENT ====================

  /**
   * Conduct automated compliance assessment
   */
  async conductComplianceAssessment(framework, scope, userId) {
    try {
      console.log('📋 Starting AI-powered compliance assessment for:', framework);

      // Get relevant controls for the framework
      const frameworkControls = await this.getFrameworkControls(framework);

      // Assess each control
      const controlAssessments = [];
      for (const control of frameworkControls) {
        const assessment = await this.assessControl(control, scope, userId);
        controlAssessments.push(assessment);
      }

      // Generate overall compliance score
      const complianceScore = this.calculateComplianceScore(controlAssessments);

      // Generate AI-powered compliance report
      const report = await this.generateComplianceReport({
        framework,
        scope,
        controlAssessments,
        complianceScore
      }, userId);

      // Generate remediation plan
      const remediationPlan = await this.generateRemediationPlan(controlAssessments, userId);

      return {
        assessmentId: `compliance_${Date.now()}`,
        framework,
        scope,
        complianceScore,
        controlAssessments,
        report,
        remediationPlan,
        conductedAt: new Date()
      };
    } catch (error) {
      console.error('Error conducting compliance assessment:', error);
      throw error;
    }
  }

  /**
   * Get framework controls
   */
  async getFrameworkControls(framework) {
    try {
      const frameworkControls = await db.select()
        .from(controls)
        .where(
          or(
            sql`${framework} = ANY(${controls.frameworks})`,
            sql`${controls.frameworks} = ARRAY[]::text[]`
          )
        )
        .orderBy(asc(controls.controlId));

      return frameworkControls;
    } catch (error) {
      console.error('Error getting framework controls:', error);
      throw error;
    }
  }

  /**
   * Assess individual control compliance
   */
  async assessControl(control, scope, userId) {
    try {
      // Gather evidence for the control
      const evidence = await this.gatherControlEvidence(control, scope);

      // Use AI to assess control implementation
      const aiAssessment = await this.getAiControlAssessment(control, evidence, userId);

      // Calculate control score
      const controlScore = this.calculateControlScore(evidence, aiAssessment);

      return {
        controlId: control.controlId,
        controlTitle: control.title,
        framework: control.frameworks,
        evidence,
        aiAssessment,
        score: controlScore,
        status: this.determineControlStatus(controlScore),
        assessedAt: new Date()
      };
    } catch (error) {
      console.error('Error assessing control:', error);
      throw error;
    }
  }

  /**
   * Gather evidence for control assessment
   */
  async gatherControlEvidence(control, scope) {
    try {
      const evidence = {
        assets: [],
        vulnerabilities: [],
        auditLogs: [],
        configurations: [],
        policies: []
      };

      // Gather asset evidence
      if (scope.assetIds && scope.assetIds.length > 0) {
        evidence.assets = await db.select()
          .from(assets)
          .where(inArray(assets.id, scope.assetIds))
          .limit(100);
      }

      // Gather vulnerability evidence
      const vulns = await db.select()
        .from(vulnerabilities)
        .where(
          and(
            scope.assetIds ? sql`${vulnerabilities.assetId} = ANY(${scope.assetIds})` : sql`true`,
            sql`${vulnerabilities.description} ILIKE ${`%${control.category}%`}`
          )
        )
        .limit(50);
      evidence.vulnerabilities = vulns;

      // Gather audit log evidence
      const logs = await db.select()
        .from(auditLogs)
        .where(
          and(
            gte(auditLogs.timestamp, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // Last 30 days
            or(
              sql`${auditLogs.action} ILIKE ${`%${control.category}%`}`,
              sql`${auditLogs.details}::text ILIKE ${`%${control.controlId}%`}`
            )
          )
        )
        .orderBy(desc(auditLogs.timestamp))
        .limit(20);
      evidence.auditLogs = logs;

      return evidence;
    } catch (error) {
      console.error('Error gathering control evidence:', error);
      throw error;
    }
  }

  /**
   * Get AI assessment of control implementation
   */
  async getAiControlAssessment(control, evidence, userId) {
    try {
      const requestData = {
        requestType: 'compliance_guidance',
        title: `Control Assessment: ${control.controlId}`,
        description: `Assess implementation of control ${control.controlId}: ${control.title}`,
        context: {
          control,
          evidence,
          assessmentType: 'control_implementation'
        },
        priority: 'medium'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error getting AI control assessment:', error);
      throw error;
    }
  }

  /**
   * Calculate control compliance score
   */
  calculateControlScore(evidence, aiAssessment) {
    let score = 0;

    // Base score from evidence availability
    if (evidence.assets.length > 0) score += 20;
    if (evidence.auditLogs.length > 0) score += 20;
    if (evidence.configurations.length > 0) score += 20;

    // Vulnerability impact on score
    const criticalVulns = evidence.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highVulns = evidence.vulnerabilities.filter(v => v.severity === 'high').length;
    
    score -= (criticalVulns * 15) + (highVulns * 10);

    // AI assessment impact (if available)
    if (aiAssessment && aiAssessment.confidence === 'high') {
      score += 40;
    } else if (aiAssessment && aiAssessment.confidence === 'medium') {
      score += 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine control status based on score
   */
  determineControlStatus(score) {
    if (score >= 90) return 'fully_implemented';
    if (score >= 70) return 'largely_implemented';
    if (score >= 50) return 'partially_implemented';
    if (score >= 30) return 'planned';
    return 'not_implemented';
  }

  /**
   * Calculate overall compliance score
   */
  calculateComplianceScore(controlAssessments) {
    if (controlAssessments.length === 0) return 0;

    const totalScore = controlAssessments.reduce((sum, assessment) => sum + assessment.score, 0);
    return Math.round(totalScore / controlAssessments.length);
  }

  /**
   * Generate compliance report using AI
   */
  async generateComplianceReport(assessmentData, userId) {
    try {
      const requestData = {
        requestType: 'documentation',
        title: `${assessmentData.framework} Compliance Report`,
        description: `Generate comprehensive compliance report for ${assessmentData.framework}`,
        context: {
          ...assessmentData,
          reportType: 'compliance_assessment'
        },
        priority: 'medium'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  /**
   * Generate remediation plan using AI
   */
  async generateRemediationPlan(controlAssessments, userId) {
    try {
      // Filter controls that need remediation
      const nonCompliantControls = controlAssessments.filter(
        assessment => assessment.score < 70
      );

      if (nonCompliantControls.length === 0) {
        return { message: 'No remediation required - all controls are compliant' };
      }

      const requestData = {
        requestType: 'compliance_guidance',
        title: 'Compliance Remediation Plan',
        description: 'Generate remediation plan for non-compliant controls',
        context: {
          nonCompliantControls,
          planType: 'remediation'
        },
        priority: 'high'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error generating remediation plan:', error);
      throw error;
    }
  }

  // ==================== CONTINUOUS COMPLIANCE MONITORING ====================

  /**
   * Monitor compliance drift
   */
  async monitorComplianceDrift(framework, baselineAssessmentId, userId) {
    try {
      console.log('📊 Monitoring compliance drift for:', framework);

      // Get baseline assessment
      const baseline = await this.getAssessmentById(baselineAssessmentId);
      if (!baseline) {
        throw new Error('Baseline assessment not found');
      }

      // Conduct current assessment
      const current = await this.conductComplianceAssessment(framework, baseline.scope, userId);

      // Compare assessments
      const drift = this.calculateComplianceDrift(baseline, current);

      // Generate drift analysis
      const analysis = await this.analyzeDrift(drift, userId);

      return {
        driftId: `drift_${Date.now()}`,
        framework,
        baseline: {
          assessmentId: baseline.assessmentId,
          score: baseline.complianceScore,
          date: baseline.conductedAt
        },
        current: {
          assessmentId: current.assessmentId,
          score: current.complianceScore,
          date: current.conductedAt
        },
        drift,
        analysis,
        monitoredAt: new Date()
      };
    } catch (error) {
      console.error('Error monitoring compliance drift:', error);
      throw error;
    }
  }

  /**
   * Calculate compliance drift between assessments
   */
  calculateComplianceDrift(baseline, current) {
    const drift = {
      overallScoreChange: current.complianceScore - baseline.complianceScore,
      controlChanges: [],
      newIssues: [],
      resolvedIssues: []
    };

    // Compare individual controls
    for (const currentControl of current.controlAssessments) {
      const baselineControl = baseline.controlAssessments.find(
        c => c.controlId === currentControl.controlId
      );

      if (baselineControl) {
        const scoreChange = currentControl.score - baselineControl.score;
        if (Math.abs(scoreChange) >= 5) { // Significant change threshold
          drift.controlChanges.push({
            controlId: currentControl.controlId,
            controlTitle: currentControl.controlTitle,
            baselineScore: baselineControl.score,
            currentScore: currentControl.score,
            change: scoreChange,
            trend: scoreChange > 0 ? 'improved' : 'degraded'
          });
        }
      }
    }

    return drift;
  }

  /**
   * Analyze compliance drift using AI
   */
  async analyzeDrift(drift, userId) {
    try {
      const requestData = {
        requestType: 'compliance_guidance',
        title: 'Compliance Drift Analysis',
        description: 'Analyze compliance drift and provide recommendations',
        context: {
          drift,
          analysisType: 'compliance_drift'
        },
        priority: 'medium'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error analyzing drift:', error);
      throw error;
    }
  }

  // ==================== AUTOMATED CONTROL TESTING ====================

  /**
   * Conduct automated control testing
   */
  async conductAutomatedControlTesting(controlId, testScope, userId) {
    try {
      console.log('🧪 Conducting automated control testing for:', controlId);

      // Get control details
      const [control] = await db.select()
        .from(controls)
        .where(eq(controls.controlId, controlId))
        .limit(1);

      if (!control) {
        throw new Error('Control not found');
      }

      // Generate test procedures using AI
      const testProcedures = await this.generateTestProcedures(control, testScope, userId);

      // Execute automated tests
      const testResults = await this.executeAutomatedTests(control, testProcedures, testScope);

      // Analyze test results
      const analysis = await this.analyzeTestResults(control, testResults, userId);

      return {
        testId: `test_${Date.now()}`,
        controlId,
        control,
        testProcedures,
        testResults,
        analysis,
        testedAt: new Date()
      };
    } catch (error) {
      console.error('Error conducting automated control testing:', error);
      throw error;
    }
  }

  /**
   * Generate test procedures using AI
   */
  async generateTestProcedures(control, testScope, userId) {
    try {
      const requestData = {
        requestType: 'compliance_guidance',
        title: `Test Procedures: ${control.controlId}`,
        description: `Generate automated test procedures for control ${control.controlId}`,
        context: {
          control,
          testScope,
          procedureType: 'automated_testing'
        },
        priority: 'medium'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error generating test procedures:', error);
      throw error;
    }
  }

  /**
   * Execute automated tests
   */
  async executeAutomatedTests(control, testProcedures, testScope) {
    try {
      const results = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        testDetails: []
      };

      // This would implement actual automated testing logic
      // For now, return mock results
      results.totalTests = 5;
      results.passedTests = 3;
      results.failedTests = 2;
      results.testDetails = [
        {
          testName: 'Configuration Check',
          status: 'passed',
          details: 'Control configuration is properly implemented'
        },
        {
          testName: 'Access Control Verification',
          status: 'failed',
          details: 'Excessive permissions detected on 2 assets'
        }
      ];

      return results;
    } catch (error) {
      console.error('Error executing automated tests:', error);
      throw error;
    }
  }

  /**
   * Analyze test results using AI
   */
  async analyzeTestResults(control, testResults, userId) {
    try {
      const requestData = {
        requestType: 'compliance_guidance',
        title: `Test Results Analysis: ${control.controlId}`,
        description: `Analyze automated test results for control ${control.controlId}`,
        context: {
          control,
          testResults,
          analysisType: 'test_results'
        },
        priority: 'medium'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error analyzing test results:', error);
      throw error;
    }
  }

  // ==================== COMPLIANCE INTELLIGENCE ====================

  /**
   * Generate compliance intelligence report
   */
  async generateComplianceIntelligence(frameworks, timeframe, userId) {
    try {
      console.log('🧠 Generating compliance intelligence for frameworks:', frameworks);

      // Gather compliance data across frameworks
      const intelligenceData = await this.gatherComplianceIntelligence(frameworks, timeframe);

      // Generate AI-powered intelligence report
      const intelligence = await this.generateIntelligenceReport(intelligenceData, userId);

      return {
        intelligenceId: `intel_${Date.now()}`,
        frameworks,
        timeframe,
        data: intelligenceData,
        intelligence,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating compliance intelligence:', error);
      throw error;
    }
  }

  /**
   * Gather compliance intelligence data
   */
  async gatherComplianceIntelligence(frameworks, timeframe) {
    try {
      const timeframeDuration = this.parseTimeframe(timeframe);
      const startTime = new Date(Date.now() - timeframeDuration);

      // This would gather comprehensive compliance data
      // For now, return mock intelligence data
      return {
        frameworks,
        timeframe,
        trends: {
          overallCompliance: 85,
          trendDirection: 'improving',
          keyIssues: ['access_control', 'data_encryption', 'audit_logging']
        },
        benchmarking: {
          industryAverage: 78,
          peerComparison: 'above_average'
        },
        riskAreas: [
          {
            area: 'Identity and Access Management',
            riskLevel: 'medium',
            affectedControls: 15
          }
        ]
      };
    } catch (error) {
      console.error('Error gathering compliance intelligence:', error);
      throw error;
    }
  }

  /**
   * Generate intelligence report using AI
   */
  async generateIntelligenceReport(intelligenceData, userId) {
    try {
      const requestData = {
        requestType: 'compliance_guidance',
        title: 'Compliance Intelligence Report',
        description: 'Generate comprehensive compliance intelligence and strategic recommendations',
        context: {
          intelligenceData,
          reportType: 'compliance_intelligence'
        },
        priority: 'medium'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error generating intelligence report:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get assessment by ID (mock implementation)
   */
  async getAssessmentById(assessmentId) {
    // This would retrieve stored assessment data
    // For now, return null to indicate not found
    return null;
  }

  /**
   * Parse timeframe string to milliseconds
   */
  parseTimeframe(timeframe) {
    const units = {
      'd': 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000,
      'm': 30 * 24 * 60 * 60 * 1000,
      'y': 365 * 24 * 60 * 60 * 1000
    };

    const match = timeframe.match(/^(\d+)([dwmy])$/);
    if (!match) return 30 * 24 * 60 * 60 * 1000; // Default to 30 days

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }
}

module.exports = new AiComplianceService();
