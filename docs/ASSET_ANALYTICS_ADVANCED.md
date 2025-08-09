# Advanced Asset Analytics Documentation

## Overview
The Advanced Asset Analytics system provides sophisticated financial analysis, forecasting, and planning capabilities for enterprise asset management. This includes cost forecasting, lifecycle planning, ROI calculations, and depreciation analysis.

## Base URL
```
http://localhost:3000/api/v1/asset-analytics
```

## Authentication & Permissions
- **Authentication**: JWT token required
- **Permission**: `asset_analytics:read` for all analytics endpoints

## Features

### 📈 Cost Forecasting & Budgeting

#### Cost Forecasting
Generate predictive cost models based on historical data with confidence intervals.

**Endpoint:** `GET /forecast/{assetUuid}`

**Parameters:**
- `forecastMonths` (1-60): Forecast horizon in months
- `includeInflation` (boolean): Include inflation adjustments
- `inflationRate` (0-0.20): Annual inflation rate
- `confidenceLevel` (0.90, 0.95, 0.99): Statistical confidence level

**Response Example:**
```json
{
  "data": {
    "forecastPeriod": "12 months",
    "historicalDataPoints": 24,
    "trends": {
      "averageMonthlyCost": 1250.50,
      "monthlyGrowthRate": 0.02,
      "volatility": 0.15
    },
    "forecasts": [
      {
        "month": "2025-08",
        "forecastedCost": 1275.25,
        "lowerBound": 1150.00,
        "upperBound": 1400.50,
        "confidence": 0.95
      }
    ],
    "budgetRecommendations": {
      "recommendedMonthlyBudget": 1402.55,
      "recommendedAnnualBudget": 16830.60
    }
  }
}
```

#### Budget Planning
Generate comprehensive budget plans with CAPEX/OPEX breakdown.

**Endpoint:** `GET /budget-plan`

**Parameters:**
- `costCenter` (string): Filter by cost center
- `budgetYear` (2020-2050): Target budget year
- `includeCapex/includeOpex` (boolean): Include capital/operational expenses
- `riskBuffer` (0-0.50): Risk adjustment percentage

**Key Features:**
- ✅ **CAPEX/OPEX Categorization** - Automatic expense classification
- ✅ **Risk-Adjusted Budgets** - Configurable risk buffers
- ✅ **Multi-Year Planning** - Forward-looking budget projections
- ✅ **Cost Center Analysis** - Department-specific budgeting

### 🔄 Lifecycle Planning & Replacement Scheduling

#### Lifecycle Planning
Comprehensive asset lifecycle analysis with risk assessment.

**Endpoint:** `GET /lifecycle-plan`

**Parameters:**
- `planningHorizon` (12-120): Planning period in months
- `replacementThreshold` (0.5-1.0): Lifecycle percentage for replacement
- `includeRiskAssessment` (boolean): Include risk analysis

**Response Features:**
```json
{
  "data": {
    "summary": {
      "totalAssets": 150,
      "assetsRequiringReplacement": 23,
      "totalReplacementCost": 450000.00,
      "averageAssetAge": 28.5
    },
    "lifecycleCategories": {
      "new": [],      // < 25% of lifecycle
      "mature": [],   // 25-75% of lifecycle  
      "aging": [],    // 75-90% of lifecycle
      "critical": []  // > 90% of lifecycle
    },
    "replacementSchedule": [
      {
        "assetUuid": "...",
        "hostname": "server-01",
        "replacementDate": "2025-09",
        "estimatedCost": 15000.00,
        "priority": "Critical"
      }
    ],
    "riskAssessments": [
      {
        "assetUuid": "...",
        "riskLevel": "High",
        "riskFactors": ["High failure risk due to age", "No warranty coverage"],
        "mitigationRecommendations": ["Prioritize immediate replacement"]
      }
    ]
  }
}
```

#### Replacement Schedule Optimization
Optimize replacement timing with budget constraints.

**Endpoint:** `GET /replacement-schedule`

**Parameters:**
- `budgetConstraint` (number): Maximum budget available
- `prioritizeBy` (risk/cost/age): Optimization criteria
- `allowBudgetReallocation` (boolean): Enable budget flexibility

**Optimization Methods:**
- **Risk-Based**: Prioritize high-risk assets
- **Cost-Based**: Optimize for lowest total cost
- **Age-Based**: Replace oldest assets first

### 💼 ROI & Depreciation Calculations

#### ROI Analysis
Multi-method Return on Investment calculations.

**Endpoint:** `GET /roi/{assetUuid}`

**Analysis Methods:**
1. **Simple ROI**: Basic return calculation
2. **Comprehensive ROI**: Includes all cost categories
3. **NPV ROI**: Net Present Value with discount rates

**Parameters:**
- `analysisMethod` (simple/comprehensive/npv): Calculation method
- `discountRate` (0-0.30): Discount rate for NPV analysis
- `timeHorizon` (12-120): Analysis period in months

**Response Example:**
```json
{
  "data": {
    "roiMetrics": {
      "method": "Comprehensive ROI",
      "roi": 15.75,
      "monthlyROI": 0.26,
      "totalCosts": 125000.00,
      "netBenefit": 19687.50,
      "paybackPeriod": 42.3,
      "interpretation": "Good ROI"
    },
    "investment": {
      "initialInvestment": 100000.00,
      "ongoingCosts": 15000.00,
      "totalOperationalCosts": 10000.00
    },
    "benefits": {
      "totalBenefits": 144687.50,
      "benefitCategories": {
        "productivity": 57875.00,
        "costSavings": 43406.25,
        "riskReduction": 28937.50,
        "other": 14468.75
      }
    }
  }
}
```

#### Depreciation Analysis
Multiple depreciation methods with tax implications.

