# Authorization to Operate (ATO) System Documentation

## Overview
The Authorization to Operate (ATO) System provides comprehensive lifecycle management for cybersecurity authorizations, supporting the complete workflow from initial submission through approval, monitoring, and reauthorization. This system implements federal cybersecurity compliance requirements with role-based approvals, document management, and continuous monitoring capabilities.

## Base URL
```
http://localhost:3000/api/v1/ato
```

## Authentication & Permissions
- **Authentication**: JWT token required
- **Permissions**: Role-based access control with specific ATO permissions
  - `ato:create` - Create new ATOs
  - `ato:read` - View ATOs and related data
  - `ato:update` - Modify ATOs and submit for review
  - `ato:approve` - Review and approve ATOs
  - `ato:revoke` - Revoke existing ATOs
  - `ato:delete` - Delete draft ATOs

## Core Features

### 🏛️ **ATO Lifecycle Management**

#### **ATO Types Supported:**
- **Full ATO** - Complete authorization for full system operations (3-year validity)
- **Interim ATO** - Temporary authorization pending full review (1-year validity)
- **Provisional ATO** - Limited authorization with specific conditions (6-month validity)
- **Conditional ATO** - Authorization with mandatory requirements (6-month validity)

#### **Status Workflow:**
```
Draft → Submitted → Under Review → Pending Approval → Approved
                                                   → Rejected
                                                   → Revoked
                                                   → Expired
```

#### **Risk Levels:**
- **Low** - Minimal impact to operations if compromised
- **Moderate** - Serious adverse impact if compromised
- **High** - Severe or catastrophic impact if compromised

### 🔄 **Workflow Management**

#### **Approval Roles:**
- **System Owner** - Responsible for system operations and initial submission
- **Security Officer** - Conducts security review and assessment
- **Privacy Officer** - Performs privacy impact assessment
- **Risk Executive** - Evaluates and accepts risk posture
- **Authorizing Official** - Final approval authority for ATO
- **CIO/CISO** - Executive level approvals and oversight

#### **Workflow Stages:**
1. **Initial Submission** - System owner creates and submits ATO package
2. **Security Review** - Security officer evaluates security controls
3. **Privacy Review** - Privacy officer assesses privacy implications
4. **Risk Assessment** - Risk executive evaluates risk posture
5. **Technical Review** - Technical evaluation of system architecture
6. **Management Review** - Management oversight and approval
7. **Final Approval** - Authorizing official grants authorization
8. **Continuous Monitoring** - Ongoing monitoring and assessment
9. **Reauthorization** - Periodic reauthorization process

### 📄 **Document Management**

#### **Supported Document Types:**
- **System Security Plan (SSP)** - Comprehensive security documentation
- **Security Assessment Report (SAR)** - Independent security assessment
- **Plan of Action & Milestones (POA&M)** - Remediation tracking
- **Risk Assessment** - Formal risk analysis documentation
- **Continuous Monitoring Plan** - Ongoing monitoring procedures
- **Authorization Memorandum** - Official authorization document
- **Supporting Evidence** - Additional compliance documentation

#### **Document Features:**
- Secure file storage with access controls
- Version control and audit trail
- Document type validation
- Upload tracking with user attribution
- Automated workflow integration

## API Endpoints

### 🏛️ **Core CRUD Operations**

#### **Create ATO**
```http
POST /api/v1/ato
```

**Request Body:**
```json
{
  "sspId": 1,
  "type": "full",
  "riskLevel": "moderate",
  "authorizationMemo": "System meets security requirements...",
  "authorizationConditions": "Continuous monitoring required...",
  "continuousMonitoringPlan": "Automated scanning and quarterly assessments..."
}
```

