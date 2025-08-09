# Natural Language Query Interface Requirements

## System Overview

The Natural Language Query Interface (NLQI) is an advanced conversational AI system within RAS-DASH that enables users to interact with security data using plain English queries. Built on Retrieval-Augmented Generation (RAG) architecture, this system combines vector embeddings, semantic search, and large language models to provide intelligent, context-aware responses to complex cybersecurity questions. The NLQI transforms natural language into structured queries, retrieves relevant data, and generates comprehensive explanations that enhance decision-making for security professionals.

## Core Functionality

### Natural Language Processing
- **Query Understanding**: Advanced NLP parsing to extract intent, entities, and context from user queries
- **Entity Recognition**: Identification of security-specific concepts (vulnerabilities, assets, compliance controls, POAMs)
- **Intent Classification**: Categorization of query types (informational, analytical, comparative, procedural)
- **Context Preservation**: Maintenance of conversation state for follow-up questions and clarifications
- **Ambiguity Resolution**: Intelligent handling of unclear or incomplete queries with clarification requests

### Query Processing Engine
- **SQL Generation**: Conversion of natural language into optimized database queries
- **Template Matching**: Intelligent template selection based on query patterns and entity types
- **Parameter Extraction**: Automatic extraction of dates, numbers, and specific values from queries
- **Query Optimization**: Performance optimization for complex multi-table joins and aggregations
- **Error Handling**: Graceful handling of invalid queries with helpful error messages

### RAG Architecture
- **Vector Embeddings**: Generation and storage of vector representations for semantic search
- **Similarity Search**: Fast vector-based similarity matching using pgvector extension
- **Context Retrieval**: Intelligent retrieval of relevant documentation and knowledge base content
- **Knowledge Synthesis**: Combination of structured data results with contextual information
- **Response Generation**: AI-powered response creation with explanations and recommendations

### User Interface
- **Conversational Interface**: Modern chat-like interface with real-time query processing
- **Query History**: Comprehensive history tracking with search and filtering capabilities
- **Template Library**: Pre-built query templates for common security scenarios
- **Result Visualization**: Dynamic data visualization including tables, charts, and summaries
- **Feedback System**: User feedback collection for continuous system improvement

## Database Schema

### NL Query History Table
```sql
CREATE TABLE nl_query_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  query_text TEXT NOT NULL,
  processed_query TEXT,
  response JSONB,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'timeout')),
  execution_time_ms INTEGER,
  error_message TEXT,
  query_type VARCHAR(50),
  context_used JSONB,
  additional_params JSONB,
  is_starred BOOLEAN DEFAULT false,
  session_id VARCHAR(100),
  model_used VARCHAR(100) DEFAULT 'gpt-4o',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Performance tracking
  sql_execution_time_ms INTEGER,
  ai_processing_time_ms INTEGER,
  total_tokens_used INTEGER,
  confidence_score DECIMAL(3,2),
  
  -- User interaction
  user_feedback_rating INTEGER CHECK (user_feedback_rating BETWEEN 1 AND 5),
  user_feedback_text TEXT,
  follow_up_queries JSONB,
  
  -- Analytics
  query_complexity VARCHAR(20) CHECK (query_complexity IN ('simple', 'medium', 'complex')),
  data_sources_accessed JSONB,
  result_count INTEGER
);

CREATE INDEX idx_nl_query_history_user_id ON nl_query_history(user_id);
CREATE INDEX idx_nl_query_history_created_at ON nl_query_history(created_at DESC);
CREATE INDEX idx_nl_query_history_session_id ON nl_query_history(session_id);
CREATE INDEX idx_nl_query_history_status ON nl_query_history(status);
CREATE INDEX idx_nl_query_history_query_type ON nl_query_history(query_type);
CREATE INDEX idx_nl_query_history_starred ON nl_query_history(is_starred) WHERE is_starred = true;
```

### NL Query Embeddings Table
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE nl_query_embeddings (
  id SERIAL PRIMARY KEY,
  text_fragment TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL, -- OpenAI embedding dimension
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('documentation', 'policy', 'procedure', 'vulnerability_data', 'asset_data', 'compliance_control', 'stig_rule')),
  source_id INTEGER,
  metadata JSONB,
  token_count INTEGER,
  model_version VARCHAR(50) DEFAULT 'text-embedding-ada-002',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Content classification
  content_category VARCHAR(50),
  security_domain VARCHAR(50),
  complexity_level VARCHAR(20) CHECK (complexity_level IN ('basic', 'intermediate', 'advanced')),
  
  -- Search optimization
  keywords TEXT[],
  entity_types VARCHAR(50)[],
  relevance_score DECIMAL(3,2) DEFAULT 1.0,
  
  -- Maintenance
  last_accessed TIMESTAMP,
  access_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Vector similarity search index
