const { serial, text, jsonb, doublePrecision, timestamp, varchar } = require('drizzle-orm/pg-core');

module.exports = {
  awsInfrastructureRecommendations: {
    id: serial('id').primaryKey(),
    systemType: varchar('system_type', { length: 64 }),
    requirements: jsonb('requirements'), // SystemRequirements
    architecture: jsonb('architecture'), // Full architecture recommendation
    estimatedMonthlyCost: doublePrecision('estimated_monthly_cost'),
    complianceFeatures: jsonb('compliance_features'),
    scalingStrategy: text('scaling_strategy'),
    backupStrategy: text('backup_strategy'),
    securityControls: jsonb('security_controls'),
    deploymentSteps: jsonb('deployment_steps'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
  }
};
