# Module Management System

Comprehensive module management system that provides dynamic control over frontend navigation, permissions, and user experience customization. This system enables administrators to control which features are visible to users based on their roles and allows for flexible application configuration.

## 🎯 Overview

The Module Management System provides:
- **Dynamic Module Control** - Enable/disable application modules dynamically
- **Hierarchical Navigation** - Nested navigation structure with parent-child relationships
- **Role-Based Permissions** - Granular permissions per module and role
- **User Customization** - User preferences for module visibility and ordering
- **Dependency Management** - Module dependencies with required/optional relationships
- **Audit Logging** - Complete audit trail of all module configuration changes
- **Analytics Tracking** - Usage analytics and performance metrics

## 🏗️ Architecture Components

### Database Schema
```sql
-- Core module definition
app_modules (id, name, description, enabled, created_at, updated_at)

-- Navigation structure
module_navigation (id, module_id, nav_label, nav_path, nav_icon, nav_order, 
                  parent_id, is_visible, requires_permission, created_at, updated_at)

-- Role-based permissions
role_module_permissions (id, role_id, module_id, can_view, can_create, can_edit, 
                        can_delete, can_admin, created_at, updated_at)

-- User preferences
user_module_preferences (id, user_id, module_id, is_hidden, custom_order, 
                        preferences, created_at, updated_at)

-- Module dependencies
module_dependencies (id, module_id, depends_on_module_id, is_required, 
                    created_at, updated_at)

-- Configuration settings
module_settings (id, module_id, setting_key, setting_value, setting_type, 
                description, is_user_configurable, created_at, updated_at)

-- Audit trail
module_audit_log (id, module_id, user_id, action, entity_type, entity_id, 
                 old_values, new_values, ip_address, user_agent, timestamp)

-- Usage analytics
module_analytics (id, module_id, user_id, event_type, event_data, session_id, 
                 duration, timestamp)
```

### Service Architecture
```javascript
const moduleService = {
  // Module Management
  createModule(moduleData, userId),
  getAllModules(filters, pagination),
  getModuleById(moduleId),
  updateModule(moduleId, updateData, userId),
  deleteModule(moduleId, userId),
  toggleModuleStatus(moduleId, userId),

  // Navigation Management
  createNavigation(navigationData, userId),
  getModuleNavigation(moduleId),
  updateNavigation(navigationId, updateData, userId),
  deleteNavigation(navigationId, userId),
  getUserNavigation(userId),

  // Permission Management
  setRoleModulePermissions(roleId, moduleId, permissions, userId),
  getRoleModulePermissions(roleId, moduleId),
  checkUserModulePermission(userId, moduleId, permission),

  // User Preferences
  setUserModulePreferences(userId, moduleId, preferences),
  getUserModulePreferences(userId, moduleId),

  // Analytics and Utilities
  trackModuleUsage(moduleId, userId, eventType, eventData, duration),
  getModuleAnalytics(moduleId, timeframe),
  logModuleAction(moduleId, userId, action, entityType, entityId, oldValues, newValues)
};
```

## 📋 Module Management Features

### Module Lifecycle
```javascript
const moduleLifecycle = {
  creation: {
    process: [
      'Define module metadata (name, description)',
      'Set initial enabled status',
      'Create navigation structure',
      'Configure role permissions',
      'Set up dependencies if needed'
    ],
    validation: [
      'Unique module name',
      'Valid navigation paths',
      'Proper permission structure'
    ]
  },

  activation: {
    checks: [
      'Verify all required dependencies are enabled',
      'Validate navigation structure',
      'Confirm role permissions are configured'
    ],
    effects: [
      'Module becomes visible to authorized users',
      'Navigation items appear in user menus',
      'Module features become accessible'
    ]
  },

  deactivation: {
    checks: [
      'Verify no other modules depend on this one',
      'Confirm no critical processes are running'
    ],
    effects: [
      'Module becomes invisible to all users',
      'Navigation items are hidden',
      'Module features become inaccessible'
    ]
  }
};
```

