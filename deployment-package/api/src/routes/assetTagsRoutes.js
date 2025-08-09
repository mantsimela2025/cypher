const express = require('express');
const { body } = require('express-validator');
const assetTagsController = require('../controllers/assetTagsController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// Validation middleware
const validateAddTag = [
  body('tagKey')
    .notEmpty()
    .withMessage('Tag key is required')
    .isLength({ max: 255 })
    .withMessage('Tag key must be less than 255 characters'),
  body('tagValue')
    .notEmpty()
    .withMessage('Tag value is required')
    .isLength({ max: 255 })
    .withMessage('Tag value must be less than 255 characters')
];

const validateBulkAddTags = [
  body('tags')
    .isArray({ min: 1 })
    .withMessage('Tags must be a non-empty array'),
  body('tags.*.tagKey')
    .notEmpty()
    .withMessage('Each tag must have a tagKey')
    .isLength({ max: 255 })
    .withMessage('Tag key must be less than 255 characters'),
  body('tags.*.tagValue')
    .notEmpty()
    .withMessage('Each tag must have a tagValue')
    .isLength({ max: 255 })
    .withMessage('Tag value must be less than 255 characters')
];

const validateAssetUuids = [
  body('assetUuids')
    .isArray({ min: 1 })
    .withMessage('Asset UUIDs must be a non-empty array'),
  body('assetUuids.*')
    .isUUID()
    .withMessage('Each asset UUID must be a valid UUID')
];

// Apply authentication and permission middleware to all routes
router.use(authenticateToken);
router.use(requirePermission('asset_management:read'));

// GET /api/v1/asset-tags/keys - Get all unique tag keys
router.get('/keys', assetTagsController.getTagKeys);

// GET /api/v1/asset-tags/keys/:tagKey/values - Get all values for a specific tag key
router.get('/keys/:tagKey/values', assetTagsController.getTagValues);

// GET /api/v1/asset-tags/statistics - Get tag statistics
router.get('/statistics', assetTagsController.getTagStatistics);

// POST /api/v1/asset-tags/search - Search assets by tags
router.post('/search', assetTagsController.searchAssetsByTags);

// POST /api/v1/asset-tags/multiple - Get tags for multiple assets
router.post('/multiple', validateAssetUuids, assetTagsController.getMultipleAssetTags);

// GET /api/v1/asset-tags/:assetUuid - Get all tags for a specific asset
router.get('/:assetUuid', assetTagsController.getAssetTags);

// POST /api/v1/asset-tags/:assetUuid - Add a new tag to an asset
router.post('/:assetUuid',
  requirePermission('asset_management:write'),
  validateAddTag,
  assetTagsController.addAssetTag
);

// POST /api/v1/asset-tags/:assetUuid/bulk - Bulk add tags to an asset
router.post('/:assetUuid/bulk',
  requirePermission('asset_management:write'),
  validateBulkAddTags,
  assetTagsController.bulkAddTags
);

// DELETE /api/v1/asset-tags/tag/:tagId - Remove a specific tag
router.delete('/tag/:tagId',
  requirePermission('asset_management:write'),
  assetTagsController.removeAssetTag
);

module.exports = router;
