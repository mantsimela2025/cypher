const { pgTable, serial, varchar, timestamp, pgEnum } = require('drizzle-orm/pg-core');

// Define enums to match your database
const userRoleEnum = pgEnum('enum_users_role', ['user', 'admin', 'moderator']);
const userStatusEnum = pgEnum('enum_users_status', ['active', 'inactive', 'suspended']);

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  role: userRoleEnum('role').default('user'),
  status: userStatusEnum('status').default('active'),
  authMethod: varchar('auth_method', { length: 255 }).default('password'),
  certificateSubject: varchar('certificate_subject', { length: 255 }),
  certificateExpiry: timestamp('certificate_expiry', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
});

module.exports = {
  users,
  userRoleEnum,
  userStatusEnum,
};
