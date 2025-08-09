const { pgTable, serial, varchar, text, timestamp, integer, pgEnum } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Define the status enum to match your database
const accessRequestStatusEnum = pgEnum('enum_access_requests_status', ['pending', 'approved', 'rejected']);

const accessRequests = pgTable('access_requests', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  status: accessRequestStatusEnum('status').default('pending'),
  reason: text('reason'),
  rejectionReason: text('rejection_reason'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  processedBy: integer('processed_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  accessRequests,
  accessRequestStatusEnum,
};
