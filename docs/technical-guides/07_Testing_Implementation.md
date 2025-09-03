# Testing Implementation - Technical Guide

## Overview
This guide provides comprehensive testing strategies and implementation details for the Asset Management system, covering unit tests, integration tests, and end-to-end testing.

---

## 🧪 **Task CYPHER-AM-007: Comprehensive Testing Suite**

### **Prerequisites**
- Jest testing framework configured
- React Testing Library setup
- Supertest for API testing
- Test database configured
- Mock data generators available

---

## 📋 **Testing Strategy Overview**

### **Testing Pyramid:**
```
    /\
   /  \     E2E Tests (10%)
  /____\    - Critical user journeys
 /      \   - Cross-browser testing
/________\  Integration Tests (20%)
           - API endpoint testing
           - Database integration
           Unit Tests (70%)
           - Component testing
           - Service layer testing
           - Utility function testing
```

### **Coverage Targets:**
- **Backend Unit Tests:** 90%+ coverage
- **Frontend Unit Tests:** 80%+ coverage
- **Integration Tests:** 85%+ coverage
- **E2E Tests:** Critical paths covered

---

## 🔧 **Backend Unit Testing**

### **Files to Create:**
```
api/src/__tests__/services/AssetManagementService.test.js
api/src/__tests__/utils/assetValidation.test.js
api/src/__tests__/controllers/assetController.test.js
api/src/__tests__/helpers/testHelpers.js
api/src/__tests__/fixtures/assetFixtures.js
```

### **Step 1: Create Test Helpers and Fixtures**
```javascript
// api/src/__tests__/helpers/testHelpers.js
const { db } = require('../../db');
const { users, assetCategories, assetTypes, assetLocations, assets } = require('../../db/schema');

class TestHelpers {
  
  /**
   * Setup test database with clean state
   */
  static async setupTestDb() {
    // Clear all test data
    await db.delete(assets);
    await db.delete(assetLocations);
    await db.delete(assetTypes);
    await db.delete(assetCategories);
    
    // Create test user
    const [testUser] = await db.insert(users).values({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      role: 'admin'
    }).returning();
    
    return { testUser };
  }
  
  /**
   * Create test asset category
   */
  static async createTestCategory(overrides = {}) {
    const [category] = await db.insert(assetCategories).values({
      name: 'Test Hardware',
      code: 'TEST_HW',
      description: 'Test hardware category',
      ...overrides
    }).returning();
    
    return category;
  }
  
  /**
   * Create test asset type
   */
  static async createTestAssetType(categoryId, overrides = {}) {
    const [assetType] = await db.insert(assetTypes).values({
      categoryId,
      name: 'Test Server',
      code: 'TEST_SRV',
      description: 'Test server type',
      requiresSerial: true,
      requiresLocation: true,
      ...overrides
    }).returning();
    
    return assetType;
  }
  
  /**
   * Create test location
   */
  static async createTestLocation(overrides = {}) {
    const [location] = await db.insert(assetLocations).values({
      name: 'Test Data Center',
      code: 'TEST_DC',
      type: 'building',
      capacity: 100,
      ...overrides
    }).returning();
    
    return location;
  }
  
  /**
   * Create test asset
   */
  static async createTestAsset(assetTypeId, userId, overrides = {}) {
    const [asset] = await db.insert(assets).values({
      name: 'Test Asset',
      assetTypeId,
      assetTag: 'TEST-001',
      serialNumber: 'SN123456',
      manufacturer: 'Test Manufacturer',
      model: 'Test Model',
      status: 'active',
      condition: 'good',
      createdBy: userId,
      updatedBy: userId,
      ...overrides
    }).returning();
    
    return asset;
  }
  
  /**
   * Clean up test data
   */
  static async cleanupTestDb() {
    await db.delete(assets);
    await db.delete(assetLocations);
    await db.delete(assetTypes);
    await db.delete(assetCategories);
  }
}

module.exports = { TestHelpers };
```

