# Storage Layer Implementation - Technical Guide

## Overview
This guide provides step-by-step instructions for implementing the Asset Management storage layer with comprehensive CRUD operations, audit logging integration, and advanced filtering capabilities.

---

## ⚙️ **Task CYPHER-AM-002: Asset Storage Layer Implementation**

### **Prerequisites**
- Database schema implemented (from Part 1)
- Existing AuditLogService available
- Drizzle ORM configured
- Validation schemas created

---

## 📋 **Subtask AM-002-1: Core Asset CRUD Operations**

### **Files to Create:**
```
api/src/services/AssetManagementService.js
api/src/utils/assetValidation.js
api/src/utils/assetTransforms.js
api/src/validation/assetSchemas.js
```

### **Step 1: Create Validation Schemas**
```javascript
// api/src/validation/assetSchemas.js
const { z } = require('zod');

// Core Asset Schema
const assetSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  assetTypeId: z.number().int().positive(),
  assetTag: z.string().max(100).optional(),
  serialNumber: z.string().max(255).optional(),
  barcode: z.string().max(255).optional(),
  manufacturer: z.string().max(255).optional(),
  model: z.string().max(255).optional(),
  modelNumber: z.string().max(255).optional(),
  locationId: z.number().int().positive().optional(),
  assignedTo: z.number().int().positive().optional(),
  status: z.enum(['planned', 'ordered', 'received', 'deployed', 'active', 'maintenance', 'retired', 'disposed']).default('planned'),
  condition: z.enum(['excellent', 'good', 'fair', 'poor', 'damaged']).default('good'),
  purchasePrice: z.number().positive().optional(),
  currentValue: z.number().positive().optional(),
  purchaseDate: z.string().datetime().optional(),
  warrantyProvider: z.string().max(255).optional(),
  warrantyStartDate: z.string().datetime().optional(),
  warrantyEndDate: z.string().datetime().optional(),
  warrantyType: z.enum(['manufacturer', 'extended', 'service']).optional(),
  specifications: z.record(z.any()).default({}),
  ipAddress: z.string().ip().optional(),
  macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).optional(),
  hostname: z.string().max(255).optional(),
  deploymentDate: z.string().datetime().optional(),
  retirementDate: z.string().datetime().optional(),
  disposalDate: z.string().datetime().optional(),
  lastMaintenanceDate: z.string().datetime().optional(),
  nextMaintenanceDate: z.string().datetime().optional(),
  maintenanceInterval: z.number().int().positive().optional(),
  complianceStatus: z.string().max(100).optional(),
  securityClassification: z.enum(['public', 'internal', 'confidential', 'restricted']).optional(),
  customFields: z.record(z.any()).default({}),
  tags: z.array(z.string()).default([]),
});

// Create and Update schemas
const createAssetSchema = assetSchema;
const updateAssetSchema = assetSchema.partial();

// Filter schema for queries
const assetFilterSchema = z.object({
  search: z.string().optional(),
  assetTypeIds: z.array(z.number().int().positive()).optional(),
  locationIds: z.array(z.number().int().positive()).optional(),
  statuses: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  assignedTo: z.union([z.number().int().positive(), z.literal('unassigned')]).optional(),
  tags: z.array(z.string()).optional(),
  manufacturerIds: z.array(z.number().int().positive()).optional(),
  warrantyExpiring: z.object({
    days: z.number().int().positive().default(30)
  }).optional(),
  dateRange: z.object({
    field: z.string().default('createdAt'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  }).optional(),
  customFilters: z.record(z.any()).optional()
});

module.exports = {
  assetSchema,
  createAssetSchema,
  updateAssetSchema,
  assetFilterSchema,
};
```

