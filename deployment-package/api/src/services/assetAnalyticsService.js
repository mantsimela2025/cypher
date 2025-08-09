const { db } = require('../db');
const {
  assetCostManagement,
  assetLifecycle,
  assetOperationalCosts,
  assets
} = require('../db/schema');
const { eq, and, gte, lte, desc, asc, sql, between } = require('drizzle-orm');

class AssetAnalyticsService {

  // ==================== COST FORECASTING & BUDGETING ====================

  /**
   * Generate cost forecasts based on historical data and trends
   */
  async generateCostForecast(options = {}) {
    const {
      assetUuid,
      forecastMonths = 12,
      includeInflation = true,
      inflationRate = 0.03, // 3% annual inflation
      confidenceLevel = 0.95
    } = options;

    try {
      // Get historical operational costs
      const historicalCosts = await this._getHistoricalOperationalCosts(assetUuid);

      // Get historical asset costs for trend analysis
      const assetCosts = await this._getHistoricalAssetCosts(assetUuid);

      // Calculate trends and seasonality
      const trends = this._calculateCostTrends(historicalCosts);
      const seasonality = this._calculateSeasonality(historicalCosts);

      // Generate monthly forecasts
      const forecasts = [];
      const currentDate = new Date();

      for (let i = 1; i <= forecastMonths; i++) {
        const forecastDate = new Date(currentDate);
        forecastDate.setMonth(forecastDate.getMonth() + i);

        const monthKey = forecastDate.getMonth();
        const baseCost = trends.averageMonthlyCost;
        const trendAdjustment = trends.monthlyGrowthRate * i;
        const seasonalAdjustment = seasonality[monthKey] || 1.0;
        const inflationAdjustment = includeInflation ? Math.pow(1 + inflationRate/12, i) : 1.0;

        const forecastedCost = baseCost * (1 + trendAdjustment) * seasonalAdjustment * inflationAdjustment;

        // Calculate confidence intervals
        const variance = trends.variance;
        const standardError = Math.sqrt(variance / historicalCosts.length);
        const marginOfError = this._getConfidenceMargin(confidenceLevel) * standardError;

        forecasts.push({
          month: forecastDate.toISOString().substring(0, 7), // YYYY-MM format
          forecastedCost: Math.round(forecastedCost * 100) / 100,
          lowerBound: Math.round((forecastedCost - marginOfError) * 100) / 100,
          upperBound: Math.round((forecastedCost + marginOfError) * 100) / 100,
          confidence: confidenceLevel,
          factors: {
            baseCost,
            trendAdjustment,
            seasonalAdjustment,
            inflationAdjustment
          }
        });
      }

      // Calculate budget recommendations
      const budgetRecommendations = this._generateBudgetRecommendations(forecasts, assetCosts);

      return {
        assetUuid,
        forecastPeriod: `${forecastMonths} months`,
        generatedAt: new Date(),
        historicalDataPoints: historicalCosts.length,
        trends: {
          averageMonthlyCost: trends.averageMonthlyCost,
          monthlyGrowthRate: trends.monthlyGrowthRate,
          volatility: trends.volatility
        },
        forecasts,
        budgetRecommendations,
        assumptions: {
          inflationRate: includeInflation ? inflationRate : 0,
          confidenceLevel,
          methodology: 'Trend analysis with seasonal adjustment'
        }
      };

    } catch (error) {
      console.error('Error generating cost forecast:', error);
      throw error;
    }
  }

  /**
   * Generate budget planning recommendations
   */
  async generateBudgetPlan(options = {}) {
    const {
      costCenter,
      budgetYear = new Date().getFullYear() + 1,
      includeCapex = true,
      includeOpex = true,
      riskBuffer = 0.10 // 10% risk buffer
    } = options;

    try {
      let query = db.select({
        assetUuid: assetCostManagement.assetUuid,
        totalCosts: sql`SUM(${assetCostManagement.amount})`,
        costTypes: sql`array_agg(DISTINCT ${assetCostManagement.costType})`,
        assetHostname: assets.hostname
      })
      .from(assetCostManagement)
      .leftJoin(assets, eq(assetCostManagement.assetUuid, assets.assetUuid))
      .groupBy(assetCostManagement.assetUuid, assets.hostname);

      if (costCenter) {
        query = query.where(eq(assetCostManagement.costCenter, costCenter));
      }

      const assetCosts = await query;

      // Get lifecycle data for replacement planning
      const lifecycleData = await db.select()
        .from(assetLifecycle)
        .leftJoin(assets, eq(assetLifecycle.assetUuid, assets.assetUuid))
        .where(eq(assetLifecycle.replacementBudgetYear, budgetYear));

      // Calculate budget categories
      const budgetCategories = {
        capex: {
          newPurchases: 0,
          replacements: 0,
          upgrades: 0
        },
        opex: {
          maintenance: 0,
          support: 0,
          licenses: 0,
          operational: 0
        }
      };

      // Process historical costs for trend analysis
      for (const asset of assetCosts) {
        const costTypes = asset.costTypes || [];
        const totalCost = parseFloat(asset.totalCosts);

        costTypes.forEach(costType => {
          const allocatedCost = totalCost / costTypes.length; // Simple allocation

          if (['purchase', 'upgrade'].includes(costType) && includeCapex) {
            budgetCategories.capex[costType === 'purchase' ? 'newPurchases' : 'upgrades'] += allocatedCost;
          } else if (['maintenance', 'support', 'license'].includes(costType) && includeOpex) {
            budgetCategories.opex[costType === 'license' ? 'licenses' : costType] += allocatedCost;
          }
        });
      }

      // Add replacement costs from lifecycle planning
      lifecycleData.forEach(item => {
        if (item.asset_lifecycle.estimatedReplacementCost) {
          budgetCategories.capex.replacements += parseFloat(item.asset_lifecycle.estimatedReplacementCost);
        }
      });

      // Calculate totals with risk buffer
      const totalCapex = Object.values(budgetCategories.capex).reduce((sum, val) => sum + val, 0);
      const totalOpex = Object.values(budgetCategories.opex).reduce((sum, val) => sum + val, 0);
      const totalBudget = totalCapex + totalOpex;
      const riskAdjustedBudget = totalBudget * (1 + riskBuffer);

      return {
        budgetYear,
        costCenter,
        generatedAt: new Date(),
        budgetCategories,
        summary: {
          totalCapex: Math.round(totalCapex * 100) / 100,
          totalOpex: Math.round(totalOpex * 100) / 100,
          totalBudget: Math.round(totalBudget * 100) / 100,
          riskBuffer: riskBuffer,
          riskAdjustedBudget: Math.round(riskAdjustedBudget * 100) / 100
        },
        recommendations: [
          {
            category: 'Risk Management',
            recommendation: `Include ${(riskBuffer * 100)}% risk buffer for unexpected costs`,
            impact: 'High',
            priority: 1
          },
          {
            category: 'Lifecycle Planning',
            recommendation: `${lifecycleData.length} assets scheduled for replacement in ${budgetYear}`,
            impact: 'Medium',
            priority: 2
          }
        ]
      };

    } catch (error) {
      console.error('Error generating budget plan:', error);
      throw error;
    }
  }

