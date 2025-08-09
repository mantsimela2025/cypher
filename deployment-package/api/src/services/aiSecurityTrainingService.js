const aiAssistanceService = require('./aiAssistanceService');
const { db } = require('../db');
const { users, vulnerabilities, siemEvents } = require('../db/schema');
const { eq, and, desc, asc, sql, count, gte, lte, like, ilike, inArray, isNull, isNotNull, or } = require('drizzle-orm');

class AiSecurityTrainingService {

  // ==================== PERSONALIZED TRAINING GENERATION ====================

  /**
   * Generate personalized security training
   */
  async generatePersonalizedTraining(userId, trainingType, skillLevel = 'intermediate') {
    try {
      console.log('🎓 Generating personalized security training for user:', userId);

      // Get user profile and history
      const userProfile = await this.getUserSecurityProfile(userId);

      // Analyze user's security incidents and vulnerabilities
      const securityContext = await this.analyzeUserSecurityContext(userId);

      // Generate customized training content
      const trainingContent = await this.generateTrainingContent(
        trainingType,
        skillLevel,
        userProfile,
        securityContext,
        userId
      );

      // Create interactive exercises
      const exercises = await this.generateInteractiveExercises(
        trainingType,
        skillLevel,
        securityContext,
        userId
      );

      // Generate assessment questions
      const assessment = await this.generateAssessmentQuestions(
        trainingType,
        skillLevel,
        userId
      );

      return {
        trainingId: `training_${Date.now()}`,
        userId,
        trainingType,
        skillLevel,
        userProfile,
        content: trainingContent,
        exercises,
        assessment,
        estimatedDuration: this.estimateTrainingDuration(trainingContent, exercises),
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error generating personalized training:', error);
      throw error;
    }
  }

  /**
   * Get user security profile
   */
  async getUserSecurityProfile(userId) {
    try {
      // Get user details
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Analyze user's role and permissions for security context
      const profile = {
        userId: user.id,
        role: user.role,
        department: user.department || 'unknown',
        securityClearance: user.securityClearance || 'unclassified',
        lastTraining: user.lastSecurityTraining,
        riskLevel: this.assessUserRiskLevel(user)
      };

      return profile;
    } catch (error) {
      console.error('Error getting user security profile:', error);
      throw error;
    }
  }

  /**
   * Analyze user's security context
   */
  async analyzeUserSecurityContext(userId) {
    try {
      // Get user's recent security events
      const recentEvents = await db.select()
        .from(siemEvents)
        .where(
          and(
            eq(siemEvents.assignedTo, userId),
            gte(siemEvents.timestamp, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
          )
        )
        .orderBy(desc(siemEvents.timestamp))
        .limit(50);

      // Analyze event patterns
      const eventTypes = {};
      const severityDistribution = {};

      recentEvents.forEach(event => {
        eventTypes[event.eventType] = (eventTypes[event.eventType] || 0) + 1;
        severityDistribution[event.severity] = (severityDistribution[event.severity] || 0) + 1;
      });

      // Get user's vulnerability exposure
      const vulnerabilityExposure = await this.getUserVulnerabilityExposure(userId);

      return {
        recentEventCount: recentEvents.length,
        topEventTypes: Object.entries(eventTypes)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5),
        severityDistribution,
        vulnerabilityExposure,
        riskAreas: this.identifyUserRiskAreas(recentEvents, vulnerabilityExposure)
      };
    } catch (error) {
      console.error('Error analyzing user security context:', error);
      throw error;
    }
  }

  /**
   * Get user's vulnerability exposure
   */
  async getUserVulnerabilityExposure(userId) {
    try {
      // This would analyze vulnerabilities on assets the user manages
      // For now, return mock data
      return {
        totalVulnerabilities: 15,
        criticalVulnerabilities: 2,
        highVulnerabilities: 5,
        commonVulnerabilityTypes: ['sql_injection', 'xss', 'weak_authentication']
      };
    } catch (error) {
      console.error('Error getting user vulnerability exposure:', error);
      return {};
    }
  }

  /**
   * Generate training content using AI
   */
  async generateTrainingContent(trainingType, skillLevel, userProfile, securityContext, userId) {
    try {
      const requestData = {
        requestType: 'training_content',
        title: `${trainingType} Security Training - ${skillLevel} Level`,
        description: `Generate comprehensive security training content for ${trainingType}`,
        context: {
          trainingType,
          skillLevel,
          userProfile,
          securityContext,
          contentType: 'comprehensive_training',
          audience: 'government_personnel',
          format: 'interactive_modules'
        },
        priority: 'medium'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error generating training content:', error);
      throw error;
    }
  }

  /**
   * Generate interactive exercises
   */
  async generateInteractiveExercises(trainingType, skillLevel, securityContext, userId) {
    try {
      const requestData = {
        requestType: 'training_content',
        title: `Interactive ${trainingType} Exercises`,
        description: `Generate hands-on exercises and scenarios for ${trainingType} training`,
        context: {
          trainingType,
          skillLevel,
          securityContext,
          exerciseType: 'hands_on_scenarios',
          includeSimulations: true,
          realWorldExamples: true
        },
        priority: 'medium'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error generating interactive exercises:', error);
      throw error;
    }
  }

  /**
   * Generate assessment questions
   */
  async generateAssessmentQuestions(trainingType, skillLevel, userId) {
    try {
      const requestData = {
        requestType: 'training_content',
        title: `${trainingType} Assessment Questions`,
        description: `Generate assessment questions to test knowledge of ${trainingType}`,
        context: {
          trainingType,
          skillLevel,
          assessmentType: 'comprehensive_evaluation',
          questionTypes: ['multiple_choice', 'scenario_based', 'practical'],
          difficultyLevels: ['basic', 'intermediate', 'advanced']
        },
        priority: 'medium'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error generating assessment questions:', error);
      throw error;
    }
  }

  // ==================== INCIDENT-BASED TRAINING ====================

  /**
   * Generate training from security incidents
   */
  async generateIncidentBasedTraining(incidentId, userId) {
    try {
      console.log('📚 Generating incident-based training for incident:', incidentId);

      // Get incident details (mock for now)
      const incident = await this.getIncidentDetails(incidentId);

      // Generate lessons learned content
      const lessonsLearned = await this.generateLessonsLearned(incident, userId);

      // Create prevention training
      const preventionTraining = await this.generatePreventionTraining(incident, userId);

      // Generate response procedures
      const responseProcedures = await this.generateResponseProcedures(incident, userId);

      return {
        trainingId: `incident_training_${Date.now()}`,
        incidentId,
        incident,
        lessonsLearned,
        preventionTraining,
        responseProcedures,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error generating incident-based training:', error);
      throw error;
    }
  }

  /**
   * Generate lessons learned from incident
   */
  async generateLessonsLearned(incident, userId) {
    try {
      const requestData = {
        requestType: 'training_content',
        title: 'Security Incident Lessons Learned',
        description: 'Generate lessons learned content from security incident',
        context: {
          incident,
          contentType: 'lessons_learned',
          includeRootCause: true,
          includeTimeline: true,
          includeImpactAnalysis: true
        },
        priority: 'high'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error generating lessons learned:', error);
      throw error;
    }
  }

  /**
   * Generate prevention training
   */
  async generatePreventionTraining(incident, userId) {
    try {
      const requestData = {
        requestType: 'training_content',
        title: 'Incident Prevention Training',
        description: 'Generate training content to prevent similar incidents',
        context: {
          incident,
          contentType: 'prevention_training',
          includeWarningSignals: true,
          includeBestPractices: true,
          includeToolsAndTechniques: true
        },
        priority: 'high'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error generating prevention training:', error);
      throw error;
    }
  }

  /**
   * Generate response procedures
   */
  async generateResponseProcedures(incident, userId) {
    try {
      const requestData = {
        requestType: 'incident_response',
        title: 'Incident Response Procedures',
        description: 'Generate response procedures based on incident analysis',
        context: {
          incident,
          procedureType: 'response_training',
          includeStepByStep: true,
          includeDecisionTrees: true,
          includeEscalationPaths: true
        },
        priority: 'high'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error generating response procedures:', error);
      throw error;
    }
  }

  // ==================== ADAPTIVE LEARNING ====================

  /**
   * Adapt training based on user performance
   */
  async adaptTrainingContent(trainingId, userPerformance, userId) {
    try {
      console.log('🔄 Adapting training content based on performance');

      // Analyze performance patterns
      const performanceAnalysis = this.analyzeUserPerformance(userPerformance);

      // Generate adapted content
      const adaptedContent = await this.generateAdaptedContent(
        trainingId,
        performanceAnalysis,
        userId
      );

      // Create remedial exercises if needed
      const remedialExercises = await this.generateRemedialExercises(
        performanceAnalysis,
        userId
      );

      return {
        adaptationId: `adapt_${Date.now()}`,
        trainingId,
        performanceAnalysis,
        adaptedContent,
        remedialExercises,
        adaptedAt: new Date()
      };
    } catch (error) {
      console.error('Error adapting training content:', error);
      throw error;
    }
  }

  /**
   * Analyze user performance
   */
  analyzeUserPerformance(userPerformance) {
    const analysis = {
      overallScore: 0,
      weakAreas: [],
      strongAreas: [],
      recommendedFocus: [],
      difficultyAdjustment: 'maintain'
    };

    // Calculate overall score
    const scores = userPerformance.assessmentResults || [];
    if (scores.length > 0) {
      analysis.overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    // Identify weak and strong areas
    if (userPerformance.topicScores) {
      Object.entries(userPerformance.topicScores).forEach(([topic, score]) => {
        if (score < 70) {
          analysis.weakAreas.push(topic);
        } else if (score > 90) {
          analysis.strongAreas.push(topic);
        }
      });
    }

    // Determine difficulty adjustment
    if (analysis.overallScore < 60) {
      analysis.difficultyAdjustment = 'decrease';
    } else if (analysis.overallScore > 90) {
      analysis.difficultyAdjustment = 'increase';
    }

    analysis.recommendedFocus = analysis.weakAreas.slice(0, 3); // Top 3 weak areas

    return analysis;
  }

  /**
   * Generate adapted content
   */
  async generateAdaptedContent(trainingId, performanceAnalysis, userId) {
    try {
      const requestData = {
        requestType: 'training_content',
        title: 'Adaptive Training Content',
        description: 'Generate adapted training content based on user performance',
        context: {
          trainingId,
          performanceAnalysis,
          adaptationType: 'performance_based',
          focusAreas: performanceAnalysis.weakAreas,
          difficultyLevel: performanceAnalysis.difficultyAdjustment
        },
        priority: 'medium'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error generating adapted content:', error);
      throw error;
    }
  }

  /**
   * Generate remedial exercises
   */
  async generateRemedialExercises(performanceAnalysis, userId) {
    try {
      if (performanceAnalysis.weakAreas.length === 0) {
        return { message: 'No remedial exercises needed - performance is satisfactory' };
      }

      const requestData = {
        requestType: 'training_content',
        title: 'Remedial Security Exercises',
        description: 'Generate remedial exercises for weak performance areas',
        context: {
          weakAreas: performanceAnalysis.weakAreas,
          exerciseType: 'remedial_practice',
          includeExplanations: true,
          includeExamples: true,
          difficultyProgression: true
        },
        priority: 'medium'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error generating remedial exercises:', error);
      throw error;
    }
  }

  // ==================== SECURITY AWARENESS CAMPAIGNS ====================

  /**
   * Generate security awareness campaign
   */
  async generateSecurityAwarenessCampaign(campaignType, targetAudience, duration, userId) {
    try {
      console.log('📢 Generating security awareness campaign:', campaignType);

      // Generate campaign strategy
      const strategy = await this.generateCampaignStrategy(
        campaignType,
        targetAudience,
        duration,
        userId
      );

      // Create campaign materials
      const materials = await this.generateCampaignMaterials(
        campaignType,
        targetAudience,
        strategy,
        userId
      );

      // Generate measurement plan
      const measurementPlan = await this.generateMeasurementPlan(
        campaignType,
        strategy,
        userId
      );

      return {
        campaignId: `campaign_${Date.now()}`,
        campaignType,
        targetAudience,
        duration,
        strategy,
        materials,
        measurementPlan,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error generating security awareness campaign:', error);
      throw error;
    }
  }

  /**
   * Generate campaign strategy
   */
  async generateCampaignStrategy(campaignType, targetAudience, duration, userId) {
    try {
      const requestData = {
        requestType: 'training_content',
        title: `${campaignType} Awareness Campaign Strategy`,
        description: 'Generate comprehensive security awareness campaign strategy',
        context: {
          campaignType,
          targetAudience,
          duration,
          strategyType: 'awareness_campaign',
          includeTimeline: true,
          includeDeliverables: true,
          includeMetrics: true
        },
        priority: 'medium'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error generating campaign strategy:', error);
      throw error;
    }
  }

  /**
   * Generate campaign materials
   */
  async generateCampaignMaterials(campaignType, targetAudience, strategy, userId) {
    try {
      const requestData = {
        requestType: 'training_content',
        title: `${campaignType} Campaign Materials`,
        description: 'Generate security awareness campaign materials and content',
        context: {
          campaignType,
          targetAudience,
          strategy,
          materialTypes: ['posters', 'emails', 'presentations', 'videos', 'quizzes'],
          governmentCompliant: true,
          accessibilityCompliant: true
        },
        priority: 'medium'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error generating campaign materials:', error);
      throw error;
    }
  }

  /**
   * Generate measurement plan
   */
  async generateMeasurementPlan(campaignType, strategy, userId) {
    try {
      const requestData = {
        requestType: 'training_content',
        title: 'Campaign Measurement Plan',
        description: 'Generate measurement and evaluation plan for awareness campaign',
        context: {
          campaignType,
          strategy,
          measurementType: 'campaign_effectiveness',
          includeKPIs: true,
          includeBaselines: true,
          includeReporting: true
        },
        priority: 'medium'
      };

      return await aiAssistanceService.createAssistanceRequest(requestData, userId);
    } catch (error) {
      console.error('Error generating measurement plan:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Assess user risk level
   */
  assessUserRiskLevel(user) {
    // Simple risk assessment based on role and clearance
    const riskFactors = {
      admin: 3,
      security_analyst: 2,
      user: 1
    };

    const clearanceFactors = {
      secret: 3,
      confidential: 2,
      cui: 1,
      unclassified: 0
    };

    const roleRisk = riskFactors[user.role] || 1;
    const clearanceRisk = clearanceFactors[user.securityClearance] || 0;

    const totalRisk = roleRisk + clearanceRisk;

    if (totalRisk >= 5) return 'high';
    if (totalRisk >= 3) return 'medium';
    return 'low';
  }

  /**
   * Identify user risk areas
   */
  identifyUserRiskAreas(recentEvents, vulnerabilityExposure) {
    const riskAreas = [];

    // Analyze event patterns for risk areas
    const eventTypes = {};
    recentEvents.forEach(event => {
      eventTypes[event.eventType] = (eventTypes[event.eventType] || 0) + 1;
    });

    // High frequency event types indicate risk areas
    Object.entries(eventTypes).forEach(([eventType, count]) => {
      if (count > 5) {
        riskAreas.push({
          area: eventType,
          frequency: count,
          type: 'behavioral'
        });
      }
    });

    // Add vulnerability-based risk areas
    if (vulnerabilityExposure.commonVulnerabilityTypes) {
      vulnerabilityExposure.commonVulnerabilityTypes.forEach(vulnType => {
        riskAreas.push({
          area: vulnType,
          type: 'technical'
        });
      });
    }

    return riskAreas;
  }

  /**
   * Estimate training duration
   */
  estimateTrainingDuration(trainingContent, exercises) {
    // Simple estimation based on content length and exercises
    let duration = 30; // Base 30 minutes

    // Add time based on content (mock calculation)
    if (trainingContent && trainingContent.response) {
      const contentLength = trainingContent.response.length;
      duration += Math.ceil(contentLength / 1000) * 5; // 5 minutes per 1000 characters
    }

    // Add time for exercises
    if (exercises && exercises.response) {
      duration += 20; // 20 minutes for exercises
    }

    return Math.min(duration, 120); // Cap at 2 hours
  }

  /**
   * Get incident details (mock implementation)
   */
  async getIncidentDetails(incidentId) {
    // This would retrieve actual incident data
    return {
      id: incidentId,
      type: 'malware_infection',
      severity: 'high',
      description: 'Malware detected on workstation',
      timeline: [],
      impact: 'medium',
      rootCause: 'phishing_email'
    };
  }
}

module.exports = new AiSecurityTrainingService();
