const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/db');
const { users, patches, patchJobs, patchJobTargets, patchJobLogs, patchJobDependencies } = require('../src/db/schema');
const jwt = require('jsonwebtoken');

describe('Patch Jobs Service Tests', () => {
  let authToken;
  let adminToken;
  let testUser;
  let testAdmin;
  let testPatch;
  let testJob;

  beforeAll(async () => {
    // Create test admin user
    const [admin] = await db.insert(users)
      .values({
        firstName: 'Test',
        lastName: 'Admin',
        email: 'patchjob.admin@example.com',
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
        email: 'patchjob.user@example.com',
        password: 'hashedpassword',
        role: 'user',
        status: 'active'
      })
      .returning();

    testUser = user;

    // Create a test patch
    const [patch] = await db.insert(patches)
      .values({
        title: 'Test Patch for Jobs',
        patchId: 'KB999001',
        description: 'Test patch for job testing',
        severity: 'high',
        category: 'security',
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
    if (testJob) {
      await db.delete(patchJobDependencies).where({ jobId: testJob.id });
      await db.delete(patchJobLogs).where({ jobId: testJob.id });
      await db.delete(patchJobTargets).where({ jobId: testJob.id });
      await db.delete(patchJobs).where({ id: testJob.id });
    }
    if (testPatch) {
      await db.delete(patches).where({ id: testPatch.id });
    }
    await db.delete(users).where({ id: testAdmin.id });
    await db.delete(users).where({ id: testUser.id });
  });

  describe('Patch Job CRUD Operations', () => {
    describe('POST /api/v1/patch-jobs', () => {
      it('should create a new patch job with valid data', async () => {
        const jobData = {
          name: 'Test Security Patch Job',
          description: 'Deploy critical security patches to production servers',
          patchIds: [testPatch.id],
          targetAssets: ['asset-uuid-1', 'asset-uuid-2'],
          executionType: 'manual',
          maxConcurrency: 5,
          rollbackOnFailure: true,
          notification: {
            onStart: true,
            onComplete: true,
            onError: true,
            recipients: ['admin@example.com']
          },
          executionSettings: {
            timeout: 3600,
            retryCount: 3,
            retryDelay: 300,
            preExecutionScript: 'echo "Starting patch deployment"',
            postExecutionScript: 'echo "Patch deployment completed"'
          }
        };

        const response = await request(app)
          .post('/api/v1/patch-jobs')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(jobData)
          .expect(201);

        expect(response.body).toHaveProperty('message', 'Patch job created successfully');
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('name', 'Test Security Patch Job');
        expect(response.body.data).toHaveProperty('status', 'pending');
        expect(response.body.data).toHaveProperty('executionType', 'manual');
        expect(response.body.data).toHaveProperty('maxConcurrency', 5);

        testJob = response.body.data;
      });

      it('should validate required fields', async () => {
        const jobData = {
          description: 'Missing name and patches'
        };

        const response = await request(app)
          .post('/api/v1/patch-jobs')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(jobData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
        expect(response.body).toHaveProperty('details');
      });

      it('should validate execution type enum', async () => {
        const jobData = {
          name: 'Invalid Job',
          patchIds: [testPatch.id],
          executionType: 'invalid-type'
        };

        const response = await request(app)
          .post('/api/v1/patch-jobs')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(jobData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should validate max concurrency as positive number', async () => {
        const jobData = {
          name: 'Invalid Concurrency Job',
          patchIds: [testPatch.id],
          maxConcurrency: -1
        };

        const response = await request(app)
          .post('/api/v1/patch-jobs')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(jobData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should validate patch IDs array', async () => {
        const jobData = {
          name: 'Empty Patches Job',
          patchIds: []
        };

        const response = await request(app)
          .post('/api/v1/patch-jobs')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(jobData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should require appropriate permissions', async () => {
        const jobData = {
          name: 'Unauthorized Job',
          patchIds: [testPatch.id]
        };

        await request(app)
          .post('/api/v1/patch-jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .send(jobData)
          .expect(403);
      });
    });

    describe('GET /api/v1/patch-jobs', () => {
      it('should return list of patch jobs with pagination', async () => {
        const response = await request(app)
          .get('/api/v1/patch-jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch jobs retrieved successfully');
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should support filtering by status', async () => {
        const response = await request(app)
          .get('/api/v1/patch-jobs?status=pending')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        if (response.body.data.length > 0) {
          response.body.data.forEach(job => {
            expect(job.status).toBe('pending');
          });
        }
      });

      it('should support filtering by execution type', async () => {
        const response = await request(app)
          .get('/api/v1/patch-jobs?executionType=manual')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        if (response.body.data.length > 0) {
          response.body.data.forEach(job => {
            expect(job.executionType).toBe('manual');
          });
        }
      });

      it('should support search functionality', async () => {
        const response = await request(app)
          .get('/api/v1/patch-jobs?search=Test Security')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.length).toBeGreaterThan(0);
        const found = response.body.data.some(job => 
          job.name.includes('Test Security') || 
          job.description.includes('Test Security')
        );
        expect(found).toBe(true);
      });

      it('should support pagination parameters', async () => {
        const response = await request(app)
          .get('/api/v1/patch-jobs?page=1&limit=5')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.pagination).toHaveProperty('page', 1);
        expect(response.body.pagination).toHaveProperty('limit', 5);
        expect(response.body.data.length).toBeLessThanOrEqual(5);
      });

      it('should support sorting by creation date', async () => {
        const response = await request(app)
          .get('/api/v1/patch-jobs?sortBy=createdAt&sortOrder=desc')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        if (response.body.data.length > 1) {
          const dates = response.body.data.map(job => new Date(job.createdAt));
          for (let i = 1; i < dates.length; i++) {
            expect(dates[i-1] >= dates[i]).toBe(true);
          }
        }
      });
    });

    describe('GET /api/v1/patch-jobs/:id', () => {
      it('should return patch job by ID', async () => {
        const response = await request(app)
          .get(`/api/v1/patch-jobs/${testJob.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch job retrieved successfully');
        expect(response.body.data).toHaveProperty('id', testJob.id);
        expect(response.body.data).toHaveProperty('name', 'Test Security Patch Job');
      });

      it('should return 404 for non-existent job', async () => {
        const response = await request(app)
          .get('/api/v1/patch-jobs/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body).toHaveProperty('error', 'Not found');
      });

      it('should validate ID parameter as number', async () => {
        const response = await request(app)
          .get('/api/v1/patch-jobs/invalid-id')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });
    });

    describe('PUT /api/v1/patch-jobs/:id', () => {
      it('should update patch job with valid data', async () => {
        const updateData = {
          description: 'Updated patch job description',
          maxConcurrency: 10
        };

        const response = await request(app)
          .put(`/api/v1/patch-jobs/${testJob.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch job updated successfully');
        expect(response.body.data).toHaveProperty('description', 'Updated patch job description');
        expect(response.body.data).toHaveProperty('maxConcurrency', 10);
      });

      it('should validate update data', async () => {
        const updateData = {
          status: 'invalid-status'
        };

        const response = await request(app)
          .put(`/api/v1/patch-jobs/${testJob.id}`)
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
          .put(`/api/v1/patch-jobs/${testJob.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(403);
      });

      it('should prevent updating running jobs', async () => {
        // First update job to running status
        await db.update(patchJobs)
          .set({ status: 'running' })
          .where({ id: testJob.id });

        const updateData = {
          description: 'Should not update running job'
        };

        const response = await request(app)
          .put(`/api/v1/patch-jobs/${testJob.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(409);

        expect(response.body).toHaveProperty('error', 'Conflict');

        // Reset status for other tests
        await db.update(patchJobs)
          .set({ status: 'pending' })
          .where({ id: testJob.id });
      });
    });
  });

  describe('Patch Job Execution', () => {
    describe('POST /api/v1/patch-jobs/:id/execute', () => {
      it('should start job execution with admin privileges', async () => {
        const response = await request(app)
          .post(`/api/v1/patch-jobs/${testJob.id}/execute`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch job execution started');
        expect(response.body.data).toHaveProperty('status', 'running');
        expect(response.body.data).toHaveProperty('startedAt');
      });

      it('should prevent duplicate executions', async () => {
        const response = await request(app)
          .post(`/api/v1/patch-jobs/${testJob.id}/execute`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(409);

        expect(response.body).toHaveProperty('error', 'Conflict');
      });

      it('should require appropriate permissions', async () => {
        await request(app)
          .post(`/api/v1/patch-jobs/${testJob.id}/execute`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });
    });

    describe('POST /api/v1/patch-jobs/:id/cancel', () => {
      it('should cancel running job', async () => {
        const response = await request(app)
          .post(`/api/v1/patch-jobs/${testJob.id}/cancel`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch job cancelled');
        expect(response.body.data).toHaveProperty('status', 'cancelled');
      });

      it('should require appropriate permissions', async () => {
        await request(app)
          .post(`/api/v1/patch-jobs/${testJob.id}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });
    });

    describe('POST /api/v1/patch-jobs/:id/retry', () => {
      it('should retry failed job', async () => {
        // First set job to failed status
        await db.update(patchJobs)
          .set({ status: 'failed' })
          .where({ id: testJob.id });

        const response = await request(app)
          .post(`/api/v1/patch-jobs/${testJob.id}/retry`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch job retry initiated');
        expect(response.body.data).toHaveProperty('status', 'pending');
      });

      it('should prevent retrying non-failed jobs', async () => {
        const response = await request(app)
          .post(`/api/v1/patch-jobs/${testJob.id}/retry`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });
    });

    describe('POST /api/v1/patch-jobs/:id/rollback', () => {
      it('should rollback completed job', async () => {
        // First set job to completed status
        await db.update(patchJobs)
          .set({ status: 'completed' })
          .where({ id: testJob.id });

        const response = await request(app)
          .post(`/api/v1/patch-jobs/${testJob.id}/rollback`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch job rollback initiated');
        expect(response.body.data).toHaveProperty('status', 'rolling_back');
      });

      it('should require appropriate permissions', async () => {
        await request(app)
          .post(`/api/v1/patch-jobs/${testJob.id}/rollback`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });
    });
  });

  describe('Patch Job Status and Progress', () => {
    describe('GET /api/v1/patch-jobs/:id/status', () => {
      it('should return job status and progress', async () => {
        const response = await request(app)
          .get(`/api/v1/patch-jobs/${testJob.id}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch job status retrieved successfully');
        expect(response.body.data).toHaveProperty('status');
        expect(response.body.data).toHaveProperty('progress');
        expect(response.body.data).toHaveProperty('statistics');
      });
    });

    describe('GET /api/v1/patch-jobs/:id/logs', () => {
      it('should return job execution logs', async () => {
        const response = await request(app)
          .get(`/api/v1/patch-jobs/${testJob.id}/logs`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch job logs retrieved successfully');
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should support log level filtering', async () => {
        const response = await request(app)
          .get(`/api/v1/patch-jobs/${testJob.id}/logs?level=error`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        if (response.body.data.length > 0) {
          response.body.data.forEach(log => {
            expect(log.level).toBe('error');
          });
        }
      });

      it('should support pagination for logs', async () => {
        const response = await request(app)
          .get(`/api/v1/patch-jobs/${testJob.id}/logs?page=1&limit=10`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('pagination');
        expect(response.body.data.length).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Job Analytics', () => {
    describe('GET /api/v1/patch-jobs/analytics/overview', () => {
      it('should return job analytics overview', async () => {
        const response = await request(app)
          .get('/api/v1/patch-jobs/analytics/overview')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch job analytics retrieved successfully');
        expect(response.body.data).toHaveProperty('totalJobs');
        expect(response.body.data).toHaveProperty('jobsByStatus');
        expect(response.body.data).toHaveProperty('successRate');
        expect(response.body.data).toHaveProperty('averageExecutionTime');
      });
    });

    describe('GET /api/v1/patch-jobs/analytics/performance', () => {
      it('should return performance metrics', async () => {
        const response = await request(app)
          .get('/api/v1/patch-jobs/analytics/performance')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Performance metrics retrieved successfully');
        expect(response.body.data).toHaveProperty('executionTrends');
        expect(response.body.data).toHaveProperty('failureAnalysis');
        expect(response.body.data).toHaveProperty('resourceUtilization');
      });
    });
  });

  describe('Security and Permissions', () => {
    it('should require authentication for all endpoints', async () => {
      await request(app)
        .get('/api/v1/patch-jobs')
        .expect(401);

      await request(app)
        .post('/api/v1/patch-jobs')
        .send({ name: 'Test' })
        .expect(401);
    });

    it('should enforce role-based permissions for execution operations', async () => {
      // Regular user should not be able to execute jobs
      await request(app)
        .post(`/api/v1/patch-jobs/${testJob.id}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      // Regular user should not be able to cancel jobs
      await request(app)
        .post(`/api/v1/patch-jobs/${testJob.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid job ID gracefully', async () => {
      await request(app)
        .get('/api/v1/patch-jobs/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should validate request data thoroughly', async () => {
      const invalidData = {
        name: '', // Empty name
        patchIds: [], // Empty array
        maxConcurrency: -1, // Invalid number
        executionType: 'invalid_type'
      };

      const response = await request(app)
        .post('/api/v1/patch-jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
      expect(response.body).toHaveProperty('details');
    });

    it('should handle non-existent patch references', async () => {
      const jobData = {
        name: 'Job with Invalid Patch',
        patchIds: [99999] // Non-existent patch ID
      };

      const response = await request(app)
        .post('/api/v1/patch-jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(jobData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });
  });
});