  // ==================== LIFECYCLE PLANNING & REPLACEMENT SCHEDULING ====================

  /**
   * Generate comprehensive lifecycle planning analysis
   */
  async generateLifecyclePlan(options = {}) {
    const {
      planningHorizon = 60, // months
      replacementThreshold = 0.8, // 80% of lifecycle
      includeRiskAssessment = true
    } = options;

    try {
      // Get all assets with lifecycle data
      const lifecycleAssets = await db.select({
        id: assetLifecycle.id,
        assetUuid: assetLifecycle.assetUuid,
        purchaseDate: assetLifecycle.purchaseDate,
        warrantyEndDate: assetLifecycle.warrantyEndDate,
        manufacturerEolDate: assetLifecycle.manufacturerEolDate,
        internalEolDate: assetLifecycle.internalEolDate,
        replacementCycleMonths: assetLifecycle.replacementCycleMonths,
        estimatedReplacementCost: assetLifecycle.estimatedReplacementCost,
        replacementBudgetYear: assetLifecycle.replacementBudgetYear,
        replacementBudgetQuarter: assetLifecycle.replacementBudgetQuarter,
        // Asset details
        hostname: assets.hostname,
        ipv4: assets.ipv4,
        operatingSystem: assets.operatingSystem,
        // Calculated fields
        assetAge: sql`EXTRACT(MONTH FROM AGE(CURRENT_DATE, ${assetLifecycle.purchaseDate}))`,
        warrantyRemaining: sql`EXTRACT(DAY FROM ${assetLifecycle.warrantyEndDate} - CURRENT_DATE)`,
        eolRemaining: sql`EXTRACT(DAY FROM ${assetLifecycle.internalEolDate} - CURRENT_DATE)`
      })
      .from(assetLifecycle)
      .leftJoin(assets, eq(assetLifecycle.assetUuid, assets.assetUuid));

      // Categorize assets by lifecycle stage
      const lifecycleCategories = {
        new: [], // < 25% of lifecycle
        mature: [], // 25-75% of lifecycle
        aging: [], // 75-90% of lifecycle
        critical: [], // > 90% of lifecycle or past EOL
        unknown: [] // Missing lifecycle data
      };

      const replacementSchedule = [];
      const riskAssessments = [];

      lifecycleAssets.forEach(asset => {
        const assetAge = parseInt(asset.assetAge) || 0;
        const replacementCycle = asset.replacementCycleMonths || 60; // Default 5 years
        const lifecycleProgress = assetAge / replacementCycle;

        // Categorize asset
        let category = 'unknown';
        if (lifecycleProgress < 0.25) category = 'new';
        else if (lifecycleProgress < 0.75) category = 'mature';
        else if (lifecycleProgress < 0.90) category = 'aging';
        else category = 'critical';

        lifecycleCategories[category].push({
          ...asset,
          assetAge,
          lifecycleProgress: Math.round(lifecycleProgress * 100) / 100,
          recommendedAction: this._getRecommendedAction(lifecycleProgress, asset)
        });

        // Generate replacement schedule
        if (lifecycleProgress >= replacementThreshold) {
          const monthsUntilReplacement = Math.max(0, replacementCycle - assetAge);
          const replacementDate = new Date();
          replacementDate.setMonth(replacementDate.getMonth() + monthsUntilReplacement);

          replacementSchedule.push({
            assetUuid: asset.assetUuid,
            hostname: asset.hostname,
            currentAge: assetAge,
            replacementDate: replacementDate.toISOString().substring(0, 7),
            estimatedCost: asset.estimatedReplacementCost || 0,
            priority: lifecycleProgress > 1.0 ? 'Critical' : 'High',
            budgetYear: asset.replacementBudgetYear || replacementDate.getFullYear(),
            budgetQuarter: asset.replacementBudgetQuarter || Math.ceil((replacementDate.getMonth() + 1) / 3)
          });
        }

        // Risk assessment
        if (includeRiskAssessment) {
          const riskFactors = this._assessLifecycleRisks(asset, lifecycleProgress);
          if (riskFactors.overallRisk > 0.3) { // Only include medium+ risk assets
            riskAssessments.push({
              assetUuid: asset.assetUuid,
              hostname: asset.hostname,
              riskLevel: riskFactors.overallRisk > 0.7 ? 'High' : 'Medium',
              riskFactors: riskFactors.factors,
              mitigationRecommendations: riskFactors.recommendations
            });
          }
        }
      });

      // Calculate financial projections
      const financialProjections = this._calculateLifecycleFinancials(replacementSchedule, planningHorizon);

      return {
        generatedAt: new Date(),
        planningHorizon: `${planningHorizon} months`,
        summary: {
          totalAssets: lifecycleAssets.length,
          assetsRequiringReplacement: replacementSchedule.length,
          totalReplacementCost: replacementSchedule.reduce((sum, item) => sum + (item.estimatedCost || 0), 0),
          averageAssetAge: lifecycleAssets.reduce((sum, asset) => sum + (parseInt(asset.assetAge) || 0), 0) / lifecycleAssets.length
        },
        lifecycleCategories,
        replacementSchedule: replacementSchedule.sort((a, b) => new Date(a.replacementDate) - new Date(b.replacementDate)),
        riskAssessments,
        financialProjections,
        recommendations: this._generateLifecycleRecommendations(lifecycleCategories, replacementSchedule)
      };

    } catch (error) {
      console.error('Error generating lifecycle plan:', error);
      throw error;
    }
  }

