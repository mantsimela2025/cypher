#!/usr/bin/env node

const { db, client } = require('../src/db');
const { users, roles, permissions, rolePermissions, userRoles, accessRequests } = require('../src/db/schema');
const emailTemplateService = require('../src/services/emailTemplateService');
const bcrypt = require('bcryptjs');
const { eq } = require('drizzle-orm');

// Seeder functions for each table
const seeders = {
  permissions: async (options = {}) => {
    console.log('📝 Seeding permissions...');

    const defaultPermissions = [
      { name: 'users:read', category: 'users', description: 'View user information' },
      { name: 'users:write', category: 'users', description: 'Create and update users' },
      { name: 'users:delete', category: 'users', description: 'Delete users' },
      { name: 'roles:read', category: 'roles', description: 'View roles' },
      { name: 'roles:write', category: 'roles', description: 'Create and update roles' },
      { name: 'roles:delete', category: 'roles', description: 'Delete roles' },
      { name: 'permissions:read', category: 'permissions', description: 'View permissions' },
      { name: 'permissions:write', category: 'permissions', description: 'Create and update permissions' },
      { name: 'admin:dashboard', category: 'admin', description: 'Access admin dashboard' },
      { name: 'system:manage', category: 'system', description: 'Manage system settings' },
      { name: 'reports:read', category: 'reports', description: 'View reports' },
      { name: 'reports:write', category: 'reports', description: 'Create and update reports' },
    ];

    const createdPermissions = [];
    let created = 0, skipped = 0;

    for (const permission of defaultPermissions) {
      try {
        const [existing] = await db.select().from(permissions).where(eq(permissions.name, permission.name));

        if (!existing) {
          const [newPermission] = await db.insert(permissions).values(permission).returning();
          createdPermissions.push(newPermission);
          created++;
          console.log(`  ✅ Created: ${permission.name}`);
        } else {
          createdPermissions.push(existing);
          skipped++;
          if (options.verbose) console.log(`  ⏭️  Exists: ${permission.name}`);
        }
      } catch (error) {
        console.log(`  ❌ Failed: ${permission.name} - ${error.message}`);
      }
    }

    console.log(`  📊 Permissions: ${created} created, ${skipped} skipped`);
    return createdPermissions;
  },

  roles: async (options = {}) => {
    console.log('🎭 Seeding roles...');

    const defaultRoles = [
      { name: 'admin', description: 'Full system access', isSystem: true, isDefault: false },
      { name: 'user', description: 'Basic user access', isSystem: true, isDefault: true },
      { name: 'moderator', description: 'Moderate content and users', isSystem: false, isDefault: false },
      { name: 'viewer', description: 'Read-only access', isSystem: false, isDefault: false },
    ];

    const createdRoles = [];
    let created = 0, skipped = 0;

    for (const role of defaultRoles) {
      try {
        const [existing] = await db.select().from(roles).where(eq(roles.name, role.name));

        if (!existing) {
          const [newRole] = await db.insert(roles).values(role).returning();
          createdRoles.push(newRole);
          created++;
          console.log(`  ✅ Created: ${role.name}`);
        } else {
          createdRoles.push(existing);
          skipped++;
          if (options.verbose) console.log(`  ⏭️  Exists: ${role.name}`);
        }
      } catch (error) {
        console.log(`  ❌ Failed: ${role.name} - ${error.message}`);
      }
    }

    console.log(`  📊 Roles: ${created} created, ${skipped} skipped`);
    return createdRoles;
  },

  'role-permissions': async (options = {}) => {
    console.log('🔗 Seeding role-permission assignments...');

    // Get all roles and permissions
    const allRoles = await db.select().from(roles);
    const allPermissions = await db.select().from(permissions);

    const rolePermissionMap = {
      admin: ['*'], // All permissions
      moderator: ['users:read', 'users:write', 'roles:read', 'reports:read'],
      user: ['users:read'],
      viewer: ['users:read', 'reports:read'],
    };

    let assigned = 0;

    for (const [roleName, permissionNames] of Object.entries(rolePermissionMap)) {
      const role = allRoles.find(r => r.name === roleName);
      if (!role) {
        console.log(`  ⚠️  Role not found: ${roleName}`);
        continue;
      }

      // Clear existing permissions if force option is used
      if (options.force) {
        await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
        if (options.verbose) console.log(`  🧹 Cleared existing permissions for: ${roleName}`);
      }

      // Get permissions to assign
      let permissionsToAssign;
      if (permissionNames.includes('*')) {
        permissionsToAssign = allPermissions;
      } else {
        permissionsToAssign = allPermissions.filter(p => permissionNames.includes(p.name));
      }

      // Check existing assignments
      const existingAssignments = await db
        .select()
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, role.id));

      for (const permission of permissionsToAssign) {
        const exists = existingAssignments.some(rp => rp.permissionId === permission.id);

        if (!exists) {
          try {
            await db.insert(rolePermissions).values({
              roleId: role.id,
              permissionId: permission.id,
            });
            assigned++;
            if (options.verbose) console.log(`  ✅ Assigned ${permission.name} to ${roleName}`);
          } catch (error) {
            console.log(`  ❌ Failed to assign ${permission.name} to ${roleName}: ${error.message}`);
          }
        }
      }
    }

    console.log(`  📊 Role-Permissions: ${assigned} assignments created`);
  },

  users: async (options = {}) => {
    console.log('👤 Seeding users...');

    const defaultUsers = [
      {
        username: 'admin',
        email: 'admin@rasdash.com',
        password: 'Admin123!',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        status: 'active',
        roles: ['admin']
      },
      {
        username: 'testuser',
        email: 'user@rasdash.com',
        password: 'User123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        status: 'active',
        roles: ['user']
      }
    ];

    let created = 0, skipped = 0;

    for (const userData of defaultUsers) {
      try {
        const [existing] = await db.select().from(users).where(eq(users.email, userData.email));

        if (!existing) {
          const hashedPassword = await bcrypt.hash(userData.password, 12);
          const { roles: userRoleNames, ...userDataWithoutRoles } = userData;

          const [newUser] = await db.insert(users).values({
            ...userDataWithoutRoles,
            password: hashedPassword,
            passwordHash: hashedPassword,
          }).returning();

          // Assign roles to user
          const allRoles = await db.select().from(roles);
          for (const roleName of userRoleNames) {
            const role = allRoles.find(r => r.name === roleName);
            if (role) {
              await db.insert(userRoles).values({
                userId: newUser.id,
                roleId: role.id,
              });
            }
          }

          created++;
          console.log(`  ✅ Created: ${userData.username} (${userData.email})`);
          console.log(`  🔑 Password: ${userData.password}`);
        } else {
          skipped++;
          if (options.verbose) console.log(`  ⏭️  Exists: ${userData.email}`);
        }
      } catch (error) {
        console.log(`  ❌ Failed: ${userData.username} - ${error.message}`);
      }
    }

    console.log(`  📊 Users: ${created} created, ${skipped} skipped`);
    if (created > 0) {
      console.log(`  ⚠️  Please change default passwords after first login!`);
    }
  },

  'access-requests': async (options = {}) => {
    console.log('📝 Seeding access requests...');

    const defaultAccessRequests = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        status: 'pending',
        reason: 'Need access to review quarterly reports and user analytics for business planning.',
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        status: 'approved',
        reason: 'Require system access for new role as data analyst.',
        processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'bob.wilson@external.com',
        status: 'rejected',
        reason: 'External consultant requesting temporary access.',
        rejectionReason: 'External access not permitted without security clearance.',
        processedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@partner.com',
        status: 'pending',
        reason: 'Partner organization representative needs access for joint project collaboration.',
      },
    ];

    let created = 0, skipped = 0;

    for (const requestData of defaultAccessRequests) {
      try {
        const [existing] = await db.select().from(accessRequests).where(eq(accessRequests.email, requestData.email));

        if (!existing) {
          // For approved/rejected requests, try to find an admin user to set as processor
          let processedBy = null;
          if (requestData.status !== 'pending') {
            const [adminUser] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
            if (adminUser) {
              processedBy = adminUser.id;
            }
          }

          const [newRequest] = await db.insert(accessRequests).values({
            ...requestData,
            processedBy,
          }).returning();

          created++;
          console.log(`  ✅ Created: ${requestData.firstName} ${requestData.lastName} (${requestData.status})`);
        } else {
          skipped++;
          if (options.verbose) console.log(`  ⏭️  Exists: ${requestData.email}`);
        }
      } catch (error) {
        console.log(`  ❌ Failed: ${requestData.email} - ${error.message}`);
      }
    }

    console.log(`  📊 Access Requests: ${created} created, ${skipped} skipped`);
  },

  'email-templates': async (options = {}) => {
    console.log('📧 Seeding email templates...');

    try {
      const results = await emailTemplateService.seedDefaultTemplates();

      let created = 0, skipped = 0, failed = 0;

      results.forEach(result => {
        if (result.action === 'created') {
          created++;
          console.log(`  ✅ Created: ${result.template.name}`);
        } else if (result.action === 'skipped') {
          skipped++;
          if (options.verbose) console.log(`  ⏭️  Exists: ${result.template.name}`);
        } else if (result.action === 'failed') {
          failed++;
          console.log(`  ❌ Failed: ${result.templateName} - ${result.error}`);
        }
      });

      console.log(`  📊 Email Templates: ${created} created, ${skipped} skipped, ${failed} failed`);
    } catch (error) {
      console.log(`  ❌ Failed to seed email templates: ${error.message}`);
    }
  },
};

