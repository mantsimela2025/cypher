# Risk Assessment Mathematical Calculations

This document provides a high-level overview of the mathematical calculations used in our risk assessment system.

## 1. Enhanced CVSS Calculation

**Purpose**: Enhances the standard CVSS score by incorporating temporal and environmental factors specific to your organization.

**Key Components**:
- Starts with CVSS Base Score from vulnerability database
- Applies temporal multipliers (exploit maturity, remediation level, report confidence)
- Adjusts for environmental impact based on confidentiality, integrity, and availability requirements
- Accounts for attack scope changes

**Business Value**: Creates a more contextualized risk score that reflects current threat landscape and your specific environment, rather than generic vulnerability ratings.

## 2. Asset Risk Score Calculation

**Purpose**: Determines the risk level of an individual asset based on its vulnerabilities and contextual importance.

**Key Components**:
- Calculates weighted average of vulnerability scores on the asset
- Applies criticality multiplier based on asset importance (1-5 scale)
- Factors in exposure level (internal, DMZ, internet-facing)
- Normalizes to a 0-10 scale

**Business Value**: Enables prioritization of assets for remediation efforts and provides a comparable metric across different system types.

## 3. Organizational Risk Score Aggregation

**Purpose**: Consolidates individual asset risks into an organization-wide risk posture.

**Key Components**:
- Computes weighted average of asset risk scores based on their relative importance
- Uses logarithmic scaling to prevent artificial inflation from large numbers of low-risk assets
- Normalized to a 0-10 scale for consistent reporting

**Business Value**: Provides executive-level visibility into overall security posture and enables trend analysis over time.

## 4. Risk Trend Calculation

**Purpose**: Analyzes how risk is changing over time to identify improving or deteriorating security conditions.

**Key Components**:
- Performs linear regression on historical risk scores
- Calculates slope to determine rate of change
- Normalizes to percentage change per time window

**Business Value**: Shows whether security investments are improving risk posture and highlights areas where risk is increasing.

## 5. Remediation Impact Calculation

**Purpose**: Predicts how specific remediation actions will affect overall risk scores.

**Key Components**:
- Calculates percentage of total risk weight addressed by proposed fixes
- Applies diminishing returns formula (fixing high-risk items has more initial impact)
- Projects new risk score after remediation

**Business Value**: Enables data-driven decisions about which vulnerabilities to address first for maximum risk reduction.

## 6. Security Posture Grade Calculation

**Purpose**: Transforms numerical risk metrics into an easily understood letter grade (A-F) for reporting.

**Key Components**:
- Converts risk score to a 0-100 scale (inverted - lower risk is better)
- Weights risk (50%), compliance (30%), and best practices (20%)
- Maps weighted score to letter grade thresholds

**Business Value**: Provides intuitive, executive-friendly reporting that can be easily communicated to stakeholders.

## 7. Vulnerability Aging Impact

**Purpose**: Accounts for increased risk as vulnerabilities remain unpatched over time.

**Key Components**:
- Applies logarithmic increase to risk based on days the vulnerability has been open
- Caps at 1.5x the base risk after approximately 90 days
- Maintains 0-10 scale boundaries

**Business Value**: Encourages timely remediation by quantifying the increasing risk of aging vulnerabilities.