const aiAssistanceService = require('../services/aiAssistanceService');
const Joi = require('joi');

class AiAssistanceController {

  // ==================== AI ASSISTANCE REQUEST OPERATIONS ====================

  /**
   * Create AI assistance request
   */
  async createAssistanceRequest(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        requestType: Joi.string().valid(
          'threat_analysis',
          'incident_response',
          'compliance_guidance',
          'policy_generation',
          'risk_assessment',
          'vulnerability_analysis',
          'forensic_analysis',
          'training_content',
          'documentation',
          'code_review',
          'configuration_review',
          'threat_hunting',
          'malware_analysis',
          'network_analysis',
          'log_analysis'
        ).required(),
        title: Joi.string().required().max(255).trim(),
        description: Joi.string().required().trim(),
        context: Joi.object().default({}),
        priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
        relatedEntityType: Joi.string().max(50),
        relatedEntityId: Joi.number().integer(),
        classificationLevel: Joi.string().valid('unclassified', 'cui', 'confidential', 'secret').default('unclassified'),
        sensitiveData: Joi.boolean().default(false),
        tags: Joi.array().items(Joi.string()).default([])
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const newRequest = await aiAssistanceService.createAssistanceRequest(value, req.user.id);

      res.status(201).json({
        message: 'AI assistance request created successfully',
        data: newRequest
      });

    } catch (error) {
      console.error('Error creating AI assistance request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all AI assistance requests
   */
  async getAllAssistanceRequests(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        requestType: Joi.string().valid(
          'threat_analysis',
          'incident_response',
          'compliance_guidance',
          'policy_generation',
          'risk_assessment',
          'vulnerability_analysis',
          'forensic_analysis',
          'training_content',
          'documentation',
          'code_review',
          'configuration_review',
          'threat_hunting',
          'malware_analysis',
          'network_analysis',
          'log_analysis'
        ),
        status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'cancelled', 'requires_review', 'approved', 'rejected'),
        priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
        userId: Joi.number().integer(),
        search: Joi.string().max(100),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title', 'priority', 'status').default('createdAt'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const { page, limit, sortBy, sortOrder, ...filters } = value;

      const result = await aiAssistanceService.getAllAssistanceRequests(
        filters, 
        { page, limit, sortBy, sortOrder }
      );

      res.json({
        message: 'AI assistance requests retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting AI assistance requests:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get AI assistance request by ID
   */
  async getAssistanceRequestById(req, res) {
    try {
      const { requestId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        requestId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ requestId: parseInt(requestId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request ID', 
          details: error.details 
        });
      }

      const request = await aiAssistanceService.getAssistanceRequestById(parseInt(requestId));

      res.json({
        message: 'AI assistance request retrieved successfully',
        data: request
      });

    } catch (error) {
      console.error('Error getting AI assistance request by ID:', error);
      
      if (error.message === 'AI assistance request not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'AI assistance request not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Process AI assistance request
   */
  async processAssistanceRequest(req, res) {
    try {
      const { requestId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        requestId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ requestId: parseInt(requestId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request ID', 
          details: error.details 
        });
      }

      const processedRequest = await aiAssistanceService.processAssistanceRequest(parseInt(requestId));

      res.json({
        message: 'AI assistance request processed successfully',
        data: processedRequest
      });

    } catch (error) {
      console.error('Error processing AI assistance request:', error);
      
      if (error.message === 'AI assistance request not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'AI assistance request not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update AI assistance request feedback
   */
  async updateRequestFeedback(req, res) {
    try {
      const { requestId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        requestId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ requestId: parseInt(requestId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid request ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        qualityRating: Joi.number().integer().min(1).max(5),
        userFeedback: Joi.string().trim(),
        usefulness: Joi.number().integer().min(1).max(5),
        implementationStatus: Joi.string().valid('not_implemented', 'in_progress', 'completed', 'failed'),
        implementationNotes: Joi.string().trim(),
        effectiveness: Joi.number().integer().min(1).max(5)
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const updatedRequest = await aiAssistanceService.updateRequestFeedback(parseInt(requestId), value, req.user.id);

      res.json({
        message: 'AI assistance request feedback updated successfully',
        data: updatedRequest
      });

    } catch (error) {
      console.error('Error updating AI assistance request feedback:', error);
      
      if (error.message === 'AI assistance request not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'AI assistance request not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== SPECIALIZED AI ASSISTANCE OPERATIONS ====================

  /**
   * Generate threat intelligence report
   */
  async generateThreatIntelligenceReport(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        indicators: Joi.array().items(Joi.string()).required().min(1),
        context: Joi.object().default({}),
        priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('high')
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const report = await aiAssistanceService.generateThreatIntelligenceReport(
        value.indicators, 
        value.context, 
        req.user.id
      );

      res.status(201).json({
        message: 'Threat intelligence report generated successfully',
        data: report
      });

    } catch (error) {
      console.error('Error generating threat intelligence report:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Generate incident response playbook
   */
  async generateIncidentResponsePlaybook(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        incidentType: Joi.string().required().trim(),
        severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
        context: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const playbook = await aiAssistanceService.generateIncidentResponsePlaybook(
        value.incidentType,
        value.severity,
        value.context,
        req.user.id
      );

      res.status(201).json({
        message: 'Incident response playbook generated successfully',
        data: playbook
      });

    } catch (error) {
      console.error('Error generating incident response playbook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Generate compliance assessment
   */
  async generateComplianceAssessment(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        framework: Joi.string().required().trim(),
        controls: Joi.array().items(Joi.string()).required().min(1),
        context: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const assessment = await aiAssistanceService.generateComplianceAssessment(
        value.framework,
        value.controls,
        value.context,
        req.user.id
      );

      res.status(201).json({
        message: 'Compliance assessment generated successfully',
        data: assessment
      });

    } catch (error) {
      console.error('Error generating compliance assessment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Generate security policy
   */
  async generateSecurityPolicy(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        policyType: Joi.string().required().trim(),
        requirements: Joi.string().required().trim(),
        context: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const policy = await aiAssistanceService.generateSecurityPolicy(
        value.policyType,
        value.requirements,
        value.context,
        req.user.id
      );

      res.status(201).json({
        message: 'Security policy generated successfully',
        data: policy
      });

    } catch (error) {
      console.error('Error generating security policy:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Analyze vulnerability impact
   */
  async analyzeVulnerabilityImpact(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        vulnerability: Joi.object().required(),
        assets: Joi.array().items(Joi.object()).required(),
        context: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const analysis = await aiAssistanceService.analyzeVulnerabilityImpact(
        value.vulnerability,
        value.assets,
        value.context,
        req.user.id
      );

      res.status(201).json({
        message: 'Vulnerability impact analysis completed successfully',
        data: analysis
      });

    } catch (error) {
      console.error('Error analyzing vulnerability impact:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get AI analytics
   */
  async getAiAnalytics(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        timeframe: Joi.string().pattern(/^\d+[mhdw]$/).default('24h')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const analytics = await aiAssistanceService.getAiAnalytics(value.timeframe);

      res.json({
        message: 'AI analytics retrieved successfully',
        data: analytics
      });

    } catch (error) {
      console.error('Error getting AI analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== KNOWLEDGE BASE OPERATIONS ====================

  /**
   * Search knowledge base
   */
  async searchKnowledgeBase(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        query: Joi.string().max(200),
        category: Joi.string().max(100),
        subcategory: Joi.string().max(100),
        isValidated: Joi.boolean(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().valid('relevance', 'createdAt', 'rating', 'viewCount').default('relevance'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const { query, page, limit, sortBy, sortOrder, ...filters } = value;

      const result = await aiAssistanceService.searchKnowledgeBase(
        query,
        filters,
        { page, limit, sortBy, sortOrder }
      );

      res.json({
        message: 'Knowledge base search completed successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error searching knowledge base:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

}

module.exports = new AiAssistanceController();