  /**
   * Generate replacement scheduling with budget optimization
   */
  async optimizeReplacementSchedule(options = {}) {
    const {
      budgetConstraint,
      prioritizeBy = 'risk', // 'risk', 'cost', 'age'
      allowBudgetReallocation = true
    } = options;

    try {
      const lifecyclePlan = await this.generateLifecyclePlan();
      let { replacementSchedule } = lifecyclePlan;

      // Sort by priority criteria
      switch (prioritizeBy) {
        case 'risk':
          replacementSchedule.sort((a, b) => {
            const priorityOrder = { 'Critical': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          });
          break;
        case 'cost':
          replacementSchedule.sort((a, b) => (a.estimatedCost || 0) - (b.estimatedCost || 0));
          break;
        case 'age':
          replacementSchedule.sort((a, b) => b.currentAge - a.currentAge);
          break;
      }

      // Apply budget constraints if specified
      if (budgetConstraint) {
        replacementSchedule = this._applyBudgetConstraints(replacementSchedule, budgetConstraint, allowBudgetReallocation);
      }

      return {
        optimizedSchedule: replacementSchedule,
        optimization: {
          prioritizeBy,
          budgetConstraint,
          totalOptimizedCost: replacementSchedule.reduce((sum, item) => sum + (item.estimatedCost || 0), 0),
          assetsDeferred: lifecyclePlan.replacementSchedule.length - replacementSchedule.length
        },
        recommendations: this._generateOptimizationRecommendations(replacementSchedule, budgetConstraint)
      };

    } catch (error) {
      console.error('Error optimizing replacement schedule:', error);
      throw error;
    }
  }

  // ==================== ROI & DEPRECIATION CALCULATIONS ====================

  /**
   * Calculate Return on Investment (ROI) for assets
   */
  async calculateROI(assetUuid, options = {}) {
    const {
      analysisMethod = 'comprehensive', // 'simple', 'comprehensive', 'npv'
      discountRate = 0.08, // 8% discount rate for NPV
      includeOpportunityValue = true,
      timeHorizon = 60 // months
    } = options;

    try {
      // Get asset cost data
      const assetCosts = await db.select()
        .from(assetCostManagement)
        .where(eq(assetCostManagement.assetUuid, assetUuid));

      // Get lifecycle data
      const [lifecycleData] = await db.select()
        .from(assetLifecycle)
        .where(eq(assetLifecycle.assetUuid, assetUuid))
        .limit(1);

      // Get operational costs
      const operationalCosts = await db.select()
        .from(assetOperationalCosts)
        .where(eq(assetOperationalCosts.assetUuid, assetUuid));

      if (assetCosts.length === 0) {
        throw new Error('No cost data found for asset');
      }

      // Calculate total investment
      const initialInvestment = assetCosts
        .filter(cost => ['purchase', 'upgrade'].includes(cost.costType))
        .reduce((sum, cost) => sum + parseFloat(cost.amount), 0);

      const ongoingCosts = assetCosts
        .filter(cost => ['maintenance', 'support', 'license'].includes(cost.costType))
        .reduce((sum, cost) => sum + parseFloat(cost.amount), 0);

      const totalOperationalCosts = operationalCosts.reduce((sum, cost) => {
        return sum + (parseFloat(cost.powerCost) || 0) +
                     (parseFloat(cost.spaceCost) || 0) +
                     (parseFloat(cost.networkCost) || 0) +
                     (parseFloat(cost.storageCost) || 0) +
                     (parseFloat(cost.laborCost) || 0) +
                     (parseFloat(cost.otherCosts) || 0);
      }, 0);

      // Estimate benefits (this would typically come from business metrics)
      const estimatedBenefits = this._estimateAssetBenefits(assetUuid, initialInvestment, timeHorizon);

      // Calculate ROI based on method
      let roiCalculation;
      switch (analysisMethod) {
        case 'simple':
          roiCalculation = this._calculateSimpleROI(initialInvestment, estimatedBenefits.totalBenefits, ongoingCosts);
          break;
        case 'comprehensive':
          roiCalculation = this._calculateComprehensiveROI(
            initialInvestment,
            ongoingCosts,
            totalOperationalCosts,
            estimatedBenefits,
            lifecycleData
          );
          break;
        case 'npv':
          roiCalculation = this._calculateNPVROI(
            initialInvestment,
            ongoingCosts,
            totalOperationalCosts,
            estimatedBenefits,
            discountRate,
            timeHorizon
          );
          break;
      }

      return {
        assetUuid,
        analysisMethod,
        calculatedAt: new Date(),
        timeHorizon: `${timeHorizon} months`,
        investment: {
          initialInvestment,
          ongoingCosts,
          totalOperationalCosts,
          totalInvestment: initialInvestment + ongoingCosts + totalOperationalCosts
        },
        benefits: estimatedBenefits,
        roiMetrics: roiCalculation,
        recommendations: this._generateROIRecommendations(roiCalculation, assetUuid)
      };

    } catch (error) {
      console.error('Error calculating ROI:', error);
      throw error;
    }
  }

  /**
   * Calculate asset depreciation using multiple methods
   */
  async calculateDepreciation(assetUuid, options = {}) {
    const {
      methods = ['straight_line', 'declining_balance', 'sum_of_years'],
      decliningBalanceRate = 0.20, // 20% for declining balance
      salvageValuePercent = 0.10 // 10% salvage value
    } = options;

    try {
      // Get asset cost and lifecycle data
      const assetCosts = await db.select()
        .from(assetCostManagement)
        .where(and(
          eq(assetCostManagement.assetUuid, assetUuid),
          eq(assetCostManagement.costType, 'purchase')
        ));

      const [lifecycleData] = await db.select()
        .from(assetLifecycle)
        .where(eq(assetLifecycle.assetUuid, assetUuid))
        .limit(1);

      if (assetCosts.length === 0 || !lifecycleData) {
        throw new Error('Insufficient data for depreciation calculation');
      }

      const purchaseCost = assetCosts.reduce((sum, cost) => sum + parseFloat(cost.amount), 0);
      const usefulLife = lifecycleData.replacementCycleMonths || 60; // months
      const salvageValue = purchaseCost * salvageValuePercent;
      const depreciableAmount = purchaseCost - salvageValue;

      const purchaseDate = new Date(lifecycleData.purchaseDate);
      const currentDate = new Date();
      const monthsElapsed = Math.floor((currentDate - purchaseDate) / (1000 * 60 * 60 * 24 * 30.44));

      const depreciationCalculations = {};

      // Calculate depreciation using requested methods
      methods.forEach(method => {
        switch (method) {
          case 'straight_line':
            depreciationCalculations.straightLine = this._calculateStraightLineDepreciation(
              purchaseCost, salvageValue, usefulLife, monthsElapsed
            );
            break;
          case 'declining_balance':
            depreciationCalculations.decliningBalance = this._calculateDecliningBalanceDepreciation(
              purchaseCost, decliningBalanceRate, monthsElapsed, salvageValue
            );
            break;
          case 'sum_of_years':
            depreciationCalculations.sumOfYears = this._calculateSumOfYearsDepreciation(
              purchaseCost, salvageValue, usefulLife, monthsElapsed
            );
            break;
          case 'units_of_production':
            // This would require usage data - placeholder for now
            depreciationCalculations.unitsOfProduction = {
              method: 'Units of Production',
              note: 'Requires usage/production data not currently available'
            };
            break;
        }
      });

      // Generate depreciation schedule for next 12 months
      const depreciationSchedule = this._generateDepreciationSchedule(
        depreciationCalculations.straightLine, // Use straight line for schedule
        12
      );

      return {
        assetUuid,
        calculatedAt: new Date(),
        assetDetails: {
          purchaseCost,
          purchaseDate: lifecycleData.purchaseDate,
          usefulLifeMonths: usefulLife,
          salvageValue,
          depreciableAmount,
          monthsElapsed,
          remainingLife: Math.max(0, usefulLife - monthsElapsed)
        },
        depreciationMethods: depreciationCalculations,
        depreciationSchedule,
        taxImplications: this._calculateTaxImplications(depreciationCalculations),
        recommendations: this._generateDepreciationRecommendations(depreciationCalculations, lifecycleData)
      };

    } catch (error) {
      console.error('Error calculating depreciation:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive financial analysis combining ROI and depreciation
   */
  async generateFinancialAnalysis(assetUuid, options = {}) {
    const {
      includeROI = true,
      includeDepreciation = true,
      includeTCO = true,
      analysisHorizon = 60 // months
    } = options;

    try {
      const analysis = {
        assetUuid,
        generatedAt: new Date(),
        analysisHorizon: `${analysisHorizon} months`
      };

      // ROI Analysis
      if (includeROI) {
        analysis.roiAnalysis = await this.calculateROI(assetUuid, {
          analysisMethod: 'comprehensive',
          timeHorizon: analysisHorizon
        });
      }

      // Depreciation Analysis
      if (includeDepreciation) {
        analysis.depreciationAnalysis = await this.calculateDepreciation(assetUuid, {
          methods: ['straight_line', 'declining_balance']
        });
      }

      // Total Cost of Ownership
      if (includeTCO) {
        analysis.tcoAnalysis = await this._calculateTotalCostOfOwnership(assetUuid, analysisHorizon);
      }

      // Financial health score
      analysis.financialHealthScore = this._calculateFinancialHealthScore(analysis);

      // Strategic recommendations
      analysis.strategicRecommendations = this._generateStrategicRecommendations(analysis);

      return analysis;

    } catch (error) {
      console.error('Error generating financial analysis:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  async _getHistoricalOperationalCosts(assetUuid) {
    const query = assetUuid
      ? db.select().from(assetOperationalCosts).where(eq(assetOperationalCosts.assetUuid, assetUuid))
      : db.select().from(assetOperationalCosts);

    return await query.orderBy(assetOperationalCosts.yearMonth);
  }

  async _getHistoricalAssetCosts(assetUuid) {
    const query = assetUuid
      ? db.select().from(assetCostManagement).where(eq(assetCostManagement.assetUuid, assetUuid))
      : db.select().from(assetCostManagement);

    return await query.orderBy(assetCostManagement.createdAt);
  }

  _calculateCostTrends(historicalCosts) {
    if (historicalCosts.length < 2) {
      return {
        averageMonthlyCost: 0,
        monthlyGrowthRate: 0,
        volatility: 0,
        variance: 0
      };
    }

    const monthlyCosts = historicalCosts.map(cost => {
      return (parseFloat(cost.powerCost) || 0) +
             (parseFloat(cost.spaceCost) || 0) +
             (parseFloat(cost.networkCost) || 0) +
             (parseFloat(cost.storageCost) || 0) +
             (parseFloat(cost.laborCost) || 0) +
             (parseFloat(cost.otherCosts) || 0);
    });

    const averageMonthlyCost = monthlyCosts.reduce((sum, cost) => sum + cost, 0) / monthlyCosts.length;

    // Calculate growth rate using linear regression
    const n = monthlyCosts.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices 0, 1, 2, ...
    const sumY = monthlyCosts.reduce((sum, cost) => sum + cost, 0);
    const sumXY = monthlyCosts.reduce((sum, cost, index) => sum + (cost * index), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares of indices

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const monthlyGrowthRate = slope / averageMonthlyCost;

    // Calculate variance
    const variance = monthlyCosts.reduce((sum, cost) => {
      return sum + Math.pow(cost - averageMonthlyCost, 2);
    }, 0) / n;

    const volatility = Math.sqrt(variance) / averageMonthlyCost;

    return {
      averageMonthlyCost,
      monthlyGrowthRate,
      volatility,
      variance
    };
  }

  _calculateSeasonality(historicalCosts) {
    const monthlyAverages = {};
    const monthlyCounts = {};

    historicalCosts.forEach(cost => {
      const month = new Date(cost.yearMonth).getMonth();
      const totalCost = (parseFloat(cost.powerCost) || 0) +
                       (parseFloat(cost.spaceCost) || 0) +
                       (parseFloat(cost.networkCost) || 0) +
                       (parseFloat(cost.storageCost) || 0) +
                       (parseFloat(cost.laborCost) || 0) +
                       (parseFloat(cost.otherCosts) || 0);

      monthlyAverages[month] = (monthlyAverages[month] || 0) + totalCost;
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    });

    // Calculate seasonal factors
    const overallAverage = Object.values(monthlyAverages).reduce((sum, val) => sum + val, 0) /
                          Object.values(monthlyCounts).reduce((sum, val) => sum + val, 0);

    const seasonalFactors = {};
    for (let month = 0; month < 12; month++) {
      if (monthlyCounts[month]) {
        const monthlyAverage = monthlyAverages[month] / monthlyCounts[month];
        seasonalFactors[month] = monthlyAverage / overallAverage;
      } else {
        seasonalFactors[month] = 1.0; // No seasonal adjustment if no data
      }
    }

    return seasonalFactors;
  }

  _getConfidenceMargin(confidenceLevel) {
    // Z-scores for common confidence levels
    const zScores = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };
    return zScores[confidenceLevel] || 1.96;
  }

  _generateBudgetRecommendations(forecasts, assetCosts) {
    const totalForecast = forecasts.reduce((sum, f) => sum + f.forecastedCost, 0);
    const averageMonthly = totalForecast / forecasts.length;
    const maxMonthly = Math.max(...forecasts.map(f => f.forecastedCost));
    const minMonthly = Math.min(...forecasts.map(f => f.forecastedCost));

    return {
      recommendedMonthlyBudget: Math.round(averageMonthly * 1.1 * 100) / 100, // 10% buffer
      recommendedAnnualBudget: Math.round(totalForecast * 1.1 * 100) / 100,
      budgetRange: {
        minimum: Math.round(minMonthly * 100) / 100,
        maximum: Math.round(maxMonthly * 100) / 100
      },
      recommendations: [
        {
          type: 'Budget Planning',
          message: `Allocate ${Math.round(averageMonthly * 1.1)} per month for operational costs`,
          priority: 'High'
        },
        {
          type: 'Cost Control',
          message: `Monitor costs closely during peak months (${Math.round(maxMonthly)} expected)`,
          priority: 'Medium'
        }
      ]
    };
  }

  _getRecommendedAction(lifecycleProgress, asset) {
    if (lifecycleProgress > 1.0) {
      return 'Immediate replacement required - asset past EOL';
    } else if (lifecycleProgress > 0.9) {
      return 'Plan replacement within 6 months';
    } else if (lifecycleProgress > 0.75) {
      return 'Begin replacement planning and budgeting';
    } else if (lifecycleProgress > 0.5) {
      return 'Monitor performance and plan for future replacement';
    } else {
      return 'Continue normal operations and maintenance';
    }
  }

  _assessLifecycleRisks(asset, lifecycleProgress) {
    const risks = [];
    let overallRisk = 0;

    // Age-based risk
    if (lifecycleProgress > 0.8) {
      risks.push('High failure risk due to age');
      overallRisk += 0.4;
    } else if (lifecycleProgress > 0.6) {
      risks.push('Moderate failure risk due to age');
      overallRisk += 0.2;
    }

    // Warranty risk
    const warrantyRemaining = parseInt(asset.warrantyRemaining) || 0;
    if (warrantyRemaining < 0) {
      risks.push('No warranty coverage');
      overallRisk += 0.3;
    } else if (warrantyRemaining < 90) {
      risks.push('Warranty expiring soon');
      overallRisk += 0.1;
    }

    // EOL risk
    const eolRemaining = parseInt(asset.eolRemaining) || 0;
    if (eolRemaining < 0) {
      risks.push('Past manufacturer EOL');
      overallRisk += 0.4;
    } else if (eolRemaining < 180) {
      risks.push('Approaching manufacturer EOL');
      overallRisk += 0.2;
    }

    const recommendations = [];
    if (overallRisk > 0.7) {
      recommendations.push('Prioritize immediate replacement');
      recommendations.push('Implement enhanced monitoring');
    } else if (overallRisk > 0.4) {
      recommendations.push('Plan replacement within 12 months');
      recommendations.push('Consider extended warranty');
    }

    return {
      overallRisk: Math.min(overallRisk, 1.0),
      factors: risks,
      recommendations
    };
  }

  _calculateLifecycleFinancials(replacementSchedule, planningHorizon) {
    const projections = [];
    const currentDate = new Date();

    for (let month = 1; month <= planningHorizon; month++) {
      const projectionDate = new Date(currentDate);
      projectionDate.setMonth(projectionDate.getMonth() + month);
      const monthKey = projectionDate.toISOString().substring(0, 7);

      const monthlyReplacements = replacementSchedule.filter(item =>
        item.replacementDate === monthKey
      );

      const monthlyCost = monthlyReplacements.reduce((sum, item) =>
        sum + (item.estimatedCost || 0), 0
      );

      projections.push({
        month: monthKey,
        replacementCount: monthlyReplacements.length,
        totalCost: monthlyCost,
        assets: monthlyReplacements.map(item => ({
          hostname: item.hostname,
          cost: item.estimatedCost
        }))
      });
    }

    return {
      monthlyProjections: projections,
      totalProjectedCost: projections.reduce((sum, p) => sum + p.totalCost, 0),
      totalReplacements: projections.reduce((sum, p) => sum + p.replacementCount, 0)
    };
  }

  _generateLifecycleRecommendations(lifecycleCategories, replacementSchedule) {
    const recommendations = [];

    // Critical assets
    if (lifecycleCategories.critical.length > 0) {
      recommendations.push({
        priority: 'Critical',
        category: 'Immediate Action',
        message: `${lifecycleCategories.critical.length} assets require immediate replacement`,
        assets: lifecycleCategories.critical.slice(0, 5).map(a => a.hostname)
      });
    }

    // Aging assets
    if (lifecycleCategories.aging.length > 0) {
      recommendations.push({
        priority: 'High',
        category: 'Planning Required',
        message: `${lifecycleCategories.aging.length} assets approaching EOL - begin replacement planning`,
        assets: lifecycleCategories.aging.slice(0, 5).map(a => a.hostname)
      });
    }

    // Budget planning
    const totalReplacementCost = replacementSchedule.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
    if (totalReplacementCost > 0) {
      recommendations.push({
        priority: 'Medium',
        category: 'Budget Planning',
        message: `Allocate $${Math.round(totalReplacementCost)} for upcoming replacements`,
        details: `${replacementSchedule.length} assets scheduled for replacement`
      });
    }

    return recommendations;
  }

  // ROI Calculation Methods
  _estimateAssetBenefits(assetUuid, initialInvestment, timeHorizon) {
    // This is a simplified estimation - in practice, this would integrate with business metrics
    const monthlyBenefit = initialInvestment * 0.02; // 2% monthly benefit assumption
    const totalBenefits = monthlyBenefit * timeHorizon;

    return {
      monthlyBenefit,
      totalBenefits,
      benefitCategories: {
        productivity: totalBenefits * 0.4,
        costSavings: totalBenefits * 0.3,
        riskReduction: totalBenefits * 0.2,
        other: totalBenefits * 0.1
      },
      assumptions: [
        'Benefits estimated at 2% of investment per month',
        'Actual benefits may vary based on usage and business context'
      ]
    };
  }

  _calculateSimpleROI(initialInvestment, totalBenefits, ongoingCosts) {
    const netBenefit = totalBenefits - ongoingCosts;
    const roi = ((netBenefit - initialInvestment) / initialInvestment) * 100;

    return {
      method: 'Simple ROI',
      roi: Math.round(roi * 100) / 100,
      netBenefit,
      paybackPeriod: initialInvestment / (totalBenefits / 12), // months
      interpretation: roi > 0 ? 'Positive ROI' : 'Negative ROI'
    };
  }

  _calculateComprehensiveROI(initialInvestment, ongoingCosts, operationalCosts, benefits, lifecycleData) {
    const totalCosts = initialInvestment + ongoingCosts + operationalCosts;
    const netBenefit = benefits.totalBenefits - totalCosts;
    const roi = (netBenefit / totalCosts) * 100;

    const usefulLife = lifecycleData?.replacementCycleMonths || 60;
    const monthlyROI = roi / usefulLife;

    return {
      method: 'Comprehensive ROI',
      roi: Math.round(roi * 100) / 100,
      monthlyROI: Math.round(monthlyROI * 100) / 100,
      totalCosts,
      netBenefit,
      costBreakdown: {
        initial: initialInvestment,
        ongoing: ongoingCosts,
        operational: operationalCosts
      },
      paybackPeriod: totalCosts / (benefits.monthlyBenefit || 1),
      interpretation: this._interpretROI(roi)
    };
  }

  _calculateNPVROI(initialInvestment, ongoingCosts, operationalCosts, benefits, discountRate, timeHorizon) {
    const monthlyDiscountRate = discountRate / 12;
    let npvBenefits = 0;
    let npvCosts = initialInvestment; // Initial investment at time 0

    for (let month = 1; month <= timeHorizon; month++) {
      const discountFactor = Math.pow(1 + monthlyDiscountRate, -month);
      npvBenefits += (benefits.monthlyBenefit * discountFactor);
      npvCosts += ((ongoingCosts + operationalCosts) / timeHorizon * discountFactor);
    }

    const npv = npvBenefits - npvCosts;
    const roi = (npv / npvCosts) * 100;

    return {
      method: 'Net Present Value ROI',
      roi: Math.round(roi * 100) / 100,
      npv: Math.round(npv * 100) / 100,
      npvBenefits: Math.round(npvBenefits * 100) / 100,
      npvCosts: Math.round(npvCosts * 100) / 100,
      discountRate: discountRate,
      interpretation: npv > 0 ? 'Positive NPV - Investment recommended' : 'Negative NPV - Investment not recommended'
    };
  }

  _interpretROI(roi) {
    if (roi > 20) return 'Excellent ROI';
    if (roi > 10) return 'Good ROI';
    if (roi > 0) return 'Positive ROI';
    if (roi > -10) return 'Marginal ROI';
    return 'Poor ROI';
  }

  _generateROIRecommendations(roiCalculation, assetUuid) {
    const recommendations = [];

    if (roiCalculation.roi > 15) {
      recommendations.push({
        type: 'Investment',
        message: 'Excellent ROI - consider similar investments',
        priority: 'Low'
      });
    } else if (roiCalculation.roi < 0) {
      recommendations.push({
        type: 'Cost Optimization',
        message: 'Negative ROI - review costs and benefits',
        priority: 'High'
      });
    }

    if (roiCalculation.paybackPeriod > 36) {
      recommendations.push({
        type: 'Payback Period',
        message: 'Long payback period - consider alternatives',
        priority: 'Medium'
      });
    }

    return recommendations;
  }

  // Depreciation Calculation Methods
  _calculateStraightLineDepreciation(purchaseCost, salvageValue, usefulLifeMonths, monthsElapsed) {
    const depreciableAmount = purchaseCost - salvageValue;
    const monthlyDepreciation = depreciableAmount / usefulLifeMonths;
    const accumulatedDepreciation = Math.min(monthlyDepreciation * monthsElapsed, depreciableAmount);
    const bookValue = purchaseCost - accumulatedDepreciation;

    return {
      method: 'Straight Line',
      monthlyDepreciation: Math.round(monthlyDepreciation * 100) / 100,
      accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
      bookValue: Math.round(bookValue * 100) / 100,
      remainingDepreciableAmount: Math.round((depreciableAmount - accumulatedDepreciation) * 100) / 100,
      depreciationRate: (monthlyDepreciation / purchaseCost) * 100
    };
  }

  _calculateDecliningBalanceDepreciation(purchaseCost, annualRate, monthsElapsed, salvageValue) {
    const monthlyRate = annualRate / 12;
    let bookValue = purchaseCost;
    let accumulatedDepreciation = 0;

    for (let month = 1; month <= monthsElapsed; month++) {
      const monthlyDepreciation = Math.max(0, Math.min(bookValue * monthlyRate, bookValue - salvageValue));
      accumulatedDepreciation += monthlyDepreciation;
      bookValue -= monthlyDepreciation;
    }

    return {
      method: 'Declining Balance',
      annualRate: annualRate * 100,
      monthlyRate: monthlyRate * 100,
      accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
      bookValue: Math.round(bookValue * 100) / 100,
      currentMonthDepreciation: Math.round((bookValue * monthlyRate) * 100) / 100
    };
  }

  _calculateSumOfYearsDepreciation(purchaseCost, salvageValue, usefulLifeMonths, monthsElapsed) {
    const depreciableAmount = purchaseCost - salvageValue;
    const usefulLifeYears = usefulLifeMonths / 12;
    const sumOfYears = (usefulLifeYears * (usefulLifeYears + 1)) / 2;

    let accumulatedDepreciation = 0;
    const yearsElapsed = monthsElapsed / 12;

    for (let year = 1; year <= Math.ceil(yearsElapsed); year++) {
      const yearFraction = Math.min(1, Math.max(0, yearsElapsed - year + 1));
      const remainingYears = usefulLifeYears - year + 1;
      const yearlyDepreciation = (remainingYears / sumOfYears) * depreciableAmount;
      accumulatedDepreciation += yearlyDepreciation * yearFraction;
    }

    const bookValue = purchaseCost - accumulatedDepreciation;

    return {
      method: 'Sum of Years Digits',
      accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
      bookValue: Math.round(bookValue * 100) / 100,
      sumOfYears,
      currentYearFactor: Math.max(1, usefulLifeYears - Math.floor(yearsElapsed))
    };
  }

  _generateDepreciationSchedule(depreciationData, months) {
    const schedule = [];
    const monthlyDepreciation = depreciationData.monthlyDepreciation || 0;
    let runningBookValue = depreciationData.bookValue || 0;

    for (let month = 1; month <= months; month++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + month);

      runningBookValue = Math.max(0, runningBookValue - monthlyDepreciation);

      schedule.push({
        month: futureDate.toISOString().substring(0, 7),
        depreciation: monthlyDepreciation,
        bookValue: Math.round(runningBookValue * 100) / 100
      });
    }

    return schedule;
  }

  _calculateTaxImplications(depreciationCalculations) {
    const implications = [];

    Object.values(depreciationCalculations).forEach(calc => {
      if (calc.accumulatedDepreciation) {
        implications.push({
          method: calc.method,
          taxDeduction: calc.accumulatedDepreciation,
          note: 'Depreciation may be deductible for tax purposes - consult tax advisor'
        });
      }
    });

    return implications;
  }

  _generateDepreciationRecommendations(depreciationCalculations, lifecycleData) {
    const recommendations = [];

    const straightLine = depreciationCalculations.straightLine;
    if (straightLine && straightLine.bookValue < straightLine.accumulatedDepreciation * 0.1) {
      recommendations.push({
        type: 'Asset Management',
        message: 'Asset is nearly fully depreciated - consider replacement',
        priority: 'Medium'
      });
    }

    return recommendations;
  }

  async _calculateTotalCostOfOwnership(assetUuid, analysisHorizon) {
    const costs = await this._getHistoricalAssetCosts(assetUuid);
    const operationalCosts = await this._getHistoricalOperationalCosts(assetUuid);

    const totalAcquisition = costs.reduce((sum, cost) => sum + parseFloat(cost.amount), 0);
    const totalOperational = operationalCosts.reduce((sum, cost) => {
      return sum + (parseFloat(cost.powerCost) || 0) +
                   (parseFloat(cost.spaceCost) || 0) +
                   (parseFloat(cost.networkCost) || 0) +
                   (parseFloat(cost.storageCost) || 0) +
                   (parseFloat(cost.laborCost) || 0) +
                   (parseFloat(cost.otherCosts) || 0);
    }, 0);

    return {
      totalCostOfOwnership: totalAcquisition + totalOperational,
      breakdown: {
        acquisition: totalAcquisition,
        operational: totalOperational
      },
      monthlyAverage: (totalAcquisition + totalOperational) / analysisHorizon
    };
  }

  _calculateFinancialHealthScore(analysis) {
    let score = 50; // Base score

    // ROI contribution
    if (analysis.roiAnalysis) {
      const roi = analysis.roiAnalysis.roiMetrics.roi;
      if (roi > 20) score += 30;
      else if (roi > 10) score += 20;
      else if (roi > 0) score += 10;
      else score -= 20;
    }

    // Depreciation contribution
    if (analysis.depreciationAnalysis) {
      const bookValue = analysis.depreciationAnalysis.depreciationMethods.straightLine?.bookValue || 0;
      const originalCost = analysis.depreciationAnalysis.assetDetails.purchaseCost;
      const depreciationRatio = bookValue / originalCost;

      if (depreciationRatio > 0.5) score += 10;
      else if (depreciationRatio > 0.2) score += 5;
      else score -= 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  _generateStrategicRecommendations(analysis) {
    const recommendations = [];

    if (analysis.roiAnalysis?.roiMetrics.roi < 0) {
      recommendations.push({
        category: 'Financial Performance',
        recommendation: 'Review asset utilization and cost optimization opportunities',
        priority: 'High',
        impact: 'Cost reduction'
      });
    }

    if (analysis.depreciationAnalysis?.assetDetails.remainingLife < 12) {
      recommendations.push({
        category: 'Asset Lifecycle',
        recommendation: 'Plan for asset replacement within the next year',
        priority: 'Medium',
        impact: 'Operational continuity'
      });
    }

    return recommendations;
  }

  _applyBudgetConstraints(replacementSchedule, budgetConstraint, allowReallocation) {
    // Simple budget constraint application - prioritize by existing priority
    let remainingBudget = budgetConstraint;
    const constrainedSchedule = [];

    for (const item of replacementSchedule) {
      if (remainingBudget >= (item.estimatedCost || 0)) {
        constrainedSchedule.push(item);
        remainingBudget -= (item.estimatedCost || 0);
      } else if (allowReallocation && remainingBudget > 0) {
        // Partial funding - defer to next period
        constrainedSchedule.push({
          ...item,
          estimatedCost: remainingBudget,
          note: 'Partially funded - remaining cost deferred'
        });
        remainingBudget = 0;
      }
    }

    return constrainedSchedule;
  }

  _generateOptimizationRecommendations(schedule, budgetConstraint) {
    const recommendations = [];

    if (budgetConstraint) {
      const totalCost = schedule.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
      if (totalCost > budgetConstraint) {
        recommendations.push({
          type: 'Budget Optimization',
          message: `Consider phased replacement approach to stay within budget`,
          priority: 'High'
        });
      }
    }

    return recommendations;
  }
}

module.exports = new AssetAnalyticsService();