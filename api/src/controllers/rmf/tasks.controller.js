const tasksService = require('../../services/rmf/tasks.service');

class TasksController {
  async listByStep(req, res) {
    try {
      const stepId = parseInt(req.params.stepId, 10);
      const data = await tasksService.listByStep(stepId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('RMF list tasks error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to list tasks' });
    }
  }

  async create(req, res) {
    try {
      const stepId = parseInt(req.params.stepId, 10);
      const payload = { ...req.body };
      const record = await tasksService.create(stepId, payload);
      return res.status(201).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF create task error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to create task' });
    }
  }

  async update(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const record = await tasksService.update(id, req.body);
      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF update task error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to update task' });
    }
  }
}

module.exports = new TasksController();
