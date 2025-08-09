const awsInfrastructureService = require('../services/awsInfrastructureService');

module.exports = {
  async generateRecommendation(req, res) {
    try {
      const recommendation = await awsInfrastructureService.generateSystemRecommendation(req.body);
      // Optionally save to DB
      // await awsInfrastructureService.saveRecommendation(recommendation);
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deployInfrastructure(req, res) {
    try {
      const { recommendation, progressCallback } = req.body;
      const deployment = await awsInfrastructureService.deployInfrastructure(recommendation, progressCallback);
      // Optionally save to DB
      // await awsInfrastructureService.saveDeployment(deployment);
      res.json(deployment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getDeploymentProgress(req, res) {
    try {
      const { id } = req.params;
      const progress = await awsInfrastructureService.getDeploymentProgress(id);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getRecommendationById(req, res) {
    try {
      const { id } = req.params;
      const recommendation = await awsInfrastructureService.getRecommendationById(id);
      res.json(recommendation);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getDeploymentById(req, res) {
    try {
      const { id } = req.params;
      const deployment = await awsInfrastructureService.getDeploymentById(id);
      res.json(deployment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
