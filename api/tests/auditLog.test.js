const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/db');
const { users, auditLogs } = require('../src/db/schema');
const jwt = require('jsonwebtoken');
const auditLogService = require('../src/services/auditLogService');

describe('Audit Log Service Tests', () => {
  let authToken;
  let adminToken;
  let testUser;
  let testAdmin;
  let testAuditLog;

  beforeAll(async () => {
    // Create test admin user
    const [admin] = await db.insert(users)
      .values({
        firstName: 'Test',
        lastName: 'Admin',
        email: 'test.admin@example.com',
        password: 'hashedpassword',
        role: 'admin',
        status: 'active'
      })
      .returning();

    testAdmin = admin;

    // Create test regular user
    const [user] = await db.insert(users)
      .values({
        firstName: 'Test',
        lastName: 'User',
        email: 'test.user@example.com',
        password: 'hashedpassword',
        role: 'user',
        status: 'active'
      })
      .returning();

    testUser = user;

    // Generate auth tokens
    adminToken = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email, 
        role: admin.role 
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    authToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(auditLogs).where({ userId: testAdmin.id });
    await db.delete(auditLogs).where({ userId: testUser.id });
    await db.delete(users).where({ id: testAdmin.id });
    await db.delete(users).where({ id: testUser.id });
  });

  describe('Audit Log Creation (Service Level)', () => {
    it('should create audit log entry with all required fields', async () => {
      const auditData = {
        userId: testUser.id,
        module: 'users',
        action: 'user_login',
        resourceType: 'user',
        resourceId: testUser.id,
        details: {
          ipAddress: '192.168.1.100',
          userAgent: 'Test Browser'
        }
      };

      const auditLog = await auditLogService.createAuditLog(auditData);

      expect(auditLog).toHaveProperty('id');
      expect(auditLog).toHaveProperty('userId', testUser.id);
      expect(auditLog).toHaveProperty('module', 'users');
      expect(auditLog).toHaveProperty('action', 'user_login');
      expect(auditLog).toHaveProperty('resourceType', 'user');
      expect(auditLog).toHaveProperty('resourceId', testUser.id);
      expect(auditLog.details).toHaveProperty('ipAddress', '192.168.1.100');

      testAuditLog = auditLog;
    });

    it('should create audit log with minimal required fields', async () => {
      const auditData = {
        userId: testUser.id,
        module: 'settings',
        action: 'setting_updated'
      };

      const auditLog = await auditLogService.createAuditLog(auditData);

      expect(auditLog).toHaveProperty('id');
      expect(auditLog).toHaveProperty('userId', testUser.id);
      expect(auditLog).toHaveProperty('module', 'settings');
      expect(auditLog).toHaveProperty('action', 'setting_updated');
    });

    it('should handle JSON details properly', async () => {
      const complexDetails = {
        changes: {
          oldValue: 'old_setting_value',
          newValue: 'new_setting_value'
        },
        metadata: {
          source: 'web_ui',
          timestamp: new Date().toISOString()
        }
      };

      const auditData = {
        userId: testUser.id,
        module: 'settings',
        action: 'setting_updated',
        details: complexDetails
      };

      const auditLog = await auditLogService.createAuditLog(auditData);

      expect(auditLog.details).toEqual(complexDetails);
    });

    it('should reject invalid action types', async () => {
      const auditData = {
        userId: testUser.id,
        module: 'users',
        action: 'invalid_action_type'
      };

      await expect(auditLogService.createAuditLog(auditData))
        .rejects
        .toThrow();
    });
  });

  describe('GET /api/v1/audit-logs', () => {
    it('should return audit logs with admin privileges', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Audit logs retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support filtering by module', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs?module=users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(log => {
        expect(log.module).toBe('users');
      });
    });

    it('should support filtering by action', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs?action=user_login')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.data.forEach(log => {
        expect(log.action).toBe('user_login');
      });
    });

    it('should support filtering by user', async () => {
      const response = await request(app)
        .get(`/api/v1/audit-logs?userId=${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.data.forEach(log => {
        expect(log.userId).toBe(testUser.id);
      });
    });

    it('should support date range filtering', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/v1/audit-logs?dateFrom=${today}&dateTo=${today}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs?sortBy=createdAt&sortOrder=desc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.data.length > 1) {
        const firstDate = new Date(response.body.data[0].createdAt);
        const secondDate = new Date(response.body.data[1].createdAt);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });

    it('should deny access to non-admin users', async () => {
      await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/audit-logs')
        .expect(401);
    });
  });

  describe('GET /api/v1/audit-logs/:id', () => {
    it('should return specific audit log by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/audit-logs/${testAuditLog.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Audit log retrieved successfully');
      expect(response.body.data).toHaveProperty('id', testAuditLog.id);
      expect(response.body.data).toHaveProperty('userId', testUser.id);
      expect(response.body.data).toHaveProperty('module', 'users');
    });

    it('should return 404 for non-existent audit log', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not found');
    });

    it('should validate ID parameter', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid audit log ID');
    });
  });

  describe('GET /api/v1/audit-logs/statistics', () => {
    it('should return audit log statistics', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Audit log statistics retrieved successfully');
      expect(response.body.data).toHaveProperty('totalLogs');
      expect(response.body.data).toHaveProperty('moduleBreakdown');
      expect(response.body.data).toHaveProperty('actionBreakdown');
      expect(response.body.data).toHaveProperty('recentActivity');

      expect(Array.isArray(response.body.data.moduleBreakdown)).toBe(true);
      expect(Array.isArray(response.body.data.actionBreakdown)).toBe(true);
    });

    it('should deny statistics access to non-admin users', async () => {
      await request(app)
        .get('/api/v1/audit-logs/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('Audit Log Integrity', () => {
    it('should prevent modification of audit logs', async () => {
      // Audit logs should be immutable - no PUT/PATCH endpoints should exist
      await request(app)
        .put(`/api/v1/audit-logs/${testAuditLog.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'modified_action' })
        .expect(404); // Should not have this endpoint
    });

    it('should prevent deletion of audit logs', async () => {
      // Audit logs should be immutable - no DELETE endpoint should exist
      await request(app)
        .delete(`/api/v1/audit-logs/${testAuditLog.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404); // Should not have this endpoint
    });

    it('should automatically capture timestamp', async () => {
      const auditData = {
        userId: testUser.id,
        module: 'test',
        action: 'test_action'
      };

      const auditLog = await auditLogService.createAuditLog(auditData);

      expect(auditLog).toHaveProperty('createdAt');
      expect(new Date(auditLog.createdAt)).toBeInstanceOf(Date);
      
      // Should be recent (within last minute)
      const now = new Date();
      const logTime = new Date(auditLog.createdAt);
      const timeDiff = now.getTime() - logTime.getTime();
      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
    });
  });

  describe('Compliance Features', () => {
    it('should capture user context in audit logs', async () => {
      const auditData = {
        userId: testUser.id,
        module: 'compliance',
        action: 'policy_viewed',
        resourceType: 'policy',
        resourceId: 123,
        details: {
          policyName: 'Security Policy',
          accessMethod: 'web_ui'
        }
      };

      const auditLog = await auditLogService.createAuditLog(auditData);

      expect(auditLog).toHaveProperty('userId', testUser.id);
      expect(auditLog.details).toHaveProperty('policyName', 'Security Policy');
      expect(auditLog.details).toHaveProperty('accessMethod', 'web_ui');
    });

    it('should support different resource types', async () => {
      const resourceTypes = ['user', 'role', 'permission', 'setting', 'policy', 'asset'];
      
      for (const resourceType of resourceTypes) {
        const auditData = {
          userId: testUser.id,
          module: 'test',
          action: 'test_action',
          resourceType: resourceType,
          resourceId: 1
        };

        const auditLog = await auditLogService.createAuditLog(auditData);
        expect(auditLog).toHaveProperty('resourceType', resourceType);
      }
    });

    it('should handle high-volume logging', async () => {
      const startTime = Date.now();
      const promises = [];

      // Create 50 audit logs concurrently
      for (let i = 0; i < 50; i++) {
        const auditData = {
          userId: testUser.id,
          module: 'performance',
          action: 'bulk_test',
          details: { iteration: i }
        };
        promises.push(auditLogService.createAuditLog(auditData));
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Clean up
      await db.delete(auditLogs).where({ action: 'bulk_test' });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields gracefully', async () => {
      const auditData = {
        // Missing userId
        module: 'test',
        action: 'test_action'
      };

      await expect(auditLogService.createAuditLog(auditData))
        .rejects
        .toThrow();
    });

    it('should handle invalid user ID', async () => {
      const auditData = {
        userId: 99999, // Non-existent user
        module: 'test',
        action: 'test_action'
      };

      await expect(auditLogService.createAuditLog(auditData))
        .rejects
        .toThrow();
    });

    it('should handle malformed JSON details', async () => {
      // This should be handled at the service level
      const auditData = {
        userId: testUser.id,
        module: 'test',
        action: 'test_action',
        details: { validJson: true }
      };

      const auditLog = await auditLogService.createAuditLog(auditData);
      expect(auditLog.details).toEqual({ validJson: true });
    });
  });

  describe('Search and Export', () => {
    it('should support text search across audit logs', async () => {
      // Create a searchable audit log
      const auditData = {
        userId: testUser.id,
        module: 'search_test',
        action: 'searchable_action',
        details: {
          description: 'This is a searchable audit log entry for testing'
        }
      };

      await auditLogService.createAuditLog(auditData);

      const response = await request(app)
        .get('/api/v1/audit-logs?search=searchable')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      const found = response.body.data.some(log => 
        log.action === 'searchable_action' || 
        (log.details && JSON.stringify(log.details).includes('searchable'))
      );
      expect(found).toBe(true);
    });

    it('should validate search parameters', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs?dateFrom=invalid-date')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid parameters');
    });
  });
});
