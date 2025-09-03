const repo = require('../../db/rmf.repository');

class CategorizationService {
  async listSystemInfoTypes(projectId) { return await repo.listSystemInfoTypes(projectId); }
  async addSystemInfoType(payload) { return await repo.insertSystemInfoType(payload); }
  async deleteSystemInfoType(id) { return await repo.deleteSystemInfoType(id); }
  async setCategorization(projectId, payload) { return await repo.upsertCategorization(projectId, payload); }
  async getCategorization(projectId) { return await repo.getCategorization(projectId); }
}

module.exports = new CategorizationService();
