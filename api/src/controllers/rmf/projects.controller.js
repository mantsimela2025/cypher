const { validationResult } = require('express-validator');
const projectsService = require('../../services/rmf/projects.service');

class ProjectsController {
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
      }
      const createdBy = req.user?.id || req.body.createdBy || null;
      const data = { ...req.body, created_by: createdBy };
      const record = await projectsService.createProject(data);
      return res.status(201).json({ success: true, data: record, message: 'Project created' });
    } catch (error) {
      console.error('RMF create project error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to create project', timestamp: new Date().toISOString() });
    }
  }

  async list(req, res) {
    try {
      const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
      const options = { page: parseInt(page,10), limit: parseInt(limit,10), sortBy, sortOrder };
      const result = await projectsService.listProjects(options);
      return res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      console.error('RMF list projects error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to list projects', timestamp: new Date().toISOString() });
    }
  }

  async getById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const record = await projectsService.getById(id);
      if (!record) return res.status(404).json({ success: false, error: 'Not found' });
      return res.status(200).json({ success: true, data: record });
    } catch (error) {
      console.error('RMF get project error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to get project' });
    }
  }

  async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
      }
      const id = parseInt(req.params.id, 10);
      const record = await projectsService.updateProject(id, req.body);
      return res.status(200).json({ success: true, data: record, message: 'Project updated' });
    } catch (error) {
      console.error('RMF update project error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to update project' });
    }
  }
}

module.exports = new ProjectsController();
