const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');

const projectsController = require('../controllers/rmf/projects.controller');
const stepsController = require('../controllers/rmf/steps.controller');
const tasksController = require('../controllers/rmf/tasks.controller');
const questionnairesController = require('../controllers/rmf/questionnaires.controller');
const questionnaireResponsesController = require('../controllers/rmf/questionnaireResponses.controller');
const categorizationController = require('../controllers/rmf/categorization.controller');
const controlSelectionController = require('../controllers/rmf/controlSelection.controller');
const assessmentsController = require('../controllers/rmf/assessments.controller');
const authorizationController = require('../controllers/rmf/authorization.controller');
const monitoringController = require('../controllers/rmf/monitoring.controller');

// Import validation middleware
const {
  validateCreateProject,
  validateListProjects,
  validateGetProjectById,
  validateUpdateProject
} = require('../validation/rmf/projects.validation');

const {
  validateGetStepsByProject,
  validateUpdateStep,
  validateApproveStep
} = require('../validation/rmf/steps.validation');

const {
  validateListTasksByStep,
  validateCreateTask,
  validateUpdateTask
} = require('../validation/rmf/tasks.validation');

const {
  validateListQuestionnaires,
  validateCreateQuestionnaire,
  validateUpdateQuestionnaire
} = require('../validation/rmf/questionnaires.validation');

const {
  validateCreateResponse,
  validateUpdateResponse
} = require('../validation/rmf/responses.validation');

const {
  validateListSystemInfoTypes,
  validateAddSystemInfoType,
  validateDeleteSystemInfoType,
  validateSetCategorization,
  validateGetCategorization
} = require('../validation/rmf/categorization.validation');

const {
  validateSetSelection,
  validateGetSelection
} = require('../validation/rmf/controlSelection.validation');

const {
  validateCreateAssessment,
  validateUpdateAssessment,
  validateListAssessmentsByProject
} = require('../validation/rmf/assessments.validation');

const {
  validateUpsertAuthorization,
  validateGetAuthorization
} = require('../validation/rmf/authorization.validation');

const {
  validateUpsertMonitoring,
  validateGetMonitoring
} = require('../validation/rmf/monitoring.validation');

// AI validation
const {
  validateSystemCategorization,
  validateCategorizationHistory,
  validateAIStats,
  validateControlSelection,
  validatePOAMGeneration
} = require('../validation/rmf/aiValidation');

// AI controller
const aiController = require('../controllers/rmf/aiController');

const router = express.Router();

// Apply auth to all routes
router.use(authenticateToken);

// Projects
router.post('/projects',
  requireRole(['admin']),
  validateCreateProject,
  projectsController.create
);

router.get('/projects',
  requireRole(['admin', 'user']),
  validateListProjects,
  projectsController.list
);

router.get('/projects/:id',
  requireRole(['admin', 'user']),
  validateGetProjectById,
  projectsController.getById
);

router.patch('/projects/:id',
  requireRole(['admin']),
  validateUpdateProject,
  projectsController.update
);

// Steps
router.get('/projects/:id/steps',
  requireRole(['admin', 'user']),
  validateGetStepsByProject,
  stepsController.getByProject
);

router.patch('/projects/:id/steps/:step',
  requireRole(['admin']),
  validateUpdateStep,
  stepsController.updateStep
);

router.post('/projects/:id/steps/:step/approve',
  requireRole(['admin']),
  validateApproveStep,
  stepsController.approveStep
);

// Tasks
router.get('/steps/:stepId/tasks',
  requireRole(['admin', 'user']),
  validateListTasksByStep,
  tasksController.listByStep
);

router.post('/steps/:stepId/tasks',
  requireRole(['admin']),
  validateCreateTask,
  tasksController.create
);

router.patch('/tasks/:id',
  requireRole(['admin']),
  validateUpdateTask,
  tasksController.update
);

// Questionnaires
router.get('/questionnaires',
  requireRole(['admin', 'user']),
  validateListQuestionnaires,
  questionnairesController.list
);

router.post('/questionnaires',
  requireRole(['admin']),
  validateCreateQuestionnaire,
  questionnairesController.create
);

