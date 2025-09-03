const repo = require('../../db/rmf.repository');

class StepsService {
  async getStepsByProject(projectId) {
    return await repo.getStepsByProject(projectId);
  }

  async updateStep(projectId, step, payload) {
    return await repo.updateStep(projectId, step, payload);
  }

  async approveStep(projectId, step, { role, decision, comments, decided_by }) {
    // find step id
    const stepRecord = await repo.getStepByProjectAndKey(projectId, step);
    if (!stepRecord) throw new Error('Step not found');
    const approval = await repo.insertStepApproval({ rmf_step_id: stepRecord.id, role, decision, comments, decided_by });
    return approval;
  }
}

module.exports = new StepsService();