### **Step 2: Create Asset Validation Utilities**
```javascript
// api/src/utils/assetValidation.js
const { db } = require('../db');
const { assets, assetTypes, assetLocations, users } = require('../db/schema');
const { eq, and, ne } = require('drizzle-orm');

class AssetValidator {
  
  /**
   * Validate asset creation data
   */
  async validateAssetCreation(assetData, transaction = db) {
    // Validate asset type exists
    if (assetData.assetTypeId) {
      const [assetType] = await transaction.select()
        .from(assetTypes)
        .where(eq(assetTypes.id, assetData.assetTypeId));
      
      if (!assetType) {
        throw new Error('Invalid asset type');
      }
      
      // Check type-specific requirements
      if (assetType.requiresSerial && !assetData.serialNumber) {
        throw new Error('Serial number is required for this asset type');
      }
      
      if (assetType.requiresLocation && !assetData.locationId) {
        throw new Error('Location is required for this asset type');
      }
      
      if (assetType.requiresWarranty && !assetData.warrantyEndDate) {
        throw new Error('Warranty information is required for this asset type');
      }
    }
    
    // Validate location exists and has capacity
    if (assetData.locationId) {
      const [location] = await transaction.select()
        .from(assetLocations)
        .where(eq(assetLocations.id, assetData.locationId));
      
      if (!location) {
        throw new Error('Invalid location');
      }
      
      if (location.capacity && location.currentCount >= location.capacity) {
        throw new Error('Location is at full capacity');
      }
    }
    
    // Validate assigned user exists
    if (assetData.assignedTo) {
      const [user] = await transaction.select()
        .from(users)
        .where(eq(users.id, assetData.assignedTo));
      
      if (!user) {
        throw new Error('Invalid assigned user');
      }
    }
    
    // Validate unique constraints
    await this.validateUniqueConstraints(assetData, null, transaction);
    
    // Validate business rules
    await this.validateBusinessRules(assetData, transaction);
    
    return true;
  }
  
  /**
   * Validate asset update data
   */
  async validateAssetUpdate(assetId, updateData, currentAsset, transaction = db) {
    // Run creation validation for changed fields
    const mergedData = { ...currentAsset, ...updateData };
    await this.validateAssetCreation(mergedData, transaction);
    
    // Validate unique constraints (excluding current asset)
    await this.validateUniqueConstraints(updateData, assetId, transaction);
    
    // Validate status transitions
    if (updateData.status && updateData.status !== currentAsset.status) {
      await this.validateStatusTransition(currentAsset.status, updateData.status);
    }
    
    return true;
  }
  
  /**
   * Validate asset deletion
   */
  async validateAssetDeletion(assetId, asset, transaction = db) {
    // Check if asset has dependencies
    const { assetDependencies } = require('../db/schema');
    
    const dependencies = await transaction.select()
      .from(assetDependencies)
      .where(eq(assetDependencies.dependsOnAssetId, assetId));
    
    if (dependencies.length > 0) {
      throw new Error('Cannot delete asset that has dependencies');
    }
    
    // Check if asset is assigned
    if (asset.assignedTo) {
      throw new Error('Cannot delete assigned asset. Unassign first.');
    }
    
    // Check if asset is in critical status
    if (['active', 'deployed'].includes(asset.status)) {
      throw new Error('Cannot delete active asset. Change status first.');
    }
    
    return true;
  }
  
  /**
   * Validate unique constraints
   */
  async validateUniqueConstraints(assetData, excludeId = null, transaction = db) {
    // Check asset tag uniqueness
    if (assetData.assetTag) {
      let query = transaction.select()
        .from(assets)
        .where(and(
          eq(assets.assetTag, assetData.assetTag),
          eq(assets.isDeleted, false)
        ));
      
      if (excludeId) {
        query = query.where(ne(assets.id, excludeId));
      }
      
      const [existing] = await query;
      if (existing) {
        throw new Error('Asset tag already exists');
      }
    }
    
    // Check serial number uniqueness (within manufacturer)
    if (assetData.serialNumber && assetData.manufacturer) {
      let query = transaction.select()
        .from(assets)
        .where(and(
          eq(assets.serialNumber, assetData.serialNumber),
          eq(assets.manufacturer, assetData.manufacturer),
          eq(assets.isDeleted, false)
        ));
      
      if (excludeId) {
        query = query.where(ne(assets.id, excludeId));
      }
      
      const [existing] = await query;
      if (existing) {
        throw new Error('Serial number already exists for this manufacturer');
      }
    }
    
    return true;
  }
  
  /**
   * Validate business rules
   */
  async validateBusinessRules(assetData, transaction = db) {
    // Validate date logic
    if (assetData.warrantyStartDate && assetData.warrantyEndDate) {
      const startDate = new Date(assetData.warrantyStartDate);
      const endDate = new Date(assetData.warrantyEndDate);
      
      if (startDate >= endDate) {
        throw new Error('Warranty start date must be before end date');
      }
    }
    
    // Validate lifecycle dates
    const dates = [
      { field: 'purchaseDate', name: 'Purchase' },
      { field: 'deploymentDate', name: 'Deployment' },
      { field: 'retirementDate', name: 'Retirement' },
      { field: 'disposalDate', name: 'Disposal' }
    ];
    
    for (let i = 0; i < dates.length - 1; i++) {
      const current = dates[i];
      const next = dates[i + 1];
      
      if (assetData[current.field] && assetData[next.field]) {
        const currentDate = new Date(assetData[current.field]);
        const nextDate = new Date(assetData[next.field]);
        
        if (currentDate > nextDate) {
          throw new Error(`${current.name} date must be before ${next.name} date`);
        }
      }
    }
    
    // Validate financial data
    if (assetData.purchasePrice && assetData.currentValue) {
      if (assetData.currentValue > assetData.purchasePrice) {
        // Allow appreciation but warn
        console.warn('Current value exceeds purchase price - asset appreciation detected');
      }
    }
    
    // Validate network information
    if (assetData.ipAddress && assetData.macAddress) {
      // Check for IP conflicts (optional business rule)
      const [existing] = await transaction.select()
        .from(assets)
        .where(and(
          eq(assets.ipAddress, assetData.ipAddress),
          eq(assets.isDeleted, false)
        ));
      
      if (existing) {
        console.warn(`IP address ${assetData.ipAddress} is already in use by another asset`);
      }
    }
    
    return true;
  }
  
  /**
   * Validate status transitions
   */
  async validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      'planned': ['ordered', 'received', 'deployed'],
      'ordered': ['received', 'planned'],
      'received': ['deployed', 'ordered'],
      'deployed': ['active', 'maintenance', 'retired'],
      'active': ['maintenance', 'retired', 'deployed'],
      'maintenance': ['active', 'retired'],
      'retired': ['disposed', 'active'],
      'disposed': [] // No transitions from disposed
    };
    
    const allowedTransitions = validTransitions[currentStatus] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
    
    return true;
  }
}

module.exports = { AssetValidator };
```

