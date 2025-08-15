#!/usr/bin/env node
require('dotenv').config();
const { drizzle } = require('drizzle-orm/postgres-js');
const { eq, and } = require('drizzle-orm');
const postgres = require('postgres');
const { roles, permissions, rolePermissions } = require('../src/db/schema');

const client = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false }
});
const db = drizzle(client, { schema: { roles, permissions, rolePermissions } });

async function assignNlqPermissions() {
  try {
    console.log('🔧 Assigning NL Query permissions to Administrator role...');

    // Find Administrator role
    const adminRole = await db.select().from(roles).where(eq(roles.name, 'Administrator')).limit(1);
    if (!adminRole.length) {
      console.error('❌ Administrator role not found');
      return;
    }

    const adminRoleId = adminRole[0].id;
    console.log(`👤 Found Administrator role with ID: ${adminRoleId}`);

    // Find all NL Query permissions
    const nlQueryPerms = await db.select()
      .from(permissions)
      .where(eq(permissions.category, 'nl_query'));

    if (!nlQueryPerms.length) {
      console.error('❌ No NL Query permissions found in database');
      return;
    }

    console.log(`📋 Found ${nlQueryPerms.length} NL Query permissions to assign`);

    // Check which permissions are already assigned
    const existingAssignments = await db.select()
      .from(rolePermissions)
      .where(and(
        eq(rolePermissions.roleId, adminRoleId),
        eq(rolePermissions.permissionId, nlQueryPerms[0].id) // Check if any NL Query perms exist
      ));

    let assignedCount = 0;
    for (const permission of nlQueryPerms) {
      try {
        // Check if this specific permission is already assigned
        const existing = await db.select()
          .from(rolePermissions)
          .where(and(
            eq(rolePermissions.roleId, adminRoleId),
            eq(rolePermissions.permissionId, permission.id)
          ));

        if (existing.length === 0) {
          // Assign permission to role
          await db.insert(rolePermissions).values({
            roleId: adminRoleId,
            permissionId: permission.id
          });
          console.log(`✅ Assigned permission: ${permission.name}`);
          assignedCount++;
        } else {
          console.log(`⏭️  Permission already assigned: ${permission.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to assign permission ${permission.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully assigned ${assignedCount} new NL Query permissions to Administrator role`);

    // Verify assignments
    console.log('\n🔍 Verifying permission assignments...');
    const assignedPerms = await client`
      SELECT p.name, p.description
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ${adminRoleId} AND p.category = 'nl_query'
      ORDER BY p.name
    `;
    console.log(`✅ Verified: ${assignedPerms.length} NL Query permissions now assigned to Administrator`);
    
    assignedPerms.forEach(perm => {
      console.log(`   - ${perm.name}: ${perm.description}`);
    });

  } catch (error) {
    console.error('❌ Error assigning NL Query permissions:', error);
  } finally {
    await client.end();
  }
}

assignNlqPermissions();