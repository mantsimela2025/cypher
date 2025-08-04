import React, { useEffect } from "react";
import { Routes, Route, useLocation, BrowserRouter } from "react-router-dom";
import { ProductContextProvider } from "@/pages/pre-built/products/ProductContext";
import { UserContextProvider } from "@/pages/pre-built/user-manage/UserContext";

import Sales from "@/pages/Sales";
import Crypto from "@/pages/Crypto";
import Homepage from "@/pages/Homepage";
import Invest from "@/pages/Invest";

// New Dashboard Pages
import SecurityPostureDashboard from "@/pages/dashboards/SecurityPostureDashboard";
import SystemsDashboard from "@/pages/dashboards/SystemsDashboard";
import AssetsDashboard from "@/pages/dashboards/AssetsDashboard";
import VulnerabilitiesDashboard from "@/pages/dashboards/VulnerabilitiesDashboard";

// Dashboard Creator Pages
import MyDashboards from "@/pages/MyDashboards";
import DashboardCreator from "@/pages/DashboardCreator";

// Systems Management
import SystemsMain from "@/pages/systems/SystemsMain";
import SystemDiscovery from "@/pages/systems/SystemDiscovery";
import SystemAnalytics from "@/pages/systems/SystemAnalytics";
import SecurityPosture from "@/pages/systems/SecurityPosture";

// Asset Management
import AssetAnalytics from "@/pages/assets/AssetAnalytics";
import AssetInventory from "@/pages/assets/AssetInventory";

// Vulnerability Management
import VulnerabilityData from "@/pages/vulnerabilities/VulnerabilityData";
import VulnerabilityMetrics from "@/pages/vulnerabilities/VulnerabilityMetrics";

// Admin Management
import AdminUsers from "@/pages/admin/users/AdminUsers";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminRoles from "@/pages/admin/roles/AdminRoles";
import AdminPermissions from "@/pages/admin/permissions/AdminPermissions";
import IngestionSimulationPage from "@/pages/admin/ingestion-simulation/IngestionSimulationPage";
import AccessRequests from "@/pages/admin/access-requests/AccessRequests";
import RoleManagement from "@/pages/admin/role-management/RoleManagement";
import DistributionGroups from "@/pages/admin/distribution-groups/DistributionGroups";
import EmailManagement from "@/pages/admin/email-management/EmailManagement";
import AuditLogs from "@/pages/admin/audit-logs/AuditLogs";
import AIManagement from "@/pages/admin/ai-management/AIManagement";
import AWSIntegration from "@/pages/admin/aws-integration/AWSIntegration";
import SecurityBanner from "@/pages/admin/security-banner/SecurityBanner";
import DatabaseManagement from "@/pages/admin/database-management/DatabaseManagement";
import CVEDatabase from "@/pages/admin/cve-database/CVEDatabase";
import ControlsImport from "@/pages/admin/controls-import/ControlsImport";
import APIDocumentation from "@/pages/admin/api-documentation/APIDocumentation";
import EnvironmentSettings from "@/pages/admin/environment-settings/EnvironmentSettings";
import SystemSettings from "@/pages/admin/system-settings/SystemSettings";

// Scan Management
import {
  Scans,
  Results,
  ScanTerminal,
  Templates,
  Schedule,
  Settings as ScanSettings
} from "@/pages/scan-management";

// Document Management
import {
  DocumentLibrary,
  UploadDocument,
  DocumentTemplate,
  Categories,
  Tags,
  DocumentSettings
} from "@/pages/document-management";
// Policy Management
import Policies from "@/pages/policy-management/Policies";

