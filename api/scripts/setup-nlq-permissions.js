const { client } = require('../src/db');

async function setupNlqPermissions() {
  try {
    console.log('🔍 Setting up NL Query permissions...');
    
    // Check existing nl_query permissions
    const existingPerms = await client`
      SELECT name, category, description 
      FROM permissions 
      WHERE name LIKE '%nl_query%'
    `;
    
    console.log('📋 Existing NL Query permissions:');
    console.table(existingPerms);
    
    // Define required nl_query permissions
    const requiredPermissions = [
      {
        name: 'nl_query',
        category: 'nl_query',
        description: 'Access natural language query features'
      },
      {
        name: 'nl_query:read',
        category: 'nl_query',
        description: 'View natural language query data and history'
      },
      {
        name: 'nl_query:create',
        category: 'nl_query',
        description: 'Create and execute natural language queries'
      },
      {
        name: 'nl_query:update',
        category: 'nl_query', 
        description: 'Update natural language query configurations'
      },
      {
        name: 'nl_query:delete',
        category: 'nl_query',
        description: 'Delete natural language query records'
      }
    ];
    
    // Insert missing permissions
    for (const perm of requiredPermissions) {
      const existing = await client`
        SELECT id FROM permissions WHERE name = ${perm.name}
      `;
      
      if (existing.length === 0) {
        await client`
          INSERT INTO permissions (name, category, description)
          VALUES (${perm.name}, ${perm.category}, ${perm.description})
        `;
        console.log(`✅ Added permission: ${perm.name}`);
      } else {
        console.log(`ℹ️  Permission already exists: ${perm.name}`);
      }
    }
    
    // Get admin role
    const adminRole = await client`
      SELECT id FROM roles WHERE name = 'admin'
    `;
    
    if (adminRole.length === 0) {
      console.log('❌ Admin role not found');
      return;
    }
    
    const adminRoleId = adminRole[0].id;
    console.log(`👑 Admin role ID: ${adminRoleId}`);
    
    // Assign nl_query permissions to admin role
    for (const perm of requiredPermissions) {
      const permission = await client`
        SELECT id FROM permissions WHERE name = ${perm.name}
      `;
      
      if (permission.length > 0) {
        const permissionId = permission[0].id;
        
        // Check if role already has this permission
        const existing = await client`
          SELECT id FROM role_permissions 
          WHERE role_id = ${adminRoleId} AND permission_id = ${permissionId}
        `;
        
        if (existing.length === 0) {
          await client`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (${adminRoleId}, ${permissionId})
          `;
          console.log(`✅ Assigned ${perm.name} to admin role`);
        } else {
          console.log(`ℹ️  Admin already has permission: ${perm.name}`);
        }
      }
    }
    
    // Verify admin permissions
    const adminPermissions = await client`
      SELECT p.name, p.category, p.description
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN roles r ON rp.role_id = r.id
      WHERE r.name = 'admin' AND p.name LIKE '%nl_query%'
    `;
    
    console.log('\n📋 Admin NL Query permissions:');
    console.table(adminPermissions);
    
    console.log('\n✅ NL Query permissions setup complete!');
    console.log('\n🔄 Please refresh your browser or log out and back in to get the new permissions.');
    
  } catch (error) {
    console.error('❌ Error setting up NL Query permissions:', error.message);
  } finally {
    await client.end();
  }
}

setupNlqPermissions();