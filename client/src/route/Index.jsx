import React, { useEffect, Suspense } from "react";
import { Routes, Route, useLocation, BrowserRouter } from "react-router-dom";
import { ProductContextProvider } from "@/pages/pre-built/products/ProductContext";
import { UserContextProvider } from "@/pages/pre-built/user-manage/UserContext";

// Auth imports
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Layout imports (keep these as they're critical)
import Layout from "@/layout/Index";
import LayoutNoSidebar from "@/layout/Index-nosidebar";
import LayoutApp from "@/layout/Index-app";
import ThemeProvider from "@/layout/provider/Theme";
import FileManagerProviderWrapper from "@/pages/app/file-manager/components/ProviderWrapper";

// Loading component
const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

// Lazy load all page components
const Sales = React.lazy(() => import("@/pages/Sales"));
const Crypto = React.lazy(() => import("@/pages/Crypto"));
const HomePage = React.lazy(() => import("@/pages/Homepage.jsx"));
const Invest = React.lazy(() => import("@/pages/Invest"));

// New Dashboard Pages
const SecurityPostureDashboard = React.lazy(() => import("@/pages/dashboards/SecurityPostureDashboard"));
const SystemsDashboard = React.lazy(() => import("@/pages/dashboards/SystemsDashboard"));
const AssetsDashboard = React.lazy(() => import("@/pages/dashboards/AssetsDashboard"));
const VulnerabilitiesDashboard = React.lazy(() => import("@/pages/dashboards/VulnerabilitiesDashboard"));

// Dashboard Creator Pages
const MyDashboards = React.lazy(() => import("@/pages/MyDashboards"));
const DashboardCreator = React.lazy(() => import("@/pages/DashboardCreator"));

// Systems Management
const SystemsMain = React.lazy(() => import("@/pages/systems/SystemsMain"));
const SystemDiscovery = React.lazy(() => import("@/pages/systems/SystemDiscovery"));
const SystemAnalytics = React.lazy(() => import("@/pages/systems/SystemAnalytics"));
const SecurityPosture = React.lazy(() => import("@/pages/systems/SecurityPosture"));

// Asset Management
const AssetAnalytics = React.lazy(() => import("@/pages/assets/AssetAnalytics"));
const AssetInventory = React.lazy(() => import("@/pages/assets/AssetInventory"));

// Vulnerability Management
const VulnerabilityData = React.lazy(() => import("@/pages/vulnerabilities/VulnerabilityData"));
const VulnerabilityMetrics = React.lazy(() => import("@/pages/vulnerabilities/VulnerabilityMetrics"));
const POAMManagement = React.lazy(() => import("@/pages/vulnerabilities/POAMManagement"));

// Patch Management
const PatchManagementDashboard = React.lazy(() => import("@/pages/patch-management/Dashboard"));
const PatchLibrary = React.lazy(() => import("@/pages/patch-management/PatchLibrary"));
const PatchJobs = React.lazy(() => import("@/pages/patch-management/PatchJobs"));
const AIRecommendations = React.lazy(() => import("@/pages/patch-management/AIRecommendations"));

// Admin Management
const AdminUsers = React.lazy(() => import("@/pages/admin/users/AdminUsers"));
const NlqAdmin = React.lazy(() => import("@/pages/admin/NlqAdmin"));
const AdminDashboard = React.lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminRoles = React.lazy(() => import("@/pages/admin/roles/AdminRoles"));
const AdminPermissions = React.lazy(() => import("@/pages/admin/permissions/AdminPermissions"));
const IngestionSimulationPage = React.lazy(() => import("@/pages/admin/ingestion-simulation/IngestionSimulationPage"));
const AccessRequests = React.lazy(() => import("@/pages/admin/access-requests/AccessRequests"));
const RoleManagement = React.lazy(() => import("@/pages/admin/role-management/RoleManagement"));
const DistributionGroups = React.lazy(() => import("@/pages/admin/distribution-groups/DistributionGroups"));
const EditDistributionGroup = React.lazy(() => import("@/pages/admin/distribution-groups/EditDistributionGroup"));
const GroupMembers = React.lazy(() => import("@/pages/admin/distribution-groups/GroupMembers"));
const EmailManagement = React.lazy(() => import("@/pages/admin/email-management/EmailManagement"));
const AuditLogs = React.lazy(() => import("@/pages/admin/audit-logs/AuditLogs"));
const AIManagement = React.lazy(() => import("@/pages/admin/ai-management/AIManagement"));
const AWSIntegration = React.lazy(() => import("@/pages/admin/aws-integration/AWSIntegration"));
const SecurityBanner = React.lazy(() => import("@/pages/admin/security-banner/SecurityBanner"));
const DatabaseManagement = React.lazy(() => import("@/pages/admin/database-management/DatabaseManagement"));
const CVEDatabase = React.lazy(() => import("@/pages/admin/cve-database/CVEDatabase"));
const ControlsImport = React.lazy(() => import("@/pages/admin/controls-import/ControlsImport"));
const APIDocumentation = React.lazy(() => import("@/pages/admin/api-documentation/APIDocumentation"));
const EnvironmentSettings = React.lazy(() => import("@/pages/admin/environment-settings/EnvironmentSettings"));
const SystemSettings = React.lazy(() => import("@/pages/admin/system-settings/SystemSettings"));

// Document Management
const DocumentManager = React.lazy(() => import("@/pages/documents/DocumentManager"));

// Scan Management - Direct imports for better reliability
const Scans = React.lazy(() => import("@/pages/scan-management/Scans"));
const Results = React.lazy(() => import("@/pages/scan-management/Results"));
const ScanTerminal = React.lazy(() => import("@/pages/scan-management/ScanTerminal"));
const Templates = React.lazy(() => import("@/pages/scan-management/Templates"));
const Schedule = React.lazy(() => import("@/pages/scan-management/Schedule"));
const ScanSettings = React.lazy(() => import("@/pages/scan-management/Settings"));

// Scanner Test Page
const ScannerTest = React.lazy(() => import("@/pages/ScannerTest"));

// Document Management - Direct imports for better reliability
const DocumentLibrary = React.lazy(() => import("@/pages/document-management/DocumentLibrary"));
const UploadDocument = React.lazy(() => import("@/pages/document-management/UploadDocument"));
const DocumentTemplate = React.lazy(() => import("@/pages/document-management/DocumentTemplate"));
const Categories = React.lazy(() => import("@/pages/document-management/Categories"));
const Tags = React.lazy(() => import("@/pages/document-management/Tags"));
const DocumentSettings = React.lazy(() => import("@/pages/document-management/DocumentSettings"));

// Policy Management
const Policies = React.lazy(() => import("@/pages/policy-management/Policies"));

// Components
const Component = React.lazy(() => import("@/pages/components/Index"));
const Accordian = React.lazy(() => import("@/pages/components/Accordions"));
const Alerts = React.lazy(() => import("@/pages/components/Alerts"));
const Avatar = React.lazy(() => import("@/pages/components/Avatar"));
const Badges = React.lazy(() => import("@/pages/components/Badges"));
const Breadcrumbs = React.lazy(() => import("@/pages/components/Breadcrumbs"));
const ButtonGroup = React.lazy(() => import("@/pages/components/ButtonGroup"));
const Buttons = React.lazy(() => import("@/pages/components/Buttons"));
const Cards = React.lazy(() => import("@/pages/components/Cards"));
const Carousel = React.lazy(() => import("@/pages/components/Carousel"));
const Dropdowns = React.lazy(() => import("@/pages/components/Dropdowns"));
const FormElements = React.lazy(() => import("@/pages/components/forms/FormElements"));
const FormLayouts = React.lazy(() => import("@/pages/components/forms/FormLayouts"));
const FormValidation = React.lazy(() => import("@/pages/components/forms/FormValidation"));
const DataTablePage = React.lazy(() => import("@/pages/components/table/DataTable"));
const DateTimePicker = React.lazy(() => import("@/pages/components/forms/DateTimePicker"));
const CardWidgets = React.lazy(() => import("@/pages/components/widgets/CardWidgets"));
const ChartWidgets = React.lazy(() => import("@/pages/components/widgets/ChartWidgets"));
const RatingWidgets = React.lazy(() => import("@/pages/components/widgets/RatingWidgets"));
const SlickPage = React.lazy(() => import("@/pages/components/misc/Slick"));
const SweetAlertPage = React.lazy(() => import("@/pages/components/misc/SweetAlert"));
const DndKit = React.lazy(() => import("@/pages/components/misc/DndKit"));
const DualListPage = React.lazy(() => import("@/pages/components/misc/DualListbox"));
const GoogleMapPage = React.lazy(() => import("@/pages/components/misc/GoogleMap"));
const Modals = React.lazy(() => import("@/pages/components/Modals"));
const Pagination = React.lazy(() => import("@/pages/components/Pagination"));
const Popovers = React.lazy(() => import("@/pages/components/Popovers"));
const Progress = React.lazy(() => import("@/pages/components/Progress"));
const Spinner = React.lazy(() => import("@/pages/components/Spinner"));
const Tabs = React.lazy(() => import("@/pages/components/Tabs"));
const Toast = React.lazy(() => import("@/pages/components/Toast"));
const Tooltips = React.lazy(() => import("@/pages/components/Tooltips"));
const Typography = React.lazy(() => import("@/pages/components/Typography"));
const CheckboxRadio = React.lazy(() => import("@/pages/components/forms/CheckboxRadio"));
const AdvancedControls = React.lazy(() => import("@/pages/components/forms/AdvancedControls"));
const InputGroup = React.lazy(() => import("@/pages/components/forms/InputGroup"));
const FormUpload = React.lazy(() => import("@/pages/components/forms/FormUpload"));
const NumberSpinner = React.lazy(() => import("@/pages/components/forms/NumberSpinner"));
const NouiSlider = React.lazy(() => import("@/pages/components/forms/nouislider"));
const WizardForm = React.lazy(() => import("@/pages/components/forms/WizardForm"));
const UtilBorder = React.lazy(() => import("@/pages/components/UtilBorder"));
const UtilColors = React.lazy(() => import("@/pages/components/UtilColors"));
const UtilDisplay = React.lazy(() => import("@/pages/components/UtilDisplay"));
const UtilEmbeded = React.lazy(() => import("@/pages/components/UtilEmbeded"));
const UtilFlex = React.lazy(() => import("@/pages/components/UtilFlex"));
const UtilOthers = React.lazy(() => import("@/pages/components/UtilOthers"));
const UtilSizing = React.lazy(() => import("@/pages/components/UtilSizing"));
const UtilSpacing = React.lazy(() => import("@/pages/components/UtilSpacing"));
const UtilText = React.lazy(() => import("@/pages/components/UtilText"));

// Others
const Blank = React.lazy(() => import("@/pages/others/Blank"));
const Faq = React.lazy(() => import("@/pages/others/Faq"));
const Regularv1 = React.lazy(() => import("@/pages/others/Regular-1"));
const Regularv2 = React.lazy(() => import("@/pages/others/Regular-2"));
const Terms = React.lazy(() => import("@/pages/others/Terms"));
const BasicTable = React.lazy(() => import("@/pages/components/table/BasicTable"));
const SpecialTablePage = React.lazy(() => import("@/pages/components/table/SpecialTable"));
const ChartPage = React.lazy(() => import("@/pages/components/charts/Charts"));
const EmailTemplate = React.lazy(() => import("@/pages/components/email-template/Email"));
const NioIconPage = React.lazy(() => import("@/pages/components/crafted-icons/NioIcon"));
const SVGIconPage = React.lazy(() => import("@/pages/components/crafted-icons/SvgIcons"));

// Pre-built
const ProjectCardPage = React.lazy(() => import("@/pages/pre-built/projects/ProjectCard"));
const ProjectListPage = React.lazy(() => import("@/pages/pre-built/projects/ProjectList"));
const UserListRegular = React.lazy(() => import("@/pages/pre-built/user-manage/UserListRegular"));
const UserContactCard = React.lazy(() => import("@/pages/pre-built/user-manage/UserContactCard"));
const UserDetails = React.lazy(() => import("@/pages/pre-built/user-manage/UserDetailsRegular"));
const UserListCompact = React.lazy(() => import("@/pages/pre-built/user-manage/UserListCompact"));
const UserProfileRegular = React.lazy(() => import("@/pages/pre-built/user-manage/UserProfileRegular"));
const UserProfileSetting = React.lazy(() => import("@/pages/pre-built/user-manage/UserProfileSetting"));
const UserProfileNotification = React.lazy(() => import("@/pages/pre-built/user-manage/UserProfileNotification"));
const UserProfileActivity = React.lazy(() => import("@/pages/pre-built/user-manage/UserProfileActivity"));
const KycListRegular = React.lazy(() => import("@/pages/pre-built/kyc-list-regular/KycListRegular"));
const KycDetailsRegular = React.lazy(() => import("@/pages/pre-built/kyc-list-regular/kycDetailsRegular"));
const TransListBasic = React.lazy(() => import("@/pages/pre-built/trans-list/TransListBasic"));
const TransListCrypto = React.lazy(() => import("@/pages/pre-built/trans-list/TransListCrypto"));
const ProductCard = React.lazy(() => import("@/pages/pre-built/products/ProductCard"));
const ProductList = React.lazy(() => import("@/pages/pre-built/products/ProductList"));
const ProductDetails = React.lazy(() => import("@/pages/pre-built/products/ProductDetails"));
const InvoiceList = React.lazy(() => import("@/pages/pre-built/invoice/InvoiceList"));
const InvoiceDetails = React.lazy(() => import("@/pages/pre-built/invoice/InvoiceDetails"));
const InvoicePrint = React.lazy(() => import("@/pages/pre-built/invoice/InvoicePrint"));
const PricingTable = React.lazy(() => import("@/pages/pre-built/pricing-table/PricingTable"));
const GalleryPreview = React.lazy(() => import("@/pages/pre-built/gallery/GalleryCardPreview"));
const ReactToastify = React.lazy(() => import("@/pages/components/misc/ReactToastify"));

// App pages
const AppMessages = React.lazy(() => import("@/pages/app/messages/Messages"));
const Chat = React.lazy(() => import("@/pages/app/chat/ChatContainer"));
const Kanban = React.lazy(() => import("@/pages/app/kanban/Kanban"));
const FileManager = React.lazy(() => import("@/pages/app/file-manager/FileManager"));
const FileManagerFiles = React.lazy(() => import("@/pages/app/file-manager/FileManagerFiles"));
const FileManagerShared = React.lazy(() => import("@/pages/app/file-manager/FileManagerShared"));
const FileManagerStarred = React.lazy(() => import("@/pages/app/file-manager/FileManagerStarred"));
const FileManagerRecovery = React.lazy(() => import("@/pages/app/file-manager/FileManagerRecovery"));
const FileManagerSettings = React.lazy(() => import("@/pages/app/file-manager/FileManagerSettings"));
const Inbox = React.lazy(() => import("@/pages/app/inbox/Inbox"));
const TreeViewPreview = React.lazy(() => import("@/pages/components/misc/TreeView"));
const Calender = React.lazy(() => import("@/pages/app/calender/Calender"));
const QuillPreview = React.lazy(() => import("@/pages/components/forms/rich-editor/QuillPreview"));
const TinymcePreview = React.lazy(() => import("@/pages/components/forms/rich-editor/TinymcePreview"));
const KnobPreview = React.lazy(() => import("@/pages/components/charts/KnobPreview"));

// Error pages
const Error404Classic = React.lazy(() => import("@/pages/error/404-classic"));
const Error404Modern = React.lazy(() => import("@/pages/error/404-modern"));
const Error504Modern = React.lazy(() => import("@/pages/error/504-modern"));
const Error504Classic = React.lazy(() => import("@/pages/error/504-classic"));

// Auth pages
const Login = React.lazy(() => import("@/pages/auth/Login"));
const Register = React.lazy(() => import("@/pages/auth/Register"));
const ForgotPassword = React.lazy(() => import("@/pages/auth/ForgotPassword"));
const Success = React.lazy(() => import("@/pages/auth/Success"));

// RMF (Risk Management Framework) Pages
const RMFDashboard = React.lazy(() => import("@/pages/rmf/RMFDashboard"));
const RMFProjects = React.lazy(() => import("@/pages/rmf/RMFProjects"));
const RMFNewProject = React.lazy(() => import("@/pages/rmf/RMFNewProject"));
const RMFCategorizeStep = React.lazy(() => import("@/pages/rmf/steps/RMFCategorizeStep"));


const ScrollToTop = (props) => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return <>{props.children}</>
};

