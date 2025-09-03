const monitoringService = require('../../services/rmf/monitoring.service');

class MonitoringController {
  async upsert(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const record = await monitoringService.upsert(projectId, req.body);
      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF upsert monitoring plan error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to upsert monitoring plan' });
    }
  }

  async get(req, res) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const record = await monitoringService.get(projectId);
      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF get monitoring plan error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to get monitoring plan' });
    }
  }
}

module.exports = new MonitoringController();
