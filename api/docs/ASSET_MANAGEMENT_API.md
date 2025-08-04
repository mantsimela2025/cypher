# Asset Management API Documentation

## Overview
The Asset Management API provides comprehensive CRUD operations for managing asset costs, lifecycle, operational expenses, and risk mapping. All endpoints require authentication and appropriate permissions.

## Base URL
```
http://localhost:3000/api/v1/asset-management
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Permissions
Asset Management operations require the following permissions:
- `asset_management:create` - Create new records
- `asset_management:read` - View records
- `asset_management:update` - Update existing records
- `asset_management:delete` - Delete records

## Endpoints

### 💰 Asset Cost Management

#### Create Cost Record
```http
POST /costs
```

**Request Body:**
```json
{
  "costType": "purchase",
  "amount": 15000.00,
  "currency": "USD",
  "billingCycle": "one_time",
  "vendor": "Dell Technologies",
  "contractNumber": "DELL-2025-001",
  "purchaseOrder": "PO-2025-0123",
  "costCenter": "IT-INFRASTRUCTURE",
  "budgetCode": "CAPEX-2025-Q1",
  "notes": "Server purchase for data center expansion",
  "assetUuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "message": "Cost record created successfully",
  "data": {
    "id": 1,
    "costType": "purchase",
    "amount": "15000.00",
    "vendor": "Dell Technologies",
    "createdAt": "2025-07-16T12:00:00.000Z"
  }
}
```

#### Get Cost Records
```http
GET /costs?page=1&limit=50&costType=purchase&vendor=Dell
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 50, max: 100)
- `sortBy` (string): Sort field (default: createdAt)
- `sortOrder` (string): asc or desc (default: desc)
- `costType` (string): Filter by cost type
- `billingCycle` (string): Filter by billing cycle
- `vendor` (string): Filter by vendor name
- `costCenter` (string): Filter by cost center
- `minAmount` (number): Minimum amount filter
- `maxAmount` (number): Maximum amount filter
- `dateFrom` (date): Start date filter
- `dateTo` (date): End date filter
- `assetUuid` (uuid): Filter by asset UUID

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "costType": "purchase",
      "amount": "15000.00",
      "currency": "USD",
      "vendor": "Dell Technologies",
      "assetHostname": "server-01.example.com",
      "assetIpv4": "192.168.1.10"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

#### Get Specific Cost Record
```http
GET /costs/{id}
```

#### Update Cost Record
```http
PUT /costs/{id}
```

#### Delete Cost Record
```http
DELETE /costs/{id}
```

### 🔄 Asset Lifecycle Management

#### Create Lifecycle Record
```http
POST /lifecycle
```

