const { and, eq, sql } = require('drizzle-orm');
const db = require('../db');
const { distributionGroups, distributionGroupMembers, users } = require('../db/schema');

class DistributionGroupService {
  async createGroup({ name, description, createdBy }) {
    const [inserted] = await db.insert(distributionGroups)
      .values({ name, description, createdBy })
      .returning();
    return inserted;
  }

  async updateGroup(id, { name, description }) {
    const [updated] = await db.update(distributionGroups)
      .set({ name, description, updatedAt: sql`NOW()` })
      .where(eq(distributionGroups.id, id))
      .returning();
    return updated;
  }

  async deleteGroup(id) {
    // cascade delete members first
    await db.delete(distributionGroupMembers).where(eq(distributionGroupMembers.groupId, id));
    const res = await db.delete(distributionGroups).where(eq(distributionGroups.id, id));
    return res;
  }

  async getAllGroups() {
    // Return groups with memberCount
    const rows = await db.select({
      id: distributionGroups.id,
      name: distributionGroups.name,
      description: distributionGroups.description,
      createdBy: distributionGroups.createdBy,
      createdAt: distributionGroups.createdAt,
      updatedAt: distributionGroups.updatedAt,
      memberCount: sql`COUNT(${distributionGroupMembers.id})`.as('member_count'),
    })
      .from(distributionGroups)
      .leftJoin(distributionGroupMembers, eq(distributionGroupMembers.groupId, distributionGroups.id))
      .groupBy(
        distributionGroups.id,
        distributionGroups.name,
        distributionGroups.description,
        distributionGroups.createdBy,
        distributionGroups.createdAt,
        distributionGroups.updatedAt
      );
    return rows;
  }

  async addUserToGroup(userId, groupId) {
    // prevent duplicates
    const existing = await db.select().from(distributionGroupMembers)
      .where(and(eq(distributionGroupMembers.groupId, groupId), eq(distributionGroupMembers.userId, userId)));
    if (existing.length) return existing[0];
    const [inserted] = await db.insert(distributionGroupMembers)
      .values({ userId, groupId })
      .returning();
    return inserted;
  }

  async removeUserFromGroup(userId, groupId) {
    const res = await db.delete(distributionGroupMembers)
      .where(and(eq(distributionGroupMembers.groupId, groupId), eq(distributionGroupMembers.userId, userId)));
    return res;
  }

  async getUserGroups(userId) {
    const rows = await db.select({
      id: distributionGroups.id,
      name: distributionGroups.name,
      description: distributionGroups.description,
    })
      .from(distributionGroupMembers)
      .innerJoin(distributionGroups, eq(distributionGroupMembers.groupId, distributionGroups.id))
      .where(eq(distributionGroupMembers.userId, userId));
    return rows;
  }

  async getGroupMembers(groupId) {
    const rows = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
    })
      .from(distributionGroupMembers)
      .innerJoin(users, eq(distributionGroupMembers.userId, users.id))
      .where(eq(distributionGroupMembers.groupId, groupId));
    return rows;
  }
}

module.exports = new DistributionGroupService();
