#!/usr/bin/env node

/**
 * Database Migration Script for Module Management Tables
 * 
 * This script creates the module management tables for dynamic frontend control.
 * 
 * Usage: node scripts/migrate_module_tables.js
 */

const postgres = require('postgres');
require('dotenv').config();

async function createModuleTables() {
  console.log('🚀 Starting database migration for Module Management tables...');

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
      application_name: 'ras_dashboard_module_migration'
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

    console.log('📦 Creating Module Management tables...');

    // Create app_modules table
    await sql`
      CREATE TABLE IF NOT EXISTS app_modules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        enabled BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Create module_navigation table
    await sql`
      CREATE TABLE IF NOT EXISTS module_navigation (
        id SERIAL PRIMARY KEY,
        module_id INTEGER REFERENCES app_modules(id) ON DELETE CASCADE NOT NULL,
        nav_label VARCHAR(100) NOT NULL,
        nav_path VARCHAR(255) NOT NULL,
        nav_icon VARCHAR(100),
        nav_order INTEGER DEFAULT 0 NOT NULL,
        parent_id INTEGER REFERENCES module_navigation(id) ON DELETE CASCADE,
        is_visible BOOLEAN DEFAULT true NOT NULL,
        requires_permission VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Create role_module_permissions table
    await sql`
      CREATE TABLE IF NOT EXISTS role_module_permissions (
        id SERIAL PRIMARY KEY,
        role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
        module_id INTEGER REFERENCES app_modules(id) ON DELETE CASCADE NOT NULL,
        can_view BOOLEAN DEFAULT true NOT NULL,
        can_create BOOLEAN DEFAULT false NOT NULL,
        can_edit BOOLEAN DEFAULT false NOT NULL,
        can_delete BOOLEAN DEFAULT false NOT NULL,
        can_admin BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE(role_id, module_id)
      );
    `;

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

    console.log('✅ Module Management tables created successfully');

    console.log('📊 Creating indexes for performance...');

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_module_navigation_module_id ON module_navigation(module_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_module_navigation_parent_id ON module_navigation(parent_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_module_navigation_order ON module_navigation(nav_order);`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_role_module_permissions_role_id ON role_module_permissions(role_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_role_module_permissions_module_id ON role_module_permissions(module_id);`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_user_module_preferences_user_id ON user_module_preferences(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_module_preferences_module_id ON user_module_preferences(module_id);`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_module_dependencies_module_id ON module_dependencies(module_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_module_dependencies_depends_on ON module_dependencies(depends_on_module_id);`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_module_settings_module_id ON module_settings(module_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_module_settings_key ON module_settings(setting_key);`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_module_audit_log_module_id ON module_audit_log(module_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_module_audit_log_user_id ON module_audit_log(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_module_audit_log_timestamp ON module_audit_log(timestamp);`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_module_analytics_module_id ON module_analytics(module_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_module_analytics_user_id ON module_analytics(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_module_analytics_timestamp ON module_analytics(timestamp);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_module_analytics_event_type ON module_analytics(event_type);`;

    console.log('✅ Indexes created successfully');

    console.log('🌱 Inserting default modules and navigation...');

    // Insert default modules
    await sql`
      INSERT INTO app_modules (name, description, enabled) VALUES
      ('dashboard', 'Main dashboard and overview', true),
      ('asset_management', 'Asset inventory and management', true),
      ('vulnerability_management', 'Vulnerability scanning and tracking', true),
      ('patch_management', 'Patch deployment and management', true),
      ('compliance', 'Compliance monitoring and reporting', true),
      ('incident_response', 'Security incident management', true),
      ('siem', 'Security Information and Event Management', true),
      ('ai_assistance', 'AI-powered security assistance', true),
      ('user_management', 'User and role management', true),
      ('reports', 'Reporting and analytics', true),
      ('settings', 'System configuration and settings', true)
      ON CONFLICT (name) DO NOTHING;
    `;

    // Get module IDs for navigation setup
    const modules = await sql`SELECT id, name FROM app_modules`;
    const moduleMap = new Map(modules.map(m => [m.name, m.id]));

    // Insert default navigation items
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
          INSERT INTO module_navigation (module_id, nav_label, nav_path, nav_icon, nav_order)
          VALUES (${nav.moduleId}, ${nav.navLabel}, ${nav.navPath}, ${nav.navIcon}, ${nav.navOrder})
          ON CONFLICT DO NOTHING;
        `;
      }
    }

    // Set default permissions for admin role
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

    // Set default permissions for user role
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

    console.log('✅ Default modules and navigation created successfully');

    console.log('🎉 Module Management migration completed successfully!');
    console.log('');
    console.log('📋 Summary of created tables:');
    console.log('   - app_modules (core module definitions)');
    console.log('   - module_navigation (hierarchical navigation structure)');
    console.log('   - role_module_permissions (role-based access control)');
    console.log('   - user_module_preferences (user customization)');
    console.log('   - module_dependencies (module relationships)');
    console.log('   - module_settings (configuration management)');
    console.log('   - module_audit_log (audit trail)');
    console.log('   - module_analytics (usage tracking)');
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
  createModuleTables();
}

module.exports = { createModuleTables };