CREATE INDEX idx_nl_query_embeddings_vector 
ON nl_query_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_nl_query_embeddings_source_type ON nl_query_embeddings(source_type);
CREATE INDEX idx_nl_query_embeddings_source_id ON nl_query_embeddings(source_id);
CREATE INDEX idx_nl_query_embeddings_content_category ON nl_query_embeddings(content_category);
CREATE INDEX idx_nl_query_embeddings_security_domain ON nl_query_embeddings(security_domain);
CREATE INDEX idx_nl_query_embeddings_keywords ON nl_query_embeddings USING gin(keywords);
CREATE INDEX idx_nl_query_embeddings_entity_types ON nl_query_embeddings USING gin(entity_types);
```

### NL Query Templates Table
```sql
CREATE TABLE nl_query_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Template configuration
  parameters JSONB, -- Required parameters and their types
  required_context JSONB, -- Context requirements
  response_format JSONB, -- Expected response structure
  sample_queries JSONB, -- Example queries that match this template
  model_settings JSONB, -- AI model configuration
  
  -- Performance tracking
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  average_execution_time INTEGER,
  last_used TIMESTAMP,
  
  -- Template matching
  keywords TEXT[],
  entity_patterns TEXT[],
  intent_types VARCHAR(50)[],
  complexity_level VARCHAR(20) CHECK (complexity_level IN ('basic', 'intermediate', 'advanced')),
  
  -- SQL generation
  sql_template TEXT,
  table_dependencies VARCHAR(100)[],
  required_permissions VARCHAR(50)[],
  
  -- Quality assurance
  validation_rules JSONB,
  test_cases JSONB,
  documentation_link TEXT
);

CREATE INDEX idx_nl_query_templates_category ON nl_query_templates(category);
CREATE INDEX idx_nl_query_templates_is_active ON nl_query_templates(is_active);
CREATE INDEX idx_nl_query_templates_is_system ON nl_query_templates(is_system);
CREATE INDEX idx_nl_query_templates_keywords ON nl_query_templates USING gin(keywords);
CREATE INDEX idx_nl_query_templates_entity_patterns ON nl_query_templates USING gin(entity_patterns);
CREATE INDEX idx_nl_query_templates_intent_types ON nl_query_templates USING gin(intent_types);
CREATE INDEX idx_nl_query_templates_usage_count ON nl_query_templates(usage_count DESC);
```

### NL Query Context Sources Table
```sql
CREATE TABLE nl_query_context_sources (
  id SERIAL PRIMARY KEY,
  source_name VARCHAR(100) NOT NULL,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('database_table', 'documentation', 'api_endpoint', 'file_system', 'external_service')),
  configuration JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  refresh_frequency VARCHAR(50) DEFAULT 'daily' CHECK (refresh_frequency IN ('real_time', 'hourly', 'daily', 'weekly', 'monthly', 'manual')),
  last_indexed TIMESTAMP,
  embedding_count INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Access control
  required_permissions VARCHAR(50)[],
  allowed_user_roles VARCHAR(50)[],
  security_classification VARCHAR(20) DEFAULT 'unclassified',
  
  -- Data processing
  preprocessing_rules JSONB,
  chunk_size INTEGER DEFAULT 1000,
  overlap_size INTEGER DEFAULT 100,
  extraction_patterns JSONB,
  
  -- Quality metrics
  data_freshness_hours INTEGER,
  accuracy_score DECIMAL(3,2),
  reliability_score DECIMAL(3,2),
  
  -- Monitoring
  last_error_message TEXT,
  error_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  average_processing_time INTEGER,
  
  -- Integration settings
  connection_string TEXT,
  api_credentials JSONB,
  polling_interval INTEGER,
  batch_size INTEGER DEFAULT 100
);

