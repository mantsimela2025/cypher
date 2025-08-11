const { pgTable, serial, varchar, text, integer, timestamp } = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');
const { users } = require('./users');

const distributionGroups = pgTable('distribution_groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

const distributionGroupMembers = pgTable('distribution_group_members', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').references(() => distributionGroups.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

const distributionGroupRelations = relations(distributionGroups, ({ many, one }) => ({
  members: many(distributionGroupMembers),
  createdByUser: one(users, {
    fields: [distributionGroups.createdBy],
    references: [users.id],
  }),
}));

const distributionGroupMemberRelations = relations(distributionGroupMembers, ({ one }) => ({
  group: one(distributionGroups, {
    fields: [distributionGroupMembers.groupId],
    references: [distributionGroups.id],
  }),
  user: one(users, {
    fields: [distributionGroupMembers.userId],
    references: [users.id],
  }),
}));

module.exports = {
  distributionGroups,
  distributionGroupMembers,
  distributionGroupRelations,
  distributionGroupMemberRelations,
};