// Main seeding function
async function seedDatabase() {
  const args = process.argv.slice(2);

  // Parse arguments
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    force: args.includes('--force') || args.includes('-f'),
    help: args.includes('--help') || args.includes('-h'),
  };

  // Show help
  if (options.help || args.length === 0) {
    console.log('🌱 Database Seeder');
    console.log('');
    console.log('Usage: npm run db:seed <tables> [options]');
    console.log('');
    console.log('Tables:');
    console.log('  permissions        - Seed permissions table');
    console.log('  roles             - Seed roles table');
    console.log('  role-permissions  - Seed role-permission assignments');
    console.log('  users             - Seed users table');
    console.log('  access-requests   - Seed access requests table');
    console.log('  email-templates   - Seed email templates');
    console.log('  all               - Seed all tables in order');
    console.log('');
    console.log('Options:');
    console.log('  --verbose, -v     - Show detailed output');
    console.log('  --force, -f       - Force recreate assignments (clears existing)');
    console.log('  --help, -h        - Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  npm run db:seed permissions roles');
    console.log('  npm run db:seed all --verbose');
    console.log('  npm run db:seed role-permissions --force');
    console.log('  npm run db:seed access-requests --verbose');
    return;
  }

  // Get tables to seed
  const tablesToSeed = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));

  if (tablesToSeed.includes('all')) {
    tablesToSeed.splice(tablesToSeed.indexOf('all'), 1);
    tablesToSeed.push('permissions', 'roles', 'role-permissions', 'users', 'access-requests', 'email-templates');
  }

  // Remove duplicates and maintain order
  const orderedTables = ['permissions', 'roles', 'role-permissions', 'users', 'access-requests', 'email-templates'];
  const uniqueTables = orderedTables.filter(table => tablesToSeed.includes(table));

  if (uniqueTables.length === 0) {
    console.log('❌ No valid tables specified. Use --help for usage information.');
    return;
  }

  try {
    console.log('🌱 Starting database seeding...');
    console.log(`📋 Tables to seed: ${uniqueTables.join(', ')}`);
    if (options.force) console.log('⚠️  Force mode: Will recreate assignments');
    console.log('');

    // Run seeders in order
    for (const table of uniqueTables) {
      if (seeders[table]) {
        await seeders[table](options);
        console.log('');
      } else {
        console.log(`❌ Unknown table: ${table}`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
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

// Run the seeder
seedDatabase();
