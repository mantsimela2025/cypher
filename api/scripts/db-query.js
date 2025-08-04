#!/usr/bin/env node

const { db, client } = require('../src/db');
const {
  users, roles, permissions, rolePermissions, userRoles, userPreferences, accessRequests,
  emailLogs, emailTemplates, systems, assets, vulnerabilities, poams, controls, cves,
  assetCostManagement, assetGroups, assetLifecycle, assetVulnerabilities, artifacts,
  artifactCategories, artifactReferences, artifactTags
} = require('../src/db/schema');
const { eq, like, and, or, desc, asc } = require('drizzle-orm');

// Available queries
const queries = {
  // User queries
  'users': async () => {
    console.log('📋 All Users:');
    const result = await db.select().from(users).orderBy(users.createdAt);
    console.table(result);
  },

  'users:count': async () => {
    console.log('📊 User Count:');
    const result = await db.select({ count: users.id }).from(users);
    console.log(`Total users: ${result.length}`);
  },

  'users:active': async () => {
    console.log('✅ Active Users:');
    const result = await db.select().from(users).where(eq(users.status, 'active'));
    console.table(result);
  },

  // Role queries
  'roles': async () => {
    console.log('🎭 All Roles:');
    const result = await db.select().from(roles).orderBy(roles.name);
    console.table(result);
  },

  'roles:system': async () => {
    console.log('⚙️ System Roles:');
    const result = await db.select().from(roles).where(eq(roles.isSystem, true));
    console.table(result);
  },

  // Permission queries
  'permissions': async () => {
    console.log('🔐 All Permissions:');
    const result = await db.select().from(permissions).orderBy(permissions.category, permissions.name);
    console.table(result);
  },

  'permissions:by-category': async () => {
    console.log('📂 Permissions by Category:');
    const result = await db.select().from(permissions).orderBy(permissions.category);
    const grouped = result.reduce((acc, perm) => {
      const category = perm.category || 'uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(perm);
      return acc;
    }, {});
    
    Object.entries(grouped).forEach(([category, perms]) => {
      console.log(`\n📁 ${category.toUpperCase()}:`);
      console.table(perms);
    });
  },

  // User-Role relationships
  'user-roles': async () => {
    console.log('👥 User-Role Assignments:');
    const result = await db
      .select({
        userId: userRoles.userId,
        username: users.username,
        roleId: userRoles.roleId,
        roleName: roles.name,
        assignedAt: userRoles.assignedAt,
      })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .orderBy(users.username);
    console.table(result);
  },

  // Access request queries
  'access-requests': async () => {
    console.log('📝 All Access Requests:');
    const result = await db.select().from(accessRequests).orderBy(desc(accessRequests.createdAt));
    console.table(result);
  },

  'access-requests:pending': async () => {
    console.log('⏳ Pending Access Requests:');
    const result = await db.select().from(accessRequests)
      .where(eq(accessRequests.status, 'pending'))
      .orderBy(accessRequests.createdAt);
    console.table(result);
  },

  'access-requests:approved': async () => {
    console.log('✅ Approved Access Requests:');
    const result = await db.select().from(accessRequests)
      .where(eq(accessRequests.status, 'approved'))
      .orderBy(desc(accessRequests.processedAt));
    console.table(result);
  },

  'access-requests:rejected': async () => {
    console.log('❌ Rejected Access Requests:');
    const result = await db.select().from(accessRequests)
      .where(eq(accessRequests.status, 'rejected'))
      .orderBy(desc(accessRequests.processedAt));
    console.table(result);
  },

  'access-requests:with-processor': async () => {
    console.log('👤 Access Requests with Processor Info:');
    const result = await db
      .select({
        id: accessRequests.id,
        firstName: accessRequests.firstName,
        lastName: accessRequests.lastName,
        email: accessRequests.email,
        status: accessRequests.status,
        reason: accessRequests.reason,
        rejectionReason: accessRequests.rejectionReason,
        processedAt: accessRequests.processedAt,
        processedBy: accessRequests.processedBy,
        processorUsername: users.username,
        processorEmail: users.email,
        createdAt: accessRequests.createdAt,
      })
      .from(accessRequests)
      .leftJoin(users, eq(accessRequests.processedBy, users.id))
      .orderBy(desc(accessRequests.createdAt));
    console.table(result);
  },

  // Email log queries
  'email-logs': async () => {
    console.log('📧 All Email Logs:');
    const result = await db.select().from(emailLogs).orderBy(desc(emailLogs.createdAt)).limit(50);
    console.table(result);
  },

  'email-logs:failed': async () => {
    console.log('❌ Failed Email Logs:');
    const result = await db.select().from(emailLogs)
      .where(eq(emailLogs.status, 'failed'))
      .orderBy(desc(emailLogs.createdAt));
    console.table(result);
  },

  'email-logs:sent': async () => {
    console.log('✅ Sent Email Logs:');
    const result = await db.select().from(emailLogs)
      .where(eq(emailLogs.status, 'sent'))
      .orderBy(desc(emailLogs.createdAt))
      .limit(20);
    console.table(result);
  },

  'email-logs:by-category': async () => {
    console.log('📂 Email Logs by Category:');
    const result = await db.select().from(emailLogs).orderBy(emailLogs.category, desc(emailLogs.createdAt));

    const grouped = result.reduce((acc, log) => {
      const category = log.category || 'uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(log);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([category, logs]) => {
      console.log(`\n📁 ${category.toUpperCase()}:`);
      console.table(logs.slice(0, 10)); // Show first 10 per category
    });
  },

  // Email template queries
  'email-templates': async () => {
    console.log('📝 All Email Templates:');
    const result = await db.select().from(emailTemplates).orderBy(emailTemplates.name);
    console.table(result);
  },

  'email-templates:active': async () => {
    console.log('✅ Active Email Templates:');
    const result = await db.select().from(emailTemplates)
      .where(eq(emailTemplates.status, 'active'))
      .orderBy(emailTemplates.name);
    console.table(result);
  },

  'email-templates:by-type': async () => {
    console.log('📂 Email Templates by Type:');
    const result = await db.select().from(emailTemplates).orderBy(emailTemplates.type, emailTemplates.name);

    const grouped = result.reduce((acc, template) => {
      const type = template.type || 'uncategorized';
      if (!acc[type]) acc[type] = [];
      acc[type].push(template);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([type, templates]) => {
      console.log(`\n📁 ${type.toUpperCase()}:`);
      console.table(templates);
    });
  },

  // Integration data queries
  'systems': async () => {
    console.log('🏢 All Systems:');
    const result = await db.select().from(systems).orderBy(systems.name);
    console.table(result);
  },

  'assets': async () => {
    console.log('💻 All Assets:');
    const result = await db.select().from(assets).orderBy(desc(assets.lastSeen)).limit(50);
    console.table(result);
  },

  'vulnerabilities': async () => {
    console.log('🔓 Recent Vulnerabilities:');
    const result = await db.select().from(vulnerabilities).orderBy(desc(vulnerabilities.lastFound)).limit(50);
    console.table(result);
  },

  'vulnerabilities:critical': async () => {
    console.log('🚨 Critical Vulnerabilities:');
    const result = await db.select().from(vulnerabilities)
      .where(eq(vulnerabilities.severity, 4))
      .orderBy(desc(vulnerabilities.lastFound));
    console.table(result);
  },

  'poams': async () => {
    console.log('📋 All POAMs:');
    const result = await db.select().from(poams).orderBy(desc(poams.createdAt));
    console.table(result);
  },

  'poams:open': async () => {
    console.log('📋 Open POAMs:');
    const result = await db.select().from(poams)
      .where(eq(poams.status, 'open'))
      .orderBy(poams.scheduledCompletion);
    console.table(result);
  },

  'controls': async () => {
    console.log('🛡️ All Controls:');
    const result = await db.select().from(controls).orderBy(controls.controlId);
    console.table(result);
  },

  'controls:not-implemented': async () => {
    console.log('⚠️ Not Implemented Controls:');
    const result = await db.select().from(controls)
      .where(eq(controls.implementationStatus, 'not_implemented'))
      .orderBy(controls.priority);
    console.table(result);
  },

  'cves': async () => {
    console.log('🔍 Recent CVEs:');
    const result = await db.select().from(cves).orderBy(desc(cves.publishedDate)).limit(20);
    console.table(result);
  },

  // Asset management queries
  'asset-costs': async () => {
    console.log('💰 Asset Cost Management:');
    const result = await db.select().from(assetCostManagement).orderBy(desc(assetCostManagement.createdAt));
    console.table(result);
  },

  'asset-groups': async () => {
    console.log('👥 Asset Groups:');
    const result = await db.select().from(assetGroups).orderBy(assetGroups.name);
    console.table(result);
  },

  'asset-lifecycle': async () => {
    console.log('🔄 Asset Lifecycle:');
    const result = await db.select().from(assetLifecycle).orderBy(assetLifecycle.warrantyEndDate);
    console.table(result);
  },

  'asset-vulnerabilities': async () => {
    console.log('🔗 Asset-Vulnerability Relationships:');
    const result = await db.select().from(assetVulnerabilities)
      .orderBy(desc(assetVulnerabilities.lastDetected))
      .limit(50);
    console.table(result);
  },

  // Artifact management queries
  'artifacts': async () => {
    console.log('📄 All Artifacts:');
    const result = await db.select().from(artifacts).orderBy(desc(artifacts.createdAt));
    console.table(result);
  },

  'artifacts:pending': async () => {
    console.log('⏳ Pending Review Artifacts:');
    const result = await db.select().from(artifacts)
      .where(eq(artifacts.reviewStatus, 'pending'))
      .orderBy(desc(artifacts.createdAt));
    console.table(result);
  },

  'artifacts:expired': async () => {
    console.log('⚠️ Expired Artifacts:');
    const result = await db.select().from(artifacts)
      .where(and(
        artifacts.expiresAt !== null,
        artifacts.expiresAt < new Date()
      ))
      .orderBy(artifacts.expiresAt);
    console.table(result);
  },

  'artifact-categories': async () => {
    console.log('🏷️ Artifact Categories:');
    const result = await db.select().from(artifactCategories)
      .orderBy(artifactCategories.categoryId);
    console.table(result);
  },

  'artifact-references': async () => {
    console.log('🔗 Artifact References:');
    const result = await db.select().from(artifactReferences)
      .orderBy(desc(artifactReferences.createdAt));
    console.table(result);
  },

  'artifact-tags': async () => {
    console.log('🏷️ Artifact Tags:');
    const result = await db.select().from(artifactTags)
      .orderBy(artifactTags.tagId);
    console.table(result);
  },

  // Role-Permission relationships
  'role-permissions': async () => {
    console.log('🔗 Role-Permission Assignments:');
    const result = await db
      .select({
        roleId: rolePermissions.roleId,
        roleName: roles.name,
        permissionId: rolePermissions.permissionId,
        permissionName: permissions.name,
        category: permissions.category,
      })
      .from(rolePermissions)
      .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .orderBy(roles.name, permissions.category);
    console.table(result);
  },

  // Database info
  'tables': async () => {
    console.log('📊 Database Tables:');
    const result = await client`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.table(result);
  },

  'schema': async () => {
    console.log('🏗️ Table Schemas:');
    const result = await client`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position
    `;
    
    const grouped = result.reduce((acc, col) => {
      if (!acc[col.table_name]) acc[col.table_name] = [];
      acc[col.table_name].push(col);
      return acc;
    }, {});
    
    Object.entries(grouped).forEach(([table, columns]) => {
      console.log(`\n📋 ${table.toUpperCase()}:`);
      console.table(columns);
    });
  },

  // Help
  'help': () => {
    console.log('🔍 Available Queries:');
    console.log('');
    console.log('👥 Users:');
    console.log('  users              - List all users');
    console.log('  users:count        - Count total users');
    console.log('  users:active       - List active users');
    console.log('');
    console.log('🎭 Roles:');
    console.log('  roles              - List all roles');
    console.log('  roles:system       - List system roles');
    console.log('');
    console.log('🔐 Permissions:');
    console.log('  permissions        - List all permissions');
    console.log('  permissions:by-category - Group permissions by category');
    console.log('');
    console.log('🔗 Relationships:');
    console.log('  user-roles         - Show user-role assignments');
    console.log('  role-permissions   - Show role-permission assignments');
    console.log('');
    console.log('📝 Access Requests:');
    console.log('  access-requests              - List all access requests');
    console.log('  access-requests:pending      - List pending requests');
    console.log('  access-requests:approved     - List approved requests');
    console.log('  access-requests:rejected     - List rejected requests');
    console.log('  access-requests:with-processor - List requests with processor info');
    console.log('');
    console.log('📧 Email Logs:');
    console.log('  email-logs                   - List recent email logs');
    console.log('  email-logs:failed            - List failed emails');
    console.log('  email-logs:sent              - List sent emails');
    console.log('  email-logs:by-category       - Group emails by category');
    console.log('');
    console.log('📝 Email Templates:');
    console.log('  email-templates              - List all email templates');
    console.log('  email-templates:active       - List active templates');
    console.log('  email-templates:by-type      - Group templates by type');
    console.log('');
    console.log('🏢 Integration Data:');
    console.log('  systems                      - List all systems');
    console.log('  assets                       - List recent assets');
    console.log('  vulnerabilities              - List recent vulnerabilities');
    console.log('  vulnerabilities:critical     - List critical vulnerabilities');
    console.log('  poams                        - List all POAMs');
    console.log('  poams:open                   - List open POAMs');
    console.log('  controls                     - List all controls');
    console.log('  controls:not-implemented     - List not implemented controls');
    console.log('  cves                         - List recent CVEs');
    console.log('');
    console.log('💰 Asset Management:');
    console.log('  asset-costs                  - List asset cost management');
    console.log('  asset-groups                 - List asset groups');
    console.log('  asset-lifecycle              - List asset lifecycle data');
    console.log('  asset-vulnerabilities        - List asset-vulnerability relationships');
    console.log('');
    console.log('📄 Artifact Management:');
    console.log('  artifacts                    - List all artifacts');
    console.log('  artifacts:pending            - List pending review artifacts');
    console.log('  artifacts:expired            - List expired artifacts');
    console.log('  artifact-categories          - List artifact categories');
    console.log('  artifact-references          - List artifact references');
    console.log('  artifact-tags                - List artifact tags');
    console.log('');
    console.log('📊 Database:');
    console.log('  tables             - List all tables');
    console.log('  schema             - Show table schemas');
    console.log('');
    console.log('Usage: npm run db:query <query-name>');
    console.log('Example: npm run db:query users');
  }
};

// Main function
async function main() {
  const queryName = process.argv[2];
  
  if (!queryName) {
    queries.help();
    process.exit(0);
  }

  if (!queries[queryName]) {
    console.error(`❌ Unknown query: ${queryName}`);
    console.log('');
    queries.help();
    process.exit(1);
  }

  try {
    console.log(`🔍 Running query: ${queryName}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await queries[queryName]();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Query completed successfully');
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

// Run the main function
main();
