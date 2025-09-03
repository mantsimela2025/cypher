const assetService = require('../services/assetService');
const { assetSchema, querySchema, bulkSchema } = require('../validation/assets');

class AssetController {

  // ==================== CREATE ====================

  async createAsset(req, res) {
    try {
      const { error, value } = assetSchema.create.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.details 
        });
      }

      const result = await assetService.createAsset(value, req.user.id);
      
      res.status(201).json({
        message: 'Asset created successfully',
        data: result
      });
    } catch (error) {
      console.error('Error creating asset:', error);
      
      // Handle specific database errors
      if (error.code === '23505') { // PostgreSQL unique violation
        return res.status(409).json({
          error: 'Asset with this hostname already exists'
        });
      }
      
      if (error.code === '23503') { // PostgreSQL foreign key violation
        return res.status(400).json({
          error: 'Invalid reference to related entity'
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== READ ====================

  async getAssets(req, res) {
    try {
      // Validate pagination parameters
      const { error: paginationError, value: pagination } = querySchema.pagination.validate({
        page: req.query.page,
        limit: req.query.limit,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      });

      // Validate filter parameters (include frontend compatibility parameters)
      const { error: filtersError, value: filters } = querySchema.filters.validate({
        hostname: req.query.hostname,
        systemId: req.query.systemId,
        hasAgent: req.query.hasAgent,
        hasPluginResults: req.query.hasPluginResults,
        criticalityRating: req.query.criticalityRating,
        criticality: req.query.criticality, // Frontend compatibility
        source: req.query.source,
        operatingSystem: req.query.operatingSystem,
        systemType: req.query.systemType,
        assetType: req.query.assetType, // Frontend compatibility
        ipAddress: req.query.ipAddress,
        networkType: req.query.networkType,
        tags: req.query.tags, // Frontend compatibility
        createdAfter: req.query.createdAfter,
        createdBefore: req.query.createdBefore,
        lastSeenAfter: req.query.lastSeenAfter,
        lastSeenBefore: req.query.lastSeenBefore,
        minExposureScore: req.query.minExposureScore,
        maxExposureScore: req.query.maxExposureScore,
        minAcrScore: req.query.minAcrScore,
        maxAcrScore: req.query.maxAcrScore,
        search: req.query.search
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

      const result = await assetService.getAssets(filters, pagination);
      
      res.json({
        message: 'Assets retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching assets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAssetById(req, res) {
    try {
      const { assetUuid } = req.params;

      if (!assetUuid) {
        return res.status(400).json({ error: 'Asset UUID is required' });
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(assetUuid)) {
        return res.status(400).json({ error: 'Invalid UUID format' });
      }

      const result = await assetService.getAssetById(assetUuid);
      
      if (!result) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      
      res.json({
        message: 'Asset retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error fetching asset:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== UPDATE ====================

  async updateAsset(req, res) {
    try {
      const { assetUuid } = req.params;

      if (!assetUuid) {
        return res.status(400).json({ error: 'Asset UUID is required' });
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(assetUuid)) {
        return res.status(400).json({ error: 'Invalid UUID format' });
      }

      const { error, value } = assetSchema.update.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.details 
        });
      }

      const result = await assetService.updateAsset(assetUuid, value, req.user.id);
      
      if (!result) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      
      res.json({
        message: 'Asset updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating asset:', error);
      
      if (error.message === 'Asset not found') {
        return res.status(404).json({ error: 'Asset not found' });
      }
      
      if (error.code === '23505') { // PostgreSQL unique violation
        return res.status(409).json({
          error: 'Asset with this hostname already exists'
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== DELETE ====================

  async deleteAsset(req, res) {
    try {
      const { assetUuid } = req.params;
      const { force } = req.query;

      if (!assetUuid) {
        return res.status(400).json({ error: 'Asset UUID is required' });
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(assetUuid)) {
        return res.status(400).json({ error: 'Invalid UUID format' });
      }

      const result = await assetService.deleteAsset(assetUuid, force === 'true');
      
      if (!result) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      
      res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
      console.error('Error deleting asset:', error);
      
      if (error.message.includes('has related data')) {
        return res.status(409).json({ 
          error: error.message,
          hint: 'Use ?force=true to delete anyway'
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== BULK OPERATIONS ====================

  async bulkUpdateAssets(req, res) {
    try {
      const { error, value } = bulkSchema.bulkUpdate.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details
        });
      }

      const { assetUuids, updates } = value;
      const results = await assetService.bulkUpdateAssets(assetUuids, updates, req.user.id);

      res.json({
        message: `Successfully updated ${results.length} assets`,
        data: results,
        summary: {
          requested: assetUuids.length,
          updated: results.length,
          failed: assetUuids.length - results.length
        }
      });
    } catch (error) {
      console.error('Error bulk updating assets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async bulkDeleteAssets(req, res) {
    try {
      const { error, value } = bulkSchema.bulkDelete.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details
        });
      }

      const { assetUuids, force } = value;
      const results = await assetService.bulkDeleteAssets(assetUuids, force);

      res.json({
        message: `Successfully deleted ${results.length} assets`,
        data: results,
        summary: {
          requested: assetUuids.length,
          deleted: results.length,
          failed: assetUuids.length - results.length
        }
      });
    } catch (error) {
      console.error('Error bulk deleting assets:', error);

      if (error.message.includes('has related data')) {
        return res.status(409).json({
          error: error.message,
          hint: 'Use force: true to delete anyway'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== SEARCH ====================

  async searchAssets(req, res) {
    try {
      const { search, ...otherFilters } = req.query;

      if (!search || search.trim().length < 2) {
        return res.status(400).json({
          error: 'Search query must be at least 2 characters long'
        });
      }

      const filters = { ...otherFilters, search: search.trim() };
      const pagination = {
        page: req.query.page || 1,
        limit: Math.min(req.query.limit || 20, 50), // Limit search results
        sortBy: req.query.sortBy || 'hostname',
        sortOrder: req.query.sortOrder || 'asc'
      };

      const result = await assetService.getAssets(filters, pagination);

      res.json({
        message: `Found ${result.pagination.total} assets matching "${search}"`,
        data: result.data,
        pagination: result.pagination,
        searchQuery: search
      });
    } catch (error) {
      console.error('Error searching assets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new AssetController();
