const repo = require('../../db/rmf.repository');

class ControlSelectionService {
  async setSelection(projectId, payload) { return await repo.upsertControlSelection(projectId, payload); }
  async getSelection(projectId) { return await repo.getControlSelection(projectId); }
}

module.exports = new ControlSelectionService();