### Navigation Structure
```javascript
const navigationStructure = {
  hierarchical: {
    description: 'Supports nested navigation with parent-child relationships',
    example: {
      'Security Management': {
        children: [
          'Vulnerability Management',
          'Patch Management',
          'Compliance Monitoring'
        ]
      }
    }
  },

  properties: {
    navLabel: 'Display text for navigation item',
    navPath: 'Route/URL for navigation',
    navIcon: 'Icon identifier for UI',
    navOrder: 'Sort order within parent',
    parentId: 'Parent navigation item ID',
    isVisible: 'Whether item is visible',
    requiresPermission: 'Specific permission required'
  },

  dynamic_generation: {
    process: [
      'Query enabled modules',
      'Check user role permissions',
      'Apply user preferences',
      'Build hierarchical structure',
      'Return filtered navigation'
    ]
  }
};
```

## 🔐 Permission Management

### Permission Types
```javascript
const permissionTypes = {
  canView: {
    description: 'Can see and access the module',
    scope: 'Basic read access to module content',
    default: true
  },

  canCreate: {
    description: 'Can create new items within the module',
    scope: 'Add new records, configurations, or content',
    default: false
  },

  canEdit: {
    description: 'Can modify existing items within the module',
    scope: 'Update records, change configurations',
    default: false
  },

  canDelete: {
    description: 'Can remove items within the module',
    scope: 'Delete records, remove configurations',
    default: false
  },

  canAdmin: {
    description: 'Can administer the module',
    scope: 'Full control including permissions and settings',
    default: false
  }
};
```

### Role-Based Access Control
```javascript
const rbacImplementation = {
  permission_inheritance: {
    hierarchy: 'admin > canDelete > canEdit > canCreate > canView',
    logic: 'Higher permissions automatically include lower ones'
  },

  role_assignment: {
    process: [
      'Administrator assigns permissions to roles',
      'Users inherit permissions from their assigned role',
      'System checks permissions on each module access',
      'Access granted or denied based on permission level'
    ]
  },

  permission_checking: {
    realtime: 'Permissions checked on every request',
    caching: 'Results cached for performance',
    fallback: 'Deny access if permission check fails'
  }
};
```

## 👤 User Experience Features

### User Preferences
```javascript
const userPreferences = {
  module_visibility: {
    description: 'Users can hide modules they have access to',
    use_case: 'Simplify interface by hiding unused modules',
    implementation: 'isHidden flag in user_module_preferences'
  },

  custom_ordering: {
    description: 'Users can reorder navigation items',
    use_case: 'Prioritize frequently used modules',
    implementation: 'customOrder field with user-specific sorting'
  },

  personalization: {
    description: 'Additional user-specific preferences',
    storage: 'JSON preferences field for flexible customization',
    examples: [
      'Default views within modules',
      'Notification preferences',
      'Display settings'
    ]
  }
};
```

### Dynamic Navigation Generation
```javascript
const navigationGeneration = {
  user_context: {
    factors: [
      'User role and permissions',
      'Module enabled status',
      'User preferences and hidden modules',
      'Navigation visibility settings'
    ]
  },

  generation_process: [
    'Fetch user role and permissions',
    'Query enabled modules with navigation',
    'Filter by user view permissions',
    'Apply user preferences (hidden modules)',
    'Build hierarchical structure',
    'Sort by custom order or default order',
    'Return personalized navigation'
  ],

  caching_strategy: {
    user_level: 'Cache navigation per user',
    invalidation: 'Clear cache on permission or preference changes',
    performance: 'Reduce database queries for frequent requests'
  }
};
```

## 📊 Analytics and Monitoring

### Usage Tracking
```javascript
const usageTracking = {
  tracked_events: [
    'module_view',
    'feature_access',
    'navigation_click',
    'action_performed',
    'session_duration'
  ],

  metrics_collected: {
    usage_frequency: 'How often modules are accessed',
    user_engagement: 'Time spent in each module',
    feature_adoption: 'Which features are most used',
    navigation_patterns: 'Common user navigation paths',
    performance_data: 'Response times and load metrics'
  },

  analytics_reports: {
    module_popularity: 'Most and least used modules',
    user_behavior: 'Navigation patterns and preferences',
    performance_insights: 'Slow-loading modules and bottlenecks',
    adoption_trends: 'Feature usage over time'
  }
};
```

