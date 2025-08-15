import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Card, CardBody, Button, Row, Col, FormGroup, Label, Input, Badge, Spinner } from 'reactstrap';
import { emailApi } from '../../utils/emailApi';

const EmailTest = () => {
  const [sesStatus, setSesStatus] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  
  // Form states
  const [testEmail, setTestEmail] = useState({
    recipientEmail: '',
    senderEmail: 'jerome.harrison@redarchsolutions.com'
  });
  
  const [notificationEmail, setNotificationEmail] = useState({
    recipientEmail: '',
    subject: '',
    message: '',
    senderEmail: 'jerome.harrison@redarchsolutions.com'
  });

  // ✅ CORRECT: Fetch SES status and templates on component mount
  useEffect(() => {
    fetchSESStatus();
    fetchEmailTemplates();
  }, []);

  const fetchSESStatus = async () => {
    try {
      setStatusLoading(true);
      console.log('🔄 Fetching SES status...');
      const response = await emailApi.getSESStatus();
      
      if (response.success) {
        console.log('📊 SES Status received');
        setSesStatus(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch SES status');
      }
    } catch (error) {
      console.error('❌ Error fetching SES status:', error);
      toast.error(`Failed to load SES status: ${error.message}`);
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchEmailTemplates = async () => {
    try {
      console.log('🔄 Fetching email templates...');
      const response = await emailApi.getEmailTemplates();
      
      if (response.success) {
        console.log('📧 Email templates received');
        setTemplates(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch email templates');
      }
    } catch (error) {
      console.error('❌ Error fetching email templates:', error);
      toast.error(`Failed to load email templates: ${error.message}`);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      setLoading(true);
      
      if (!testEmail.recipientEmail) {
        toast.error('Please enter a recipient email address');
        return;
      }
      
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

  const handleSendNotificationEmail = async () => {
    try {
      setLoading(true);
      
      if (!notificationEmail.recipientEmail || !notificationEmail.subject || !notificationEmail.message) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      console.log('📧 Sending notification email...');
      const response = await emailApi.sendNotificationEmail(
        notificationEmail.recipientEmail,
        notificationEmail.subject,
        notificationEmail.message,
        notificationEmail.senderEmail
      );
      
      if (response.success) {
        toast.success('Notification email sent successfully!');
        console.log('✅ Notification email sent:', response.data);
      } else {
        throw new Error(response.error || 'Failed to send notification email');
      }
    } catch (error) {
      console.error('❌ Error sending notification email:', error);
      toast.error(`Failed to send notification email: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTemplateEmail = async (templateId) => {
    try {
      if (!testEmail.recipientEmail) {
        toast.error('Please enter a recipient email address in the test email section');
        return;
      }

      setLoading(true);
      console.log(`📧 Sending template email: ${templateId}`);
      
      const response = await emailApi.sendEmailFromTemplate(
        testEmail.recipientEmail,
        templateId,
        testEmail.senderEmail
      );
      
      if (response.success) {
        toast.success(`Template email "${templateId}" sent successfully!`);
        console.log('✅ Template email sent:', response.data);
      } else {
        throw new Error(response.error || 'Failed to send template email');
      }
    } catch (error) {
      console.error('❌ Error sending template email:', error);
      toast.error(`Failed to send template email: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (isConfigured) => {
    return isConfigured ? 'success' : 'warning';
  };

  if (statusLoading) {
    return (
      <div className="d-flex justify-content-center p-4">
        <Spinner color="primary" />
        <span className="ms-2">Loading SES configuration...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="nk-content-inner">
        <div className="nk-content-body">
          <div className="nk-block-head nk-block-head-sm">
            <div className="nk-block-between">
              <div className="nk-block-head-content">
                <h3 className="nk-block-title page-title">Email Testing (Amazon SES)</h3>
                <p className="text-muted">Test Amazon SES email functionality and view configuration status.</p>
              </div>
            </div>
          </div>

          <Row>
            {/* SES Status Card */}
            <Col md={12} className="mb-4">
              <Card>
                <CardBody>
                  <h5 className="card-title">📊 SES Configuration Status</h5>
                  {sesStatus && (
                    <Row>
                      <Col md={3}>
                        <div className="status-item">
                          <Label>Status</Label>
                          <div>
                            <Badge color={getSeverityColor(sesStatus.isConfigured)} className="me-2">
                              {sesStatus.isConfigured ? 'Configured' : 'Not Configured'}
                            </Badge>
                          </div>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="status-item">
                          <Label>Daily Limit</Label>
                          <div><strong>{sesStatus.quota.max24HourSend}</strong> emails/day</div>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="status-item">
                          <Label>Rate Limit</Label>
                          <div><strong>{sesStatus.quota.maxSendRate}</strong> emails/sec</div>
                        </div>
                      </Col>
                      <Col md={3}>
                        <div className="status-item">
                          <Label>Sent Today</Label>
                          <div><strong>{sesStatus.quota.sentLast24Hours}</strong> emails</div>
                        </div>
                      </Col>
                    </Row>
                  )}
                  
                  {sesStatus && sesStatus.identities.length > 0 && (
                    <div className="mt-3">
                      <Label>Verified Identities</Label>
                      <div>
                        {sesStatus.identities.map((identity, index) => (
                          <Badge key={index} color="success" className="me-2 mb-1">
                            {identity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>

            {/* Test Email Card */}
            <Col md={6} className="mb-4">
              <Card>
                <CardBody>
                  <h5 className="card-title">📧 Send Test Email</h5>
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
                  >
                    {loading ? <Spinner size="sm" /> : 'Send Test Email'}
                  </Button>
                </CardBody>
              </Card>
            </Col>

            {/* Custom Notification Email Card */}
            <Col md={6} className="mb-4">
              <Card>
                <CardBody>
                  <h5 className="card-title">🔔 Send Custom Notification</h5>
                  <FormGroup>
                    <Label>Recipient Email</Label>
                    <Input
                      type="email"
                      value={notificationEmail.recipientEmail}
                      onChange={(e) => setNotificationEmail({...notificationEmail, recipientEmail: e.target.value})}
                      placeholder="Enter recipient email"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Subject</Label>
                    <Input
                      type="text"
                      value={notificationEmail.subject}
                      onChange={(e) => setNotificationEmail({...notificationEmail, subject: e.target.value})}
                      placeholder="Enter email subject"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Message</Label>
                    <Input
                      type="textarea"
                      rows="4"
                      value={notificationEmail.message}
                      onChange={(e) => setNotificationEmail({...notificationEmail, message: e.target.value})}
                      placeholder="Enter your message (HTML supported)"
                    />
                  </FormGroup>
                  <Button 
                    color="success" 
                    onClick={handleSendNotificationEmail}
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : 'Send Notification'}
                  </Button>
                </CardBody>
              </Card>
            </Col>

            {/* Email Templates Card */}
            <Col md={12}>
              <Card>
                <CardBody>
                  <h5 className="card-title">📝 Email Templates</h5>
                  <p className="text-muted">Click to send predefined template emails (uses recipient from test email section)</p>
                  <Row>
                    {templates.map((template) => (
                      <Col key={template.id} md={4} className="mb-3">
                        <Card className="border">
                          <CardBody>
                            <h6>{template.name}</h6>
                            <p className="text-muted small">{template.subject}</p>
                            <Button 
                              size="sm" 
                              color="outline-primary" 
                              onClick={() => handleSendTemplateEmail(template.id)}
                              disabled={loading}
                            >
                              {loading ? <Spinner size="sm" /> : 'Send Template'}
                            </Button>
                          </CardBody>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default EmailTest;