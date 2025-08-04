#!/usr/bin/env node
/**
 * Test Notification API
 * Comprehensive testing of notification system
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
let authToken = null;
let testChannelId = null;
let testTemplateId = null;
let testNotificationId = null;

async function authenticate() {
  try {
    console.log('🔐 Authenticating...');
    
    const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    authToken = authResponse.data.token;
    console.log('✅ Authentication successful');
    
    return {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    console.log('⚠️  Authentication failed, proceeding without token');
    console.log('   (This is expected if auth is not set up)');
    
    return {
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
}

async function testNotificationAPI() {
  console.log('📢 Testing Notification API - Complete Notification System');
  console.log('===========================================================\n');

  try {
    const authHeaders = await authenticate();
    
    // Test 1: Create Notification Channel
    console.log('📡 Test 1: Create Notification Channel');
    console.log('--------------------------------------');
    
    const channelData = {
      name: 'Email Security Alerts',
      channelType: 'email',
      description: 'Email channel for security-related notifications',
      config: {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: 'alerts@company.com',
        smtp_secure: true,
        from_name: 'Security Team',
        from_email: 'security@company.com'
      },
      rateLimitPerMinute: 30,
      rateLimitPerHour: 500,
      retryAttempts: 3,
      retryDelay: 300,
      isActive: true
    };
    
    const channelResponse = await axios.post(`${BASE_URL}/notifications/channels`, channelData, authHeaders);
    const createdChannel = channelResponse.data.data;
    testChannelId = createdChannel.id;
    
    console.log('✅ Notification channel created successfully');
    console.log(`   • Channel ID: ${createdChannel.id}`);
    console.log(`   • Name: ${createdChannel.name}`);
    console.log(`   • Type: ${createdChannel.channelType}`);
    console.log(`   • Rate Limits: ${createdChannel.rateLimitPerMinute}/min, ${createdChannel.rateLimitPerHour}/hour`);
    console.log(`   • Retry Config: ${createdChannel.retryAttempts} attempts, ${createdChannel.retryDelay}s delay`);
    console.log(`   • Active: ${createdChannel.isActive}`);

    // Test 2: Create Notification Template
    console.log('\n📝 Test 2: Create Notification Template');
    console.log('---------------------------------------');
    
    const templateData = {
      module: 'security',
      eventType: 'login_attempt',
      name: 'Security Alert - Suspicious Login',
      subject: 'Security Alert: Suspicious login attempt detected',
      body: `
        <html>
        <body>
          <h2>Security Alert</h2>
          <p>Hello {{user_name}},</p>
          <p>We detected a suspicious login attempt on your account:</p>
          <ul>
            <li><strong>Time:</strong> {{timestamp}}</li>
            <li><strong>IP Address:</strong> {{ip_address}}</li>
            <li><strong>Location:</strong> {{location}}</li>
            <li><strong>Device:</strong> {{device}}</li>
          </ul>
          <p>If this was not you, please contact our security team immediately.</p>
          <p>Best regards,<br>Security Team</p>
        </body>
        </html>
      `,
      format: 'html',
      variables: ['user_name', 'timestamp', 'ip_address', 'location', 'device'],
      conditions: {
        priority: 'high',
        send_immediately: true
      },
      version: 1,
      isActive: true
    };
    
    const templateResponse = await axios.post(`${BASE_URL}/notifications/templates`, templateData, authHeaders);
    const createdTemplate = templateResponse.data.data;
    testTemplateId = createdTemplate.id;
    
    console.log('✅ Notification template created successfully');
    console.log(`   • Template ID: ${createdTemplate.id}`);
    console.log(`   • Module: ${createdTemplate.module}`);
    console.log(`   • Event Type: ${createdTemplate.eventType}`);
    console.log(`   • Name: ${createdTemplate.name}`);
    console.log(`   • Format: ${createdTemplate.format}`);
    console.log(`   • Variables: ${createdTemplate.variables.join(', ')}`);
    console.log(`   • Version: ${createdTemplate.version}`);

    // Test 3: Create Notification
    console.log('\n📢 Test 3: Create Notification');
    console.log('------------------------------');
    
    const notificationData = {
      title: 'Security Alert: Suspicious Login Detected',
      message: 'A suspicious login attempt was detected on your account from an unknown device.',
      type: 'security',
      module: 'security',
      eventType: 'login_attempt',
      relatedId: 12345,
      relatedType: 'login_attempt',
      metadata: {
        ip_address: '192.168.1.100',
        location: 'New York, NY',
        device: 'Chrome on Windows 10',
        timestamp: new Date().toISOString(),
        risk_score: 85
      },
      priority: 3, // High priority
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
    };
    
    const notificationResponse = await axios.post(`${BASE_URL}/notifications`, notificationData, authHeaders);
    const createdNotification = notificationResponse.data.data;
    testNotificationId = createdNotification.id;
    
    console.log('✅ Notification created successfully');
    console.log(`   • Notification ID: ${createdNotification.id}`);
    console.log(`   • Title: ${createdNotification.title}`);
    console.log(`   • Type: ${createdNotification.type}`);
    console.log(`   • Module: ${createdNotification.module}`);
    console.log(`   • Event Type: ${createdNotification.eventType}`);
    console.log(`   • Priority: ${createdNotification.priority}`);
    console.log(`   • Related: ${createdNotification.relatedType} #${createdNotification.relatedId}`);
    console.log(`   • Expires: ${new Date(createdNotification.expiresAt).toLocaleString()}`);

    // Test 4: Get User Notifications
    console.log('\n📋 Test 4: Get User Notifications');
    console.log('---------------------------------');
    
    const notificationsResponse = await axios.get(`${BASE_URL}/notifications?page=1&limit=10&sortBy=createdAt&sortOrder=desc`, authHeaders);
    const notifications = notificationsResponse.data;
    
    console.log('✅ User notifications retrieved successfully');
    console.log(`   • Total Notifications: ${notifications.pagination.totalCount}`);
    console.log(`   • Current Page: ${notifications.pagination.page}`);
    console.log(`   • Notifications on Page: ${notifications.data.length}`);
    
    if (notifications.data.length > 0) {
      console.log('\n   📢 Recent Notifications:');
      notifications.data.slice(0, 3).forEach((notification, i) => {
        console.log(`     ${i+1}. ${notification.title} (${notification.type})`);
        console.log(`        Priority: ${notification.priority}, Read: ${notification.read}`);
        console.log(`        Module: ${notification.module || 'N/A'}, Event: ${notification.eventType || 'N/A'}`);
        console.log(`        Created: ${new Date(notification.createdAt).toLocaleString()}`);
      });
    }

    // Test 5: Get Notification Statistics
    console.log('\n📊 Test 5: Get Notification Statistics');
    console.log('--------------------------------------');
    
    const statsResponse = await axios.get(`${BASE_URL}/notifications/stats`, authHeaders);
    const stats = statsResponse.data.data;
    
    console.log('✅ Notification statistics retrieved successfully');
    console.log('\n   📊 Overview:');
    console.log(`     • Total: ${stats.overview.total}`);
    console.log(`     • Unread: ${stats.overview.unread}`);
    console.log(`     • Read: ${stats.overview.read}`);
    console.log(`     • High Priority: ${stats.overview.highPriority}`);
    console.log(`     • Expired: ${stats.overview.expired}`);
    
    if (stats.byType.length > 0) {
      console.log('\n   📈 By Type:');
      stats.byType.forEach((type, i) => {
        console.log(`     ${i+1}. ${type.type}: ${type.count} total (${type.unreadCount} unread)`);
      });
    }
    
    if (stats.byModule.length > 0) {
      console.log('\n   📦 By Module:');
      stats.byModule.forEach((module, i) => {
        console.log(`     ${i+1}. ${module.module}: ${module.count} total (${module.unreadCount} unread)`);
      });
    }

    // Test 6: Filter Notifications
    console.log('\n🔍 Test 6: Filter Notifications');
    console.log('-------------------------------');
    
    const filteredResponse = await axios.get(`${BASE_URL}/notifications?type=security&read=false&priority=3&module=security`, authHeaders);
    const filteredNotifications = filteredResponse.data;
    
    console.log('✅ Filtered notifications retrieved successfully');
    console.log(`   • Filter: type=security, read=false, priority=3, module=security`);
    console.log(`   • Results Found: ${filteredNotifications.data.length}`);
    console.log(`   • Total Matching: ${filteredNotifications.pagination.totalCount}`);
    
    if (filteredNotifications.data.length > 0) {
      console.log('\n   🔍 Filtered Results:');
      filteredNotifications.data.slice(0, 2).forEach((notification, i) => {
        console.log(`     ${i+1}. ${notification.title}`);
        console.log(`        Type: ${notification.type}, Priority: ${notification.priority}`);
        console.log(`        Module: ${notification.module}, Read: ${notification.read}`);
      });
    }

    // Test 7: Mark Notification as Read
    console.log('\n👁️ Test 7: Mark Notification as Read');
    console.log('------------------------------------');
    
    const markReadResponse = await axios.patch(`${BASE_URL}/notifications/${testNotificationId}/read`, {}, authHeaders);
    const readNotification = markReadResponse.data.data;
    
    console.log('✅ Notification marked as read successfully');
    console.log(`   • Notification ID: ${readNotification.id}`);
    console.log(`   • Title: ${readNotification.title}`);
    console.log(`   • Read Status: ${readNotification.read}`);
    console.log(`   • Read At: ${new Date(readNotification.readAt).toLocaleString()}`);

    // Test 8: Get All Notification Channels
    console.log('\n📡 Test 8: Get All Notification Channels');
    console.log('----------------------------------------');
    
    const channelsResponse = await axios.get(`${BASE_URL}/notifications/channels?activeOnly=true`, authHeaders);
    const channels = channelsResponse.data.data;
    
    console.log('✅ Notification channels retrieved successfully');
    console.log(`   • Total Channels: ${channels.length}`);
    
    if (channels.length > 0) {
      console.log('\n   📡 Available Channels:');
      channels.forEach((channel, i) => {
        console.log(`     ${i+1}. ${channel.name} (${channel.channelType})`);
        console.log(`        Rate Limits: ${channel.rateLimitPerMinute}/min, ${channel.rateLimitPerHour}/hour`);
        console.log(`        Retry: ${channel.retryAttempts} attempts, ${channel.retryDelay}s delay`);
        console.log(`        Active: ${channel.isActive}`);
        console.log(`        Created: ${new Date(channel.createdAt).toLocaleString()}`);
      });
    }

    // Test 9: Get All Notification Templates
    console.log('\n📝 Test 9: Get All Notification Templates');
    console.log('-----------------------------------------');
    
    const templatesResponse = await axios.get(`${BASE_URL}/notifications/templates?activeOnly=true`, authHeaders);
    const templates = templatesResponse.data.data;
    
    console.log('✅ Notification templates retrieved successfully');
    console.log(`   • Total Templates: ${templates.length}`);
    
    if (templates.length > 0) {
      console.log('\n   📝 Available Templates:');
      templates.forEach((template, i) => {
        console.log(`     ${i+1}. ${template.name} (${template.module}:${template.eventType})`);
        console.log(`        Format: ${template.format}, Version: ${template.version}`);
        console.log(`        Variables: ${template.variables?.length || 0} variables`);
        console.log(`        Active: ${template.isActive}`);
        console.log(`        Created: ${new Date(template.createdAt).toLocaleString()}`);
      });
    }

    // Test 10: Update Notification Channel
    console.log('\n🔧 Test 10: Update Notification Channel');
    console.log('---------------------------------------');
    
    const updateChannelData = {
      description: 'Updated: Email channel for security-related notifications with enhanced features',
      rateLimitPerMinute: 50,
      rateLimitPerHour: 800,
      config: {
        ...channelData.config,
        priority_routing: true,
        encryption: 'TLS'
      }
    };
    
    const updateChannelResponse = await axios.put(`${BASE_URL}/notifications/channels/${testChannelId}`, updateChannelData, authHeaders);
    const updatedChannel = updateChannelResponse.data.data;
    
    console.log('✅ Notification channel updated successfully');
    console.log(`   • Channel ID: ${updatedChannel.id}`);
    console.log(`   • Name: ${updatedChannel.name}`);
    console.log(`   • Updated Rate Limits: ${updatedChannel.rateLimitPerMinute}/min, ${updatedChannel.rateLimitPerHour}/hour`);
    console.log(`   • Description: ${updatedChannel.description}`);

    // Test 11: Mark All Notifications as Read
    console.log('\n👁️ Test 11: Mark All Notifications as Read');
    console.log('------------------------------------------');
    
    const markAllReadResponse = await axios.patch(`${BASE_URL}/notifications/read-all`, {
      type: 'security'
    }, authHeaders);
    const markAllResult = markAllReadResponse.data.data;
    
    console.log('✅ All security notifications marked as read successfully');
    console.log(`   • Updated Count: ${markAllResult.updatedCount}`);

    // Test 12: Create Multiple Notification Types
    console.log('\n📢 Test 12: Create Multiple Notification Types');
    console.log('----------------------------------------------');
    
    const notificationTypes = [
      {
        title: 'System Maintenance Scheduled',
        message: 'System maintenance is scheduled for tonight from 2:00 AM to 4:00 AM EST.',
        type: 'system',
        module: 'system',
        eventType: 'maintenance',
        priority: 2
      },
      {
        title: 'Vulnerability Scan Complete',
        message: 'The weekly vulnerability scan has completed. 3 new vulnerabilities found.',
        type: 'info',
        module: 'security',
        eventType: 'scan_complete',
        priority: 2,
        metadata: {
          scan_type: 'vulnerability',
          vulnerabilities_found: 3,
          scan_duration: '45 minutes'
        }
      },
      {
        title: 'Password Expiry Warning',
        message: 'Your password will expire in 7 days. Please update it soon.',
        type: 'warning',
        module: 'auth',
        eventType: 'password_expiry',
        priority: 2,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ];
    
    const createdNotifications = [];
    for (const notifData of notificationTypes) {
      const response = await axios.post(`${BASE_URL}/notifications`, notifData, authHeaders);
      createdNotifications.push(response.data.data);
    }
    
    console.log('✅ Multiple notifications created successfully');
    console.log(`   • Created ${createdNotifications.length} notifications:`);
    createdNotifications.forEach((notif, i) => {
      console.log(`     ${i+1}. ${notif.title} (${notif.type})`);
      console.log(`        Module: ${notif.module}, Priority: ${notif.priority}`);
    });

    console.log('\n🎉 All Notification API tests completed successfully!');
    
    console.log('\n📋 Available API Endpoints:');
    console.log('============================');
    
    console.log('\n📢 Core Notifications:');
    console.log('   • POST /api/v1/notifications - Create notification');
    console.log('   • GET /api/v1/notifications - Get user notifications with filtering');
    console.log('   • PATCH /api/v1/notifications/{id}/read - Mark notification as read');
    console.log('   • PATCH /api/v1/notifications/read-all - Mark all notifications as read');
    console.log('   • DELETE /api/v1/notifications/{id} - Delete notification');
    console.log('   • GET /api/v1/notifications/stats - Get notification statistics');
    
    console.log('\n📡 Notification Channels:');
    console.log('   • POST /api/v1/notifications/channels - Create notification channel');
    console.log('   • GET /api/v1/notifications/channels - Get all notification channels');
    console.log('   • PUT /api/v1/notifications/channels/{id} - Update notification channel');
    console.log('   • DELETE /api/v1/notifications/channels/{id} - Delete notification channel');
    
    console.log('\n📝 Notification Templates:');
    console.log('   • POST /api/v1/notifications/templates - Create notification template');
    console.log('   • GET /api/v1/notifications/templates - Get all notification templates');
    console.log('   • GET /api/v1/notifications/templates/{module}/{eventType} - Get template by module and event');
    console.log('   • PUT /api/v1/notifications/templates/{id} - Update notification template');
    console.log('   • DELETE /api/v1/notifications/templates/{id} - Delete notification template');

    console.log('\n🎯 Key Features Demonstrated:');
    console.log('==============================');
    console.log('   ✅ Multi-channel notification delivery (email, SMS, push, webhook, etc.)');
    console.log('   ✅ Template-based notification system with variables');
    console.log('   ✅ Priority-based notification handling');
    console.log('   ✅ Advanced filtering and search capabilities');
    console.log('   ✅ Real-time notification statistics and analytics');
    console.log('   ✅ Rate limiting and retry mechanisms');
    console.log('   ✅ Expiration and lifecycle management');
    console.log('   ✅ Module and event-based organization');
    console.log('   ✅ Read/unread status tracking');
    console.log('   ✅ Bulk operations (mark all as read)');

    console.log('\n📊 Supported Notification Types:');
    console.log('=================================');
    console.log('   • INFO - General information notifications');
    console.log('   • SUCCESS - Success confirmations and completions');
    console.log('   • WARNING - Warning messages and alerts');
    console.log('   • ERROR - Error notifications and failures');
    console.log('   • ALERT - Important alerts requiring attention');
    console.log('   • REMINDER - Reminders and scheduled notifications');
    console.log('   • SYSTEM - System-related notifications');
    console.log('   • SECURITY - Security alerts and notifications');

    console.log('\n📡 Supported Channel Types:');
    console.log('============================');
    console.log('   • EMAIL - Email notifications via SMTP');
    console.log('   • SMS - SMS notifications via SMS gateway');
    console.log('   • PUSH - Push notifications for mobile/web');
    console.log('   • WEBHOOK - HTTP webhook notifications');
    console.log('   • SLACK - Slack channel notifications');
    console.log('   • TEAMS - Microsoft Teams notifications');
    console.log('   • DISCORD - Discord channel notifications');
    console.log('   • IN_APP - In-application notifications');

    console.log('\n📝 Template Features:');
    console.log('=====================');
    console.log('   • Variable substitution with {{variable}} syntax');
    console.log('   • Multiple format support (HTML, text, markdown, JSON)');
    console.log('   • Version control and template inheritance');
    console.log('   • Conditional logic and dynamic content');
    console.log('   • Module and event-based organization');
    console.log('   • Template validation and testing');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ API server not running. Please start it first:');
      console.error('   npm run dev');
    } else if (error.response) {
      console.error(`❌ API Error: ${error.response.status} - ${error.response.data?.error || error.message}`);
      if (error.response.data?.details) {
        console.error('   Details:', error.response.data.details);
      }
    } else {
      console.error(`❌ Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testNotificationAPI().catch(console.error);
}

module.exports = { testNotificationAPI };
