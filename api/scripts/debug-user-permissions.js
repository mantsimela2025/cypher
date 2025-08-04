const { client } = require('../src/db');

async function debugUserPermissions() {
  try {
    console.log('🔍 Debugging user permissions...');
    
    // Get admin user
    const users = await client`SELECT id, email, role FROM users WHERE role = 'admin' LIMIT 1`;
    
    if (users.length === 0) {
      console.log('❌ No admin users found');
      return;
    }
    
    const user = users[0];
    console.log(`👤 User: ${user.email} (ID: ${user.id})`);
    
    // Check user roles
    const userRoles = await client`
      SELECT r.id, r.name, r.description
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ${user.id}
    `;
    
    console.log('\n👑 User roles:');
    console.table(userRoles);
    
    if (userRoles.length === 0) {
      console.log('❌ User has no roles assigned');
      
      // Let's assign admin role to the user
      const adminRole = await client`SELECT id FROM roles WHERE name = 'admin'`;
      if (adminRole.length > 0) {
        await client`
          INSERT INTO user_roles (user_id, role_id)
          VALUES (${user.id}, ${adminRole[0].id})
          ON CONFLICT (user_id, role_id) DO NOTHING
        `;
        console.log('✅ Assigned admin role to user');
        
        // Re-fetch user roles
        const newUserRoles = await client`
          SELECT r.id, r.name, r.description
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = ${user.id}
        `;
        console.log('\n👑 Updated user roles:');
        console.table(newUserRoles);
      }
    }
    
    // Check role permissions
    for (const role of userRoles) {
      const rolePermissions = await client`
        SELECT p.name, p.category, p.description
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ${role.id} AND p.name LIKE '%vulnerability%'
      `;
      
      console.log(`\n🔑 Permissions for role '${role.name}':`);
      console.table(rolePermissions);
    }
    
    // Check all user permissions (through roles)
    const allUserPermissions = await client`
      SELECT DISTINCT p.name, p.category, p.description
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = ${user.id} AND p.name LIKE '%vulnerability%'
    `;
    
    console.log('\n📋 All user vulnerability permissions:');
    console.table(allUserPermissions);
    
    // Check if user has the specific permission we need
    const hasPermission = allUserPermissions.some(p => p.name === 'vulnerability_management:read');
    console.log(`\n✅ User has 'vulnerability_management:read' permission: ${hasPermission}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

debugUserPermissions();
