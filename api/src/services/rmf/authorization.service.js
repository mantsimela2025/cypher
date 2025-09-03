const repo = require('../../db/rmf.repository');

class AuthorizationService {
  async upsert(projectId, payload) { return await repo.upsertAuthorizationRecord(projectId, payload); }
  async get(projectId) { return await repo.getAuthorizationRecord(projectId); }
}

module.exports = new AuthorizationService();
