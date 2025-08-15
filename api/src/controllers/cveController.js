const cveService = require('../services/cveService');
const { validationResult } = require('express-validator');

class CveController {
  async getAll(req, res) {
    try {
      // Extract and validate query parameters
      const {
        page = 1,
        limit = 50,
        severity,
        exploitAvailable,
        patchAvailable,
        search = '',
        sortBy = 'publishedDate',
        sortOrder = 'desc',
        minScore,
        maxScore,
        dateFrom,
        dateTo
      } = req.query;

      const filters = {
        severity,
        exploitAvailable,
        patchAvailable,
        search,
        minScore,
        maxScore,
        dateFrom,
        dateTo
      };

      const options = {
        limit: parseInt(limit, 10),
        offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
        sortBy,
        sortOrder
      };

      const result = await cveService.getAllCves(filters, options);
      
      // ✅ CORRECT: Structured success response
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total: result.total,
          totalPages: Math.ceil(result.total / parseInt(limit, 10))
        },
        filters,
        message: `Retrieved ${result.data.length} CVEs`
      });
    } catch (error) {
      console.error('Error in CveController.getAll:', error);
      
      // ✅ CORRECT: Structured error response
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve CVEs',
        timestamp: new Date().toISOString()
      });
    }
  }

  async getById(req, res) {
    try {
      const { cveId } = req.params;
      
      // ✅ CORRECT: Input validation
      if (!cveId.match(/^CVE-\d{4}-\d{4,}$/i)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid CVE ID format. Expected format: CVE-YYYY-NNNN'
        });
      }

      const cveDetails = await cveService.getCveById(cveId.toUpperCase());
      
      if (!cveDetails) {
        return res.status(404).json({
          success: false,
          error: `CVE ${cveId} not found`
        });
      }

      res.status(200).json({
        success: true,
        data: cveDetails,
        message: `Retrieved CVE ${cveId} details`
      });
    } catch (error) {
      console.error('Error in CveController.getById:', error);
      
      // ✅ CORRECT: Handle specific error types
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error.message.includes('Rate limit exceeded')) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        });
      } else if (error.message.includes('timeout')) {
        return res.status(503).json({
          success: false,
          error: 'Service temporarily unavailable. Please try again later.'
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve CVE details',
        timestamp: new Date().toISOString()
      });
    }
  }

  async getStats(req, res) {
    try {
      const stats = await cveService.getCveStats();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Retrieved CVE statistics'
      });
    } catch (error) {
      console.error('Error in CveController.getStats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve CVE statistics',
        timestamp: new Date().toISOString()
      });
    }
  }

  async advancedSearch(req, res) {
    try {
      // ✅ CORRECT: Validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { q, type = 'all', limit = 50 } = req.query;

      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const result = await cveService.advancedSearch(q.trim(), type, parseInt(limit, 10));
      
      res.status(200).json({
        success: true,
        data: result.results,
        query: q,
        type,
        count: result.count,
        message: `Found ${result.count} CVEs matching search criteria`
      });
    } catch (error) {
      console.error('Error in CveController.advancedSearch:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to perform advanced search',
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new CveController();