**Request Body:**
```json
{
  "purchaseDate": "2025-01-15",
  "warrantyEndDate": "2028-01-15",
  "manufacturerEolDate": "2030-01-15",
  "internalEolDate": "2029-06-30",
  "replacementCycleMonths": 48,
  "estimatedReplacementCost": 18000.00,
  "replacementBudgetYear": 2029,
  "replacementBudgetQuarter": 2,
  "replacementNotes": "Consider cloud migration before replacement",
  "assetUuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Get Lifecycle Records
```http
GET /lifecycle?warrantyExpiring=true&eolApproaching=true
```

**Query Parameters:**
- `warrantyExpiring` (boolean): Assets with warranty expiring in 90 days
- `eolApproaching` (boolean): Assets with EOL in 180 days
- `replacementDue` (boolean): Assets due for replacement
- `budgetYear` (integer): Filter by replacement budget year
- `assetUuid` (uuid): Filter by asset UUID

**Response includes calculated fields:**
```json
{
  "data": [
    {
      "id": 1,
      "purchaseDate": "2025-01-15",
      "warrantyEndDate": "2028-01-15",
      "daysUntilWarrantyExpiry": 1095,
      "daysUntilEol": 1460,
      "assetHostname": "server-01.example.com"
    }
  ]
}
```

### 💡 Operational Costs Management

#### Create Operational Cost Record
```http
POST /operational-costs
```

**Request Body:**
```json
{
  "yearMonth": "2025-01-01",
  "powerCost": 245.50,
  "spaceCost": 150.00,
  "networkCost": 89.99,
  "storageCost": 125.00,
  "laborCost": 500.00,
  "otherCosts": 25.00,
  "notes": "January 2025 operational costs",
  "assetUuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Get Operational Costs
```http
GET /operational-costs?yearFrom=2025-01-01&yearTo=2025-12-31
```

**Query Parameters:**
- `yearMonth` (date): Specific month filter
- `yearFrom` (date): Start date range
- `yearTo` (date): End date range
- `assetUuid` (uuid): Filter by asset UUID
- `costType` (string): Filter by cost type (power, space, network, storage, labor, other)

**Response includes calculated total:**
```json
{
  "data": [
    {
      "id": 1,
      "yearMonth": "2025-01-01",
      "powerCost": "245.50",
      "spaceCost": "150.00",
      "totalCost": "1135.49",
      "assetHostname": "server-01.example.com"
    }
  ]
}
```

### 📊 Analytics

#### Get Cost Analytics
```http
GET /analytics/costs/{assetUuid}?startDate=2025-01-01&endDate=2025-12-31
```

**Response:**
```json
{
  "message": "Cost analytics retrieved successfully",
  "data": {
    "costByType": [
      {
        "costType": "purchase",
        "totalAmount": "15000.00",
        "count": "1"
      },
      {
        "costType": "maintenance",
        "totalAmount": "2500.00",
        "count": "3"
      }
    ],
    "operationalTrend": [
      {
        "yearMonth": "2025-01-01",
        "totalCost": "1135.49"
      },
      {
        "yearMonth": "2025-02-01",
        "totalCost": "1089.23"
      }
    ],
    "summary": {
      "totalCosts": 17500.00,
      "totalRecords": 4
    }
  }
}
```

## Data Types and Enums

### Cost Types
- `purchase` - Asset purchase
- `lease` - Leasing costs
- `maintenance` - Maintenance and repairs
- `support` - Support contracts
- `license` - Software licenses
- `subscription` - Subscription services
- `upgrade` - Hardware/software upgrades
- `repair` - Repair costs
- `insurance` - Insurance premiums
- `other` - Other costs

### Billing Cycles
- `one_time` - One-time payment
- `monthly` - Monthly billing
- `quarterly` - Quarterly billing
- `semi_annual` - Semi-annual billing
- `annual` - Annual billing
- `biennial` - Biennial billing

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "message": "\"amount\" must be a positive number",
      "path": ["amount"],
      "type": "number.positive"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Cost record not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Usage Examples

### Track Server Purchase
```bash
curl -X POST http://localhost:3000/api/v1/asset-management/costs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "costType": "purchase",
    "amount": 15000.00,
    "vendor": "Dell Technologies",
    "assetUuid": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Get Assets with Expiring Warranties
```bash
curl "http://localhost:3000/api/v1/asset-management/lifecycle?warrantyExpiring=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Track Monthly Operational Costs
```bash
curl -X POST http://localhost:3000/api/v1/asset-management/operational-costs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "yearMonth": "2025-01-01",
    "powerCost": 245.50,
    "spaceCost": 150.00,
    "assetUuid": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Get Cost Analytics
```bash
curl "http://localhost:3000/api/v1/asset-management/analytics/costs/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Best Practices

1. **Cost Tracking**: Use consistent cost types and billing cycles
2. **Lifecycle Management**: Set internal EOL dates before manufacturer EOL
3. **Operational Costs**: Update monthly for accurate TCO calculations
4. **Analytics**: Use date ranges for meaningful cost analysis
5. **Permissions**: Implement proper RBAC for sensitive financial data
