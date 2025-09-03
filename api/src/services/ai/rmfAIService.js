/**
 * RMF AI Service
 * AI-powered automation for Risk Management Framework processes
 * Uses OpenAI GPT-4 for intelligent analysis and document generation
 */

const OpenAI = require('openai');
const { db } = require('../../db');
const { sql } = require('drizzle-orm');

class RMFAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Configuration
    this.config = {
      model: 'gpt-4o',
      temperature: 0.3, // Lower temperature for more consistent results
      maxTokens: 4000,
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
    };
  }

  /**
   * Make AI request with error handling and retry logic
   */
  async makeAIRequest(messages, options = {}) {
    const requestConfig = {
      model: options.model || this.config.model,
      messages,
      temperature: options.temperature || this.config.temperature,
      max_tokens: options.maxTokens || this.config.maxTokens,
    };

    let lastError;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`🤖 AI Request attempt ${attempt}/${this.config.retryAttempts}`);
        
        const startTime = Date.now();
        const response = await this.openai.chat.completions.create(requestConfig);
        const processingTime = Date.now() - startTime;
        
        // Log the request for monitoring
        await this.logAIRequest({
          operation: options.operation || 'unknown',
          inputTokens: this.estimateTokens(messages),
          outputTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
          processingTime,
          success: true,
          cost: this.calculateCost(response.usage?.total_tokens || 0)
        });

        console.log(`✅ AI Request successful in ${processingTime}ms`);
        return response.choices[0].message.content;
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ AI Request attempt ${attempt} failed:`, error.message);
        
        // Log failed request
        await this.logAIRequest({
          operation: options.operation || 'unknown',
          inputTokens: this.estimateTokens(messages),
          processingTime: 0,
          success: false,
          errorMessage: error.message
        });
        
        // Don't retry on certain errors
        if (error.status === 401 || error.status === 403) {
          throw new Error(`AI Service Authentication Error: ${error.message}`);
        }
        
        // Wait before retry
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }
    
    throw new Error(`AI Service failed after ${this.config.retryAttempts} attempts: ${lastError.message}`);
  }

  /**
   * Validate AI response format
   */
  validateResponse(response, expectedFormat = 'json') {
    if (!response || typeof response !== 'string') {
      throw new Error('Invalid AI response: Empty or non-string response');
    }

    if (expectedFormat === 'json') {
      try {
        // Clean up response - remove markdown code blocks if present
        let cleanResponse = response.trim();

        // Remove ```json and ``` markers
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        return JSON.parse(cleanResponse.trim());
      } catch (error) {
        throw new Error(`Invalid AI response: Not valid JSON - ${error.message}`);
      }
    }

    return response;
  }

  /**
   * Log AI requests for monitoring and cost tracking
   */
  async logAIRequest(logData) {
    try {
      await db.execute(sql`
        INSERT INTO ai_processing_logs (
          operation_type,
          input_tokens,
          output_tokens,
          total_tokens,
          processing_time,
          success,
          error_message,
          cost,
          created_at
        ) VALUES (
          ${logData.operation},
          ${logData.inputTokens || 0},
          ${logData.outputTokens || 0},
          ${logData.totalTokens || 0},
          ${logData.processingTime},
          ${logData.success},
          ${logData.errorMessage || null},
          ${logData.cost || 0},
          NOW()
        )
      `);
    } catch (error) {
      console.warn('Failed to log AI request:', error.message);
    }
  }

  /**
   * Estimate token count (rough approximation)
   */
  estimateTokens(messages) {
    const text = messages.map(m => m.content).join(' ');
    return Math.ceil(text.length / 4); // Rough estimate: 1 token ≈ 4 characters
  }

  /**
   * Calculate approximate cost based on tokens
   */
  calculateCost(totalTokens) {
    // GPT-4o pricing (approximate): $0.005 per 1K tokens
    return (totalTokens / 1000) * 0.005;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get AI service statistics
   */
  async getAIStats(timeframe = '24 hours') {
    try {
      const stats = await db.execute(sql`
        SELECT 
          COUNT(*) as total_requests,
          SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_requests,
          SUM(total_tokens) as total_tokens_used,
          SUM(cost) as total_cost,
          AVG(processing_time) as avg_processing_time,
          operation_type
        FROM ai_processing_logs 
        WHERE created_at >= NOW() - INTERVAL ${timeframe}
        GROUP BY operation_type
        ORDER BY total_requests DESC
      `);
      
      return stats.rows;
    } catch (error) {
      console.warn('Failed to get AI stats:', error.message);
      return [];
    }
  }

  /**
   * Health check for AI service
   */
  async healthCheck() {
    try {
      const response = await this.makeAIRequest([
        {
          role: 'user',
          content: 'Respond with "OK" if you can process this request.'
        }
      ], {
        operation: 'health_check',
        maxTokens: 10
      });
      
      return {
        status: 'healthy',
        response: response.trim(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * AI-Powered System Categorization (FIPS 199)
   * Analyzes system characteristics and recommends impact levels
   */
  async categorizeSystem(systemData) {
    const operation = 'system_categorization';
    console.log(`🤖 Starting AI categorization for system: ${systemData.name}`);

    const prompt = `
