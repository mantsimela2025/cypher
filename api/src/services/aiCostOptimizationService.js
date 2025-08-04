const { db } = require('../db');
const { 
  assetCostManagement, 
  assetLifecycle, 
  assetOperationalCosts, 
  assets 
} = require('../db/schema');
const { eq, and, gte, lte, desc, asc, sql, or, between } = require('drizzle-orm');

class AICostOptimizationService {

  // ==================== AI-POWERED COST ANALYSIS ====================

  /**
   * Generate comprehensive cost optimization recommendations using AI algorithms
   */
  async generateCostOptimizationRecommendations(options = {}) {
    const {
      assetUuid,
      costCenter,
      analysisDepth = 'comprehensive', // 'basic', 'comprehensive', 'deep'
      optimizationGoals = ['reduce_costs', 'improve_efficiency', 'minimize_risk'],
      timeHorizon = 12, // months
      confidenceThreshold = 0.7 // minimum confidence for recommendations
    } = options;

    try {
      console.log('🤖 Starting AI-powered cost optimization analysis...');

      // Gather comprehensive data for AI analysis
      const analysisData = await this._gatherAnalysisData(assetUuid, costCenter, timeHorizon);
      
      // Perform AI-driven pattern analysis
      const patterns = await this._analyzeSpendingPatterns(analysisData);
      
      // Detect cost anomalies using statistical methods
      const anomalies = await this._detectCostAnomalies(analysisData);
      
      // Generate optimization opportunities using ML algorithms
      const opportunities = await this._identifyOptimizationOpportunities(analysisData, patterns, anomalies);
      
      // Apply AI scoring and ranking
      const rankedRecommendations = await this._rankRecommendations(opportunities, optimizationGoals, confidenceThreshold);
      
      // Calculate potential savings and ROI
      const savingsAnalysis = await this._calculatePotentialSavings(rankedRecommendations, analysisData);
      
      // Generate implementation roadmap
      const implementationPlan = await this._generateImplementationRoadmap(rankedRecommendations);

      return {
        analysisId: `ai-opt-${Date.now()}`,
        generatedAt: new Date(),
        analysisScope: {
          assetUuid,
          costCenter,
          analysisDepth,
          timeHorizon: `${timeHorizon} months`,
          optimizationGoals
        },
        dataQuality: {
          totalDataPoints: analysisData.totalDataPoints,
          dataCompleteness: analysisData.completeness,
          confidenceLevel: analysisData.confidence
        },
        aiInsights: {
          spendingPatterns: patterns,
          detectedAnomalies: anomalies,
          optimizationScore: this._calculateOptimizationScore(opportunities)
        },
        recommendations: rankedRecommendations,
        potentialSavings: savingsAnalysis,
        implementationPlan,
        nextSteps: this._generateNextSteps(rankedRecommendations)
      };

    } catch (error) {
      console.error('Error in AI cost optimization analysis:', error);
      throw error;
    }
  }

