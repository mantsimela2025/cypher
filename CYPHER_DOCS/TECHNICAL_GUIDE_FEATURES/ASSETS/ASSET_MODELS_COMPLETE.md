# Complete Asset-Related Sequelize Models

## Asset Cost Management Models (19 Models)

### Core Cost Management
1. **CostCategory** - Manages expense categories (CapEx/OpEx), tax deductibility, and depreciation
2. **CostCenter** - Hierarchical cost center organization with budgets and managers
3. **AssetCost** - Individual asset cost tracking with procurement references and recurrence

### Asset Lifecycle Management
4. **AssetLifecycle** - Tracks purchase dates, warranties, EOL dates, and replacement planning
5. **SoftwareAsset** - Software inventory with licensing and installation tracking
6. **SoftwareLifecycle** - Software version lifecycle with EOL and upgrade planning
7. **AssetOperationalCost** - Monthly operational costs (power, space, network, storage, labor)

### Cloud Cost Management
8. **CloudAsset** - Cloud resource management across AWS, Azure, and GCP
9. **CloudServiceCost** - Cloud service billing and usage tracking
10. **CloudCostMapping** - Maps cloud resources to physical assets with allocation percentages

### License Management
11. **LicenseType** - Defines subscription vs. perpetual license models
12. **License** - License tracking with seat allocation and renewal management
13. **LicenseCost** - License cost tracking with renewal and seat-based pricing

### Financial Planning & Risk Assessment
14. **CostBudget** - Budget planning and actual vs. planned cost tracking
15. **CostForecast** - Cost forecasting with confidence levels
16. **BusinessImpactCost** - Downtime costs, breach estimates, and criticality levels
17. **RiskAdjustmentFactor** - Risk-based cost adjustment factors (1-5 scale)
18. **PowerRateTier** - Electricity rate tiers by location and time periods

## Complete Model Architecture Summary

**Total Sequelize Models: 57**

### By Category:
- **Core Security**: 6 models (User, Asset, Vulnerability, POAM, Patch, VulnerabilityCost)
- **Policy & Compliance**: 9 models (Policy, Workflow, Framework, Status tracking)
- **Asset Cost Management**: 19 models (Cost tracking, lifecycle, licensing, cloud, forecasting)
- **AI & Machine Learning**: 11 models (NLP, training data, interactions)
- **Dashboard & Reporting**: 4 models (Metrics, dashboards, templates)
- **System Administration**: 8 models (Settings, audit logs, deployments)

### Key Asset Model Relationships:
- Assets have comprehensive cost tracking with categories and centers
- Lifecycle management with replacement planning and budget allocation
- Software asset inventory with license compliance
- Cloud resource mapping and cost allocation
- Business impact assessment for risk-adjusted costing

### Cost Management Features:
- Multi-currency support with USD default
- CapEx/OpEx categorization with tax implications
- Hierarchical cost center budgeting
- Procurement reference tracking
- Recurring cost management (monthly/annual)
- Warranty and EOL tracking with replacement forecasting
- License seat allocation and renewal management
- Cloud resource cost mapping and allocation
- Business criticality scoring (1-5 scale)
- Downtime cost modeling per hour

This completes the comprehensive asset cost management foundation for your vulnerability management platform, providing enterprise-grade financial tracking and lifecycle management capabilities.