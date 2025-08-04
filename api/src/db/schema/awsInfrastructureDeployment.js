const { serial, integer, text, jsonb, doublePrecision, timestamp, varchar } = require('drizzle-orm/pg-core');

module.exports = {
  awsInfrastructureDeployments: {
    id: serial('id').primaryKey(),
    recommendationId: integer('recommendation_id').references('awsInfrastructureRecommendations.id'),
    deploymentId: varchar('deployment_id', { length: 128 }),
    status: varchar('status', { length: 32 }), // pending, in-progress, completed, failed
    resources: jsonb('resources'), // deployed resources info
    steps: jsonb('steps'), // deployment steps and progress
    error: text('error'),
    startedAt: timestamp('started_at').defaultNow(),
    endedAt: timestamp('ended_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
  }
};
