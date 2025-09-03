const authorizationService = require('../../services/rmf/authorization.service');

class AuthorizationController {
  async upsert(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const record = await authorizationService.upsert(projectId, req.body);
      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF upsert authorization error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to upsert authorization' });
    }
  }

  async get(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const record = await authorizationService.get(projectId);
      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF get authorization error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to get authorization' });
    }
  }
}

module.exports = new AuthorizationController();
