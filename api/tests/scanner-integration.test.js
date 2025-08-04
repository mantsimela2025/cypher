const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/db');
const { users, scanJobs, scanResults } = require('../src/db/schema');
const jwt = require('jsonwebtoken');

describe('Scanner Integration Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Create test user
    const [user] = await db.insert(users)
      .values({
        firstName: 'Test',
        lastName: 'Scanner',
        email: 'test.scanner@example.com',
        password: 'hashedpassword',
        role: 'admin',
        status: 'active'
      })
      .returning();

    testUser = user;

    // Generate auth token
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
    await db.delete(scanResults);
    await db.delete(scanJobs);
    await db.delete(users).where({ id: testUser.id });
  });

  describe('POST /api/v1/scanner/internal-scan', () => {
    it('should execute internal scan with valid configuration', async () => {
      const scanConfig = {
        networkRange: '192.168.1.0/24',
        scanType: 'quick',
        timeout: 300,
        enableServiceDetection: true,
        enableOSDetection: false
      };

      const response = await request(app)
        .post('/api/v1/scanner/internal-scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scanConfig)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Internal scan initiated successfully');
      expect(response.body.data).toHaveProperty('scanJobId');
      expect(response.body.data).toHaveProperty('status', 'completed');
    });

    it('should reject invalid scan configuration', async () => {
      const invalidConfig = {
        scanType: 'invalid-type',
        timeout: -1
      };

      const response = await request(app)
        .post('/api/v1/scanner/internal-scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidConfig)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });

    it('should require authentication', async () => {
      const scanConfig = {
        scanType: 'quick'
      };

      await request(app)
        .post('/api/v1/scanner/internal-scan')
        .send(scanConfig)
        .expect(401);
    });
  });

  describe('POST /api/v1/scanner/vulnerability-scan', () => {
    it('should execute vulnerability scan with valid target', async () => {
      const scanConfig = {
        target: '192.168.1.100',
        scanType: 'basic',
        severity: 'medium',
        timeout: 1800
      };

      const response = await request(app)
        .post('/api/v1/scanner/vulnerability-scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scanConfig)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Vulnerability scan initiated successfully');
      expect(response.body.data).toHaveProperty('scanJobId');
      expect(response.body.data).toHaveProperty('target', '192.168.1.100');
    });

    it('should require target parameter', async () => {
      const scanConfig = {
        scanType: 'basic'
      };

      const response = await request(app)
        .post('/api/v1/scanner/vulnerability-scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scanConfig)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });

    it('should validate severity levels', async () => {
      const scanConfig = {
        target: '192.168.1.100',
        severity: 'invalid-severity'
      };

      const response = await request(app)
        .post('/api/v1/scanner/vulnerability-scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scanConfig)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });
  });

  describe('POST /api/v1/scanner/compliance-scan', () => {
    it('should execute compliance scan with valid frameworks', async () => {
      const scanConfig = {
        target: '192.168.1.100',
        frameworks: ['nist', 'cis'],
        scanType: 'configuration',
        timeout: 1800
      };

      const response = await request(app)
        .post('/api/v1/scanner/compliance-scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scanConfig)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Compliance scan initiated successfully');
      expect(response.body.data).toHaveProperty('scanJobId');
      expect(response.body.data).toHaveProperty('frameworks');
    });

    it('should require frameworks parameter', async () => {
      const scanConfig = {
        target: '192.168.1.100',
        scanType: 'configuration'
      };

      const response = await request(app)
        .post('/api/v1/scanner/compliance-scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scanConfig)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });

    it('should validate framework values', async () => {
      const scanConfig = {
        target: '192.168.1.100',
        frameworks: ['invalid-framework']
      };

      const response = await request(app)
        .post('/api/v1/scanner/compliance-scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scanConfig)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });
  });

  describe('GET /api/v1/scanner/jobs', () => {
    let testScanJob;

    beforeEach(async () => {
      // Create test scan job
      const [job] = await db.insert(scanJobs)
        .values({
          scanType: 'vulnerability',
          target: '192.168.1.100',
          configuration: { scanType: 'basic' },
          status: 'completed',
          initiatedBy: testUser.id
        })
        .returning();

      testScanJob = job;
    });

    afterEach(async () => {
      // Clean up test scan job
      if (testScanJob) {
        await db.delete(scanJobs).where({ id: testScanJob.id });
      }
    });

    it('should return list of scan jobs', async () => {
      const response = await request(app)
        .get('/api/v1/scanner/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Scan jobs retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support filtering by scan type', async () => {
      const response = await request(app)
        .get('/api/v1/scanner/jobs?scanType=vulnerability')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('scanType', 'vulnerability');
    });

    it('should support filtering by status', async () => {
      const response = await request(app)
        .get('/api/v1/scanner/jobs?status=completed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('status', 'completed');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/scanner/jobs?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/v1/scanner/jobs/:jobId', () => {
    let testScanJob;

    beforeEach(async () => {
      // Create test scan job
      const [job] = await db.insert(scanJobs)
        .values({
          scanType: 'vulnerability',
          target: '192.168.1.100',
          configuration: { scanType: 'basic' },
          status: 'completed',
          initiatedBy: testUser.id
        })
        .returning();

      testScanJob = job;
    });

    afterEach(async () => {
      // Clean up test scan job
      if (testScanJob) {
        await db.delete(scanJobs).where({ id: testScanJob.id });
      }
    });

    it('should return scan job details', async () => {
      const response = await request(app)
        .get(`/api/v1/scanner/jobs/${testScanJob.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Scan job retrieved successfully');
      expect(response.body.data).toHaveProperty('id', testScanJob.id);
      expect(response.body.data).toHaveProperty('scanType', 'vulnerability');
      expect(response.body.data).toHaveProperty('target', '192.168.1.100');
    });

    it('should return 404 for non-existent job', async () => {
      const response = await request(app)
        .get('/api/v1/scanner/jobs/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not found');
    });

    it('should validate job ID parameter', async () => {
      const response = await request(app)
        .get('/api/v1/scanner/jobs/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid job ID');
    });
  });

  describe('GET /api/v1/scanner/statistics', () => {
    beforeEach(async () => {
      // Create test scan jobs for statistics
      await db.insert(scanJobs)
        .values([
          {
            scanType: 'vulnerability',
            target: '192.168.1.100',
            status: 'completed',
            initiatedBy: testUser.id
          },
          {
            scanType: 'internal',
            target: 'internal-network',
            status: 'completed',
            initiatedBy: testUser.id
          },
          {
            scanType: 'compliance',
            target: '192.168.1.101',
            status: 'failed',
            initiatedBy: testUser.id
          }
        ]);
    });

    afterEach(async () => {
      // Clean up test scan jobs
      await db.delete(scanJobs).where({ initiatedBy: testUser.id });
    });

    it('should return scan statistics', async () => {
      const response = await request(app)
        .get('/api/v1/scanner/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Scan statistics retrieved successfully');
      expect(response.body.data).toHaveProperty('totalScans');
      expect(response.body.data).toHaveProperty('statusBreakdown');
      expect(response.body.data).toHaveProperty('typeBreakdown');
      expect(response.body.data).toHaveProperty('recentScans');

      expect(Array.isArray(response.body.data.statusBreakdown)).toBe(true);
      expect(Array.isArray(response.body.data.typeBreakdown)).toBe(true);
    });
  });

  describe('GET /api/v1/scanner/jobs/:jobId/status', () => {
    let testScanJob;

    beforeEach(async () => {
      // Create test scan job
      const [job] = await db.insert(scanJobs)
        .values({
          scanType: 'vulnerability',
          target: '192.168.1.100',
          configuration: { scanType: 'basic' },
          status: 'running',
          initiatedBy: testUser.id
        })
        .returning();

      testScanJob = job;
    });

    afterEach(async () => {
      // Clean up test scan job
      if (testScanJob) {
        await db.delete(scanJobs).where({ id: testScanJob.id });
      }
    });

    it('should return scan status', async () => {
      const response = await request(app)
        .get(`/api/v1/scanner/jobs/${testScanJob.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Scan status retrieved successfully');
      expect(response.body.data).toHaveProperty('jobId', testScanJob.id);
      expect(response.body.data).toHaveProperty('status', 'running');
      expect(response.body.data).toHaveProperty('scanType', 'vulnerability');
      expect(response.body.data).toHaveProperty('target', '192.168.1.100');
    });
  });

  describe('POST /api/v1/scanner/jobs/:jobId/cancel', () => {
    let testScanJob;

    beforeEach(async () => {
      // Create test scan job
      const [job] = await db.insert(scanJobs)
        .values({
          scanType: 'vulnerability',
          target: '192.168.1.100',
          configuration: { scanType: 'basic' },
          status: 'running',
          initiatedBy: testUser.id
        })
        .returning();

      testScanJob = job;
    });

    afterEach(async () => {
      // Clean up test scan job
      if (testScanJob) {
        await db.delete(scanJobs).where({ id: testScanJob.id });
      }
    });

    it('should request scan cancellation for running scan', async () => {
      const response = await request(app)
        .post(`/api/v1/scanner/jobs/${testScanJob.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Scan cancellation requested');
      expect(response.body.data).toHaveProperty('jobId', testScanJob.id);
      expect(response.body.data).toHaveProperty('status', 'cancellation_requested');
    });

    it('should reject cancellation for completed scan', async () => {
      // Update scan to completed status
      await db.update(scanJobs)
        .set({ status: 'completed' })
        .where({ id: testScanJob.id });

      const response = await request(app)
        .post(`/api/v1/scanner/jobs/${testScanJob.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Cannot cancel scan');
    });
  });

  describe('Permission Tests', () => {
    let limitedUser;
    let limitedAuthToken;

    beforeAll(async () => {
      // Create user with limited permissions
      const [user] = await db.insert(users)
        .values({
          firstName: 'Limited',
          lastName: 'User',
          email: 'limited.user@example.com',
          password: 'hashedpassword',
          role: 'auditor',
          status: 'active'
        })
        .returning();

      limitedUser = user;

      limitedAuthToken = jwt.sign(
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
      // Clean up limited user
      await db.delete(users).where({ id: limitedUser.id });
    });

    it('should allow auditor to view results', async () => {
      const response = await request(app)
        .get('/api/v1/scanner/jobs')
        .set('Authorization', `Bearer ${limitedAuthToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Scan jobs retrieved successfully');
    });

    it('should deny auditor from executing scans', async () => {
      const scanConfig = {
        target: '192.168.1.100',
        scanType: 'basic'
      };

      const response = await request(app)
        .post('/api/v1/scanner/vulnerability-scan')
        .set('Authorization', `Bearer ${limitedAuthToken}`)
        .send(scanConfig)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });
  });
});