### **Step 2: Create Asset Fixtures**
```javascript
// api/src/__tests__/fixtures/assetFixtures.js
class AssetFixtures {
  
  static validAssetData = {
    name: 'Web Server 01',
    description: 'Primary web application server',
    assetTag: 'SRV-WEB-001',
    serialNumber: 'DL380-12345',
    manufacturer: 'HPE',
    model: 'ProLiant DL380 Gen10',
    status: 'active',
    condition: 'excellent',
    purchasePrice: 5000.00,
    currentValue: 3500.00,
    purchaseDate: '2023-01-15T00:00:00.000Z',
    warrantyProvider: 'HPE',
    warrantyStartDate: '2023-01-15T00:00:00.000Z',
    warrantyEndDate: '2026-01-15T00:00:00.000Z',
    warrantyType: 'manufacturer',
    specifications: {
      cpu: 'Intel Xeon Silver 4214R',
      ram: '64GB DDR4',
      storage: '2x 1TB SSD RAID1',
      network: '4x 1GbE'
    },
    ipAddress: '192.168.1.10',
    hostname: 'web-srv-01',
    tags: ['production', 'web', 'critical']
  };
  
  static invalidAssetData = {
    name: '', // Invalid: empty name
    assetTag: 'INVALID TAG WITH SPACES', // Invalid: spaces in tag
    serialNumber: null,
    status: 'invalid_status', // Invalid: not in enum
    condition: 'invalid_condition', // Invalid: not in enum
    purchasePrice: -100, // Invalid: negative price
    ipAddress: '999.999.999.999', // Invalid: bad IP format
    macAddress: 'invalid-mac', // Invalid: bad MAC format
    warrantyStartDate: '2023-01-15T00:00:00.000Z',
    warrantyEndDate: '2022-01-15T00:00:00.000Z' // Invalid: end before start
  };
  
  static bulkAssetData = [
    {
      name: 'Server 01',
      assetTag: 'SRV-001',
      serialNumber: 'SN001',
      manufacturer: 'Dell',
      model: 'PowerEdge R740'
    },
    {
      name: 'Server 02',
      assetTag: 'SRV-002',
      serialNumber: 'SN002',
      manufacturer: 'Dell',
      model: 'PowerEdge R740'
    },
    {
      name: 'Server 03',
      assetTag: 'SRV-003',
      serialNumber: 'SN003',
      manufacturer: 'Dell',
      model: 'PowerEdge R740'
    }
  ];
  
  static updateAssetData = {
    name: 'Updated Asset Name',
    description: 'Updated description',
    status: 'maintenance',
    condition: 'good',
    currentValue: 3000.00
  };
  
  static filterTestData = {
    search: 'web server',
    assetTypeIds: [1, 2],
    locationIds: [1],
    statuses: ['active', 'deployed'],
    conditions: ['excellent', 'good'],
    tags: ['production', 'critical'],
    warrantyExpiring: { days: 30 },
    dateRange: {
      field: 'purchaseDate',
      startDate: '2023-01-01T00:00:00.000Z',
      endDate: '2023-12-31T23:59:59.999Z'
    }
  };
}

module.exports = { AssetFixtures };
```

