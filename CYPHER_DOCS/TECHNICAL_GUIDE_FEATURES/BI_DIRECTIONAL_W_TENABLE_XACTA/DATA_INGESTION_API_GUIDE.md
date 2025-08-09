# RAS DASH Data Ingestion API Guide

## Overview

The RAS DASH data ingestion system provides secure, validated endpoints for importing JSON data from Tenable and Xacta platforms. The system includes automatic data validation, batch tracking, error handling, and post-processing automation.

## API Endpoints

### Base URL: `/api/ingestion`

### 1. Tenable Vulnerability Ingestion

**Endpoint:** `POST /api/ingestion/tenable/vulnerabilities`

**Purpose:** Ingest vulnerability scan results from Tenable.io or Tenable.sc

**Request Body:**
```json
{
  "vulnerabilities": [
    {
      "plugin_id": "19506",
      "plugin_name": "Nessus SYN scanner",
      "severity": "Critical",
      "cvss_score": 9.3,
      "cvss_vector": "AV:N/AC:M/Au:N/C:C/I:C/A:C",
      "description": "This plugin performs a SYN scan of the remote host to find open ports.",
      "solution": "Apply security patches and configure firewall rules.",
      "state": "Open",
      "first_found": "2024-01-15T10:30:00Z",
      "last_found": "2024-01-20T14:45:00Z",
      "asset": {
        "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "hostname": "web-server-01",
        "ip_address": "192.168.1.100",
        "fqdn": "web-server-01.company.local",
        "operating_system": "Windows Server 2019",
        "system_uuid": "sys-a1b2c3d4-e5f6-7890"
      },
      "cves": ["CVE-2024-1234", "CVE-2024-5678"]
    }
  ],
  "metadata": {
    "scan_id": "scan-123456",
    "scan_date": "2024-01-20T14:45:00Z",
    "scanner_version": "10.4.0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "batch_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "processed": 1,
  "errors": 0,
  "message": "Successfully processed 1 vulnerabilities with 0 errors"
}
```

### 2. Xacta Systems Ingestion

**Endpoint:** `POST /api/ingestion/xacta/systems`

**Purpose:** Ingest system information and authorization boundaries from Xacta

**Request Body:**
```json
{
  "systems": [
    {
      "uuid": "sys-a1b2c3d4-e5f6-7890",
      "name": "Enterprise Web Application",
      "description": "Customer-facing web application with database backend",
      "classification_level": "CONFIDENTIAL",
      "system_type": "Information System",
      "status": "Operational",
      "owner_organization": "IT Department",
      "technical_poc": "John Smith",
      "system_manager": "Jane Doe",
      "authorization_status": "ATO Granted",
      "ato_date": "2023-06-15",
      "ato_expiration_date": "2026-06-15"
    }
  ],
  "metadata": {
    "export_date": "2024-01-20T10:00:00Z",
    "xacta_version": "6.2.1"
  }
}
```

### 3. Xacta Controls Ingestion

**Endpoint:** `POST /api/ingestion/xacta/controls`

**Purpose:** Ingest NIST 800-53 control implementation status from Xacta

**Request Body:**
```json
{
  "controls": [
    {
      "control_identifier": "AC-2",
      "control_name": "Account Management",
      "control_family": "Access Control",
      "implementation_status": "implemented",
      "assessment_status": "passed",
      "control_effectiveness": "Effective",
      "testing_frequency": "Annual",
      "last_assessment_date": "2024-01-10",
      "next_assessment_date": "2025-01-10",
      "assessment_method": "Interview and Testing",
      "evidence_location": "/evidence/AC-2/",
      "notes": "All user accounts properly managed with approval workflow",
      "asset_uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    }
  ]
}
```

### 4. Xacta POAMs Ingestion

**Endpoint:** `POST /api/ingestion/xacta/poams`

**Purpose:** Ingest Plan of Action and Milestones from Xacta

**Request Body:**
```json
{
  "poams": [
    {
      "poam_number": "POAM-2024-001",
      "title": "Implement Multi-Factor Authentication",
      "description": "Deploy MFA solution across all user accounts",
      "weakness_description": "Lack of multi-factor authentication increases risk of unauthorized access",
      "status": "in_progress",
      "priority_level": 2,
      "milestone_date": "2024-03-15",
      "scheduled_completion_date": "2024-03-01",
      "responsible_entity": "IT Security Team",
      "resources_required": "2 FTE, MFA software licenses",
      "estimated_cost": 75000,
      "source_assessment": "Annual Assessment 2024",
      "weakness_detection_source": "Penetration Test"
    }
  ]
}
```