const Pages = () => {
  return (
    <BrowserRouter future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}>
      <AuthProvider>
        <ScrollToTop>
          <Routes>
            <Route element={<ThemeProvider />}>
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Suspense fallback={<PageLoader />}><AssetAnalytics /></Suspense>}></Route>
              <Route path="crypto" element={<Suspense fallback={<PageLoader />}><Crypto /></Suspense>}></Route>
              <Route path="sales" element={<Suspense fallback={<PageLoader />}><Sales /></Suspense>}></Route>
              <Route path="invest" element={<Suspense fallback={<PageLoader />}><Invest /></Suspense>}></Route>

              {/*New Dashboard Routes*/}
              <Route path="security-posture-dashboard" element={<Suspense fallback={<PageLoader />}><SecurityPostureDashboard /></Suspense>}></Route>
              <Route path="systems-dashboard" element={<Suspense fallback={<PageLoader />}><SystemsDashboard /></Suspense>}></Route>
              <Route path="assets-dashboard" element={<Suspense fallback={<PageLoader />}><AssetsDashboard /></Suspense>}></Route>
              <Route path="vulnerabilities-dashboard" element={<Suspense fallback={<PageLoader />}><VulnerabilitiesDashboard /></Suspense>}></Route>

              {/*Dashboard Creator Routes*/}
              <Route path="my-dashboards" element={<Suspense fallback={<PageLoader />}><MyDashboards /></Suspense>}></Route>
              <Route path="dashboard-creator" element={<Suspense fallback={<PageLoader />}><DashboardCreator /></Suspense>}></Route>

              <Route path="_blank" element={<Suspense fallback={<PageLoader />}><Blank /></Suspense>}></Route>

              {/*Systems Management*/}
              <Route path="systems" element={<Suspense fallback={<PageLoader />}><SystemsMain /></Suspense>}></Route>
              <Route path="systems/discovery" element={<Suspense fallback={<PageLoader />}><SystemDiscovery /></Suspense>}></Route>
              <Route path="systems/analytics" element={<Suspense fallback={<PageLoader />}><SystemAnalytics /></Suspense>}></Route>
              <Route path="systems/security" element={<Suspense fallback={<PageLoader />}><SecurityPosture /></Suspense>}></Route>
              <Route path="systems/compliance" element={<Suspense fallback={<PageLoader />}><SystemsMain /></Suspense>}></Route>

              {/*Asset Management*/}
              <Route path="assets" element={<Suspense fallback={<PageLoader />}><AssetAnalytics /></Suspense>}></Route>
              <Route path="assets/analytics" element={<Suspense fallback={<PageLoader />}><AssetAnalytics /></Suspense>}></Route>
              <Route path="assets/inventory" element={<Suspense fallback={<PageLoader />}><AssetInventory /></Suspense>}></Route>
              <Route path="asset-inventory" element={<Suspense fallback={<PageLoader />}><AssetInventory /></Suspense>}></Route>

              {/*Vulnerability Management*/}
              <Route path="vulnerabilities/data" element={<Suspense fallback={<PageLoader />}><VulnerabilityData /></Suspense>}></Route>
              <Route path="vulnerabilities/metrics" element={<Suspense fallback={<PageLoader />}><VulnerabilityMetrics /></Suspense>}></Route>
              <Route path="vulnerabilities/poam-management" element={<Suspense fallback={<PageLoader />}><POAMManagement /></Suspense>}></Route>

              {/*Patch Management*/}
              <Route path="patch-management/dashboard" element={<Suspense fallback={<PageLoader />}><PatchManagementDashboard /></Suspense>}></Route>
              <Route path="patch-management/library" element={<Suspense fallback={<PageLoader />}><PatchLibrary /></Suspense>}></Route>
              <Route path="patch-management/jobs" element={<Suspense fallback={<PageLoader />}><PatchJobs /></Suspense>}></Route>
              <Route path="patch-management/ai-recommendations" element={<Suspense fallback={<PageLoader />}><AIRecommendations /></Suspense>}></Route>

              {/*Admin Management*/}
              <Route path="admin/dashboard" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
              <Route path="admin/nlq" element={<Suspense fallback={<PageLoader />}><NlqAdmin /></Suspense>} />
              <Route path="admin/users" element={<Suspense fallback={<PageLoader />}><AdminUsers /></Suspense>}></Route>
              <Route path="admin/roles" element={<Suspense fallback={<PageLoader />}><AdminRoles /></Suspense>}></Route>
              <Route path="admin/permissions" element={<Suspense fallback={<PageLoader />}><AdminPermissions /></Suspense>}></Route>
              <Route path="admin/ingestion-simulation" element={<Suspense fallback={<PageLoader />}><IngestionSimulationPage /></Suspense>}></Route>
              <Route path="admin/access-requests" element={<Suspense fallback={<PageLoader />}><AccessRequests /></Suspense>}></Route>
              <Route path="admin/role-management" element={<Suspense fallback={<PageLoader />}><RoleManagement /></Suspense>}></Route>
              <Route path="admin/distribution-groups" element={<Suspense fallback={<PageLoader />}><DistributionGroups /></Suspense>}></Route>
              <Route path="admin/distribution-groups/:id/edit" element={<Suspense fallback={<PageLoader />}><EditDistributionGroup /></Suspense>}></Route>
              <Route path="admin/distribution-groups/:id/members" element={<Suspense fallback={<PageLoader />}><GroupMembers /></Suspense>}></Route>
              <Route path="admin/email-management" element={<Suspense fallback={<PageLoader />}><EmailManagement /></Suspense>}></Route>
              <Route path="admin/audit-logs" element={<Suspense fallback={<PageLoader />}><AuditLogs /></Suspense>}></Route>
              <Route path="admin/ai-management" element={<Suspense fallback={<PageLoader />}><AIManagement /></Suspense>}></Route>
              <Route path="admin/aws-integration" element={<Suspense fallback={<PageLoader />}><AWSIntegration /></Suspense>}></Route>
              <Route path="admin/security-banner" element={<Suspense fallback={<PageLoader />}><SecurityBanner /></Suspense>}></Route>
              <Route path="admin/database-management" element={<Suspense fallback={<PageLoader />}><DatabaseManagement /></Suspense>}></Route>
              <Route path="admin/cve-database" element={<Suspense fallback={<PageLoader />}><CVEDatabase /></Suspense>}></Route>
              <Route path="admin/controls-import" element={<Suspense fallback={<PageLoader />}><ControlsImport /></Suspense>}></Route>
              <Route path="admin/api-documentation" element={<Suspense fallback={<PageLoader />}><APIDocumentation /></Suspense>}></Route>
              <Route path="admin/environment-settings" element={<Suspense fallback={<PageLoader />}><EnvironmentSettings /></Suspense>}></Route>
              <Route path="admin/system-settings" element={<Suspense fallback={<PageLoader />}><SystemSettings /></Suspense>}></Route>

              {/*Document Management*/}
              <Route path="documents" element={<Suspense fallback={<PageLoader />}><DocumentManager /></Suspense>}></Route>
{/*RMF (Risk Management Framework)*/}
<Route path="rmf" element={<Suspense fallback={<PageLoader />}><RMFDashboard /></Suspense>}></Route>
<Route path="rmf/dashboard" element={<Suspense fallback={<PageLoader />}><RMFDashboard /></Suspense>}></Route>
<Route path="rmf/projects" element={<Suspense fallback={<PageLoader />}><RMFProjects /></Suspense>}></Route>
<Route path="rmf/projects/new" element={<Suspense fallback={<PageLoader />}><RMFNewProject /></Suspense>}></Route>
<Route path="rmf/projects/:projectId/step/categorize" element={<Suspense fallback={<PageLoader />}><RMFCategorizeStep /></Suspense>}></Route>


              {/*Scan Management*/}
              <Route path="scan-management/scans" element={<Suspense fallback={<PageLoader />}><Scans /></Suspense>}></Route>
              <Route path="scan-management/results" element={<Suspense fallback={<PageLoader />}><Results /></Suspense>}></Route>
              <Route path="scan-management/terminal" element={<Suspense fallback={<PageLoader />}><ScanTerminal /></Suspense>}></Route>
              <Route path="scan-management/templates" element={<Suspense fallback={<PageLoader />}><Templates /></Suspense>}></Route>
              <Route path="scan-management/schedule" element={<Suspense fallback={<PageLoader />}><Schedule /></Suspense>}></Route>
              <Route path="scan-management/settings" element={<Suspense fallback={<PageLoader />}><ScanSettings /></Suspense>}></Route>
              
              {/*Scanner Test Page*/}
              <Route path="scanner-test" element={<Suspense fallback={<PageLoader />}><ScannerTest /></Suspense>}></Route>

              {/*Policy Management*/}
              <Route path="policy-management/policies" element={<Suspense fallback={<PageLoader />}><Policies /></Suspense>}></Route>

              {/*Document Management*/}
              <Route path="document-management/library" element={<Suspense fallback={<PageLoader />}><DocumentLibrary /></Suspense>}></Route>
              <Route path="document-management/upload" element={<Suspense fallback={<PageLoader />}><UploadDocument /></Suspense>}></Route>
              <Route path="document-management/template" element={<Suspense fallback={<PageLoader />}><DocumentTemplate /></Suspense>}></Route>
              <Route path="document-management/categories" element={<Suspense fallback={<PageLoader />}><Categories /></Suspense>}></Route>
              <Route path="document-management/tags" element={<Suspense fallback={<PageLoader />}><Tags /></Suspense>}></Route>
              <Route path="document-management/settings" element={<Suspense fallback={<PageLoader />}><DocumentSettings /></Suspense>}></Route>

              {/*Pre-built Pages*/}
              <Route path="project-card" element={<Suspense fallback={<PageLoader />}><ProjectCardPage /></Suspense>}></Route>
              <Route path="project-list" element={<Suspense fallback={<PageLoader />}><ProjectListPage /></Suspense>}></Route>

              <Route element={<UserContextProvider />} >
                <Route path="user-list-regular" element={<Suspense fallback={<PageLoader />}><UserListRegular /></Suspense>}></Route>
                <Route path="user-list-compact" element={<Suspense fallback={<PageLoader />}><UserListCompact /></Suspense>}></Route>
                <Route path="user-contact-card" element={<Suspense fallback={<PageLoader />}><UserContactCard /></Suspense>}></Route>
                <Route path="user-details-regular/:userId" element={<Suspense fallback={<PageLoader />}><UserDetails /></Suspense>}></Route>
              </Route>

              <Route >
                <Route path="user-profile-notification" element={<Suspense fallback={<PageLoader />}><UserProfileNotification /></Suspense>} ></Route>
                <Route path="user-profile-regular" element={<Suspense fallback={<PageLoader />}><UserProfileRegular /></Suspense>}></Route>
                <Route path="user-profile-activity" element={<Suspense fallback={<PageLoader />}><UserProfileActivity /></Suspense>}></Route>
                <Route path="user-profile-setting" element={<Suspense fallback={<PageLoader />}><UserProfileSetting /></Suspense>}></Route>
              </Route>

              <Route path="kyc-list-regular" element={<Suspense fallback={<PageLoader />}><KycListRegular /></Suspense>}></Route>
              <Route path="kyc-details-regular/:kycId" element={<Suspense fallback={<PageLoader />}><KycDetailsRegular /></Suspense>}></Route>
              <Route path="transaction-basic" element={<Suspense fallback={<PageLoader />}><TransListBasic /></Suspense>}></Route>
              <Route path="transaction-crypto" element={<Suspense fallback={<PageLoader />}><TransListCrypto /></Suspense>}></Route>
              <Route element={<ProductContextProvider />}>
                <Route path="product-list" element={<Suspense fallback={<PageLoader />}><ProductList /></Suspense>}></Route>
                <Route path="product-card" element={<Suspense fallback={<PageLoader />}><ProductCard /></Suspense>}></Route>
                <Route path="product-details/:productId" element={<Suspense fallback={<PageLoader />}><ProductDetails /></Suspense>}></Route>
              </Route>

              <Route path="invoice-list" element={<Suspense fallback={<PageLoader />}><InvoiceList /></Suspense>}></Route>
              <Route path="invoice-details/:invoiceId" element={<Suspense fallback={<PageLoader />}><InvoiceDetails /></Suspense>}></Route>
              <Route path="pricing-table" element={<Suspense fallback={<PageLoader />}><PricingTable /></Suspense>}></Route>
              <Route path="image-gallery" element={<Suspense fallback={<PageLoader />}><GalleryPreview /></Suspense>}></Route>

              <Route path="pages">
                <Route path="terms-policy" element={<Suspense fallback={<PageLoader />}><Terms /></Suspense>}></Route>
                <Route path="faq" element={<Suspense fallback={<PageLoader />}><Faq /></Suspense>}></Route>
                <Route path="regular-v1" element={<Suspense fallback={<PageLoader />}><Regularv1 /></Suspense>}></Route>
                <Route path="regular-v2" element={<Suspense fallback={<PageLoader />}><Regularv2 /></Suspense>}></Route>
              </Route>

              <Route path="components">
                <Route index element={<Suspense fallback={<PageLoader />}><Component /></Suspense>}></Route>
                <Route path="accordions" element={<Suspense fallback={<PageLoader />}><Accordian /></Suspense>}></Route>
                <Route path="alerts" element={<Suspense fallback={<PageLoader />}><Alerts /></Suspense>}></Route>
                <Route path="avatar" element={<Suspense fallback={<PageLoader />}><Avatar /></Suspense>}></Route>
                <Route path="badges" element={<Suspense fallback={<PageLoader />}><Badges /></Suspense>}></Route>
                <Route path="breadcrumbs" element={<Suspense fallback={<PageLoader />}><Breadcrumbs /></Suspense>}></Route>
                <Route path="button-group" element={<Suspense fallback={<PageLoader />}><ButtonGroup /></Suspense>}></Route>
                <Route path="buttons" element={<Suspense fallback={<PageLoader />}><Buttons /></Suspense>}></Route>
                <Route path="cards" element={<Suspense fallback={<PageLoader />}><Cards /></Suspense>}></Route>
                <Route path="carousel" element={<Suspense fallback={<PageLoader />}><Carousel /></Suspense>}></Route>
                <Route path="dropdowns" element={<Suspense fallback={<PageLoader />}><Dropdowns /></Suspense>}></Route>
                <Route path="form-elements" element={<Suspense fallback={<PageLoader />}><FormElements /></Suspense>}></Route>
                <Route path="form-layouts" element={<Suspense fallback={<PageLoader />}><FormLayouts /></Suspense>}></Route>
                <Route path="checkbox-radio" element={<Suspense fallback={<PageLoader />}><CheckboxRadio /></Suspense>}></Route>
                <Route path="advanced-control" element={<Suspense fallback={<PageLoader />}><AdvancedControls /></Suspense>}></Route>
                <Route path="input-group" element={<Suspense fallback={<PageLoader />}><InputGroup /></Suspense>}></Route>
                <Route path="form-upload" element={<Suspense fallback={<PageLoader />}><FormUpload /></Suspense>}></Route>
                <Route path="number-spinner" element={<Suspense fallback={<PageLoader />}><NumberSpinner /></Suspense>}></Route>
                <Route path="form-validation" element={<Suspense fallback={<PageLoader />}><FormValidation /></Suspense>}></Route>
                <Route path="datetime-picker" element={<Suspense fallback={<PageLoader />}><DateTimePicker /></Suspense>}></Route>
                <Route path="modals" element={<Suspense fallback={<PageLoader />}><Modals /></Suspense>}></Route>
                <Route path="pagination" element={<Suspense fallback={<PageLoader />}><Pagination /></Suspense>}></Route>
                <Route path="popovers" element={<Suspense fallback={<PageLoader />}><Popovers /></Suspense>}></Route>
                <Route path="progress" element={<Suspense fallback={<PageLoader />}><Progress /></Suspense>}></Route>
                <Route path="spinner" element={<Suspense fallback={<PageLoader />}><Spinner /></Suspense>}></Route>
                <Route path="tabs" element={<Suspense fallback={<PageLoader />}><Tabs /></Suspense>}></Route>
                <Route path="toast" element={<Suspense fallback={<PageLoader />}><Toast /></Suspense>}></Route>
                <Route path="tooltips" element={<Suspense fallback={<PageLoader />}><Tooltips /></Suspense>}></Route>
                <Route path="typography" element={<Suspense fallback={<PageLoader />}><Typography /></Suspense>}></Route>
                <Route path="noUislider" element={<Suspense fallback={<PageLoader />}><NouiSlider /></Suspense>}></Route>
                <Route path="wizard-basic" element={<Suspense fallback={<PageLoader />}><WizardForm /></Suspense>}></Route>
                <Route path="quill" element={<Suspense fallback={<PageLoader />}><QuillPreview /></Suspense>}></Route>
                <Route path="tinymce" element={<Suspense fallback={<PageLoader />}><TinymcePreview /></Suspense>}></Route>
                <Route path="util-border" element={<Suspense fallback={<PageLoader />}><UtilBorder /></Suspense>}></Route>
                <Route path="util-colors" element={<Suspense fallback={<PageLoader />}><UtilColors /></Suspense>}></Route>
                <Route path="util-display" element={<Suspense fallback={<PageLoader />}><UtilDisplay /></Suspense>}></Route>
                <Route path="util-embeded" element={<Suspense fallback={<PageLoader />}><UtilEmbeded /></Suspense>}></Route>
                <Route path="util-flex" element={<Suspense fallback={<PageLoader />}><UtilFlex /></Suspense>}></Route>
                <Route path="util-others" element={<Suspense fallback={<PageLoader />}><UtilOthers /></Suspense>}></Route>
                <Route path="util-sizing" element={<Suspense fallback={<PageLoader />}><UtilSizing /></Suspense>}></Route>
                <Route path="util-spacing" element={<Suspense fallback={<PageLoader />}><UtilSpacing /></Suspense>}></Route>
                <Route path="util-text" element={<Suspense fallback={<PageLoader />}><UtilText /></Suspense>}></Route>

                <Route path="widgets">
                  <Route path="cards" element={<Suspense fallback={<PageLoader />}><CardWidgets /></Suspense>}></Route>
                  <Route path="charts" element={<Suspense fallback={<PageLoader />}><ChartWidgets /></Suspense>}></Route>
                  <Route path="rating" element={<Suspense fallback={<PageLoader />}><RatingWidgets /></Suspense>}></Route>
                </Route>

                <Route path="misc">
                  <Route path="slick-slider" element={<Suspense fallback={<PageLoader />}><SlickPage /></Suspense>}></Route>
                  <Route path="sweet-alert" element={<Suspense fallback={<PageLoader />}><SweetAlertPage /></Suspense>}></Route>
                  <Route path="dnd" element={<Suspense fallback={<PageLoader />}><DndKit /></Suspense>}></Route>
                  <Route path="dual-list" element={<Suspense fallback={<PageLoader />}><DualListPage /></Suspense>}></Route>
                  <Route path="map" element={<Suspense fallback={<PageLoader />}><GoogleMapPage /></Suspense>}></Route>
                  <Route path="toastify" element={<Suspense fallback={<PageLoader />}><ReactToastify /></Suspense>}></Route>
                  <Route path="tree-view" element={<Suspense fallback={<PageLoader />}><TreeViewPreview /></Suspense>}></Route>
                </Route>
              </Route>
              <Route path="charts">
                <Route path="chartjs" element={<Suspense fallback={<PageLoader />}><ChartPage /></Suspense>}></Route>
                <Route path="knobs" element={<Suspense fallback={<PageLoader />}><KnobPreview /></Suspense>}></Route>
              </Route>
              
              <Route path="table-basic" element={<Suspense fallback={<PageLoader />}><BasicTable /></Suspense>}></Route>
              <Route path="table-datatable" element={<Suspense fallback={<PageLoader />}><DataTablePage /></Suspense>}></Route>
              <Route path="table-special" element={<Suspense fallback={<PageLoader />}><SpecialTablePage /></Suspense>}></Route>
              <Route path="email-template" element={<Suspense fallback={<PageLoader />}><EmailTemplate /></Suspense>}></Route>
              <Route path="nioicon" element={<Suspense fallback={<PageLoader />}><NioIconPage /></Suspense>}></Route>
              <Route path="svg-icons" element={<Suspense fallback={<PageLoader />}><SVGIconPage /></Suspense>}></Route>
              
              {/*File Manager Routes - now inside main Layout to show left sidebar*/}
              <Route element={<FileManagerProviderWrapper />}>
                <Route path="app-file-manager">
                  <Route index element={<Suspense fallback={<PageLoader />}><FileManager /></Suspense>}></Route>
                  <Route path="files" element={<Suspense fallback={<PageLoader />}><FileManagerFiles /></Suspense>}></Route>
                  <Route path="starred" element={<Suspense fallback={<PageLoader />}><FileManagerStarred /></Suspense>}></Route>
                  <Route path="shared" element={<Suspense fallback={<PageLoader />}><FileManagerShared /></Suspense>}></Route>
                  <Route path="recovery" element={<Suspense fallback={<PageLoader />}><FileManagerRecovery /></Suspense>}></Route>
                </Route>
              </Route>
              </Route>
              <Route>
                <Route element={<ProtectedRoute><LayoutApp app={{icon:"chat", theme:"bg-purple-dim", text: "Messages"}} /></ProtectedRoute>}>
                  <Route path="app-messages" element={<Suspense fallback={<PageLoader />}><AppMessages /></Suspense>}></Route>
                </Route>
                <Route element={<ProtectedRoute><LayoutApp app={{icon:"chat-circle", theme:"bg-orange-dim", text: "NioChat"}} /></ProtectedRoute>}>
                  <Route path="app-chat" element={<Suspense fallback={<PageLoader />}><Chat /></Suspense>}></Route>
                </Route>
                <Route element={<ProtectedRoute><LayoutApp app={{icon:"calendar", theme:"bg-success-dim", text: "Calendar"}} /></ProtectedRoute>}>
                  <Route path="app-calender" element={<Suspense fallback={<PageLoader />}><Calender /></Suspense>}></Route>
                </Route>
                <Route element={<ProtectedRoute><LayoutApp app={{icon:"inbox", theme:"bg-primary-dim", text: "Mailbox"}} /></ProtectedRoute>}>
                  <Route path="app-inbox" element={<Suspense fallback={<PageLoader />}><Inbox /></Suspense>}></Route>
                </Route>
                <Route element={<ProtectedRoute><LayoutApp app={{icon:"template", theme:"bg-info-dim", text: "Kanban"}} /></ProtectedRoute>}>
                  <Route path="app-kanban" element={<Suspense fallback={<PageLoader />}><Kanban /></Suspense>}></Route>
                </Route>
              </Route>

            <Route element={<LayoutNoSidebar />}>
              <Route path="auth-success" element={<Suspense fallback={<PageLoader />}><Success /></Suspense>}></Route>
                <Route path="auth-reset" element={<Suspense fallback={<PageLoader />}><ForgotPassword /></Suspense>}></Route>
                <Route path="auth-register" element={<Suspense fallback={<PageLoader />}><Register /></Suspense>}></Route>
                <Route path="auth-login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>}></Route>

                <Route path="errors">
                  <Route path="404-modern" element={<Suspense fallback={<PageLoader />}><Error404Modern /></Suspense>}></Route>
                  <Route path="404-classic" element={<Suspense fallback={<PageLoader />}><Error404Classic /></Suspense>}></Route>
                  <Route path="504-modern" element={<Suspense fallback={<PageLoader />}><Error504Modern /></Suspense>}></Route>
                  <Route path="504-classic" element={<Suspense fallback={<PageLoader />}><Error504Classic /></Suspense>}></Route>
                </Route>
                <Route path="*" element={<Suspense fallback={<PageLoader />}><Error404Modern /></Suspense>}></Route>
                
                <Route path="invoice-print/:invoiceId" element={<Suspense fallback={<PageLoader />}><InvoicePrint /></Suspense>}></Route>
            </Route>
            </Route>
          </Routes>
        </ScrollToTop>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Pages;
