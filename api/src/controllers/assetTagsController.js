const assetTagsService = require('../services/assetTagsService');
const { validationResult } = require('express-validator');

class AssetTagsController {
  // Get all tags for a specific asset
  async getAssetTags(req, res) {
    try {
      const { assetUuid } = req.params;
      const filters = {
        tagKey: req.query.tagKey,
        sortBy: req.query.sortBy || 'tagKey',
        sortOrder: req.query.sortOrder || 'asc'
      };

      const result = await assetTagsService.getAssetTags(assetUuid, filters);
      
      res.status(200).json({
        success: true,
        data: result.data,
        count: result.count,
        message: 'Asset tags retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getAssetTags:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve asset tags'
      });
    }
  }

  // Get all unique tag keys
  async getTagKeys(req, res) {
    try {
      const result = await assetTagsService.getTagKeys();
      
      res.status(200).json({
        success: true,
        data: result.data,
        message: 'Tag keys retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getTagKeys:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve tag keys'
      });
    }
  }

  // Get all values for a specific tag key
  async getTagValues(req, res) {
    try {
      const { tagKey } = req.params;
      const result = await assetTagsService.getTagValues(tagKey);
      
      res.status(200).json({
        success: true,
        data: result.data,
        message: 'Tag values retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getTagValues:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve tag values'
      });
    }
  }

  // Add a new tag to an asset
  async addAssetTag(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { assetUuid } = req.params;
      const { tagKey, tagValue } = req.body;

      const result = await assetTagsService.addAssetTag(assetUuid, tagKey, tagValue);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      console.error('Error in addAssetTag:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add asset tag'
      });
    }
  }

  // Remove a tag from an asset
  async removeAssetTag(req, res) {
    try {
      const { tagId } = req.params;
      const result = await assetTagsService.removeAssetTag(parseInt(tagId));
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      console.error('Error in removeAssetTag:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to remove asset tag'
      });
    }
  }

  // Bulk add tags to an asset
  async bulkAddTags(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { assetUuid } = req.params;
      const { tags } = req.body;

      if (!Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tags array is required and must not be empty'
        });
      }

      const result = await assetTagsService.bulkAddTags(assetUuid, tags);
      
      res.status(201).json({
        success: true,
        data: result.data,
        count: result.count,
        message: result.message
      });
    } catch (error) {
      console.error('Error in bulkAddTags:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to bulk add tags'
      });
    }
  }

  // Search assets by tags
  async searchAssetsByTags(req, res) {
    try {
      const tagFilters = req.body.tagFilters || [];
      const options = {
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const result = await assetTagsService.searchAssetsByTags(tagFilters, options);
      
      res.status(200).json({
        success: true,
        data: result.data,
        count: result.count,
        message: 'Assets search completed successfully'
      });
    } catch (error) {
      console.error('Error in searchAssetsByTags:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search assets by tags'
      });
    }
  }

  // Get tag statistics
  async getTagStatistics(req, res) {
    try {
      const result = await assetTagsService.getTagStatistics();
      
      res.status(200).json({
        success: true,
        data: result.data,
        message: 'Tag statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getTagStatistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve tag statistics'
      });
    }
  }

  // Get tags for multiple assets (for table display)
  async getMultipleAssetTags(req, res) {
    try {
      const { assetUuids } = req.body;

      if (!Array.isArray(assetUuids) || assetUuids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Asset UUIDs array is required'
        });
      }

      // Get tags for all requested assets
      const results = await Promise.all(
        assetUuids.map(async (assetUuid) => {
          try {
            const result = await assetTagsService.getAssetTags(assetUuid);
            return {
              assetUuid,
              tags: result.data || []
            };
          } catch (error) {
            console.error(`Error fetching tags for asset ${assetUuid}:`, error);
            return {
              assetUuid,
              tags: []
            };
          }
        })
      );

      // Convert to object for easier lookup
      const tagsByAsset = {};
      results.forEach(result => {
        tagsByAsset[result.assetUuid] = result.tags;
      });

      res.status(200).json({
        success: true,
        data: tagsByAsset,
        message: 'Multiple asset tags retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getMultipleAssetTags:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve multiple asset tags'
      });
    }
  }
}

module.exports = new AssetTagsController();
