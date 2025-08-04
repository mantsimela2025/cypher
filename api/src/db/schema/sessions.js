const { pgTable, varchar, json, timestamp } = require('drizzle-orm/pg-core');

// Session table - stores user session data
const sessions = pgTable('session', {
  sid: varchar('sid', { length: 255 }).primaryKey(),
  sess: json('sess').notNull(),
  expire: timestamp('expire', { withTimezone: true }).notNull()
});

module.exports = {
  sessions
};
