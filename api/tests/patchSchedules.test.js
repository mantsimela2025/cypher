const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/db');
const { users, patches, patchSchedules, patchJobs } = require('../src/db/schema');
const jwt = require('jsonwebtoken');

describe('Patch Schedules Service Tests', () => {
  let authToken;
  let adminToken;
  let testUser;
  let testAdmin;
  let testPatch;
  let testSchedule;

  beforeAll(async () => {
    // Create test admin user
    const [admin] = await db.insert(users)
      .values({
        firstName: 'Test',
        lastName: 'Admin',
        email: 'patchsched.admin@example.com',
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
        email: 'patchsched.user@example.com',
        password: 'hashedpassword',
        role: 'user',
        status: 'active'
      })
      .returning();

    testUser = user;

    // Create a test patch
    const [patch] = await db.insert(patches)
      .values({
        title: 'Test Patch for Scheduling',
        patchId: 'KB999002',
        description: 'Test patch for schedule testing',
        severity: 'medium',
        category: 'feature',
        vendor: 'Microsoft',
        status: 'approved',
        releaseDate: new Date('2024-01-15'),
        createdBy: admin.id
      })
      .returning();

    testPatch = patch;

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
    if (testSchedule) {
      await db.delete(patchJobs).where({ scheduleId: testSchedule.id });
      await db.delete(patchSchedules).where({ id: testSchedule.id });
    }
    if (testPatch) {
      await db.delete(patches).where({ id: testPatch.id });
    }
    await db.delete(users).where({ id: testAdmin.id });
    await db.delete(users).where({ id: testUser.id });
  });

  describe('Patch Schedule CRUD Operations', () => {
    describe('POST /api/v1/patch-schedules', () => {
      it('should create a new patch schedule with valid data', async () => {
        const scheduleData = {
          name: 'Monthly Security Patch Schedule',
          description: 'Automated monthly deployment of security patches',
          patchIds: [testPatch.id],
          cronExpression: '0 2 1 * *', // At 02:00 on day-of-month 1
          timezone: 'America/New_York',
          enabled: true,
          maxConcurrency: 3,
          executionSettings: {
            timeout: 7200,
            retryCount: 2,
            retryDelay: 600,
            rollbackOnFailure: true
          },
          maintenanceWindow: {
            startTime: '02:00',
            endTime: '06:00',
            allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
          },
          notification: {
            onStart: true,
            onComplete: true,
            onError: true,
            recipients: ['admin@example.com', 'ops@example.com']
          }
        };

        const response = await request(app)
          .post('/api/v1/patch-schedules')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(scheduleData)
          .expect(201);

        expect(response.body).toHaveProperty('message', 'Patch schedule created successfully');
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('name', 'Monthly Security Patch Schedule');
        expect(response.body.data).toHaveProperty('cronExpression', '0 2 1 * *');
        expect(response.body.data).toHaveProperty('enabled', true);
        expect(response.body.data).toHaveProperty('maxConcurrency', 3);

        testSchedule = response.body.data;
      });

      it('should validate required fields', async () => {
        const scheduleData = {
          description: 'Missing name and cron expression'
        };

        const response = await request(app)
          .post('/api/v1/patch-schedules')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(scheduleData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
        expect(response.body).toHaveProperty('details');
      });

      it('should validate cron expression format', async () => {
        const scheduleData = {
          name: 'Invalid Cron Schedule',
          cronExpression: 'invalid-cron',
          patchIds: [testPatch.id]
        };

        const response = await request(app)
          .post('/api/v1/patch-schedules')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(scheduleData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should validate timezone format', async () => {
        const scheduleData = {
          name: 'Invalid Timezone Schedule',
          cronExpression: '0 2 * * *',
          timezone: 'Invalid/Timezone',
          patchIds: [testPatch.id]
        };

        const response = await request(app)
          .post('/api/v1/patch-schedules')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(scheduleData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should validate maintenance window times', async () => {
        const scheduleData = {
          name: 'Invalid Window Schedule',
          cronExpression: '0 2 * * *',
          patchIds: [testPatch.id],
          maintenanceWindow: {
            startTime: '25:00', // Invalid time
            endTime: '06:00'
          }
        };

        const response = await request(app)
          .post('/api/v1/patch-schedules')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(scheduleData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should validate allowed days enum', async () => {
        const scheduleData = {
          name: 'Invalid Days Schedule',
          cronExpression: '0 2 * * *',
          patchIds: [testPatch.id],
          maintenanceWindow: {
            allowedDays: ['invalid_day']
          }
        };

        const response = await request(app)
          .post('/api/v1/patch-schedules')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(scheduleData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should validate patch IDs array', async () => {
        const scheduleData = {
          name: 'Empty Patches Schedule',
          cronExpression: '0 2 * * *',
          patchIds: []
        };

        const response = await request(app)
          .post('/api/v1/patch-schedules')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(scheduleData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should require appropriate permissions', async () => {
        const scheduleData = {
          name: 'Unauthorized Schedule',
          cronExpression: '0 2 * * *',
          patchIds: [testPatch.id]
        };

        await request(app)
          .post('/api/v1/patch-schedules')
          .set('Authorization', `Bearer ${authToken}`)
          .send(scheduleData)
          .expect(403);
      });
    });

    describe('GET /api/v1/patch-schedules', () => {
      it('should return list of patch schedules with pagination', async () => {
        const response = await request(app)
          .get('/api/v1/patch-schedules')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch schedules retrieved successfully');
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should support filtering by enabled status', async () => {
        const response = await request(app)
          .get('/api/v1/patch-schedules?enabled=true')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        if (response.body.data.length > 0) {
          response.body.data.forEach(schedule => {
            expect(schedule.enabled).toBe(true);
          });
        }
      });

      it('should support filtering by timezone', async () => {
        const response = await request(app)
          .get('/api/v1/patch-schedules?timezone=America/New_York')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        if (response.body.data.length > 0) {
          response.body.data.forEach(schedule => {
            expect(schedule.timezone).toBe('America/New_York');
          });
        }
      });

      it('should support search functionality', async () => {
        const response = await request(app)
          .get('/api/v1/patch-schedules?search=Monthly Security')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.length).toBeGreaterThan(0);
        const found = response.body.data.some(schedule => 
          schedule.name.includes('Monthly Security') || 
          schedule.description.includes('Monthly Security')
        );
        expect(found).toBe(true);
      });

      it('should support pagination parameters', async () => {
        const response = await request(app)
          .get('/api/v1/patch-schedules?page=1&limit=5')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.pagination).toHaveProperty('page', 1);
        expect(response.body.pagination).toHaveProperty('limit', 5);
        expect(response.body.data.length).toBeLessThanOrEqual(5);
      });

      it('should support sorting by next execution time', async () => {
        const response = await request(app)
          .get('/api/v1/patch-schedules?sortBy=nextExecution&sortOrder=asc')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        if (response.body.data.length > 1) {
          const nextExecutions = response.body.data
            .filter(schedule => schedule.nextExecution)
            .map(schedule => new Date(schedule.nextExecution));
          
          for (let i = 1; i < nextExecutions.length; i++) {
            expect(nextExecutions[i-1] <= nextExecutions[i]).toBe(true);
          }
        }
      });
    });

    describe('GET /api/v1/patch-schedules/:id', () => {
      it('should return patch schedule by ID', async () => {
        const response = await request(app)
          .get(`/api/v1/patch-schedules/${testSchedule.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch schedule retrieved successfully');
        expect(response.body.data).toHaveProperty('id', testSchedule.id);
        expect(response.body.data).toHaveProperty('name', 'Monthly Security Patch Schedule');
      });

      it('should return 404 for non-existent schedule', async () => {
        const response = await request(app)
          .get('/api/v1/patch-schedules/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body).toHaveProperty('error', 'Not found');
      });

      it('should validate ID parameter as number', async () => {
        const response = await request(app)
          .get('/api/v1/patch-schedules/invalid-id')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });
    });

    describe('PUT /api/v1/patch-schedules/:id', () => {
      it('should update patch schedule with valid data', async () => {
        const updateData = {
          description: 'Updated automated patch deployment schedule',
          maxConcurrency: 5,
          enabled: false
        };

        const response = await request(app)
          .put(`/api/v1/patch-schedules/${testSchedule.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch schedule updated successfully');
        expect(response.body.data).toHaveProperty('description', 'Updated automated patch deployment schedule');
        expect(response.body.data).toHaveProperty('maxConcurrency', 5);
        expect(response.body.data).toHaveProperty('enabled', false);
      });

      it('should validate cron expression on update', async () => {
        const updateData = {
          cronExpression: 'invalid-cron-update'
        };

        const response = await request(app)
          .put(`/api/v1/patch-schedules/${testSchedule.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should require appropriate permissions', async () => {
        const updateData = {
          description: 'Unauthorized update'
        };

        await request(app)
          .put(`/api/v1/patch-schedules/${testSchedule.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(403);
      });

      it('should return 404 for non-existent schedule', async () => {
        const updateData = {
          description: 'Update non-existent schedule'
        };

        const response = await request(app)
          .put('/api/v1/patch-schedules/99999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(404);

        expect(response.body).toHaveProperty('error', 'Not found');
      });
    });
  });

  describe('Schedule Management Operations', () => {
    describe('POST /api/v1/patch-schedules/:id/enable', () => {
      it('should enable disabled schedule', async () => {
        const response = await request(app)
          .post(`/api/v1/patch-schedules/${testSchedule.id}/enable`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch schedule enabled successfully');
        expect(response.body.data).toHaveProperty('enabled', true);
        expect(response.body.data).toHaveProperty('nextExecution');
      });

      it('should require appropriate permissions', async () => {
        await request(app)
          .post(`/api/v1/patch-schedules/${testSchedule.id}/enable`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });
    });

    describe('POST /api/v1/patch-schedules/:id/disable', () => {
      it('should disable enabled schedule', async () => {
        const response = await request(app)
          .post(`/api/v1/patch-schedules/${testSchedule.id}/disable`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch schedule disabled successfully');
        expect(response.body.data).toHaveProperty('enabled', false);
      });

      it('should require appropriate permissions', async () => {
        await request(app)
          .post(`/api/v1/patch-schedules/${testSchedule.id}/disable`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });
    });

    describe('POST /api/v1/patch-schedules/:id/trigger', () => {
      it('should manually trigger schedule execution', async () => {
        const response = await request(app)
          .post(`/api/v1/patch-schedules/${testSchedule.id}/trigger`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch schedule triggered successfully');
        expect(response.body.data).toHaveProperty('jobId');
        expect(response.body.data).toHaveProperty('scheduledFor');
      });

      it('should require appropriate permissions', async () => {
        await request(app)
          .post(`/api/v1/patch-schedules/${testSchedule.id}/trigger`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });

      it('should prevent triggering disabled schedules', async () => {
        // First disable the schedule
        await request(app)
          .post(`/api/v1/patch-schedules/${testSchedule.id}/disable`)
          .set('Authorization', `Bearer ${adminToken}`);

        const response = await request(app)
          .post(`/api/v1/patch-schedules/${testSchedule.id}/trigger`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });
    });

    describe('GET /api/v1/patch-schedules/:id/next-executions', () => {
      it('should return next scheduled executions', async () => {
        // Re-enable schedule for this test
        await request(app)
          .post(`/api/v1/patch-schedules/${testSchedule.id}/enable`)
          .set('Authorization', `Bearer ${adminToken}`);

        const response = await request(app)
          .get(`/api/v1/patch-schedules/${testSchedule.id}/next-executions?count=5`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Next executions retrieved successfully');
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeLessThanOrEqual(5);
      });

      it('should validate count parameter', async () => {
        const response = await request(app)
          .get(`/api/v1/patch-schedules/${testSchedule.id}/next-executions?count=invalid`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });
    });

    describe('GET /api/v1/patch-schedules/:id/history', () => {
      it('should return schedule execution history', async () => {
        const response = await request(app)
          .get(`/api/v1/patch-schedules/${testSchedule.id}/history`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Schedule history retrieved successfully');
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should support status filtering in history', async () => {
        const response = await request(app)
          .get(`/api/v1/patch-schedules/${testSchedule.id}/history?status=completed`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        if (response.body.data.length > 0) {
          response.body.data.forEach(execution => {
            expect(execution.status).toBe('completed');
          });
        }
      });
    });
  });

  describe('Cron Expression Validation', () => {
    describe('POST /api/v1/patch-schedules/validate-cron', () => {
      it('should validate valid cron expressions', async () => {
        const cronData = {
          cronExpression: '0 2 * * 1', // Every Monday at 2 AM
          timezone: 'America/New_York'
        };

        const response = await request(app)
          .post('/api/v1/patch-schedules/validate-cron')
          .set('Authorization', `Bearer ${authToken}`)
          .send(cronData)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Cron expression is valid');
        expect(response.body.data).toHaveProperty('valid', true);
        expect(response.body.data).toHaveProperty('nextExecution');
        expect(response.body.data).toHaveProperty('description');
      });

      it('should reject invalid cron expressions', async () => {
        const cronData = {
          cronExpression: 'invalid cron'
        };

        const response = await request(app)
          .post('/api/v1/patch-schedules/validate-cron')
          .set('Authorization', `Bearer ${authToken}`)
          .send(cronData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should validate timezone with cron expression', async () => {
        const cronData = {
          cronExpression: '0 2 * * *',
          timezone: 'Invalid/Timezone'
        };

        const response = await request(app)
          .post('/api/v1/patch-schedules/validate-cron')
          .set('Authorization', `Bearer ${authToken}`)
          .send(cronData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });
    });
  });

  describe('Schedule Analytics', () => {
    describe('GET /api/v1/patch-schedules/analytics/overview', () => {
      it('should return schedule analytics overview', async () => {
        const response = await request(app)
          .get('/api/v1/patch-schedules/analytics/overview')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Schedule analytics retrieved successfully');
        expect(response.body.data).toHaveProperty('totalSchedules');
        expect(response.body.data).toHaveProperty('activeSchedules');
        expect(response.body.data).toHaveProperty('schedulesByTimezone');
        expect(response.body.data).toHaveProperty('upcomingExecutions');
      });
    });

    describe('GET /api/v1/patch-schedules/analytics/performance', () => {
      it('should return schedule performance metrics', async () => {
        const response = await request(app)
          .get('/api/v1/patch-schedules/analytics/performance')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Performance metrics retrieved successfully');
        expect(response.body.data).toHaveProperty('executionSuccess');
        expect(response.body.data).toHaveProperty('averageExecutionTime');
        expect(response.body.data).toHaveProperty('scheduleReliability');
      });
    });
  });

  describe('Security and Permissions', () => {
    it('should require authentication for all endpoints', async () => {
      await request(app)
        .get('/api/v1/patch-schedules')
        .expect(401);

      await request(app)
        .post('/api/v1/patch-schedules')
        .send({ name: 'Test' })
        .expect(401);
    });

    it('should enforce role-based permissions for management operations', async () => {
      // Regular user should not be able to create schedules
      await request(app)
        .post('/api/v1/patch-schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Unauthorized Schedule',
          cronExpression: '0 2 * * *',
          patchIds: [testPatch.id]
        })
        .expect(403);

      // Regular user should not be able to enable/disable schedules
      await request(app)
        .post(`/api/v1/patch-schedules/${testSchedule.id}/enable`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid schedule ID gracefully', async () => {
      await request(app)
        .get('/api/v1/patch-schedules/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should validate request data thoroughly', async () => {
      const invalidData = {
        name: '', // Empty name
        cronExpression: '', // Empty cron
        patchIds: [], // Empty array
        maxConcurrency: -1 // Invalid number
      };

      const response = await request(app)
        .post('/api/v1/patch-schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
      expect(response.body).toHaveProperty('details');
    });

    it('should handle complex cron validation edge cases', async () => {
      const edgeCases = [
        '60 2 * * *', // Invalid minute (>59)
        '0 25 * * *', // Invalid hour (>23)
        '0 2 32 * *', // Invalid day (>31)
        '0 2 * 13 *', // Invalid month (>12)
        '0 2 * * 8'   // Invalid day of week (>7)
      ];

      for (const cronExpression of edgeCases) {
        const response = await request(app)
          .post('/api/v1/patch-schedules/validate-cron')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ cronExpression })
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      }
    });
  });
});