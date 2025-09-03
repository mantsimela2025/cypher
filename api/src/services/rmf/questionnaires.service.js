const repo = require('../../db/rmf.repository');

class QuestionnairesService {
  async list() { return await repo.listQuestionnaires(); }
  async create(payload) { return await repo.insertQuestionnaire(payload); }
  async update(id, payload) { return await repo.updateQuestionnaire(id, payload); }
}

module.exports = new QuestionnairesService();
