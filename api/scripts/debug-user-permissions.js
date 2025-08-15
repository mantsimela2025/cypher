const { client } = require('../src/db');

async function debugUserPermissions() {
  try {
    console.log('🔍 Debugging user permissions...\n');
    
    // Check which user is admin@rasdash.com
    const adminUser = await client`
      SELECT id, username, email, role, status 
      FROM users 
      WHERE email = 'admin@rasdash.com' OR username = 'admin'
    `;
    
    console.log('👤 Admin user details:');
    console.table(adminUser);
    
    if (adminUser.length === 0) {
      console.log('❌ No admin user found!');
      return;
    }
    
    const userId = adminUser[0].id;
    
    // Check user's roles
    const userRoles = await client`
      SELECT r.id, r.name, r.description
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ${userId}
    `;
    
    console.log('\n🎭 User roles:');
    console.table(userRoles);
    
    // Check permissions for each role
    for (const role of userRoles) {
      const rolePermissions = await client`
        SELECT p.name, p.category, p.description
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ${role.id}
        ORDER BY p.category, p.name
      `;
      
      console.log(`\n📋 Permissions for role '${role.name}' (${rolePermissions.length} permissions):`);
      if (rolePermissions.length > 0) {
        console.table(rolePermissions);
      } else {
        console.log('   No permissions assigned to this role');
      }
      
      // Check specifically for nl_query permissions
      const nlqPermissions = rolePermissions.filter(p => p.name.includes('nl_query'));
      console.log(`\n🔍 NL Query permissions for '${role.name}': ${nlqPermissions.length} found`);
      if (nlqPermissions.length > 0) {
        nlqPermissions.forEach(p => console.log(`   ✅ ${p.name}`));
      } else {
        console.log('   ❌ No NL Query permissions found');
      }
    }
    
    // Check all nl_query permissions in system
    const allNlqPerms = await client`
      SELECT id, name, category, description
      FROM permissions
      WHERE name LIKE '%nl_query%'
    `;
    
    console.log('\n🗃️ All NL Query permissions in system:');
    console.table(allNlqPerms);
    
  } catch (error) {
    console.error('❌ Error debugging user permissions:', error.message);
  } finally {
    await client.end();
  }
}

debugUserPermissions();
