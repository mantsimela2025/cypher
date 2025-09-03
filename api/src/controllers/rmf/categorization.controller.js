const categorizationService = require('../../services/rmf/categorization.service');

class CategorizationController {
  async listSystemInfoTypes(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const data = await categorizationService.listSystemInfoTypes(projectId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('RMF list info types error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to list information types' });
    }
  }

  async addSystemInfoType(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const payload = { ...req.body, rmf_project_id: projectId };
      const record = await categorizationService.addSystemInfoType(payload);
      return res.status(201).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF add info type error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to add information type' });
    }
  }

  async deleteSystemInfoType(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      await categorizationService.deleteSystemInfoType(id);
      return res.status(200).json({ success: true, message: 'Deleted' });
    } catch (error) {
      console.error('RMF delete info type error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to delete information type' });
    }
  }

  async setCategorization(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const record = await categorizationService.setCategorization(projectId, req.body);
      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF set categorization error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to set categorization' });
    }
  }

  async getCategorization(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const record = await categorizationService.getCategorization(projectId);
      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF get categorization error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to get categorization' });
    }
  }
}

module.exports = new CategorizationController();
