# Risk Analysis Methodology

This document explains how risk metrics are generated, calculated, and utilized within the vulnerability management platform to prioritize remediation efforts and allocate security resources effectively.

## 1. Core Risk Components

The risk analysis system is built on several fundamental components that together provide a comprehensive view of security risks:

### 1.1 CVSS Base Score

Common Vulnerability Scoring System (CVSS) provides the foundation for vulnerability severity assessment:

- **Scale**: 0.0 to 10.0
- **Source**: National Vulnerability Database (NVD) or vendor-specific scoring
- **Generation**: Based on standardized metrics including attack vector, complexity, privileges required, user interaction, scope, and impact dimensions
- **Categorization**:
  - Critical: 9.0-10.0
  - High: 7.0-8.9
  - Medium: 4.0-6.9
  - Low: 0.1-3.9
  - Info: 0.0

### 1.2 Asset Criticality

Assets are assigned criticality levels based on their importance to business operations:

- **Scale**: Low, Medium, High, Critical (converted to numerical values 3, 5, 8, 10)
- **Determination**: Manual assignment during asset registration or automated classification
- **Factors Considered**:
  - Business function supported
  - Data sensitivity
  - Operational importance
  - Recovery time objectives
  - Public exposure

### 1.3 Asset Value

Monetary or business value associated with each asset:

- **Scale**: Configurable based on organization requirements (default 1-10)
- **Purpose**: Used in business impact calculations and ROI analysis

## 2. Risk Score Calculation

### 2.1 Adjusted Risk Score

The system adjusts the base CVSS score to account for asset-specific factors:

```
adjustedScore = Min(10, cvssScore * assetCriticalityFactor)
```

Where:
- `assetCriticalityFactor = (assetCriticality/10 + 0.5)`
- This formula increases the risk score for vulnerabilities on critical assets

### 2.2 Business Impact

Calculated based on asset value and criticality:

```
businessImpact = Min(10, assetValue * (assetCriticality/10))
```

This reflects the potential business consequences of a successful exploit.

### 2.3 Exploit Likelihood

Represents the probability that a vulnerability will be exploited:

```
exploitLikelihood = cvssScore / 2
```

In a production environment, this would incorporate additional threat intelligence data, including:
- Known exploit availability
- Threat actor activity
- Exposure of the vulnerable component

### 2.4 Mitigation Difficulty

Reflects the complexity and effort required to remediate the vulnerability:

```
mitigationDifficulty = Min(10, assetCriticality + 2)
```

This accounts for the increased complexity of applying changes to critical systems.

## 3. POA&M Prioritization

For Plans of Action and Milestones (POA&Ms), the system uses a weighted formula to prioritize remediation efforts:

### 3.1 Priority Score Calculation

```
baseScore = (businessImpactWeight*2 + severityWeight*1.5 + complexityWeight + assetWeight + effortWeight*0.8) / 6.3
```

Where:
- `businessImpactWeight`: Weighted 2x (scale 1-10, based on impact severity)
- `severityWeight`: Weighted 1.5x (scale 1-10, based on vulnerability severity)
- `complexityWeight`: Standard weight (scale 1-10, inverse of implementation complexity)
- `assetWeight`: Standard weight (scale 1-10, based on asset criticality)
- `effortWeight`: Weighted 0.8x (scale 1-10, inverse of effort hours)
- `6.3`: Normalization factor to keep score in 0-10 range

### 3.2 Additional Priority Factors

The base score is further adjusted with:

- **Exploit Availability Bonus**: +2 points if an exploit is available
- **Compliance Requirement Multiplier**: 1.5x if required for regulatory compliance

### 3.3 Economic Analysis

For cost-based prioritization, the system calculates:

- **Cost-Benefit Ratio**: `potentialImpactCost / remediationCost`
- **ROI Percentage**: `((potentialImpactCost - remediationCost) / remediationCost) * 100`

These metrics help identify which vulnerabilities provide the highest return on security investment.

## 4. Risk Visualization

The platform generates multiple visualizations to represent risk data:

### 4.1 Vulnerability Risk Heat Map

Shows risk scores across asset groups using a color gradient:
- Based on severity weights:
  - Critical: 10
  - High: 6
  - Medium: 3
  - Low: 1
  - Info: 0.1

### 4.2 Asset Risk Categorization

Assets are categorized into risk tiers based on configurable thresholds:
- Critical Risk: ≥75
- High Risk: ≥60
- Medium Risk: ≥30
- Low Risk: <30

### 4.3 Risk Trends

Tracks average risk scores over time (30-day window) to show improvement or degradation.

### 4.4 Top Risk Assets

Lists assets with the highest average adjusted risk scores.

## 5. Asset Classification and Criticality Determination

The system uses multiple methods to automatically classify assets and determine their criticality:

### 5.1 Service-Based Classification

Assets are classified based on services running on them:
- Web servers
- Database servers
- File servers
- Mail servers
- Domain controllers
- Network devices
- Workstations
- IoT devices

### 5.2 Operating System Classification

Different OS types lead to different classifications and tags:
- Windows Server → server, critical-infrastructure
- Windows Client → workstation, endpoint
- Linux → determined by hostname patterns
- Network OS → network-device, critical-infrastructure

### 5.3 Port Analysis

Open ports are used to infer asset function and criticality:
- Standard ports (80, 443, 22, 3389, etc.) indicate specific services
- Number and type of open ports affect risk profile

### 5.4 Hostname Pattern Matching

Asset names are analyzed for keywords indicating their purpose:
- Web, DB, File, Mail, DC, etc.
- Dev, Test, Prod environments
- Backup, Monitor, Proxy functions

### 5.5 Cloud Provider Information

Cloud resources get special classification with provider-specific logic:
- AWS: EC2, S3, RDS, Lambda resources
- Azure: VMs, Storage Accounts, SQL instances
- GCP: Compute Engine, Cloud Storage, etc.

## 6. Configurable Risk Parameters

The system allows administrators to customize risk analysis through the settings interface:

### 6.1 Weight Adjustments

Admins can change the relative importance of:
- Vulnerability severity (default 40%)
- Asset criticality (default 30%)
- Exposure factors (default 20%)
- Other risk contributors (default 10%)

### 6.2 Risk Thresholds

Configurable thresholds for risk categories:
- Critical: ≥75% (default)
- High: ≥50% (default)
- Medium: ≥25% (default)
- Low: <25% (default)

## 7. Risk Assessment Process

### 7.1 Automated Assessment

1. Vulnerability is detected through scanning
2. Asset metadata (criticality, value) is retrieved
3. Base CVSS score is extracted from vulnerability data
4. Adjustments are applied based on asset factors
5. Risk indicators (adjusted score, business impact, etc.) are calculated
6. Results are stored in vulnerability_risk_scores table

### 7.2 Risk Justification

The system generates natural language justifications for risk scores:
- Explains contribution of each factor
- Provides context for risk adjustments
- Supports risk-based decision making

## 8. Integration with Business Impact Analysis

The risk metrics feed into the business impact analysis system:

### 8.1 Impact Projections

- Estimated downtime hours based on vulnerability severity and asset criticality
- Reputation impact percentage
- Regulatory risk percentage
- Potential financial losses

### 8.2 Business Impact Categories

Vulnerabilities are categorized by business impact:
- Critical: Major business disruption, significant financial impact
- Significant: Limited business disruption, moderate financial impact
- Moderate: Minor business disruption, limited financial impact
- Minor: Minimal business disruption, negligible financial impact

This methodology ensures a comprehensive, risk-based approach to vulnerability management that aligns security efforts with business priorities.