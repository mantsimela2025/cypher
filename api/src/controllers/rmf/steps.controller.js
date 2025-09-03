const { validationResult } = require('express-validator');
const stepsService = require('../../services/rmf/steps.service');

class StepsController {
  async getByProject(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const steps = await stepsService.getStepsByProject(projectId);
      return res.status(200).json({ success: true, data: steps });
    } catch (error) {
      console.error('RMF get steps error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to get steps' });
    }
  }

  async updateStep(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const { step } = req.params;
      const payload = req.body;
      const updated = await stepsService.updateStep(projectId, step, payload);
      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('RMF update step error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to update step' });
    }
  }

  async approveStep(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
      }
      const projectId = parseInt(req.params.id, 10);
      const { step } = req.params;
      const { role, decision, comments } = req.body;
      const result = await stepsService.approveStep(projectId, step, { role, decision, comments, decided_by: req.user?.id || null });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('RMF approve step error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to approve step' });
    }
  }
}

module.exports = new StepsController();
