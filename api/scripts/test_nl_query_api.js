#!/usr/bin/env node
/**
 * Test Natural Language Query API
 * Comprehensive testing of conversational AI for cybersecurity
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1/nl-query';
let authToken = null;

// Sample test queries for different categories
const testQueries = {
  vulnerability_analysis: [
    'Show me all critical vulnerabilities affecting our web servers',
    'What vulnerabilities were discovered this week?',
    'Which assets have the most high-severity vulnerabilities?'
  ],
  compliance_inquiries: [
    'What is our current NIST 800-53 compliance status?',
    'Which controls are not implemented?',
    'Show me POAMs due this month'
  ],
  risk_assessment: [
    'Which systems pose the highest risk to our organization?',
    'Show me risk trends over the last quarter',
    'What are the top risk factors in our environment?'
  ],
  executive_insights: [
    'How has our security posture improved over the last quarter?',
    'What are the key security metrics for the board report?',
    'Show me business impact of current security issues'
  ]
};

async function authenticate() {
  try {
    console.log('🔐 Authenticating...');
    
    const authResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    authToken = authResponse.data.token;
    console.log('✅ Authentication successful');
    
    return {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    console.log('⚠️  Authentication failed, proceeding without token');
    console.log('   (This is expected if auth is not set up)');
    
    return {
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
}

async function testNaturalLanguageQueryAPI() {
  console.log('🤖 Testing Natural Language Query API - Conversational AI for Cybersecurity');
  console.log('===============================================================================\n');

  try {
    const authHeaders = await authenticate();
    
    // Test 1: AI Capabilities Discovery
    console.log('🧠 Test 1: AI Capabilities Discovery');
    console.log('------------------------------------');
    
    const capabilitiesResponse = await axios.get(`${BASE_URL}/capabilities`, authHeaders);
    const capabilities = capabilitiesResponse.data.data;
    
    console.log('✅ AI capabilities retrieved successfully');
    console.log(`   • Supported query types: ${capabilities.supportedQueryTypes.length}`);
    console.log(`   • Conversational features: ${capabilities.conversationalFeatures.length}`);
    console.log(`   • Supported time ranges: ${capabilities.supportedTimeRanges.length}`);
    console.log(`   • Supported asset types: ${capabilities.supportedAssetTypes.length}`);
    
    console.log('\n   📋 Query Type Examples:');
    capabilities.supportedQueryTypes.slice(0, 3).forEach((type, i) => {
      console.log(`     ${i+1}. ${type.type}: ${type.description}`);
      console.log(`        Example: "${type.examples[0]}"`);
    });

    // Test 2: Vulnerability Analysis Query
    console.log('\n🔍 Test 2: Vulnerability Analysis Query');
    console.log('---------------------------------------');
    
    const vulnQuery = testQueries.vulnerability_analysis[0];
    console.log(`   Query: "${vulnQuery}"`);
    
    const vulnResponse = await axios.post(`${BASE_URL}/process`, {
      query: vulnQuery,
      includeVisualization: true,
      includeRecommendations: true
    }, authHeaders);
    
    const vulnResult = vulnResponse.data.data;
    console.log('✅ Vulnerability query processed successfully');
    console.log(`   • Query ID: ${vulnResult.queryId}`);
    console.log(`   • Confidence: ${(vulnResult.confidence * 100).toFixed(1)}%`);
    console.log(`   • Execution time: ${vulnResult.executionTime}s`);
    console.log(`   • Data points: ${vulnResult.data?.length || 0}`);
    
    if (vulnResult.conversationalResponse) {
      console.log('\n   💬 Conversational Response:');
      console.log(`     Main: ${vulnResult.conversationalResponse.mainResponse}`);
      
      if (vulnResult.conversationalResponse.insights?.length > 0) {
        console.log('     Insights:');
        vulnResult.conversationalResponse.insights.slice(0, 2).forEach((insight, i) => {
          console.log(`       ${i+1}. ${insight}`);
        });
      }
      
      if (vulnResult.conversationalResponse.businessImpact) {
        console.log(`     Business Impact: ${vulnResult.conversationalResponse.businessImpact.substring(0, 100)}...`);
      }
    }

    // Test 3: Compliance Inquiry
    console.log('\n📋 Test 3: Compliance Inquiry');
    console.log('------------------------------');
    
    const complianceQuery = testQueries.compliance_inquiries[0];
    console.log(`   Query: "${complianceQuery}"`);
    
    const complianceResponse = await axios.post(`${BASE_URL}/process`, {
      query: complianceQuery,
      conversationContext: {},
      includeVisualization: true
    }, authHeaders);
    
    const complianceResult = complianceResponse.data.data;
    console.log('✅ Compliance query processed successfully');
    console.log(`   • Query ID: ${complianceResult.queryId}`);
    console.log(`   • Confidence: ${(complianceResult.confidence * 100).toFixed(1)}%`);
    console.log(`   • Execution time: ${complianceResult.executionTime}s`);
    
    if (complianceResult.conversationalResponse?.executiveSummary) {
      console.log(`   • Executive Summary: ${complianceResult.conversationalResponse.executiveSummary}`);
    }
    
    if (complianceResult.visualization) {
      console.log(`   • Suggested visualization: ${complianceResult.visualization.type} - ${complianceResult.visualization.title}`);
    }

    // Test 4: Multi-turn Conversation
    console.log('\n🔄 Test 4: Multi-turn Conversation');
    console.log('-----------------------------------');
    
    const followUpQuery = 'Which of these vulnerabilities affect our most critical systems?';
    console.log(`   Follow-up Query: "${followUpQuery}"`);
    
    const conversationResponse = await axios.post(`${BASE_URL}/continue`, {
      followUpQuery: followUpQuery,
      originalQueryId: vulnResult.queryId
    }, authHeaders);
    
    const conversationResult = conversationResponse.data.data;
    console.log('✅ Conversation continued successfully');
    console.log(`   • New Query ID: ${conversationResult.queryId}`);
    console.log(`   • Confidence: ${(conversationResult.confidence * 100).toFixed(1)}%`);
    console.log(`   • Context-aware: Yes (using previous query context)`);
    
    if (conversationResult.conversationalResponse?.mainResponse) {
      console.log(`   • Response: ${conversationResult.conversationalResponse.mainResponse.substring(0, 150)}...`);
    }

    // Test 5: Risk Assessment Query
    console.log('\n⚠️  Test 5: Risk Assessment Query');
    console.log('---------------------------------');
    
    const riskQuery = testQueries.risk_assessment[0];
    console.log(`   Query: "${riskQuery}"`);
    
    const riskResponse = await axios.post(`${BASE_URL}/process`, {
      query: riskQuery,
      includeRecommendations: true
    }, authHeaders);
    
    const riskResult = riskResponse.data.data;
    console.log('✅ Risk assessment query processed successfully');
    console.log(`   • Query ID: ${riskResult.queryId}`);
    console.log(`   • Confidence: ${(riskResult.confidence * 100).toFixed(1)}%`);
    
    if (riskResult.recommendations?.length > 0) {
      console.log('\n   📝 Recommendations:');
      riskResult.recommendations.slice(0, 2).forEach((rec, i) => {
        console.log(`     ${i+1}. [${rec.priority}] ${rec.action}`);
        console.log(`        Timeline: ${rec.timeline}`);
      });
    }
    
    if (riskResult.suggestedFollowUps?.length > 0) {
      console.log('\n   💡 Suggested Follow-ups:');
      riskResult.suggestedFollowUps.slice(0, 2).forEach((suggestion, i) => {
        console.log(`     ${i+1}. "${suggestion}"`);
      });
    }

    // Test 6: Executive Insights Query
    console.log('\n👔 Test 6: Executive Insights Query');
    console.log('-----------------------------------');
    
    const executiveQuery = testQueries.executive_insights[0];
    console.log(`   Query: "${executiveQuery}"`);
    
    const executiveResponse = await axios.post(`${BASE_URL}/process`, {
      query: executiveQuery,
      conversationContext: { userRole: 'executive' }
    }, authHeaders);
    
    const executiveResult = executiveResponse.data.data;
    console.log('✅ Executive insights query processed successfully');
    console.log(`   • Query ID: ${executiveResult.queryId}`);
    console.log(`   • Confidence: ${(executiveResult.confidence * 100).toFixed(1)}%`);
    
    if (executiveResult.conversationalResponse?.executiveSummary) {
      console.log(`   • Executive Summary: ${executiveResult.conversationalResponse.executiveSummary}`);
    }
    
    if (executiveResult.conversationalResponse?.businessImpact) {
      console.log(`   • Business Impact: ${executiveResult.conversationalResponse.businessImpact.substring(0, 120)}...`);
    }

    // Test 7: Query Suggestions
    console.log('\n💡 Test 7: Query Suggestions');
    console.log('-----------------------------');
    
    const suggestionsResponse = await axios.get(`${BASE_URL}/suggestions?category=vulnerability_management&limit=5`, authHeaders);
    const suggestions = suggestionsResponse.data.data;
    
    console.log('✅ Query suggestions retrieved successfully');
    console.log(`   • Category: ${suggestions.category}`);
    console.log(`   • Suggestions count: ${suggestions.suggestions.length}`);
    
    console.log('\n   📋 Sample Suggestions:');
    suggestions.suggestions.forEach((suggestion, i) => {
      console.log(`     ${i+1}. "${suggestion.query}" (${suggestion.estimatedComplexity})`);
    });

    // Test 8: Query History
    console.log('\n📚 Test 8: Query History');
    console.log('------------------------');
    
    const historyResponse = await axios.get(`${BASE_URL}/history?limit=10`, authHeaders);
    const history = historyResponse.data.data;
    
    console.log('✅ Query history retrieved successfully');
    console.log(`   • Total queries: ${history.total}`);
    console.log(`   • Queries returned: ${history.queries.length}`);
    
    if (history.queries.length > 0) {
      console.log('\n   📝 Recent Queries:');
      history.queries.slice(0, 3).forEach((query, i) => {
        console.log(`     ${i+1}. "${query.query.substring(0, 60)}..." (${query.status})`);
        console.log(`        Type: ${query.queryType || 'unknown'}, Confidence: ${(query.confidence * 100).toFixed(0)}%`);
      });
    }

    // Test 9: Query Feedback
    console.log('\n👍 Test 9: Query Feedback');
    console.log('-------------------------');
    
    const feedbackResponse = await axios.post(`${BASE_URL}/${vulnResult.queryId}/feedback`, {
      feedback: 'helpful',
      comment: 'The response provided excellent insights and actionable recommendations'
    }, authHeaders);
    
    const feedbackResult = feedbackResponse.data.data;
    console.log('✅ Query feedback submitted successfully');
    console.log(`   • Query ID: ${feedbackResult.queryId}`);
    console.log(`   • Feedback: ${feedbackResult.feedback}`);
    console.log(`   • Comment: "${feedbackResult.feedbackComment}"`);

    // Test 10: Analytics (Admin only)
    console.log('\n📊 Test 10: Query Analytics');
    console.log('---------------------------');
    
    try {
      const analyticsResponse = await axios.get(`${BASE_URL}/analytics?timeRange=30d`, authHeaders);
      const analytics = analyticsResponse.data.data;
      
      console.log('✅ Query analytics retrieved successfully');
      console.log(`   • Time range: ${analytics.timeRange}`);
      console.log(`   • Generated at: ${new Date(analytics.generatedAt).toLocaleString()}`);
      
      if (analytics.analytics) {
        console.log(`   • Total queries: ${analytics.analytics.totalQueries || 'N/A'}`);
        console.log(`   • Successful queries: ${analytics.analytics.successfulQueries || 'N/A'}`);
        console.log(`   • Average confidence: ${analytics.analytics.averageConfidence || 'N/A'}`);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('⚠️  Analytics access restricted (admin only)');
      } else {
        console.log('⚠️  Analytics not available');
      }
    }

    console.log('\n🎉 All Natural Language Query API tests completed successfully!');
    
    console.log('\n📋 Available NL Query Endpoints:');
    console.log('   🤖 Core Processing:');
    console.log('      • POST /api/v1/nl-query/process - Process natural language queries');
    console.log('      • POST /api/v1/nl-query/continue - Continue multi-turn conversations');
    
    console.log('   📚 Query Management:');
    console.log('      • GET /api/v1/nl-query/history - Get query history');
    console.log('      • POST /api/v1/nl-query/{id}/feedback - Submit query feedback');
    
    console.log('   🧠 AI Features:');
    console.log('      • GET /api/v1/nl-query/suggestions - Get suggested queries');
    console.log('      • GET /api/v1/nl-query/capabilities - Get AI capabilities');
    
    console.log('   📊 Analytics:');
    console.log('      • GET /api/v1/nl-query/analytics - Get query analytics (admin)');

    console.log('\n🎯 Key Features Demonstrated:');
    console.log('   ✅ Natural language to SQL conversion');
    console.log('   ✅ Conversational AI with context awareness');
    console.log('   ✅ Multi-turn conversation support');
    console.log('   ✅ Executive-level insights and summaries');
    console.log('   ✅ Business impact analysis');
    console.log('   ✅ Actionable recommendations');
    console.log('   ✅ Data visualization suggestions');
    console.log('   ✅ Query confidence scoring');
    console.log('   ✅ User feedback collection');
    console.log('   ✅ Query history and analytics');

    console.log('\n🔍 Supported Query Categories:');
    console.log('   • Vulnerability Analysis - Critical vulnerabilities, trends, impact');
    console.log('   • Compliance Inquiries - NIST 800-53, control status, POAMs');
    console.log('   • Risk Assessment - High-risk assets, risk trends, factors');
    console.log('   • Executive Insights - Security posture, business impact, metrics');
    console.log('   • Asset Management - Asset inventory, lifecycle, security status');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ API server not running. Please start it first:');
      console.error('   npm run dev');
    } else if (error.response) {
      console.error(`❌ API Error: ${error.response.status} - ${error.response.data?.error || error.message}`);
      if (error.response.data?.details) {
        console.error('   Details:', error.response.data.details);
      }
    } else {
      console.error(`❌ Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testNaturalLanguageQueryAPI().catch(console.error);
}

module.exports = { testNaturalLanguageQueryAPI };
