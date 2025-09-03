const { validationResult } = require('express-validator');
const diagramsService = require('../services/diagramsService');
const assetService = require('../services/assetService');

// ✅ Following API Development Best Practices Guide - Controller Pattern

const diagramsController = {
  async generateDiagram(req, res, next) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { assetUuids, diagramType, options = {} } = req.body;
      const userId = req.user.id;

      console.log(`🎨 Generating ${diagramType} diagram for ${assetUuids.length} assets`);

      // Get asset details
      const assets = await assetService.getAssetsByIds(assetUuids);
      if (!assets || assets.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No assets found for the provided UUIDs'
        });
      }

      // Generate diagram
      const diagram = await diagramsService.generateDiagram({
        assets,
        diagramType,
        options,
        userId
      });

      res.status(200).json({
        success: true,
        data: diagram,
        message: 'Diagram generated successfully'
      });
    } catch (error) {
      console.error('❌ Error generating diagram:', error);
      next(error);
    }
  },

  async getDiagram(req, res, next) {
    try {
      const diagramId = req.params.id;
      const userId = req.user.id;

      const diagram = await diagramsService.getDiagramById(diagramId, userId);
      
      if (!diagram) {
        return res.status(404).json({
          success: false,
          message: 'Diagram not found'
        });
      }

      res.status(200).json({
        success: true,
        data: diagram,
        message: 'Diagram retrieved successfully'
      });
    } catch (error) {
      console.error('❌ Error getting diagram:', error);
      next(error);
    }
  },

  async exportDiagram(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const diagramId = req.params.id;
      const { format } = req.body;
      const userId = req.user.id;

      console.log(`📄 Exporting diagram ${diagramId} as ${format}`);

      const exportResult = await diagramsService.exportDiagram(diagramId, format, userId);

      // Set appropriate headers for file download
      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
      
      res.send(exportResult.buffer);
    } catch (error) {
      console.error('❌ Error exporting diagram:', error);
      next(error);
    }
  },

  async getUserDiagrams(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const result = await diagramsService.getUserDiagrams(userId, { page, limit });

      res.status(200).json({
        success: true,
        data: result.diagrams,
        pagination: result.pagination,
        message: 'Diagrams retrieved successfully'
      });
    } catch (error) {
      console.error('❌ Error getting user diagrams:', error);
      next(error);
    }
  },

  async deleteDiagram(req, res, next) {
    try {
      const diagramId = req.params.id;
      const userId = req.user.id;

      await diagramsService.deleteDiagram(diagramId, userId);

      res.status(200).json({
        success: true,
        message: 'Diagram deleted successfully'
      });
    } catch (error) {
      console.error('❌ Error deleting diagram:', error);
      next(error);
    }
  }
};

module.exports = diagramsController;