import Component from "@/pages/components/Index";
import Accordian from "@/pages/components/Accordions";
import Alerts from "@/pages/components/Alerts";
import Avatar from "@/pages/components/Avatar";
import Badges from "@/pages/components/Badges";
import Breadcrumbs from "@/pages/components/Breadcrumbs";
import ButtonGroup from "@/pages/components/ButtonGroup";
import Buttons from "@/pages/components/Buttons";
import Cards from "@/pages/components/Cards";
import Carousel from "@/pages/components/Carousel";
import Dropdowns from "@/pages/components/Dropdowns";
import FormElements from "@/pages/components/forms/FormElements";
import FormLayouts from "@/pages/components/forms/FormLayouts";
import FormValidation from "@/pages/components/forms/FormValidation";
import DataTablePage from "@/pages/components/table/DataTable";
import DateTimePicker from "@/pages/components/forms/DateTimePicker";
import CardWidgets from "@/pages/components/widgets/CardWidgets";
import ChartWidgets from "@/pages/components/widgets/ChartWidgets";
import RatingWidgets from "@/pages/components/widgets/RatingWidgets";
import SlickPage from "@/pages/components/misc/Slick";
import SweetAlertPage from "@/pages/components/misc/SweetAlert";
import DndKit from "@/pages/components/misc/DndKit";
import DualListPage from "@/pages/components/misc/DualListbox";
import GoogleMapPage from "@/pages/components/misc/GoogleMap";
import Modals from "@/pages/components/Modals";
import Pagination from "@/pages/components/Pagination";
import Popovers from "@/pages/components/Popovers";
import Progress from "@/pages/components/Progress";
import Spinner from "@/pages/components/Spinner";
import Tabs from "@/pages/components/Tabs";
import Toast from "@/pages/components/Toast";
import Tooltips from "@/pages/components/Tooltips";
import Typography from "@/pages/components/Typography";
import CheckboxRadio from "@/pages/components/forms/CheckboxRadio";
import AdvancedControls from "@/pages/components/forms/AdvancedControls";
import InputGroup from "@/pages/components/forms/InputGroup";
import FormUpload from "@/pages/components/forms/FormUpload";
import NumberSpinner from "@/pages/components/forms/NumberSpinner";
import NouiSlider from "@/pages/components/forms/nouislider";
import WizardForm from "@/pages/components/forms/WizardForm";
import UtilBorder from "@/pages/components/UtilBorder";
import UtilColors from "@/pages/components/UtilColors";
import UtilDisplay from "@/pages/components/UtilDisplay";
import UtilEmbeded from "@/pages/components/UtilEmbeded";
import UtilFlex from "@/pages/components/UtilFlex";
import UtilOthers from "@/pages/components/UtilOthers";
import UtilSizing from "@/pages/components/UtilSizing";
import UtilSpacing from "@/pages/components/UtilSpacing";
import UtilText from "@/pages/components/UtilText";

import Blank from "@/pages/others/Blank";
import Faq from "@/pages/others/Faq";
import Regularv1 from "@/pages/others/Regular-1";
import Regularv2 from "@/pages/others/Regular-2";
import Terms from "@/pages/others/Terms";
import BasicTable from "@/pages/components/table/BasicTable";
import SpecialTablePage from "@/pages/components/table/SpecialTable";
import ChartPage from "@/pages/components/charts/Charts";
import EmailTemplate from "@/pages/components/email-template/Email";
import NioIconPage from "@/pages/components/crafted-icons/NioIcon";
import SVGIconPage from "@/pages/components/crafted-icons/SvgIcons";

