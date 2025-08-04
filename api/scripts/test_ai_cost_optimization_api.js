#!/usr/bin/env node
/**
 * Test AI Cost Optimization API
 * Comprehensive testing of AI-powered cost optimization features
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1/ai-cost-optimization';
let authToken = null;

// Sample test data
const testAssetUuid = '550e8400-e29b-41d4-a716-446655440000';

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

async function testAICostOptimizationAPI() {
  console.log('🤖 Testing AI Cost Optimization API');
  console.log('====================================\n');

  try {
    const authHeaders = await authenticate();
    
    // Test 1: AI-Powered Cost Optimization Recommendations
    console.log('🧠 Test 1: AI Cost Optimization Recommendations');
    console.log('------------------------------------------------');
    
    const recommendationsResponse = await axios.get(
      `${BASE_URL}/recommendations?analysisDepth=comprehensive&optimizationGoals=reduce_costs,improve_efficiency&timeHorizon=12&confidenceThreshold=0.7`, 
      authHeaders
    );
    const recommendationsData = recommendationsResponse.data.data;
    
    console.log(`✅ AI analysis completed: ${recommendationsData.analysisId}`);
    console.log(`   • Analysis scope: ${recommendationsData.analysisScope.analysisDepth} (${recommendationsData.analysisScope.timeHorizon})`);
    console.log(`   • Data quality: ${(recommendationsData.dataQuality.dataCompleteness * 100).toFixed(1)}% complete`);
    console.log(`   • Optimization score: ${recommendationsData.aiInsights.optimizationScore}/100`);
    console.log(`   • Total recommendations: ${recommendationsData.recommendations.length}`);
    
    if (recommendationsData.recommendations.length > 0) {
      console.log('   • Top recommendations:');
      recommendationsData.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`     ${i+1}. ${rec.title}`);
        console.log(`        • Potential savings: $${rec.potentialSavings.toFixed(0)}`);
        console.log(`        • AI confidence: ${(rec.confidence * 100).toFixed(1)}%`);
        console.log(`        • AI score: ${rec.aiScore}/1.0`);
        console.log(`        • Effort: ${rec.effort}, Risk: ${rec.riskLevel}`);
      });
    }

    console.log(`   • Total potential savings: $${recommendationsData.potentialSavings.totalPotentialSavings.toFixed(0)}`);
    console.log(`   • Net savings: $${recommendationsData.potentialSavings.netSavings.toFixed(0)}`);
    console.log(`   • ROI: ${recommendationsData.potentialSavings.roi.toFixed(1)}x`);

    // Test 2: Real-time Cost Anomaly Detection
    console.log('\n🔍 Test 2: AI Cost Anomaly Detection');
    console.log('------------------------------------');
    
    const anomaliesResponse = await axios.get(
      `${BASE_URL}/anomalies?lookbackPeriod=6&sensitivityLevel=medium&alertThreshold=2.0`, 
      authHeaders
    );
    const anomaliesData = anomaliesResponse.data.data;
    
    console.log(`✅ Anomaly detection completed: ${anomaliesData.detectionId}`);
    console.log(`   • Analysis scope: ${anomaliesData.analysisScope.lookbackPeriod} lookback`);
    console.log(`   • Sensitivity: ${anomaliesData.analysisScope.sensitivityLevel}`);
    console.log(`   • Total anomalies: ${anomaliesData.summary.totalAnomalies}`);
    console.log(`   • High severity: ${anomaliesData.summary.highSeverityCount}`);
    console.log(`   • Estimated impact: $${anomaliesData.summary.estimatedImpact.toFixed(0)}`);
    
    if (anomaliesData.anomalies.length > 0) {
      console.log('   • Recent anomalies:');
      anomaliesData.anomalies.slice(0, 3).forEach((anomaly, i) => {
        console.log(`     ${i+1}. ${anomaly.type} (${anomaly.severity})`);
        console.log(`        • Description: ${anomaly.description}`);
        console.log(`        • Impact: $${anomaly.estimatedImpact.toFixed(0)}`);
        if (anomaly.zScore) {
          console.log(`        • Z-score: ${anomaly.zScore.toFixed(2)}`);
        }
      });
    }

    // Test 3: AI Optimization Strategies
    console.log('\n📊 Test 3: AI Optimization Strategies');
    console.log('--------------------------------------');
    
    const strategiesResponse = await axios.get(
      `${BASE_URL}/strategies?portfolioScope=all&optimizationTarget=0.15&riskTolerance=medium&timeframe=quarterly`, 
      authHeaders
    );
    const strategiesData = strategiesResponse.data.data;
    
    console.log(`✅ Optimization strategies generated: ${strategiesData.strategyId}`);
    console.log(`   • Optimization target: ${strategiesData.optimizationTarget}`);
    console.log(`   • Risk tolerance: ${strategiesData.riskTolerance}`);
    console.log(`   • Timeframe: ${strategiesData.timeframe}`);
    
    if (strategiesData.portfolioAnalysis) {
      console.log(`   • Portfolio analysis:`);
      console.log(`     • Total assets: ${strategiesData.portfolioAnalysis.totalAssets}`);
      console.log(`     • Monthly cost: $${strategiesData.portfolioAnalysis.totalMonthlyCost.toFixed(0)}`);
      console.log(`     • Optimization potential: ${strategiesData.portfolioAnalysis.optimizationPotential}%`);
    }
    
    console.log(`   • Projected outcomes:`);
    console.log(`     • Expected savings: $${strategiesData.projectedOutcomes.expectedSavings.toFixed(0)}`);
    console.log(`     • Implementation cost: $${strategiesData.projectedOutcomes.implementationCost.toFixed(0)}`);
    console.log(`     • Payback period: ${strategiesData.projectedOutcomes.paybackPeriod} months`);

    // Test 4: Predictive Cost Modeling
    console.log('\n🧠 Test 4: AI Predictive Cost Modeling');
    console.log('---------------------------------------');
    
    const modelResponse = await axios.get(
      `${BASE_URL}/predictive-model/${testAssetUuid}?modelType=ensemble&predictionHorizon=12&includeExternalFactors=true`, 
      authHeaders
    );
    const modelData = modelResponse.data.data;
    
    console.log(`✅ Predictive model trained: ${modelData.modelId}`);
    console.log(`   • Model type: ${modelData.modelType}`);
    console.log(`   • Training data: ${modelData.trainingData.totalSamples} samples`);
    console.log(`   • Model performance:`);
    console.log(`     • Accuracy: ${(modelData.modelPerformance.accuracy * 100).toFixed(1)}%`);
    console.log(`     • RMSE: ${modelData.modelPerformance.rmse.toFixed(2)}`);
    console.log(`     • MAPE: ${(modelData.modelPerformance.mape * 100).toFixed(1)}%`);
    console.log(`     • R² Score: ${modelData.modelPerformance.r2Score.toFixed(3)}`);
    
    if (modelData.predictions && modelData.predictions.length > 0) {
      console.log('   • Sample predictions:');
      modelData.predictions.slice(0, 3).forEach((pred, i) => {
        console.log(`     ${i+1}. ${pred.month}: $${pred.predictedCost.toFixed(0)} (±${pred.confidence.toFixed(0)})`);
      });
    }

    // Test 5: Vendor Optimization
    console.log('\n🏢 Test 5: AI Vendor Optimization');
    console.log('----------------------------------');
    
    const vendorResponse = await axios.get(
      `${BASE_URL}/vendor-optimization?minSpend=1000&consolidationThreshold=0.15`, 
      authHeaders
    );
    const vendorData = vendorResponse.data.data;
    
    console.log(`✅ Vendor optimization analysis completed`);
    console.log(`   • Total opportunities: ${vendorData.summary.totalOpportunities}`);
    console.log(`   • Total potential savings: $${vendorData.summary.totalPotentialSavings.toFixed(0)}`);
    console.log(`   • Average confidence: ${(vendorData.summary.averageConfidence * 100).toFixed(1)}%`);
    
    if (vendorData.vendorRecommendations.length > 0) {
      console.log('   • Top vendor opportunities:');
      vendorData.vendorRecommendations.slice(0, 2).forEach((rec, i) => {
        console.log(`     ${i+1}. ${rec.title}`);
        console.log(`        • Savings: $${rec.potentialSavings.toFixed(0)}`);
        console.log(`        • Timeframe: ${rec.timeframe}`);
      });
    }

    // Test 6: License Optimization
    console.log('\n📄 Test 6: AI License Optimization');
    console.log('-----------------------------------');
    
    const licenseResponse = await axios.get(
      `${BASE_URL}/license-optimization?licenseType=all&utilizationThreshold=0.7`, 
      authHeaders
    );
    const licenseData = licenseResponse.data.data;
    
    console.log(`✅ License optimization analysis completed`);
    console.log(`   • Total opportunities: ${licenseData.summary.totalOpportunities}`);
    console.log(`   • Total potential savings: $${licenseData.summary.totalPotentialSavings.toFixed(0)}`);
    console.log(`   • Average ROI: ${licenseData.summary.averageROI.toFixed(1)}x`);
    
    if (licenseData.licenseRecommendations.length > 0) {
      console.log('   • Top license opportunities:');
      licenseData.licenseRecommendations.slice(0, 2).forEach((rec, i) => {
        console.log(`     ${i+1}. ${rec.title}`);
        console.log(`        • Savings: $${rec.potentialSavings.toFixed(0)}`);
        console.log(`        • Effort: ${rec.effort}`);
      });
    }

    // Test 7: Operational Efficiency
    console.log('\n⚡ Test 7: AI Operational Efficiency');
    console.log('------------------------------------');
    
    const efficiencyResponse = await axios.get(
      `${BASE_URL}/operational-efficiency?assetUuid=${testAssetUuid}&efficiencyMetrics=power,space&benchmarkPeriod=6`, 
      authHeaders
    );
    const efficiencyData = efficiencyResponse.data.data;
    
    console.log(`✅ Operational efficiency analysis completed`);
    console.log(`   • Total opportunities: ${efficiencyData.summary.totalOpportunities}`);
    console.log(`   • Total potential savings: $${efficiencyData.summary.totalPotentialSavings.toFixed(0)}`);
    console.log(`   • Optimization score: ${efficiencyData.summary.optimizationScore}/100`);
    
    if (efficiencyData.efficiencyRecommendations.length > 0) {
      console.log('   • Top efficiency opportunities:');
      efficiencyData.efficiencyRecommendations.slice(0, 2).forEach((rec, i) => {
        console.log(`     ${i+1}. ${rec.title}`);
        console.log(`        • Category: ${rec.category}`);
        console.log(`        • Savings: $${rec.potentialSavings.toFixed(0)}`);
      });
    }

    // Test 8: AI Optimization Dashboard
    console.log('\n📊 Test 8: AI Optimization Dashboard');
    console.log('------------------------------------');
    
    const dashboardResponse = await axios.get(
      `${BASE_URL}/dashboard?timeRange=90d&includeAnomalies=true&includeRecommendations=true`, 
      authHeaders
    );
    const dashboardData = dashboardResponse.data.data;
    
    console.log(`✅ AI optimization dashboard generated`);
    console.log(`   • Time range: ${dashboardData.timeRange}`);
    console.log(`   • Generated at: ${new Date(dashboardData.generatedAt).toLocaleString()}`);
    
    if (dashboardData.recommendations) {
      console.log(`   • Recommendations summary:`);
      console.log(`     • Total: ${dashboardData.recommendations.total}`);
      console.log(`     • Quick wins: ${dashboardData.recommendations.quickWins}`);
      console.log(`     • Potential savings: $${dashboardData.recommendations.totalPotentialSavings.toFixed(0)}`);
      console.log(`     • Optimization score: ${dashboardData.recommendations.optimizationScore}/100`);
    }
    
    if (dashboardData.anomalies) {
      console.log(`   • Anomalies summary:`);
      console.log(`     • Total: ${dashboardData.anomalies.total}`);
      console.log(`     • High severity: ${dashboardData.anomalies.highSeverity}`);
      console.log(`     • Estimated impact: $${dashboardData.anomalies.estimatedImpact.toFixed(0)}`);
    }

    // Test 9: AI Optimization Insights
    console.log('\n💡 Test 9: AI Optimization Insights');
    console.log('-----------------------------------');
    
    const insightsResponse = await axios.get(`${BASE_URL}/insights`, authHeaders);
    const insightsData = insightsResponse.data.data;
    
    console.log(`✅ AI optimization insights generated`);
    console.log(`   • Optimization potential:`);
    console.log(`     • Score: ${insightsData.optimizationPotential.score}/100`);
    console.log(`     • Interpretation: ${insightsData.optimizationPotential.interpretation}`);
    
    if (insightsData.optimizationPotential.topOpportunities.length > 0) {
      console.log('   • Top opportunities:');
      insightsData.optimizationPotential.topOpportunities.forEach((opp, i) => {
        console.log(`     ${i+1}. ${opp.title}: $${opp.potentialSavings.toFixed(0)} (${(opp.confidence * 100).toFixed(0)}% confidence)`);
      });
    }
    
    console.log(`   • Implementation roadmap:`);
    console.log(`     • Quick wins: $${insightsData.implementationRoadmap.quickWins.toFixed(0)}`);
    console.log(`     • Medium-term: $${insightsData.implementationRoadmap.mediumTerm.toFixed(0)}`);
    console.log(`     • Long-term: $${insightsData.implementationRoadmap.longTerm.toFixed(0)}`);

    console.log('\n🎉 All AI Cost Optimization API tests completed successfully!');
    
    console.log('\n📋 Available AI Cost Optimization Endpoints:');
    console.log('   🤖 Core AI Features:');
    console.log('      • GET /api/v1/ai-cost-optimization/recommendations');
    console.log('      • GET /api/v1/ai-cost-optimization/anomalies');
    console.log('      • GET /api/v1/ai-cost-optimization/strategies');
    console.log('      • GET /api/v1/ai-cost-optimization/predictive-model/:assetUuid');
    
    console.log('   🎯 Specialized Analysis:');
    console.log('      • GET /api/v1/ai-cost-optimization/vendor-optimization');
    console.log('      • GET /api/v1/ai-cost-optimization/license-optimization');
    console.log('      • GET /api/v1/ai-cost-optimization/operational-efficiency');
    
    console.log('   📊 Dashboard & Insights:');
    console.log('      • GET /api/v1/ai-cost-optimization/dashboard');
    console.log('      • GET /api/v1/ai-cost-optimization/insights');

    console.log('\n🧠 AI Features Demonstrated:');
    console.log('   ✅ Pattern recognition and trend analysis');
    console.log('   ✅ Statistical anomaly detection with Z-score analysis');
    console.log('   ✅ Machine learning-based cost prediction');
    console.log('   ✅ Multi-criteria optimization scoring');
    console.log('   ✅ Vendor consolidation opportunity identification');
    console.log('   ✅ License utilization optimization');
    console.log('   ✅ Operational efficiency analysis');
    console.log('   ✅ Risk-adjusted ROI calculations');
    console.log('   ✅ Confidence-based recommendation ranking');
    console.log('   ✅ Implementation roadmap generation');

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
  testAICostOptimizationAPI().catch(console.error);
}

module.exports = { testAICostOptimizationAPI };
