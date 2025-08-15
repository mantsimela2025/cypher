const DistributionGroupService = require('../services/DistributionGroupService');

exports.listGroups = async (req, res) => {
  try {
    const groups = await DistributionGroupService.getAllGroups();
    res.json({ success: true, data: groups, message: `Retrieved  distribution groups` });
  } catch (err) {
    console.error('listGroups error', err);
    res.status(500).json({ success: false, error: 'Failed to list groups' });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, error: 'Invalid group ID' });
    const group = await DistributionGroupService.getGroupById(id);
    if (!group) return res.status(404).json({ success: false, error: 'Distribution group not found' });
    res.json({ success: true, data: group });
  } catch (err) {
    console.error('getGroupById error', err);
    res.status(500).json({ success: false, error: 'Failed to get group' });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const createdBy = req.user?.id || req.body.createdBy; // fallback for tests
    if (!name || !createdBy) return res.status(400).json({ success: false, error: 'name and createdBy are required' });
    const group = await DistributionGroupService.createGroup({ name, description, createdBy });
    res.status(201).json({ success: true, data: group, message: `Group "" created` });
  } catch (err) {
    console.error('createGroup error', err);
    res.status(500).json({ success: false, error: 'Failed to create group' });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description } = req.body;
    const updated = await DistributionGroupService.updateGroup(id, { name, description });
    res.json({ success: true, data: updated, message: 'Group updated' });
  } catch (err) {
    console.error('updateGroup error', err);
    res.status(500).json({ success: false, error: 'Failed to update group' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await DistributionGroupService.deleteGroup(id);
    res.json({ success: true, message: 'Group deleted' });
  } catch (err) {
    console.error('deleteGroup error', err);
    res.status(500).json({ success: false, error: 'Failed to delete group' });
  }
};

exports.addMember = async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });
    const member = await DistributionGroupService.addUserToGroup(userId, groupId);
    res.status(201).json({ success: true, data: member, message: 'Member added' });
  } catch (err) {
    console.error('addMember error', err);
    res.status(500).json({ success: false, error: 'Failed to add member' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const userId = parseInt(req.params.userId, 10);
    await DistributionGroupService.removeUserFromGroup(userId, groupId);
    res.json({ success: true, message: 'Member removed' });
  } catch (err) {
    console.error('removeMember error', err);
    res.status(500).json({ success: false, error: 'Failed to remove member' });
  }
};

exports.getUserGroups = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const groups = await DistributionGroupService.getUserGroups(userId);
    res.json({ success: true, data: groups });
  } catch (err) {
    console.error('getUserGroups error', err);
    res.status(500).json({ success: false, error: 'Failed to get user groups' });
  }
};

exports.getGroupMembers = async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const members = await DistributionGroupService.getGroupMembers(groupId);
    res.json({ success: true, data: members });
  } catch (err) {
    console.error('getGroupMembers error', err);
    res.status(500).json({ success: false, error: 'Failed to get group members' });
  }
};

exports.getAvailableUsers = async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const search = req.query.search || '';
    const users = await DistributionGroupService.searchAvailableUsers(groupId, search);
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('getAvailableUsers error', err);
    res.status(500).json({ success: false, error: 'Failed to search available users' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await DistributionGroupService.getGroupStatistics();
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('getStats error', err);
    res.status(500).json({ success: false, error: 'Failed to get group statistics' });
  }
};