### **Step 3: Create Asset Transform Utilities**
```javascript
// api/src/utils/assetTransforms.js
class AssetTransforms {
  
  /**
   * Transform data for storage (input sanitization)
   */
  async transformForStorage(data, userId) {
    const transformed = { ...data };
    
    // Sanitize strings
    if (transformed.name) {
      transformed.name = transformed.name.trim();
    }
    
    if (transformed.description) {
      transformed.description = transformed.description.trim();
    }
    
    // Normalize asset tag
    if (transformed.assetTag) {
      transformed.assetTag = transformed.assetTag.toUpperCase().trim();
    }
    
    // Normalize serial number
    if (transformed.serialNumber) {
      transformed.serialNumber = transformed.serialNumber.trim();
    }
    
    // Normalize MAC address
    if (transformed.macAddress) {
      transformed.macAddress = transformed.macAddress
        .replace(/[:-]/g, '')
        .toUpperCase()
        .replace(/(.{2})/g, '$1:')
        .slice(0, -1);
    }
    
    // Normalize hostname
    if (transformed.hostname) {
      transformed.hostname = transformed.hostname.toLowerCase().trim();
    }
    
    // Convert date strings to Date objects
    const dateFields = [
      'purchaseDate', 'warrantyStartDate', 'warrantyEndDate',
      'deploymentDate', 'retirementDate', 'disposalDate',
      'lastMaintenanceDate', 'nextMaintenanceDate'
    ];
    
    dateFields.forEach(field => {
      if (transformed[field]) {
        transformed[field] = new Date(transformed[field]);
      }
    });
    
    // Ensure specifications and customFields are objects
    if (transformed.specifications && typeof transformed.specifications === 'string') {
      try {
        transformed.specifications = JSON.parse(transformed.specifications);
      } catch (e) {
        transformed.specifications = {};
      }
    }
    
    if (transformed.customFields && typeof transformed.customFields === 'string') {
      try {
        transformed.customFields = JSON.parse(transformed.customFields);
      } catch (e) {
        transformed.customFields = {};
      }
    }
    
    // Ensure tags is an array
    if (transformed.tags && !Array.isArray(transformed.tags)) {
      if (typeof transformed.tags === 'string') {
        transformed.tags = transformed.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      } else {
        transformed.tags = [];
      }
    }
    
    return transformed;
  }
  
  /**
   * Transform data for API response
   */
  transformForResponse(asset) {
    if (!asset) return null;
    
    const transformed = { ...asset };
    
    // Format dates for JSON response
    const dateFields = [
      'purchaseDate', 'warrantyStartDate', 'warrantyEndDate',
      'deploymentDate', 'retirementDate', 'disposalDate',
      'lastMaintenanceDate', 'nextMaintenanceDate',
      'createdAt', 'updatedAt', 'deletedAt'
    ];
    
    dateFields.forEach(field => {
      if (transformed[field]) {
        transformed[field] = transformed[field].toISOString();
      }
    });
    
    // Calculate derived fields
    if (transformed.warrantyEndDate) {
      const warrantyEnd = new Date(transformed.warrantyEndDate);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((warrantyEnd - now) / (1000 * 60 * 60 * 24));
      
      transformed.warrantyStatus = {
        daysUntilExpiry,
        isExpired: daysUntilExpiry < 0,
        isExpiringSoon: daysUntilExpiry > 0 && daysUntilExpiry <= 30
      };
    }
    
    // Calculate asset age
    if (transformed.purchaseDate) {
      const purchaseDate = new Date(transformed.purchaseDate);
      const now = new Date();
      const ageInDays = Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24));
      const ageInMonths = Math.floor(ageInDays / 30);
      
      transformed.assetAge = {
        days: ageInDays,
        months: ageInMonths,
        years: Math.floor(ageInMonths / 12)
      };
    }
    
    // Calculate depreciation
    if (transformed.purchasePrice && transformed.purchaseDate) {
      const purchaseDate = new Date(transformed.purchaseDate);
      const now = new Date();
      const ageInYears = (now - purchaseDate) / (1000 * 60 * 60 * 24 * 365);
      
      // Simple straight-line depreciation (can be enhanced with asset type depreciation rates)
      const depreciationRate = 0.2; // 20% per year default
      const depreciatedValue = Math.max(
        transformed.purchasePrice * (1 - (depreciationRate * ageInYears)),
        transformed.purchasePrice * 0.1 // Minimum 10% of original value
      );
      
      transformed.calculatedValue = {
        depreciated: Math.round(depreciatedValue * 100) / 100,
        depreciationRate: depreciationRate,
        ageInYears: Math.round(ageInYears * 100) / 100
      };
    }
    
    return transformed;
  }
  
  /**
   * Transform bulk operation results
   */
  transformBulkResults(results) {
    return {
      ...results,
      createdAssets: results.createdAssets?.map(asset => this.transformForResponse(asset)) || [],
      updatedAssets: results.updatedAssets?.map(asset => this.transformForResponse(asset)) || [],
      errors: results.errors || []
    };
  }
}

module.exports = { AssetTransforms };
```

### **Testing Instructions:**
1. Test validation with valid and invalid asset data
2. Verify unique constraint validation works correctly
3. Test business rule validation (dates, status transitions)
4. Validate data transformation for storage and response
5. Test error handling and error messages
6. Verify integration with existing database schema

---

## 📝 **Next Steps**

1. **Continue to [AssetManagementService Implementation](./02_Storage_Layer_Implementation_Part2.md)** - Build the complete service class
2. **Review [Audit Integration](./02_Storage_Layer_Implementation_Part3.md)** - Integrate with existing AuditLogService
3. **Setup [Advanced Filtering](./02_Storage_Layer_Implementation_Part4.md)** - Implement complex queries and pagination

---

## 🔗 **Related Documents**

- [Database Schema Design](./01_Database_Schema_Design.md)
- [Asset Management Integration Examples](../Asset_Management_Integration_Examples.md)
- [Technical Guide Index](./00_Asset_Management_Technical_Guide_Index.md)
