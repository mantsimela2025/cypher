const assetCostManagementService = require('../services/assetCostManagementService');

class AssetCostManagementController {
  // GET /api/v1/asset-management/costs
  async getAllCosts(req, res) {
    try {
      const filters = {
        assetUuid: req.query.assetUuid,
        costType: req.query.costType,
        billingCycle: req.query.billingCycle
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const result = await assetCostManagementService.getAllCosts(filters);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message,
          count: result.data.length
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in getAllCosts:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // GET /api/v1/asset-management/costs/:id
  async getCostById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid cost record ID is required'
        });
      }

      const result = await assetCostManagementService.getCostById(parseInt(id));

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        const statusCode = result.message === 'Cost record not found' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in getCostById:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // GET /api/v1/asset-management/costs/asset/:assetUuid
  async getCostsByAssetUuid(req, res) {
    try {
      const { assetUuid } = req.params;

      if (!assetUuid) {
        return res.status(400).json({
          success: false,
          message: 'Asset UUID is required'
        });
      }

      const result = await assetCostManagementService.getCostsByAssetUuid(assetUuid);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message,
          count: result.data.length
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in getCostsByAssetUuid:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // GET /api/v1/asset-management/costs/asset/:assetUuid/summary
  async getCostSummary(req, res) {
    try {
      const { assetUuid } = req.params;

      if (!assetUuid) {
        return res.status(400).json({
          success: false,
          message: 'Asset UUID is required'
        });
      }

      const result = await assetCostManagementService.getCostSummary(assetUuid);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in getCostSummary:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // POST /api/v1/asset-management/costs
  async createCost(req, res) {
    try {
      const costData = req.body;

      // Validate the cost data
      const validation = assetCostManagementService.validateCostData(costData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      // Add user information if available
      if (req.user) {
        costData.createdBy = req.user.id;
        costData.lastModifiedBy = req.user.id;
      }

      const result = await assetCostManagementService.createCost(costData);

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in createCost:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // PUT /api/v1/asset-management/costs/:id
  async updateCost(req, res) {
    try {
      const { id } = req.params;
      const costData = req.body;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid cost record ID is required'
        });
      }

      // Validate the cost data
      const validation = assetCostManagementService.validateCostData(costData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      // Add user information if available
      if (req.user) {
        costData.lastModifiedBy = req.user.id;
      }

      const result = await assetCostManagementService.updateCost(parseInt(id), costData);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        const statusCode = result.message === 'Cost record not found' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in updateCost:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // DELETE /api/v1/asset-management/costs/:id
  async deleteCost(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Valid cost record ID is required'
        });
      }

      const result = await assetCostManagementService.deleteCost(parseInt(id));

      if (result.success) {
        res.status(200).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        const statusCode = result.message === 'Cost record not found' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in deleteCost:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new AssetCostManagementController();