## Batch Management

### Get Batch Status

**Endpoint:** `GET /api/ingestion/batch/{batchId}/status`

**Response:**
```json
{
  "success": true,
  "batch": {
    "batch_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "source_system": "tenable",
    "data_type": "vulnerabilities",
    "status": "completed",
    "total_records": 150,
    "successful_records": 148,
    "failed_records": 2,
    "created_at": "2024-01-20T14:45:00Z",
    "completed_at": "2024-01-20T14:47:30Z"
  }
}
```

### Get Ingestion Statistics

**Endpoint:** `GET /api/ingestion/statistics`

**Response:**
```json
{
  "success": true,
  "statistics": [
    {
      "source_system": "tenable",
      "data_type": "vulnerabilities",
      "batch_count": 45,
      "total_records_processed": 12500,
      "total_errors": 23,
      "last_ingestion": "2024-01-20T14:45:00Z"
    },
    {
      "source_system": "xacta",
      "data_type": "systems",
      "batch_count": 12,
      "total_records_processed": 187,
      "total_errors": 1,
      "last_ingestion": "2024-01-19T09:30:00Z"
    }
  ]
}
```

## Automated Post-Processing

After successful ingestion, the system automatically triggers:

1. **Patch Identification** - Matches vulnerabilities to available patches
2. **System Risk Calculation** - Updates risk profiles based on new vulnerability data
3. **Asset Mapping** - Links ingested assets to existing asset inventory
4. **Vulnerability Summary Updates** - Refreshes system-level vulnerability counts

## Data Validation

All incoming data is validated using Zod schemas:

- **Required Fields** - Ensures critical data points are present
- **Data Types** - Validates correct types (strings, numbers, dates)
- **Enum Values** - Checks against allowed values (severity levels, statuses)
- **Format Validation** - Validates UUIDs, dates, and other formatted fields

## Error Handling

### Validation Errors
```json
{
  "error": "Validation failed",
  "validation_errors": [
    {
      "index": 0,
      "errors": [
        {
          "path": ["severity"],
          "message": "Invalid enum value. Expected 'Critical' | 'High' | 'Medium' | 'Low' | 'Info', received 'Severe'"
        }
      ]
    }
  ]
}
```

### Processing Errors
Individual record errors are logged but don't stop batch processing. The batch completes with a status of `completed_with_errors`.

## Authentication & Security

- API endpoints require valid authentication tokens
- All data is validated and sanitized before database insertion
- Batch tracking provides audit trail for all ingestion activities
- Raw JSON data is preserved for debugging and reprocessing

## Integration Examples

### Python Integration
```python
import requests
import json

# Tenable vulnerability ingestion
def ingest_tenable_data(vulnerabilities, api_token):
    headers = {
        'Authorization': f'Bearer {api_token}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'vulnerabilities': vulnerabilities,
        'metadata': {
            'source': 'tenable_api_export',
            'timestamp': '2024-01-20T14:45:00Z'
        }
    }
    
    response = requests.post(
        'https://rasdash.example.com/api/ingestion/tenable/vulnerabilities',
        headers=headers,
        json=payload
    )
    
    return response.json()
```

### PowerShell Integration
```powershell
# Xacta systems ingestion
$headers = @{
    'Authorization' = "Bearer $apiToken"
    'Content-Type' = 'application/json'
}

$payload = @{
    systems = $systemsArray
    metadata = @{
        export_source = 'xacta_scheduled_export'
        timestamp = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
    }
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri 'https://rasdash.example.com/api/ingestion/xacta/systems' -Method POST -Headers $headers -Body $payload
```

## Monitoring & Troubleshooting

### Health Check
**Endpoint:** `GET /api/ingestion/health`

### Batch Status Monitoring
Monitor batch processing status and set up alerts for failed ingestions.

### Data Quality Checks
The system tracks data quality metrics and flags potential issues for review.

## Best Practices

1. **Batch Size** - Limit batches to 1000 records for optimal performance
2. **Error Handling** - Always check batch status after ingestion
3. **Retry Logic** - Implement exponential backoff for failed requests
4. **Data Freshness** - Schedule regular ingestion to maintain current data
5. **Monitoring** - Set up alerts for ingestion failures or data quality issues