router.put('/questionnaires/:id',
  requireRole(['admin']),
  validateUpdateQuestionnaire,
  questionnairesController.update
);

router.post('/tasks/:taskId/questionnaires/:questionnaireId/responses',
  requireRole(['admin']),
  validateCreateResponse,
  questionnaireResponsesController.create
);

router.patch('/questionnaire-responses/:id',
  requireRole(['admin']),
  validateUpdateResponse,
  questionnaireResponsesController.update
);

// Categorization
router.get('/projects/:id/information-types',
  requireRole(['admin','user']),
  validateListSystemInfoTypes,
  categorizationController.listSystemInfoTypes
);

router.post('/projects/:id/information-types',
  requireRole(['admin']),
  validateAddSystemInfoType,
  categorizationController.addSystemInfoType
);

router.delete('/system-information-types/:id',
  requireRole(['admin']),
  validateDeleteSystemInfoType,
  categorizationController.deleteSystemInfoType
);

router.put('/projects/:id/categorization',
  requireRole(['admin']),
  validateSetCategorization,
  categorizationController.setCategorization
);

router.get('/projects/:id/categorization',
  requireRole(['admin','user']),
  validateGetCategorization,
  categorizationController.getCategorization
);

// Control Selection
router.put('/projects/:id/control-selection',
  requireRole(['admin']),
  validateSetSelection,
  controlSelectionController.setSelection
);

router.get('/projects/:id/control-selection',
  requireRole(['admin','user']),
  validateGetSelection,
  controlSelectionController.getSelection
);

// Assessments
router.post('/projects/:id/assessments',
  requireRole(['admin']),
  validateCreateAssessment,
  assessmentsController.create
);

router.patch('/assessments/:assessmentId',
  requireRole(['admin']),
  validateUpdateAssessment,
  assessmentsController.update
);

router.get('/projects/:id/assessments',
  requireRole(['admin','user']),
  validateListAssessmentsByProject,
  assessmentsController.listByProject
);

// Authorization
router.put('/projects/:id/authorization',
  requireRole(['admin']),
  validateUpsertAuthorization,
  authorizationController.upsert
);

router.get('/projects/:id/authorization',
  requireRole(['admin','user']),
  validateGetAuthorization,
  authorizationController.get
);

// Monitoring plan
router.put('/projects/:id/monitoring-plan',
  requireRole(['admin']),
  validateUpsertMonitoring,
  monitoringController.upsert
);

router.get('/projects/:id/monitoring-plan',
  requireRole(['admin','user']),
  validateGetMonitoring,
  monitoringController.get
);

// =====================================================
// AI-Powered RMF Routes (Following CYPHER Best Practices)
// =====================================================

// AI System Categorization
router.post('/ai/categorize',
  authenticateToken,                    // ✅ Authentication
  requireRole(['admin', 'user']),      // ✅ Authorization
  validateSystemCategorization,         // ✅ Input validation
  aiController.categorizeSystem         // ✅ Controller
);

// AI Categorization History
router.get('/ai/categorization-history/:systemId',
  authenticateToken,                    // ✅ Authentication
  requireRole(['admin', 'user']),      // ✅ Authorization
  validateCategorizationHistory,        // ✅ Input validation
  aiController.getCategorizationHistory // ✅ Controller
);

// AI Service Health Check
router.get('/ai/health',
  authenticateToken,                    // ✅ Authentication
  requireRole(['admin']),              // ✅ Admin only
  aiController.healthCheck             // ✅ Controller
);

// AI Service Statistics
router.get('/ai/stats',
  authenticateToken,                    // ✅ Authentication
  requireRole(['admin']),              // ✅ Admin only
  validateAIStats,                     // ✅ Input validation
  aiController.getAIStats              // ✅ Controller
);

// AI Test Endpoint (Development/Testing)
router.post('/ai/test',
  authenticateToken,                    // ✅ Authentication
  requireRole(['admin']),              // ✅ Admin only
  aiController.testAI                  // ✅ Controller
);

module.exports = router;