### **Step 3: Create AssetManagementService Tests**
```javascript
// api/src/__tests__/services/AssetManagementService.test.js
const { AssetManagementService } = require('../../services/AssetManagementService');
const { TestHelpers } = require('../helpers/testHelpers');
const { AssetFixtures } = require('../fixtures/assetFixtures');
const { auditLogService } = require('../../services/auditLogService');

// Mock audit log service
jest.mock('../../services/auditLogService', () => ({
  auditLogService: {
    logUserAction: jest.fn().mockResolvedValue(true)
  }
}));

describe('AssetManagementService', () => {
  let testUser, testCategory, testAssetType, testLocation;
  
  beforeAll(async () => {
    const setup = await TestHelpers.setupTestDb();
    testUser = setup.testUser;
    
    testCategory = await TestHelpers.createTestCategory();
    testAssetType = await TestHelpers.createTestAssetType(testCategory.id);
    testLocation = await TestHelpers.createTestLocation();
  });
  
  afterAll(async () => {
    await TestHelpers.cleanupTestDb();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAsset', () => {
    it('should create asset with valid data', async () => {
      const assetData = {
        ...AssetFixtures.validAssetData,
        assetTypeId: testAssetType.id,
        locationId: testLocation.id
      };
      
      const result = await AssetManagementService.createAsset(
        assetData, 
        testUser.id
      );
      
      expect(result).toBeDefined();
      expect(result.name).toBe(assetData.name);
      expect(result.assetTag).toBe(assetData.assetTag);
      expect(result.createdBy).toBe(testUser.id);
      
      // Verify audit logging was called
      expect(auditLogService.logUserAction).toHaveBeenCalledWith(
        testUser.id,
        'asset_created',
        'asset',
        result.id,
        expect.stringContaining('Created asset'),
        expect.any(Object),
        undefined
      );
    });
    
    it('should throw validation error for invalid data', async () => {
      const invalidData = {
        ...AssetFixtures.invalidAssetData,
        assetTypeId: testAssetType.id
      };
      
      await expect(
        AssetManagementService.createAsset(invalidData, testUser.id)
      ).rejects.toThrow();
      
      // Verify audit logging for failed attempt
      expect(auditLogService.logUserAction).toHaveBeenCalledWith(
        testUser.id,
        'asset_creation_failed',
        'asset',
        null,
        expect.stringContaining('Failed to create asset'),
        expect.any(Object),
        undefined
      );
    });
    
    it('should enforce unique asset tag constraint', async () => {
      const assetData = {
        ...AssetFixtures.validAssetData,
        assetTypeId: testAssetType.id,
        assetTag: 'UNIQUE-TAG-001'
      };
      
      // Create first asset
      await AssetManagementService.createAsset(assetData, testUser.id);
      
      // Try to create second asset with same tag
      await expect(
        AssetManagementService.createAsset(assetData, testUser.id)
      ).rejects.toThrow('Asset tag already exists');
    });
  });

  describe('updateAsset', () => {
    let testAsset;
    
    beforeEach(async () => {
      testAsset = await TestHelpers.createTestAsset(
        testAssetType.id, 
        testUser.id,
        { locationId: testLocation.id }
      );
    });
    
    it('should update asset with valid data', async () => {
      const updates = AssetFixtures.updateAssetData;
      
      const result = await AssetManagementService.updateAsset(
        testAsset.id,
        updates,
        testUser.id
      );
      
      expect(result.name).toBe(updates.name);
      expect(result.status).toBe(updates.status);
      expect(result.updatedBy).toBe(testUser.id);
      
      // Verify audit logging
      expect(auditLogService.logUserAction).toHaveBeenCalledWith(
        testUser.id,
        'asset_updated',
        'asset',
        testAsset.id,
        expect.stringContaining('Updated asset'),
        expect.objectContaining({
          oldValues: expect.any(Object),
          newValues: expect.any(Object),
          changes: expect.any(Object)
        }),
        undefined
      );
    });
    
    it('should throw error for non-existent asset', async () => {
      await expect(
        AssetManagementService.updateAsset(
          99999,
          AssetFixtures.updateAssetData,
          testUser.id
        )
      ).rejects.toThrow('Asset not found');
    });
  });

  describe('deleteAsset', () => {
    let testAsset;
    
    beforeEach(async () => {
      testAsset = await TestHelpers.createTestAsset(
        testAssetType.id, 
        testUser.id
      );
    });
    
    it('should soft delete asset by default', async () => {
      const result = await AssetManagementService.deleteAsset(
        testAsset.id,
        testUser.id
      );
      
      expect(result).toBeDefined();
      
      // Verify asset is soft deleted
      const deletedAsset = await AssetManagementService.getAssetById(testAsset.id);
      expect(deletedAsset).toBeNull();
      
      // Verify audit logging
      expect(auditLogService.logUserAction).toHaveBeenCalledWith(
        testUser.id,
        'asset_deleted',
        'asset',
        testAsset.id,
        expect.stringContaining('Deleted asset'),
        expect.any(Object),
        undefined
      );
    });
  });

  describe('getAssets', () => {
    beforeEach(async () => {
      // Create multiple test assets
      for (let i = 0; i < 5; i++) {
        await TestHelpers.createTestAsset(
          testAssetType.id,
          testUser.id,
          {
            name: `Test Asset ${i + 1}`,
            assetTag: `TEST-${String(i + 1).padStart(3, '0')}`,
            status: i % 2 === 0 ? 'active' : 'maintenance'
          }
        );
      }
    });
    
    it('should return paginated assets', async () => {
      const result = await AssetManagementService.getAssets(
        {},
        { page: 1, limit: 3 }
      );
      
      expect(result.data).toHaveLength(3);
      expect(result.pagination.totalCount).toBeGreaterThanOrEqual(5);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(3);
    });
    
    it('should filter assets by status', async () => {
      const result = await AssetManagementService.getAssets(
        { statuses: ['active'] }
      );
      
      result.data.forEach(asset => {
        expect(asset.status).toBe('active');
      });
    });
    
    it('should search assets by name', async () => {
      const result = await AssetManagementService.getAssets(
        { search: 'Test Asset 1' }
      );
      
      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach(asset => {
        expect(asset.name.toLowerCase()).toContain('test asset 1');
      });
    });
  });

  describe('bulkUpdateAssets', () => {
    let testAssets;
    
    beforeEach(async () => {
      testAssets = [];
      for (let i = 0; i < 3; i++) {
        const asset = await TestHelpers.createTestAsset(
          testAssetType.id,
          testUser.id,
          { name: `Bulk Test Asset ${i + 1}` }
        );
        testAssets.push(asset);
      }
    });
    
    it('should update multiple assets', async () => {
      const assetIds = testAssets.map(asset => asset.id);
      const updates = { status: 'maintenance', condition: 'fair' };
      
      const result = await AssetManagementService.bulkUpdateAssets(
        assetIds,
        updates,
        testUser.id
      );
      
      expect(result.updatedAssets).toHaveLength(3);
      expect(result.batchId).toBeDefined();
      
      result.updatedAssets.forEach(asset => {
        expect(asset.status).toBe('maintenance');
        expect(asset.condition).toBe('fair');
      });
      
      // Verify audit logging
      expect(auditLogService.logUserAction).toHaveBeenCalledWith(
        testUser.id,
        'asset_bulk_updated',
        'asset',
        null,
        expect.stringContaining('Bulk updated'),
        expect.objectContaining({
          batchId: expect.any(String),
          assetIds: assetIds,
          updates: updates
        }),
        undefined
      );
    });
  });

  describe('getAssetStats', () => {
    beforeEach(async () => {
      // Create assets with different statuses
      await TestHelpers.createTestAsset(testAssetType.id, testUser.id, { 
        status: 'active', 
        currentValue: 1000 
      });
      await TestHelpers.createTestAsset(testAssetType.id, testUser.id, { 
        status: 'maintenance', 
        currentValue: 2000 
      });
      await TestHelpers.createTestAsset(testAssetType.id, testUser.id, { 
        status: 'active', 
        currentValue: 1500 
      });
    });
    
    it('should return asset statistics', async () => {
      const stats = await AssetManagementService.getAssetStats();
      
      expect(stats.totalAssets).toBeGreaterThanOrEqual(3);
      expect(stats.totalValue).toBeGreaterThanOrEqual(4500);
      expect(stats.statusBreakdown).toBeDefined();
      expect(stats.conditionBreakdown).toBeDefined();
    });
  });
});
```

### **Testing Instructions:**
1. Run backend tests: `npm test -- --testPathPattern=services`
2. Check coverage: `npm run test:coverage`
3. Run specific test suites: `npm test AssetManagementService`
4. Verify all tests pass with proper mocking
5. Check that audit logging integration works correctly

---

## 📝 **Next Steps**

1. **Continue to [Frontend Testing](./07_Testing_Implementation_Part2.md)** - React component testing
2. **Review [Integration Testing](./07_Testing_Implementation_Part3.md)** - API and database integration tests
3. **Setup [E2E Testing](./07_Testing_Implementation_Part4.md)** - End-to-end user journey tests

---

## 🔗 **Related Documents**

- [Storage Layer Implementation](./02_Storage_Layer_Implementation.md)
- [Frontend Foundation](./05_Frontend_Foundation.md)
- [Technical Guide Index](./00_Asset_Management_Technical_Guide_Index.md)
