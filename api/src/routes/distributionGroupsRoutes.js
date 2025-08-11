const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/distributionGroupsController');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/authz');

// collection routes (mounted at /api/v1/distribution-groups)
router.get('/', ensureAuthenticated, ctrl.listGroups);
router.post('/', ensureAuthenticated, ensureAdmin, ctrl.createGroup);
router.put('/:id', ensureAuthenticated, ensureAdmin, ctrl.updateGroup);
router.delete('/:id', ensureAuthenticated, ensureAdmin, ctrl.deleteGroup);

router.get('/:id/members', ensureAuthenticated, ctrl.getGroupMembers);
router.post('/:id/members', ensureAuthenticated, ensureAdmin, ctrl.addMember);
router.delete('/:id/members/:userId', ensureAuthenticated, ensureAdmin, ctrl.removeMember);

module.exports = router;
