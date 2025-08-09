const { serial, integer, varchar, text, timestamp, jsonb } = require('drizzle-orm/pg-core');

module.exports = {
  awsDeploymentProgress: {
    id: serial('id').primaryKey(),
    deploymentId: integer('deployment_id').references('awsInfrastructureDeployments.id'),
    stepId: varchar('step_id', { length: 64 }),
    status: varchar('status', { length: 32 }), // pending, in-progress, completed, failed
    startTime: timestamp('start_time'),
    endTime: timestamp('end_time'),
    error: text('error'),
    resourceId: varchar('resource_id', { length: 128 }),
    result: jsonb('result'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
  }
};
