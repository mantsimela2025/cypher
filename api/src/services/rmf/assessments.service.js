const repo = require('../../db/rmf.repository');

class AssessmentsService {
  async create(projectId, payload) {
    return await repo.insertAssessment(projectId, payload);
  }
  async update(assessmentId, payload) {
    return await repo.updateAssessment(assessmentId, payload);
  }
  async listByProject(projectId) {
    return await repo.listAssessmentsByProject(projectId);
  }
}

module.exports = new AssessmentsService();
