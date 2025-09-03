const repo = require('../../db/rmf.repository');

class MonitoringService {
  async upsert(projectId, payload) { return await repo.upsertMonitoringPlan(projectId, payload); }
  async get(projectId) { return await repo.getMonitoringPlan(projectId); }
}

module.exports = new MonitoringService();
