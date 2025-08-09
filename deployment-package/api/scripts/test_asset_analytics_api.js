#!/usr/bin/env node
/**
 * Test Asset Analytics API
 * Comprehensive testing of advanced analytics features
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1/asset-analytics';
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

async function testAssetAnalyticsAPI() {
  console.log('🧪 Testing Asset Analytics API - Advanced Features');
  console.log('==================================================\n');

  try {
    const authHeaders = await authenticate();
    
    // Test 1: Cost Forecasting
    console.log('📈 Test 1: Cost Forecasting');
    console.log('----------------------------');
    
    const forecastResponse = await axios.get(
      `${BASE_URL}/forecast/${testAssetUuid}?forecastMonths=12&includeInflation=true&inflationRate=0.03&confidenceLevel=0.95`, 
      authHeaders
    );
    const forecastData = forecastResponse.data.data;
    
    console.log(`✅ Cost forecast generated for ${forecastData.forecastPeriod}`);
    console.log(`   • Historical data points: ${forecastData.historicalDataPoints}`);
    console.log(`   • Average monthly cost: $${forecastData.trends.averageMonthlyCost.toFixed(2)}`);
    console.log(`   • Monthly growth rate: ${(forecastData.trends.monthlyGrowthRate * 100).toFixed(2)}%`);
    console.log(`   • Volatility: ${(forecastData.trends.volatility * 100).toFixed(2)}%`);
    
    if (forecastData.forecasts && forecastData.forecasts.length > 0) {
      console.log('   • Sample forecasts:');
      forecastData.forecasts.slice(0, 3).forEach((forecast, i) => {
        console.log(`     ${i+1}. ${forecast.month}: $${forecast.forecastedCost} (${forecast.lowerBound}-${forecast.upperBound})`);
      });
    }

    // Test 2: Budget Planning
    console.log('\n💰 Test 2: Budget Planning');
    console.log('---------------------------');
    
    const budgetResponse = await axios.get(
      `${BASE_URL}/budget-plan?budgetYear=2026&includeCapex=true&includeOpex=true&riskBuffer=0.10`, 
      authHeaders
    );
    const budgetData = budgetResponse.data.data;
    
    console.log(`✅ Budget plan generated for ${budgetData.budgetYear}`);
    console.log(`   • Total CAPEX: $${budgetData.summary.totalCapex.toFixed(2)}`);
    console.log(`   • Total OPEX: $${budgetData.summary.totalOpex.toFixed(2)}`);
    console.log(`   • Total Budget: $${budgetData.summary.totalBudget.toFixed(2)}`);
    console.log(`   • Risk-Adjusted Budget: $${budgetData.summary.riskAdjustedBudget.toFixed(2)}`);
    
    if (budgetData.recommendations && budgetData.recommendations.length > 0) {
      console.log('   • Key recommendations:');
      budgetData.recommendations.slice(0, 2).forEach((rec, i) => {
        console.log(`     ${i+1}. ${rec.category}: ${rec.recommendation}`);
      });
    }

    // Test 3: Lifecycle Planning
    console.log('\n🔄 Test 3: Lifecycle Planning');
    console.log('------------------------------');
    
    const lifecycleResponse = await axios.get(
      `${BASE_URL}/lifecycle-plan?planningHorizon=60&replacementThreshold=0.8&includeRiskAssessment=true`, 
      authHeaders
    );
    const lifecycleData = lifecycleResponse.data.data;
    
    console.log(`✅ Lifecycle plan generated for ${lifecycleData.planningHorizon}`);
    console.log(`   • Total assets: ${lifecycleData.summary.totalAssets}`);
    console.log(`   • Assets requiring replacement: ${lifecycleData.summary.assetsRequiringReplacement}`);
    console.log(`   • Total replacement cost: $${lifecycleData.summary.totalReplacementCost.toFixed(2)}`);
    console.log(`   • Average asset age: ${lifecycleData.summary.averageAssetAge.toFixed(1)} months`);
    
    console.log('   • Asset categories:');
    Object.entries(lifecycleData.lifecycleCategories).forEach(([category, assets]) => {
      if (assets.length > 0) {
        console.log(`     • ${category}: ${assets.length} assets`);
      }
    });

    // Test 4: Replacement Schedule Optimization
    console.log('\n📅 Test 4: Replacement Schedule Optimization');
    console.log('---------------------------------------------');
    
    const scheduleResponse = await axios.get(
      `${BASE_URL}/replacement-schedule?budgetConstraint=100000&prioritizeBy=risk&allowBudgetReallocation=true`, 
      authHeaders
    );
    const scheduleData = scheduleResponse.data.data;
    
    console.log(`✅ Replacement schedule optimized`);
    console.log(`   • Optimization method: ${scheduleData.optimization.prioritizeBy}`);
    console.log(`   • Budget constraint: $${scheduleData.optimization.budgetConstraint}`);
    console.log(`   • Total optimized cost: $${scheduleData.optimization.totalOptimizedCost.toFixed(2)}`);
    console.log(`   • Assets deferred: ${scheduleData.optimization.assetsDeferred}`);
    
    if (scheduleData.optimizedSchedule && scheduleData.optimizedSchedule.length > 0) {
      console.log('   • Priority replacements:');
      scheduleData.optimizedSchedule.slice(0, 3).forEach((item, i) => {
        console.log(`     ${i+1}. ${item.hostname}: $${item.estimatedCost} (${item.priority} priority)`);
      });
    }

    // Test 5: ROI Analysis
    console.log('\n📊 Test 5: ROI Analysis');
    console.log('------------------------');
    
    const roiResponse = await axios.get(
      `${BASE_URL}/roi/${testAssetUuid}?analysisMethod=comprehensive&discountRate=0.08&timeHorizon=60`, 
      authHeaders
    );
    const roiData = roiResponse.data.data;
    
    console.log(`✅ ROI analysis completed using ${roiData.roiMetrics.method}`);
    console.log(`   • ROI: ${roiData.roiMetrics.roi}%`);
    console.log(`   • Total investment: $${roiData.investment.totalInvestment.toFixed(2)}`);
    console.log(`   • Total benefits: $${roiData.benefits.totalBenefits.toFixed(2)}`);
    console.log(`   • Net benefit: $${roiData.roiMetrics.netBenefit.toFixed(2)}`);
    console.log(`   • Payback period: ${roiData.roiMetrics.paybackPeriod.toFixed(1)} months`);
    console.log(`   • Interpretation: ${roiData.roiMetrics.interpretation}`);

    // Test 6: Depreciation Analysis
    console.log('\n📉 Test 6: Depreciation Analysis');
    console.log('---------------------------------');
    
    const depreciationResponse = await axios.get(
      `${BASE_URL}/depreciation/${testAssetUuid}?methods=straight_line,declining_balance&decliningBalanceRate=0.20&salvageValuePercent=0.10`, 
      authHeaders
    );
    const depreciationData = depreciationResponse.data.data;
    
    console.log(`✅ Depreciation analysis completed`);
    console.log(`   • Purchase cost: $${depreciationData.assetDetails.purchaseCost.toFixed(2)}`);
    console.log(`   • Asset age: ${depreciationData.assetDetails.monthsElapsed} months`);
    console.log(`   • Remaining life: ${depreciationData.assetDetails.remainingLife} months`);
    
    Object.entries(depreciationData.depreciationMethods).forEach(([method, data]) => {
      if (data.bookValue !== undefined) {
        console.log(`   • ${data.method}:`);
        console.log(`     - Book value: $${data.bookValue.toFixed(2)}`);
        console.log(`     - Accumulated depreciation: $${data.accumulatedDepreciation.toFixed(2)}`);
      }
    });

    // Test 7: Comprehensive Financial Analysis
    console.log('\n💼 Test 7: Comprehensive Financial Analysis');
    console.log('--------------------------------------------');
    
    const financialResponse = await axios.get(
      `${BASE_URL}/financial-analysis/${testAssetUuid}?includeROI=true&includeDepreciation=true&includeTCO=true&analysisHorizon=60`, 
      authHeaders
    );
    const financialData = financialResponse.data.data;
    
    console.log(`✅ Financial analysis completed for ${financialData.analysisHorizon}`);
    console.log(`   • Financial health score: ${financialData.financialHealthScore}/100`);
    
    if (financialData.roiAnalysis) {
      console.log(`   • ROI: ${financialData.roiAnalysis.roiMetrics.roi}%`);
    }
    
    if (financialData.depreciationAnalysis) {
      const straightLine = financialData.depreciationAnalysis.depreciationMethods.straightLine;
      if (straightLine) {
        console.log(`   • Current book value: $${straightLine.bookValue.toFixed(2)}`);
      }
    }
    
    if (financialData.tcoAnalysis) {
      console.log(`   • Total Cost of Ownership: $${financialData.tcoAnalysis.totalCostOfOwnership.toFixed(2)}`);
    }

    // Test 8: Analytics Dashboard
    console.log('\n📊 Test 8: Analytics Dashboard');
    console.log('-------------------------------');
    
    const dashboardResponse = await axios.get(
      `${BASE_URL}/dashboard?timeRange=1y&includeForecasts=true&includeLifecycle=true`, 
      authHeaders
    );
    const dashboardData = dashboardResponse.data.data;
    
    console.log(`✅ Analytics dashboard data retrieved`);
    console.log(`   • Time range: ${dashboardData.timeRange}`);
    console.log(`   • Generated at: ${new Date(dashboardData.generatedAt).toLocaleString()}`);
    
    if (dashboardData.budgetPlan) {
      console.log(`   • Budget plan included: ${dashboardData.budgetPlan.budgetYear}`);
    }
    
    if (dashboardData.lifecyclePlan) {
      console.log(`   • Lifecycle plan included: ${dashboardData.lifecyclePlan.summary.totalAssets} assets`);
    }

    // Test 9: Portfolio Summary
    console.log('\n🏢 Test 9: Portfolio Summary');
    console.log('-----------------------------');
    
    const portfolioResponse = await axios.get(`${BASE_URL}/portfolio-summary`, authHeaders);
    const portfolioData = portfolioResponse.data.data;
    
    console.log(`✅ Portfolio summary retrieved`);
    console.log(`   • Generated at: ${new Date(portfolioData.generatedAt).toLocaleString()}`);
    console.log(`   • Note: ${portfolioData.note}`);

    console.log('\n🎉 All Asset Analytics API tests completed successfully!');
    
    console.log('\n📋 Available Advanced Analytics Endpoints:');
    console.log('   📈 Cost Forecasting:');
    console.log('      • GET /api/v1/asset-analytics/forecast/:assetUuid');
    console.log('      • GET /api/v1/asset-analytics/budget-plan');
    
    console.log('   🔄 Lifecycle Planning:');
    console.log('      • GET /api/v1/asset-analytics/lifecycle-plan');
    console.log('      • GET /api/v1/asset-analytics/replacement-schedule');
    
    console.log('   💼 Financial Analysis:');
    console.log('      • GET /api/v1/asset-analytics/roi/:assetUuid');
    console.log('      • GET /api/v1/asset-analytics/depreciation/:assetUuid');
    console.log('      • GET /api/v1/asset-analytics/financial-analysis/:assetUuid');
    
    console.log('   📊 Dashboard & Summary:');
    console.log('      • GET /api/v1/asset-analytics/dashboard');
    console.log('      • GET /api/v1/asset-analytics/portfolio-summary');

    console.log('\n💡 Key Features Demonstrated:');
    console.log('   ✅ Cost forecasting with trend analysis and confidence intervals');
    console.log('   ✅ Budget planning with CAPEX/OPEX breakdown and risk buffers');
    console.log('   ✅ Lifecycle planning with replacement scheduling');
    console.log('   ✅ ROI calculations using multiple methodologies');
    console.log('   ✅ Depreciation analysis with multiple accounting methods');
    console.log('   ✅ Comprehensive financial health scoring');
    console.log('   ✅ Portfolio-wide analytics and dashboards');

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
  testAssetAnalyticsAPI().catch(console.error);
}

module.exports = { testAssetAnalyticsAPI };
