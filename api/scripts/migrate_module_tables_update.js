#!/usr/bin/env node

/**
 * Database Migration Script for Module Management Tables - Update Existing
 * 
 * This script updates existing module management tables and adds missing columns.
 * 
 * Usage: node scripts/migrate_module_tables_update.js
 */

const postgres = require('postgres');
require('dotenv').config();

async function updateModuleTables() {
  console.log('🚀 Starting database update for Module Management tables...');

  // Create database connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // Configure SSL based on environment
  const sslConfig = process.env.DATABASE_SSL === 'false' ? false : {
    rejectUnauthorized: false // For self-signed certificates
  };

  const sql = postgres(connectionString, {
    ssl: sslConfig,
    connection: {
      application_name: 'ras_dashboard_module_update'
    },
    transform: {
      undefined: null
    }
  });

  try {
    // Test database connection first
    console.log('🔌 Testing database connection...');
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');

    console.log('🔧 Updating existing Module Management tables...');

    // Check and add missing columns to module_navigation
    console.log('📝 Checking module_navigation table...');
    
    // Add parent_id column if it doesn't exist
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'module_navigation' AND column_name = 'parent_id'
        ) THEN
          ALTER TABLE module_navigation 
          ADD COLUMN parent_id INTEGER REFERENCES module_navigation(id) ON DELETE CASCADE;
          RAISE NOTICE 'Added parent_id column to module_navigation';
        END IF;
      END $$;
    `;

    // Add is_visible column if it doesn't exist
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'module_navigation' AND column_name = 'is_visible'
        ) THEN
          ALTER TABLE module_navigation 
          ADD COLUMN is_visible BOOLEAN DEFAULT true NOT NULL;
          RAISE NOTICE 'Added is_visible column to module_navigation';
        END IF;
      END $$;
    `;

    // Add requires_permission column if it doesn't exist
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'module_navigation' AND column_name = 'requires_permission'
        ) THEN
          ALTER TABLE module_navigation 
          ADD COLUMN requires_permission VARCHAR(100);
          RAISE NOTICE 'Added requires_permission column to module_navigation';
        END IF;
      END $$;
    `;

    // Check and add missing columns to role_module_permissions
    console.log('📝 Checking role_module_permissions table...');
    
    // Add can_admin column if it doesn't exist
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'role_module_permissions' AND column_name = 'can_admin'
        ) THEN
          ALTER TABLE role_module_permissions 
          ADD COLUMN can_admin BOOLEAN DEFAULT false NOT NULL;
          RAISE NOTICE 'Added can_admin column to role_module_permissions';
        END IF;
      END $$;
    `;

    // Create additional tables if they don't exist
    console.log('📦 Creating additional Module Management tables...');

    // Create user_module_preferences table
    await sql`
      CREATE TABLE IF NOT EXISTS user_module_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        module_id INTEGER REFERENCES app_modules(id) ON DELETE CASCADE NOT NULL,
        is_hidden BOOLEAN DEFAULT false NOT NULL,
        custom_order INTEGER,
        preferences TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE(user_id, module_id)
      );
    `;

    // Create module_dependencies table
    await sql`
      CREATE TABLE IF NOT EXISTS module_dependencies (
        id SERIAL PRIMARY KEY,
        module_id INTEGER REFERENCES app_modules(id) ON DELETE CASCADE NOT NULL,
        depends_on_module_id INTEGER REFERENCES app_modules(id) ON DELETE CASCADE NOT NULL,
        is_required BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE(module_id, depends_on_module_id),
        CHECK(module_id != depends_on_module_id)
      );
    `;

    // Create module_settings table
    await sql`
      CREATE TABLE IF NOT EXISTS module_settings (
        id SERIAL PRIMARY KEY,
        module_id INTEGER REFERENCES app_modules(id) ON DELETE CASCADE NOT NULL,
        setting_key VARCHAR(100) NOT NULL,
        setting_value TEXT,
        setting_type VARCHAR(50) DEFAULT 'string' NOT NULL,
        description TEXT,
        is_user_configurable BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE(module_id, setting_key)
      );
    `;

    // Create module_audit_log table
    await sql`
      CREATE TABLE IF NOT EXISTS module_audit_log (
        id SERIAL PRIMARY KEY,
        module_id INTEGER REFERENCES app_modules(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER,
        old_values TEXT,
        new_values TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Create module_analytics table
    await sql`
      CREATE TABLE IF NOT EXISTS module_analytics (
        id SERIAL PRIMARY KEY,
        module_id INTEGER REFERENCES app_modules(id) ON DELETE CASCADE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        event_data TEXT,
        session_id VARCHAR(100),
        duration INTEGER,
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    console.log('✅ Module Management tables updated successfully');

    console.log('📊 Creating/updating indexes and constraints for performance...');

    // Create unique constraints first
    await sql`
      DO $$ BEGIN
        ALTER TABLE module_navigation ADD CONSTRAINT unique_module_nav_path UNIQUE (module_id, nav_path);
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Create indexes for better performance (with IF NOT EXISTS equivalent)
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_module_navigation_module_id ON module_navigation(module_id)',
      'CREATE INDEX IF NOT EXISTS idx_module_navigation_parent_id ON module_navigation(parent_id)',
      'CREATE INDEX IF NOT EXISTS idx_module_navigation_order ON module_navigation(nav_order)',
      'CREATE INDEX IF NOT EXISTS idx_role_module_permissions_role_id ON role_module_permissions(role_id)',
      'CREATE INDEX IF NOT EXISTS idx_role_module_permissions_module_id ON role_module_permissions(module_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_module_preferences_user_id ON user_module_preferences(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_module_preferences_module_id ON user_module_preferences(module_id)',
      'CREATE INDEX IF NOT EXISTS idx_module_dependencies_module_id ON module_dependencies(module_id)',
      'CREATE INDEX IF NOT EXISTS idx_module_dependencies_depends_on ON module_dependencies(depends_on_module_id)',
      'CREATE INDEX IF NOT EXISTS idx_module_settings_module_id ON module_settings(module_id)',
      'CREATE INDEX IF NOT EXISTS idx_module_settings_key ON module_settings(setting_key)',
      'CREATE INDEX IF NOT EXISTS idx_module_audit_log_module_id ON module_audit_log(module_id)',
      'CREATE INDEX IF NOT EXISTS idx_module_audit_log_user_id ON module_audit_log(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_module_audit_log_timestamp ON module_audit_log(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_module_analytics_module_id ON module_analytics(module_id)',
      'CREATE INDEX IF NOT EXISTS idx_module_analytics_user_id ON module_analytics(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_module_analytics_timestamp ON module_analytics(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_module_analytics_event_type ON module_analytics(event_type)'
    ];

    for (const indexQuery of indexes) {
      try {
        await sql.unsafe(indexQuery);
      } catch (error) {
        // Ignore errors for indexes that already exist
        if (!error.message.includes('already exists')) {
          console.warn(`Warning creating index: ${error.message}`);
        }
      }
    }

    console.log('✅ Indexes and constraints created/updated successfully');

    console.log('🌱 Updating default modules and navigation...');

    // Insert/update default modules
    const defaultModules = [
      { name: 'dashboard', description: 'Main dashboard and overview', enabled: true },
      { name: 'asset_management', description: 'Asset inventory and management', enabled: true },
      { name: 'vulnerability_management', description: 'Vulnerability scanning and tracking', enabled: true },
      { name: 'patch_management', description: 'Patch deployment and management', enabled: true },
      { name: 'compliance', description: 'Compliance monitoring and reporting', enabled: true },
      { name: 'incident_response', description: 'Security incident management', enabled: true },
      { name: 'siem', description: 'Security Information and Event Management', enabled: true },
      { name: 'ai_assistance', description: 'AI-powered security assistance', enabled: true },
      { name: 'user_management', description: 'User and role management', enabled: true },
      { name: 'reports', description: 'Reporting and analytics', enabled: true },
      { name: 'settings', description: 'System configuration and settings', enabled: true }
    ];

    for (const module of defaultModules) {
      await sql`
        INSERT INTO app_modules (name, description, enabled) 
        VALUES (${module.name}, ${module.description}, ${module.enabled})
        ON CONFLICT (name) DO UPDATE SET
          description = EXCLUDED.description,
          enabled = EXCLUDED.enabled;
      `;
    }

    // Get module IDs for navigation setup
    const modules = await sql`SELECT id, name FROM app_modules`;
    const moduleMap = new Map(modules.map(m => [m.name, m.id]));

    // Insert/update default navigation items
    const navigationItems = [
      { moduleId: moduleMap.get('dashboard'), navLabel: 'Dashboard', navPath: '/dashboard', navIcon: 'dashboard', navOrder: 1 },
      { moduleId: moduleMap.get('asset_management'), navLabel: 'Asset Management', navPath: '/assets', navIcon: 'computer', navOrder: 2 },
      { moduleId: moduleMap.get('vulnerability_management'), navLabel: 'Vulnerability Management', navPath: '/vulnerabilities', navIcon: 'security', navOrder: 3 },
      { moduleId: moduleMap.get('patch_management'), navLabel: 'Patch Management', navPath: '/patches', navIcon: 'update', navOrder: 4 },
      { moduleId: moduleMap.get('compliance'), navLabel: 'Compliance', navPath: '/compliance', navIcon: 'verified', navOrder: 5 },
      { moduleId: moduleMap.get('incident_response'), navLabel: 'Incident Response', navPath: '/incidents', navIcon: 'warning', navOrder: 6 },
      { moduleId: moduleMap.get('siem'), navLabel: 'SIEM', navPath: '/siem', navIcon: 'monitor', navOrder: 7 },
      { moduleId: moduleMap.get('ai_assistance'), navLabel: 'AI Assistance', navPath: '/ai-assistance', navIcon: 'smart_toy', navOrder: 8 },
      { moduleId: moduleMap.get('user_management'), navLabel: 'User Management', navPath: '/users', navIcon: 'people', navOrder: 9 },
      { moduleId: moduleMap.get('reports'), navLabel: 'Reports', navPath: '/reports', navIcon: 'assessment', navOrder: 10 },
      { moduleId: moduleMap.get('settings'), navLabel: 'Settings', navPath: '/settings', navIcon: 'settings', navOrder: 11 }
    ];

    for (const nav of navigationItems) {
      if (nav.moduleId) {
        await sql`
          INSERT INTO module_navigation (module_id, nav_label, nav_path, nav_icon, nav_order, is_visible)
          VALUES (${nav.moduleId}, ${nav.navLabel}, ${nav.navPath}, ${nav.navIcon}, ${nav.navOrder}, true)
          ON CONFLICT (module_id, nav_path) DO NOTHING;
        `;
      }
    }

    // Update permissions for admin role
    const [adminRole] = await sql`SELECT id FROM roles WHERE name = 'admin' LIMIT 1`;
    if (adminRole) {
      for (const [moduleName, moduleId] of moduleMap) {
        await sql`
          INSERT INTO role_module_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, can_admin)
          VALUES (${adminRole.id}, ${moduleId}, true, true, true, true, true)
          ON CONFLICT (role_id, module_id) DO UPDATE SET
            can_view = true, can_create = true, can_edit = true, can_delete = true, can_admin = true;
        `;
      }
    }

    // Update permissions for user role
    const [userRole] = await sql`SELECT id FROM roles WHERE name = 'user' LIMIT 1`;
    if (userRole) {
      for (const [moduleName, moduleId] of moduleMap) {
        const canCreate = ['asset_management', 'incident_response'].includes(moduleName);
        const canEdit = ['asset_management', 'user_management'].includes(moduleName);
        
        await sql`
          INSERT INTO role_module_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, can_admin)
          VALUES (${userRole.id}, ${moduleId}, true, ${canCreate}, ${canEdit}, false, false)
          ON CONFLICT (role_id, module_id) DO UPDATE SET
            can_view = true, can_create = ${canCreate}, can_edit = ${canEdit}, can_delete = false, can_admin = false;
        `;
      }
    }

    console.log('✅ Default modules and navigation updated successfully');

    console.log('🎉 Module Management update completed successfully!');
    console.log('');
    console.log('📋 Summary of updated/created tables:');
    console.log('   ✅ app_modules (updated with default data)');
    console.log('   ✅ module_navigation (added parent_id, is_visible, requires_permission columns)');
    console.log('   ✅ role_module_permissions (added can_admin column)');
    console.log('   ✅ user_module_preferences (created)');
    console.log('   ✅ module_dependencies (created)');
    console.log('   ✅ module_settings (created)');
    console.log('   ✅ module_audit_log (created)');
    console.log('   ✅ module_analytics (created)');
    console.log('');
    console.log('🚀 Module Management System is ready!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Test the module management endpoints');
    console.log('   2. Configure additional role permissions as needed');
    console.log('   3. Set up module dependencies if required');
    console.log('   4. Customize navigation structure for your needs');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the migration
if (require.main === module) {
  updateModuleTables();
}

module.exports = { updateModuleTables };
