const db = require('../db/connection');
const { assetCostManagement } = require('../db/schema/assetManagement');
const { eq, and } = require('drizzle-orm');

class AssetCostManagementService {
  // Get all cost records for an asset
  async getCostsByAssetUuid(assetUuid) {
    try {
      const costs = await db
        .select()
        .from(assetCostManagement)
        .where(eq(assetCostManagement.assetUuid, assetUuid))
        .orderBy(assetCostManagement.createdAt);

      return {
        success: true,
        data: costs,
        message: 'Cost records retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching cost records:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch cost records'
      };
    }
  }

  // Get a specific cost record by ID
  async getCostById(id) {
    try {
      const cost = await db
        .select()
        .from(assetCostManagement)
        .where(eq(assetCostManagement.id, id))
        .limit(1);

      if (cost.length === 0) {
        return {
          success: false,
          message: 'Cost record not found'
        };
      }

      return {
        success: true,
        data: cost[0],
        message: 'Cost record retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching cost record:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch cost record'
      };
    }
  }

  // Create a new cost record
  async createCost(costData) {
    try {
      const newCost = await db
        .insert(assetCostManagement)
        .values({
          ...costData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return {
        success: true,
        data: newCost[0],
        message: 'Cost record created successfully'
      };
    } catch (error) {
      console.error('Error creating cost record:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create cost record'
      };
    }
  }

  // Update an existing cost record
  async updateCost(id, costData) {
    try {
      const updatedCost = await db
        .update(assetCostManagement)
        .set({
          ...costData,
          updatedAt: new Date()
        })
        .where(eq(assetCostManagement.id, id))
        .returning();

      if (updatedCost.length === 0) {
        return {
          success: false,
          message: 'Cost record not found'
        };
      }

      return {
        success: true,
        data: updatedCost[0],
        message: 'Cost record updated successfully'
      };
    } catch (error) {
      console.error('Error updating cost record:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update cost record'
      };
    }
  }

  // Delete a cost record
  async deleteCost(id) {
    try {
      const deletedCost = await db
        .delete(assetCostManagement)
        .where(eq(assetCostManagement.id, id))
        .returning();

      if (deletedCost.length === 0) {
        return {
          success: false,
          message: 'Cost record not found'
        };
      }

      return {
        success: true,
        data: deletedCost[0],
        message: 'Cost record deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting cost record:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete cost record'
      };
    }
  }

  // Get cost summary for an asset
  async getCostSummary(assetUuid) {
    try {
      const costs = await db
        .select()
        .from(assetCostManagement)
        .where(eq(assetCostManagement.assetUuid, assetUuid));

      const summary = {
        totalCosts: 0,
        costsByType: {},
        costsByBillingCycle: {},
        recordCount: costs.length
      };

      costs.forEach(cost => {
        const amount = parseFloat(cost.amount) || 0;
        summary.totalCosts += amount;

        // Group by cost type
        if (!summary.costsByType[cost.costType]) {
          summary.costsByType[cost.costType] = 0;
        }
        summary.costsByType[cost.costType] += amount;

        // Group by billing cycle
        if (!summary.costsByBillingCycle[cost.billingCycle]) {
          summary.costsByBillingCycle[cost.billingCycle] = 0;
        }
        summary.costsByBillingCycle[cost.billingCycle] += amount;
      });

      return {
        success: true,
        data: summary,
        message: 'Cost summary retrieved successfully'
      };
    } catch (error) {
      console.error('Error generating cost summary:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate cost summary'
      };
    }
  }

  // Get all costs with optional filters
  async getAllCosts(filters = {}) {
    try {
      let query = db.select().from(assetCostManagement);

      // Apply filters
      const conditions = [];
      
      if (filters.assetUuid) {
        conditions.push(eq(assetCostManagement.assetUuid, filters.assetUuid));
      }
      
      if (filters.costType) {
        conditions.push(eq(assetCostManagement.costType, filters.costType));
      }
      
      if (filters.billingCycle) {
        conditions.push(eq(assetCostManagement.billingCycle, filters.billingCycle));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const costs = await query.orderBy(assetCostManagement.createdAt);

      return {
        success: true,
        data: costs,
        message: 'Cost records retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching all cost records:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch cost records'
      };
    }
  }

  // Validate cost data
  validateCostData(costData) {
    const errors = [];

    if (!costData.assetUuid) {
      errors.push('Asset UUID is required');
    }

    if (!costData.costType) {
      errors.push('Cost type is required');
    }

    if (!costData.amount || isNaN(parseFloat(costData.amount))) {
      errors.push('Valid amount is required');
    }

    if (parseFloat(costData.amount) < 0) {
      errors.push('Amount cannot be negative');
    }

    if (!costData.currency) {
      errors.push('Currency is required');
    }

    if (!costData.billingCycle) {
      errors.push('Billing cycle is required');
    }

    // Validate enum values
    const validCostTypes = ['acquisition', 'operational', 'maintenance', 'licensing', 'support', 'training', 'disposal'];
    if (costData.costType && !validCostTypes.includes(costData.costType)) {
      errors.push('Invalid cost type');
    }

    const validBillingCycles = ['one_time', 'monthly', 'quarterly', 'annual', 'custom'];
    if (costData.billingCycle && !validBillingCycles.includes(costData.billingCycle)) {
      errors.push('Invalid billing cycle');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new AssetCostManagementService();
