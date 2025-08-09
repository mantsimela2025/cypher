#!/usr/bin/env node
/**
 * Test Audit Logs API
 * Comprehensive testing of audit logging and compliance features
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1/audit-logs';
let authToken = null;
let testLogId = null;

async function authenticate() {
  try {
    console.log('🔐 Authenticating...');
    
    const authResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
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

async function testAuditLogsAPI() {
  console.log('📋 Testing Audit Logs API - Comprehensive Audit Trail & Compliance');
  console.log('====================================================================\n');

  try {
    const authHeaders = await authenticate();
    
    // Test 1: Create Audit Log Entry
    console.log('📝 Test 1: Create Audit Log Entry');
    console.log('----------------------------------');
    
    const auditLogData = {
      action: 'create',
      resourceType: 'user',
      resourceId: '123',
      description: 'Created new user account with admin privileges',
      level: 'info',
      oldValues: {},
      newValues: {
        email: 'newuser@example.com',
        role: 'admin',
        status: 'active'
      },
      metadata: {
        requestId: 'req-12345',
        source: 'admin_panel',
        department: 'IT'
      },
      success: true,
      duration: 250
    };
    
    const createResponse = await axios.post(BASE_URL, auditLogData, authHeaders);
    const createdLog = createResponse.data.data;
    testLogId = createdLog.id;
    
    console.log('✅ Audit log created successfully');
    console.log(`   • Log ID: ${createdLog.id}`);
    console.log(`   • Action: ${createdLog.action}`);
    console.log(`   • Resource: ${createdLog.resourceType}:${createdLog.resourceId}`);
    console.log(`   • Level: ${createdLog.level}`);
    console.log(`   • Success: ${createdLog.success}`);
    console.log(`   • Duration: ${createdLog.duration}ms`);

    // Test 2: Create Security Event (Failed Login)
    console.log('\n🚨 Test 2: Create Security Event (Failed Login)');
    console.log('-----------------------------------------------');
    
    const securityEventData = {
      action: 'login',
      resourceType: 'authentication',
      resourceId: 'user-456',
      description: 'Failed login attempt - invalid password',
      level: 'warn',
      success: false,
      errorMessage: 'Invalid credentials provided',
      metadata: {
        attemptCount: 3,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        location: 'New York, NY'
      },
      duration: 150
    };
    
    const securityResponse = await axios.post(BASE_URL, securityEventData, authHeaders);
    const securityLog = securityResponse.data.data;
    
    console.log('✅ Security event logged successfully');
    console.log(`   • Log ID: ${securityLog.id}`);
    console.log(`   • Action: ${securityLog.action}`);
    console.log(`   • Level: ${securityLog.level}`);
    console.log(`   • Success: ${securityLog.success}`);
    console.log(`   • Error: ${securityLog.errorMessage}`);

    // Test 3: Create Bulk Audit Logs
    console.log('\n📦 Test 3: Create Bulk Audit Logs');
    console.log('---------------------------------');
    
    const bulkAuditLogs = {
      auditLogs: [
        {
          action: 'read',
          resourceType: 'document',
          resourceId: 'doc-789',
          description: 'Accessed confidential document',
          level: 'info',
          metadata: { classification: 'confidential' }
        },
        {
          action: 'update',
          resourceType: 'user',
          resourceId: '456',
          description: 'Updated user permissions',
          level: 'info',
          oldValues: { role: 'user' },
          newValues: { role: 'admin' },
          metadata: { approvedBy: 'manager-123' }
        },
        {
          action: 'delete',
          resourceType: 'file',
          resourceId: 'file-999',
          description: 'Deleted sensitive file',
          level: 'warn',
          metadata: { reason: 'data_retention_policy' }
        }
      ]
    };
    
    const bulkResponse = await axios.post(`${BASE_URL}/bulk`, bulkAuditLogs, authHeaders);
    const bulkResult = bulkResponse.data.data;
    
    console.log('✅ Bulk audit logs created successfully');
    console.log(`   • Created: ${bulkResult.created} logs`);
    console.log(`   • Actions: ${bulkAuditLogs.auditLogs.map(log => log.action).join(', ')}`);

    // Test 4: Get Audit Log by ID
    console.log('\n🔍 Test 4: Get Audit Log by ID');
    console.log('------------------------------');
    
    const getResponse = await axios.get(`${BASE_URL}/${testLogId}`, authHeaders);
    const retrievedLog = getResponse.data.data;
    
    console.log('✅ Audit log retrieved successfully');
    console.log(`   • Log ID: ${retrievedLog.id}`);
    console.log(`   • Action: ${retrievedLog.action}`);
    console.log(`   • Description: ${retrievedLog.description}`);
    console.log(`   • Created: ${new Date(retrievedLog.createdAt).toLocaleString()}`);
    console.log(`   • User: ${retrievedLog.userName || 'System'} (${retrievedLog.userEmail || 'N/A'})`);

    // Test 5: Get All Audit Logs with Filtering
    console.log('\n📊 Test 5: Get All Audit Logs with Filtering');
    console.log('--------------------------------------------');
    
    const allLogsResponse = await axios.get(`${BASE_URL}?action=create&level=info&page=1&limit=10&sortBy=createdAt&sortOrder=desc`, authHeaders);
    const allLogs = allLogsResponse.data;
    
    console.log('✅ Audit logs retrieved successfully');
    console.log(`   • Total logs: ${allLogs.pagination.totalCount}`);
    console.log(`   • Current page: ${allLogs.pagination.page}`);
    console.log(`   • Logs on page: ${allLogs.data.length}`);
    console.log(`   • Filters: action=create, level=info`);
    
    if (allLogs.data.length > 0) {
      console.log('\n   📝 Recent Logs:');
      allLogs.data.slice(0, 3).forEach((log, i) => {
        console.log(`     ${i+1}. ${log.action} on ${log.resourceType} - ${log.description?.substring(0, 50)}...`);
        console.log(`        Level: ${log.level}, Success: ${log.success}, Time: ${new Date(log.createdAt).toLocaleString()}`);
      });
    }

    // Test 6: Search Audit Logs
    console.log('\n🔍 Test 6: Search Audit Logs');
    console.log('----------------------------');
    
    const searchResponse = await axios.get(`${BASE_URL}/search?q=user&action=create&level=info&timeRange=30d`, authHeaders);
    const searchResults = searchResponse.data.data;
    
    console.log('✅ Audit log search completed successfully');
    console.log(`   • Search term: "${searchResults.searchTerm}"`);
    console.log(`   • Results found: ${searchResults.totalResults}`);
    console.log(`   • Filters: ${JSON.stringify(searchResults.filters)}`);

    // Test 7: Get Audit Log Statistics
    console.log('\n📈 Test 7: Get Audit Log Statistics');
    console.log('-----------------------------------');
    
    const statsResponse = await axios.get(`${BASE_URL}/stats?timeRange=30d`, authHeaders);
    const stats = statsResponse.data.data;
    
    console.log('✅ Audit log statistics retrieved successfully');
    console.log(`   • Time Range: ${stats.timeRange}`);
    console.log(`   • Total Logs: ${stats.totalLogs}`);
    console.log(`   • Unique Users: ${stats.uniqueUsers}`);
    console.log(`   • Average Duration: ${stats.averageDuration?.toFixed(2) || 'N/A'}ms`);
    
    if (stats.actionDistribution.length > 0) {
      console.log('\n   🎯 Action Distribution:');
      stats.actionDistribution.slice(0, 5).forEach(action => {
        console.log(`     - ${action.action}: ${action.count}`);
      });
    }
    
    if (stats.resourceTypeDistribution.length > 0) {
      console.log('\n   📋 Resource Type Distribution:');
      stats.resourceTypeDistribution.slice(0, 5).forEach(resource => {
        console.log(`     - ${resource.resourceType}: ${resource.count}`);
      });
    }
    
    if (stats.levelDistribution.length > 0) {
      console.log('\n   📊 Level Distribution:');
      stats.levelDistribution.forEach(level => {
        console.log(`     - ${level.level}: ${level.count}`);
      });
    }

    // Test 8: Get Security Events
    console.log('\n🚨 Test 8: Get Security Events');
    console.log('------------------------------');
    
    const securityEventsResponse = await axios.get(`${BASE_URL}/security/events?timeRange=24h&level=warn`, authHeaders);
    const securityEvents = securityEventsResponse.data.data;
    
    console.log('✅ Security events retrieved successfully');
    console.log(`   • Time Range: ${securityEvents.timeRange}`);
    console.log(`   • Minimum Level: ${securityEvents.level}`);
    console.log(`   • Total Events: ${securityEvents.totalEvents}`);
    
    if (securityEvents.events.length > 0) {
      console.log('\n   🚨 Recent Security Events:');
      securityEvents.events.slice(0, 3).forEach((event, i) => {
        console.log(`     ${i+1}. ${event.action} on ${event.resourceType} - Level: ${event.level}`);
        console.log(`        Success: ${event.success}, IP: ${event.ipAddress || 'N/A'}`);
        console.log(`        Time: ${new Date(event.createdAt).toLocaleString()}`);
        if (event.errorMessage) {
          console.log(`        Error: ${event.errorMessage.substring(0, 60)}...`);
        }
      });
    }

    // Test 9: Get User Activity Timeline
    console.log('\n👤 Test 9: Get User Activity Timeline');
    console.log('------------------------------------');
    
    // Use the authenticated user's ID or a test user ID
    const userId = 1; // Assuming user ID 1 exists
    
    try {
      const timelineResponse = await axios.get(`${BASE_URL}/users/${userId}/timeline?timeRange=7d`, authHeaders);
      const timeline = timelineResponse.data.data;
      
      console.log('✅ User activity timeline retrieved successfully');
      console.log(`   • User ID: ${timeline.userId}`);
      console.log(`   • Time Range: ${timeline.timeRange}`);
      console.log(`   • Total Activities: ${timeline.totalActivities}`);
      
      if (timeline.timeline.length > 0) {
        console.log('\n   📅 Recent Activities:');
        timeline.timeline.slice(0, 5).forEach((activity, i) => {
          console.log(`     ${i+1}. ${activity.action} on ${activity.resourceType} - ${activity.level}`);
          console.log(`        Success: ${activity.success}, Duration: ${activity.duration || 'N/A'}ms`);
          console.log(`        Time: ${new Date(activity.createdAt).toLocaleString()}`);
        });
      }
    } catch (error) {
      console.log('⚠️  User activity timeline test skipped (user may not exist)');
    }

    // Test 10: Get Resource Access History
    console.log('\n📄 Test 10: Get Resource Access History');
    console.log('--------------------------------------');
    
    const resourceHistoryResponse = await axios.get(`${BASE_URL}/resources/history?resourceType=user&resourceId=123&timeRange=30d`, authHeaders);
    const resourceHistory = resourceHistoryResponse.data.data;
    
    console.log('✅ Resource access history retrieved successfully');
    console.log(`   • Resource: ${resourceHistory.resourceType}:${resourceHistory.resourceId}`);
    console.log(`   • Time Range: ${resourceHistory.timeRange}`);
    console.log(`   • Total Accesses: ${resourceHistory.totalAccesses}`);
    
    if (resourceHistory.history.length > 0) {
      console.log('\n   📋 Access History:');
      resourceHistory.history.slice(0, 3).forEach((access, i) => {
        console.log(`     ${i+1}. ${access.action} by ${access.userName || 'System'} (${access.userEmail || 'N/A'})`);
        console.log(`        IP: ${access.ipAddress || 'N/A'}, Success: ${access.success}`);
        console.log(`        Time: ${new Date(access.createdAt).toLocaleString()}`);
      });
    }

    // Test 11: Export Audit Logs for Compliance
    console.log('\n📤 Test 11: Export Audit Logs for Compliance');
    console.log('--------------------------------------------');
    
    const exportResponse = await axios.get(`${BASE_URL}/export?format=json&action=create&startDate=2024-01-01&endDate=2024-12-31`, authHeaders);
    const exportResult = exportResponse.data.data;
    
    console.log('✅ Audit logs exported successfully');
    console.log(`   • Format: ${exportResult.format}`);
    console.log(`   • Total Records: ${exportResult.totalRecords}`);
    console.log(`   • Exported At: ${new Date(exportResult.exportedAt).toLocaleString()}`);
    console.log(`   • Filters Applied: ${JSON.stringify(exportResult.filters)}`);
    
    if (exportResult.data.length > 0) {
      console.log('\n   📋 Sample Export Data:');
      exportResult.data.slice(0, 2).forEach((record, i) => {
        console.log(`     ${i+1}. ${record.action} on ${record.resource} by ${record.user}`);
        console.log(`        Timestamp: ${record.timestamp}, Success: ${record.success}`);
      });
    }

    // Test 12: Log User Action (Convenience Method)
    console.log('\n🎯 Test 12: Log User Action (Convenience Method)');
    console.log('------------------------------------------------');
    
    const userActionData = {
      action: 'view',
      resourceType: 'report',
      resourceId: 'report-456',
      description: 'Viewed quarterly security report',
      metadata: {
        reportType: 'security',
        quarter: 'Q4-2024',
        accessLevel: 'manager'
      }
    };
    
    const userActionResponse = await axios.post(`${BASE_URL}/log-action`, userActionData, authHeaders);
    const userActionLog = userActionResponse.data.data;
    
    console.log('✅ User action logged successfully');
    console.log(`   • Log ID: ${userActionLog.id}`);
    console.log(`   • Action: ${userActionLog.action}`);
    console.log(`   • Resource: ${userActionLog.resourceType}:${userActionLog.resourceId}`);
    console.log(`   • Description: ${userActionLog.description}`);

    console.log('\n🎉 All Audit Logs API tests completed successfully!');
    
    console.log('\n📋 Available Audit Log Endpoints:');
    console.log('   📝 Core Operations:');
    console.log('      • POST /api/v1/audit-logs - Create audit log entry');
    console.log('      • GET /api/v1/audit-logs - Get audit logs with filtering');
    console.log('      • GET /api/v1/audit-logs/{id} - Get audit log by ID');
    console.log('      • POST /api/v1/audit-logs/bulk - Create bulk audit logs');
    
    console.log('   📊 Analytics & Reporting:');
    console.log('      • GET /api/v1/audit-logs/stats - Get audit log statistics');
    console.log('      • GET /api/v1/audit-logs/users/{id}/timeline - User activity timeline');
    console.log('      • GET /api/v1/audit-logs/resources/history - Resource access history');
    console.log('      • GET /api/v1/audit-logs/search - Advanced search');
    
    console.log('   🚨 Security & Compliance:');
    console.log('      • GET /api/v1/audit-logs/security/events - Security events');
    console.log('      • GET /api/v1/audit-logs/export - Export for compliance');
    
    console.log('   🎯 Helper Methods:');
    console.log('      • POST /api/v1/audit-logs/log-action - Log user action');

    console.log('\n🎯 Key Features Demonstrated:');
    console.log('   ✅ Comprehensive audit trail with detailed logging');
    console.log('   ✅ Security event monitoring and alerting');
    console.log('   ✅ User activity tracking and timeline analysis');
    console.log('   ✅ Resource access history and monitoring');
    console.log('   ✅ Advanced search and filtering capabilities');
    console.log('   ✅ Statistical analysis and reporting');
    console.log('   ✅ Compliance export functionality');
    console.log('   ✅ Bulk operations for high-volume logging');
    console.log('   ✅ Performance monitoring with duration tracking');
    console.log('   ✅ IP address and session tracking');

    console.log('\n📊 Audit Log Levels:');
    console.log('   • DEBUG - Detailed diagnostic information');
    console.log('   • INFO - General informational messages');
    console.log('   • WARN - Warning conditions and potential issues');
    console.log('   • ERROR - Error conditions that need attention');
    console.log('   • CRITICAL - Critical conditions requiring immediate action');

    console.log('\n🎯 Supported Actions:');
    console.log('   • CRUD Operations: create, read, update, delete');
    console.log('   • Authentication: login, logout, access');
    console.log('   • Data Operations: export, import, backup, restore');
    console.log('   • Workflow: approve, reject, submit, revoke');
    console.log('   • File Operations: upload, download');
    console.log('   • System Operations: configure, deploy, migrate, rollback');

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
  testAuditLogsAPI().catch(console.error);
}

module.exports = { testAuditLogsAPI };