CREATE INDEX idx_nl_query_context_sources_source_type ON nl_query_context_sources(source_type);
CREATE INDEX idx_nl_query_context_sources_is_active ON nl_query_context_sources(is_active);
CREATE INDEX idx_nl_query_context_sources_priority ON nl_query_context_sources(priority DESC);
CREATE INDEX idx_nl_query_context_sources_last_indexed ON nl_query_context_sources(last_indexed);
CREATE INDEX idx_nl_query_context_sources_refresh_frequency ON nl_query_context_sources(refresh_frequency);
```

### NL Query Feedback Table
```sql
CREATE TABLE nl_query_feedback (
  id SERIAL PRIMARY KEY,
  query_id INTEGER NOT NULL REFERENCES nl_query_history(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  feedback_category VARCHAR(50) CHECK (feedback_category IN ('accuracy', 'relevance', 'completeness', 'clarity', 'performance', 'suggestion')),
  feedback_tags JSONB,
  follow_up_query TEXT,
  additional_context JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Feedback analysis
  sentiment_score DECIMAL(3,2),
  sentiment_label VARCHAR(20) CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
  issue_severity VARCHAR(20) CHECK (issue_severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Resolution tracking
  is_resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,
  
  -- Quality improvement
  improvement_suggestions JSONB,
  training_data_candidate BOOLEAN DEFAULT false,
  model_retraining_flag BOOLEAN DEFAULT false,
  
  -- Administrative
  reviewed_by_admin BOOLEAN DEFAULT false,
  admin_notes TEXT,
  priority_level INTEGER DEFAULT 3 CHECK (priority_level BETWEEN 1 AND 5)
);

CREATE INDEX idx_nl_query_feedback_query_id ON nl_query_feedback(query_id);
CREATE INDEX idx_nl_query_feedback_user_id ON nl_query_feedback(user_id);
CREATE INDEX idx_nl_query_feedback_rating ON nl_query_feedback(rating);
CREATE INDEX idx_nl_query_feedback_category ON nl_query_feedback(feedback_category);
CREATE INDEX idx_nl_query_feedback_created_at ON nl_query_feedback(created_at DESC);
CREATE INDEX idx_nl_query_feedback_is_resolved ON nl_query_feedback(is_resolved);
CREATE INDEX idx_nl_query_feedback_severity ON nl_query_feedback(issue_severity);
```

## Service Layer Implementation

### Semantic NLQ Service (server/services/semanticNLQService.ts)
```typescript
import { BaseService } from './BaseService';
import { NlQueryHistory, QueryTemplate, EntitySynonym } from '../models/index';
import { WhereOptions, Op } from 'sequelize';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-4o";

export interface SemanticNLQOptions {
  query: string;
  userId?: number;
  context?: string;
  includeHistory?: boolean;
  maxResults?: number;
  confidenceThreshold?: number;
}

export interface QueryParseResult {
  sqlQuery: string;
  entities: string[];
  confidence: number;
  explanation: string;
  template?: any;
  contextSources?: string[];
  estimatedResults?: number;
}

export interface QueryExecutionResult {
  data: any[];
  metadata: {
    executionTime: number;
    queryComplexity: string;
    rowCount: number;
    columnsReturned: string[];
  };
  explanation: string;
  suggestions?: string[];
}

export class SemanticNLQService extends BaseService<any> {
  constructor() {
    super(NlQueryHistory);
  }

  /**
   * Main entry point for natural language query processing
   */
  async processNaturalLanguageQuery(options: SemanticNLQOptions): Promise<QueryExecutionResult> {
    const startTime = Date.now();
    const { query, userId } = options;

    try {
      // Step 1: Parse and understand the query
      const parseResult = await this.parseNaturalLanguageQuery(options);
      
      // Step 2: Retrieve relevant context using RAG
      const contextData = await this.retrieveRelevantContext(query, parseResult.entities);
      
      // Step 3: Execute the generated SQL query
      const queryResults = await this.executeQuery(parseResult.sqlQuery);
      
      // Step 4: Generate AI-enhanced explanation
      const explanation = await this.generateEnhancedExplanation(
        query, 
        queryResults, 
        contextData, 
        parseResult
      );
      
      // Step 5: Save query history
      if (userId) {
        await this.saveQueryHistory({
          query,
          sqlQuery: parseResult.sqlQuery,
          userId,
          executionTime: Date.now() - startTime,
          confidence: parseResult.confidence,
          results: queryResults
        });
      }

      return {
        data: queryResults,
        metadata: {
          executionTime: Date.now() - startTime,
          queryComplexity: this.assessQueryComplexity(parseResult.sqlQuery),
          rowCount: queryResults.length,
          columnsReturned: queryResults.length > 0 ? Object.keys(queryResults[0]) : []
        },
        explanation,
        suggestions: await this.generateFollowUpSuggestions(query, queryResults)
      };

    } catch (error) {
      console.error('Query processing error:', error);
      throw new Error(`Query processing failed: ${error.message}`);
    }
  }

  /**
   * Parse natural language query into structured format
   */
  async parseNaturalLanguageQuery(options: SemanticNLQOptions): Promise<QueryParseResult> {
    const { query, userId, context } = options;

    // Find matching query templates
    const templates = await this.findMatchingTemplates(query);
    
    // Extract entities from the query
    const entities = await this.extractEntities(query);
    
    // Generate SQL query using AI
    const sqlQuery = await this.generateSQLQueryWithAI(query, templates, entities, context);
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(query, templates, entities);
    
    // Generate explanation
    const explanation = this.generateBasicExplanation(query, entities, templates);

    return {
      sqlQuery,
      entities,
      confidence,
      explanation,
      template: templates.length > 0 ? templates[0] : null,
      contextSources: await this.identifyContextSources(entities),
      estimatedResults: await this.estimateResultCount(sqlQuery)
    };
  }

  /**
   * Generate SQL query using OpenAI with enhanced prompting
   */
  async generateSQLQueryWithAI(
    query: string, 
    templates: any[], 
    entities: string[], 
    context?: string
  ): Promise<string> {
    
    const systemPrompt = `You are an expert SQL query generator for a cybersecurity database system. 
Generate precise, optimized SQL queries based on natural language requests.

Database Schema Context:
- assets: id, name, asset_type, operating_system, ip_address, status, criticality
- asset_vulnerabilities: id, asset_id, plugin_id, plugin_name, severity, cvss_score, status, first_seen, last_seen
- ingestion_vulnerabilities: id, asset_id, plugin_name, severity, cvss_score, state, first_detected, last_detected
- compliance_controls: id, control_id, title, description, implementation_status, assessment_date
- poams: id, title, description, severity, status, due_date, assigned_to, created_date
- users: id, username, email, role, created_at

Guidelines:
1. Use proper JOIN clauses for multi-table queries
2. Include appropriate WHERE clauses for filtering
3. Use ORDER BY for meaningful sorting
4. Limit results appropriately (default LIMIT 100)
5. Handle aggregations (COUNT, AVG, SUM) correctly
6. Ensure queries are safe and performant
7. Return only the SQL query, no explanations`;

    const userPrompt = `Generate a SQL query for this request: "${query}"

Detected entities: ${entities.join(', ')}
${context ? `Additional context: ${context}` : ''}
${templates.length > 0 ? `Similar template: ${templates[0].description}` : ''}

SQL Query:`;

    try {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.1,
      });

      let sqlQuery = response.choices[0]?.message?.content?.trim() || '';
      
      // Clean up the SQL query
      sqlQuery = sqlQuery.replace(/```sql\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Basic SQL injection prevention
      if (this.containsSuspiciousPatterns(sqlQuery)) {
        throw new Error('Generated query contains suspicious patterns');
      }

      return sqlQuery;

    } catch (error) {
      console.error('AI SQL generation error:', error);
      // Fallback to template-based generation
      return this.generateFallbackSQL(query, entities);
    }
  }

  /**
   * Retrieve relevant context using RAG architecture
   */
  async retrieveRelevantContext(query: string, entities: string[]): Promise<any[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Find similar embeddings using vector search
      const similarEmbeddings = await this.findSimilarEmbeddings(queryEmbedding, entities);
      
      // Retrieve full context from similar embeddings
      const contextData = await this.retrieveContextFromEmbeddings(similarEmbeddings);
      
      return contextData;

    } catch (error) {
      console.error('Context retrieval error:', error);
      return [];
    }
  }

  /**
   * Generate enhanced explanation using AI and context
   */
  async generateEnhancedExplanation(
    originalQuery: string,
    queryResults: any[],
    contextData: any[],
    parseResult: QueryParseResult
  ): Promise<string> {
    
    const systemPrompt = `You are a cybersecurity expert providing clear, actionable explanations of security data analysis results.
Provide comprehensive explanations that help security professionals understand the implications of their queries.

Focus on:
1. What the data shows
2. Security implications
3. Recommended actions
4. Context from security best practices`;

    const userPrompt = `User asked: "${originalQuery}"

Query results summary:
- Total records: ${queryResults.length}
- Key findings: ${this.summarizeResults(queryResults)}

SQL used: ${parseResult.sqlQuery}

Provide a clear, professional explanation of these results and their security implications:`;

    try {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      return response.choices[0]?.message?.content?.trim() || 'Analysis completed successfully.';

    } catch (error) {
      console.error('Explanation generation error:', error);
      return this.generateFallbackExplanation(originalQuery, queryResults);
    }
  }

  /**
   * Generate follow-up suggestions
   */
  async generateFollowUpSuggestions(query: string, results: any[]): Promise<string[]> {
    const suggestions: string[] = [];

    // Analyze results to suggest follow-ups
    if (results.length === 0) {
      suggestions.push("Try broadening your search criteria");
      suggestions.push("Check if the data exists in the system");
    } else if (results.length > 50) {
      suggestions.push("Consider filtering by date range");
      suggestions.push("Focus on specific severity levels");
    }

    // Entity-based suggestions
    if (query.toLowerCase().includes('vulnerability')) {
      suggestions.push("Show vulnerability trends over time");
      suggestions.push("Find assets with similar vulnerabilities");
    }

    if (query.toLowerCase().includes('asset')) {
      suggestions.push("Check compliance status for these assets");
      suggestions.push("Review recent security assessments");
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Execute SQL query safely
   */
  async executeQuery(sqlQuery: string): Promise<any[]> {
    // Add safety checks and execution logic
    // This would integrate with your database service
    
    try {
      // Validate query safety
      if (!this.isQuerySafe(sqlQuery)) {
        throw new Error('Query failed safety validation');
      }

      // Execute query (implement based on your database service)
      const results = await this.executeSQLQuery(sqlQuery);
      
      return results;

    } catch (error) {
      console.error('Query execution error:', error);
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  /**
   * Find matching templates based on query content
   */
  async findMatchingTemplates(query: string) {
    const queryLower = query.toLowerCase();
    
    return await QueryTemplate.findAll({
      where: {
        [Op.and]: [
          { is_active: true },
          {
            [Op.or]: [
              { keywords: { [Op.overlap]: queryLower.split(' ') } },
              { description: { [Op.iLike]: `%${queryLower}%` } }
            ]
          }
        ]
      },
      order: [['usage_count', 'DESC'], ['created_at', 'DESC']],
      limit: 5
    });
  }

  /**
   * Extract entities from query using NLP patterns
   */
  async extractEntities(query: string): Promise<string[]> {
    const queryLower = query.toLowerCase();
    const entities: string[] = [];

    // Security domain patterns
    const patterns = {
      vulnerability: /\b(vulnerability|vulnerabilities|vuln|vulns|cve|exploit|weakness)\b/i,
      asset: /\b(asset|assets|system|systems|server|servers|device|devices|host|hosts)\b/i,
      poam: /\b(poam|poams|plan of action|milestone|milestones|remediation)\b/i,
      compliance: /\b(compliance|control|controls|nist|fisma|fedramp|sox|hipaa)\b/i,
      risk: /\b(risk|risks|score|rating|critical|high|medium|low|severity)\b/i,
      user: /\b(user|users|account|accounts|identity|identities)\b/i,
      network: /\b(network|networks|ip|subnet|port|protocol)\b/i,
      incident: /\b(incident|incidents|event|events|alert|alerts)\b/i
    };

    Object.entries(patterns).forEach(([entity, pattern]) => {
      if (pattern.test(query) && !entities.includes(entity)) {
        entities.push(entity);
      }
    });

    // Extract specific values
    const specificPatterns = {
      severity_levels: /\b(critical|high|medium|low)\b/gi,
      cvss_scores: /\bcvss\s*[\:\=]?\s*(\d+\.?\d*)\b/gi,
      dates: /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/gi,
      ip_addresses: /\b(?:\d{1,3}\.){3}\d{1,3}\b/gi
    };

    Object.entries(specificPatterns).forEach(([type, pattern]) => {
      const matches = query.match(pattern);
      if (matches) {
        entities.push(`${type}:${matches.join(',')}`);
      }
    });

    return entities;
  }

  /**
   * Calculate confidence score for query parsing
   */
  calculateConfidence(query: string, templates: any[], entities: string[]): number {
    let confidence = 0.5; // Base confidence

    // Template match bonus
    if (templates.length > 0) {
      confidence += 0.3;
    }

    // Entity recognition bonus
    confidence += Math.min(entities.length * 0.1, 0.3);

    // Query clarity bonus
    if (this.isQueryClear(query)) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate embedding for text using OpenAI
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });

      return response.data[0].embedding;

    } catch (error) {
      console.error('Embedding generation error:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Find similar embeddings using vector search
   */
  async findSimilarEmbeddings(queryEmbedding: number[], entities: string[], limit: number = 10): Promise<any[]> {
    // This would use pgvector for similarity search
    // Implementation depends on your database service setup
    
    const embeddingVector = `[${queryEmbedding.join(',')}]`;
    
    const query = `
      SELECT id, text_fragment, source_type, source_id, metadata,
             1 - (embedding <=> $1::vector) as similarity
      FROM nl_query_embeddings
      WHERE is_active = true
        AND (source_type = ANY($2) OR entity_types && $3)
      ORDER BY similarity DESC
      LIMIT $4
    `;

    try {
      // Execute vector similarity search
      const results = await this.executeRawSQL(query, [
        embeddingVector,
        this.mapEntitiesToSourceTypes(entities),
        entities,
        limit
      ]);

      return results;

    } catch (error) {
      console.error('Similarity search error:', error);
      return [];
    }
  }

  /**
   * Helper methods for query processing
   */
  private containsSuspiciousPatterns(sql: string): boolean {
    const suspiciousPatterns = [
      /drop\s+table/i,
      /delete\s+from/i,
      /truncate/i,
      /alter\s+table/i,
      /create\s+table/i,
      /insert\s+into/i,
      /update\s+.*set/i,
      /exec\s*\(/i,
      /xp_/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(sql));
  }

  private isQuerySafe(sql: string): boolean {
    // Implement comprehensive SQL safety checks
    const allowedStartWords = ['select', 'with'];
    const trimmedSQL = sql.trim().toLowerCase();
    
    return allowedStartWords.some(word => trimmedSQL.startsWith(word));
  }

  private isQueryClear(query: string): boolean {
    // Simple heuristics for query clarity
    return query.length > 10 && 
           query.includes(' ') && 
           !query.includes('?') &&
           query.split(' ').length >= 3;
  }

  private assessQueryComplexity(sql: string): string {
    const joinCount = (sql.match(/join/gi) || []).length;
    const subqueryCount = (sql.match(/\(/g) || []).length;
    
    if (joinCount >= 3 || subqueryCount >= 2) return 'complex';
    if (joinCount >= 1 || subqueryCount >= 1) return 'medium';
    return 'simple';
  }

  private summarizeResults(results: any[]): string {
    if (results.length === 0) return 'No results found';
    
    const sampleKeys = Object.keys(results[0]);
    const summary = sampleKeys.slice(0, 3).map(key => {
      const values = results.map(r => r[key]).filter(v => v !== null);
      return `${key}: ${values.length} values`;
    }).join(', ');

    return summary;
  }

  private generateFallbackExplanation(query: string, results: any[]): string {
    return `Found ${results.length} results for your query "${query}". ${
      results.length > 0 
        ? 'Review the data above for relevant information.' 
        : 'Try refining your search criteria or check data availability.'
    }`;
  }

  /**
   * Query history management
   */
  async getQueryHistory(userId: number, limit: number = 10) {
    return await NlQueryHistory.findAll({
      where: { userId },
      order: [['created_at', 'DESC']],
      limit,
      attributes: ['id', 'query_text', 'status', 'execution_time_ms', 'created_at', 'confidence_score']
    });
  }

  async getPopularQueries(limit: number = 10) {
    return await NlQueryHistory.findAll({
      attributes: [
        'query_text', 
        [NlQueryHistory.sequelize!.fn('COUNT', '*'), 'frequency'],
        [NlQueryHistory.sequelize!.fn('AVG', NlQueryHistory.sequelize!.col('confidence_score')), 'avg_confidence']
      ],
      group: ['query_text'],
      order: [[NlQueryHistory.sequelize!.literal('frequency'), 'DESC']],
      limit,
      where: {
        status: 'completed'
      }
    });
  }

  async createQueryTemplate(templateData: any) {
    return await QueryTemplate.create({
      ...templateData,
      usage_count: 0,
      success_rate: 0.0
    });
  }

  async updateQueryTemplate(id: number, updates: any) {
    return await QueryTemplate.update(updates, {
      where: { id }
    });
  }

  /**
   * Save query execution to history
   */
  private async saveQueryHistory(data: {
    query: string;
    sqlQuery: string;
    userId: number;
    executionTime: number;
    confidence: number;
    results: any[];
  }) {
    return await NlQueryHistory.create({
      user_id: data.userId,
      query_text: data.query,
      processed_query: data.sqlQuery,
      status: 'completed',
      execution_time_ms: data.executionTime,
      confidence_score: data.confidence,
      result_count: data.results.length,
      query_complexity: this.assessQueryComplexity(data.sqlQuery),
      model_used: DEFAULT_MODEL,
      response: {
        row_count: data.results.length,
        execution_successful: true
      }
    });
  }
}

export const semanticNLQ = new SemanticNLQService();
export default SemanticNLQService;
```

## API Routes Implementation

### NL Query Routes (server/routes/nlQueryRoutes.ts)
```typescript
import { Router } from 'express';
import { z } from 'zod';
import { semanticNLQ } from '../services/semanticNLQService';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Validation schemas
const querySchema = z.object({
  query: z.string().min(1).max(1000),
  context: z.string().optional(),
  includeHistory: z.boolean().default(false),
  maxResults: z.number().min(1).max(1000).default(100),
  confidenceThreshold: z.number().min(0).max(1).default(0.5)
});

const feedbackSchema = z.object({
  queryId: z.number(),
  rating: z.number().min(1).max(5),
  feedbackText: z.string().optional(),
  category: z.enum(['accuracy', 'relevance', 'completeness', 'clarity', 'performance', 'suggestion']),
  tags: z.array(z.string()).optional(),
  followUpQuery: z.string().optional()
});

const templateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  promptTemplate: z.string().min(1),
  category: z.string(),
  parameters: z.record(z.any()).optional(),
  sqlTemplate: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  entityPatterns: z.array(z.string()).optional()
});

/**
 * POST /api/nl-query
 * Process natural language query
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const validatedData = querySchema.parse(req.body);
    
    const result = await semanticNLQ.processNaturalLanguageQuery({
      ...validatedData,
      userId: req.user?.id
    });

    res.json({
      status: 'success',
      data_result: result.data,
      generated_response: result.explanation,
      metadata: result.metadata,
      suggestions: result.suggestions,
      execution_time_ms: result.metadata.executionTime
    });

  } catch (error) {
    console.error('NL Query processing error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        error: 'Validation failed',
        details: error.errors
      });
    }

    res.status(500).json({
      status: 'error',
      error: 'Query processing failed',
      message: error.message
    });
  }
});

/**
 * GET /api/nl-query/history
 * Get user's query history
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { limit = '10', page = '1' } = req.query;
    const limitNum = parseInt(limit as string, 10);
    const pageNum = parseInt(page as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const history = await semanticNLQ.getQueryHistory(
      req.user!.id,
      limitNum,
      offset
    );

    res.json({
      status: 'success',
      data: history,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: history.length
      }
    });

  } catch (error) {
    console.error('Query history fetch error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch query history'
    });
  }
});

/**
 * GET /api/nl-query/templates
 * Get available query templates
 */
router.get('/templates', requireAuth, async (req, res) => {
  try {
    const { category, isSystem } = req.query;
    
    const templates = await semanticNLQ.getQueryTemplates({
      category: category as string,
      isSystem: isSystem === 'true'
    });

    res.json({
      status: 'success',
      data: templates
    });

  } catch (error) {
    console.error('Templates fetch error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch templates'
    });
  }
});

/**
 * POST /api/nl-query/templates
 * Create new query template
 */
router.post('/templates', requireAuth, async (req, res) => {
  try {
    const validatedData = templateSchema.parse(req.body);
    
    const template = await semanticNLQ.createQueryTemplate({
      ...validatedData,
      createdBy: req.user!.id
    });

    res.status(201).json({
      status: 'success',
      data: template
    });

  } catch (error) {
    console.error('Template creation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        error: 'Validation failed',
        details: error.errors
      });
    }

    res.status(500).json({
      status: 'error',
      error: 'Failed to create template'
    });
  }
});

/**
 * PUT /api/nl-query/templates/:id
 * Update query template
 */
router.put('/templates/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const validatedData = templateSchema.partial().parse(req.body);
    
    const template = await semanticNLQ.updateQueryTemplate(id, validatedData);
    
    if (!template) {
      return res.status(404).json({
        status: 'error',
        error: 'Template not found'
      });
    }

    res.json({
      status: 'success',
      data: template
    });

  } catch (error) {
    console.error('Template update error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to update template'
    });
  }
});

/**
 * POST /api/nl-query/feedback
 * Submit query feedback
 */
router.post('/feedback', requireAuth, async (req, res) => {
  try {
    const validatedData = feedbackSchema.parse(req.body);
    
    const feedback = await semanticNLQ.submitFeedback({
      ...validatedData,
      userId: req.user!.id
    });

    res.status(201).json({
      status: 'success',
      data: feedback
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        error: 'Validation failed',
        details: error.errors
      });
    }

    res.status(500).json({
      status: 'error',
      error: 'Failed to submit feedback'
    });
  }
});

/**
 * GET /api/nl-query/popular
 * Get popular queries
 */
router.get('/popular', requireAuth, async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    
    const popularQueries = await semanticNLQ.getPopularQueries(
      parseInt(limit as string, 10)
    );

    res.json({
      status: 'success',
      data: popularQueries
    });

  } catch (error) {
    console.error('Popular queries fetch error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch popular queries'
    });
  }
});

/**
 * GET /api/nl-query/analytics
 * Get query analytics and metrics
 */
router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    const analytics = await semanticNLQ.getQueryAnalytics({
      timeRange: timeRange as string,
      userId: req.user!.id
    });

    res.json({
      status: 'success',
      data: analytics
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch analytics'
    });
  }
});

/**
 * POST /api/nl-query/embeddings/refresh
 * Refresh embeddings from data sources
 */
router.post('/embeddings/refresh', requireAuth, async (req, res) => {
  try {
    const { sourceType } = req.body;
    
    const result = await semanticNLQ.refreshEmbeddings(sourceType);

    res.json({
      status: 'success',
      data: result,
      message: 'Embeddings refresh initiated'
    });

  } catch (error) {
    console.error('Embeddings refresh error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to refresh embeddings'
    });
  }
});

export default router;
```

## UI Components Implementation

### Query Interface Component (client/src/components/nl-query/QueryInterface.tsx)
```typescript
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Search, AlertCircle, Loader2, ThumbsUp, ThumbsDown, Star, History, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QueryResult {
  data_result: any[];
  generated_response: string;
  metadata: {
    executionTime: number;
    queryComplexity: string;
    rowCount: number;
    columnsReturned: string[];
  };
  suggestions?: string[];
}

interface QueryHistoryItem {
  id: number;
  query_text: string;
  status: string;
  execution_time_ms: number;
  confidence_score: number;
  created_at: string;
}

interface QueryTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  sample_queries: string[];
  usage_count: number;
}

const QueryInterface: React.FC = () => {
  const [queryText, setQueryText] = useState("");
  const [currentTab, setCurrentTab] = useState("query");
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [selectedQueryResult, setSelectedQueryResult] = useState<QueryResult | null>(null);
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    category: 'accuracy',
    feedbackText: '',
    followUpQuery: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query history
  const { data: queryHistory = [], isLoading: isHistoryLoading } = useQuery<QueryHistoryItem[]>({
    queryKey: ["/api/nl-query/history"],
    enabled: currentTab === "history",
  });

  // Templates
  const { data: templates = [], isLoading: isTemplatesLoading } = useQuery<QueryTemplate[]>({
    queryKey: ["/api/nl-query/templates"],
    enabled: currentTab === "templates",
  });

  // Popular queries
  const { data: popularQueries = [] } = useQuery({
    queryKey: ["/api/nl-query/popular"],
    enabled: currentTab === "suggestions",
  });

  // Execute query mutation
  const executeQueryMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch("/api/nl-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nl-query/history"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Query Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: any) => {
      const response = await fetch("/api/nl-query/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
      setShowFeedbackDialog(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    
    executeQueryMutation.mutate(queryText.trim());
  };

  const handleHistoryItemClick = (item: QueryHistoryItem) => {
    setQueryText(item.query_text);
    setCurrentTab("query");
  };

  const handleTemplateClick = (template: QueryTemplate) => {
    if (template.sample_queries?.length > 0) {
      setQueryText(template.sample_queries[0]);
    }
    setCurrentTab("query");
  };

  const handleFeedbackSubmit = () => {
    if (selectedQueryResult) {
      submitFeedbackMutation.mutate({
        queryId: executeQueryMutation.data?.queryId || 0,
        ...feedbackData
      });
    }
  };

  const openFeedbackDialog = (result: QueryResult) => {
    setSelectedQueryResult(result);
    setShowFeedbackDialog(true);
  };

  const renderDataTable = (data: any[]) => {
    if (!data || data.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No results found</p>
        </div>
      );
    }

    const columns = Object.keys(data[0]);
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="bg-muted/50">
              {columns.map((column) => (
                <th key={column} className="p-3 text-left border border-border font-medium">
                  {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                {columns.map((column) => (
                  <td key={column} className="p-3 border border-border">
                    {typeof row[column] === "object" 
                      ? JSON.stringify(row[column]) 
                      : row[column] === null || row[column] === undefined 
                        ? "-" 
                        : String(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const getComplexityBadge = (complexity: string) => {
    const variants = {
      simple: "default",
      medium: "secondary",
      complex: "destructive"
    };
    
    return (
      <Badge variant={variants[complexity as keyof typeof variants] || "default"}>
        {complexity}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="query">
            <Search className="mr-2 h-4 w-4" />
            Query
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Lightbulb className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            <Star className="mr-2 h-4 w-4" />
            Popular
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="query" className="space-y-6">
          {/* Query Input */}
          <Card>
            <CardHeader>
              <CardTitle>Ask a Question</CardTitle>
              <CardDescription>
                Ask questions about your security data in plain English
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder="e.g., How many critical vulnerabilities do we have?"
                    className="flex-1"
                    disabled={executeQueryMutation.isPending}
                  />
                  <Button 
                    type="submit" 
                    disabled={executeQueryMutation.isPending || !queryText.trim()}
                  >
                    {executeQueryMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {executeQueryMutation.isPending ? "Processing..." : "Ask"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Query Results */}
          {executeQueryMutation.data && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Results</CardTitle>
                  <div className="flex items-center space-x-2">
                    {getComplexityBadge(executeQueryMutation.data.metadata?.queryComplexity || 'simple')}
                    <Badge variant="outline">
                      {executeQueryMutation.data.metadata?.executionTime}ms
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openFeedbackDialog(executeQueryMutation.data)}
                    >
                      <ThumbsUp className="mr-1 h-3 w-3" />
                      Feedback
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AI Explanation */}
                {executeQueryMutation.data.generated_response && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Analysis</AlertTitle>
                    <AlertDescription className="mt-2">
                      {executeQueryMutation.data.generated_response}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Data Table */}
                {renderDataTable(executeQueryMutation.data.data_result)}

                {/* Metadata */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {executeQueryMutation.data.metadata?.rowCount || 0} results found
                  </span>
                  <span>
                    Columns: {executeQueryMutation.data.metadata?.columnsReturned?.join(', ') || 'N/A'}
                  </span>
                </div>

                {/* Suggestions */}
                {executeQueryMutation.data.suggestions && executeQueryMutation.data.suggestions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Suggested follow-up questions:</h4>
                    <div className="space-y-1">
                      {executeQueryMutation.data.suggestions.map((suggestion: string, index: number) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="text-left justify-start h-auto p-2"
                          onClick={() => setQueryText(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {executeQueryMutation.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Query Failed</AlertTitle>
              <AlertDescription>
                {executeQueryMutation.error.message}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query History</CardTitle>
              <CardDescription>
                Your recent queries and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isHistoryLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : queryHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No query history found
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {queryHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleHistoryItemClick(item)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{item.query_text}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant={item.status === 'completed' ? 'default' : 'destructive'}>
                              {item.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {item.execution_time_ms}ms
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Confidence: {(item.confidence_score * 100).toFixed(0)}%</span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query Templates</CardTitle>
              <CardDescription>
                Pre-built queries for common security scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isTemplatesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No templates available
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleTemplateClick(template)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{template.name}</CardTitle>
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          {template.description}
                        </p>
                        {template.sample_queries && template.sample_queries.length > 0 && (
                          <p className="text-xs text-blue-600 font-mono">
                            "{template.sample_queries[0]}"
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span>Used {template.usage_count} times</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Popular Queries</CardTitle>
              <CardDescription>
                Frequently asked questions by users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {popularQueries.map((query: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setQueryText(query.query_text);
                      setCurrentTab("query");
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{query.query_text}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {query.frequency} uses
                        </Badge>
                        <Badge variant="outline">
                          {(query.avg_confidence * 100).toFixed(0)}% avg confidence
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Query Feedback</DialogTitle>
            <DialogDescription>
              Help us improve by rating this query result
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rating</label>
              <Select 
                value={feedbackData.rating.toString()} 
                onValueChange={(value) => setFeedbackData({...feedbackData, rating: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 - Excellent</SelectItem>
                  <SelectItem value="4">4 - Good</SelectItem>
                  <SelectItem value="3">3 - Average</SelectItem>
                  <SelectItem value="2">2 - Poor</SelectItem>
                  <SelectItem value="1">1 - Very Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select 
                value={feedbackData.category} 
                onValueChange={(value) => setFeedbackData({...feedbackData, category: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accuracy">Accuracy</SelectItem>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="completeness">Completeness</SelectItem>
                  <SelectItem value="clarity">Clarity</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Comments</label>
              <Textarea
                value={feedbackData.feedbackText}
                onChange={(e) => setFeedbackData({...feedbackData, feedbackText: e.target.value})}
                placeholder="Optional feedback..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFeedbackSubmit} disabled={submitFeedbackMutation.isPending}>
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QueryInterface;
```

## System Features

### Advanced Query Processing
- **Multi-Step Analysis**: Complex query decomposition and step-by-step processing
- **Context-Aware Generation**: Integration of historical data, organizational context, and security domain knowledge
- **Intelligent Fallbacks**: Graceful degradation when AI services are unavailable
- **Performance Optimization**: Query caching, result memoization, and execution optimization

### RAG Architecture Implementation
- **Vector Database**: pgvector-powered semantic search with 1536-dimensional embeddings
- **Context Sources**: Multiple data source integration (documentation, policies, vulnerability data)
- **Embedding Management**: Automated embedding generation, refresh, and lifecycle management
- **Similarity Search**: Advanced vector similarity matching with configurable thresholds

### User Experience Features
- **Real-Time Processing**: Streaming responses and progressive result loading
- **Conversation Memory**: Session-based context preservation for follow-up queries
- **Visual Analytics**: Charts, graphs, and data visualizations based on query results
- **Export Capabilities**: PDF, CSV, and JSON export options for query results

### Enterprise Integration
- **Role-Based Access**: Query permissions based on user roles and data sensitivity
- **Audit Logging**: Comprehensive logging of all queries, results, and user interactions
- **API Integration**: RESTful APIs for programmatic access and third-party integrations
- **Performance Monitoring**: Real-time monitoring of query performance and system health

## Security & Performance Requirements

### Security Features
- **Input Validation**: Comprehensive SQL injection prevention and input sanitization
- **Access Control**: Role-based permissions for data access and query capabilities
- **Data Privacy**: Sensitive data masking and PII protection in query results
- **Audit Trails**: Complete audit logging for compliance and security monitoring

### Performance Optimizations
- **Query Caching**: Redis-based caching for frequently executed queries
- **Vector Indexing**: Optimized pgvector indexes for fast similarity search
- **Connection Pooling**: Database connection optimization for high concurrency
- **Rate Limiting**: API rate limiting and abuse prevention

### Scalability Considerations
- **Horizontal Scaling**: Support for multiple application instances with shared state
- **Database Optimization**: Query optimization and index tuning for large datasets
- **AI Service Management**: Load balancing and fallback strategies for AI providers
- **Resource Management**: Memory and CPU optimization for vector operations

## Integration Points

### AI Service Integration
- **OpenAI API**: GPT-4o for query understanding and response generation
- **Embedding Services**: text-embedding-ada-002 for vector generation
- **Model Management**: Support for multiple AI providers and model selection
- **Cost Optimization**: Token usage tracking and cost management

### Data Source Integration
- **Database Connectivity**: PostgreSQL with pgvector extension support
- **Document Processing**: Integration with document management systems
- **API Connectors**: REST and GraphQL API integration for external data sources
- **Real-Time Feeds**: Support for streaming data sources and real-time updates

### External System Integration
- **SIEM Platforms**: Integration with security information and event management systems
- **GRC Tools**: Governance, risk, and compliance platform connectivity
- **Identity Providers**: SSO and identity management system integration
- **Notification Services**: Email, Slack, Teams integration for alerts and reports

This comprehensive documentation provides complete technical specifications for recreating the Natural Language Query Interface system in any compatible environment, maintaining consistency with the established documentation pattern for enterprise-grade system portability.