You are a cybersecurity expert specializing in FIPS 199 system categorization. Analyze the following system and determine the appropriate impact levels for Confidentiality, Integrity, and Availability.

System Information:
- Name: ${systemData.name}
- Description: ${systemData.description}
- Data Types: ${systemData.dataTypes?.join(', ') || 'Not specified'}
- Business Processes: ${systemData.businessProcesses?.join(', ') || 'Not specified'}
- Environment: ${systemData.environment || 'Not specified'}
- User Base: ${systemData.userBase || 'Not specified'}

FIPS 199 Impact Level Guidelines:
- LOW: Limited adverse effect on operations, assets, or individuals
- MODERATE: Serious adverse effect on operations, assets, or individuals
- HIGH: Severe or catastrophic adverse effect on operations, assets, or individuals

Consider these factors:
1. Confidentiality: What happens if information is disclosed to unauthorized persons?
2. Integrity: What happens if information is modified or destroyed inappropriately?
3. Availability: What happens if information or services are not available when needed?

Data Type Considerations:
- PII/PHI: Usually MODERATE to HIGH confidentiality
- Financial Data: Usually MODERATE to HIGH for all categories
- Classified Information: HIGH for all categories
- Public Information: LOW confidentiality, but integrity/availability may vary

Respond in JSON format with this exact structure:
{
  "confidentiality": "LOW|MODERATE|HIGH",
  "integrity": "LOW|MODERATE|HIGH",
  "availability": "LOW|MODERATE|HIGH",
  "overall": "LOW|MODERATE|HIGH",
  "reasoning": "Detailed explanation of your analysis and decisions",
  "confidence": 85,
  "risk_factors": ["factor1", "factor2"],
  "recommendations": "Suggestions for improving security posture"
}
`;

    try {
      const response = await this.makeAIRequest([
        {
          role: 'system',
          content: 'You are a NIST cybersecurity expert specializing in FIPS 199 system categorization. Provide accurate, compliant categorization analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        operation,
        temperature: 0.2, // Lower temperature for more consistent categorization
        maxTokens: 1500
      });

      const result = this.validateResponse(response, 'json');

      // Validate required fields
      const requiredFields = ['confidentiality', 'integrity', 'availability', 'overall', 'reasoning'];
      for (const field of requiredFields) {
        if (!result[field]) {
          throw new Error(`AI response missing required field: ${field}`);
        }
      }

      // Validate impact levels
      const validLevels = ['LOW', 'MODERATE', 'HIGH'];
      for (const category of ['confidentiality', 'integrity', 'availability', 'overall']) {
        if (!validLevels.includes(result[category])) {
          throw new Error(`Invalid impact level for ${category}: ${result[category]}`);
        }
      }

      console.log(`✅ AI categorization completed with ${result.confidence}% confidence`);
      return result;

    } catch (error) {
      console.error(`❌ AI categorization failed:`, error.message);
      throw new Error(`System categorization failed: ${error.message}`);
    }
  }

  /**
   * Save AI categorization results to database
   */
  async saveCategorization(systemId, categorizationResult, userId = null) {
    try {
      const result = await db.execute(sql`
        INSERT INTO ai_categorization_results (
          system_id,
          confidentiality_impact,
          integrity_impact,
          availability_impact,
          overall_impact,
          reasoning,
          confidence_score,
          information_types,
          system_characteristics,
          risk_factors,
          recommendations,
          created_at
        ) VALUES (
          ${systemId},
          ${categorizationResult.confidentiality},
          ${categorizationResult.integrity},
          ${categorizationResult.availability},
          ${categorizationResult.overall},
          ${categorizationResult.reasoning},
          ${categorizationResult.confidence || 80},
          ${JSON.stringify(categorizationResult.information_types || [])},
          ${JSON.stringify(categorizationResult.system_characteristics || {})},
          ${JSON.stringify(categorizationResult.risk_factors || [])},
          ${categorizationResult.recommendations || ''},
          NOW()
        )
        RETURNING *
      `);

      return result.rows[0];
    } catch (error) {
      console.error('Failed to save categorization results:', error.message);
      throw new Error(`Failed to save categorization: ${error.message}`);
    }
  }

  /**
   * Get categorization history for a system
   */
  async getCategorizationHistory(systemId) {
    try {
      const results = await db.execute(sql`
        SELECT * FROM ai_categorization_results
        WHERE system_id = ${systemId}
        ORDER BY created_at DESC
      `);

      return results.rows;
    } catch (error) {
      console.error('Failed to get categorization history:', error.message);
      throw new Error(`Failed to retrieve categorization history: ${error.message}`);
    }
  }
}

module.exports = new RMFAIService();
