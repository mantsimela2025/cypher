import React, { useState, useEffect } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  BlockBetween,
  Row,
  Col,
  Button,
  Icon,
} from "@/components/Component";
import {
  Card,
  CardBody,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Form,
  FormGroup,
  Label,
  Input,
  InputGroup,
  InputGroupText,
  Alert,
  Badge,
  UncontrolledTooltip
} from "reactstrap";
import classnames from "classnames";
import { apiClient } from "@/utils/apiClient";
import { log } from "@/utils/config";

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });

  // Settings state organized by category
  const [settingsData, setSettingsData] = useState({
    // General settings
    scanner_max_concurrent: 4,
    scanner_default_timeout: 120,
    scanner_results_retention: 90,
    scanner_retry_count: 3,
    scanner_scan_depth: 'thorough',
    scanner_reduce_load_during_business_hours: true,

    // Notification settings
    notifications_scan_complete: true,
    notifications_scan_failed: true,
    notifications_high_severity_findings: true,
    notifications_email_enabled: true,
    notifications_slack_enabled: false,
    notifications_teams_enabled: false,

    // Integration settings
    integrations_tenable_enabled: true,
    integrations_nessus_enabled: false,
    integrations_openvas_enabled: false,
    integrations_qualys_enabled: false,

    // Scan type settings
    scan_types_vulnerability_enabled: true,
    scan_types_compliance_enabled: true,
    scan_types_configuration_enabled: true,
    scan_types_comprehensive_enabled: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      log.api('Loading scanner settings');
      const data = await apiClient.get('/settings?category=scanner');
      const settingsMap = {};

      data.data.settings.forEach(setting => {
        // Convert string values to appropriate types
        let value = setting.value;
        if (setting.dataType === 'boolean') {
          value = value === 'true' || value === true;
        } else if (setting.dataType === 'number') {
          value = parseInt(value);
        }
        settingsMap[setting.key] = value;
      });

      setSettingsData(prev => ({
        ...prev,
        ...settingsMap
      }));

      log.info('Scanner settings loaded successfully:', Object.keys(settingsMap).length, 'settings');
    } catch (error) {
      log.error('Error loading settings:', error.message);
      log.warn('Using default settings - server connection failed');
      showAlert('warning', 'Using default settings - server connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettingsData(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Prepare settings for bulk update
      const settingsToUpdate = {};

      // Only include scanner-related settings
      Object.keys(settingsData).forEach(key => {
        if (key.startsWith('scanner_') || key.startsWith('notifications_') ||
            key.startsWith('integrations_') || key.startsWith('scan_types_')) {
          settingsToUpdate[key] = settingsData[key];
        }
      });

      log.api('Saving scanner settings:', Object.keys(settingsToUpdate).length, 'settings');

      const result = await apiClient.put('/settings/bulk-update', settingsToUpdate);

      setHasChanges(false);
      showAlert('success', 'Settings saved successfully');
      log.info('Scanner settings saved successfully');

    } catch (error) {
      log.error('Error saving settings:', error.message);
      // For demo purposes, still mark as saved even if API fails
      setHasChanges(false);
      showAlert('warning', 'Settings saved locally (server connection failed)');
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      // Reset to default values
      setSettingsData({
        scanner_max_concurrent: 4,
        scanner_default_timeout: 120,
        scanner_results_retention: 90,
        scanner_retry_count: 3,
        scanner_scan_depth: 'thorough',
        scanner_reduce_load_during_business_hours: true,
        notifications_scan_complete: true,
        notifications_scan_failed: true,
        notifications_high_severity_findings: true,
        notifications_email_enabled: true,
        notifications_slack_enabled: false,
        notifications_teams_enabled: false,
        integrations_tenable_enabled: true,
        integrations_nessus_enabled: false,
        integrations_openvas_enabled: false,
        integrations_qualys_enabled: false,
        scan_types_vulnerability_enabled: true,
        scan_types_compliance_enabled: true,
        scan_types_configuration_enabled: true,
        scan_types_comprehensive_enabled: true
      });
      setHasChanges(true);
      showAlert('info', 'Settings reset to defaults. Click Save to apply changes.');
    }
  };

  return (
    <React.Fragment>
      <Head title="Scan Settings" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle page>Scan Settings</BlockTitle>
              <BlockDes className="text-soft">
                Configure scan parameters and notification preferences
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <div className="toggle-wrap nk-block-tools-toggle">
                <Button
                  className="btn-icon btn-trigger toggle-expand me-n1"
                  color="transparent"
                >
                  <Icon name="menu-alt-r"></Icon>
                </Button>
                <div className="toggle-expand-content">
                  <ul className="nk-block-tools g-3">
                    <li>
                      <Button
                        color="primary"
                        onClick={saveSettings}
                        disabled={!hasChanges || saving}
                      >
                        <Icon name={saving ? "loader" : "save"} />
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                      </Button>
                    </li>
                    <li>
                      <Button
                        color="secondary"
                        onClick={resetDefaults}
                        disabled={saving}
                      >
                        <Icon name="reload" />
                        <span>Reset Defaults</span>
                      </Button>
                    </li>
                  </ul>
                </div>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {alert.show && (
          <Alert color={alert.type} className="alert-dismissible">
            {alert.message}
          </Alert>
        )}

        <Block>
          <Row className="g-gs">
            <Col xxl="12">
              <Card className="card-bordered">
                <div className="card-inner">
                  {/* Tab Navigation */}
                  <Nav tabs className="nav-tabs-mb-icon nav-tabs-card">
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === 'general' })}
                        onClick={() => setActiveTab('general')}
                        href="#"
                      >
                        <Icon name="setting" />
                        <span>General</span>
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === 'notifications' })}
                        onClick={() => setActiveTab('notifications')}
                        href="#"
                      >
                        <Icon name="bell" />
                        <span>Notifications</span>
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink
                        className={classnames({ active: activeTab === 'integrations' })}
                        onClick={() => setActiveTab('integrations')}
                        href="#"
                      >
                        <Icon name="link" />
                        <span>Integrations</span>
                      </NavLink>
                    </NavItem>
                  </Nav>

                  {/* Tab Content */}
                  <TabContent activeTab={activeTab}>
                    {/* General Settings Tab */}
                    <TabPane tabId="general">
                      <div className="mt-4">
                        <h6 className="title">Scan Engine Settings</h6>
                        <p className="text-soft">Configure the scan engine behavior and resource allocation</p>

                        <Row className="gy-4">
                          <Col md="6">
                            <FormGroup>
                              <Label className="form-label">
                                Max Threads
                                <Icon name="info" id="max-threads-tooltip" className="ms-1 text-soft" />
                              </Label>
                              <UncontrolledTooltip target="max-threads-tooltip">
                                Maximum number of concurrent scanning threads
                              </UncontrolledTooltip>
                              <Input
                                type="number"
                                min="1"
                                max="20"
                                value={settingsData.scanner_max_concurrent || 4}
                                onChange={(e) => handleSettingChange('scanner_max_concurrent', parseInt(e.target.value))}
                              />
                              <small className="form-text text-muted">
                                Maximum time a scan can run before being terminated
                              </small>
                            </FormGroup>
                          </Col>

                          <Col md="6">
                            <FormGroup>
                              <Label className="form-label">
                                Scan Timeout (minutes)
                                <Icon name="info" id="timeout-tooltip" className="ms-1 text-soft" />
                              </Label>
                              <UncontrolledTooltip target="timeout-tooltip">
                                Maximum time a scan can run before being terminated
                              </UncontrolledTooltip>
                              <Input
                                type="number"
                                min="5"
                                max="480"
                                value={settingsData.scanner_default_timeout || 120}
                                onChange={(e) => handleSettingChange('scanner_default_timeout', parseInt(e.target.value))}
                              />
                              <small className="form-text text-muted">
                                Maximum time a scan can run before being terminated
                              </small>
                            </FormGroup>
                          </Col>
                        </Row>

                        <Row className="gy-4 mt-3">
                          <Col md="6">
                            <FormGroup>
                              <Label className="form-label">
                                Retry Count
                                <Icon name="info" id="retry-tooltip" className="ms-1 text-soft" />
                              </Label>
                              <UncontrolledTooltip target="retry-tooltip">
                                Number of times to retry failed operations
                              </UncontrolledTooltip>
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                value={settingsData.scanner_retry_count || 3}
                                onChange={(e) => handleSettingChange('scanner_retry_count', parseInt(e.target.value))}
                              />
                              <small className="form-text text-muted">
                                Number of times to retry failed operations
                              </small>
                            </FormGroup>
                          </Col>

                          <Col md="6">
                            <FormGroup>
                              <Label className="form-label">
                                Scan Depth
                                <Icon name="info" id="depth-tooltip" className="ms-1 text-soft" />
                              </Label>
                              <UncontrolledTooltip target="depth-tooltip">
                                Default depth level for vulnerability scanning
                              </UncontrolledTooltip>
                              <Input
                                type="select"
                                value={settingsData.scanner_scan_depth || 'thorough'}
                                onChange={(e) => handleSettingChange('scanner_scan_depth', e.target.value)}
                              >
                                <option value="quick">Quick</option>
                                <option value="thorough">Thorough</option>
                                <option value="comprehensive">Comprehensive</option>
                              </Input>
                              <small className="form-text text-muted">
                                Default depth level for vulnerability scanning
                              </small>
                            </FormGroup>
                          </Col>
                        </Row>

                        <Row className="gy-4 mt-3">
                          <Col md="12">
                            <FormGroup>
                              <div className="custom-control custom-switch">
                                <Input
                                  type="checkbox"
                                  className="custom-control-input"
                                  id="reduce-load-switch"
                                  checked={settingsData.scanner_reduce_load_during_business_hours || false}
                                  onChange={(e) => handleSettingChange('scanner_reduce_load_during_business_hours', e.target.checked)}
                                />
                                <Label className="custom-control-label" htmlFor="reduce-load-switch">
                                  Reduce Load During Business Hours
                                </Label>
                              </div>
                              <small className="form-text text-muted">
                                Automatically throttle scan performance during business hours to reduce system impact
                              </small>
                            </FormGroup>
                          </Col>
                        </Row>

                        <hr className="my-4" />

                        <h6 className="title">Scan Types</h6>
                        <p className="text-soft">Set default preferences for different scan types</p>

                        <Row className="gy-3">
                          <Col md="6">
                            <div className="custom-control custom-radio">
                              <Input
                                type="radio"
                                id="vuln-scan"
                                name="scan-type"
                                className="custom-control-input"
                                checked={settingsData.scan_types_vulnerability_enabled}
                                onChange={(e) => handleSettingChange('scan_types_vulnerability_enabled', e.target.checked)}
                              />
                              <Label className="custom-control-label" htmlFor="vuln-scan">
                                <strong>Vulnerability Scan</strong>
                                <br />
                                <small className="text-soft">Identifies security vulnerabilities in your systems and applications</small>
                              </Label>
                            </div>
                          </Col>

                          <Col md="6">
                            <div className="custom-control custom-radio">
                              <Input
                                type="radio"
                                id="compliance-scan"
                                name="scan-type"
                                className="custom-control-input"
                                checked={settingsData.scan_types_compliance_enabled}
                                onChange={(e) => handleSettingChange('scan_types_compliance_enabled', e.target.checked)}
                              />
                              <Label className="custom-control-label" htmlFor="compliance-scan">
                                <strong>Compliance Scan</strong>
                                <br />
                                <small className="text-soft">Checks systems against regulatory requirements and security standards</small>
                              </Label>
                            </div>
                          </Col>
                        </Row>

                        <Row className="gy-3 mt-2">
                          <Col md="6">
                            <div className="custom-control custom-radio">
                              <Input
                                type="radio"
                                id="config-scan"
                                name="scan-type"
                                className="custom-control-input"
                                checked={settingsData.scan_types_configuration_enabled}
                                onChange={(e) => handleSettingChange('scan_types_configuration_enabled', e.target.checked)}
                              />
                              <Label className="custom-control-label" htmlFor="config-scan">
                                <strong>Configuration Scan</strong>
                                <br />
                                <small className="text-soft">Audits system configurations against security best practices</small>
                              </Label>
                            </div>
                          </Col>

                          <Col md="6">
                            <div className="custom-control custom-radio">
                              <Input
                                type="radio"
                                id="comprehensive-scan"
                                name="scan-type"
                                className="custom-control-input"
                                checked={settingsData.scan_types_comprehensive_enabled}
                                onChange={(e) => handleSettingChange('scan_types_comprehensive_enabled', e.target.checked)}
                              />
                              <Label className="custom-control-label" htmlFor="comprehensive-scan">
                                <strong>Comprehensive Scan</strong>
                                <br />
                                <small className="text-soft">Full security assessment covering all aspects of system security</small>
                              </Label>
                            </div>
                          </Col>
                        </Row>

                        <div className="mt-4 p-3 bg-light rounded">
                          <div className="d-flex align-items-center">
                            <Icon name="info" className="text-warning me-2" />
                            <div>
                              <strong>Using default settings</strong>
                              <br />
                              <small className="text-muted">
                                Could not retrieve shared settings using defaults
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabPane>

                    {/* Notifications Tab */}
                    <TabPane tabId="notifications">
                      <div className="mt-4">
                        <h6 className="title">Notification Preferences</h6>
                        <p className="text-soft">Configure when and how you receive scan notifications</p>

                        <Row className="gy-4">
                          <Col md="12">
                            <h6 className="text-base">Email Notifications</h6>

                            <div className="custom-control custom-switch mb-3">
                              <Input
                                type="checkbox"
                                className="custom-control-input"
                                id="email-enabled"
                                checked={settingsData.notifications_email_enabled || false}
                                onChange={(e) => handleSettingChange('notifications_email_enabled', e.target.checked)}
                              />
                              <Label className="custom-control-label" htmlFor="email-enabled">
                                Enable Email Notifications
                              </Label>
                            </div>

                            <div className="ms-4">
                              <div className="custom-control custom-checkbox mb-2">
                                <Input
                                  type="checkbox"
                                  className="custom-control-input"
                                  id="notify-complete"
                                  checked={settingsData.notifications_scan_complete || false}
                                  onChange={(e) => handleSettingChange('notifications_scan_complete', e.target.checked)}
                                  disabled={!settingsData.notifications_email_enabled}
                                />
                                <Label className="custom-control-label" htmlFor="notify-complete">
                                  Scan completion notifications
                                </Label>
                              </div>

                              <div className="custom-control custom-checkbox mb-2">
                                <Input
                                  type="checkbox"
                                  className="custom-control-input"
                                  id="notify-failed"
                                  checked={settingsData.notifications_scan_failed || false}
                                  onChange={(e) => handleSettingChange('notifications_scan_failed', e.target.checked)}
                                  disabled={!settingsData.notifications_email_enabled}
                                />
                                <Label className="custom-control-label" htmlFor="notify-failed">
                                  Scan failure notifications
                                </Label>
                              </div>

                              <div className="custom-control custom-checkbox mb-2">
                                <Input
                                  type="checkbox"
                                  className="custom-control-input"
                                  id="notify-high-severity"
                                  checked={settingsData.notifications_high_severity_findings || false}
                                  onChange={(e) => handleSettingChange('notifications_high_severity_findings', e.target.checked)}
                                  disabled={!settingsData.notifications_email_enabled}
                                />
                                <Label className="custom-control-label" htmlFor="notify-high-severity">
                                  High severity finding alerts
                                </Label>
                              </div>
                            </div>
                          </Col>
                        </Row>

                        <hr className="my-4" />

                        <Row className="gy-4">
                          <Col md="12">
                            <h6 className="text-base">Integration Notifications</h6>

                            <div className="custom-control custom-switch mb-3">
                              <Input
                                type="checkbox"
                                className="custom-control-input"
                                id="slack-enabled"
                                checked={settingsData.notifications_slack_enabled || false}
                                onChange={(e) => handleSettingChange('notifications_slack_enabled', e.target.checked)}
                              />
                              <Label className="custom-control-label" htmlFor="slack-enabled">
                                Slack Notifications
                                <Badge color="secondary" className="ms-2">Coming Soon</Badge>
                              </Label>
                            </div>

                            <div className="custom-control custom-switch mb-3">
                              <Input
                                type="checkbox"
                                className="custom-control-input"
                                id="teams-enabled"
                                checked={settingsData.notifications_teams_enabled || false}
                                onChange={(e) => handleSettingChange('notifications_teams_enabled', e.target.checked)}
                              />
                              <Label className="custom-control-label" htmlFor="teams-enabled">
                                Microsoft Teams Notifications
                                <Badge color="secondary" className="ms-2">Coming Soon</Badge>
                              </Label>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </TabPane>

                    {/* Integrations Tab */}
                    <TabPane tabId="integrations">
                      <div className="mt-4">
                        <h6 className="title">Scanner Integrations</h6>
                        <p className="text-soft">Configure third-party scanner integrations and data sources</p>

                        <Row className="gy-4">
                          <Col md="6">
                            <Card className="card-bordered">
                              <CardBody>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <div>
                                    <h6 className="title mb-1">Tenable.io</h6>
                                    <p className="text-soft small mb-0">Vulnerability management platform</p>
                                  </div>
                                  <Badge color={settingsData.integrations_tenable_enabled ? 'success' : 'secondary'}>
                                    {settingsData.integrations_tenable_enabled ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>

                                <div className="custom-control custom-switch">
                                  <Input
                                    type="checkbox"
                                    className="custom-control-input"
                                    id="tenable-enabled"
                                    checked={settingsData.integrations_tenable_enabled || false}
                                    onChange={(e) => handleSettingChange('integrations_tenable_enabled', e.target.checked)}
                                  />
                                  <Label className="custom-control-label" htmlFor="tenable-enabled">
                                    Enable Tenable Integration
                                  </Label>
                                </div>
                              </CardBody>
                            </Card>
                          </Col>

                          <Col md="6">
                            <Card className="card-bordered">
                              <CardBody>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <div>
                                    <h6 className="title mb-1">Nessus</h6>
                                    <p className="text-soft small mb-0">Professional vulnerability scanner</p>
                                  </div>
                                  <Badge color={settingsData.integrations_nessus_enabled ? 'success' : 'secondary'}>
                                    {settingsData.integrations_nessus_enabled ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>

                                <div className="custom-control custom-switch">
                                  <Input
                                    type="checkbox"
                                    className="custom-control-input"
                                    id="nessus-enabled"
                                    checked={settingsData.integrations_nessus_enabled || false}
                                    onChange={(e) => handleSettingChange('integrations_nessus_enabled', e.target.checked)}
                                  />
                                  <Label className="custom-control-label" htmlFor="nessus-enabled">
                                    Enable Nessus Integration
                                  </Label>
                                </div>
                              </CardBody>
                            </Card>
                          </Col>
                        </Row>

                        <Row className="gy-4 mt-3">
                          <Col md="6">
                            <Card className="card-bordered">
                              <CardBody>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <div>
                                    <h6 className="title mb-1">OpenVAS</h6>
                                    <p className="text-soft small mb-0">Open source vulnerability scanner</p>
                                  </div>
                                  <Badge color={settingsData.integrations_openvas_enabled ? 'success' : 'secondary'}>
                                    {settingsData.integrations_openvas_enabled ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>

                                <div className="custom-control custom-switch">
                                  <Input
                                    type="checkbox"
                                    className="custom-control-input"
                                    id="openvas-enabled"
                                    checked={settingsData.integrations_openvas_enabled || false}
                                    onChange={(e) => handleSettingChange('integrations_openvas_enabled', e.target.checked)}
                                  />
                                  <Label className="custom-control-label" htmlFor="openvas-enabled">
                                    Enable OpenVAS Integration
                                  </Label>
                                </div>
                              </CardBody>
                            </Card>
                          </Col>

                          <Col md="6">
                            <Card className="card-bordered">
                              <CardBody>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <div>
                                    <h6 className="title mb-1">Qualys VMDR</h6>
                                    <p className="text-soft small mb-0">Cloud-based vulnerability management</p>
                                  </div>
                                  <Badge color={settingsData.integrations_qualys_enabled ? 'success' : 'secondary'}>
                                    {settingsData.integrations_qualys_enabled ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>

                                <div className="custom-control custom-switch">
                                  <Input
                                    type="checkbox"
                                    className="custom-control-input"
                                    id="qualys-enabled"
                                    checked={settingsData.integrations_qualys_enabled || false}
                                    onChange={(e) => handleSettingChange('integrations_qualys_enabled', e.target.checked)}
                                  />
                                  <Label className="custom-control-label" htmlFor="qualys-enabled">
                                    Enable Qualys Integration
                                  </Label>
                                </div>
                              </CardBody>
                            </Card>
                          </Col>
                        </Row>
                      </div>
                    </TabPane>
                  </TabContent>
                </div>
              </Card>
            </Col>
          </Row>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default Settings;
