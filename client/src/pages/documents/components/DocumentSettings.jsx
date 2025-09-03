import React, { useState, useEffect } from 'react';
import {
  Icon,
  Button,
  PreviewCard,
  Row,
  Col
} from '@/components/Component';
import {
  Form,
  FormGroup,
  Label,
  Input,
  Alert,
  Badge,
  Progress,
  Spinner
} from 'reactstrap';
import { toast } from 'react-toastify';

const DocumentSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [settings, setSettings] = useState({
    // S3 Storage Settings
    s3: {
      bucketName: '',
      region: 'us-east-1',
      accessKeyId: '',
      secretAccessKey: '',
      cdnUrl: '',
      encryption: 'AES256'
    },
    // File Upload Settings
    upload: {
      maxFileSize: 100, // MB
      maxFilesPerUpload: 10,
      allowedFileTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/jpeg',
        'image/png'
      ],
      generateThumbnails: true,
      virusScanEnabled: false
    },
    // Security Settings
    security: {
      requireAuthentication: true,
      enableVersioning: true,
      enableAuditLog: true,
      maxVersionsPerDocument: 10,
      autoDeleteAfterDays: 0, // 0 = never
      encryptionAtRest: true
    },
    // Notification Settings
    notifications: {
      emailOnUpload: false,
      emailOnShare: true,
      emailOnDelete: true,
      adminNotifications: true
    },
    // Performance Settings
    performance: {
      enableCaching: true,
      cacheExpirationHours: 24,
      enableCompression: true,
      thumbnailQuality: 80
    }
  });

  const [connectionStatus, setConnectionStatus] = useState({
    s3: 'unknown', // unknown, connected, error
    database: 'unknown',
    email: 'unknown'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/documents/settings');
      // const data = await response.json();
      // setSettings(data.settings);
      
      // Mock delay
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleArrayChange = (section, field, value) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: arrayValue
      }
    }));
  };

  const testS3Connection = async () => {
    try {
      setTestingConnection(true);
      setConnectionStatus(prev => ({ ...prev, s3: 'testing' }));
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/documents/test-s3', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings.s3)
      // });
      
      // Mock test
      setTimeout(() => {
        const success = settings.s3.bucketName && settings.s3.accessKeyId;
        setConnectionStatus(prev => ({ 
          ...prev, 
          s3: success ? 'connected' : 'error' 
        }));
        
        if (success) {
          toast.success('S3 connection successful!');
        } else {
          toast.error('S3 connection failed. Please check your credentials.');
        }
        
        setTestingConnection(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error testing S3 connection:', error);
      setConnectionStatus(prev => ({ ...prev, s3: 'error' }));
      toast.error('Failed to test S3 connection');
      setTestingConnection(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/documents/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // });
      
      // Mock save
      setTimeout(() => {
        toast.success('Settings saved successfully!');
        setSaving(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
      setSaving(false);
    }
  };

  const getConnectionStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'success';
      case 'error': return 'danger';
      case 'testing': return 'warning';
      default: return 'secondary';
    }
  };

  const getConnectionStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'error': return 'Error';
      case 'testing': return 'Testing...';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner color="primary" />
        <span className="ms-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">Document Management Settings</h5>
          <p className="text-muted mb-0">Configure storage, security, and operational settings</p>
        </div>
        <Button 
          color="primary" 
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <>
              <Spinner size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            <>
              <Icon name="save" className="me-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Connection Status Overview */}
      <PreviewCard className="mb-4">
        <div className="card-inner">
          <h6 className="mb-3">System Status</h6>
          <Row>
            <Col md="4">
              <div className="d-flex align-items-center justify-content-between">
                <span>S3 Storage</span>
                <Badge color={getConnectionStatusColor(connectionStatus.s3)}>
                  {getConnectionStatusText(connectionStatus.s3)}
                </Badge>
              </div>
            </Col>
            <Col md="4">
              <div className="d-flex align-items-center justify-content-between">
                <span>Database</span>
                <Badge color="success">Connected</Badge>
              </div>
            </Col>
            <Col md="4">
              <div className="d-flex align-items-center justify-content-between">
                <span>Email Service</span>
                <Badge color="success">Connected</Badge>
              </div>
            </Col>
          </Row>
        </div>
      </PreviewCard>

      <Row className="g-gs">
        {/* S3 Storage Settings */}
        <Col lg="6">
          <PreviewCard>
            <div className="card-inner">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">
                  <Icon name="cloud" className="me-2" />
                  S3 Storage Configuration
                </h6>
                <Button
                  size="sm"
                  color="light"
                  onClick={testS3Connection}
                  disabled={testingConnection}
                >
                  {testingConnection ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <Icon name="check-circle" className="me-1" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
              
              <Form>
                <FormGroup>
                  <Label>S3 Bucket Name</Label>
                  <Input
                    type="text"
                    value={settings.s3.bucketName}
                    onChange={(e) => handleInputChange('s3', 'bucketName', e.target.value)}
                    placeholder="cypher-documents"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>AWS Region</Label>
                  <Input
                    type="select"
                    value={settings.s3.region}
                    onChange={(e) => handleInputChange('s3', 'region', e.target.value)}
                  >
                    <option value="us-east-1">US East (N. Virginia)</option>
                    <option value="us-west-2">US West (Oregon)</option>
                    <option value="eu-west-1">Europe (Ireland)</option>
                    <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                  </Input>
                </FormGroup>
                
                <FormGroup>
                  <Label>Access Key ID</Label>
                  <Input
                    type="text"
                    value={settings.s3.accessKeyId}
                    onChange={(e) => handleInputChange('s3', 'accessKeyId', e.target.value)}
                    placeholder="AKIA..."
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>Secret Access Key</Label>
                  <Input
                    type="password"
                    value={settings.s3.secretAccessKey}
                    onChange={(e) => handleInputChange('s3', 'secretAccessKey', e.target.value)}
                    placeholder="Enter secret key"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>CDN URL (Optional)</Label>
                  <Input
                    type="text"
                    value={settings.s3.cdnUrl}
                    onChange={(e) => handleInputChange('s3', 'cdnUrl', e.target.value)}
                    placeholder="https://cdn.example.com"
                  />
                  <small className="text-muted">CloudFront or custom CDN URL for faster downloads</small>
                </FormGroup>
              </Form>
            </div>
          </PreviewCard>
        </Col>

        {/* File Upload Settings */}
        <Col lg="6">
          <PreviewCard>
            <div className="card-inner">
              <h6 className="mb-3">
                <Icon name="upload" className="me-2" />
                File Upload Settings
              </h6>
              
              <Form>
                <FormGroup>
                  <Label>Maximum File Size (MB)</Label>
                  <Input
                    type="number"
                    value={settings.upload.maxFileSize}
                    onChange={(e) => handleInputChange('upload', 'maxFileSize', parseInt(e.target.value))}
                    min="1"
                    max="1000"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>Maximum Files Per Upload</Label>
                  <Input
                    type="number"
                    value={settings.upload.maxFilesPerUpload}
                    onChange={(e) => handleInputChange('upload', 'maxFilesPerUpload', parseInt(e.target.value))}
                    min="1"
                    max="50"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>Allowed File Types</Label>
                  <Input
                    type="textarea"
                    rows="4"
                    value={settings.upload.allowedFileTypes.join(', ')}
                    onChange={(e) => handleArrayChange('upload', 'allowedFileTypes', e.target.value)}
                    placeholder="application/pdf, image/jpeg, text/plain"
                  />
                  <small className="text-muted">Comma-separated MIME types</small>
                </FormGroup>
                
                <FormGroup>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={settings.upload.generateThumbnails}
                      onChange={(e) => handleInputChange('upload', 'generateThumbnails', e.target.checked)}
                    />
                    <Label className="form-check-label">
                      Generate thumbnails for images
                    </Label>
                  </div>
                </FormGroup>
              </Form>
            </div>
          </PreviewCard>
        </Col>
      </Row>

      {/* Security & Performance Settings */}
      <Row className="g-gs mt-4">
        {/* Security Settings */}
        <Col lg="6">
          <PreviewCard>
            <div className="card-inner">
              <h6 className="mb-3">
                <Icon name="shield" className="me-2" />
                Security Settings
              </h6>

              <Form>
                <FormGroup>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={settings.security.enableVersioning}
                      onChange={(e) => handleInputChange('security', 'enableVersioning', e.target.checked)}
                    />
                    <Label className="form-check-label">
                      Enable document versioning
                    </Label>
                  </div>
                </FormGroup>

                <FormGroup>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={settings.security.enableAuditLog}
                      onChange={(e) => handleInputChange('security', 'enableAuditLog', e.target.checked)}
                    />
                    <Label className="form-check-label">
                      Enable audit logging
                    </Label>
                  </div>
                </FormGroup>

                <FormGroup>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={settings.security.encryptionAtRest}
                      onChange={(e) => handleInputChange('security', 'encryptionAtRest', e.target.checked)}
                    />
                    <Label className="form-check-label">
                      Enable encryption at rest
                    </Label>
                  </div>
                </FormGroup>

                <FormGroup>
                  <Label>Maximum Versions Per Document</Label>
                  <Input
                    type="number"
                    value={settings.security.maxVersionsPerDocument}
                    onChange={(e) => handleInputChange('security', 'maxVersionsPerDocument', parseInt(e.target.value))}
                    min="1"
                    max="100"
                  />
                  <small className="text-muted">Older versions will be automatically deleted</small>
                </FormGroup>

                <FormGroup>
                  <Label>Auto-delete documents after (days)</Label>
                  <Input
                    type="number"
                    value={settings.security.autoDeleteAfterDays}
                    onChange={(e) => handleInputChange('security', 'autoDeleteAfterDays', parseInt(e.target.value))}
                    min="0"
                  />
                  <small className="text-muted">0 = never delete automatically</small>
                </FormGroup>
              </Form>
            </div>
          </PreviewCard>
        </Col>

        {/* Notification Settings */}
        <Col lg="6">
          <PreviewCard>
            <div className="card-inner">
              <h6 className="mb-3">
                <Icon name="bell" className="me-2" />
                Notification Settings
              </h6>

              <Form>
                <FormGroup>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={settings.notifications.emailOnUpload}
                      onChange={(e) => handleInputChange('notifications', 'emailOnUpload', e.target.checked)}
                    />
                    <Label className="form-check-label">
                      Email notifications on document upload
                    </Label>
                  </div>
                </FormGroup>

                <FormGroup>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={settings.notifications.emailOnShare}
                      onChange={(e) => handleInputChange('notifications', 'emailOnShare', e.target.checked)}
                    />
                    <Label className="form-check-label">
                      Email notifications when documents are shared
                    </Label>
                  </div>
                </FormGroup>

                <FormGroup>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={settings.notifications.emailOnDelete}
                      onChange={(e) => handleInputChange('notifications', 'emailOnDelete', e.target.checked)}
                    />
                    <Label className="form-check-label">
                      Email notifications on document deletion
                    </Label>
                  </div>
                </FormGroup>

                <FormGroup>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={settings.notifications.adminNotifications}
                      onChange={(e) => handleInputChange('notifications', 'adminNotifications', e.target.checked)}
                    />
                    <Label className="form-check-label">
                      Send admin notifications for system events
                    </Label>
                  </div>
                </FormGroup>
              </Form>
            </div>
          </PreviewCard>
        </Col>
      </Row>

      {/* Performance & Storage Usage */}
      <Row className="g-gs mt-4">
        {/* Performance Settings */}
        <Col lg="6">
          <PreviewCard>
            <div className="card-inner">
              <h6 className="mb-3">
                <Icon name="zap" className="me-2" />
                Performance Settings
              </h6>

              <Form>
                <FormGroup>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={settings.performance.enableCaching}
                      onChange={(e) => handleInputChange('performance', 'enableCaching', e.target.checked)}
                    />
                    <Label className="form-check-label">
                      Enable document caching
                    </Label>
                  </div>
                </FormGroup>

                <FormGroup>
                  <Label>Cache Expiration (hours)</Label>
                  <Input
                    type="number"
                    value={settings.performance.cacheExpirationHours}
                    onChange={(e) => handleInputChange('performance', 'cacheExpirationHours', parseInt(e.target.value))}
                    min="1"
                    max="168"
                    disabled={!settings.performance.enableCaching}
                  />
                </FormGroup>

                <FormGroup>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={settings.performance.enableCompression}
                      onChange={(e) => handleInputChange('performance', 'enableCompression', e.target.checked)}
                    />
                    <Label className="form-check-label">
                      Enable file compression
                    </Label>
                  </div>
                </FormGroup>

                <FormGroup>
                  <Label>Thumbnail Quality (%)</Label>
                  <Input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={settings.performance.thumbnailQuality}
                    onChange={(e) => handleInputChange('performance', 'thumbnailQuality', parseInt(e.target.value))}
                  />
                  <div className="d-flex justify-content-between">
                    <small className="text-muted">Lower quality</small>
                    <small className="text-muted">{settings.performance.thumbnailQuality}%</small>
                    <small className="text-muted">Higher quality</small>
                  </div>
                </FormGroup>
              </Form>
            </div>
          </PreviewCard>
        </Col>

        {/* Storage Usage Overview */}
        <Col lg="6">
          <PreviewCard>
            <div className="card-inner">
              <h6 className="mb-3">
                <Icon name="hard-drive" className="me-2" />
                Storage Usage
              </h6>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Documents</span>
                  <span className="fw-medium">2.4 GB</span>
                </div>
                <Progress value={65} color="primary" />
                <small className="text-muted">1,247 files</small>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Thumbnails</span>
                  <span className="fw-medium">156 MB</span>
                </div>
                <Progress value={15} color="info" />
                <small className="text-muted">892 thumbnails</small>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Versions</span>
                  <span className="fw-medium">1.1 GB</span>
                </div>
                <Progress value={30} color="warning" />
                <small className="text-muted">2,156 versions</small>
              </div>

              <div className="border-top pt-3 mt-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-medium">Total Usage</span>
                  <span className="fw-bold">3.7 GB</span>
                </div>
                <small className="text-muted">of 10 GB allocated</small>
              </div>

              <div className="mt-3">
                <Button size="sm" color="light" className="w-100">
                  <Icon name="refresh" className="me-2" />
                  Refresh Usage Stats
                </Button>
              </div>
            </div>
          </PreviewCard>
        </Col>
      </Row>
    </div>
  );
};

export default DocumentSettings;