### Audit Trail
```javascript
const auditTrail = {
  logged_actions: [
    'Module created/updated/deleted',
    'Navigation items modified',
    'Permissions changed',
    'Module enabled/disabled',
    'User preferences updated'
  ],

  audit_data: {
    who: 'User ID and details',
    what: 'Action performed and entity affected',
    when: 'Timestamp of action',
    where: 'IP address and user agent',
    before_after: 'Old and new values for changes'
  },

  compliance_features: {
    immutable_logs: 'Audit logs cannot be modified',
    retention_policy: 'Configurable log retention periods',
    export_capability: 'Export logs for compliance reporting',
    search_filtering: 'Advanced search and filtering options'
  }
};
```

## 🔧 Configuration and Settings

### Module Settings
```javascript
const moduleSettings = {
  setting_types: {
    string: 'Text configuration values',
    number: 'Numeric configuration values',
    boolean: 'True/false configuration flags',
    json: 'Complex configuration objects'
  },

  configuration_levels: {
    system_wide: 'Global settings affecting all users',
    module_specific: 'Settings specific to individual modules',
    user_configurable: 'Settings users can modify themselves',
    admin_only: 'Settings only administrators can change'
  },

  examples: {
    'patch_management.auto_scan_enabled': {
      type: 'boolean',
      value: 'true',
      user_configurable: false,
      description: 'Enable automatic vulnerability scanning'
    },
    'dashboard.refresh_interval': {
      type: 'number',
      value: '30',
      user_configurable: true,
      description: 'Dashboard refresh interval in seconds'
    }
  }
};
```

### Dependency Management
```javascript
const dependencyManagement = {
  dependency_types: {
    required: 'Module cannot function without this dependency',
    optional: 'Module has enhanced features with this dependency'
  },

  validation_rules: {
    circular_dependencies: 'Prevent modules from depending on each other',
    cascade_effects: 'Disabling a module affects dependent modules',
    activation_order: 'Dependencies must be enabled before dependent modules'
  },

  use_cases: {
    'Asset Management → Vulnerability Management': 'Vulnerabilities need asset context',
    'SIEM → Incident Response': 'Incidents are created from SIEM alerts',
    'Compliance → Audit Logs': 'Compliance reporting needs audit data'
  }
};
```

## 🚀 Implementation Examples

### Frontend Integration
```javascript
// Get user navigation for frontend menu
const getUserNavigation = async () => {
  const response = await fetch('/api/v1/modules/navigation/user', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { data } = await response.json();
  return data; // Hierarchical navigation structure
};

// Check permission before showing UI elements
const checkPermission = async (moduleId, permission) => {
  const response = await fetch(`/api/v1/modules/${moduleId}/permissions/${permission}/check`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { data } = await response.json();
  return data.hasPermission;
};

// Track module usage
const trackUsage = async (moduleId, eventType, eventData) => {
  await moduleService.trackModuleUsage(moduleId, userId, eventType, eventData);
};
```

### Administrative Operations
```javascript
// Enable a module with dependency checking
const enableModule = async (moduleId) => {
  try {
    const response = await fetch(`/api/v1/modules/${moduleId}/toggle`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 409) {
      const error = await response.json();
      console.error('Dependency conflict:', error.message);
      // Handle dependency issues
    }
  } catch (error) {
    console.error('Error enabling module:', error);
  }
};

// Set role permissions for module
const setRolePermissions = async (roleId, moduleId, permissions) => {
  const response = await fetch(`/api/v1/modules/roles/${roleId}/modules/${moduleId}/permissions`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(permissions)
  });
  
  return await response.json();
};
```

This comprehensive Module Management System provides the foundation for dynamic, role-based application control with extensive customization, monitoring, and administrative capabilities.
