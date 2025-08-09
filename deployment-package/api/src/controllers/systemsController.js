const systemsService = require('../services/systemsService');
const { validationResult } = require('express-validator');

/**
 * Systems Controller
 * Handles HTTP requests for systems management
 */

/**
 * Get all systems with filtering, pagination, and search
 */
const getAllSystems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      status,
      systemType,
      riskLevel,
      source,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      systemType,
      riskLevel,
      source,
      sortBy,
      sortOrder
    };

    const result = await systemsService.getAllSystems(filters);

    res.json({
      success: true,
      data: result.systems,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error) {
    console.error('Error getting systems:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve systems',
      error: error.message
    });
  }
};

/**
 * Get systems statistics for dashboard cards
 */
const getSystemsStats = async (req, res) => {
  try {
    const stats = await systemsService.getSystemsStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting systems stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve systems statistics',
      error: error.message
    });
  }
};

/**
 * Get system by ID with related data
 */
const getSystemById = async (req, res) => {
  try {
    const { id } = req.params;
    const { include } = req.query; // Optional: assets, vulnerabilities, compliance

    const system = await systemsService.getSystemById(id, include);

    if (!system) {
      return res.status(404).json({
        success: false,
        message: 'System not found'
      });
    }

    res.json({
      success: true,
      data: system
    });
  } catch (error) {
    console.error('Error getting system by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system',
      error: error.message
    });
  }
};

/**
 * Get assets associated with a system
 */
const getSystemAssets = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const result = await systemsService.getSystemAssets(id, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result.assets,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error) {
    console.error('Error getting system assets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system assets',
      error: error.message
    });
  }
};

/**
 * Get asset count for a system
 */
const getSystemAssetsCount = async (req, res) => {
  try {
    const { id } = req.params;

    const count = await systemsService.getSystemAssetsCount(id);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error getting system assets count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system assets count',
      error: error.message
    });
  }
};

/**
 * Get vulnerabilities for a system
 */
const getSystemVulnerabilities = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, severity } = req.query;

    const result = await systemsService.getSystemVulnerabilities(id, {
      page: parseInt(page),
      limit: parseInt(limit),
      severity
    });

    res.json({
      success: true,
      data: result.vulnerabilities,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error) {
    console.error('Error getting system vulnerabilities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system vulnerabilities',
      error: error.message
    });
  }
};

/**
 * Get vulnerability count for a system
 */
const getSystemVulnerabilitiesCount = async (req, res) => {
  try {
    const { id } = req.params;

    const count = await systemsService.getSystemVulnerabilitiesCount(id);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error getting system vulnerabilities count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system vulnerabilities count',
      error: error.message
    });
  }
};

/**
 * Get compliance status for a system
 */
const getSystemCompliance = async (req, res) => {
  try {
    const { id } = req.params;

    const compliance = await systemsService.getSystemCompliance(id);

    res.json({
      success: true,
      data: compliance
    });
  } catch (error) {
    console.error('Error getting system compliance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system compliance',
      error: error.message
    });
  }
};

/**
 * Get analytics data for a system
 */
const getSystemAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeRange = '30d' } = req.query;

    const analytics = await systemsService.getSystemAnalytics(id, timeRange);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting system analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system analytics',
      error: error.message
    });
  }
};

/**
 * Create new system
 */
const createSystem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const systemData = req.body;
    const newSystem = await systemsService.createSystem(systemData);

    res.status(201).json({
      success: true,
      message: 'System created successfully',
      data: newSystem
    });
  } catch (error) {
    console.error('Error creating system:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create system',
      error: error.message
    });
  }
};

/**
 * Update system
 */
const updateSystem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedSystem = await systemsService.updateSystem(id, updateData);

    if (!updatedSystem) {
      return res.status(404).json({
        success: false,
        message: 'System not found'
      });
    }

    res.json({
      success: true,
      message: 'System updated successfully',
      data: updatedSystem
    });
  } catch (error) {
    console.error('Error updating system:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system',
      error: error.message
    });
  }
};

/**
 * Delete system
 */
const deleteSystem = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await systemsService.deleteSystem(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'System not found'
      });
    }

    res.json({
      success: true,
      message: 'System deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting system:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete system',
      error: error.message
    });
  }
};

/**
 * Bulk operations on systems
 */
const bulkOperations = async (req, res) => {
  try {
    const { operation, systemIds, data } = req.body;

    if (!operation || !systemIds || !Array.isArray(systemIds)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bulk operation request'
      });
    }

    const result = await systemsService.bulkOperations(operation, systemIds, data);

    res.json({
      success: true,
      message: `Bulk ${operation} completed`,
      data: result
    });
  } catch (error) {
    console.error('Error performing bulk operations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk operations',
      error: error.message
    });
  }
};

/**
 * Sync systems from external sources
 */
const syncSystems = async (req, res) => {
  try {
    const { source = 'xacta', filters = {} } = req.body;

    const result = await systemsService.syncSystems(source, filters);

    res.json({
      success: true,
      message: 'Systems sync completed',
      data: result
    });
  } catch (error) {
    console.error('Error syncing systems:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync systems',
      error: error.message
    });
  }
};

/**
 * Export systems data
 */
const exportSystems = async (req, res) => {
  try {
    const { format = 'csv', filters = {} } = req.query;

    const result = await systemsService.exportSystems(format, filters);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="systems.${format}"`);
    res.send(result.data);
  } catch (error) {
    console.error('Error exporting systems:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export systems',
      error: error.message
    });
  }
};

module.exports = {
  getAllSystems,
  getSystemsStats,
  getSystemById,
  getSystemAssets,
  getSystemAssetsCount,
  getSystemVulnerabilities,
  getSystemVulnerabilitiesCount,
  getSystemCompliance,
  getSystemAnalytics,
  createSystem,
  updateSystem,
  deleteSystem,
  bulkOperations,
  syncSystems,
  exportSystems
};
