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

  // ==================== RISK MAPPING ====================

  async createRiskMapping(req, res) {
    try {
      const { error, value } = assetRiskMappingSchema.create.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details
        });
      }

      const result = await assetManagementService.createRiskMapping(value, req.user.id);

      res.status(201).json({
        message: 'Risk mapping record created successfully',
        data: result
      });
    } catch (error) {
      console.error('Error creating risk mapping record:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getRiskMappings(req, res) {
    try {
      // Validate query parameters
      const { error: paginationError, value: pagination } = querySchema.pagination.validate({
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      });

      const { error: filtersError, value: filters } = querySchema.riskMappingFilters.validate({
        mappingMethod: req.query.mappingMethod,
        verified: req.query.verified,
        minConfidence: req.query.minConfidence,
        maxConfidence: req.query.maxConfidence,
        riskModelId: req.query.riskModelId,
        costCenterId: req.query.costCenterId,
        assetUuid: req.query.assetUuid
      });

      if (paginationError) {
        return res.status(400).json({
          error: 'Invalid pagination parameters',
          details: paginationError.details
        });
      }

      if (filtersError) {
        return res.status(400).json({
          error: 'Invalid filter parameters',
          details: filtersError.details
        });
      }

      const result = await assetManagementService.getRiskMappings(filters, pagination);

      res.json({
        message: 'Risk mapping records retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching risk mapping records:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getRiskMappingById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'Valid risk mapping ID is required' });
      }

      const result = await assetManagementService.getRiskMappingById(parseInt(id));

      if (!result) {
        return res.status(404).json({ error: 'Risk mapping record not found' });
      }

      res.json({
        message: 'Risk mapping record retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error fetching risk mapping record:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateRiskMapping(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'Valid risk mapping ID is required' });
      }

      const { error, value } = assetRiskMappingSchema.update.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details
        });
      }

      const result = await assetManagementService.updateRiskMapping(parseInt(id), value, req.user.id);

      if (!result) {
        return res.status(404).json({ error: 'Risk mapping record not found' });
      }

      res.json({
        message: 'Risk mapping record updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating risk mapping record:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteRiskMapping(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'Valid risk mapping ID is required' });
      }

      const result = await assetManagementService.deleteRiskMapping(parseInt(id));

      if (!result) {
        return res.status(404).json({ error: 'Risk mapping record not found' });
      }

      res.json({ message: 'Risk mapping record deleted successfully' });
    } catch (error) {
      console.error('Error deleting risk mapping record:', error);
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

  // ==================== ASSET DETAIL VIEWS ====================

  /**
   * Get comprehensive asset details with all related information
   */
  async getAssetCompleteDetail(req, res) {
    try {
      const { assetUuid } = req.params;
      
      if (!assetUuid) {
        return res.status(400).json({ error: 'Asset UUID is required' });
      }

      const result = await assetManagementService.getAssetCompleteDetail(assetUuid);
      
      if (!result) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      
      res.json({
        message: 'Asset complete details retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error fetching asset complete details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get basic asset details
   */
  async getAssetBasicDetail(req, res) {
    try {
      const { assetUuid } = req.params;
      
      if (!assetUuid) {
        return res.status(400).json({ error: 'Asset UUID is required' });
      }

      const result = await assetManagementService.getAssetBasicDetail(assetUuid);
      
      if (!result) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      
      res.json({
        message: 'Asset basic details retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error fetching asset basic details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get asset network details
   */
  async getAssetNetworkDetail(req, res) {
    try {
      const { assetUuid } = req.params;
      
      if (!assetUuid) {
        return res.status(400).json({ error: 'Asset UUID is required' });
      }

      const result = await assetManagementService.getAssetNetworkDetail(assetUuid);
      
      if (!result) {
        return res.status(404).json({ error: 'Asset network details not found' });
      }
      
      res.json({
        message: 'Asset network details retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error fetching asset network details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get asset vulnerabilities summary
   */
  async getAssetVulnerabilitiesSummary(req, res) {
    try {
      const { assetUuid } = req.params;
      
      if (!assetUuid) {
        return res.status(400).json({ error: 'Asset UUID is required' });
      }

      const result = await assetManagementService.getAssetVulnerabilitiesSummary(assetUuid);
      
      if (!result) {
        return res.status(404).json({
          error: 'Asset vulnerabilities summary not found',
          data: {
            asset_uuid: assetUuid,
            total_vulnerabilities: 0,
            critical_vulnerabilities: 0,
            high_vulnerabilities: 0,
            medium_vulnerabilities: 0,
            low_vulnerabilities: 0,
            informational_vulnerabilities: 0,
            confirmed_vulnerabilities: 0,
            false_positive_vulnerabilities: 0
          }
        });
      }
      
      res.json({
        message: 'Asset vulnerabilities summary retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error fetching asset vulnerabilities summary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get asset cost summary
   */
  async getAssetCostSummary(req, res) {
    try {
      const { assetUuid } = req.params;
      
      if (!assetUuid) {
        return res.status(400).json({ error: 'Asset UUID is required' });
      }

      const result = await assetManagementService.getAssetCostSummary(assetUuid);
      
      if (!result) {
        return res.status(404).json({
          error: 'Asset cost summary not found',
          data: {
            asset_uuid: assetUuid,
            total_acquisition_cost: 0,
            total_operational_cost: 0,
            total_maintenance_cost: 0,
            total_licensing_cost: 0,
            total_support_cost: 0,
            total_training_cost: 0,
            total_disposal_cost: 0,
            overall_total_cost: 0
          }
        });
      }
      
      res.json({
        message: 'Asset cost summary retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error fetching asset cost summary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get asset tags details
   */
  async getAssetTagsDetail(req, res) {
    try {
      const { assetUuid } = req.params;
      
      if (!assetUuid) {
        return res.status(400).json({ error: 'Asset UUID is required' });
      }

      const results = await assetManagementService.getAssetTagsDetail(assetUuid);
      
      res.json({
        message: 'Asset tags retrieved successfully',
        data: results || [],
        count: results ? results.length : 0
      });
    } catch (error) {
      console.error('Error fetching asset tags:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get paginated list of assets with basic details
   */
  async getAssetsWithDetails(req, res) {
    try {
      // Validate query parameters
      const { error: paginationError, value: pagination } = querySchema.pagination.validate({
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      });

      // Build filters from query parameters
      const filters = {
        hostname: req.query.hostname,
        ipAddress: req.query.ipAddress,
        operatingSystem: req.query.operatingSystem,
        assetType: req.query.assetType,
        criticality: req.query.criticality,
        location: req.query.location,
        status: req.query.status,
        environment: req.query.environment,
        hasVulnerabilities: req.query.hasVulnerabilities === 'true' ? true : req.query.hasVulnerabilities === 'false' ? false : undefined
      };

      if (paginationError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: paginationError.details
        });
      }

      const result = await assetManagementService.getAssetsWithDetails(filters, pagination);
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching assets with details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new AssetManagementController();
