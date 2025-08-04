const assetManagementService = require('../services/assetManagementService');
const { 
  assetCostManagementSchema, 
  assetLifecycleSchema, 
  assetOperationalCostsSchema, 
  assetRiskMappingSchema,
  querySchema 
} = require('../validation/assetManagement');

class AssetManagementController {

  // ==================== ASSET COST MANAGEMENT ====================

  async createCostRecord(req, res) {
    try {
      const { error, value } = assetCostManagementSchema.create.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.details 
        });
      }

      const result = await assetManagementService.createCostRecord(value, req.user.id);
      
      res.status(201).json({
        message: 'Cost record created successfully',
        data: result
      });
    } catch (error) {
      console.error('Error creating cost record:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCostRecords(req, res) {
    try {
      console.log('🎯 getCostRecords called');
      console.log('🔍 Query params:', req.query);
      console.log('👤 User:', req.user);

      // Validate query parameters
      const { error: paginationError, value: pagination } = querySchema.pagination.validate({
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      });

      const { error: filtersError, value: filters } = querySchema.assetCostFilters.validate({
        costType: req.query.costType,
        billingCycle: req.query.billingCycle,
        vendor: req.query.vendor,
        costCenter: req.query.costCenter,
        minAmount: req.query.minAmount,
        maxAmount: req.query.maxAmount,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        assetUuid: req.query.assetUuid
      });

      if (paginationError || filtersError) {
        console.log('❌ Validation error:', { paginationError, filtersError });
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: paginationError?.details || filtersError?.details
        });
      }

      console.log('✅ Validation passed, calling service...');
      const result = await assetManagementService.getCostRecords(filters, pagination);
      console.log('📊 Service result:', result);

      res.json(result);
    } catch (error) {
      console.error('❌ Error fetching cost records:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getCostRecordById(req, res) {
    try {
      const { id } = req.params;
      const result = await assetManagementService.getCostRecordById(parseInt(id));
      
      if (!result) {
        return res.status(404).json({ error: 'Cost record not found' });
      }
      
      res.json({ data: result });
    } catch (error) {
      console.error('Error fetching cost record:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateCostRecord(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = assetCostManagementSchema.update.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.details 
        });
      }

      const result = await assetManagementService.updateCostRecord(parseInt(id), value, req.user.id);
      
      if (!result) {
        return res.status(404).json({ error: 'Cost record not found' });
      }
      
      res.json({
        message: 'Cost record updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating cost record:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteCostRecord(req, res) {
    try {
      const { id } = req.params;
      const result = await assetManagementService.deleteCostRecord(parseInt(id));
      
      if (!result) {
        return res.status(404).json({ error: 'Cost record not found' });
      }
      
      res.json({ message: 'Cost record deleted successfully' });
    } catch (error) {
      console.error('Error deleting cost record:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== ASSET LIFECYCLE ====================

  async createLifecycleRecord(req, res) {
    try {
      const { error, value } = assetLifecycleSchema.create.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.details 
        });
      }

      const result = await assetManagementService.createLifecycleRecord(value);
      
      res.status(201).json({
        message: 'Lifecycle record created successfully',
        data: result
      });
    } catch (error) {
      console.error('Error creating lifecycle record:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getLifecycleRecords(req, res) {
    try {
      // Validate query parameters
      const { error: paginationError, value: pagination } = querySchema.pagination.validate({
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      });

      const { error: filtersError, value: filters } = querySchema.lifecycleFilters.validate({
        warrantyExpiring: req.query.warrantyExpiring,
        eolApproaching: req.query.eolApproaching,
        replacementDue: req.query.replacementDue,
        budgetYear: req.query.budgetYear,
        assetUuid: req.query.assetUuid
      });

      if (paginationError || filtersError) {
        return res.status(400).json({ 
          error: 'Invalid query parameters',
          details: paginationError?.details || filtersError?.details
        });
      }

      const result = await assetManagementService.getLifecycleRecords(filters, pagination);
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching lifecycle records:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getLifecycleRecordById(req, res) {
    try {
      const { id } = req.params;
      const result = await assetManagementService.getLifecycleRecordById(parseInt(id));
      
      if (!result) {
        return res.status(404).json({ error: 'Lifecycle record not found' });
      }
      
      res.json({ data: result });
    } catch (error) {
      console.error('Error fetching lifecycle record:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateLifecycleRecord(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = assetLifecycleSchema.update.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.details 
        });
      }

      const result = await assetManagementService.updateLifecycleRecord(parseInt(id), value);
      
      if (!result) {
        return res.status(404).json({ error: 'Lifecycle record not found' });
      }
      
      res.json({
        message: 'Lifecycle record updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating lifecycle record:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteLifecycleRecord(req, res) {
    try {
      const { id } = req.params;
      const result = await assetManagementService.deleteLifecycleRecord(parseInt(id));
      
      if (!result) {
        return res.status(404).json({ error: 'Lifecycle record not found' });
      }
      
      res.json({ message: 'Lifecycle record deleted successfully' });
    } catch (error) {
      console.error('Error deleting lifecycle record:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== OPERATIONAL COSTS ====================

  async createOperationalCost(req, res) {
    try {
      const { error, value } = assetOperationalCostsSchema.create.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.details 
        });
      }

      const result = await assetManagementService.createOperationalCost(value);
      
      res.status(201).json({
        message: 'Operational cost record created successfully',
        data: result
      });
    } catch (error) {
      console.error('Error creating operational cost record:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getOperationalCosts(req, res) {
    try {
      // Validate query parameters
      const { error: paginationError, value: pagination } = querySchema.pagination.validate({
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      });

      const { error: filtersError, value: filters } = querySchema.operationalCostFilters.validate({
        yearMonth: req.query.yearMonth,
        yearFrom: req.query.yearFrom,
        yearTo: req.query.yearTo,
        assetUuid: req.query.assetUuid,
        costType: req.query.costType
      });

      if (paginationError || filtersError) {
        return res.status(400).json({ 
          error: 'Invalid query parameters',
          details: paginationError?.details || filtersError?.details
        });
      }

      const result = await assetManagementService.getOperationalCosts(filters, pagination);
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching operational costs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getOperationalCostById(req, res) {
    try {
      const { id } = req.params;
      const result = await assetManagementService.getOperationalCostById(parseInt(id));
      
      if (!result) {
        return res.status(404).json({ error: 'Operational cost record not found' });
      }
      
      res.json({ data: result });
    } catch (error) {
      console.error('Error fetching operational cost record:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateOperationalCost(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = assetOperationalCostsSchema.update.validate(req.body);
      
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.details 
        });
      }

      const result = await assetManagementService.updateOperationalCost(parseInt(id), value);
      
      if (!result) {
        return res.status(404).json({ error: 'Operational cost record not found' });
      }
      
      res.json({
        message: 'Operational cost record updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating operational cost record:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteOperationalCost(req, res) {
    try {
      const { id } = req.params;
      const result = await assetManagementService.deleteOperationalCost(parseInt(id));
      
      if (!result) {
        return res.status(404).json({ error: 'Operational cost record not found' });
      }
      
      res.json({ message: 'Operational cost record deleted successfully' });
    } catch (error) {
      console.error('Error deleting operational cost record:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== ANALYTICS ====================

  async getCostAnalytics(req, res) {
    try {
      const { assetUuid } = req.params;
      const { startDate, endDate } = req.query;
      
      const dateRange = {};
      if (startDate) dateRange.startDate = new Date(startDate);
      if (endDate) dateRange.endDate = new Date(endDate);
      
      const result = await assetManagementService.getCostAnalytics(assetUuid, dateRange);
      
      res.json({
        message: 'Cost analytics retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error fetching cost analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new AssetManagementController();
