const { db } = require('../../db');
const { sql, eq } = require('drizzle-orm');
const repo = require('../../db/rmf.repository');

class ProjectsService {
  async createProject(data) {
    return await db.transaction(async (tx) => {
      const project = await repo.insertProject(tx, data);
      // auto-create steps using database values
      const steps = ['categorize','select','implement','assess','authorize','monitor'];
      for (const step of steps) {
        await repo.insertStep(tx, {
          rmf_project_id: project.id,
          step: step,
          status: step === 'categorize' ? 'in_progress' : 'not_started'
        });
      }
      return project;
    });
  }

  async listProjects(options = {}) {
    const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;

    const data = await repo.listProjects({ limit, offset, sortBy, sortOrder });
    const count = await repo.countProjects();

    return {
      data,
      pagination: {
        page,
        limit,
        total: parseInt(count ?? 0, 10),
        totalPages: Math.ceil((parseInt(count ?? 0, 10)) / limit)
      }
    };
  }

  async getById(id) {
    return await repo.getProjectById(id);
  }

  async updateProject(id, payload) {
    return await repo.updateProject(id, payload);
  }
}

module.exports = new ProjectsService();
