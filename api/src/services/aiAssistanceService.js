const { db } = require('../db');
const { 
  aiAssistanceRequests,
  aiKnowledgeBase,
  aiTrainingData,
  aiAnalytics,
  aiModelConfigurations,
  aiAutomationRules,
  users
} = require('../db/schema');
const { eq, and, desc, asc, sql, count, gte, lte, like, ilike, inArray, isNull, isNotNull, or } = require('drizzle-orm');
const notificationService = require('./notificationService');

class AiAssistanceService {
  constructor() {
    this.aiProviders = {
      openai: this.initializeOpenAI(),
      anthropic: this.initializeAnthropic(),
      azure_openai: this.initializeAzureOpenAI(),
      local_model: this.initializeLocalModel()
    };
  }

  // ==================== AI PROVIDER INITIALIZATION ====================

  /**
   * Initialize OpenAI client
   */
  initializeOpenAI() {
    if (process.env.OPENAI_API_KEY) {
      const { OpenAI } = require('openai');
      return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORG_ID
      });
    }
    return null;
  }

  /**
   * Initialize Anthropic client
   */
  initializeAnthropic() {
    if (process.env.ANTHROPIC_API_KEY) {
      const { Anthropic } = require('@anthropic-ai/sdk');
      return new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
    return null;
  }

  /**
   * Initialize Azure OpenAI client
   */
  initializeAzureOpenAI() {
    if (process.env.AZURE_OPENAI_API_KEY) {
      const { OpenAI } = require('openai');
      return new OpenAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        baseURL: process.env.AZURE_OPENAI_ENDPOINT,
        defaultQuery: { 'api-version': '2024-02-01' },
        defaultHeaders: {
          'api-key': process.env.AZURE_OPENAI_API_KEY,
        }
      });
    }
    return null;
  }

  /**
   * Initialize local model client
   */
  initializeLocalModel() {
    // This would initialize connection to local AI models
    // For government environments with air-gapped systems
    return null;
  }

  // ==================== AI ASSISTANCE REQUEST MANAGEMENT ====================

  /**
   * Create AI assistance request
   */
  async createAssistanceRequest(requestData, userId) {
    try {
      console.log('🤖 Creating AI assistance request:', requestData.requestType);

      const [newRequest] = await db.insert(aiAssistanceRequests)
        .values({
          ...requestData,
          userId,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Auto-process if configured
      if (await this.shouldAutoProcess(newRequest)) {
        await this.processAssistanceRequest(newRequest.id);
      }

      // Send notification
      await this.sendAiNotification('request_created', newRequest, userId);

      return newRequest;
    } catch (error) {
      console.error('Error creating AI assistance request:', error);
      throw error;
    }
  }

  /**
   * Process AI assistance request
   */
  async processAssistanceRequest(requestId) {
    try {
      console.log('⚡ Processing AI assistance request:', requestId);

      // Get request details
      const [request] = await db.select()
        .from(aiAssistanceRequests)
        .where(eq(aiAssistanceRequests.id, requestId))
        .limit(1);

      if (!request) {
        throw new Error('AI assistance request not found');
      }

      // Update status to processing
      await db.update(aiAssistanceRequests)
        .set({ 
          status: 'processing',
          updatedAt: new Date()
        })
        .where(eq(aiAssistanceRequests.id, requestId));

      // Get appropriate AI model configuration
      const modelConfig = await this.getModelConfiguration(request.requestType);
      if (!modelConfig) {
        throw new Error('No AI model configuration found for request type');
      }

      // Generate AI response
      const startTime = Date.now();
      const aiResponse = await this.generateAiResponse(request, modelConfig);
      const processingTime = Date.now() - startTime;

      // Update request with response
      const [updatedRequest] = await db.update(aiAssistanceRequests)
        .set({
          aiProvider: modelConfig.provider,
          aiModel: modelConfig.model,
          response: aiResponse.content,
          confidence: aiResponse.confidence,
          processingTime,
          tokensUsed: aiResponse.tokensUsed,
          cost: aiResponse.cost,
          status: 'completed',
          updatedAt: new Date()
        })
        .where(eq(aiAssistanceRequests.id, requestId))
        .returning();

      // Record analytics
      await this.recordAnalytics('request_processed', {
        requestType: request.requestType,
        provider: modelConfig.provider,
        processingTime,
        tokensUsed: aiResponse.tokensUsed,
        cost: aiResponse.cost
      });

      // Send notification
      await this.sendAiNotification('request_completed', updatedRequest, request.userId);

      return updatedRequest;
    } catch (error) {
      console.error('Error processing AI assistance request:', error);
      
      // Update request status to failed
      await db.update(aiAssistanceRequests)
        .set({ 
          status: 'failed',
          response: `Error: ${error.message}`,
          updatedAt: new Date()
        })
        .where(eq(aiAssistanceRequests.id, requestId));

      throw error;
    }
  }

  /**
   * Generate AI response based on request type
   */
  async generateAiResponse(request, modelConfig) {
    try {
      const prompt = await this.buildPrompt(request, modelConfig);
      const provider = this.aiProviders[modelConfig.provider];

      if (!provider) {
        throw new Error(`AI provider ${modelConfig.provider} not available`);
      }

      let response;
      let tokensUsed = 0;
      let cost = 0;

      switch (modelConfig.provider) {
        case 'openai':
        case 'azure_openai':
          response = await this.callOpenAI(provider, prompt, modelConfig);
          tokensUsed = response.usage?.total_tokens || 0;
          cost = this.calculateCost(modelConfig.provider, modelConfig.model, tokensUsed);
          break;

        case 'anthropic':
          response = await this.callAnthropic(provider, prompt, modelConfig);
          tokensUsed = response.usage?.input_tokens + response.usage?.output_tokens || 0;
          cost = this.calculateCost(modelConfig.provider, modelConfig.model, tokensUsed);
          break;

        case 'local_model':
          response = await this.callLocalModel(prompt, modelConfig);
          break;

        default:
          throw new Error(`Unsupported AI provider: ${modelConfig.provider}`);
      }

      return {
        content: response.content || response.choices?.[0]?.message?.content || 'No response generated',
        confidence: this.assessConfidence(response, request.requestType),
        tokensUsed,
        cost
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }

  /**
   * Build prompt based on request type and context
   */
  async buildPrompt(request, modelConfig) {
    const basePrompts = {
      threat_analysis: `You are a cybersecurity expert analyzing potential threats. 
        Analyze the following security event and provide:
        1. Threat assessment and severity level
        2. Potential attack vectors and TTPs
        3. Recommended immediate actions
        4. Long-term mitigation strategies
        
        Context: ${JSON.stringify(request.context)}
        Description: ${request.description}`,

      incident_response: `You are an incident response specialist. 
        Provide a structured incident response plan for:
        
        Incident: ${request.title}
        Description: ${request.description}
        Context: ${JSON.stringify(request.context)}
        
        Include:
        1. Immediate containment steps
        2. Investigation procedures
        3. Evidence collection guidelines
        4. Communication plan
        5. Recovery procedures`,

      compliance_guidance: `You are a compliance expert specializing in government cybersecurity frameworks.
        Provide compliance guidance for:
        
        Topic: ${request.title}
        Description: ${request.description}
        Context: ${JSON.stringify(request.context)}
        
        Address:
        1. Relevant compliance frameworks (NIST, FISMA, FedRAMP)
        2. Specific requirements and controls
        3. Implementation guidance
        4. Documentation requirements
        5. Audit considerations`,

      policy_generation: `You are a cybersecurity policy expert.
        Generate a comprehensive policy document for:
        
        Policy Topic: ${request.title}
        Requirements: ${request.description}
        Context: ${JSON.stringify(request.context)}
        
        Include:
        1. Policy statement and objectives
        2. Scope and applicability
        3. Roles and responsibilities
        4. Procedures and controls
        5. Compliance and enforcement`,

      risk_assessment: `You are a cybersecurity risk analyst.
        Conduct a risk assessment for:
        
        Asset/System: ${request.title}
        Description: ${request.description}
        Context: ${JSON.stringify(request.context)}
        
        Provide:
        1. Risk identification and categorization
        2. Likelihood and impact analysis
        3. Risk rating and prioritization
        4. Mitigation recommendations
        5. Residual risk assessment`,

      vulnerability_analysis: `You are a vulnerability assessment specialist.
        Analyze the following vulnerability:
        
        Vulnerability: ${request.title}
        Details: ${request.description}
        Context: ${JSON.stringify(request.context)}
        
        Provide:
        1. Vulnerability classification and CVSS scoring
        2. Exploitation potential and attack scenarios
        3. Affected systems and business impact
        4. Remediation steps and timeline
        5. Compensating controls if patching is delayed`,

      forensic_analysis: `You are a digital forensics expert.
        Provide forensic analysis guidance for:
        
        Case: ${request.title}
        Evidence: ${request.description}
        Context: ${JSON.stringify(request.context)}
        
        Include:
        1. Evidence preservation procedures
        2. Analysis methodology
        3. Key artifacts to examine
        4. Timeline reconstruction
        5. Reporting requirements`,

      training_content: `You are a cybersecurity training specialist.
        Create training content for:
        
        Topic: ${request.title}
        Audience: ${request.description}
        Context: ${JSON.stringify(request.context)}
        
        Develop:
        1. Learning objectives
        2. Key concepts and definitions
        3. Practical examples and scenarios
        4. Hands-on exercises
        5. Assessment questions`,

      threat_hunting: `You are a threat hunting expert.
        Develop threat hunting guidance for:
        
        Hunt Hypothesis: ${request.title}
        Environment: ${request.description}
        Context: ${JSON.stringify(request.context)}
        
        Provide:
        1. Hunt methodology and approach
        2. Data sources and collection methods
        3. Analysis techniques and tools
        4. IOCs and behavioral indicators
        5. Documentation and reporting`,

      malware_analysis: `You are a malware analysis specialist.
        Analyze the following malware sample:
        
        Sample: ${request.title}
        Observations: ${request.description}
        Context: ${JSON.stringify(request.context)}
        
        Provide:
        1. Static analysis findings
        2. Dynamic behavior analysis
        3. IOCs and signatures
        4. Attribution and campaign links
        5. Mitigation and detection strategies`
    };

    let prompt = basePrompts[request.requestType] || `
      You are a cybersecurity expert. Please analyze and provide guidance on:
      
      Topic: ${request.title}
      Description: ${request.description}
      Context: ${JSON.stringify(request.context)}
    `;

    // Add system prompt if configured
    if (modelConfig.systemPrompt) {
      prompt = `${modelConfig.systemPrompt}\n\n${prompt}`;
    }

    // Add government-specific context
    prompt += `\n\nIMPORTANT: This is for a government cybersecurity environment. 
    Ensure all recommendations comply with:
    - NIST Cybersecurity Framework
    - FISMA requirements
    - FedRAMP controls
    - Government security best practices
    
    Provide actionable, specific guidance suitable for government IT professionals.`;

    return prompt;
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(client, prompt, modelConfig) {
    const response = await client.chat.completions.create({
      model: modelConfig.model,
      messages: [
        { role: 'system', content: modelConfig.systemPrompt || 'You are a helpful cybersecurity assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: modelConfig.parameters?.temperature || 0.7,
      max_tokens: modelConfig.parameters?.max_tokens || 2000,
      top_p: modelConfig.parameters?.top_p || 1,
      frequency_penalty: modelConfig.parameters?.frequency_penalty || 0,
      presence_penalty: modelConfig.parameters?.presence_penalty || 0
    });

    return response;
  }

  /**
   * Call Anthropic API
   */
  async callAnthropic(client, prompt, modelConfig) {
    const response = await client.messages.create({
      model: modelConfig.model,
      max_tokens: modelConfig.parameters?.max_tokens || 2000,
      temperature: modelConfig.parameters?.temperature || 0.7,
      system: modelConfig.systemPrompt || 'You are a helpful cybersecurity assistant.',
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    return {
      content: response.content[0].text,
      usage: response.usage
    };
  }

  /**
   * Call local model
   */
  async callLocalModel(prompt, modelConfig) {
    // This would implement calls to local AI models
    // For air-gapped government environments
    return {
      content: 'Local model response not implemented',
      usage: { total_tokens: 0 }
    };
  }

  /**
   * Calculate cost based on provider and usage
   */
  calculateCost(provider, model, tokensUsed) {
    const pricing = {
      openai: {
        'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
        'gpt-4-turbo': { input: 0.01, output: 0.03 },
        'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
      },
      anthropic: {
        'claude-3-opus': { input: 0.015, output: 0.075 },
        'claude-3-sonnet': { input: 0.003, output: 0.015 },
        'claude-3-haiku': { input: 0.00025, output: 0.00125 }
      }
    };

    const modelPricing = pricing[provider]?.[model];
    if (!modelPricing) return 0;

    // Simplified calculation - assumes equal input/output tokens
    const avgPrice = (modelPricing.input + modelPricing.output) / 2;
    return (tokensUsed / 1000) * avgPrice;
  }

  /**
   * Assess confidence level of AI response
   */
  assessConfidence(response, requestType) {
    // This would implement confidence assessment logic
    // Based on response quality, model certainty, etc.
    
    const confidenceLevels = ['very_low', 'low', 'medium', 'high', 'very_high'];
    
    // Simple heuristic - can be enhanced with more sophisticated analysis
    if (response.choices?.[0]?.finish_reason === 'stop' && 
        response.choices[0].message.content.length > 500) {
      return 'high';
    }
    
    return 'medium';
  }

  /**
   * Get model configuration for request type
   */
  async getModelConfiguration(requestType) {
    try {
      const [config] = await db.select()
        .from(aiModelConfigurations)
        .where(
          and(
            eq(aiModelConfigurations.isActive, true),
            sql`${requestType} = ANY(${aiModelConfigurations.tags}) OR ${aiModelConfigurations.tags} = ARRAY[]::text[]`
          )
        )
        .orderBy(desc(aiModelConfigurations.createdAt))
        .limit(1);

      return config || await this.getDefaultModelConfiguration();
    } catch (error) {
      console.error('Error getting model configuration:', error);
      return await this.getDefaultModelConfiguration();
    }
  }

  /**
   * Get default model configuration
   */
  async getDefaultModelConfiguration() {
    return {
      provider: 'openai',
      model: 'gpt-4',
      parameters: {
        temperature: 0.7,
        max_tokens: 2000
      },
      systemPrompt: 'You are a helpful cybersecurity assistant specializing in government security requirements.'
    };
  }

  /**
   * Check if request should be auto-processed
   */
  async shouldAutoProcess(request) {
    // Check automation rules
    const rules = await db.select()
      .from(aiAutomationRules)
      .where(
        and(
          eq(aiAutomationRules.isActive, true),
          eq(aiAutomationRules.aiRequestType, request.requestType)
        )
      );

    return rules.length > 0 && !rules[0].requiresApproval;
  }

  /**
   * Record analytics data
   */
  async recordAnalytics(metricType, data) {
    try {
      await db.insert(aiAnalytics)
        .values({
          metricType: 'usage',
          metricName: metricType,
          timestamp: new Date(),
          timeframe: 'real_time',
          value: 1,
          breakdown: data
        });
    } catch (error) {
      console.error('Error recording analytics:', error);
    }
  }

  /**
   * Send AI-related notifications
   */
  async sendAiNotification(eventType, data, userId) {
    try {
      const notificationMap = {
        'request_created': {
          title: 'AI Assistance Request Created',
          message: `AI assistance requested for: ${data.title}`,
          type: 'info'
        },
        'request_completed': {
          title: 'AI Assistance Completed',
          message: `AI analysis completed for: ${data.title}`,
          type: 'success'
        },
        'request_failed': {
          title: 'AI Assistance Failed',
          message: `AI analysis failed for: ${data.title}`,
          type: 'error'
        }
      };

      const notification = notificationMap[eventType];
      if (notification && userId) {
        await notificationService.createNotification({
          userId: userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          module: 'ai_assistance',
          eventType: eventType,
          relatedId: data.id,
          relatedType: 'ai_request',
          metadata: data
        });
      }
    } catch (error) {
      console.error('Error sending AI notification:', error);
    }
  }

  // ==================== SPECIALIZED AI ASSISTANCE METHODS ====================

  /**
   * Generate threat intelligence report
   */
  async generateThreatIntelligenceReport(indicators, context, userId) {
    try {
      const requestData = {
        requestType: 'threat_analysis',
        title: 'Threat Intelligence Analysis',
        description: `Analyze the following indicators: ${indicators.join(', ')}`,
        context: {
          indicators,
          ...context
        },
        priority: 'high'
      };

      const request = await this.createAssistanceRequest(requestData, userId);
      return await this.processAssistanceRequest(request.id);
    } catch (error) {
      console.error('Error generating threat intelligence report:', error);
      throw error;
    }
  }

  /**
   * Generate incident response playbook
   */
  async generateIncidentResponsePlaybook(incidentType, severity, context, userId) {
    try {
      const requestData = {
        requestType: 'incident_response',
        title: `${incidentType} Incident Response Playbook`,
        description: `Generate incident response procedures for ${incidentType} incidents with ${severity} severity`,
        context: {
          incidentType,
          severity,
          ...context
        },
        priority: severity === 'critical' ? 'critical' : 'high'
      };

      const request = await this.createAssistanceRequest(requestData, userId);
      return await this.processAssistanceRequest(request.id);
    } catch (error) {
      console.error('Error generating incident response playbook:', error);
      throw error;
    }
  }

  /**
   * Generate compliance assessment
   */
  async generateComplianceAssessment(framework, controls, context, userId) {
    try {
      const requestData = {
        requestType: 'compliance_guidance',
        title: `${framework} Compliance Assessment`,
        description: `Assess compliance with ${framework} controls: ${controls.join(', ')}`,
        context: {
          framework,
          controls,
          ...context
        },
        priority: 'medium'
      };

      const request = await this.createAssistanceRequest(requestData, userId);
      return await this.processAssistanceRequest(request.id);
    } catch (error) {
      console.error('Error generating compliance assessment:', error);
      throw error;
    }
  }

  /**
   * Generate security policy
   */
  async generateSecurityPolicy(policyType, requirements, context, userId) {
    try {
      const requestData = {
        requestType: 'policy_generation',
        title: `${policyType} Security Policy`,
        description: `Generate security policy for ${policyType} with requirements: ${requirements}`,
        context: {
          policyType,
          requirements,
          ...context
        },
        priority: 'medium'
      };

      const request = await this.createAssistanceRequest(requestData, userId);
      return await this.processAssistanceRequest(request.id);
    } catch (error) {
      console.error('Error generating security policy:', error);
      throw error;
    }
  }

  /**
   * Analyze vulnerability impact
   */
  async analyzeVulnerabilityImpact(vulnerability, assets, context, userId) {
    try {
      const requestData = {
        requestType: 'vulnerability_analysis',
        title: `Vulnerability Impact Analysis: ${vulnerability.id}`,
        description: `Analyze impact of ${vulnerability.title} on affected assets`,
        context: {
          vulnerability,
          assets,
          ...context
        },
        priority: vulnerability.severity === 'critical' ? 'critical' : 'high'
      };

      const request = await this.createAssistanceRequest(requestData, userId);
      return await this.processAssistanceRequest(request.id);
    } catch (error) {
      console.error('Error analyzing vulnerability impact:', error);
      throw error;
    }
  }

  /**
   * Generate risk assessment
   */
  async generateRiskAssessment(asset, threats, context, userId) {
    try {
      const requestData = {
        requestType: 'risk_assessment',
        title: `Risk Assessment: ${asset.name}`,
        description: `Conduct risk assessment for ${asset.name} considering identified threats`,
        context: {
          asset,
          threats,
          ...context
        },
        priority: 'medium'
      };

      const request = await this.createAssistanceRequest(requestData, userId);
      return await this.processAssistanceRequest(request.id);
    } catch (error) {
      console.error('Error generating risk assessment:', error);
      throw error;
    }
  }

  /**
   * Generate training content
   */
  async generateTrainingContent(topic, audience, level, context, userId) {
    try {
      const requestData = {
        requestType: 'training_content',
        title: `Training Content: ${topic}`,
        description: `Generate ${level} level training content on ${topic} for ${audience}`,
        context: {
          topic,
          audience,
          level,
          ...context
        },
        priority: 'low'
      };

      const request = await this.createAssistanceRequest(requestData, userId);
      return await this.processAssistanceRequest(request.id);
    } catch (error) {
      console.error('Error generating training content:', error);
      throw error;
    }
  }

  /**
   * Analyze security logs
   */
  async analyzeSecurityLogs(logs, timeframe, context, userId) {
    try {
      const requestData = {
        requestType: 'log_analysis',
        title: 'Security Log Analysis',
        description: `Analyze security logs for anomalies and threats over ${timeframe}`,
        context: {
          logs: logs.slice(0, 100), // Limit log data for prompt
          timeframe,
          logCount: logs.length,
          ...context
        },
        priority: 'medium'
      };

      const request = await this.createAssistanceRequest(requestData, userId);
      return await this.processAssistanceRequest(request.id);
    } catch (error) {
      console.error('Error analyzing security logs:', error);
      throw error;
    }
  }

  // ==================== KNOWLEDGE BASE MANAGEMENT ====================

  /**
   * Create knowledge base entry
   */
  async createKnowledgeBaseEntry(entryData, userId) {
    try {
      console.log('📚 Creating AI knowledge base entry:', entryData.title);

      const [newEntry] = await db.insert(aiKnowledgeBase)
        .values({
          ...entryData,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newEntry;
    } catch (error) {
      console.error('Error creating knowledge base entry:', error);
      throw error;
    }
  }

  /**
   * Search knowledge base
   */
  async searchKnowledgeBase(query, filters = {}, pagination = {}) {
    try {
      const { category, subcategory, isValidated } = filters;
      const { page = 1, limit = 20, sortBy = 'relevance', sortOrder = 'desc' } = pagination;

      let dbQuery = db.select()
        .from(aiKnowledgeBase);

      // Apply filters
      const conditions = [];

      if (category) {
        conditions.push(eq(aiKnowledgeBase.category, category));
      }

      if (subcategory) {
        conditions.push(eq(aiKnowledgeBase.subcategory, subcategory));
      }

      if (isValidated !== undefined) {
        conditions.push(eq(aiKnowledgeBase.isValidated, isValidated));
      }

      // Full-text search
      if (query) {
        conditions.push(
          sql`(
            ${aiKnowledgeBase.title} ILIKE ${`%${query}%`} OR
            ${aiKnowledgeBase.content} ILIKE ${`%${query}%`} OR
            ${aiKnowledgeBase.summary} ILIKE ${`%${query}%`} OR
            ${query} = ANY(${aiKnowledgeBase.tags})
          )`
        );
      }

      if (conditions.length > 0) {
        dbQuery = dbQuery.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = aiKnowledgeBase[sortBy] || aiKnowledgeBase.createdAt;
      dbQuery = dbQuery.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      dbQuery = dbQuery.limit(limit).offset(offset);

      const entries = await dbQuery;

      // Get total count
      let countQuery = db.select({ count: count() }).from(aiKnowledgeBase);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: entries,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      throw error;
    }
  }

  /**
   * Get AI assistance analytics
   */
  async getAiAnalytics(timeframe = '24h') {
    try {
      const timeframeDuration = this.parseTimeframe(timeframe);
      const startTime = new Date(Date.now() - timeframeDuration);

      // Request statistics
      const [requestStats] = await db.select({
        total: count(),
        pending: count(sql`CASE WHEN ${aiAssistanceRequests.status} = 'pending' THEN 1 END`),
        processing: count(sql`CASE WHEN ${aiAssistanceRequests.status} = 'processing' THEN 1 END`),
        completed: count(sql`CASE WHEN ${aiAssistanceRequests.status} = 'completed' THEN 1 END`),
        failed: count(sql`CASE WHEN ${aiAssistanceRequests.status} = 'failed' THEN 1 END`)
      }).from(aiAssistanceRequests)
        .where(gte(aiAssistanceRequests.createdAt, startTime));

      // Request types breakdown
      const requestTypes = await db.select({
        requestType: aiAssistanceRequests.requestType,
        count: count()
      }).from(aiAssistanceRequests)
        .where(gte(aiAssistanceRequests.createdAt, startTime))
        .groupBy(aiAssistanceRequests.requestType)
        .orderBy(desc(count()));

      // Performance metrics
      const [performanceStats] = await db.select({
        avgProcessingTime: sql`AVG(${aiAssistanceRequests.processingTime})`,
        avgTokensUsed: sql`AVG(${aiAssistanceRequests.tokensUsed})`,
        totalCost: sql`SUM(${aiAssistanceRequests.cost})`
      }).from(aiAssistanceRequests)
        .where(
          and(
            gte(aiAssistanceRequests.createdAt, startTime),
            eq(aiAssistanceRequests.status, 'completed')
          )
        );

      // Knowledge base statistics
      const [knowledgeStats] = await db.select({
        total: count(),
        validated: count(sql`CASE WHEN ${aiKnowledgeBase.isValidated} = true THEN 1 END`),
        avgRating: sql`AVG(${aiKnowledgeBase.rating})`
      }).from(aiKnowledgeBase);

      return {
        timeframe,
        requests: requestStats,
        requestTypes,
        performance: {
          avgProcessingTime: Math.round(performanceStats.avgProcessingTime || 0),
          avgTokensUsed: Math.round(performanceStats.avgTokensUsed || 0),
          totalCost: parseFloat(performanceStats.totalCost || 0)
        },
        knowledgeBase: knowledgeStats,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting AI analytics:', error);
      throw error;
    }
  }

  /**
   * Parse timeframe string to milliseconds
   */
  parseTimeframe(timeframe) {
    const units = {
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000
    };

    const match = timeframe.match(/^(\d+)([mhdw])$/);
    if (!match) return 24 * 60 * 60 * 1000; // Default to 24 hours

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }
}

module.exports = new AiAssistanceService();
