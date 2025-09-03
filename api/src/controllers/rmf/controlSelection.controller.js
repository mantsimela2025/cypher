const controlSelectionService = require('../../services/rmf/controlSelection.service');

class ControlSelectionController {
  async setSelection(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const record = await controlSelectionService.setSelection(projectId, req.body);
      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF set control selection error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to set control selection' });
    }
  }

  async getSelection(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const record = await controlSelectionService.getSelection(projectId);
      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF get control selection error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to get control selection' });
    }
  }
}

module.exports = new ControlSelectionController();
