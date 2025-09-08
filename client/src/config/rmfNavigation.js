/**
 * RMF Navigation Configuration
 * Centralized configuration for RMF routing, navigation, and breadcrumbs
 */

// RMF Route Definitions
export const RMF_ROUTES = {
  // Main Routes
  DASHBOARD: '/rmf/dashboard',
  PROJECTS: '/rmf/projects',
  PROJECTS_NEW: '/rmf/projects/new',
  COMPLIANCE: '/rmf/compliance',
  COMPLIANCE_HEATMAP: '/rmf/compliance/heatmap',
  
  // Project-specific Routes
  PROJECT_DETAIL: '/rmf/projects/:projectId',
  PROJECT_WIZARD: '/rmf/wizard/:projectId',
  PROJECT_STEP: '/rmf/projects/:projectId/step/:stepName',
  
  // Demo and Testing
  WIZARD_DEMO: '/rmf/wizard-demo',
};

// Navigation Menu Structure
export const RMF_NAVIGATION = {
  main: [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      path: RMF_ROUTES.DASHBOARD,
      description: 'RMF overview and metrics',
      roles: ['admin', 'isso', 'system_owner', 'viewer']
    },
    {
      key: 'projects',
      label: 'Projects',
      icon: 'folder',
      path: RMF_ROUTES.PROJECTS,
      description: 'Manage RMF projects',
      roles: ['admin', 'isso', 'system_owner']
    },
    {
      key: 'compliance',
      label: 'Compliance',
      icon: 'grid-alt',
      path: RMF_ROUTES.COMPLIANCE,
      description: 'NIST 800-53 compliance heatmap',
      roles: ['admin', 'isso', 'system_owner', 'viewer']
    }
  ],
  
  quickActions: [
    {
      key: 'new-project',
      label: 'New Project',
      icon: 'plus-circle',
      path: RMF_ROUTES.PROJECTS_NEW,
      description: 'Create new RMF project',
      color: 'primary',
      roles: ['admin', 'isso', 'system_owner']
    },
    {
      key: 'wizard-demo',
      label: 'Wizard Demo',
      icon: 'cpu',
      path: RMF_ROUTES.WIZARD_DEMO,
      description: 'Try the RMF wizard',
      color: 'info',
      roles: ['admin', 'isso', 'system_owner']
    }
  ]
};

// RMF Process Steps Configuration
export const RMF_STEPS = {
  SETUP: {
    key: 'setup',
    label: 'Project Setup',
    shortLabel: 'Setup',
    icon: 'setting',
    order: 1,
    description: 'Define project scope and stakeholders',
    milestone: 'PROJECT_INITIATED',
    estimatedDuration: '1-2 days',
    criticalPath: false,
    approvalRequired: false
  },
  IDENTIFY: {
    key: 'identify',
    label: 'System Identification',
    shortLabel: 'Identify',
    icon: 'grid',
    order: 2,
    description: 'Define system boundaries and components',
    milestone: 'SYSTEM_BOUNDARIES_DEFINED',
    estimatedDuration: '3-5 days',
    criticalPath: true,
    approvalRequired: true,
    approvalRole: 'System Owner'
  },
  CATEGORIZE: {
    key: 'categorize',
    label: 'System Categorization',
    shortLabel: 'Categorize',
    icon: 'layers',
    order: 3,
    description: 'FIPS 199 impact level categorization',
    milestone: 'SYSTEM_CATEGORIZED',
    estimatedDuration: '2-3 days',
    criticalPath: true,
    approvalRequired: true,
    approvalRole: 'ISSO'
  },
  SELECT: {
    key: 'select',
    label: 'Control Selection',
    shortLabel: 'Select',
    icon: 'shield-check',
    order: 4,
    description: 'Select appropriate security controls',
    milestone: 'CONTROLS_SELECTED',
    estimatedDuration: '5-7 days',
    criticalPath: true,
    approvalRequired: true,
    approvalRole: 'Authorizing Official'
  },
  IMPLEMENT: {
    key: 'implement',
    label: 'Implementation Planning',
    shortLabel: 'Implement',
    icon: 'clipboard',
    order: 5,
    description: 'Plan control implementation',
    milestone: 'IMPLEMENTATION_PLANNED',
    estimatedDuration: '7-10 days',
    criticalPath: true,
    approvalRequired: false
  },
  ASSESS: {
    key: 'assess',
    label: 'Assessment Planning',
    shortLabel: 'Assess',
    icon: 'check-circle',
    order: 6,
    description: 'Plan security assessment',
    milestone: 'ASSESSMENT_PLANNED',
    estimatedDuration: '3-5 days',
    criticalPath: true,
    approvalRequired: true,
    approvalRole: 'Independent Assessor'
  },
  AUTHORIZE: {
    key: 'authorize',
    label: 'Authorization',
    shortLabel: 'Authorize',
    icon: 'award',
    order: 7,
    description: 'Obtain authorization to operate',
    milestone: 'SYSTEM_AUTHORIZED',
    estimatedDuration: '5-10 days',
    criticalPath: true,
    approvalRequired: true,
    approvalRole: 'Authorizing Official'
  },
  MONITOR: {
    key: 'monitor',
    label: 'Continuous Monitoring',
    shortLabel: 'Monitor',
    icon: 'activity',
    order: 8,
    description: 'Establish monitoring procedures',
    milestone: 'MONITORING_ESTABLISHED',
    estimatedDuration: '2-3 days',
    criticalPath: false,
    approvalRequired: false
  }
};

