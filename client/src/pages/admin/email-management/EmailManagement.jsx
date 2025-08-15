import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Badge, Spinner, Button, Modal, ModalBody, ModalHeader, FormGroup, Label, Input } from 'reactstrap';
import { emailApi } from '../../../utils/emailApi';

const Tabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "status", label: "SES Status" },
    { id: "templates", label: "Email Templates" },
    { id: "test", label: "Send Test Email" },
    { id: "logs", label: "Email Logs" },
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

// ✅ CORRECT: SES Status component following API guide patterns
const SESStatus = () => {
  const [sesStatus, setSesStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ CORRECT: Fetch data with proper error handling
  const fetchSESStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching SES status...');
      const response = await emailApi.getSESStatus();
      
      if (response.success) {
        console.log('📊 SUCCESS: Received SES status');
        setSesStatus(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch SES status');
      }
    } catch (err) {
      console.error('❌ Error fetching SES status:', err);
      
      // ✅ CORRECT: Handle different error types
      if (err.message.includes('status: 401')) {
        setError('Authentication required. Please log in.');
      } else if (err.message.includes('status: 403')) {
        setError('Access denied. Insufficient permissions.');
      } else if (err.message.includes('status: 500')) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORRECT: Effect with dependency array
  useEffect(() => {
    fetchSESStatus();
  }, []);

  // ✅ CORRECT: Loading and error states
  if (loading) {
    return (
      <div className="d-flex justify-content-center p-4">
        <Spinner color="primary" className="me-2" />
        Loading SES configuration...
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h6>Error Loading SES Status</h6>
        <p>{error}</p>
        <button className="btn btn-outline-danger btn-sm" onClick={fetchSESStatus}>
          Try Again
        </button>
      </div>
    );
  }

  if (!sesStatus) {
    return <div className="alert alert-warning">No SES status data available</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Amazon SES Configuration Status</h5>
        <button className="btn btn-outline-primary btn-sm" onClick={fetchSESStatus}>
          Refresh Status
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 bg-light">
            <div className="card-body text-center">
              <h6 className="text-muted mb-2">Status</h6>
              <Badge color={sesStatus.isConfigured ? 'success' : 'warning'} className="fs-6">
                {sesStatus.isConfigured ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 bg-light">
            <div className="card-body text-center">
              <h6 className="text-muted mb-2">Daily Limit</h6>
              <strong className="fs-5">{sesStatus.quota.max24HourSend}</strong>
              <small className="text-muted d-block">emails/day</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 bg-light">
            <div className="card-body text-center">
              <h6 className="text-muted mb-2">Rate Limit</h6>
              <strong className="fs-5">{sesStatus.quota.maxSendRate}</strong>
              <small className="text-muted d-block">emails/sec</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 bg-light">
            <div className="card-body text-center">
              <h6 className="text-muted mb-2">Sent Today</h6>
              <strong className="fs-5">{sesStatus.quota.sentLast24Hours}</strong>
              <small className="text-muted d-block">emails</small>
            </div>
          </div>
        </div>
      </div>

      {sesStatus.identities && sesStatus.identities.length > 0 && (
        <div className="mb-4">
          <h6>Verified Email Identities</h6>
          <div className="d-flex flex-wrap gap-2">
            {sesStatus.identities.map((identity, index) => (
              <Badge key={index} color="success" className="p-2">
                {identity}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="alert alert-info">
        <h6>📋 SES Account Information</h6>
        <ul className="mb-0">
          <li><strong>Service:</strong> Amazon Simple Email Service (SES)</li>
          <li><strong>Mode:</strong> {sesStatus.quota.max24HourSend <= 200 ? 'Sandbox' : 'Production'}</li>
          <li><strong>Region:</strong> US-East-1</li>
          <li><strong>Last Updated:</strong> {new Date(sesStatus.lastUpdated).toLocaleString()}</li>
        </ul>
      </div>
    </div>
  );
};

// ✅ CORRECT: Email Templates component with API integration
const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingTemplate, setSendingTemplate] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching email templates...');
      const response = await emailApi.getEmailTemplates();
      
      if (response.success) {
        console.log('📧 SUCCESS: Received email templates');
        setTemplates(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch email templates');
      }
    } catch (err) {
      console.error('❌ Error fetching email templates:', err);
      setError(err.message);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTemplate = async () => {
    try {
      if (!recipientEmail || !selectedTemplate) {
        toast.error('Please enter a recipient email address');
        return;
      }

      setSendingTemplate(selectedTemplate.id);
      console.log(`📧 Sending template email: ${selectedTemplate.name}`);
      
      const response = await emailApi.sendEmailFromTemplate(
        recipientEmail,
        selectedTemplate.id
      );
      
      if (response.success) {
        toast.success(`Template "${selectedTemplate.name}" sent successfully!`);
        setShowSendModal(false);
        setRecipientEmail('');
        setSelectedTemplate(null);
      } else {
        throw new Error(response.error || 'Failed to send template email');
      }
    } catch (error) {
      console.error('❌ Error sending template email:', error);
      toast.error(`Failed to send template: ${error.message}`);
    } finally {
      setSendingTemplate(null);
    }
  };

  const openSendModal = (template) => {
    setSelectedTemplate(template);
    setShowSendModal(true);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center p-4">
        <Spinner color="primary" className="me-2" />
        Loading email templates...
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h6>Error Loading Email Templates</h6>
        <p>{error}</p>
        <button className="btn btn-outline-danger btn-sm" onClick={fetchTemplates}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Predefined Email Templates</h5>
        <button className="btn btn-outline-primary btn-sm" onClick={fetchTemplates}>
          Refresh Templates
        </button>
      </div>

      <div className="row">
        {templates.map((template) => (
          <div key={template.id} className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <h6 className="card-title">{template.name}</h6>
                <p className="card-text text-muted">{template.subject}</p>
                <div className="card-text">
                  <small className="text-muted">Template ID: {template.id}</small>
                </div>
              </div>
              <div className="card-footer">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => openSendModal(template)}
                  disabled={sendingTemplate === template.id}
                >
                  {sendingTemplate === template.id ? (
                    <><Spinner size="sm" className="me-1" />Sending...</>
                  ) : (
                    'Send Template'
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Send Template Modal */}
      <Modal isOpen={showSendModal} toggle={() => setShowSendModal(false)}>
        <ModalHeader toggle={() => setShowSendModal(false)}>
          Send Email Template
        </ModalHeader>
        <ModalBody>
          {selectedTemplate && (
            <>
              <div className="mb-3">
                <h6>Template: {selectedTemplate.name}</h6>
                <p className="text-muted">{selectedTemplate.subject}</p>
              </div>
              <FormGroup>
                <Label>Recipient Email Address</Label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Enter recipient email"
                />
              </FormGroup>
              <div className="d-flex justify-content-end gap-2">
                <Button color="secondary" onClick={() => setShowSendModal(false)}>
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  onClick={handleSendTemplate}
                  disabled={sendingTemplate}
                >
                  {sendingTemplate ? <Spinner size="sm" className="me-1" /> : null}
                  Send Email
                </Button>
              </div>
            </>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};

// ✅ CORRECT: Test Email component
const TestEmail = () => {
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState({
    recipientEmail: '',
    senderEmail: 'jerome.harrison@redarchsolutions.com'
  });
  const [customEmail, setCustomEmail] = useState({
    recipientEmail: '',
    subject: '',
    message: '',
    senderEmail: 'jerome.harrison@redarchsolutions.com'
  });

  const handleSendTestEmail = async () => {
    try {
      if (!testEmail.recipientEmail) {
        toast.error('Please enter a recipient email address');
        return;
      }

      setLoading(true);
      console.log('📧 Sending test email...');
      
      const response = await emailApi.sendTestEmail(
        testEmail.recipientEmail,
        testEmail.senderEmail
      );
      
      if (response.success) {
        toast.success('Test email sent successfully!');
        console.log('✅ Test email sent:', response.data);
      } else {
        throw new Error(response.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('❌ Error sending test email:', error);
      toast.error(`Failed to send test email: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCustomEmail = async () => {
    try {
      if (!customEmail.recipientEmail || !customEmail.subject || !customEmail.message) {
        toast.error('Please fill in all required fields');
        return;
      }

      setLoading(true);
      console.log('📧 Sending custom notification email...');
      
      const response = await emailApi.sendNotificationEmail(
        customEmail.recipientEmail,
        customEmail.subject,
        customEmail.message,
        customEmail.senderEmail
      );
      
      if (response.success) {
        toast.success('Custom email sent successfully!');
        console.log('✅ Custom email sent:', response.data);
        // Clear form
        setCustomEmail({
          ...customEmail,
          recipientEmail: '',
          subject: '',
          message: ''
        });
      } else {
        throw new Error(response.error || 'Failed to send custom email');
      }
    } catch (error) {
      console.error('❌ Error sending custom email:', error);
      toast.error(`Failed to send custom email: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h6 className="card-title">📧 Send Test Email</h6>
              <p className="text-muted">Send a predefined test email to verify SES functionality</p>
              
              <FormGroup>
                <Label>Recipient Email</Label>
                <Input
                  type="email"
                  value={testEmail.recipientEmail}
                  onChange={(e) => setTestEmail({...testEmail, recipientEmail: e.target.value})}
                  placeholder="Enter recipient email"
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Sender Email</Label>
                <Input
                  type="email"
                  value={testEmail.senderEmail}
                  onChange={(e) => setTestEmail({...testEmail, senderEmail: e.target.value})}
                  placeholder="Enter sender email"
                />
              </FormGroup>
              
              <Button 
                color="primary"
                onClick={handleSendTestEmail}
                disabled={loading}
                block
              >
                {loading ? <><Spinner size="sm" className="me-1" />Sending...</> : 'Send Test Email'}
              </Button>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h6 className="card-title">🔔 Send Custom Notification</h6>
              <p className="text-muted">Send a custom notification email with your own content</p>
              
              <FormGroup>
                <Label>Recipient Email</Label>
                <Input
                  type="email"
                  value={customEmail.recipientEmail}
                  onChange={(e) => setCustomEmail({...customEmail, recipientEmail: e.target.value})}
                  placeholder="Enter recipient email"
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Subject</Label>
                <Input
                  type="text"
                  value={customEmail.subject}
                  onChange={(e) => setCustomEmail({...customEmail, subject: e.target.value})}
                  placeholder="Enter email subject"
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Message</Label>
                <Input
                  type="textarea"
                  rows="4"
                  value={customEmail.message}
                  onChange={(e) => setCustomEmail({...customEmail, message: e.target.value})}
                  placeholder="Enter your message (HTML supported)"
                />
              </FormGroup>
              
              <Button 
                color="success"
                onClick={handleSendCustomEmail}
                disabled={loading}
                block
              >
                {loading ? <><Spinner size="sm" className="me-1" />Sending...</> : 'Send Custom Email'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ CORRECT: Real Email Logs component with API integration
import EmailLogsDataTable from "./EmailLogsDataTable";

const EmailLogs = () => {
  const [emailLogs, setEmailLogs] = useState([]);
  const [emailStats, setEmailStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingTestEmails, setSendingTestEmails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    limit: 10
  });

  const fetchEmailLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching email logs...');
      const response = await emailApi.getEmailLogs({
        page,
        limit: filters.limit,
        status: filters.status || undefined,
        category: filters.category || undefined
      });

      if (response.success) {
        console.log('📧 SUCCESS: Received email logs');
        setEmailLogs(response.data || []);
        setCurrentPage(response.meta?.page || 1);
        setTotalPages(response.meta?.totalPages || 0);
      } else {
        throw new Error(response.error || 'Failed to fetch email logs');
      }
    } catch (err) {
      console.error('❌ Error fetching email logs:', err);
      setError(err.message);
      setEmailLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailStats = async () => {
    try {
      console.log('🔄 Fetching email statistics...');
      const response = await emailApi.getEmailStats();

      if (response.success) {
        console.log('📊 SUCCESS: Received email statistics');
        setEmailStats(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch email statistics');
      }
    } catch (err) {
      console.error('❌ Error fetching email statistics:', err);
      // Don't set error here, just log it
    }
  };

  const handleSendTestEmails = async () => {
    try {
      setSendingTestEmails(true);
      console.log('🔄 Sending test emails for logging demonstration...');

      const response = await emailApi.sendTestEmails(5);

      if (response.success) {
        toast.success(`Test emails sent! ${response.data.sent} successful, ${response.data.failed} failed.`);
        console.log('✅ Test emails sent:', response.data);
        
        // Refresh logs to show new entries
        await fetchEmailLogs(currentPage);
        await fetchEmailStats();
      } else {
        throw new Error(response.error || 'Failed to send test emails');
      }
    } catch (error) {
      console.error('❌ Error sending test emails:', error);
      toast.error(`Failed to send test emails: ${error.message}`);
    } finally {
      setSendingTestEmails(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchEmailLogs(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchEmailLogs(page);
  };

  useEffect(() => {
    fetchEmailLogs();
    fetchEmailStats();
  }, []);

  if (loading && emailLogs.length === 0) {
    return (
      <div className="d-flex justify-content-center p-4">
        <Spinner color="primary" className="me-2" />
        Loading email logs...
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Email Activity Logs</h5>
        <div className="d-flex gap-2">
          <Button
            color="success"
            size="sm"
            onClick={handleSendTestEmails}
            disabled={sendingTestEmails}
          >
            {sendingTestEmails ? (
              <><Spinner size="sm" className="me-1" />Sending...</>
            ) : (
              '📧 Send Test Emails'
            )}
          </Button>
          <Button color="outline-primary" size="sm" onClick={() => fetchEmailLogs(currentPage)}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {emailStats && (
        <div className="row g-3 mb-4">
          <div className="col-md-2">
            <div className="card border-0 bg-light">
              <div className="card-body text-center p-2">
                <h6 className="text-muted mb-1 small">Total Emails</h6>
                <strong className="fs-6">{emailStats.totalEmails}</strong>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-0 bg-light">
              <div className="card-body text-center p-2">
                <h6 className="text-muted mb-1 small">Sent</h6>
                <strong className="fs-6 text-success">{emailStats.sentEmails}</strong>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-0 bg-light">
              <div className="card-body text-center p-2">
                <h6 className="text-muted mb-1 small">Failed</h6>
                <strong className="fs-6 text-danger">{emailStats.failedEmails}</strong>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-0 bg-light">
              <div className="card-body text-center p-2">
                <h6 className="text-muted mb-1 small">Last 24h</h6>
                <strong className="fs-6">{emailStats.emailsLast24h}</strong>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-0 bg-light">
              <div className="card-body text-center p-2">
                <h6 className="text-muted mb-1 small">Success Rate</h6>
                <strong className="fs-6">{emailStats.successRate}%</strong>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card border-0 bg-light">
              <div className="card-body text-center p-2">
                <h6 className="text-muted mb-1 small">Test Emails</h6>
                <strong className="fs-6">{emailStats.testEmails}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <Label>Status Filter</Label>
          <Input
            type="select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="delivered">Delivered</option>
            <option value="bounced">Bounced</option>
          </Input>
        </div>
        <div className="col-md-3">
          <Label>Category Filter</Label>
          <Input
            type="select"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="test">Test</option>
            <option value="notification">Notification</option>
            <option value="welcome">Welcome</option>
            <option value="alert">Alert</option>
            <option value="report">Report</option>
          </Input>
        </div>
        <div className="col-md-3">
          <Label>Per Page</Label>
          <Input
            type="select"
            value={filters.limit}
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Input>
        </div>
        <div className="col-md-3">
          <Label>&nbsp;</Label>
          <div>
            <Button color="primary" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-3">
          <h6>Error Loading Email Logs</h6>
          <p>{error}</p>
          <button className="btn btn-outline-danger btn-sm" onClick={() => fetchEmailLogs(currentPage)}>
            Try Again
          </button>
        </div>
      )}

      {/* Email Logs Table */}
      <EmailLogsDataTable
        data={emailLogs}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

// ✅ CORRECT: Main EmailManagement component
const EmailManagement = () => {
  const [activeTab, setActiveTab] = useState("status");

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3>Email Management</h3>
          <p className="text-muted mb-0">
            Manage Amazon SES configuration, send test emails, and monitor email activity.
          </p>
        </div>
        <Badge color="success" className="fs-6">Amazon SES</Badge>
      </div>
      
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="card card-body">
        {activeTab === "status" && <SESStatus />}
        {activeTab === "templates" && <EmailTemplates />}
        {activeTab === "test" && <TestEmail />}
        {activeTab === "logs" && <EmailLogs />}
      </div>
    </div>
  );
};

export default EmailManagement;
