const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/db');
const { users, notifications } = require('../src/db/schema');
const jwt = require('jsonwebtoken');
const notificationService = require('../src/services/notificationService');

describe('Notification Service Tests', () => {
  let authToken;
  let adminToken;
  let testUser;
  let testAdmin;
  let testNotification;

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
    await db.delete(notifications).where({ userId: testAdmin.id });
    await db.delete(notifications).where({ userId: testUser.id });
    await db.delete(users).where({ id: testAdmin.id });
    await db.delete(users).where({ id: testUser.id });
  });

  describe('Notification Creation (Service Level)', () => {
    it('should create notification with all required fields', async () => {
      const notificationData = {
        userId: testUser.id,
        title: 'Test Notification',
        message: 'This is a test notification message',
        type: 'info',
        module: 'test',
        eventType: 'test_event',
        relatedId: 123,
        relatedType: 'test_resource',
        metadata: {
          source: 'unit_test',
          priority: 'normal'
        }
      };

      const notification = await notificationService.createNotification(notificationData);

      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('userId', testUser.id);
      expect(notification).toHaveProperty('title', 'Test Notification');
      expect(notification).toHaveProperty('message', 'This is a test notification message');
      expect(notification).toHaveProperty('type', 'info');
      expect(notification).toHaveProperty('isRead', false);
      expect(notification.metadata).toHaveProperty('source', 'unit_test');

      testNotification = notification;
    });

    it('should create notification with minimal required fields', async () => {
      const notificationData = {
        userId: testUser.id,
        title: 'Minimal Notification',
        message: 'Minimal message',
        type: 'info'
      };

      const notification = await notificationService.createNotification(notificationData);

      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('userId', testUser.id);
      expect(notification).toHaveProperty('title', 'Minimal Notification');
      expect(notification).toHaveProperty('isRead', false);
    });

    it('should validate notification types', async () => {
      const notificationData = {
        userId: testUser.id,
        title: 'Invalid Type Test',
        message: 'Testing invalid type',
        type: 'invalid_type'
      };

      await expect(notificationService.createNotification(notificationData))
        .rejects
        .toThrow();
    });

    it('should handle different notification types', async () => {
      const types = ['info', 'success', 'warning', 'error'];
      
      for (const type of types) {
        const notificationData = {
          userId: testUser.id,
          title: `${type} Notification`,
          message: `This is a ${type} notification`,
          type: type
        };

        const notification = await notificationService.createNotification(notificationData);
        expect(notification).toHaveProperty('type', type);
      }
    });
  });

  describe('GET /api/v1/notifications', () => {
    it('should return user notifications', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Notifications retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter notifications by type', async () => {
      const response = await request(app)
        .get('/api/v1/notifications?type=info')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.data.forEach(notification => {
        expect(notification.type).toBe('info');
      });
    });

    it('should filter notifications by read status', async () => {
      const response = await request(app)
        .get('/api/v1/notifications?isRead=false')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.data.forEach(notification => {
        expect(notification.isRead).toBe(false);
      });
    });

    it('should filter notifications by module', async () => {
      const response = await request(app)
        .get('/api/v1/notifications?module=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.data.forEach(notification => {
        expect(notification.module).toBe('test');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/notifications?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/api/v1/notifications?sortBy=createdAt&sortOrder=desc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.data.length > 1) {
        const firstDate = new Date(response.body.data[0].createdAt);
        const secondDate = new Date(response.body.data[1].createdAt);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });

    it('should only return notifications for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.data.forEach(notification => {
        expect(notification.userId).toBe(testUser.id);
      });
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/notifications')
        .expect(401);
    });
  });

  describe('GET /api/v1/notifications/:id', () => {
    it('should return specific notification by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/notifications/${testNotification.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Notification retrieved successfully');
      expect(response.body.data).toHaveProperty('id', testNotification.id);
      expect(response.body.data).toHaveProperty('title', 'Test Notification');
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not found');
    });

    it('should prevent access to other users notifications', async () => {
      // Create notification for admin
      const adminNotification = await notificationService.createNotification({
        userId: testAdmin.id,
        title: 'Admin Only',
        message: 'This is for admin only',
        type: 'info'
      });

      // Try to access with regular user token
      const response = await request(app)
        .get(`/api/v1/notifications/${adminNotification.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not found');
    });
  });

  describe('PUT /api/v1/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const response = await request(app)
        .put(`/api/v1/notifications/${testNotification.id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Notification marked as read');
      expect(response.body.data).toHaveProperty('isRead', true);
      expect(response.body.data).toHaveProperty('readAt');
    });

    it('should handle already read notifications', async () => {
      // Mark as read again
      const response = await request(app)
        .put(`/api/v1/notifications/${testNotification.id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('isRead', true);
    });

    it('should prevent marking other users notifications as read', async () => {
      // Create notification for admin
      const adminNotification = await notificationService.createNotification({
        userId: testAdmin.id,
        title: 'Admin Notification',
        message: 'Admin message',
        type: 'info'
      });

      // Try to mark as read with regular user token
      await request(app)
        .put(`/api/v1/notifications/${adminNotification.id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/notifications/:id/unread', () => {
    it('should mark notification as unread', async () => {
      const response = await request(app)
        .put(`/api/v1/notifications/${testNotification.id}/unread`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Notification marked as unread');
      expect(response.body.data).toHaveProperty('isRead', false);
      expect(response.body.data.readAt).toBeNull();
    });
  });

  describe('PUT /api/v1/notifications/mark-all-read', () => {
    beforeEach(async () => {
      // Create multiple unread notifications
      await notificationService.createNotification({
        userId: testUser.id,
        title: 'Unread 1',
        message: 'Message 1',
        type: 'info'
      });

      await notificationService.createNotification({
        userId: testUser.id,
        title: 'Unread 2',
        message: 'Message 2',
        type: 'info'
      });
    });

    it('should mark all user notifications as read', async () => {
      const response = await request(app)
        .put('/api/v1/notifications/mark-all-read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('updatedCount');
      expect(response.body.data.updatedCount).toBeGreaterThan(0);

      // Verify all notifications are read
      const notificationsResponse = await request(app)
        .get('/api/v1/notifications?isRead=false')
        .set('Authorization', `Bearer ${authToken}`);

      expect(notificationsResponse.body.data.length).toBe(0);
    });
  });

  describe('DELETE /api/v1/notifications/:id', () => {
    it('should delete notification', async () => {
      // Create a notification to delete
      const notificationToDelete = await notificationService.createNotification({
        userId: testUser.id,
        title: 'To Delete',
        message: 'This will be deleted',
        type: 'info'
      });

      const response = await request(app)
        .delete(`/api/v1/notifications/${notificationToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Notification deleted successfully');

      // Verify notification is deleted
      await request(app)
        .get(`/api/v1/notifications/${notificationToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should prevent deleting other users notifications', async () => {
      // Create notification for admin
      const adminNotification = await notificationService.createNotification({
        userId: testAdmin.id,
        title: 'Admin Notification',
        message: 'Admin message',
        type: 'info'
      });

      // Try to delete with regular user token
      await request(app)
        .delete(`/api/v1/notifications/${adminNotification.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/notifications/statistics', () => {
    it('should return notification statistics for user', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Notification statistics retrieved successfully');
      expect(response.body.data).toHaveProperty('totalNotifications');
      expect(response.body.data).toHaveProperty('unreadCount');
      expect(response.body.data).toHaveProperty('readCount');
      expect(response.body.data).toHaveProperty('typeBreakdown');
      expect(response.body.data).toHaveProperty('moduleBreakdown');

      expect(Array.isArray(response.body.data.typeBreakdown)).toBe(true);
      expect(Array.isArray(response.body.data.moduleBreakdown)).toBe(true);
    });
  });

  describe('Bulk Operations', () => {
    describe('POST /api/v1/notifications/bulk-actions', () => {
      let bulkNotifications = [];

      beforeEach(async () => {
        // Create notifications for bulk operations
        for (let i = 0; i < 3; i++) {
          const notification = await notificationService.createNotification({
            userId: testUser.id,
            title: `Bulk Test ${i}`,
            message: `Bulk message ${i}`,
            type: 'info'
          });
          bulkNotifications.push(notification);
        }
      });

      afterEach(async () => {
        bulkNotifications = [];
      });

      it('should mark multiple notifications as read', async () => {
        const notificationIds = bulkNotifications.map(n => n.id);

        const response = await request(app)
          .post('/api/v1/notifications/bulk-actions')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            action: 'mark_read',
            notificationIds: notificationIds
          })
          .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(response.body.data).toHaveProperty('updatedCount', notificationIds.length);
      });

      it('should delete multiple notifications', async () => {
        const notificationIds = bulkNotifications.map(n => n.id);

        const response = await request(app)
          .post('/api/v1/notifications/bulk-actions')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            action: 'delete',
            notificationIds: notificationIds
          })
          .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(response.body.data).toHaveProperty('deletedCount', notificationIds.length);
      });

      it('should validate bulk action parameters', async () => {
        const response = await request(app)
          .post('/api/v1/notifications/bulk-actions')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            action: 'invalid_action',
            notificationIds: [1, 2, 3]
          })
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });
    });
  });

  describe('Real-time Features', () => {
    it('should handle high-volume notification creation', async () => {
      const startTime = Date.now();
      const promises = [];

      // Create 20 notifications concurrently
      for (let i = 0; i < 20; i++) {
        const notificationData = {
          userId: testUser.id,
          title: `Performance Test ${i}`,
          message: `Performance message ${i}`,
          type: 'info',
          module: 'performance_test'
        };
        promises.push(notificationService.createNotification(notificationData));
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds

      // Clean up
      await db.delete(notifications).where({ module: 'performance_test' });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid notification ID gracefully', async () => {
      await request(app)
        .get('/api/v1/notifications/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should handle missing required fields', async () => {
      const notificationData = {
        userId: testUser.id,
        // Missing title and message
        type: 'info'
      };

      await expect(notificationService.createNotification(notificationData))
        .rejects
        .toThrow();
    });

    it('should handle invalid user ID', async () => {
      const notificationData = {
        userId: 99999, // Non-existent user
        title: 'Invalid User',
        message: 'This should fail',
        type: 'info'
      };

      await expect(notificationService.createNotification(notificationData))
        .rejects
        .toThrow();
    });
  });
});
