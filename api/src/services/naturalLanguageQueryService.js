const { db } = require('../db');
const { 
  nlQueries, 
  queryTemplates,
  vulnerabilities,
  assets,
  poams,
  controls,
  cves,
  assetVulnerabilities
} = require('../db/schema');
const { eq, and, gte, lte, desc, asc, sql, or, like, ilike, count, sum } = require('drizzle-orm');

class NaturalLanguageQueryService {

  // ==================== CORE NL PROCESSING ====================

  /**
   * Process natural language query with conversational AI
   */
  async processNaturalLanguageQuery(queryText, userId, conversationContext = {}) {
    try {
      console.log('🤖 Processing natural language query:', queryText);

      // Create initial query record
      const [queryRecord] = await db.insert(nlQueries).values({
        query: queryText,
        userId: userId,
        status: 'processing',
        metadata: {
          conversationContext,
          processingStarted: new Date().toISOString()
        }
      }).returning();

      // Step 1: Intent Classification and Entity Extraction
      const nlpAnalysis = await this._analyzeQuery(queryText, conversationContext);
      
      // Step 2: Generate SQL based on intent and entities
      const sqlGeneration = await this._generateSQL(nlpAnalysis, conversationContext);
      
      // Step 3: Execute query and get results
      const queryResults = await this._executeQuery(sqlGeneration.sql, sqlGeneration.parameters);
      
      // Step 4: Format results for conversational response
      const conversationalResponse = await this._formatConversationalResponse(
        queryResults, 
        nlpAnalysis, 
        conversationContext
      );

      // Step 5: Update query record with results
      await db.update(nlQueries)
        .set({
          status: 'completed',
          queryType: nlpAnalysis.queryType,
          intent: nlpAnalysis.intent,
          entities: nlpAnalysis.entities,
          sqlQuery: sqlGeneration.sql,
          results: {
            data: queryResults.data,
            summary: queryResults.summary,
            conversationalResponse: conversationalResponse
          },
          resultCount: queryResults.data?.length || 0,
          executionTime: queryResults.executionTime,
          confidence: nlpAnalysis.confidence,
          metadata: {
            ...queryRecord.metadata,
            nlpAnalysis,
            sqlGeneration,
            processingCompleted: new Date().toISOString()
          }
        })
        .where(eq(nlQueries.id, queryRecord.id));

      return {
        queryId: queryRecord.id,
        conversationalResponse,
        data: queryResults.data,
        summary: queryResults.summary,
        confidence: nlpAnalysis.confidence,
        suggestedFollowUps: this._generateFollowUpSuggestions(nlpAnalysis, queryResults),
        executionTime: queryResults.executionTime
      };

    } catch (error) {
      console.error('Error processing natural language query:', error);
      
      // Update query record with error
      if (queryRecord?.id) {
        await db.update(nlQueries)
          .set({
            status: 'failed',
            errorMessage: error.message,
            metadata: {
              ...queryRecord.metadata,
              error: error.stack,
              processingFailed: new Date().toISOString()
            }
          })
          .where(eq(nlQueries.id, queryRecord.id));
      }
      
      throw error;
    }
  }

  /**
   * Continue multi-turn conversation
   */
  async continueConversation(followUpQuery, originalQueryId, userId) {
    try {
      // Get original query context
      const [originalQuery] = await db.select()
        .from(nlQueries)
        .where(eq(nlQueries.id, originalQueryId))
        .limit(1);

      if (!originalQuery) {
        throw new Error('Original query not found');
      }

      // Build conversation context
      const conversationContext = {
        previousQuery: originalQuery.query,
        previousIntent: originalQuery.intent,
        previousEntities: originalQuery.entities,
        previousResults: originalQuery.results,
        conversationId: originalQueryId,
        turnNumber: (originalQuery.metadata?.turnNumber || 0) + 1
      };

      // Process follow-up query with context
      return await this.processNaturalLanguageQuery(followUpQuery, userId, conversationContext);

    } catch (error) {
      console.error('Error continuing conversation:', error);
      throw error;
    }
  }

  // ==================== NLP ANALYSIS ====================