// Breadcrumb Configuration
export const RMF_BREADCRUMBS = {
  [RMF_ROUTES.DASHBOARD]: [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'RMF', path: RMF_ROUTES.DASHBOARD, icon: 'shield-check' },
    { label: 'Dashboard', path: null, icon: 'dashboard', active: true }
  ],
  [RMF_ROUTES.PROJECTS]: [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'RMF', path: RMF_ROUTES.DASHBOARD, icon: 'shield-check' },
    { label: 'Projects', path: null, icon: 'folder', active: true }
  ],
  [RMF_ROUTES.PROJECTS_NEW]: [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'RMF', path: RMF_ROUTES.DASHBOARD, icon: 'shield-check' },
    { label: 'Projects', path: RMF_ROUTES.PROJECTS, icon: 'folder' },
    { label: 'New Project', path: null, icon: 'plus-circle', active: true }
  ],
  [RMF_ROUTES.COMPLIANCE]: [
    { label: 'Home', path: '/', icon: 'home' },
    { label: 'RMF', path: RMF_ROUTES.DASHBOARD, icon: 'shield-check' },
    { label: 'Compliance Heatmap', path: null, icon: 'grid-alt', active: true }
  ]
};

// Role-based Access Control
export const RMF_PERMISSIONS = {
  ADMIN: {
    canView: ['dashboard', 'projects', 'compliance'],
    canCreate: ['projects'],
    canEdit: ['projects'],
    canDelete: ['projects'],
    canApprove: ['all_steps']
  },
  ISSO: {
    canView: ['dashboard', 'projects', 'compliance'],
    canCreate: ['projects'],
    canEdit: ['projects'],
    canDelete: [],
    canApprove: ['categorize', 'assess']
  },
  SYSTEM_OWNER: {
    canView: ['dashboard', 'projects', 'compliance'],
    canCreate: ['projects'],
    canEdit: ['projects'],
    canDelete: [],
    canApprove: ['identify']
  },
  AUTHORIZING_OFFICIAL: {
    canView: ['dashboard', 'projects', 'compliance'],
    canCreate: [],
    canEdit: [],
    canDelete: [],
    canApprove: ['select', 'authorize']
  },
  INDEPENDENT_ASSESSOR: {
    canView: ['dashboard', 'projects', 'compliance'],
    canCreate: [],
    canEdit: [],
    canDelete: [],
    canApprove: ['assess']
  },
  VIEWER: {
    canView: ['dashboard', 'compliance'],
    canCreate: [],
    canEdit: [],
    canDelete: [],
    canApprove: []
  }
};

// Utility Functions
export const getRMFStepByKey = (stepKey) => {
  return Object.values(RMF_STEPS).find(step => step.key === stepKey);
};

export const getRMFStepsByOrder = () => {
  return Object.values(RMF_STEPS).sort((a, b) => a.order - b.order);
};

export const getNextRMFStep = (currentStepKey) => {
  const steps = getRMFStepsByOrder();
  const currentIndex = steps.findIndex(step => step.key === currentStepKey);
  return currentIndex >= 0 && currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
};

export const getPreviousRMFStep = (currentStepKey) => {
  const steps = getRMFStepsByOrder();
  const currentIndex = steps.findIndex(step => step.key === currentStepKey);
  return currentIndex > 0 ? steps[currentIndex - 1] : null;
};

export const canUserAccessRoute = (route, userRole) => {
  const permissions = RMF_PERMISSIONS[userRole?.toUpperCase()];
  if (!permissions) return false;
  
  // Simple route-based access check
  if (route.includes('/projects') && !permissions.canView.includes('projects')) return false;
  if (route.includes('/compliance') && !permissions.canView.includes('compliance')) return false;
  
  return true;
};

export const canUserApproveStep = (stepKey, userRole) => {
  const permissions = RMF_PERMISSIONS[userRole?.toUpperCase()];
  if (!permissions) return false;
  
  return permissions.canApprove.includes('all_steps') || permissions.canApprove.includes(stepKey);
};
