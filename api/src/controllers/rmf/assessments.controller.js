const { validationResult } = require('express-validator');
const assessmentsService = require('../../services/rmf/assessments.service');

class AssessmentsController {
  async create(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const record = await assessmentsService.create(projectId, req.body);
      return res.status(201).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF create assessment error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to create assessment' });
    }
  }

  async update(req, res) {
    try {
      const assessmentId = parseInt(req.params.assessmentId, 10);
      const record = await assessmentsService.update(assessmentId, req.body);
      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF update assessment error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to update assessment' });
    }
  }

  async listByProject(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const data = await assessmentsService.listByProject(projectId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('RMF list assessments error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to list assessments' });
    }
  }
}

module.exports = new AssessmentsController();