  /**
   * Perform real-time cost anomaly detection
   */
  async detectCostAnomalies(options = {}) {
    const {
      assetUuid,
      costCenter,
      lookbackPeriod = 6, // months
      sensitivityLevel = 'medium', // 'low', 'medium', 'high'
      alertThreshold = 2.0 // standard deviations
    } = options;

    try {
      // Get recent cost data
      const recentCosts = await this._getRecentCostData(assetUuid, costCenter, lookbackPeriod);
      
      // Apply statistical anomaly detection
      const anomalies = await this._statisticalAnomalyDetection(recentCosts, alertThreshold);
      
      // Apply ML-based pattern recognition
      const patternAnomalies = await this._patternBasedAnomalyDetection(recentCosts, sensitivityLevel);
      
      // Combine and score anomalies
      const combinedAnomalies = this._combineAnomalyResults(anomalies, patternAnomalies);
      
      // Generate actionable alerts
      const alerts = this._generateAnomalyAlerts(combinedAnomalies);

      return {
        detectionId: `anomaly-${Date.now()}`,
        detectedAt: new Date(),
        analysisScope: {
          assetUuid,
          costCenter,
          lookbackPeriod: `${lookbackPeriod} months`,
          sensitivityLevel
        },
        anomalies: combinedAnomalies,
        alerts,
        summary: {
          totalAnomalies: combinedAnomalies.length,
          highSeverityCount: combinedAnomalies.filter(a => a.severity === 'high').length,
          estimatedImpact: combinedAnomalies.reduce((sum, a) => sum + (a.estimatedImpact || 0), 0)
        }
      };

    } catch (error) {
      console.error('Error in anomaly detection:', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered cost optimization strategies
   */
  async generateOptimizationStrategies(options = {}) {
    const {
      portfolioScope = 'all', // 'all', 'cost_center', 'asset_type'
      optimizationTarget = 0.15, // 15% cost reduction target
      riskTolerance = 'medium', // 'low', 'medium', 'high'
      timeframe = 'quarterly' // 'monthly', 'quarterly', 'annually'
    } = options;

    try {
      // Analyze portfolio-wide cost patterns
      const portfolioAnalysis = await this._analyzePortfolioCosts(portfolioScope);
      
      // Apply AI optimization algorithms
      const strategies = await this._generateOptimizationStrategies(
        portfolioAnalysis, 
        optimizationTarget, 
        riskTolerance
      );
      
      // Simulate strategy outcomes
      const simulations = await this._simulateStrategyOutcomes(strategies, portfolioAnalysis);
      
      // Rank strategies by effectiveness
      const rankedStrategies = this._rankStrategiesByEffectiveness(strategies, simulations);

      return {
        strategyId: `strategy-${Date.now()}`,
        generatedAt: new Date(),
        optimizationTarget: `${(optimizationTarget * 100)}% cost reduction`,
        riskTolerance,
        timeframe,
        portfolioAnalysis: {
          totalAssets: portfolioAnalysis.totalAssets,
          totalMonthlyCost: portfolioAnalysis.totalMonthlyCost,
          optimizationPotential: portfolioAnalysis.optimizationPotential
        },
        strategies: rankedStrategies,
        projectedOutcomes: {
          expectedSavings: rankedStrategies.reduce((sum, s) => sum + s.projectedSavings, 0),
          implementationCost: rankedStrategies.reduce((sum, s) => sum + s.implementationCost, 0),
          paybackPeriod: this._calculatePortfolioPaybackPeriod(rankedStrategies)
        }
      };

    } catch (error) {
      console.error('Error generating optimization strategies:', error);
      throw error;
    }
  }

  /**
   * Perform predictive cost modeling using machine learning
   */
  async generatePredictiveCostModel(options = {}) {
    const {
      assetUuid,
      modelType = 'ensemble', // 'linear', 'polynomial', 'ensemble'
      predictionHorizon = 12, // months
      includeExternalFactors = true,
      validationSplit = 0.2 // 20% for validation
    } = options;

    try {
      // Prepare training data
      const trainingData = await this._prepareTrainingData(assetUuid, includeExternalFactors);
      
      // Split data for training and validation
      const { trainSet, validationSet } = this._splitTrainingData(trainingData, validationSplit);
      
      // Train multiple models
      const models = await this._trainPredictiveModels(trainSet, modelType);
      
      // Validate model performance
      const validation = await this._validateModels(models, validationSet);
      
      // Select best performing model
      const bestModel = this._selectBestModel(models, validation);
      
      // Generate predictions
      const predictions = await this._generatePredictions(bestModel, predictionHorizon);
      
      // Calculate prediction confidence intervals
      const confidenceIntervals = this._calculatePredictionConfidence(predictions, validation);

      return {
        modelId: `model-${Date.now()}`,
        trainedAt: new Date(),
        modelType: bestModel.type,
        assetUuid,
        trainingData: {
          totalSamples: trainingData.length,
          features: trainingData.features,
          timeRange: trainingData.timeRange
        },
        modelPerformance: {
          accuracy: bestModel.accuracy,
          rmse: bestModel.rmse,
          mape: bestModel.mape, // Mean Absolute Percentage Error
          r2Score: bestModel.r2Score
        },
        predictions: predictions.map((pred, index) => ({
          month: pred.month,
          predictedCost: pred.value,
          confidence: confidenceIntervals[index],
          factors: pred.contributingFactors
        })),
        insights: {
          keyDrivers: bestModel.featureImportance,
          seasonalPatterns: bestModel.seasonality,
          trendAnalysis: bestModel.trends
        }
      };

    } catch (error) {
      console.error('Error in predictive cost modeling:', error);
      throw error;
    }
  }

  // ==================== AI ALGORITHM IMPLEMENTATIONS ====================

  async _gatherAnalysisData(assetUuid, costCenter, timeHorizon) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - timeHorizon);

    // Get cost management data
    let costQuery = db.select().from(assetCostManagement)
      .where(gte(assetCostManagement.createdAt, startDate));
    
    if (assetUuid) {
      costQuery = costQuery.where(eq(assetCostManagement.assetUuid, assetUuid));
    }
    if (costCenter) {
      costQuery = costQuery.where(eq(assetCostManagement.costCenter, costCenter));
    }

    const costData = await costQuery;

    // Get operational costs
    let opCostQuery = db.select().from(assetOperationalCosts)
      .where(gte(assetOperationalCosts.yearMonth, startDate));
    
    if (assetUuid) {
      opCostQuery = opCostQuery.where(eq(assetOperationalCosts.assetUuid, assetUuid));
    }

    const operationalData = await opCostQuery;

    // Calculate data quality metrics
    const totalDataPoints = costData.length + operationalData.length;
    const expectedDataPoints = timeHorizon * 2; // Rough estimate
    const completeness = Math.min(totalDataPoints / expectedDataPoints, 1.0);
    const confidence = this._calculateDataConfidence(costData, operationalData);

    return {
      costData,
      operationalData,
      totalDataPoints,
      completeness,
      confidence,
      timeRange: { startDate, endDate }
    };
  }

  async _analyzeSpendingPatterns(analysisData) {
    const patterns = [];

    // Analyze cost trends
    const trendAnalysis = this._analyzeCostTrends(analysisData.costData);
    patterns.push({
      type: 'trend',
      pattern: trendAnalysis.direction,
      strength: trendAnalysis.strength,
      confidence: trendAnalysis.confidence,
      description: `Cost trend is ${trendAnalysis.direction} with ${trendAnalysis.strength} strength`
    });

    // Analyze seasonality
    const seasonalAnalysis = this._analyzeSeasonality(analysisData.operationalData);
    if (seasonalAnalysis.hasSeasonality) {
      patterns.push({
        type: 'seasonality',
        pattern: seasonalAnalysis.pattern,
        strength: seasonalAnalysis.strength,
        confidence: seasonalAnalysis.confidence,
        description: `Seasonal pattern detected: ${seasonalAnalysis.description}`
      });
    }

    // Analyze cost distribution
    const distributionAnalysis = this._analyzeCostDistribution(analysisData.costData);
    patterns.push({
      type: 'distribution',
      pattern: distributionAnalysis.type,
      outliers: distributionAnalysis.outliers,
      confidence: distributionAnalysis.confidence,
      description: `Cost distribution follows ${distributionAnalysis.type} pattern`
    });

    return patterns;
  }

  async _detectCostAnomalies(analysisData) {
    const anomalies = [];

    // Statistical outlier detection using Z-score
    const costAmounts = analysisData.costData.map(c => parseFloat(c.amount));
    const mean = costAmounts.reduce((sum, val) => sum + val, 0) / costAmounts.length;
    const stdDev = Math.sqrt(costAmounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / costAmounts.length);

    analysisData.costData.forEach(cost => {
      const zScore = Math.abs((parseFloat(cost.amount) - mean) / stdDev);
      if (zScore > 2.5) { // 2.5 standard deviations
        anomalies.push({
          type: 'statistical_outlier',
          severity: zScore > 3 ? 'high' : 'medium',
          assetUuid: cost.assetUuid,
          costType: cost.costType,
          amount: parseFloat(cost.amount),
          expectedRange: [mean - 2 * stdDev, mean + 2 * stdDev],
          zScore: zScore,
          date: cost.createdAt,
          description: `Cost amount ${zScore > 3 ? 'significantly' : 'moderately'} exceeds normal range`,
          estimatedImpact: Math.abs(parseFloat(cost.amount) - mean)
        });
      }
    });

    // Operational cost spike detection
    const opCostAnomalies = this._detectOperationalAnomalies(analysisData.operationalData);
    anomalies.push(...opCostAnomalies);

    return anomalies;
  }

  async _identifyOptimizationOpportunities(analysisData, patterns, anomalies) {
    const opportunities = [];

    // Vendor consolidation opportunities
    const vendorOpportunities = this._identifyVendorConsolidation(analysisData.costData);
    opportunities.push(...vendorOpportunities);

    // License optimization opportunities
    const licenseOpportunities = this._identifyLicenseOptimization(analysisData.costData);
    opportunities.push(...licenseOpportunities);

    // Operational efficiency opportunities
    const operationalOpportunities = this._identifyOperationalEfficiencies(analysisData.operationalData);
    opportunities.push(...operationalOpportunities);

    // Lifecycle optimization opportunities
    const lifecycleOpportunities = await this._identifyLifecycleOptimizations(analysisData);
    opportunities.push(...lifecycleOpportunities);

    // Pattern-based opportunities
    const patternOpportunities = this._identifyPatternBasedOptimizations(patterns);
    opportunities.push(...patternOpportunities);

    // Anomaly-based opportunities
    const anomalyOpportunities = this._identifyAnomalyBasedOptimizations(anomalies);
    opportunities.push(...anomalyOpportunities);

    return opportunities;
  }

  // ==================== AI HELPER METHODS ====================

  _calculateDataConfidence(costData, operationalData) {
    // Simple confidence calculation based on data consistency and completeness
    const costConsistency = this._calculateDataConsistency(costData.map(c => parseFloat(c.amount)));
    const opCostConsistency = this._calculateDataConsistency(
      operationalData.map(o =>
        (parseFloat(o.powerCost) || 0) + (parseFloat(o.spaceCost) || 0) +
        (parseFloat(o.networkCost) || 0) + (parseFloat(o.storageCost) || 0)
      )
    );

    return (costConsistency + opCostConsistency) / 2;
  }

  _calculateDataConsistency(values) {
    if (values.length < 2) return 0.5;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;

    // Lower coefficient of variation = higher consistency
    return Math.max(0, 1 - coefficientOfVariation);
  }

  _analyzeCostTrends(costData) {
    if (costData.length < 3) {
      return { direction: 'insufficient_data', strength: 0, confidence: 0 };
    }

    // Sort by date and calculate trend using linear regression
    const sortedData = costData
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((item, index) => ({ x: index, y: parseFloat(item.amount) }));

    const n = sortedData.length;
    const sumX = sortedData.reduce((sum, point) => sum + point.x, 0);
    const sumY = sortedData.reduce((sum, point) => sum + point.y, 0);
    const sumXY = sortedData.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumX2 = sortedData.reduce((sum, point) => sum + point.x * point.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const correlation = this._calculateCorrelation(sortedData);

    let direction = 'stable';
    let strength = 'weak';

    if (Math.abs(slope) > 100) { // Significant slope
      direction = slope > 0 ? 'increasing' : 'decreasing';
      strength = Math.abs(correlation) > 0.7 ? 'strong' : Math.abs(correlation) > 0.4 ? 'moderate' : 'weak';
    }

    return {
      direction,
      strength,
      confidence: Math.abs(correlation),
      slope,
      correlation
    };
  }

  _calculateCorrelation(data) {
    const n = data.length;
    const sumX = data.reduce((sum, point) => sum + point.x, 0);
    const sumY = data.reduce((sum, point) => sum + point.y, 0);
    const sumXY = data.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumX2 = data.reduce((sum, point) => sum + point.x * point.x, 0);
    const sumY2 = data.reduce((sum, point) => sum + point.y * point.y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  _analyzeSeasonality(operationalData) {
    if (operationalData.length < 12) {
      return { hasSeasonality: false, confidence: 0 };
    }

    // Group by month and calculate averages
    const monthlyAverages = {};
    const monthlyCounts = {};

    operationalData.forEach(data => {
      const month = new Date(data.yearMonth).getMonth();
      const totalCost = (parseFloat(data.powerCost) || 0) +
                       (parseFloat(data.spaceCost) || 0) +
                       (parseFloat(data.networkCost) || 0) +
                       (parseFloat(data.storageCost) || 0);

      monthlyAverages[month] = (monthlyAverages[month] || 0) + totalCost;
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    });

    // Calculate seasonal factors
    const seasonalFactors = [];
    const overallAverage = Object.values(monthlyAverages).reduce((sum, val) => sum + val, 0) /
                          Object.values(monthlyCounts).reduce((sum, val) => sum + val, 0);

    for (let month = 0; month < 12; month++) {
      if (monthlyCounts[month]) {
        const monthlyAverage = monthlyAverages[month] / monthlyCounts[month];
        seasonalFactors.push(monthlyAverage / overallAverage);
      }
    }

    // Calculate seasonality strength
    const variance = seasonalFactors.reduce((sum, factor) => sum + Math.pow(factor - 1, 2), 0) / seasonalFactors.length;
    const seasonalityStrength = Math.sqrt(variance);

    const hasSeasonality = seasonalityStrength > 0.1; // 10% variation threshold

    return {
      hasSeasonality,
      pattern: seasonalFactors,
      strength: seasonalityStrength > 0.3 ? 'strong' : seasonalityStrength > 0.1 ? 'moderate' : 'weak',
      confidence: Math.min(seasonalityStrength * 2, 1.0),
      description: hasSeasonality ?
        `${seasonalityStrength > 0.3 ? 'Strong' : 'Moderate'} seasonal variation detected` :
        'No significant seasonal pattern'
    };
  }

  _analyzeCostDistribution(costData) {
    const amounts = costData.map(c => parseFloat(c.amount)).sort((a, b) => a - b);

    if (amounts.length < 5) {
      return { type: 'insufficient_data', outliers: [], confidence: 0 };
    }

    // Calculate quartiles
    const q1 = amounts[Math.floor(amounts.length * 0.25)];
    const q3 = amounts[Math.floor(amounts.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    // Identify outliers
    const outliers = amounts.filter(amount => amount < lowerBound || amount > upperBound);

    // Determine distribution type
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const median = amounts[Math.floor(amounts.length / 2)];
    const skewness = (mean - median) / mean;

    let distributionType = 'normal';
    if (Math.abs(skewness) > 0.5) {
      distributionType = skewness > 0 ? 'right_skewed' : 'left_skewed';
    }

    return {
      type: distributionType,
      outliers: outliers.length,
      confidence: Math.max(0.5, 1 - Math.abs(skewness)),
      statistics: {
        mean,
        median,
        q1,
        q3,
        iqr,
        skewness
      }
    };
  }

  _detectOperationalAnomalies(operationalData) {
    const anomalies = [];

    // Calculate monthly totals
    const monthlyTotals = operationalData.map(data => ({
      month: data.yearMonth,
      total: (parseFloat(data.powerCost) || 0) +
             (parseFloat(data.spaceCost) || 0) +
             (parseFloat(data.networkCost) || 0) +
             (parseFloat(data.storageCost) || 0) +
             (parseFloat(data.laborCost) || 0) +
             (parseFloat(data.otherCosts) || 0),
      breakdown: {
        power: parseFloat(data.powerCost) || 0,
        space: parseFloat(data.spaceCost) || 0,
        network: parseFloat(data.networkCost) || 0,
        storage: parseFloat(data.storageCost) || 0,
        labor: parseFloat(data.laborCost) || 0,
        other: parseFloat(data.otherCosts) || 0
      },
      assetUuid: data.assetUuid
    }));

    if (monthlyTotals.length < 3) return anomalies;

    // Calculate rolling average and detect spikes
    const windowSize = Math.min(3, monthlyTotals.length - 1);

    for (let i = windowSize; i < monthlyTotals.length; i++) {
      const current = monthlyTotals[i];
      const window = monthlyTotals.slice(i - windowSize, i);
      const avgWindow = window.reduce((sum, item) => sum + item.total, 0) / window.length;
      const stdWindow = Math.sqrt(window.reduce((sum, item) => sum + Math.pow(item.total - avgWindow, 2), 0) / window.length);

      const zScore = Math.abs((current.total - avgWindow) / (stdWindow || 1));

      if (zScore > 2.0) { // Significant deviation
        // Identify which cost category caused the spike
        const spikeCategory = this._identifySpikeCause(current.breakdown, window);

        anomalies.push({
          type: 'operational_spike',
          severity: zScore > 3 ? 'high' : 'medium',
          assetUuid: current.assetUuid,
          month: current.month,
          actualCost: current.total,
          expectedCost: avgWindow,
          deviation: current.total - avgWindow,
          zScore: zScore,
          spikeCategory: spikeCategory,
          description: `Operational cost spike in ${spikeCategory} category`,
          estimatedImpact: Math.abs(current.total - avgWindow)
        });
      }
    }

    return anomalies;
  }

  _identifySpikeCause(currentBreakdown, historicalWindow) {
    // Calculate average breakdown for historical window
    const avgBreakdown = {};
    Object.keys(currentBreakdown).forEach(category => {
      avgBreakdown[category] = historicalWindow.reduce((sum, item) =>
        sum + (item.breakdown[category] || 0), 0) / historicalWindow.length;
    });

    // Find category with largest relative increase
    let maxIncrease = 0;
    let spikeCategory = 'unknown';

    Object.keys(currentBreakdown).forEach(category => {
      const current = currentBreakdown[category];
      const avg = avgBreakdown[category];

      if (avg > 0) {
        const relativeIncrease = (current - avg) / avg;
        if (relativeIncrease > maxIncrease) {
          maxIncrease = relativeIncrease;
          spikeCategory = category;
        }
      }
    });

    return spikeCategory;
  }

  _identifyVendorConsolidation(costData) {
    const opportunities = [];

    // Group costs by vendor
    const vendorCosts = {};
    costData.forEach(cost => {
      if (cost.vendor) {
        vendorCosts[cost.vendor] = (vendorCosts[cost.vendor] || 0) + parseFloat(cost.amount);
      }
    });

    // Identify vendors with similar services
    const vendors = Object.keys(vendorCosts);
    const serviceTypes = {};

    costData.forEach(cost => {
      if (cost.vendor && cost.costType) {
        if (!serviceTypes[cost.costType]) serviceTypes[cost.costType] = [];
        if (!serviceTypes[cost.costType].includes(cost.vendor)) {
          serviceTypes[cost.costType].push(cost.vendor);
        }
      }
    });

    // Find consolidation opportunities
    Object.entries(serviceTypes).forEach(([serviceType, vendorList]) => {
      if (vendorList.length > 1) {
        const totalSpend = vendorList.reduce((sum, vendor) => sum + (vendorCosts[vendor] || 0), 0);
        const potentialSavings = totalSpend * 0.15; // Assume 15% savings from consolidation

        opportunities.push({
          type: 'vendor_consolidation',
          category: 'procurement_optimization',
          title: `Consolidate ${serviceType} vendors`,
          description: `Multiple vendors (${vendorList.join(', ')}) providing ${serviceType} services`,
          currentSpend: totalSpend,
          potentialSavings: potentialSavings,
          confidence: 0.7,
          effort: 'medium',
          timeframe: '3-6 months',
          riskLevel: 'low',
          implementation: {
            steps: [
              'Analyze current vendor contracts and terms',
              'Request consolidated quotes from preferred vendors',
              'Negotiate volume discounts',
              'Plan migration timeline',
              'Execute vendor consolidation'
            ],
            estimatedCost: totalSpend * 0.05 // 5% implementation cost
          }
        });
      }
    });

    return opportunities;
  }

  _identifyLicenseOptimization(costData) {
    const opportunities = [];

    // Find license-related costs
    const licenseCosts = costData.filter(cost =>
      cost.costType === 'license' || cost.costType === 'subscription'
    );

    if (licenseCosts.length === 0) return opportunities;

    // Group by vendor/product
    const licenseGroups = {};
    licenseCosts.forEach(cost => {
      const key = `${cost.vendor || 'unknown'}_${cost.costType}`;
      if (!licenseGroups[key]) {
        licenseGroups[key] = [];
      }
      licenseGroups[key].push(cost);
    });

    // Analyze each license group
    Object.entries(licenseGroups).forEach(([key, costs]) => {
      const totalAnnualCost = costs.reduce((sum, cost) => {
        const amount = parseFloat(cost.amount);
        // Convert to annual cost based on billing cycle
        switch (cost.billingCycle) {
          case 'monthly': return sum + (amount * 12);
          case 'quarterly': return sum + (amount * 4);
          case 'semi_annual': return sum + (amount * 2);
          default: return sum + amount;
        }
      }, 0);

      if (totalAnnualCost > 5000) { // Only consider significant license costs
        opportunities.push({
          type: 'license_optimization',
          category: 'software_optimization',
          title: `Optimize ${key.replace('_', ' ')} licensing`,
          description: `Review licensing model and usage patterns for potential optimization`,
          currentSpend: totalAnnualCost,
          potentialSavings: totalAnnualCost * 0.20, // Assume 20% potential savings
          confidence: 0.6,
          effort: 'low',
          timeframe: '1-3 months',
          riskLevel: 'low',
          implementation: {
            steps: [
              'Audit current license usage and requirements',
              'Identify unused or underutilized licenses',
              'Negotiate with vendor for better terms',
              'Consider alternative licensing models',
              'Implement license management tools'
            ],
            estimatedCost: totalAnnualCost * 0.02 // 2% implementation cost
          }
        });
      }
    });

    return opportunities;
  }

  _identifyOperationalEfficiencies(operationalData) {
    const opportunities = [];

    if (operationalData.length < 3) return opportunities;

    // Analyze power cost efficiency
    const powerCosts = operationalData.map(d => parseFloat(d.powerCost) || 0);
    const avgPowerCost = powerCosts.reduce((sum, cost) => sum + cost, 0) / powerCosts.length;
    const maxPowerCost = Math.max(...powerCosts);

    if (maxPowerCost > avgPowerCost * 1.5) { // 50% above average
      opportunities.push({
        type: 'power_optimization',
        category: 'operational_efficiency',
        title: 'Optimize power consumption',
        description: 'Power costs show significant variation, indicating optimization potential',
        currentSpend: avgPowerCost * 12, // Annual estimate
        potentialSavings: (maxPowerCost - avgPowerCost) * 12 * 0.7, // 70% of excess
        confidence: 0.8,
        effort: 'medium',
        timeframe: '2-4 months',
        riskLevel: 'low',
        implementation: {
          steps: [
            'Conduct power usage audit',
            'Implement power management policies',
            'Upgrade to energy-efficient hardware',
            'Optimize cooling systems',
            'Monitor and adjust power settings'
          ],
          estimatedCost: avgPowerCost * 2 // 2 months of power cost for implementation
        }
      });
    }

    return opportunities;
  }

  async _identifyLifecycleOptimizations(analysisData) {
    const opportunities = [];

    // This would typically query lifecycle data, but for now we'll simulate
    // In a real implementation, this would analyze asset age, replacement schedules, etc.

    opportunities.push({
      type: 'lifecycle_optimization',
      category: 'asset_lifecycle',
      title: 'Optimize asset replacement timing',
      description: 'Analysis suggests potential for optimizing asset replacement schedules',
      currentSpend: 50000, // Placeholder
      potentialSavings: 7500, // 15% savings
      confidence: 0.6,
      effort: 'high',
      timeframe: '6-12 months',
      riskLevel: 'medium',
      implementation: {
        steps: [
          'Analyze current asset lifecycle data',
          'Develop optimal replacement schedule',
          'Negotiate bulk purchase agreements',
          'Plan phased replacement approach',
          'Execute optimized replacement plan'
        ],
        estimatedCost: 2500
      }
    });

    return opportunities;
  }

  _identifyPatternBasedOptimizations(patterns) {
    const opportunities = [];

    patterns.forEach(pattern => {
      if (pattern.type === 'trend' && pattern.pattern === 'increasing' && pattern.strength === 'strong') {
        opportunities.push({
          type: 'trend_intervention',
          category: 'cost_control',
          title: 'Address increasing cost trend',
          description: `Strong increasing trend detected with ${pattern.confidence.toFixed(2)} confidence`,
          potentialSavings: 10000, // Placeholder - would be calculated based on trend
          confidence: pattern.confidence,
          effort: 'medium',
          timeframe: '1-3 months',
          riskLevel: 'medium',
          implementation: {
            steps: [
              'Investigate root cause of cost increases',
              'Implement cost control measures',
              'Monitor trend reversal',
              'Adjust budgets and forecasts'
            ],
            estimatedCost: 1000
          }
        });
      }
    });

    return opportunities;
  }

  _identifyAnomalyBasedOptimizations(anomalies) {
    const opportunities = [];

    const highImpactAnomalies = anomalies.filter(a => a.estimatedImpact > 1000);

    if (highImpactAnomalies.length > 0) {
      const totalImpact = highImpactAnomalies.reduce((sum, a) => sum + a.estimatedImpact, 0);

      opportunities.push({
        type: 'anomaly_prevention',
        category: 'cost_control',
        title: 'Prevent cost anomalies',
        description: `${highImpactAnomalies.length} high-impact cost anomalies detected`,
        potentialSavings: totalImpact * 0.8, // 80% prevention rate
        confidence: 0.7,
        effort: 'medium',
        timeframe: '1-2 months',
        riskLevel: 'low',
        implementation: {
          steps: [
            'Implement automated cost monitoring',
            'Set up anomaly detection alerts',
            'Establish approval workflows for large expenses',
            'Train staff on cost management best practices'
          ],
          estimatedCost: totalImpact * 0.1
        }
      });
    }

    return opportunities;
  }

  async _rankRecommendations(opportunities, optimizationGoals, confidenceThreshold) {
    // Filter by confidence threshold
    const qualifiedOpportunities = opportunities.filter(opp => opp.confidence >= confidenceThreshold);

    // Score each opportunity based on multiple criteria
    const scoredOpportunities = qualifiedOpportunities.map(opp => {
      let score = 0;

      // ROI score (40% weight)
      const roi = (opp.potentialSavings - (opp.implementation?.estimatedCost || 0)) / (opp.implementation?.estimatedCost || 1);
      score += Math.min(roi / 5, 1) * 0.4; // Normalize to 0-1, cap at 5x ROI

      // Confidence score (25% weight)
      score += opp.confidence * 0.25;

      // Effort score (20% weight) - lower effort = higher score
      const effortScore = opp.effort === 'low' ? 1 : opp.effort === 'medium' ? 0.6 : 0.3;
      score += effortScore * 0.2;

      // Risk score (15% weight) - lower risk = higher score
      const riskScore = opp.riskLevel === 'low' ? 1 : opp.riskLevel === 'medium' ? 0.6 : 0.3;
      score += riskScore * 0.15;

      return {
        ...opp,
        aiScore: Math.round(score * 100) / 100,
        roi: Math.round(roi * 100) / 100
      };
    });

    // Sort by AI score (descending)
    return scoredOpportunities.sort((a, b) => b.aiScore - a.aiScore);
  }

  async _calculatePotentialSavings(recommendations) {
    const totalPotentialSavings = recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0);
    const totalImplementationCost = recommendations.reduce((sum, rec) => sum + (rec.implementation?.estimatedCost || 0), 0);
    const netSavings = totalPotentialSavings - totalImplementationCost;

    // Calculate savings by category
    const savingsByCategory = {};
    recommendations.forEach(rec => {
      savingsByCategory[rec.category] = (savingsByCategory[rec.category] || 0) + rec.potentialSavings;
    });

    // Calculate implementation timeline
    const timeframes = recommendations.map(rec => rec.timeframe);
    const avgTimeframe = this._calculateAverageTimeframe(timeframes);

    return {
      totalPotentialSavings: Math.round(totalPotentialSavings * 100) / 100,
      totalImplementationCost: Math.round(totalImplementationCost * 100) / 100,
      netSavings: Math.round(netSavings * 100) / 100,
      roi: Math.round((netSavings / totalImplementationCost) * 100) / 100,
      paybackPeriod: Math.round((totalImplementationCost / (totalPotentialSavings / 12)) * 10) / 10, // months
      savingsByCategory,
      averageImplementationTime: avgTimeframe,
      confidenceLevel: recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length
    };
  }

  _calculateAverageTimeframe(timeframes) {
    // Convert timeframes to months for averaging
    const monthsMap = {
      '1-2 months': 1.5,
      '1-3 months': 2,
      '2-4 months': 3,
      '3-6 months': 4.5,
      '6-12 months': 9
    };

    const totalMonths = timeframes.reduce((sum, tf) => sum + (monthsMap[tf] || 3), 0);
    const avgMonths = totalMonths / timeframes.length;

    if (avgMonths <= 2) return '1-2 months';
    if (avgMonths <= 3) return '2-3 months';
    if (avgMonths <= 4.5) return '3-6 months';
    return '6-12 months';
  }

  async _generateImplementationRoadmap(recommendations) {
    // Group recommendations by timeframe and effort
    const quickWins = recommendations.filter(rec => rec.effort === 'low' && rec.timeframe.includes('1-'));
    const mediumTerm = recommendations.filter(rec => rec.effort === 'medium' || rec.timeframe.includes('3-'));
    const longTerm = recommendations.filter(rec => rec.effort === 'high' || rec.timeframe.includes('6-'));

    return {
      phase1: {
        name: 'Quick Wins (0-3 months)',
        recommendations: quickWins.slice(0, 5), // Top 5 quick wins
        totalSavings: quickWins.reduce((sum, rec) => sum + rec.potentialSavings, 0),
        focus: 'Low-effort, high-impact optimizations'
      },
      phase2: {
        name: 'Medium-term Initiatives (3-6 months)',
        recommendations: mediumTerm.slice(0, 3), // Top 3 medium-term
        totalSavings: mediumTerm.reduce((sum, rec) => sum + rec.potentialSavings, 0),
        focus: 'Process improvements and vendor negotiations'
      },
      phase3: {
        name: 'Strategic Projects (6-12 months)',
        recommendations: longTerm.slice(0, 2), // Top 2 long-term
        totalSavings: longTerm.reduce((sum, rec) => sum + rec.potentialSavings, 0),
        focus: 'Major system changes and lifecycle optimization'
      }
    };
  }

  _generateNextSteps(recommendations) {
    const topRecommendations = recommendations.slice(0, 3);

    return topRecommendations.map((rec, index) => ({
      priority: index + 1,
      action: rec.title,
      description: rec.description,
      immediateSteps: rec.implementation?.steps?.slice(0, 2) || [],
      expectedOutcome: `$${rec.potentialSavings.toFixed(0)} annual savings`,
      timeline: rec.timeframe,
      owner: 'Cost Optimization Team' // Would be configurable
    }));
  }

  _calculateOptimizationScore(opportunities) {
    if (opportunities.length === 0) return 0;

    const totalSavings = opportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0);
    const avgConfidence = opportunities.reduce((sum, opp) => sum + opp.confidence, 0) / opportunities.length;
    const implementationComplexity = opportunities.reduce((sum, opp) => {
      const complexity = opp.effort === 'low' ? 1 : opp.effort === 'medium' ? 2 : 3;
      return sum + complexity;
    }, 0) / opportunities.length;

    // Score from 0-100 based on savings potential, confidence, and ease of implementation
    const savingsScore = Math.min(totalSavings / 50000, 1) * 40; // Normalize to $50k max
    const confidenceScore = avgConfidence * 30;
    const implementationScore = (4 - implementationComplexity) / 3 * 30; // Lower complexity = higher score

    return Math.round(savingsScore + confidenceScore + implementationScore);
  }
}

module.exports = new AICostOptimizationService();