  async _analyzeQuery(queryText, conversationContext) {
    // Intent classification based on keywords and patterns
    const intent = this._classifyIntent(queryText, conversationContext);
    const queryType = this._determineQueryType(intent, queryText);
    const entities = this._extractEntities(queryText, conversationContext);
    const confidence = this._calculateConfidence(intent, entities, queryText);

    return {
      intent,
      queryType,
      entities,
      confidence,
      analysisMethod: 'rule_based_nlp',
      contextAware: Object.keys(conversationContext).length > 0
    };
  }

  _classifyIntent(queryText, conversationContext) {
    const text = queryText.toLowerCase();
    
    // Vulnerability-related intents
    if (text.includes('vulnerabilit') || text.includes('cve') || text.includes('exploit')) {
      if (text.includes('critical') || text.includes('high')) return 'find_critical_vulnerabilities';
      if (text.includes('trend') || text.includes('over time')) return 'vulnerability_trends';
      if (text.includes('affect') || text.includes('impact')) return 'vulnerability_impact';
      return 'general_vulnerability_query';
    }
    
    // Compliance-related intents
    if (text.includes('complian') || text.includes('nist') || text.includes('control')) {
      if (text.includes('status') || text.includes('current')) return 'compliance_status';
      if (text.includes('gap') || text.includes('missing')) return 'compliance_gaps';
      return 'general_compliance_query';
    }
    
    // Risk-related intents
    if (text.includes('risk') || text.includes('threat')) {
      if (text.includes('highest') || text.includes('most') || text.includes('top')) return 'highest_risk_assets';
      if (text.includes('assess') || text.includes('analysis')) return 'risk_assessment';
      return 'general_risk_query';
    }
    
    // POAM-related intents
    if (text.includes('poam') || text.includes('remediation') || text.includes('milestone')) {
      if (text.includes('due') || text.includes('overdue')) return 'poam_status';
      if (text.includes('progress') || text.includes('completion')) return 'poam_progress';
      return 'general_poam_query';
    }
    
    // Asset-related intents
    if (text.includes('asset') || text.includes('system') || text.includes('server')) {
      if (text.includes('web server') || text.includes('web')) return 'web_server_query';
      if (text.includes('critical') || text.includes('important')) return 'critical_assets';
      return 'general_asset_query';
    }
    
    // Trend analysis
    if (text.includes('trend') || text.includes('over time') || text.includes('quarter') || text.includes('month')) {
      return 'trend_analysis';
    }
    
    // Default intent
    return 'general_inquiry';
  }

  _determineQueryType(intent, queryText) {
    const intentToTypeMap = {
      'find_critical_vulnerabilities': 'vulnerability_report',
      'vulnerability_trends': 'vulnerability_report',
      'vulnerability_impact': 'vulnerability_report',
      'general_vulnerability_query': 'vulnerability_report',
      'compliance_status': 'compliance_check',
      'compliance_gaps': 'compliance_check',
      'general_compliance_query': 'compliance_check',
      'highest_risk_assets': 'risk_assessment',
      'risk_assessment': 'risk_assessment',
      'general_risk_query': 'risk_assessment',
      'poam_status': 'compliance_check',
      'poam_progress': 'compliance_check',
      'general_poam_query': 'compliance_check',
      'web_server_query': 'asset_search',
      'critical_assets': 'asset_search',
      'general_asset_query': 'asset_search',
      'trend_analysis': 'operational_metrics'
    };
    
    return intentToTypeMap[intent] || 'general_query';
  }

