const { and, eq, sql } = require('drizzle-orm');
const { db } = require('../db');
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
      memberCount: sql`COUNT(${distributionGroupMembers.groupId})`.as('member_count'),
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

  async getGroupById(id) {
    const rows = await db.select({
      id: distributionGroups.id,
      name: distributionGroups.name,
      description: distributionGroups.description,
      createdAt: distributionGroups.createdAt,
      updatedAt: distributionGroups.updatedAt,
      memberCount: sql`COUNT(${distributionGroupMembers.groupId})`.as('member_count'),
    })
      .from(distributionGroups)
      .leftJoin(distributionGroupMembers, eq(distributionGroupMembers.groupId, distributionGroups.id))
      .where(eq(distributionGroups.id, id))
      .groupBy(
        distributionGroups.id,
        distributionGroups.name,
        distributionGroups.description,
        distributionGroups.createdAt,
        distributionGroups.updatedAt
      );
    return rows?.[0] || null;
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
      firstName: users.firstName,
      lastName: users.lastName,
    })
      .from(distributionGroupMembers)
      .innerJoin(users, eq(distributionGroupMembers.userId, users.id))
      .where(eq(distributionGroupMembers.groupId, groupId));
    return rows;
  }

  async searchAvailableUsers(groupId, searchTerm) {
    // Users not in the group, optional search
    let where = and(eq(distributionGroupMembers.groupId, groupId));
    // Build subquery for users in group
    const sub = db.select({ userId: distributionGroupMembers.userId })
      .from(distributionGroupMembers)
      .where(eq(distributionGroupMembers.groupId, groupId));

    // Base query: users not in subquery
    let query = db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
    }).from(users)
      .where(sql`${users.id} NOT IN (${sub})`);

    if (searchTerm) {
      query = db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      }).from(users)
        .where(sql`${users.id} NOT IN (${sub}) AND (
          ${users.username} ILIKE ${`%${searchTerm}%`} OR
          ${users.email} ILIKE ${`%${searchTerm}%`} OR
          ${users.firstName} ILIKE ${`%${searchTerm}%`} OR
          ${users.lastName} ILIKE ${`%${searchTerm}%`}
        )`);
    }

    const rows = await query;
    return rows;
  }

  async getGroupStatistics() {
    const [{ total: totalGroups }] = await db.select({ total: sql`COUNT(*)` }).from(distributionGroups);
    const [{ total: totalMembers }] = await db.select({ total: sql`COUNT(*)` }).from(distributionGroupMembers);

    const topGroups = await db.select({
      name: distributionGroups.name,
      memberCount: sql`COUNT(${distributionGroupMembers.groupId})`.as('member_count'),
    })
      .from(distributionGroups)
      .leftJoin(distributionGroupMembers, eq(distributionGroupMembers.groupId, distributionGroups.id))
      .groupBy(distributionGroups.id, distributionGroups.name)
      .orderBy(sql`member_count DESC`)
      .limit(5);

    return {
      totalGroups: Number(totalGroups) || 0,
      totalMembers: Number(totalMembers) || 0,
      averageMembersPerGroup: Number(totalGroups) > 0 ? Number(totalMembers) / Number(totalGroups) : 0,
      topGroups,
    };
  }
}


module.exports = new DistributionGroupService();
