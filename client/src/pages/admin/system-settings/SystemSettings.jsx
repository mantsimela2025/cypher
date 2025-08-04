import React from "react";
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import {
  Block,
  BlockBetween,
  BlockDes,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
} from "@/components/Component";

// --- General Tab ---
const GeneralSettingsTab = () => (
  <form className="p-2">
    <h5 className="mb-1"><i className="bi bi-sliders me-2"></i>General Settings</h5>
    <div className="text-muted mb-4">Configure basic system settings and defaults</div>
    <div className="row g-3 mb-3">
      <div className="col-md-6">
        <label className="form-label">System Name</label>
        <input className="form-control" value="Vulnerability Management Platform" readOnly />
        <div className="form-text">The name displayed in browser titles and system-generated emails</div>
      </div>
      <div className="col-md-3">
        <label className="form-label">Default Language</label>
        <select className="form-select" defaultValue="en">
          <option>English (US)</option>
        </select>
        <div className="form-text">Default language for new user accounts</div>
      </div>
      <div className="col-md-3">
        <label className="form-label">Default Timezone</label>
        <select className="form-select" defaultValue="UTC">
          <option>UTC</option>
        </select>
        <div className="form-text">Default timezone for displaying dates and times</div>
      </div>
      <div className="col-md-3">
        <label className="form-label">Date Format</label>
        <select className="form-select" defaultValue="YYYY-MM-DD">
          <option>YYYY-MM-DD</option>
        </select>
        <div className="form-text">Format for displaying dates throughout the system</div>
      </div>
      <div className="col-md-3">
        <label className="form-label">Time Format</label>
        <select className="form-select" defaultValue="24h">
          <option>24-hour</option>
        </select>
        <div className="form-text">Format for displaying time values</div>
      </div>
      <div className="col-md-3">
        <label className="form-label">Maximum Session Duration (minutes)</label>
        <input className="form-control" value="60" readOnly />
        <div className="form-text">How long user sessions remain active without activity (5-1440 minutes)</div>
      </div>
      <div className="col-md-3 d-flex align-items-end">
        <div className="form-check form-switch">
          <input className="form-check-input" type="checkbox" id="maintenanceMode" />
          <label className="form-check-label" htmlFor="maintenanceMode">Maintenance Mode</label>
        </div>
        <div className="form-text ms-2">Temporarily disable access to the system for maintenance</div>
      </div>
    </div>
    <button className="btn btn-primary mt-2" type="button">Save General Settings</button>
  </form>
);

// --- Notifications Tab ---
const NotificationsSettingsTab = () => (
  <form className="p-2">
    <h5 className="mb-1"><i className="bi bi-send me-2"></i>Notification Settings</h5>
    <div className="text-muted mb-4">Configure how the system sends alerts and notifications</div>
    <div className="row g-3 mb-3">
      <div className="col-md-4">
        <div className="form-check form-switch">
          <input className="form-check-input" type="checkbox" id="emailNotifications" defaultChecked />
          <label className="form-check-label" htmlFor="emailNotifications">Email Notifications</label>
        </div>
        <div className="form-text">Send notifications via email</div>
      </div>
      <div className="col-md-4">
        <div className="form-check form-switch">
          <input className="form-check-input" type="checkbox" id="slackNotifications" />
          <label className="form-check-label" htmlFor="slackNotifications">Slack Notifications</label>
        </div>
        <div className="form-text">Send notifications to Slack channels</div>
      </div>
      <div className="col-md-4">
        <div className="form-check form-switch">
          <input className="form-check-input" type="checkbox" id="webhookNotifications" />
          <label className="form-check-label" htmlFor="webhookNotifications">Webhook Notifications</label>
        </div>
        <div className="form-text">Send notifications to a custom webhook endpoint</div>
      </div>
      <div className="col-md-4">
        <label className="form-label">Notification Batch Size</label>
        <input className="form-control" value="10" readOnly />
      </div>
      <div className="col-md-4">
        <label className="form-label">Batch Interval (minutes)</label>
        <input className="form-control" value="5" readOnly />
        <div className="form-text">Time between notification processing batches</div>
      </div>
      <div className="col-md-4">
        <label className="form-label">Daily Digest Time</label>
        <input className="form-control" value="08:00 AM" readOnly />
        <div className="form-text">Time when daily summary notifications are sent</div>
      </div>
    </div>
    <button className="btn btn-primary mt-2" type="button">Save Notification Settings</button>
  </form>
);

// --- Integrations Tab ---
const IntegrationsSettingsTab = () => (
  <form className="p-2">
    <h5 className="mb-1"><i className="bi bi-plug me-2"></i>Integrations</h5>
    <div className="text-muted mb-4">Configure integrations with external systems and services</div>
    <div className="mb-3">
      <div className="form-check form-switch mb-2">
        <input className="form-check-input" type="checkbox" id="awsIntegration" defaultChecked />
        <label className="form-check-label" htmlFor="awsIntegration">AWS Integration</label>
        <div className="form-text">Enable integration with AWS services</div>
      </div>
      <div className="form-check form-switch mb-2">
        <input className="form-check-input" type="checkbox" id="slackIntegration" />
        <label className="form-check-label" htmlFor="slackIntegration">Slack Integration</label>
        <div className="form-text">Enable integration with Slack for messaging and notifications</div>
      </div>
      <div className="form-check form-switch mb-2">
        <input className="form-check-input" type="checkbox" id="jiraIntegration" />
        <label className="form-check-label" htmlFor="jiraIntegration">Jira Integration</label>
        <div className="form-text">Enable integration with Jira for issue tracking</div>
      </div>
      <div className="form-check form-switch mb-2">
        <input className="form-check-input" type="checkbox" id="servicenowIntegration" />
        <label className="form-check-label" htmlFor="servicenowIntegration">ServiceNow Integration</label>
        <div className="form-text">Enable integration with ServiceNow for ITSM and CMDB</div>
      </div>
      <div className="form-check form-switch mb-2">
        <input className="form-check-input" type="checkbox" id="adIntegration" />
        <label className="form-check-label" htmlFor="adIntegration">Active Directory Integration</label>
        <div className="form-text">Enable integration with Active Directory for user management</div>
      </div>
    </div>
    <button className="btn btn-primary mt-2" type="button">Save Integration Settings</button>
  </form>
);

