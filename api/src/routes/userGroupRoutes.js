const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/distributionGroupsController');
const { ensureAuthenticated } = require('../middleware/authz');

router.get('/api/v1/users/:id/groups', ensureAuthenticated, ctrl.getUserGroups);

module.exports = router;
