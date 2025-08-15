const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/distributionGroupsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// collection routes (mounted at /api/v1/distribution-groups)
router.get('/', authenticateToken, ctrl.listGroups);
router.get('/:id', authenticateToken, ctrl.getGroupById);
router.post('/', authenticateToken, requireRole(['admin']), ctrl.createGroup);
router.put('/:id', authenticateToken, requireRole(['admin']), ctrl.updateGroup);
router.delete('/:id', authenticateToken, requireRole(['admin']), ctrl.deleteGroup);

router.get('/:id/members', authenticateToken, ctrl.getGroupMembers);
router.post('/:id/members', authenticateToken, requireRole(['admin']), ctrl.addMember);
router.delete('/:id/members/:userId', authenticateToken, requireRole(['admin']), ctrl.removeMember);

router.get('/:id/available-users', authenticateToken, ctrl.getAvailableUsers);
router.get('/stats/summary', authenticateToken, requireRole(['admin']), ctrl.getStats);

module.exports = router;
