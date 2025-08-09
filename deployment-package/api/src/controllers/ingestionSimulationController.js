const ingestionSimulationService = require('../services/ingestionSimulationService');
const { body, param, query, validationResult } = require('express-validator');

class IngestionSimulationController {
  async getAllJobs(req, res) {
    try {
      const filters = {
        sourceSystem: req.query.sourceSystem,
      };
      const options = {
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0,
      };

      const result = await ingestionSimulationService.getAllJobs(filters, options);
      if (!result.success) {
        return res.status(500).json({ success: false, message: result.message });
      }

      res.status(200).json({
        success: true,
        data: result.data,
        message: 'Ingestion jobs retrieved successfully',
      });
    } catch (error) {
      console.error('Error in getAllJobs:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getJobById(req, res) {
    try {
      const id = req.params.id;
      const result = await ingestionSimulationService.getJobById(id);
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }
      res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      console.error('Error in getJobById:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }

      const data = req.body;
      const result = await ingestionSimulationService.createJob(data);
      if (!result.success) {
        return res.status(500).json({ success: false, message: result.message });
      }

      res.status(201).json({ success: true, data: result.data, message: result.message });
    } catch (error) {
      console.error('Error in createJob:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }

      const id = req.params.id;
      const data = req.body;
      const result = await ingestionSimulationService.updateJob(id, data);
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }

      res.status(200).json({ success: true, data: result.data, message: result.message });
    } catch (error) {
      console.error('Error in updateJob:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteJob(req, res) {
    try {
      const id = req.params.id;
      const result = await ingestionSimulationService.deleteJob(id);
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error('Error in deleteJob:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async simulateRenewedScan(req, res) {
    try {
      const id = req.params.id;
      const result = await ingestionSimulationService.simulateRenewedScan(id);
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }
      res.status(200).json({ success: true, data: result.data, message: 'Renewed scan simulated successfully' });
    } catch (error) {
      console.error('Error in simulateRenewedScan:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new IngestionSimulationController();
