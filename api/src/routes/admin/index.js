const express = require('express');
const router = express.Router();

// Temporarily commented out due to missing schema dependency
// const ingestionSimulationRoutes = require('./ingestionSimulation');
const emailRoutes = require('./emailRoutes');
const distributionGroupsRoutes = require('../distributionGroupsRoutes');

// Add other admin routes here

// router.use('/ingestion-simulation', ingestionSimulationRoutes);
router.use('/email', emailRoutes);
router.use('/distribution-groups', distributionGroupsRoutes);

module.exports = router;
