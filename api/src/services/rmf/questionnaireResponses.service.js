const repo = require('../../db/rmf.repository');

class QuestionnaireResponsesService {
  async create(payload) { return await repo.insertQuestionnaireResponse(payload); }
  async update(id, payload) { return await repo.updateQuestionnaireResponse(id, payload); }
}

module.exports = new QuestionnaireResponsesService();