  _extractEntities(queryText, conversationContext) {
    const entities = {};
    const text = queryText.toLowerCase();
    
    // Extract severity levels
    const severities = ['critical', 'high', 'medium', 'low'];
    entities.severities = severities.filter(severity => text.includes(severity));
    
    // Extract asset types
    const assetTypes = ['web server', 'database', 'workstation', 'server', 'network device'];
    entities.assetTypes = assetTypes.filter(type => text.includes(type));
    
    // Extract time periods
    if (text.includes('month')) entities.timePeriod = 'month';
    if (text.includes('quarter')) entities.timePeriod = 'quarter';
    if (text.includes('year')) entities.timePeriod = 'year';
    if (text.includes('week')) entities.timePeriod = 'week';
    
    // Extract compliance frameworks
    const frameworks = ['nist', 'iso', 'sox', 'pci', 'hipaa'];
    entities.frameworks = frameworks.filter(framework => text.includes(framework));
    
    // Extract numbers and quantities
    const numberMatch = text.match(/\b(\d+)\b/);
    if (numberMatch) entities.quantity = parseInt(numberMatch[1]);
    
    // Use context from previous queries
    if (conversationContext.previousEntities) {
      entities.contextual = conversationContext.previousEntities;
    }
    
    return entities;
  }

  _calculateConfidence(intent, entities, queryText) {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence for specific intents
    if (intent !== 'general_inquiry') confidence += 0.2;
    
    // Increase confidence for extracted entities
    const entityCount = Object.keys(entities).filter(key => 
      entities[key] && (Array.isArray(entities[key]) ? entities[key].length > 0 : true)
    ).length;
    confidence += Math.min(entityCount * 0.1, 0.3);
    
    // Increase confidence for longer, more specific queries
    if (queryText.length > 50) confidence += 0.1;
    if (queryText.length > 100) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  // ==================== SQL GENERATION ====================

  async _generateSQL(nlpAnalysis, conversationContext) {
    const { intent, entities, queryType } = nlpAnalysis;
    
    try {
      // Try to find matching template first
      const template = await this._findMatchingTemplate(intent, queryType, entities);
      
      if (template) {
        return this._generateSQLFromTemplate(template, entities, conversationContext);
      }
      
      // Generate SQL based on intent
      return this._generateSQLFromIntent(intent, entities, conversationContext);
      
    } catch (error) {
      console.error('Error generating SQL:', error);
      throw new Error(`Failed to generate SQL query: ${error.message}`);
    }
  }

  async _findMatchingTemplate(intent, queryType, entities) {
    // Look for templates that match the query type and intent
    const templates = await db.select()
      .from(queryTemplates)
      .where(eq(queryTemplates.category, queryType))
      .orderBy(desc(queryTemplates.createdAt));
    
    // Simple template matching - in production, this would be more sophisticated
    for (const template of templates) {
      if (template.name.includes(intent.split('_')[0]) || 
          template.description.toLowerCase().includes(intent.replace('_', ' '))) {
        return template;
      }
    }
    
    return null;
  }

  _generateSQLFromTemplate(template, entities, conversationContext) {
    // Extract parameters from entities and context
    const parameters = this._extractParametersFromEntities(entities, template.parameters);
    
    return {
      sql: template.queryText,
      parameters,
      method: 'template_based',
      templateId: template.id,
      templateName: template.name
    };
  }

  _generateSQLFromIntent(intent, entities, conversationContext) {
    switch (intent) {
      case 'find_critical_vulnerabilities':
        return this._generateCriticalVulnerabilitiesSQL(entities);
      
      case 'compliance_status':
        return this._generateComplianceStatusSQL(entities);
      
      case 'highest_risk_assets':
        return this._generateHighestRiskAssetsSQL(entities);
      
      case 'poam_status':
        return this._generatePOAMStatusSQL(entities);
      
      case 'vulnerability_trends':
        return this._generateVulnerabilityTrendsSQL(entities);
      
      case 'web_server_query':
        return this._generateWebServerQuerySQL(entities);
      
      default:
        return this._generateGeneralQuerySQL(entities);
    }
  }

  _generateCriticalVulnerabilitiesSQL(entities) {
    let whereConditions = [];
    let parameters = [];
    let paramIndex = 1;

    // Base query for critical vulnerabilities
    let sql = `
      SELECT 
        v.id,
        v.title,
        v.severity,
        v.cvss_score,
        COUNT(av.asset_uuid) as affected_assets,
        v.published_date,
        v.description
      FROM vulnerabilities v
      LEFT JOIN asset_vulnerabilities av ON v.id = av.vulnerability_id
    `;

    // Add severity filter
    if (entities.severities && entities.severities.length > 0) {
      whereConditions.push(`v.severity = ANY($${paramIndex})`);
      parameters.push(entities.severities);
      paramIndex++;
    } else {
      // Default to critical if no severity specified
      whereConditions.push(`v.severity IN ('critical', 'high')`);
    }

    // Add asset type filter if specified
    if (entities.assetTypes && entities.assetTypes.length > 0) {
      sql += ` LEFT JOIN assets a ON av.asset_uuid = a.asset_uuid`;
      whereConditions.push(`a.asset_type = ANY($${paramIndex})`);
      parameters.push(entities.assetTypes);
      paramIndex++;
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    sql += `
      GROUP BY v.id, v.title, v.severity, v.cvss_score, v.published_date, v.description
      ORDER BY v.cvss_score DESC, affected_assets DESC
      LIMIT 50
    `;

    return {
      sql,
      parameters,
      method: 'intent_based',
      intent: 'find_critical_vulnerabilities'
    };
  }

  _generateComplianceStatusSQL(entities) {
    const sql = `
      SELECT 
        c.control_id,
        c.title,
        c.implementation_status,
        c.control_family,
        COUNT(p.id) as related_poams,
        c.last_assessment_date
      FROM controls c
      LEFT JOIN poams p ON c.id = p.control_id
      GROUP BY c.id, c.control_id, c.title, c.implementation_status, c.control_family, c.last_assessment_date
      ORDER BY c.control_family, c.control_id
    `;

    return {
      sql,
      parameters: [],
      method: 'intent_based',
      intent: 'compliance_status'
    };
  }

  _generateHighestRiskAssetsSQL(entities) {
    const sql = `
      SELECT 
        a.asset_uuid,
        a.hostname,
        a.asset_type,
        a.operating_system,
        COUNT(av.vulnerability_id) as vulnerability_count,
        AVG(v.cvss_score) as avg_cvss_score,
        MAX(v.cvss_score) as max_cvss_score
      FROM assets a
      LEFT JOIN asset_vulnerabilities av ON a.asset_uuid = av.asset_uuid
      LEFT JOIN vulnerabilities v ON av.vulnerability_id = v.id
      GROUP BY a.asset_uuid, a.hostname, a.asset_type, a.operating_system
      HAVING COUNT(av.vulnerability_id) > 0
      ORDER BY max_cvss_score DESC, vulnerability_count DESC
      LIMIT 20
    `;

    return {
      sql,
      parameters: [],
      method: 'intent_based',
      intent: 'highest_risk_assets'
    };
  }

  _generatePOAMStatusSQL(entities) {
    let whereConditions = [];
    let parameters = [];
    let paramIndex = 1;

    let sql = `
      SELECT 
        p.id,
        p.poam_id,
        p.title,
        p.status,
        p.scheduled_completion_date,
        p.actual_completion_date,
        p.risk_rating,
        CASE 
          WHEN p.scheduled_completion_date < CURRENT_DATE AND p.status != 'completed' 
          THEN 'overdue'
          ELSE 'on_track'
        END as timeline_status
      FROM poams p
    `;

    // Filter for current month if no specific time mentioned
    if (!entities.timePeriod) {
      whereConditions.push(`p.scheduled_completion_date BETWEEN DATE_TRUNC('month', CURRENT_DATE) AND DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`);
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    sql += ` ORDER BY p.scheduled_completion_date ASC`;

    return {
      sql,
      parameters,
      method: 'intent_based',
      intent: 'poam_status'
    };
  }

  _generateVulnerabilityTrendsSQL(entities) {
    const sql = `
      SELECT 
        DATE_TRUNC('month', v.published_date) as month,
        v.severity,
        COUNT(*) as vulnerability_count,
        AVG(v.cvss_score) as avg_cvss_score
      FROM vulnerabilities v
      WHERE v.published_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', v.published_date), v.severity
      ORDER BY month DESC, v.severity
    `;

    return {
      sql,
      parameters: [],
      method: 'intent_based',
      intent: 'vulnerability_trends'
    };
  }

  _generateWebServerQuerySQL(entities) {
    let whereConditions = ['a.asset_type = $1'];
    let parameters = ['web_server'];
    let paramIndex = 2;

    let sql = `
      SELECT 
        a.asset_uuid,
        a.hostname,
        a.ipv4,
        a.operating_system,
        COUNT(av.vulnerability_id) as vulnerability_count,
        COUNT(CASE WHEN v.severity IN ('critical', 'high') THEN 1 END) as critical_high_vulns
      FROM assets a
      LEFT JOIN asset_vulnerabilities av ON a.asset_uuid = av.asset_uuid
      LEFT JOIN vulnerabilities v ON av.vulnerability_id = v.id
    `;

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    sql += `
      GROUP BY a.asset_uuid, a.hostname, a.ipv4, a.operating_system
      ORDER BY critical_high_vulns DESC, vulnerability_count DESC
    `;

    return {
      sql,
      parameters,
      method: 'intent_based',
      intent: 'web_server_query'
    };
  }

  _generateGeneralQuerySQL(entities) {
    // Fallback general query
    const sql = `
      SELECT 
        'general_info' as type,
        COUNT(DISTINCT a.asset_uuid) as total_assets,
        COUNT(DISTINCT v.id) as total_vulnerabilities,
        COUNT(DISTINCT p.id) as total_poams,
        COUNT(DISTINCT c.id) as total_controls
      FROM assets a
      CROSS JOIN vulnerabilities v
      CROSS JOIN poams p
      CROSS JOIN controls c
    `;

    return {
      sql,
      parameters: [],
      method: 'intent_based',
      intent: 'general_query'
    };
  }

  _extractParametersFromEntities(entities, templateParameters) {
    const parameters = [];
    
    // This would extract parameters based on the template schema
    // For now, return basic parameter extraction
    if (entities.severities && entities.severities.length > 0) {
      parameters.push(entities.severities[0]);
    }
    
    if (entities.assetTypes && entities.assetTypes.length > 0) {
      parameters.push(entities.assetTypes[0]);
    }
    
    return parameters;
  }

  // ==================== QUERY EXECUTION ====================

  async _executeQuery(sqlQuery, parameters) {
    const startTime = Date.now();

    try {
      // Execute the generated SQL query
      const result = await db.execute(sql.raw(sqlQuery, parameters));
      const executionTime = (Date.now() - startTime) / 1000;

      return {
        data: result.rows || result,
        summary: {
          rowCount: result.rows?.length || result.length || 0,
          executionTime,
          queryComplexity: this._assessQueryComplexity(sqlQuery)
        },
        executionTime
      };

    } catch (error) {
      console.error('Query execution error:', error);
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  _assessQueryComplexity(sqlQuery) {
    const query = sqlQuery.toLowerCase();
    let complexity = 'simple';

    // Count joins
    const joinCount = (query.match(/join/g) || []).length;
    if (joinCount > 2) complexity = 'complex';
    else if (joinCount > 0) complexity = 'moderate';

    // Check for subqueries
    if (query.includes('select') && query.split('select').length > 2) {
      complexity = 'complex';
    }

    // Check for aggregations
    if (query.includes('group by') || query.includes('having')) {
      complexity = complexity === 'simple' ? 'moderate' : 'complex';
    }

    return complexity;
  }

  // ==================== CONVERSATIONAL RESPONSE FORMATTING ====================

  async _formatConversationalResponse(queryResults, nlpAnalysis, conversationContext) {
    const { intent, entities, queryType } = nlpAnalysis;
    const { data, summary } = queryResults;

    try {
      // Generate human-readable response based on intent and results
      const response = {
        mainResponse: this._generateMainResponse(intent, data, entities),
        insights: this._generateInsights(data, intent, entities),
        businessImpact: this._generateBusinessImpact(data, intent),
        recommendations: this._generateRecommendations(data, intent, entities),
        dataVisualization: this._suggestVisualization(data, intent),
        executiveSummary: this._generateExecutiveSummary(data, intent, entities)
      };

      return response;

    } catch (error) {
      console.error('Error formatting conversational response:', error);
      return {
        mainResponse: `I found ${data?.length || 0} results for your query.`,
        insights: [],
        businessImpact: 'Unable to assess business impact at this time.',
        recommendations: [],
        dataVisualization: null,
        executiveSummary: 'Analysis completed successfully.'
      };
    }
  }

  _generateMainResponse(intent, data, entities) {
    const count = data?.length || 0;

    switch (intent) {
      case 'find_critical_vulnerabilities':
        if (count === 0) {
          return "Great news! I didn't find any critical vulnerabilities in your systems.";
        }
        return `I found ${count} critical vulnerabilities that require immediate attention. ${
          entities.assetTypes?.length > 0
            ? `These affect your ${entities.assetTypes.join(' and ')} systems.`
            : ''
        }`;

      case 'compliance_status':
        return `Your compliance status shows ${count} controls. Let me break down the implementation status for you.`;

      case 'highest_risk_assets':
        return `I've identified the ${count} highest-risk assets in your environment based on vulnerability count and CVSS scores.`;

      case 'poam_status':
        const overdueCount = data?.filter(item => item.timeline_status === 'overdue').length || 0;
        return `You have ${count} POAMs scheduled for this period. ${
          overdueCount > 0 ? `${overdueCount} are currently overdue and need immediate attention.` : 'All are on track.'
        }`;

      case 'vulnerability_trends':
        return `Here's your vulnerability trend analysis over the past 12 months, showing patterns by severity level.`;

      case 'web_server_query':
        return `I found ${count} web servers in your environment. Let me show you their security posture.`;

      default:
        return `I found ${count} results for your query. Here's what I discovered:`;
    }
  }

  _generateInsights(data, intent, entities) {
    const insights = [];

    if (!data || data.length === 0) {
      return ['No data available for analysis.'];
    }

    switch (intent) {
      case 'find_critical_vulnerabilities':
        // Analyze vulnerability patterns
        const severityGroups = this._groupBy(data, 'severity');
        Object.entries(severityGroups).forEach(([severity, vulns]) => {
          insights.push(`${vulns.length} ${severity} severity vulnerabilities identified`);
        });

        // Find most affected assets
        const maxAffected = Math.max(...data.map(v => v.affected_assets || 0));
        if (maxAffected > 0) {
          insights.push(`Some vulnerabilities affect up to ${maxAffected} assets`);
        }
        break;

      case 'highest_risk_assets':
        const avgVulnCount = data.reduce((sum, asset) => sum + (asset.vulnerability_count || 0), 0) / data.length;
        insights.push(`Average vulnerability count per high-risk asset: ${Math.round(avgVulnCount)}`);

        const criticalAssets = data.filter(asset => (asset.max_cvss_score || 0) >= 9.0);
        if (criticalAssets.length > 0) {
          insights.push(`${criticalAssets.length} assets have critical vulnerabilities (CVSS ≥ 9.0)`);
        }
        break;

      case 'poam_status':
        const statusGroups = this._groupBy(data, 'status');
        Object.entries(statusGroups).forEach(([status, poams]) => {
          insights.push(`${poams.length} POAMs are currently ${status}`);
        });
        break;

      case 'compliance_status':
        const implementationGroups = this._groupBy(data, 'implementation_status');
        Object.entries(implementationGroups).forEach(([status, controls]) => {
          insights.push(`${controls.length} controls are ${status}`);
        });
        break;
    }

    return insights;
  }

  _generateBusinessImpact(data, intent) {
    switch (intent) {
      case 'find_critical_vulnerabilities':
        const criticalCount = data?.filter(v => v.severity === 'critical').length || 0;
        if (criticalCount > 0) {
          return `High business impact: ${criticalCount} critical vulnerabilities pose immediate risk to business operations and could lead to data breaches, system downtime, or regulatory violations.`;
        }
        return 'Moderate business impact: While vulnerabilities exist, immediate business risk is manageable with proper remediation planning.';

      case 'highest_risk_assets':
        return 'High business impact: These high-risk assets are critical to business operations. Compromise could result in significant operational disruption and financial loss.';

      case 'poam_status':
        const overdueCount = data?.filter(item => item.timeline_status === 'overdue').length || 0;
        if (overdueCount > 0) {
          return `Medium to high business impact: ${overdueCount} overdue POAMs indicate potential compliance violations and increased security risk exposure.`;
        }
        return 'Low business impact: POAM remediation is on track, maintaining good security posture and compliance status.';

      case 'compliance_status':
        return 'Medium business impact: Compliance status directly affects regulatory standing and audit outcomes. Gaps may result in penalties or certification issues.';

      default:
        return 'Business impact assessment requires more specific context about the query results.';
    }
  }

  _generateRecommendations(data, intent, entities) {
    const recommendations = [];

    switch (intent) {
      case 'find_critical_vulnerabilities':
        recommendations.push({
          priority: 'High',
          action: 'Prioritize patching critical vulnerabilities with CVSS scores ≥ 9.0',
          timeline: 'Within 72 hours'
        });
        recommendations.push({
          priority: 'Medium',
          action: 'Implement vulnerability scanning automation for continuous monitoring',
          timeline: 'Within 2 weeks'
        });
        break;

      case 'highest_risk_assets':
        recommendations.push({
          priority: 'High',
          action: 'Implement additional security controls on highest-risk assets',
          timeline: 'Within 1 week'
        });
        recommendations.push({
          priority: 'Medium',
          action: 'Consider network segmentation for critical assets',
          timeline: 'Within 1 month'
        });
        break;

      case 'poam_status':
        const overdueCount = data?.filter(item => item.timeline_status === 'overdue').length || 0;
        if (overdueCount > 0) {
          recommendations.push({
            priority: 'High',
            action: `Address ${overdueCount} overdue POAMs immediately`,
            timeline: 'Within 48 hours'
          });
        }
        recommendations.push({
          priority: 'Medium',
          action: 'Review POAM scheduling and resource allocation',
          timeline: 'Within 1 week'
        });
        break;

      case 'compliance_status':
        recommendations.push({
          priority: 'Medium',
          action: 'Focus on implementing partially implemented controls',
          timeline: 'Within 30 days'
        });
        break;
    }

    return recommendations;
  }

  _suggestVisualization(data, intent) {
    switch (intent) {
      case 'find_critical_vulnerabilities':
        return {
          type: 'bar_chart',
          title: 'Vulnerabilities by Severity',
          xAxis: 'severity',
          yAxis: 'count',
          description: 'Shows distribution of vulnerabilities across severity levels'
        };

      case 'vulnerability_trends':
        return {
          type: 'line_chart',
          title: 'Vulnerability Trends Over Time',
          xAxis: 'month',
          yAxis: 'vulnerability_count',
          groupBy: 'severity',
          description: 'Shows vulnerability discovery trends by month and severity'
        };

      case 'highest_risk_assets':
        return {
          type: 'scatter_plot',
          title: 'Asset Risk Analysis',
          xAxis: 'vulnerability_count',
          yAxis: 'max_cvss_score',
          description: 'Shows relationship between vulnerability count and maximum CVSS score'
        };

      case 'poam_status':
        return {
          type: 'pie_chart',
          title: 'POAM Status Distribution',
          valueField: 'status',
          description: 'Shows distribution of POAMs by current status'
        };

      default:
        return null;
    }
  }

  _generateExecutiveSummary(data, intent, entities) {
    const count = data?.length || 0;

    switch (intent) {
      case 'find_critical_vulnerabilities':
        const criticalCount = data?.filter(v => v.severity === 'critical').length || 0;
        return `Security Assessment: ${count} vulnerabilities identified, ${criticalCount} critical. Immediate action required for critical items to maintain security posture.`;

      case 'highest_risk_assets':
        return `Risk Management: ${count} high-risk assets identified requiring enhanced security controls and monitoring to protect business operations.`;

      case 'poam_status':
        const overdueCount = data?.filter(item => item.timeline_status === 'overdue').length || 0;
        return `Compliance Status: ${count} POAMs tracked, ${overdueCount} overdue. ${
          overdueCount > 0 ? 'Immediate attention needed for overdue items.' : 'Remediation efforts on track.'
        }`;

      case 'compliance_status':
        return `Compliance Overview: ${count} controls assessed. Regular monitoring and gap remediation essential for maintaining compliance posture.`;

      default:
        return `Analysis Complete: ${count} items analyzed. Review detailed findings and recommendations for next steps.`;
    }
  }

  _generateFollowUpSuggestions(nlpAnalysis, queryResults) {
    const { intent, entities } = nlpAnalysis;
    const suggestions = [];

    switch (intent) {
      case 'find_critical_vulnerabilities':
        suggestions.push("Which assets are most affected by these vulnerabilities?");
        suggestions.push("What is the remediation timeline for these critical vulnerabilities?");
        suggestions.push("Show me vulnerability trends over the past quarter");
        break;

      case 'highest_risk_assets':
        suggestions.push("What vulnerabilities affect these high-risk assets?");
        suggestions.push("Show me the remediation status for these assets");
        suggestions.push("What controls are in place for these critical systems?");
        break;

      case 'poam_status':
        suggestions.push("Which POAMs are overdue and need immediate attention?");
        suggestions.push("Show me POAM completion trends");
        suggestions.push("What resources are needed to complete overdue POAMs?");
        break;

      case 'compliance_status':
        suggestions.push("Which controls have the most gaps?");
        suggestions.push("Show me compliance trends over time");
        suggestions.push("What are the upcoming compliance deadlines?");
        break;
    }

    return suggestions;
  }

  // ==================== UTILITY METHODS ====================

  _groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key] || 'unknown';
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  // ==================== QUERY MANAGEMENT ====================

  /**
   * Get user's query history
   */
  async getUserQueryHistory(userId, limit = 50) {
    try {
      const queries = await db.select({
        id: nlQueries.id,
        query: nlQueries.query,
        status: nlQueries.status,
        queryType: nlQueries.queryType,
        intent: nlQueries.intent,
        confidence: nlQueries.confidence,
        executionTime: nlQueries.executionTime,
        feedback: nlQueries.feedback,
        createdAt: nlQueries.createdAt
      })
      .from(nlQueries)
      .where(eq(nlQueries.userId, userId))
      .orderBy(desc(nlQueries.createdAt))
      .limit(limit);

      return queries;
    } catch (error) {
      console.error('Error getting user query history:', error);
      throw error;
    }
  }

  /**
   * Submit feedback for a query
   */
  async submitQueryFeedback(queryId, userId, feedback, comment = null) {
    try {
      const [updatedQuery] = await db.update(nlQueries)
        .set({
          feedback,
          feedbackComment: comment,
          updatedAt: new Date()
        })
        .where(and(
          eq(nlQueries.id, queryId),
          eq(nlQueries.userId, userId)
        ))
        .returning();

      return updatedQuery;
    } catch (error) {
      console.error('Error submitting query feedback:', error);
      throw error;
    }
  }

  /**
   * Get query analytics for improvement
   */
  async getQueryAnalytics(timeRange = '30d') {
    try {
      const dateFilter = this._getDateFilter(timeRange);

      const analytics = await db.select({
        totalQueries: sql`COUNT(*)`,
        successfulQueries: sql`COUNT(CASE WHEN status = 'completed' THEN 1 END)`,
        averageConfidence: sql`AVG(confidence)`,
        averageExecutionTime: sql`AVG(execution_time)`,
        topQueryTypes: sql`
          json_agg(
            json_build_object(
              'query_type', query_type,
              'count', count
            )
          )
        `,
        feedbackDistribution: sql`
          json_agg(
            json_build_object(
              'feedback', feedback,
              'count', feedback_count
            )
          )
        `
      })
      .from(nlQueries)
      .where(gte(nlQueries.createdAt, dateFilter));

      return analytics[0];
    } catch (error) {
      console.error('Error getting query analytics:', error);
      throw error;
    }
  }

  _getDateFilter(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}

module.exports = new NaturalLanguageQueryService();
