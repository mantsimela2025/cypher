const menu = [
  {
    heading: "Dashboards",
  },
  {
    icon: "dashboard",
    text: "Security Posture",
    link: "/security-posture-dashboard",
  },
  // {
  //   icon: "dashboard",
  //   text: "Default Dashboard",
  //   link: "/",
  // },
  // {
  //   icon: "speed",
  //   text: "Sales Dashboard",
  //   link: "/sales",
  // },
  // {
  //   icon: "bitcoin-cash",
  //   text: "Crypto Dashboard",
  //   link: "/crypto",
  // },
  // {
  //   icon: "coins",
  //   text: "Invest Dashboard",
  //   link: "/invest",
  // },
  {
    icon: "speed",
    text: "Systems Dashboard",
    link: "/systems-dashboard",
  },
  {
    icon: "bitcoin-cash",
    text: "Assets Dashboard",
    link: "/assets-dashboard",
  },
  {
    icon: "coins",
    text: "Vulnerabilities Dashboard",
    link: "/vulnerabilities-dashboard",
  },
  {
    heading: "Systems Management",
  },
  {
    icon: "server",
    text: "Systems",
    subMenu: [
      {
        text: "System Inventory",
        link: "/systems",
        icon: "list-index",
      },
      {
        text: "System Discovery",
        link: "/systems/discovery",
        icon: "search",
      },
      {
        text: "System Analytics",
        link: "/systems/analytics",
        icon: "bar-chart",
      },
      {
        text: "Security Posture",
        link: "/systems/security",
        icon: "shield-check",
      },
      {
        text: "Compliance Status",
        link: "/systems/compliance",
        icon: "clipboard-check",
      },
    ],
  },
  {
    heading: "Asset Management",
  },
  {
    icon: "package",
    text: "Assets",
    subMenu: [
      {
        text: "Asset Analytics",
        link: "/assets/analytics",
        icon: "pie-chart",
      },
      {
        text: "Asset Inventory",
        link: "/assets/inventory",
        icon: "list-index",
      },
    ],
  },
  {
    heading: "Vulnerability Mgmt",
  },
  {
    icon: "shield-exclamation",
    text: "Vulnerabilities",
    subMenu: [
      {
        text: "Vulnerability Data",
        link: "/vulnerabilities/data",
        icon: "database",
      },
      {
        text: "Vulnerability Metrics",
        link: "/vulnerabilities/metrics",
        icon: "bar-chart",
      },
      {
        text: "POAM Management",
        link: "/vulnerabilities/poam-management",
        icon: "clipboard-list",
      },
    ],
  },
  {
    heading: "Patch Management",
  },
  {
    icon: "shield-check",
    text: "Patch Management",
    subMenu: [
      {
        text: "Dashboard",
        link: "/patch-management/dashboard",
        icon: "dashboard",
      },
      {
        text: "Patch Library",
        link: "/patch-management/library",
        icon: "package",
      },
      {
        text: "Patch Jobs",
        link: "/patch-management/jobs",
        icon: "play-circle",
      },
      {
        text: "AI Recommendations",
        link: "/patch-management/ai-recommendations",
        icon: "brain",
      },
    ],
  },
  {
    heading: "Scan Management",
  },
  {
    icon: "scan",
    text: "Scans",
    subMenu: [
      {
        text: "Scans",
        link: "/scan-management/scans",
        icon: "activity",
      },
      {
        text: "Results",
        link: "/scan-management/results",
        icon: "file-text",
      },
      {
        text: "Scan Terminal",
        link: "/scan-management/terminal",
        icon: "terminal",
      },
      {
        text: "Templates",
        link: "/scan-management/templates",
        icon: "template",
      },
      {
        text: "Schedule",
        link: "/scan-management/schedule",
        icon: "calendar",
      },
      {
        text: "Settings",
        link: "/scan-management/settings",
        icon: "setting",
      },
    ],
  },
  {
    heading: "Compliance Management",
  },
  {
    icon: "shield-check",
    text: "Risk Mgmt Framework",
    link: "/rmf",
  },
  {
    heading: "Policy Management",
  },
  {
    icon: "book",
    text: "Policies & Procedures",
    subMenu: [
      {
        text: "Policies & Procedures",
        link: "/policy-management/policies",
        icon: "activity", // black icon, same as 'Scans'
      },
    ],
  },
  {
    heading: "Document Management",
  },
  {
    icon: "file-docs",
    text: "Documents and Artifacts",
    link: "/app-file-manager",
  },
  {
    icon: "template",
    text: "Documents & Templates",
    link: "/document-management/templates",
  },
  {
    heading: "DASHBOARD & METRICS",
  },
  {
    icon: "dashboard-fill",
    text: "My Dashboards",
    link: "/my-dashboards",
  },
  {
    icon: "plus-circle",
    text: "Dashboard Creator",
    link: "/dashboard-creator",
  },
  {
    heading: "Admin Management",
  },
  {
    icon: "users",
    text: "Admin Management",
    subMenu: [
      {
        text: "Admin Dashboard",
        link: "/admin/dashboard",
        icon: "dashboard",
      },
      {
        text: "Users List",
        link: "/admin/users",
        icon: "user-list",
      },
      {
        text: "Roles",
        link: "/admin/roles",
        icon: "shield-star",
      },
      {
        text: "Permissions",
        link: "/admin/permissions",
        icon: "lock-alt",
      },
      {
        text: "Access Requests",
        link: "/admin/access-requests",
        icon: "user-check",
      },
      {
        text: "Role Management",
        link: "/admin/role-management",
        icon: "shield-check",
      },
      {
        text: "Distribution Groups",
        link: "/admin/distribution-groups",
        icon: "users",
      },
      {
        text: "Email Management",
        link: "/admin/email-management",
        icon: "mail",
      },
    ],
  },

  {
    icon: "mail",
    text: "Communication",
    subMenu: [
      {
        text: "Email Management",
        link: "/admin/email-management",
        icon: "mail",
      },
    ],
  },
  {
    icon: "activity",
    text: "System Monitoring",
    subMenu: [
      {
        text: "Audit Logs",
        link: "/admin/audit-logs",
        icon: "file-text",
      },
      {
        text: "Security Banner",
        link: "/admin/security-banner",
        icon: "shield-alert",
      },
    ],
  },
  {
    icon: "cpu",
    text: "Technology Management",
    subMenu: [
      {
        text: "AI Management",
        link: "/admin/ai-management",
        icon: "brain",
      },
      {
        text: "AWS Integration",
        link: "/admin/aws-integration",
        icon: "cloud",
      },
      {
        text: "Database Management",
        link: "/admin/database-management",
        icon: "database",
      },
    ],
  },
  {
    icon: "shield",
    text: "Security & Compliance",
    subMenu: [
      {
        text: "CVE Database",
        link: "/admin/cve-database",
        icon: "alert-triangle",
      },
      {
        text: "Controls Import",
        link: "/admin/controls-import",
        icon: "upload",
      },
    ],
  },
  {
    icon: "settings",
    text: "System Configuration",
    subMenu: [
      {
        text: "Environment Settings",
        link: "/admin/environment-settings",
        icon: "server",
      },
      {
        text: "System Settings",
        link: "/admin/system-settings",
        icon: "settings",
      },
      {
        text: "API Documentation",
        link: "/admin/api-documentation",
        icon: "book",
      },
    ],
  },
  {
    icon: "database",
    text: "Ingestion Simulation",
    subMenu: [
      {
        text: "Manage Jobs",
        link: "/admin/ingestion-simulation",
        icon: "list-index",
      },
    ],
  },
  // {
  //   heading: "Pre-built Pages",
  // },
  // {
  //   icon: "tile-thumb",
  //   text: "Projects",
  //   subMenu: [
  //     {
  //       text: "Project Cards",
  //       link: "/project-card",
  //       icon: "grid-alt",
  //     },
  //     {
  //       text: "Project List",
  //       link: "/project-list",
  //       icon: "list-index",
  //     },
  //   ],
  // },
  // {
  //   icon: "users",
  //   text: "User Manage",
  //   subMenu: [
  //     {
  //       text: "User List - Regular",
  //       link: "/user-list-regular",
  //       icon: "user-list",
  //     },
  //     {
  //       text: "User List - Compact",
  //       link: "/user-list-compact",
  //       icon: "grid-alt",
  //     },
  //     {
  //       text: "User Details - Regular",
  //       link: "/user-details-regular/1",
  //       icon: "user",
  //     },
  //     {
  //       text: "User Profile - Regular",
  //       link: "/user-profile-regular",
  //       icon: "user-circle",
  //     },
  //     {
  //       text: "User Contact - Card",
  //       link: "/user-contact-card",
  //       icon: "contact",
  //     },
  //   ],
  // },
  // {
  //   icon: "file-docs",
  //   text: "AML / KYCs",
  //   subMenu: [
  //     {
  //       text: "KYC List - Regular",
  //       link: "/kyc-list-regular",
  //       icon: "list-index",
  //     },
  //     {
  //       text: "KYC Details - Regular",
  //       link: "/kyc-details-regular/UD01544",
  //       icon: "file-text",
  //     },
  //   ],
  // },
  // {
  //   icon: "tranx",
  //   text: "Transaction",
  //   subMenu: [
  //     {
  //       text: "Trans List - Basic",
  //       link: "/transaction-basic",
  //       icon: "list-index",
  //     },
  //     {
  //       text: "Trans List - Crypto",
  //       link: "/transaction-crypto",
  //       icon: "bitcoin-cash",
  //     },
  //   ],
  // },
  // {
  //   icon: "card-view",
  //   text: "Products",
  //   subMenu: [
  //     {
  //       text: "Product List",
  //       link: "/product-list",
  //     },
  //     {
  //       text: "Product Card",
  //       link: "/product-card",
  //     },
  //     {
  //       text: "Product Details",
  //       link: "/product-details/0",
  //     },
  //   ],
  // },
  // {
  //   icon: "file-docs",
  //   text: "Invoice",
  //   subMenu: [
  //     {
  //       text: "Invoice List",
  //       link: "/invoice-list",
  //     },
  //     {
  //       text: "Invoice Details",
  //       link: "/invoice-details/1",
  //     },
  //   ],
  // },
  // {
  //   icon: "view-col",
  //   text: "Pricing Table",
  //   link: "/pricing-table",
  // },
  // {
  //   icon: "img",
  //   text: "Image Gallery",
  //   link: "/image-gallery",
  // },
  // {
  //   heading: "Misc Pages",
  // },
  // {
  //   icon: "signin",
  //   text: "Auth Pages",
  //   subMenu: [
  //     {
  //       text: "Login / Signin",
  //       link: "/auth-login",
  //       newTab: true,
  //     },
  //     {
  //       text: "Register / Signup",
  //       link: "/auth-register",
  //       newTab: true,
  //     },
  //     {
  //       text: "Forgot Password",
  //       link: "/auth-reset",
  //       newTab: true,
  //     },
  //     {
  //       text: "Success / Confirm",
  //       link: "/auth-success",
  //       newTab: true,
  //     },
  //   ],
  // },
  // {
  //   icon: "files",
  //   text: "Error Pages",
  //   subMenu: [
  //     {
  //       text: "404 Classic",
  //       link: "/errors/404-classic",
  //       newTab: true,
  //     },
  //     {
  //       text: "504 Classic",
  //       link: "/errors/504-classic",
  //       newTab: true,
  //     },
  //     {
  //       text: "404 Modern",
  //       link: "/errors/404-modern",
  //       newTab: true,
  //     },
  //     {
  //       text: "504 Modern",
  //       link: "/errors/504-modern",
  //       newTab: true,
  //     },
  //   ],
  // },
  // {
  //   icon: "files",
  //   text: "Other Pages",
  //   subMenu: [
  //     {
  //       text: "Blank / Startup",
  //       link: "/_blank",
  //     },
  //     {
  //       text: "Faqs / Help",
  //       link: "/pages/faq",
  //     },
  //     {
  //       text: "Terms / Policy",
  //       link: "/pages/terms-policy",
  //     },
  //     {
  //       text: "Regular Page - v1",
  //       link: "/pages/regular-v1",
  //     },
  //     {
  //       text: "Regular Page - v2",
  //       link: "/pages/regular-v2",
  //     },
  //   ],
  // },
  // {
  //   heading: "Components",
  // },
  // {
  //   icon: "layers",
  //   text: "Ui Elements",
  //   subMenu: [
  //     {
  //       text: "Alerts",
  //       link: "/components/alerts",
  //     },
  //     {
  //       text: "Accordions",
  //       link: "/components/accordions",
  //     },
  //     {
  //       text: "Avatar",
  //       link: "/components/avatar",
  //     },
  //     {
  //       text: "Badges",
  //       link: "/components/badges",
  //     },
  //     {
  //       text: "Buttons",
  //       link: "/components/buttons",
  //     },
  //     {
  //       text: "Button Group",
  //       link: "/components/button-group",
  //     },
  //     {
  //       text: "Breadcrumbs",
  //       link: "/components/breadcrumbs",
  //     },
  //     {
  //       text: "Cards",
  //       link: "/components/cards",
  //     },
  //     {
  //       text: "Carousel",
  //       link: "/components/carousel",
  //     },
  //     {
  //       text: "Dropdowns",
  //       link: "/components/dropdowns",
  //     },
  //     {
  //       text: "Modals",
  //       link: "/components/modals",
  //     },
  //     {
  //       text: "Pagination",
  //       link: "/components/pagination",
  //     },
  //     {
  //       text: "Popovers",
  //       link: "/components/popovers",
  //     },
  //     {
  //       text: "Progress",
  //       link: "/components/progress",
  //     },
  //     {
  //       text: "Spinner",
  //       link: "/components/spinner",
  //     },
  //     {
  //       text: "Tabs",
  //       link: "/components/tabs",
  //     },
  //     {
  //       text: "Toast",
  //       link: "/components/toast",
  //     },
  //     {
  //       text: "Typography",
  //       link: "/components/typography",
  //     },
  //     {
  //       text: "Tooltips",
  //       link: "/components/tooltips",
  //     },
  //     {
  //       text: "Utilities",
  //       subMenu: [
  //         {
  //           text: "Borders",
  //           link: "/components/util-border",
  //         },
  //         {
  //           text: "Colors",
  //           link: "/components/util-colors",
  //         },
  //         {
  //           text: "Display",
  //           link: "/components/util-display",
  //         },
  //         {
  //           text: "Embeded",
  //           link: "/components/util-embeded",
  //         },
  //         {
  //           text: "Flex",
  //           link: "/components/util-flex",
  //         },
  //         {
  //           text: "Text",
  //           link: "/components/util-text",
  //         },
  //         {
  //           text: "Sizing",
  //           link: "/components/util-sizing",
  //         },
  //         {
  //           text: "Spacing",
  //           link: "/components/util-spacing",
  //         },
  //         {
  //           text: "Others",
  //           link: "/components/util-others",
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   icon: "dot-box",
  //   text: "Crafted Icons",
  //   subMenu: [
  //     {
  //       text: "SVG Icon-Exclusive",
  //       link: "/svg-icons",
  //     },
  //     {
  //       text: "Nioicon - HandCrafted",
  //       link: "/nioicon",
  //     },
  //   ],
  // },
  // {
  //   icon: "table-view",
  //   text: "Tables",
  //   subMenu: [
  //     {
  //       text: "Basic Tables",
  //       link: "/table-basic",
  //     },
  //     {
  //       text: "Special Tables",
  //       link: "/table-special",
  //     },
  //     {
  //       text: "DataTables",
  //       link: "/table-datatable",
  //     },
  //   ],
  // },
  // {
  //   icon: "card-view",
  //   text: "Forms",
  //   subMenu: [
  //     {
  //       text: "Form Elements",
  //       link: "/components/form-elements",
  //     },
  //     {
  //       text: "Checkbox Radio",
  //       link: "/components/checkbox-radio",
  //     },
  //     {
  //       text: "Advanced Controls",
  //       link: "/components/advanced-control",
  //     },
  //     {
  //       text: "Input Group",
  //       link: "/components/input-group",
  //     },
  //     {
  //       text: "Form Upload",
  //       link: "/components/form-upload",
  //     },
  //     {
  //       text: "Form Layouts",
  //       link: "/components/form-layouts",
  //     },
  //     {
  //       text: "Form Validation",
  //       link: "/components/form-validation",
  //     },
  //     {
  //       text: "Date Time Picker",
  //       link: "/components/datetime-picker",
  //     },
  //     {
  //       text: "Number Spinner",
  //       link: "/components/number-spinner",
  //     },
  //     {
  //       text: "noUiSlider",
  //       link: "/components/nouislider",
  //     },
  //     {
  //       text: "Wizard Basic",
  //       link: "/components/wizard-basic",
  //     },
  //     {
  //       text: "Rich Editor",
  //       subMenu: [
  //         {
  //           text: "Quill",
  //           link: "/components/quill",
  //         },
  //         {
  //           text: "Tinymce",
  //           link: "/components/tinymce",
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   icon: "pie",
  //   text: "Charts",
  //   subMenu: [
  //     {
  //       text: "Chart Js",
  //       link: "/charts/chartjs",
  //     },
  //     {
  //       text: "Knobs",
  //       link: "/charts/knobs",
  //     },
  //   ],
  // },
  // {
  //   icon: "puzzle",
  //   text: "Widgets",
  //   subMenu: [
  //     {
  //       text: "Card Widgets",
  //       link: "/components/widgets/cards",
  //     },
  //     {
  //       text: "Chart Widgets",
  //       link: "/components/widgets/charts",
  //     },
  //     {
  //       text: "Rating Widgets",
  //       link: "/components/widgets/rating",
  //     },
  //   ],
  // },
  // {
  //   icon: "block-over",
  //   text: "Miscellaneous",
  //   subMenu: [
  //     {
  //       text: "Slick Sliders",
  //       link: "/components/misc/slick-slider",
  //     },
  //     {
  //       text: "Tree View",
  //       link: "/components/misc/tree-view",
  //     },
  //     {
  //       text: "React Toastify",
  //       link: "/components/misc/toastify",
  //     },
  //     {
  //       text: "Sweet Alert",
  //       link: "/components/misc/sweet-alert",
  //     },
  //     {
  //       text: "React DualListBox",
  //       link: "/components/misc/dual-list",
  //     },
  //     {
  //       text: "Dnd Kit",
  //       link: "/components/misc/dnd",
  //     },
  //     {
  //       text: "Google Map",
  //       link: "/components/misc/map",
  //     },
  //   ],
  // },
  // {
  //   icon: "text-rich",
  //   text: "Email Template",
  //   link: "/email-template",
  // },
];
// Add NLQ Admin menu item at the end
menu.push({
  icon: "robot",
  text: "NLQ Admin",
  link: "/admin/nlq",
});

export default menu;
