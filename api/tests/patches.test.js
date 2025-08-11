const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/db');
const { users, patches, patchApprovals, patchNotes } = require('../src/db/schema');
const jwt = require('jsonwebtoken');

describe('Patch Management Service Tests', () => {
  let authToken;
  let adminToken;
  let testUser;
  let testAdmin;
  let testPatch;

  beforeAll(async () => {
    // Create test admin user
    const [admin] = await db.insert(users)
      .values({
        firstName: 'Test',
        lastName: 'Admin',
        email: 'patch.admin@example.com',
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
        email: 'patch.user@example.com',
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
    if (testPatch) {
      await db.delete(patchNotes).where({ patchId: testPatch.id });
      await db.delete(patchApprovals).where({ patchId: testPatch.id });
      await db.delete(patches).where({ id: testPatch.id });
    }
    await db.delete(users).where({ id: testAdmin.id });
    await db.delete(users).where({ id: testUser.id });
  });

  describe('Patch CRUD Operations', () => {
    describe('POST /api/v1/patches', () => {
      it('should create a new patch with valid data', async () => {
        const patchData = {
          title: 'Test Security Patch',
          description: 'Critical security update for Windows Server',
          patchId: 'KB123456',
          version: '1.0.0',
          severity: 'critical',
          category: 'security',
          vendor: 'Microsoft',
          operatingSystem: 'Windows Server 2019',
          architecture: 'x64',
          releaseDate: '2024-01-15',
          supersededPatches: ['KB123455'],
          prerequisites: ['KB123454'],
          downloadUrl: 'https://catalog.update.microsoft.com/v7/site/Search.aspx?q=KB123456',
          downloadSize: 52428800,
          restartRequired: true,
          vulnerabilities: [
            {
              cveId: 'CVE-2024-0001',
              severity: 'critical',
              description: 'Remote code execution vulnerability'
            }
          ],
          affectedAssets: ['asset-uuid-1', 'asset-uuid-2'],
          dependencies: []
        };

        const response = await request(app)
          .post('/api/v1/patches')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(patchData)
          .expect(201);

        expect(response.body).toHaveProperty('message', 'Patch created successfully');
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('title', 'Test Security Patch');
        expect(response.body.data).toHaveProperty('patchId', 'KB123456');
        expect(response.body.data).toHaveProperty('severity', 'critical');
        expect(response.body.data).toHaveProperty('status', 'pending');

        testPatch = response.body.data;
      });

      it('should validate required fields', async () => {
        const patchData = {
          description: 'Missing title and patchId fields'
        };

        const response = await request(app)
          .post('/api/v1/patches')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(patchData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
        expect(response.body).toHaveProperty('details');
      });

      it('should validate severity enum values', async () => {
        const patchData = {
          title: 'Test Patch',
          patchId: 'KB123457',
          severity: 'invalid-severity'
        };

        const response = await request(app)
          .post('/api/v1/patches')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(patchData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should validate category enum values', async () => {
        const patchData = {
          title: 'Test Patch',
          patchId: 'KB123458',
          category: 'invalid-category'
        };

        const response = await request(app)
          .post('/api/v1/patches')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(patchData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should validate download size as number', async () => {
        const patchData = {
          title: 'Test Patch',
          patchId: 'KB123459',
          downloadSize: 'not-a-number'
        };

        const response = await request(app)
          .post('/api/v1/patches')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(patchData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should require appropriate permissions', async () => {
        const patchData = {
          title: 'Unauthorized Patch',
          patchId: 'KB000001'
        };

        await request(app)
          .post('/api/v1/patches')
          .set('Authorization', `Bearer ${authToken}`)
          .send(patchData)
          .expect(403);
      });

      it('should prevent duplicate patch IDs', async () => {
        const patchData = {
          title: 'Duplicate Patch',
          patchId: 'KB123456' // Same as the first patch
        };

        const response = await request(app)
          .post('/api/v1/patches')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(patchData)
          .expect(409);

        expect(response.body).toHaveProperty('error', 'Conflict');
      });
    });

    describe('GET /api/v1/patches', () => {
      it('should return list of patches with pagination', async () => {
        const response = await request(app)
          .get('/api/v1/patches')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patches retrieved successfully');
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should support filtering by severity', async () => {
        const response = await request(app)
          .get('/api/v1/patches?severity=critical')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        if (response.body.data.length > 0) {
          response.body.data.forEach(patch => {
            expect(patch.severity).toBe('critical');
          });
        }
      });

      it('should support filtering by category', async () => {
        const response = await request(app)
          .get('/api/v1/patches?category=security')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        if (response.body.data.length > 0) {
          response.body.data.forEach(patch => {
            expect(patch.category).toBe('security');
          });
        }
      });

      it('should support filtering by status', async () => {
        const response = await request(app)
          .get('/api/v1/patches?status=pending')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        if (response.body.data.length > 0) {
          response.body.data.forEach(patch => {
            expect(patch.status).toBe('pending');
          });
        }
      });

      it('should support filtering by vendor', async () => {
        const response = await request(app)
          .get('/api/v1/patches?vendor=Microsoft')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        if (response.body.data.length > 0) {
          response.body.data.forEach(patch => {
            expect(patch.vendor).toBe('Microsoft');
          });
        }
      });

      it('should support search functionality', async () => {
        const response = await request(app)
          .get('/api/v1/patches?search=Test Security Patch')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.length).toBeGreaterThan(0);
        const found = response.body.data.some(patch => 
          patch.title.includes('Test Security Patch') || 
          patch.description.includes('Test Security Patch')
        );
        expect(found).toBe(true);
      });

      it('should support pagination parameters', async () => {
        const response = await request(app)
          .get('/api/v1/patches?page=1&limit=5')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.pagination).toHaveProperty('page', 1);
        expect(response.body.pagination).toHaveProperty('limit', 5);
        expect(response.body.data.length).toBeLessThanOrEqual(5);
      });

      it('should support sorting', async () => {
        const response = await request(app)
          .get('/api/v1/patches?sortBy=releaseDate&sortOrder=desc')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        if (response.body.data.length > 1) {
          const dates = response.body.data.map(patch => new Date(patch.releaseDate));
          for (let i = 1; i < dates.length; i++) {
            expect(dates[i-1] >= dates[i]).toBe(true);
          }
        }
      });

      it('should filter by date range', async () => {
        const response = await request(app)
          .get('/api/v1/patches?startDate=2024-01-01&endDate=2024-12-31')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        if (response.body.data.length > 0) {
          response.body.data.forEach(patch => {
            const releaseDate = new Date(patch.releaseDate);
            expect(releaseDate >= new Date('2024-01-01')).toBe(true);
            expect(releaseDate <= new Date('2024-12-31')).toBe(true);
          });
        }
      });
    });

    describe('GET /api/v1/patches/:id', () => {
      it('should return patch by ID', async () => {
        const response = await request(app)
          .get(`/api/v1/patches/${testPatch.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch retrieved successfully');
        expect(response.body.data).toHaveProperty('id', testPatch.id);
        expect(response.body.data).toHaveProperty('title', 'Test Security Patch');
      });

      it('should return 404 for non-existent patch', async () => {
        const response = await request(app)
          .get('/api/v1/patches/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body).toHaveProperty('error', 'Not found');
      });

      it('should validate ID parameter as number', async () => {
        const response = await request(app)
          .get('/api/v1/patches/invalid-id')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });
    });

    describe('PUT /api/v1/patches/:id', () => {
      it('should update patch with valid data', async () => {
        const updateData = {
          description: 'Updated critical security update description',
          status: 'approved'
        };

        const response = await request(app)
          .put(`/api/v1/patches/${testPatch.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch updated successfully');
        expect(response.body.data).toHaveProperty('description', 'Updated critical security update description');
        expect(response.body.data).toHaveProperty('status', 'approved');
      });

      it('should validate update data', async () => {
        const updateData = {
          severity: 'invalid-severity'
        };

        const response = await request(app)
          .put(`/api/v1/patches/${testPatch.id}`)
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
          .put(`/api/v1/patches/${testPatch.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(403);
      });

      it('should return 404 for non-existent patch', async () => {
        const updateData = {
          description: 'Update non-existent patch'
        };

        const response = await request(app)
          .put('/api/v1/patches/99999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(404);

        expect(response.body).toHaveProperty('error', 'Not found');
      });
    });

    describe('DELETE /api/v1/patches/:id', () => {
      it('should require appropriate permissions', async () => {
        await request(app)
          .delete(`/api/v1/patches/${testPatch.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });

      it('should return 404 for non-existent patch', async () => {
        const response = await request(app)
          .delete('/api/v1/patches/99999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body).toHaveProperty('error', 'Not found');
      });
    });
  });

  describe('Patch Analytics', () => {
    describe('GET /api/v1/patches/analytics/overview', () => {
      it('should return patch analytics overview', async () => {
        const response = await request(app)
          .get('/api/v1/patches/analytics/overview')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Patch analytics retrieved successfully');
        expect(response.body.data).toHaveProperty('totalPatches');
        expect(response.body.data).toHaveProperty('patchesBySeverity');
        expect(response.body.data).toHaveProperty('patchesByCategory');
        expect(response.body.data).toHaveProperty('patchesByStatus');
        expect(response.body.data).toHaveProperty('patchesByVendor');
      });
    });

    describe('GET /api/v1/patches/analytics/compliance', () => {
      it('should return compliance analytics', async () => {
        const response = await request(app)
          .get('/api/v1/patches/analytics/compliance')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Compliance analytics retrieved successfully');
        expect(response.body.data).toHaveProperty('complianceRate');
        expect(response.body.data).toHaveProperty('criticalPatchesOverdue');
        expect(response.body.data).toHaveProperty('averageTimeToDeployment');
        expect(response.body.data).toHaveProperty('complianceByAssetGroup');
      });
    });

    describe('GET /api/v1/patches/analytics/vulnerability', () => {
      it('should return vulnerability analytics', async () => {
        const response = await request(app)
          .get('/api/v1/patches/analytics/vulnerability')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Vulnerability analytics retrieved successfully');
        expect(response.body.data).toHaveProperty('totalVulnerabilities');
        expect(response.body.data).toHaveProperty('vulnerabilitiesBySeverity');
        expect(response.body.data).toHaveProperty('patchedVulnerabilities');
        expect(response.body.data).toHaveProperty('unpatchedVulnerabilities');
      });
    });
  });

  describe('Security and Permissions', () => {
    it('should require authentication for all endpoints', async () => {
      await request(app)
        .get('/api/v1/patches')
        .expect(401);

      await request(app)
        .post('/api/v1/patches')
        .send({ title: 'Test' })
        .expect(401);
    });

    it('should enforce role-based permissions for create/update/delete', async () => {
      const patchData = {
        title: 'Unauthorized Patch',
        patchId: 'KB000002'
      };

      // Regular user should not be able to create patches
      await request(app)
        .post('/api/v1/patches')
        .set('Authorization', `Bearer ${authToken}`)
        .send(patchData)
        .expect(403);

      // Regular user should not be able to update patches
      await request(app)
        .put(`/api/v1/patches/${testPatch.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Unauthorized update' })
        .expect(403);

      // Regular user should not be able to delete patches
      await request(app)
        .delete(`/api/v1/patches/${testPatch.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid ID format gracefully', async () => {
      await request(app)
        .get('/api/v1/patches/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should validate request data thoroughly', async () => {
      const invalidData = {
        title: '', // Empty title
        patchId: '', // Empty patch ID
        severity: 'invalid_severity',
        downloadSize: 'not-a-number',
        restartRequired: 'not-a-boolean'
      };

      const response = await request(app)
        .post('/api/v1/patches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
      expect(response.body).toHaveProperty('details');
    });

    it('should handle database errors gracefully', async () => {
      // Test with extremely long title to potentially trigger database constraint error
      const invalidData = {
        title: 'A'.repeat(1000),
        patchId: 'KB999999'
      };

      const response = await request(app)
        .post('/api/v1/patches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});