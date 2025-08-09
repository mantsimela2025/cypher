# AI/ML and IC/DoD Compliance Features

This document outlines the two major feature enhancements added to the Vulnerability Management Platform:

1. **AI/ML Risk Prioritization** - Using AI to enhance vulnerability risk scoring beyond CVSS
2. **IC/DoD Compliance Requirements** - Support for government security frameworks and classification

## Database Schema Extensions

### AI/ML Risk Prioritization Tables

| Table | Description |
|-------|-------------|
| `vulnerability_risk_scores` | Stores AI-calculated risk scores for vulnerabilities including base score, adjusted score, business impact, exploit likelihood, and mitigation difficulty |
| `risk_factors` | Configurable weights for risk calculation components (e.g., asset criticality, data sensitivity) |
| `risk_models` | Stores model metadata and performance metrics for different AI risk assessment approaches |
| `risk_score_history` | Tracks changes to risk scores over time for audit and trend analysis |

### IC/DoD Compliance Tables

| Table | Description |
|-------|-------------|
| `compliance_frameworks` | Standard frameworks like NIST, JSIG, ICD503 with version and agency information |
| `compliance_controls` | Individual security controls within frameworks with implementation guidance |
| `system_compliance_status` | Tracks compliance status for each system/asset against specific frameworks |
| `control_compliance_status` | Detailed status for each control for each asset with verification evidence |
| `plan_of_action_milestones` | Track remediation plans (POA&Ms) for non-compliant controls |
| `security_classification_guide` | For handling classified information with classification authorities |
| `information_classification_items` | Specific items covered by security classification guides |

## Setup Instructions

### 1. Run Database Migrations

To create the new tables in your database:

```bash
# Option 1: Run using Drizzle
npm run db:push

# Option 2: Run the migration directly
tsx migrations/006_ai_compliance_tables.ts
```

### 2. Seed the Database

#### Option 1: Seed Everything at Once

```bash
# Seed both AI risk and compliance data
tsx server/seed-ai-compliance.ts
```

#### Option 2: Seed Specific Features

```bash
# Seed only AI risk assessment data
tsx server/seed-risk-assessment.ts

# Seed only compliance data
tsx server/seed-compliance.ts
```

## Feature Usage

### AI Risk Prioritization

The AI risk prioritization extends the standard CVSS scoring by adding:

1. **Contextual Business Impact** - How critical the affected system is to business operations
2. **Exploitation Likelihood** - Probability estimates for actual exploitation 
3. **Mitigation Difficulty** - How complex remediation will be given the environment
4. **Confidence Scoring** - The AI's confidence in its assessment

This helps security teams prioritize their workload beyond simple CVSS scores.

### IC/DoD Compliance

The compliance features provide:

1. **Framework Mapping** - Map assets to controls across multiple frameworks
2. **Control Implementation Status** - Track detailed control implementation status
3. **POA&M Management** - Track remediation plans for compliance gaps
4. **Security Classification** - Handle classified information appropriately

These features are essential for government systems and contractors needing to demonstrate compliance.

## Integration Points

### Risk Score Integration

- The risk scores appear in vulnerability listings
- Asset risk scoring aggregates vulnerability scores
- Dashboard widgets can visualize risk trends and hotspots

### Compliance Integration

- Asset details include compliance status
- POA&Ms appear in remediation workflows
- Compliance reports are available in the reporting module

## Next Steps and Customization

### Risk Assessment Models

The system supports multiple risk models with different parameters. You can:

1. Customize the weights in the `risk_factors` table
2. Activate different models in the `risk_models` table 
3. Extend with additional factors specific to your environment

### Compliance Frameworks

The system comes with NIST SP 800-53 Rev 5 controls, but you can:

1. Add additional frameworks via the seed scripts
2. Customize control descriptions and implementation guidance
3. Define custom assessment procedures

For detailed API documentation on these features, refer to the API documentation.