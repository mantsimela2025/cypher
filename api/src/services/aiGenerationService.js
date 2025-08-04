const { db } = require('../db');
const { 
  aiGenerationRequests, 
  aiGenerationTemplates, 
  aiGenerationFeedback, 
  aiModelConfigurations,
  aiGenerationAnalytics 
} = require('../db/schema');
const { eq, and, desc, asc, sql, count, gte, lte } = require('drizzle-orm');

class AIGenerationService {

  // ==================== AI GENERATION REQUEST MANAGEMENT ====================

  /**
   * Create AI generation request
   */
  async createGenerationRequest(requestData, userId) {
    try {
      console.log('🤖 Creating AI generation request:', requestData.title);

      const [newRequest] = await db.insert(aiGenerationRequests)
        .values({
          ...requestData,
          requestedBy: userId,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newRequest;
    } catch (error) {
      console.error('Error creating AI generation request:', error);
      throw error;
    }
  }

  /**
   * Process AI generation request
   */
  async processGeneration(requestId) {
    try {
      console.log('🤖 Processing AI generation request:', requestId);

      // Get the request
      const [request] = await db.select()
        .from(aiGenerationRequests)
        .where(eq(aiGenerationRequests.id, requestId))
        .limit(1);

      if (!request) {
        throw new Error('AI generation request not found');
      }

      // Update status to processing
      await db.update(aiGenerationRequests)
        .set({
          status: 'processing',
          updatedAt: new Date()
        })
        .where(eq(aiGenerationRequests.id, requestId));

      const startTime = Date.now();

      try {
        // Get AI model configuration
        const modelConfig = await this.getModelConfiguration(request.aiProvider, request.modelName);

        // Generate content using AI
        const generationResult = await this.generateContent(request, modelConfig);

        const processingTime = Date.now() - startTime;

        // Update request with results
        const [updatedRequest] = await db.update(aiGenerationRequests)
          .set({
            status: 'completed',
            generatedContent: generationResult.content,
            qualityScore: generationResult.qualityScore,
            tokensUsed: generationResult.tokensUsed,
            processingTime: processingTime,
            updatedAt: new Date()
          })
          .where(eq(aiGenerationRequests.id, requestId))
          .returning();

        // Record analytics
        await this.recordAnalytics(request, generationResult, processingTime);

        return updatedRequest;

      } catch (generationError) {
        // Update request with error
        await db.update(aiGenerationRequests)
          .set({
            status: 'failed',
            errorMessage: generationError.message,
            updatedAt: new Date()
          })
          .where(eq(aiGenerationRequests.id, requestId));

        throw generationError;
      }
    } catch (error) {
      console.error('Error processing AI generation:', error);
      throw error;
    }
  }

  /**
   * Generate content using AI
   */
  async generateContent(request, modelConfig) {
    try {
      console.log('🤖 Generating content with AI provider:', request.aiProvider);

      // Build the prompt based on request type and context
      const prompt = await this.buildPrompt(request);

      // Call the appropriate AI provider
      let result;
      switch (request.aiProvider) {
        case 'openai':
          result = await this.generateWithOpenAI(prompt, request, modelConfig);
          break;
        case 'anthropic':
          result = await this.generateWithAnthropic(prompt, request, modelConfig);
          break;
        case 'azure_openai':
          result = await this.generateWithAzureOpenAI(prompt, request, modelConfig);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${request.aiProvider}`);
      }

      // Assess quality of generated content
      const qualityScore = await this.assessContentQuality(result.content, request);

      return {
        content: result.content,
        tokensUsed: result.tokensUsed,
        qualityScore: qualityScore
      };
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }

  /**
   * Build prompt based on request context
   */
  async buildPrompt(request) {
    try {
      let systemPrompt = '';
      let userPrompt = request.prompt;

      // Get template if available
      if (request.templateId) {
        const template = await this.getTemplate(request.templateId);
        systemPrompt = template.systemPrompt || '';
        userPrompt = this.interpolateTemplate(template.promptTemplate, request.context);
      } else {
        // Build system prompt based on request type
        systemPrompt = this.getDefaultSystemPrompt(request.requestType, request.generationMode);
      }

      // Add context information
      if (request.context) {
        const contextPrompt = this.buildContextPrompt(request.context);
        userPrompt = `${contextPrompt}\n\n${userPrompt}`;
      }

      return {
        systemPrompt,
        userPrompt
      };
    } catch (error) {
      console.error('Error building prompt:', error);
      throw error;
    }
  }

  /**
   * Generate with OpenAI
   */
  async generateWithOpenAI(prompt, request, modelConfig) {
    try {
      // This would integrate with OpenAI API
      // For now, return mock response
      console.log('🤖 Calling OpenAI API...');

      // Mock implementation - replace with actual OpenAI API call
      const mockContent = this.generateMockContent(request);

      return {
        content: mockContent,
        tokensUsed: Math.floor(mockContent.length / 4) // Rough token estimate
      };

      // Actual OpenAI implementation would look like:
      /*
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const response = await openai.chat.completions.create({
        model: request.modelName || 'gpt-4',
        messages: [
          { role: 'system', content: prompt.systemPrompt },
          { role: 'user', content: prompt.userPrompt }
        ],
        temperature: request.parameters?.temperature || 0.7,
        max_tokens: request.parameters?.maxTokens || 2000
      });

      return {
        content: response.choices[0].message.content,
        tokensUsed: response.usage.total_tokens
      };
      */
    } catch (error) {
      console.error('Error with OpenAI generation:', error);
      throw error;
    }
  }

  /**
   * Generate with Anthropic
   */
  async generateWithAnthropic(prompt, request, modelConfig) {
    try {
      console.log('🤖 Calling Anthropic API...');

      // Mock implementation - replace with actual Anthropic API call
      const mockContent = this.generateMockContent(request);

      return {
        content: mockContent,
        tokensUsed: Math.floor(mockContent.length / 4)
      };
    } catch (error) {
      console.error('Error with Anthropic generation:', error);
      throw error;
    }
  }

  /**
   * Generate with Azure OpenAI
   */
  async generateWithAzureOpenAI(prompt, request, modelConfig) {
    try {
      console.log('🤖 Calling Azure OpenAI API...');

      // Mock implementation - replace with actual Azure OpenAI API call
      const mockContent = this.generateMockContent(request);

      return {
        content: mockContent,
        tokensUsed: Math.floor(mockContent.length / 4)
      };
    } catch (error) {
      console.error('Error with Azure OpenAI generation:', error);
      throw error;
    }
  }

  /**
   * Generate mock content for testing
   */
  generateMockContent(request) {
    const templates = {
      'policy': `# ${request.title}

## Purpose
This policy establishes guidelines and procedures for ${request.context?.policyType || 'organizational operations'} to ensure compliance with regulatory requirements and organizational standards.

## Scope
This policy applies to all employees, contractors, and third-party vendors who have access to organizational resources and systems.

## Policy Statement
The organization is committed to maintaining the highest standards of ${request.context?.policyType || 'operational excellence'} through:

1. **Compliance**: Adherence to all applicable laws, regulations, and industry standards
2. **Risk Management**: Identification, assessment, and mitigation of potential risks
3. **Continuous Improvement**: Regular review and enhancement of policies and procedures
4. **Training**: Ongoing education and awareness programs for all personnel

## Responsibilities
- **Management**: Ensure policy implementation and provide necessary resources
- **Employees**: Comply with policy requirements and report violations
- **IT Department**: Maintain technical controls and monitoring systems
- **Compliance Team**: Monitor adherence and conduct regular audits

## Procedures
Detailed procedures for implementing this policy are outlined in the associated procedure documents.

## Review and Updates
This policy will be reviewed annually or as needed to ensure continued effectiveness and compliance.

## Approval
This policy has been approved by the appropriate authority and is effective immediately.`,

      'procedure': `# ${request.title}

## Overview
This procedure provides step-by-step instructions for implementing the requirements outlined in the related policy.

## Prerequisites
- Access to required systems and resources
- Appropriate training and authorization
- Understanding of related policies and procedures

## Procedure Steps

### Step 1: Preparation
1. Review the related policy requirements
2. Gather necessary documentation and resources
3. Verify access permissions and authorizations

### Step 2: Implementation
1. Follow the established workflow process
2. Document all actions and decisions
3. Obtain required approvals at each stage

### Step 3: Verification
1. Validate that all requirements have been met
2. Conduct quality assurance checks
3. Document results and any deviations

### Step 4: Completion
1. Finalize all documentation
2. Notify relevant stakeholders
3. Archive records according to retention policy

## Quality Assurance
Regular reviews and audits will be conducted to ensure procedure effectiveness and compliance.

## Training
All personnel involved in this procedure must receive appropriate training and maintain current certifications.

## Documentation
All activities must be properly documented and maintained according to organizational standards.`
    };

    return templates[request.requestType] || `Generated content for ${request.title}`;
  }

  /**
   * Assess content quality
   */
  async assessContentQuality(content, request) {
    try {
      // Simple quality assessment based on content characteristics
      let score = 50; // Base score

      // Length assessment
      if (content.length > 500) score += 10;
      if (content.length > 1000) score += 10;
      if (content.length > 2000) score += 10;

      // Structure assessment
      if (content.includes('#')) score += 5; // Has headers
      if (content.includes('##')) score += 5; // Has subheaders
      if (content.includes('1.') || content.includes('-')) score += 5; // Has lists

      // Content relevance (basic keyword matching)
      const keywords = request.context?.keywords || [];
      keywords.forEach(keyword => {
        if (content.toLowerCase().includes(keyword.toLowerCase())) {
          score += 2;
        }
      });

      // Policy-specific quality checks
      if (request.requestType === 'policy') {
        if (content.includes('Purpose') || content.includes('Scope')) score += 5;
        if (content.includes('Responsibilities')) score += 5;
        if (content.includes('Compliance')) score += 5;
      }

      // Procedure-specific quality checks
      if (request.requestType === 'procedure') {
        if (content.includes('Step') || content.includes('Procedure')) score += 5;
        if (content.includes('Prerequisites')) score += 3;
        if (content.includes('Overview')) score += 3;
      }

      return Math.min(score, 100); // Cap at 100
    } catch (error) {
      console.error('Error assessing content quality:', error);
      return 50; // Default score
    }
  }

  /**
   * Get model configuration
   */
  async getModelConfiguration(provider, modelName) {
    try {
      const [config] = await db.select()
        .from(aiModelConfigurations)
        .where(and(
          eq(aiModelConfigurations.provider, provider),
          eq(aiModelConfigurations.modelName, modelName || 'default'),
          eq(aiModelConfigurations.isActive, true)
        ))
        .limit(1);

      if (!config) {
        // Return default configuration
        return {
          provider: provider,
          modelName: modelName || 'gpt-4',
          defaultParameters: {
            temperature: 0.7,
            maxTokens: 2000
          }
        };
      }

      return config;
    } catch (error) {
      console.error('Error getting model configuration:', error);
      throw error;
    }
  }

  /**
   * Get default system prompt
   */
  getDefaultSystemPrompt(requestType, generationMode) {
    const prompts = {
      'policy': {
        'full_generation': 'You are an expert policy writer. Create comprehensive, well-structured policies that are clear, actionable, and compliant with industry standards. Include sections for Purpose, Scope, Policy Statement, Responsibilities, and Review procedures.',
        'enhancement': 'You are an expert policy reviewer. Enhance the provided policy content to improve clarity, completeness, and compliance. Maintain the original structure while improving language and adding missing elements.',
        'compliance_mapping': 'You are a compliance expert. Review the policy content and identify compliance requirements, gaps, and recommendations for improvement.'
      },
      'procedure': {
        'full_generation': 'You are an expert procedure writer. Create detailed, step-by-step procedures that are easy to follow and implement. Include prerequisites, detailed steps, quality assurance measures, and documentation requirements.',
        'enhancement': 'You are an expert procedure reviewer. Enhance the provided procedure to improve clarity, completeness, and usability. Add missing steps and improve existing ones.',
        'template_based': 'You are a procedure specialist. Use the provided template to create a comprehensive procedure that follows organizational standards.'
      }
    };

    return prompts[requestType]?.[generationMode] || 'You are an expert content creator. Generate high-quality, professional content based on the provided requirements.';
  }

  /**
   * Build context prompt
   */
  buildContextPrompt(context) {
    let contextPrompt = 'Context Information:\n';

    if (context.organizationContext) {
      contextPrompt += `Organization: ${context.organizationContext}\n`;
    }

    if (context.policyType) {
      contextPrompt += `Policy Type: ${context.policyType}\n`;
    }

    if (context.complianceRequirements) {
      contextPrompt += `Compliance Requirements: ${context.complianceRequirements}\n`;
    }

    if (context.existingPolicies && context.existingPolicies.length > 0) {
      contextPrompt += `Related Existing Policies:\n`;
      context.existingPolicies.forEach((policy, index) => {
        contextPrompt += `${index + 1}. ${policy.title}: ${policy.description}\n`;
      });
    }

    if (context.assetContext) {
      contextPrompt += `Asset Context: ${context.assetContext}\n`;
    }

    return contextPrompt;
  }

  /**
   * Record analytics
   */
  async recordAnalytics(request, result, processingTime) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if analytics record exists for today
      const [existingRecord] = await db.select()
        .from(aiGenerationAnalytics)
        .where(and(
          eq(aiGenerationAnalytics.date, today),
          eq(aiGenerationAnalytics.generationType, request.requestType),
          eq(aiGenerationAnalytics.provider, request.aiProvider)
        ))
        .limit(1);

      if (existingRecord) {
        // Update existing record
        await db.update(aiGenerationAnalytics)
          .set({
            totalRequests: existingRecord.totalRequests + 1,
            successfulRequests: existingRecord.successfulRequests + 1,
            totalTokensUsed: existingRecord.totalTokensUsed + (result.tokensUsed || 0),
            averageProcessingTime: Math.round((existingRecord.averageProcessingTime * existingRecord.totalRequests + processingTime) / (existingRecord.totalRequests + 1)),
            averageQualityScore: Math.round((existingRecord.averageQualityScore * existingRecord.totalRequests + result.qualityScore) / (existingRecord.totalRequests + 1)),
            updatedAt: new Date()
          })
          .where(eq(aiGenerationAnalytics.id, existingRecord.id));
      } else {
        // Create new record
        await db.insert(aiGenerationAnalytics)
          .values({
            date: today,
            generationType: request.requestType,
            provider: request.aiProvider,
            modelName: request.modelName,
            totalRequests: 1,
            successfulRequests: 1,
            failedRequests: 0,
            averageProcessingTime: processingTime,
            totalTokensUsed: result.tokensUsed || 0,
            averageQualityScore: result.qualityScore,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }
    } catch (error) {
      console.error('Error recording analytics:', error);
      // Don't throw error to avoid breaking main operation
    }
  }

  /**
   * Get AI generation analytics
   */
  async getAnalytics(filters = {}) {
    try {
      const { startDate, endDate, provider, generationType } = filters;

      let query = db.select()
        .from(aiGenerationAnalytics);

      const conditions = [];

      if (startDate) {
        conditions.push(gte(aiGenerationAnalytics.date, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(aiGenerationAnalytics.date, new Date(endDate)));
      }

      if (provider) {
        conditions.push(eq(aiGenerationAnalytics.provider, provider));
      }

      if (generationType) {
        conditions.push(eq(aiGenerationAnalytics.generationType, generationType));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const analytics = await query.orderBy(desc(aiGenerationAnalytics.date));

      // Calculate summary statistics
      const summary = analytics.reduce((acc, record) => {
        acc.totalRequests += record.totalRequests;
        acc.successfulRequests += record.successfulRequests;
        acc.failedRequests += record.failedRequests;
        acc.totalTokensUsed += record.totalTokensUsed;
        acc.totalCost += record.totalCost || 0;
        return acc;
      }, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokensUsed: 0,
        totalCost: 0
      });

      summary.successRate = summary.totalRequests > 0 ? (summary.successfulRequests / summary.totalRequests * 100).toFixed(2) : 0;
      summary.averageQualityScore = analytics.length > 0 ? Math.round(analytics.reduce((sum, record) => sum + record.averageQualityScore, 0) / analytics.length) : 0;

      return {
        summary,
        analytics
      };
    } catch (error) {
      console.error('Error getting AI analytics:', error);
      throw error;
    }
  }
}

module.exports = new AIGenerationService();
