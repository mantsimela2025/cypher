# Asset Management API Test Suite

This directory contains comprehensive test scripts for all asset management related APIs in the CYPHER application.

## 🧪 Test Scripts Available

### 1. Comprehensive Asset Management API Test
**File:** `comprehensive_asset_management_api_test.js`
**Command:** `npm run test:asset-management-comprehensive`

This is the **main comprehensive test suite** that covers:

#### 🏗️ Asset Management CRUD Operations
- **Cost Management**: Create, read, update, delete cost records
- **Lifecycle Management**: Asset lifecycle tracking and management
- **Operational Costs**: Monthly operational cost tracking
- **Risk Mapping**: Asset risk assessment and mapping

#### 📊 Asset Details Endpoints
- Complete asset details with all related information
- Basic asset details for lightweight queries
- Network details and configuration
- Vulnerabilities summary and security status
- Cost summary and financial overview
- Tags and metadata details

#### 🏷️ Asset Tags Management
- Tag CRUD operations (create, read, update, delete)
- Bulk tag operations for efficiency
- Tag-based asset search and filtering
- Tag statistics and analytics
- Multi-asset tag operations

#### 📈 Asset Analytics
- ROI (Return on Investment) calculations
- Depreciation analysis and tracking
- Financial analysis and projections
- Analytics dashboard data
- Portfolio-wide summary statistics

### 2. Legacy Test Scripts
- `test_asset_management_api.js` - Original asset management tests
- `test_asset_analytics_api.js` - Asset analytics specific tests
- `test_asset_management_schemas.js` - Database schema validation tests

## 🚀 How to Run Tests

### Prerequisites
1. **API Server Running**: Make sure your API server is running on port 3001
   ```bash
   npm run dev
   ```

2. **Database Connection**: Ensure database is accessible and seeded with test data

3. **Authentication**: The test uses these default credentials (from db-seed.js):
   - Email: `admin@rasdash.com`
   - Password: `Admin123!`

   **Note**: If you haven't seeded the database yet, run:
   ```bash
   npm run db:seed users
   ```

### Running the Comprehensive Test Suite

```bash
# From the api directory
npm run test:asset-management-comprehensive

# Or run directly
node scripts/comprehensive_asset_management_api_test.js
```

### Running Individual Test Scripts

```bash
# Original asset management tests
npm run test:asset-management-api

# Asset analytics tests
npm run test:asset-analytics-api

# Schema validation tests
npm run test:asset-management-schemas
```

## 📋 Test Output

The comprehensive test suite provides detailed output including:

- ✅ **Pass/Fail Status** for each endpoint
- 📊 **Response Data Preview** for successful tests
- ❌ **Error Details** for failed tests
- 📈 **Success Rate Calculation**
- 🎯 **Summary Statistics**

### Sample Output
```
🚀 Starting Comprehensive Asset Management API Tests
📅 Test started at: 2025-01-21T10:30:00.000Z

🔐 Authenticating...
✅ Authentication successful

============================================================
🧪 Asset Management CRUD Operations
============================================================

💰 Cost Management Tests
✅ Create Cost Record
   Status: 201, Data: {"success":true,"data":{"id":123,"costType":"purchase"...
✅ Get Cost Records
✅ Get Specific Cost Record
✅ Update Cost Record
✅ Delete Cost Record

🔄 Lifecycle Management Tests
✅ Create Lifecycle Record
✅ Get Lifecycle Records
...

============================================================
🧪 Test Results Summary
============================================================
✅ Passed: 45
❌ Failed: 2
⏭️  Skipped: 0
📊 Total: 47

🎯 Success Rate: 95.7%
```

## 🔧 Customization

### Modifying Test Data
Edit the sample data objects in the test script:
- `sampleCostRecord` - Cost management test data
- `sampleLifecycleRecord` - Lifecycle management test data
- `sampleOperationalCost` - Operational costs test data
- `sampleRiskMapping` - Risk mapping test data
- `sampleAssetTag` - Asset tagging test data

### Adding New Tests
1. Create a new test function following the pattern:
   ```javascript
   async function testNewFeature(authHeaders) {
     logSection('New Feature Tests');
     await testEndpoint('Test Name', 'GET', '/api/endpoint', null, authHeaders.headers);
   }
   ```

2. Add the function call to `runComprehensiveTests()`:
   ```javascript
   await testNewFeature(authHeaders);
   ```

### Changing Authentication
Modify the `authenticate()` function to use different credentials or authentication methods.

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure API server is running on port 3001
   - Check if `npm run dev` is active

2. **Authentication Failed**
   - Verify test credentials exist in database
   - Check if auth endpoints are working

3. **404 Not Found**
   - Verify API routes are properly registered
   - Check if endpoints exist in the current API version

4. **Database Errors**
   - Ensure database is running and accessible
   - Check if required tables exist
   - Verify test data doesn't conflict with existing records

### Debug Mode
Add more detailed logging by modifying the `testEndpoint` function to include request/response details.

## 📚 API Endpoints Tested

### Asset Management (`/api/v1/asset-management`)
- `POST /costs` - Create cost record
- `GET /costs` - List cost records
- `GET /costs/:id` - Get specific cost record
- `PUT /costs/:id` - Update cost record
- `DELETE /costs/:id` - Delete cost record
- `POST /lifecycle` - Create lifecycle record
- `GET /lifecycle` - List lifecycle records
- `GET /lifecycle/:id` - Get specific lifecycle record
- `PUT /lifecycle/:id` - Update lifecycle record
- `DELETE /lifecycle/:id` - Delete lifecycle record
- `POST /operational-costs` - Create operational cost
- `GET /operational-costs` - List operational costs
- `GET /operational-costs/:id` - Get specific operational cost
- `PUT /operational-costs/:id` - Update operational cost
- `DELETE /operational-costs/:id` - Delete operational cost
- `POST /risk-mapping` - Create risk mapping
- `GET /risk-mapping` - List risk mappings
- `GET /risk-mapping/:id` - Get specific risk mapping
- `PUT /risk-mapping/:id` - Update risk mapping
- `DELETE /risk-mapping/:id` - Delete risk mapping
- `GET /assets` - Get assets with details
- `GET /assets/:uuid/complete-detail` - Complete asset details
- `GET /assets/:uuid/basic-detail` - Basic asset details
- `GET /assets/:uuid/network-detail` - Network details
- `GET /assets/:uuid/vulnerabilities-summary` - Vulnerabilities summary
- `GET /assets/:uuid/cost-summary` - Cost summary
- `GET /assets/:uuid/tags-detail` - Tags details

### Asset Tags (`/api/v1/asset-tags`)
- `GET /keys` - Get all tag keys
- `GET /keys/:key/values` - Get values for tag key
- `GET /statistics` - Get tag statistics
- `POST /search` - Search assets by tags
- `POST /multiple` - Get tags for multiple assets
- `GET /:uuid` - Get asset tags
- `POST /:uuid` - Add asset tag
- `POST /:uuid/bulk` - Bulk add tags

### Asset Analytics (`/api/v1/asset-analytics`)
- `GET /roi/:uuid` - Calculate ROI
- `GET /depreciation/:uuid` - Calculate depreciation
- `GET /financial-analysis/:uuid` - Financial analysis
- `GET /dashboard` - Analytics dashboard
- `GET /portfolio-summary` - Portfolio summary

## 🤝 Contributing

When adding new asset management features:
1. Add corresponding test cases to the comprehensive test suite
2. Update this README with new endpoints
3. Ensure tests cover both success and error scenarios
4. Add appropriate test data samples
