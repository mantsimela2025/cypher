const DistributionGroupService = require('../services/DistributionGroupService');

exports.listGroups = async (req, res) => {
  try {
    const groups = await DistributionGroupService.getAllGroups();
    res.json({ success: true, data: groups });
  } catch (err) {
    console.error('listGroups error', err);
    res.status(500).json({ success: false, error: 'Failed to list groups' });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const createdBy = req.user?.id || req.body.createdBy; // fallback for tests
    if (!name || !createdBy) return res.status(400).json({ success: false, error: 'name and createdBy are required' });
    const group = await DistributionGroupService.createGroup({ name, description, createdBy });
    res.status(201).json({ success: true, data: group });
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
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateGroup error', err);
    res.status(500).json({ success: false, error: 'Failed to update group' });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await DistributionGroupService.deleteGroup(id);
    res.json({ success: true });
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
    res.status(201).json({ success: true, data: member });
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
    res.json({ success: true });
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
