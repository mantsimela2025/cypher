const express = require('express');
const router = express.Router();

// Import integration route modules
const tenableRoutes = require('./tenable');
// const xactaRoutes = require('./xacta'); // TODO: Add when Xacta routes are created
// const orchestrationRoutes = require('./orchestration'); // TODO: Add orchestration routes

/**
 * Integration Routes Index
 * Organizes all external integration API routes
 */

// Tenable integration routes
router.use('/tenable', tenableRoutes);

// TODO: Add other integration routes
// router.use('/xacta', xactaRoutes);
// router.use('/orchestration', orchestrationRoutes);

/**
 * @route   GET /api/integrations
 * @desc    Get available integrations and their status
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    // TODO: Get actual status from services
    const integrations = {
      tenable: {
        name: 'Tenable',
        description: 'Vulnerability management and asset discovery',
        status: 'active',
        endpoints: [
          'GET /api/integrations/tenable/status',
          'POST /api/integrations/tenable/sync/assets',
          'POST /api/integrations/tenable/sync/vulnerabilities',
          'GET /api/integrations/tenable/assets',
          'GET /api/integrations/tenable/vulnerabilities'
        ]
      },
      xacta: {
        name: 'Xacta RM Pro',
        description: 'Risk management and compliance',
        status: 'planned',
        endpoints: []
      }
    };

    res.json({
      success: true,
      data: integrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve integration information',
      error: error.message
    });
  }
});

module.exports = router;
