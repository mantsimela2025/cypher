const express = require('express');
const router = express.Router();
const awsInfrastructureController = require('../controllers/awsInfrastructureController');

router.post('/aws/recommendation', awsInfrastructureController.generateRecommendation);
router.post('/aws/deploy', awsInfrastructureController.deployInfrastructure);
router.get('/aws/deployments/:id/progress', awsInfrastructureController.getDeploymentProgress);
router.get('/aws/recommendations/:id', awsInfrastructureController.getRecommendationById);
router.get('/aws/deployments/:id', awsInfrastructureController.getDeploymentById);

module.exports = router;