**Response:**
```json
{
  "message": "ATO created successfully",
  "data": {
    "id": 123,
    "sspId": 1,
    "type": "full",
    "status": "draft",
    "riskLevel": "moderate",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### **Get All ATOs**
```http
GET /api/v1/ato?status=approved&type=full&page=1&limit=20
```

**Query Parameters:**
- `status` - Filter by ATO status
- `type` - Filter by ATO type
- `sspId` - Filter by System Security Plan ID
- `riskLevel` - Filter by risk level
- `expiringWithinDays` - Filter ATOs expiring within specified days
- `authorizedBy` - Filter by authorizing user
- `page` - Page number for pagination
- `limit` - Number of results per page
- `sortBy` - Sort field (createdAt, approvalDate, expirationDate)
- `sortOrder` - Sort direction (asc, desc)

#### **Get ATO by ID**
```http
GET /api/v1/ato/{atoId}?includeHistory=true&includeDocuments=true
```

#### **Update ATO**
```http
PUT /api/v1/ato/{atoId}
```

#### **Delete ATO**
```http
DELETE /api/v1/ato/{atoId}
```

### 🔄 **Workflow Management**

#### **Submit ATO for Review**
```http
POST /api/v1/ato/{atoId}/submit
```

**Request Body:**
```json
{
  "comments": "ATO package is complete and ready for security review."
}
```

#### **Review ATO**
```http
POST /api/v1/ato/{atoId}/review
```

**Request Body:**
```json
{
  "action": "approve",
  "comments": "Security review completed successfully.",
  "approvalRole": "security_officer",
  "signature": "John Smith, CISO - Digital Signature Applied"
}
```

**Actions:**
- `approve` - Approve the ATO for next stage or final authorization
- `reject` - Reject the ATO with comments
- `request_changes` - Request modifications before approval

#### **Revoke ATO**
```http
POST /api/v1/ato/{atoId}/revoke
```

**Request Body:**
```json
{
  "reason": "Security incident requires immediate revocation.",
  "approvalRole": "authorizing_official"
}
```

### 📄 **Document Management**

#### **Upload Document**
```http
POST /api/v1/ato/{atoId}/documents
```

**Request Body:**
```json
{
  "documentType": "System Security Plan",
  "fileName": "SSP_v2.1.pdf",
  "fileLocation": "/secure/ato/documents/ssp_v2.1.pdf"
}
```

#### **Get Documents**
```http
GET /api/v1/ato/{atoId}/documents
```

#### **Delete Document**
```http
DELETE /api/v1/ato/documents/{documentId}
```

### 📊 **Analytics & Reporting**

#### **Dashboard Statistics**
```http
GET /api/v1/ato/dashboard/stats
```

**Response:**
```json
{
  "data": {
    "statusDistribution": [
      {"status": "approved", "count": 45},
      {"status": "under_review", "count": 12}
    ],
    "typeDistribution": [
      {"type": "full", "count": 38},
      {"type": "interim", "count": 19}
    ],
    "expiringCount": 8,
    "expiredCount": 2,
    "recentActivityCount": 156
  }
}
```

#### **Expiring ATOs**
```http
GET /api/v1/ato/expiring?daysAhead=90
```

#### **Workflow Metrics**
```http
GET /api/v1/ato/metrics/workflow?timeRange=30d
```

**Response:**
```json
{
  "data": {
    "averageApprovalDays": 45.2,
    "approvedCount": 23,
    "stageDistribution": [
      {"workflowStage": "security_review", "count": 15},
      {"workflowStage": "final_approval", "count": 8}
    ],
    "roleActivity": [
      {"approvalRole": "security_officer", "count": 34},
      {"approvalRole": "authorizing_official", "count": 12}
    ]
  }
}
```

#### **Search ATOs**
```http
GET /api/v1/ato/search?q=security&status=approved&type=full
```

### 📋 **Workflow History**

#### **Get Workflow History**
```http
GET /api/v1/ato/{atoId}/history
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "action": "approve",
      "status": "approved",
      "comments": "Final authorization granted.",
      "performedBy": 5,
      "performedAt": "2024-01-20T14:30:00Z",
      "approvalRole": "authorizing_official",
      "workflowStage": "final_approval",
      "signature": "Jane Doe, AO - Digital Signature",
      "performedByName": "Jane",
      "performedByLastName": "Doe"
    }
  ]
}
```

## Business Logic

### 🔒 **Security Controls**

#### **Access Control:**
- Role-based permissions for all operations
- User authentication required for all endpoints
- Audit trail for all actions and changes
- Digital signature support for approvals

#### **Data Validation:**
- Input validation for all request parameters
- Business rule enforcement (e.g., only draft ATOs can be deleted)
- Status transition validation
- Document type and size validation

#### **Workflow Enforcement:**
- Sequential approval process with stage gates
- Role-based approval authority validation
- Automatic status transitions based on actions
- Expiration date calculation based on ATO type

### 📈 **Performance Features**

#### **Database Optimization:**
- Comprehensive indexing strategy for fast queries
- Composite indexes for complex filtering scenarios
- Optimized pagination with efficient counting
- Query performance monitoring

#### **Caching Strategy:**
- Dashboard statistics caching
- Frequently accessed ATO data caching
- Document metadata caching
- Search result caching

### 🔄 **Integration Points**

#### **System Integration:**
- **User Management** - Authentication and role management
- **Document Storage** - Secure file storage integration
- **Notification System** - Workflow notifications and alerts
- **Audit System** - Comprehensive audit logging
- **Compliance Reporting** - Automated compliance reports

#### **External Systems:**
- **FISMA Compliance** - Federal compliance reporting
- **Risk Management** - Risk assessment integration
- **Continuous Monitoring** - Security monitoring tools
- **Identity Management** - Enterprise identity systems

## Testing

### 🧪 **API Testing**
```bash
# Test complete ATO system
npm run test:ato-api

# Test database schemas
npm run test:ato-schemas

# Generate migration SQL
npm run generate:ato-migration
```

### 📊 **Test Coverage**
- **CRUD Operations** - Complete create, read, update, delete testing
- **Workflow Management** - Full lifecycle testing from draft to approval
- **Document Management** - Upload, retrieval, and deletion testing
- **Analytics** - Dashboard statistics and reporting testing
- **Security** - Permission and access control testing
- **Performance** - Load testing and optimization validation

## Compliance & Standards

### 📋 **Federal Compliance**
- **FISMA** - Federal Information Security Management Act
- **NIST SP 800-37** - Risk Management Framework
- **NIST SP 800-53** - Security and Privacy Controls
- **FedRAMP** - Federal Risk and Authorization Management Program

### 🏛️ **Government Standards**
- **OMB A-130** - Managing Information as a Strategic Resource
- **CISA Directives** - Cybersecurity and Infrastructure Security Agency
- **DoD 8510.01** - Department of Defense RMF implementation

This ATO System provides enterprise-grade authorization management with comprehensive workflow support, document management, and compliance reporting capabilities.
