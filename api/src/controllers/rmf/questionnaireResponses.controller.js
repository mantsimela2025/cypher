const responsesService = require('../../services/rmf/questionnaireResponses.service');

class QuestionnaireResponsesController {
  async create(req, res) {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      const questionnaireId = parseInt(req.params.questionnaireId, 10);
      const payload = { ...req.body, rmf_task_id: taskId, questionnaire_id: questionnaireId, responder_user_id: req.user?.id || null };
      const record = await responsesService.create(payload);
      return res.status(201).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF create questionnaire response error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to create questionnaire response' });
    }
  }

  async update(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const record = await responsesService.update(id, req.body);
      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF update questionnaire response error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to update questionnaire response' });
    }
  }
}

module.exports = new QuestionnaireResponsesController();
