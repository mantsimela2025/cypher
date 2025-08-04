#!/usr/bin/env node

/**
 * Add Asset Management Permissions to Database
 * This script adds the required permissions for asset management operations
 */

const { db } = require('../src/db');
const { permissions, roles, rolePermissions } = require('../src/db/schema');
const { eq } = require('drizzle-orm');

async function addAssetManagementPermissions() {
  try {
    console.log('🔐 Adding Asset Management Permissions...\n');

    // Define asset management permissions
    const assetManagementPermissions = [
      {
        name: 'asset_management:read',
        category: 'asset_management',
        description: 'View asset management data including lifecycle, costs, and analytics'
      },
      {
        name: 'asset_management:create',
        category: 'asset_management',
        description: 'Create new asset management records'
      },
      {
        name: 'asset_management:update',
        category: 'asset_management',
        description: 'Update existing asset management records'
      },
      {
        name: 'asset_management:delete',
        category: 'asset_management',
        description: 'Delete asset management records'
      }
    ];

    // Insert permissions
    console.log('📝 Creating permissions...');
    for (const permission of assetManagementPermissions) {
      try {
        const [result] = await db
          .insert(permissions)
          .values(permission)
          .onConflictDoNothing()
          .returning();
        
        if (result) {
          console.log(`   ✅ Created: ${permission.name}`);
        } else {
          console.log(`   ℹ️  Already exists: ${permission.name}`);
        }
      } catch (error) {
        console.log(`   ❌ Error creating ${permission.name}:`, error.message);
      }
    }

    // Get all permissions we just created/verified
    const createdPermissions = await db
      .select()
      .from(permissions)
      .where(eq(permissions.category, 'asset_management'));

    console.log(`\n📊 Found ${createdPermissions.length} asset management permissions`);

    // Assign permissions to admin role
    console.log('\n🔗 Assigning permissions to admin role...');
    const [adminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'admin'))
      .limit(1);

    if (adminRole) {
      for (const permission of createdPermissions) {
        try {
          const [result] = await db
            .insert(rolePermissions)
            .values({
              roleId: adminRole.id,
              permissionId: permission.id
            })
            .onConflictDoNothing()
            .returning();

          if (result) {
            console.log(`   ✅ Assigned ${permission.name} to admin role`);
          } else {
            console.log(`   ℹ️  Already assigned: ${permission.name} to admin role`);
          }
        } catch (error) {
          console.log(`   ❌ Error assigning ${permission.name}:`, error.message);
        }
      }
    } else {
      console.log('   ⚠️  Admin role not found!');
    }

    // Assign read permission to user role
    console.log('\n👤 Assigning read permission to user role...');
    const [userRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'user'))
      .limit(1);

    if (userRole) {
      const readPermission = createdPermissions.find(p => p.name === 'asset_management:read');
      if (readPermission) {
        try {
          const [result] = await db
            .insert(rolePermissions)
            .values({
              roleId: userRole.id,
              permissionId: readPermission.id
            })
            .onConflictDoNothing()
            .returning();

          if (result) {
            console.log(`   ✅ Assigned asset_management:read to user role`);
          } else {
            console.log(`   ℹ️  Already assigned: asset_management:read to user role`);
          }
        } catch (error) {
          console.log(`   ❌ Error assigning read permission:`, error.message);
        }
      }
    } else {
      console.log('   ⚠️  User role not found!');
    }

    console.log('\n🎉 Asset Management Permissions Setup Complete!');
    console.log('\n📋 Summary:');
    console.log('   • asset_management:read - View asset data');
    console.log('   • asset_management:create - Create records');
    console.log('   • asset_management:update - Update records');
    console.log('   • asset_management:delete - Delete records');
    console.log('\n🔐 Role Assignments:');
    console.log('   • Admin role: All asset management permissions');
    console.log('   • User role: Read permission only');

  } catch (error) {
    console.error('❌ Error setting up asset management permissions:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  addAssetManagementPermissions();
}

module.exports = { addAssetManagementPermissions };
