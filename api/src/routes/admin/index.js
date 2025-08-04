const express = require('express');
const router = express.Router();

const ingestionSimulationRoutes = require('./ingestionSimulation');
const emailRoutes = require('./emailRoutes');

// Add other admin routes here

router.use('/ingestion-simulation', ingestionSimulationRoutes);
router.use('/email', emailRoutes);

module.exports = router;
