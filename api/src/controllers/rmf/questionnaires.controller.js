const questionnairesService = require('../../services/rmf/questionnaires.service');

class QuestionnairesController {
  async list(req, res) {
    try {
      const data = await questionnairesService.list();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('RMF list questionnaires error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to list questionnaires' });
    }
  }

  async create(req, res) {
    try {
      const record = await questionnairesService.create(req.body);
      return res.status(201).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF create questionnaire error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to create questionnaire' });
    }
  }

  async update(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const record = await questionnairesService.update(id, req.body);
      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF update questionnaire error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to update questionnaire' });
    }
  }
}

module.exports = new QuestionnairesController();