// --- Backup & Recovery Tab ---
const BackupRecoverySettingsTab = () => (
  <form className="p-2">
    <h5 className="mb-1"><i className="bi bi-arrow-repeat me-2"></i>Backup & Recovery</h5>
    <div className="text-muted mb-4">Configure system backup settings and recovery options</div>
    <div className="mb-3">
      <div className="form-check form-switch mb-3">
        <input className="form-check-input" type="checkbox" id="autoBackups" defaultChecked />
        <label className="form-check-label" htmlFor="autoBackups">Automatic Backups</label>
        <div className="form-text">Enable scheduled automatic backups</div>
      </div>
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label">Backup Frequency</label>
          <select className="form-select" defaultValue="Daily">
            <option>Daily</option>
          </select>
          <div className="form-text">How often backups should be created</div>
        </div>
        <div className="col-md-6">
          <label className="form-label">Backup Time</label>
          <input className="form-control" value="01:00 AM" readOnly />
          <div className="form-text">Time of day when backups should run</div>
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label">Retention Period (days)</label>
        <input className="form-control" value="30" readOnly />
        <div className="form-text">Number of days to keep backups before automatic deletion</div>
      </div>
      <div className="form-check form-switch mb-3">
        <input className="form-check-input" type="checkbox" id="includeAttachments" defaultChecked />
        <label className="form-check-label" htmlFor="includeAttachments">Include Attachments</label>
        <div className="form-text">Include file attachments in backups</div>
      </div>
      <div className="mb-3">
        <label className="form-label">Backup Storage Location</label>
        <select className="form-select" defaultValue="Local Storage">
          <option>Local Storage</option>
        </select>
        <div className="form-text">Where backup files should be stored</div>
      </div>
    </div>
    <button className="btn btn-primary mt-2" type="button">Save Backup Settings</button>
  </form>
);

// --- Logging Tab ---
const LoggingSettingsTab = () => (
  <form className="p-2">
    <h5 className="mb-1"><i className="bi bi-journal-text me-2"></i>Logging & Audit</h5>
    <div className="text-muted mb-4">Configure system logging and audit trail settings</div>
    <div className="mb-3">
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label">Log Level</label>
          <select className="form-select" defaultValue="Info">
            <option>Info</option>
          </select>
          <div className="form-text">Minimum severity level for log entries</div>
        </div>
        <div className="col-md-6">
          <label className="form-label">Log Retention Period (days)</label>
          <input className="form-control" value="90" readOnly />
          <div className="form-text">Number of days to keep logs before automatic rotation</div>
        </div>
      </div>
      <div className="form-check form-switch mb-2">
        <input className="form-check-input" type="checkbox" id="auditLogging" defaultChecked />
        <label className="form-check-label" htmlFor="auditLogging">Audit Logging</label>
        <div className="form-text">Track user actions and system changes</div>
      </div>
      <div className="form-check form-switch mb-2">
        <input className="form-check-input" type="checkbox" id="securityLogging" defaultChecked />
        <label className="form-check-label" htmlFor="securityLogging">Security Logging</label>
        <div className="form-text">Track authentication events and security-related actions</div>
      </div>
      <div className="form-check form-switch mb-2">
        <input className="form-check-input" type="checkbox" id="performanceLogging" />
        <label className="form-check-label" htmlFor="performanceLogging">Performance Logging</label>
        <div className="form-text">Track system performance metrics and response times</div>
      </div>
      <div className="form-check form-switch mb-2">
        <input className="form-check-input" type="checkbox" id="autoLogExport" />
        <label className="form-check-label" htmlFor="autoLogExport">Automatic Log Export</label>
        <div className="form-text">Automatically export logs to external storage</div>
      </div>
    </div>
    <button className="btn btn-primary mt-2" type="button">Save Logging Settings</button>
  </form>
);

const Tabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "general", label: "General" },
    { id: "notifications", label: "Notifications" },
    { id: "integrations", label: "Integrations" },
    { id: "backup", label: "Backup & Recovery" },
    { id: "logging", label: "Logging" },
  ];
  return (
    <ul className="nav nav-tabs mb-4">
      {tabs.map((tab) => (
        <li className="nav-item" key={tab.id}>
          <button
            className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        </li>
      ))}
    </ul>
  );
};

const SystemSettings = () => {
  const [activeTab, setActiveTab] = React.useState("general");
  return (
    <React.Fragment>
      <Head title="Admin - System Settings" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>
                System Settings
              </BlockTitle>
              <BlockDes className="text-soft">
                <p>Manage core system settings and global configurations.</p>
              </BlockDes>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>
        <Block>
          <div className="card card-stretch">
            <div className="card-inner">
              <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
              <div className="mt-3">
                {activeTab === "general" && <GeneralSettingsTab />}
{activeTab === "notifications" && <NotificationsSettingsTab />}
{activeTab === "integrations" && <IntegrationsSettingsTab />}
{activeTab === "backup" && <BackupRecoverySettingsTab />}
{activeTab === "logging" && <LoggingSettingsTab />}
              </div>
            </div>
          </div>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default SystemSettings;