**Endpoint:** `GET /depreciation/{assetUuid}`

**Depreciation Methods:**
1. **Straight Line**: Equal annual depreciation
2. **Declining Balance**: Accelerated depreciation
3. **Sum of Years**: Front-loaded depreciation
4. **Units of Production**: Usage-based depreciation

**Parameters:**
- `methods` (array): Depreciation methods to calculate
- `decliningBalanceRate` (0.05-0.50): Rate for declining balance
- `salvageValuePercent` (0-0.50): Expected salvage value

**Response Features:**
```json
{
  "data": {
    "assetDetails": {
      "purchaseCost": 50000.00,
      "usefulLifeMonths": 60,
      "salvageValue": 5000.00,
      "monthsElapsed": 24,
      "remainingLife": 36
    },
    "depreciationMethods": {
      "straightLine": {
        "monthlyDepreciation": 750.00,
        "accumulatedDepreciation": 18000.00,
        "bookValue": 32000.00
      },
      "decliningBalance": {
        "annualRate": 20,
        "accumulatedDepreciation": 19200.00,
        "bookValue": 30800.00
      }
    },
    "depreciationSchedule": [
      {
        "month": "2025-08",
        "depreciation": 750.00,
        "bookValue": 31250.00
      }
    ],
    "taxImplications": [
      {
        "method": "Straight Line",
        "taxDeduction": 18000.00,
        "note": "Depreciation may be deductible for tax purposes"
      }
    ]
  }
}
```

#### Comprehensive Financial Analysis
Combined ROI, depreciation, and TCO analysis.

**Endpoint:** `GET /financial-analysis/{assetUuid}`

**Includes:**
- ✅ **ROI Analysis** - Multiple calculation methods
- ✅ **Depreciation Analysis** - All depreciation methods
- ✅ **Total Cost of Ownership** - Complete cost breakdown
- ✅ **Financial Health Score** - 0-100 scoring system
- ✅ **Strategic Recommendations** - Actionable insights

### 📊 Dashboard & Portfolio Analytics

#### Analytics Dashboard
Consolidated view of key metrics and forecasts.

**Endpoint:** `GET /dashboard`

**Features:**
- **Time-based Analysis** (30d, 90d, 1y, 2y)
- **Cost Center Filtering**
- **Integrated Forecasts**
- **Lifecycle Summaries**

#### Portfolio Summary
Enterprise-wide analytics aggregation.

**Endpoint:** `GET /portfolio-summary`

**Capabilities:**
- **Multi-Asset Analysis**
- **Portfolio-wide ROI**
- **Risk Aggregation**
- **Budget Consolidation**

## Advanced Features

### 🔍 Predictive Analytics
- **Trend Analysis**: Historical pattern recognition
- **Seasonal Adjustments**: Account for cyclical variations
- **Confidence Intervals**: Statistical uncertainty quantification
- **Inflation Modeling**: Economic factor integration

### 📈 Financial Modeling
- **Multi-Method ROI**: Simple, comprehensive, and NPV calculations
- **Depreciation Compliance**: Multiple accounting standards
- **Tax Optimization**: Depreciation tax implications
- **Risk Assessment**: Financial risk quantification

### 🎯 Optimization Algorithms
- **Budget Constraint Optimization**: Maximize value within limits
- **Multi-Criteria Decision Making**: Balance risk, cost, and age
- **Resource Allocation**: Optimal replacement scheduling
- **Scenario Planning**: What-if analysis capabilities

## Usage Examples

### Generate 12-Month Cost Forecast
```bash
curl "http://localhost:3000/api/v1/asset-analytics/forecast/550e8400-e29b-41d4-a716-446655440000?forecastMonths=12&includeInflation=true&confidenceLevel=0.95" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Annual Budget Plan
```bash
curl "http://localhost:3000/api/v1/asset-analytics/budget-plan?budgetYear=2026&includeCapex=true&riskBuffer=0.15" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Analyze Asset ROI
```bash
curl "http://localhost:3000/api/v1/asset-analytics/roi/550e8400-e29b-41d4-a716-446655440000?analysisMethod=npv&discountRate=0.08" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Calculate Depreciation
```bash
curl "http://localhost:3000/api/v1/asset-analytics/depreciation/550e8400-e29b-41d4-a716-446655440000?methods=straight_line,declining_balance" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Best Practices

### 📊 Data Quality
1. **Historical Data**: Ensure 12+ months of operational cost data
2. **Accurate Lifecycle Info**: Maintain current purchase dates and EOL data
3. **Cost Categorization**: Use consistent cost types and billing cycles
4. **Regular Updates**: Keep asset and cost data current

### 🎯 Analysis Configuration
1. **Appropriate Time Horizons**: Match analysis period to business cycles
2. **Realistic Assumptions**: Use market-appropriate inflation and discount rates
3. **Risk Buffers**: Include appropriate contingency factors
4. **Confidence Levels**: Choose statistical confidence appropriate for decisions

### 💡 Strategic Application
1. **Budget Planning**: Use forecasts for annual budget development
2. **Replacement Timing**: Optimize replacement schedules for cost efficiency
3. **Investment Decisions**: Apply ROI analysis for capital allocation
4. **Risk Management**: Use lifecycle analysis for proactive planning

## Integration Points

### Financial Systems
- **ERP Integration**: Budget and cost data synchronization
- **Accounting Systems**: Depreciation schedule export
- **Procurement**: Replacement cost estimation
- **Treasury**: Cash flow planning

### Business Intelligence
- **Dashboard Integration**: Embed analytics in BI tools
- **Report Automation**: Scheduled analytics reports
- **Alert Systems**: Threshold-based notifications
- **Data Warehousing**: Historical analytics data storage