import ProjectCardPage from "@/pages/pre-built/projects/ProjectCard";
import ProjectListPage from "@/pages/pre-built/projects/ProjectList";
import UserListRegular from "@/pages/pre-built/user-manage/UserListRegular";
import UserContactCard from "@/pages/pre-built/user-manage/UserContactCard";
import UserDetails from "@/pages/pre-built/user-manage/UserDetailsRegular";
import UserListCompact from "@/pages/pre-built/user-manage/UserListCompact";
import UserProfileRegular from "@/pages/pre-built/user-manage/UserProfileRegular";
import UserProfileSetting from "@/pages/pre-built/user-manage/UserProfileSetting";
import UserProfileNotification from "@/pages/pre-built/user-manage/UserProfileNotification";
import UserProfileActivity from "@/pages/pre-built/user-manage/UserProfileActivity";
import KycListRegular from "@/pages/pre-built/kyc-list-regular/KycListRegular";
import KycDetailsRegular from "@/pages/pre-built/kyc-list-regular/kycDetailsRegular";
import TransListBasic from "@/pages/pre-built/trans-list/TransListBasic";
import TransListCrypto from "@/pages/pre-built/trans-list/TransListCrypto";
import ProductCard from "@/pages/pre-built/products/ProductCard";
import ProductList from "@/pages/pre-built/products/ProductList";
import ProductDetails from "@/pages/pre-built/products/ProductDetails";
import InvoiceList from "@/pages/pre-built/invoice/InvoiceList";
import InvoiceDetails from "@/pages/pre-built/invoice/InvoiceDetails";
import InvoicePrint from "@/pages/pre-built/invoice/InvoicePrint";
import PricingTable from "@/pages/pre-built/pricing-table/PricingTable";
import GalleryPreview from "@/pages/pre-built/gallery/GalleryCardPreview";
import ReactToastify from "@/pages/components/misc/ReactToastify";

import AppMessages from "@/pages/app/messages/Messages";
import Chat from "@/pages/app/chat/ChatContainer";
import Kanban from "@/pages/app/kanban/Kanban";
import FileManager from "@/pages/app/file-manager/FileManager";
import FileManagerFiles from "@/pages/app/file-manager/FileManagerFiles";
import FileManagerShared from "@/pages/app/file-manager/FileManagerShared";
import FileManagerStarred from "@/pages/app/file-manager/FileManagerStarred";
import FileManagerRecovery from "@/pages/app/file-manager/FileManagerRecovery";
import FileManagerSettings from "@/pages/app/file-manager/FileManagerSettings";
import Inbox from "@/pages/app/inbox/Inbox";
import TreeViewPreview from "@/pages/components/misc/TreeView";
import Calender from "@/pages/app/calender/Calender";
import QuillPreview from "@/pages/components/forms/rich-editor/QuillPreview";
import TinymcePreview from "@/pages/components/forms/rich-editor/TinymcePreview";
import KnobPreview from "@/pages/components/charts/KnobPreview";

import Error404Classic from "@/pages/error/404-classic";
import Error404Modern from "@/pages/error/404-modern";
import Error504Modern from "@/pages/error/504-modern";
import Error504Classic from "@/pages/error/504-classic";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Success from "@/pages/auth/Success";

import Layout from "@/layout/Index";
import LayoutNoSidebar from "@/layout/Index-nosidebar";
import LayoutApp from "@/layout/Index-app";
import ThemeProvider from "@/layout/provider/Theme";
import FileManagerProviderWrapper from "@/pages/app/file-manager/components/ProviderWrapper";

const ScrollToTop = (props) => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return <>{props.children}</>
};

