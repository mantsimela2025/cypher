const repo = require('../../db/rmf.repository');

class TasksService {
  async listByStep(stepId) { return await repo.listTasksByStep(stepId); }
  async create(stepId, payload) { return await repo.insertTask({ ...payload, rmf_step_id: stepId }); }
  async update(id, payload) { return await repo.updateTask(id, payload); }
}

module.exports = new TasksService();