const Pages = () => {

  return (
    <BrowserRouter   future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}>
      <ScrollToTop>  
        <Routes>
          <Route element={<ThemeProvider />}>
            <Route element={<Layout />}>
              <Route index element={<Homepage />}></Route>
              <Route path="crypto" element={<Crypto />}></Route>
              <Route path="sales" element={<Sales />}></Route>
              <Route path="invest" element={<Invest />}></Route>

              {/*New Dashboard Routes*/}
              <Route path="security-posture-dashboard" element={<SecurityPostureDashboard />}></Route>
              <Route path="systems-dashboard" element={<SystemsDashboard />}></Route>
              <Route path="assets-dashboard" element={<AssetsDashboard />}></Route>
              <Route path="vulnerabilities-dashboard" element={<VulnerabilitiesDashboard />}></Route>

              {/*Dashboard Creator Routes*/}
              <Route path="my-dashboards" element={<MyDashboards />}></Route>
              <Route path="dashboard-creator" element={<DashboardCreator />}></Route>

              <Route path="_blank" element={<Blank />}></Route>

              {/*Systems Management*/}
              <Route path="systems" element={<SystemsMain />}></Route>
              <Route path="systems/discovery" element={<SystemDiscovery />}></Route>
              <Route path="systems/analytics" element={<SystemAnalytics />}></Route>
              <Route path="systems/security" element={<SecurityPosture />}></Route>
              <Route path="systems/compliance" element={<SystemsMain />}></Route>

              {/*Asset Management*/}
              <Route path="assets/analytics" element={<AssetAnalytics />}></Route>
              <Route path="assets/inventory" element={<AssetInventory />}></Route>
              <Route path="asset-inventory" element={<AssetInventory />}></Route>

              {/*Vulnerability Management*/}
              <Route path="vulnerabilities/data" element={<VulnerabilityData />}></Route>
              <Route path="vulnerabilities/metrics" element={<VulnerabilityMetrics />}></Route>

              {/*Admin Management*/}
<Route path="admin/dashboard" element={<AdminDashboard />} />
              <Route path="admin/users" element={<AdminUsers />}></Route>
              <Route path="admin/roles" element={<AdminRoles />}></Route>
              <Route path="admin/permissions" element={<AdminPermissions />}></Route>
              <Route path="admin/ingestion-simulation" element={<IngestionSimulationPage />}></Route>
              <Route path="admin/access-requests" element={<AccessRequests />}></Route>
              <Route path="admin/role-management" element={<RoleManagement />}></Route>
              <Route path="admin/distribution-groups" element={<DistributionGroups />}></Route>
              <Route path="admin/email-management" element={<EmailManagement />}></Route>
              <Route path="admin/audit-logs" element={<AuditLogs />}></Route>
              <Route path="admin/ai-management" element={<AIManagement />}></Route>
              <Route path="admin/aws-integration" element={<AWSIntegration />}></Route>
              <Route path="admin/security-banner" element={<SecurityBanner />}></Route>
              <Route path="admin/database-management" element={<DatabaseManagement />}></Route>
              <Route path="admin/cve-database" element={<CVEDatabase />}></Route>
              <Route path="admin/controls-import" element={<ControlsImport />}></Route>
              <Route path="admin/api-documentation" element={<APIDocumentation />}></Route>
              <Route path="admin/environment-settings" element={<EnvironmentSettings />}></Route>
              <Route path="admin/system-settings" element={<SystemSettings />}></Route>

              {/*Scan Management*/}
              <Route path="scan-management/scans" element={<Scans />}></Route>
              <Route path="scan-management/results" element={<Results />}></Route>
              <Route path="scan-management/terminal" element={<ScanTerminal />}></Route>
              <Route path="scan-management/templates" element={<Templates />}></Route>
              <Route path="scan-management/schedule" element={<Schedule />}></Route>
              <Route path="scan-management/settings" element={<ScanSettings />}></Route>

              {/*Policy Management*/}
<Route path="policy-management/policies" element={<Policies />}></Route>

{/*Document Management*/}
              <Route path="document-management/library" element={<DocumentLibrary />}></Route>
              <Route path="document-management/upload" element={<UploadDocument />}></Route>
              <Route path="document-management/template" element={<DocumentTemplate />}></Route>
              <Route path="document-management/categories" element={<Categories />}></Route>
              <Route path="document-management/tags" element={<Tags />}></Route>
              <Route path="document-management/settings" element={<DocumentSettings />}></Route>

              {/*Pre-built Pages*/}
              <Route path="project-card" element={<ProjectCardPage />}></Route>
              <Route path="project-list" element={<ProjectListPage />}></Route>

              <Route element={<UserContextProvider />} >
                <Route path="user-list-regular" element={<UserListRegular />}></Route>
                <Route path="user-list-compact" element={<UserListCompact />}></Route>
                <Route path="user-contact-card" element={<UserContactCard />}></Route>
                <Route path="user-details-regular/:userId" element={<UserDetails />}></Route>
              </Route>

              <Route >
                <Route path="user-profile-notification" element={<UserProfileNotification />} ></Route>
                <Route path="user-profile-regular" element={<UserProfileRegular />}></Route>
                <Route path="user-profile-activity" element={<UserProfileActivity />}></Route>
                <Route path="user-profile-setting" element={<UserProfileSetting />}></Route>
              </Route>

              <Route path="kyc-list-regular" element={<KycListRegular />}></Route>
              <Route path="kyc-details-regular/:kycId" element={<KycDetailsRegular />}></Route>
              <Route path="transaction-basic" element={<TransListBasic />}></Route>
              <Route path="transaction-crypto" element={<TransListCrypto />}></Route>
              <Route element={<ProductContextProvider />}>
                <Route path="product-list" element={<ProductList />}></Route>
                <Route path="product-card" element={<ProductCard />}></Route>
                <Route path="product-details/:productId" element={<ProductDetails />}></Route>
              </Route>

              <Route path="invoice-list" element={<InvoiceList />}></Route>
              <Route path="invoice-details/:invoiceId" element={<InvoiceDetails />}></Route>
              <Route path="pricing-table" element={<PricingTable />}></Route>
              <Route path="image-gallery" element={<GalleryPreview />}></Route>

              <Route path="pages">
                <Route path="terms-policy" element={<Terms />}></Route>
                <Route path="faq" element={<Faq />}></Route>
                <Route path="regular-v1" element={<Regularv1 />}></Route>
                <Route path="regular-v2" element={<Regularv2 />}></Route>
              </Route>

              <Route path="components">
                <Route index element={<Component />}></Route>
                <Route path="accordions" element={<Accordian />}></Route>
                <Route path="alerts" element={<Alerts />}></Route>
                <Route path="avatar" element={<Avatar />}></Route>
                <Route path="badges" element={<Badges />}></Route>
                <Route path="breadcrumbs" element={<Breadcrumbs />}></Route>
                <Route path="button-group" element={<ButtonGroup />}></Route>
                <Route path="buttons" element={<Buttons />}></Route>
                <Route path="cards" element={<Cards />}></Route>
                <Route path="carousel" element={<Carousel />}></Route>
                <Route path="dropdowns" element={<Dropdowns />}></Route>
                <Route path="form-elements" element={<FormElements />}></Route>
                <Route path="form-layouts" element={<FormLayouts />}></Route>
                <Route path="checkbox-radio" element={<CheckboxRadio />}></Route>
                <Route path="advanced-control" element={<AdvancedControls />}></Route>
                <Route path="input-group" element={<InputGroup />}></Route>
                <Route path="form-upload" element={<FormUpload />}></Route>
                <Route path="number-spinner" element={<NumberSpinner />}></Route>
                <Route path="form-validation" element={<FormValidation />}></Route>
                <Route path="datetime-picker" element={<DateTimePicker />}></Route>
                <Route path="modals" element={<Modals />}></Route>
                <Route path="pagination" element={<Pagination />}></Route>
                <Route path="popovers" element={<Popovers />}></Route>
                <Route path="progress" element={<Progress />}></Route>
                <Route path="spinner" element={<Spinner />}></Route>
                <Route path="tabs" element={<Tabs />}></Route>
                <Route path="toast" element={<Toast />}></Route>
                <Route path="tooltips" element={<Tooltips />}></Route>
                <Route path="typography" element={<Typography />}></Route>
                <Route path="noUislider" element={<NouiSlider />}></Route>
                <Route path="wizard-basic" element={<WizardForm />}></Route>
                <Route path="quill" element={<QuillPreview />}></Route>
                <Route path="tinymce" element={<TinymcePreview />}></Route>
                <Route path="util-border" element={<UtilBorder />}></Route>
                <Route path="util-colors" element={<UtilColors />}></Route>
                <Route path="util-display" element={<UtilDisplay />}></Route>
                <Route path="util-embeded" element={<UtilEmbeded />}></Route>
                <Route path="util-flex" element={<UtilFlex />}></Route>
                <Route path="util-others" element={<UtilOthers />}></Route>
                <Route path="util-sizing" element={<UtilSizing />}></Route>
                <Route path="util-spacing" element={<UtilSpacing />}></Route>
                <Route path="util-text" element={<UtilText />}></Route>

                <Route path="widgets">
                  <Route path="cards" element={<CardWidgets />}></Route>
                  <Route path="charts" element={<ChartWidgets />}></Route>
                  <Route path="rating" element={<RatingWidgets />}></Route>
                </Route>

                <Route path="misc">
                  <Route path="slick-slider" element={<SlickPage />}></Route>
                  <Route path="sweet-alert" element={<SweetAlertPage />}></Route>
                  <Route path="dnd" element={<DndKit />}></Route>
                  <Route path="dual-list" element={<DualListPage />}></Route>
                  <Route path="map" element={<GoogleMapPage />}></Route>
                  <Route path="toastify" element={<ReactToastify />}></Route>
                  <Route path="tree-view" element={<TreeViewPreview />}></Route>
                </Route>
              </Route>
              <Route path="charts">
                <Route path="chartjs" element={<ChartPage />}></Route>
                <Route path="knobs" element={<KnobPreview />}></Route>
              </Route>
              
              <Route path="table-basic" element={<BasicTable />}></Route>
              <Route path="table-datatable" element={<DataTablePage />}></Route>
              <Route path="table-special" element={<SpecialTablePage />}></Route>
              <Route path="email-template" element={<EmailTemplate />}></Route>
              <Route path="nioicon" element={<NioIconPage />}></Route>
              <Route path="svg-icons" element={<SVGIconPage />}></Route>
              
              {/*File Manager Routes - now inside main Layout to show left sidebar*/}
              <Route element={<FileManagerProviderWrapper />}>
                <Route path="app-file-manager">
                  <Route index element={<FileManager />}></Route>
                  <Route path="files" element={<FileManagerFiles />}></Route>
                  <Route path="starred" element={<FileManagerStarred />}></Route>
                  <Route path="shared" element={<FileManagerShared />}></Route>
                  <Route path="recovery" element={<FileManagerRecovery />}></Route>
                </Route>
              </Route>
            </Route>
            <Route>
              <Route element={<LayoutApp app={{icon:"chat", theme:"bg-purple-dim", text: "Messages"}} />}>
                <Route path="app-messages" element={<AppMessages />}></Route>
              </Route>
              <Route element={<LayoutApp app={{icon:"chat-circle", theme:"bg-orange-dim", text: "NioChat"}}  />}>
                <Route path="app-chat" element={<Chat />}></Route>
              </Route>
              <Route element={<LayoutApp app={{icon:"calendar", theme:"bg-success-dim", text: "Calendar"}} />}>
                <Route path="app-calender" element={<Calender />}></Route>
              </Route>
              <Route element={<LayoutApp app={{icon:"inbox", theme:"bg-primary-dim", text: "Mailbox"}} />}>
                <Route path="app-inbox" element={<Inbox />}></Route>
              </Route>
              <Route element={<LayoutApp app={{icon:"template", theme:"bg-info-dim", text: "Kanban"}} />}>
                <Route path="app-kanban" element={<Kanban />}></Route>
              </Route>
            </Route>

            <Route element={<LayoutNoSidebar />}>
              <Route path="auth-success" element={<Success />}></Route>
                <Route path="auth-reset" element={<ForgotPassword />}></Route>
                <Route path="auth-register" element={<Register />}></Route>
                <Route path="auth-login" element={<Login />}></Route>

                <Route path="errors">
                  <Route path="404-modern" element={<Error404Modern />}></Route>
                  <Route path="404-classic" element={<Error404Classic />}></Route>
                  <Route path="504-modern" element={<Error504Modern />}></Route>
                  <Route path="504-classic" element={<Error504Classic />}></Route>
                </Route>
                <Route path="*" element={<Error404Modern />}></Route>
                
                <Route path="invoice-print/:invoiceId" element={<InvoicePrint />}></Route>
            </Route>
          </Route>
        </Routes>
      </ScrollToTop>
    </BrowserRouter>
  );
};
export default Pages;
