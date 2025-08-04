const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/db');
const { users, assets, assetCostManagement, assetLifecycle } = require('../src/db/schema');
const jwt = require('jsonwebtoken');

describe('Asset Management Service Tests', () => {
  let authToken;
  let adminToken;
  let testUser;
  let testAdmin;
  let testAsset;

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
    if (testAsset) {
      await db.delete(assetCostManagement).where({ assetUuid: testAsset.uuid });
      await db.delete(assetLifecycle).where({ assetUuid: testAsset.uuid });
      await db.delete(assets).where({ uuid: testAsset.uuid });
    }
    await db.delete(users).where({ id: testAdmin.id });
    await db.delete(users).where({ id: testUser.id });
  });

  describe('Asset CRUD Operations', () => {
    describe('POST /api/v1/asset-management', () => {
      it('should create a new asset with valid data', async () => {
        const assetData = {
          name: 'Test Server',
          description: 'Test server for unit testing',
          assetType: 'server',
          ipv4: '192.168.1.100',
          macAddress: '00:11:22:33:44:55',
          operatingSystem: 'Ubuntu 20.04',
          location: 'Data Center A',
          owner: 'IT Department',
          criticality: 'high',
          status: 'active',
          tags: ['test', 'server', 'ubuntu'],
          customFields: {
            department: 'IT',
            project: 'Infrastructure'
          }
        };

        const response = await request(app)
          .post('/api/v1/asset-management')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(assetData)
          .expect(201);

        expect(response.body).toHaveProperty('message', 'Asset created successfully');
        expect(response.body.data).toHaveProperty('uuid');
        expect(response.body.data).toHaveProperty('name', 'Test Server');
        expect(response.body.data).toHaveProperty('assetType', 'server');
        expect(response.body.data).toHaveProperty('ipv4', '192.168.1.100');
        expect(response.body.data).toHaveProperty('criticality', 'high');

        testAsset = response.body.data;
      });

      it('should validate required fields', async () => {
        const assetData = {
          description: 'Missing name field'
        };

        const response = await request(app)
          .post('/api/v1/asset-management')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(assetData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should validate IP address format', async () => {
        const assetData = {
          name: 'Invalid IP Asset',
          assetType: 'server',
          ipv4: '999.999.999.999' // Invalid IP
        };

        const response = await request(app)
          .post('/api/v1/asset-management')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(assetData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should validate MAC address format', async () => {
        const assetData = {
          name: 'Invalid MAC Asset',
          assetType: 'server',
          macAddress: 'invalid-mac-address'
        };

        const response = await request(app)
          .post('/api/v1/asset-management')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(assetData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should require appropriate permissions', async () => {
        const assetData = {
          name: 'Unauthorized Asset',
          assetType: 'server'
        };

        await request(app)
          .post('/api/v1/asset-management')
          .set('Authorization', `Bearer ${authToken}`)
          .send(assetData)
          .expect(403);
      });
    });

    describe('GET /api/v1/asset-management', () => {
      it('should return list of assets with pagination', async () => {
        const response = await request(app)
          .get('/api/v1/asset-management')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Assets retrieved successfully');
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should support filtering by asset type', async () => {
        const response = await request(app)
          .get('/api/v1/asset-management?assetType=server')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        response.body.data.forEach(asset => {
          expect(asset.assetType).toBe('server');
        });
      });

      it('should support filtering by criticality', async () => {
        const response = await request(app)
          .get('/api/v1/asset-management?criticality=high')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        response.body.data.forEach(asset => {
          expect(asset.criticality).toBe('high');
        });
      });

      it('should support filtering by status', async () => {
        const response = await request(app)
          .get('/api/v1/asset-management?status=active')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        response.body.data.forEach(asset => {
          expect(asset.status).toBe('active');
        });
      });

      it('should support search functionality', async () => {
        const response = await request(app)
          .get('/api/v1/asset-management?search=Test Server')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.length).toBeGreaterThan(0);
        const found = response.body.data.some(asset => 
          asset.name.includes('Test Server') || 
          asset.description.includes('Test Server')
        );
        expect(found).toBe(true);
      });

      it('should support pagination parameters', async () => {
        const response = await request(app)
          .get('/api/v1/asset-management?page=1&limit=5')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.pagination).toHaveProperty('page', 1);
        expect(response.body.pagination).toHaveProperty('limit', 5);
        expect(response.body.data.length).toBeLessThanOrEqual(5);
      });

      it('should support sorting', async () => {
        const response = await request(app)
          .get('/api/v1/asset-management?sortBy=name&sortOrder=asc')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        if (response.body.data.length > 1) {
          const names = response.body.data.map(asset => asset.name);
          const sortedNames = [...names].sort();
          expect(names).toEqual(sortedNames);
        }
      });
    });

    describe('GET /api/v1/asset-management/:uuid', () => {
      it('should return asset by UUID', async () => {
        const response = await request(app)
          .get(`/api/v1/asset-management/${testAsset.uuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Asset retrieved successfully');
        expect(response.body.data).toHaveProperty('uuid', testAsset.uuid);
        expect(response.body.data).toHaveProperty('name', 'Test Server');
      });

      it('should return 404 for non-existent asset', async () => {
        const fakeUuid = '00000000-0000-0000-0000-000000000000';
        const response = await request(app)
          .get(`/api/v1/asset-management/${fakeUuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body).toHaveProperty('error', 'Not found');
      });

      it('should validate UUID format', async () => {
        const response = await request(app)
          .get('/api/v1/asset-management/invalid-uuid')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid UUID format');
      });
    });

    describe('PUT /api/v1/asset-management/:uuid', () => {
      it('should update asset with valid data', async () => {
        const updateData = {
          description: 'Updated test server description',
          location: 'Data Center B',
          status: 'maintenance'
        };

        const response = await request(app)
          .put(`/api/v1/asset-management/${testAsset.uuid}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Asset updated successfully');
        expect(response.body.data).toHaveProperty('description', 'Updated test server description');
        expect(response.body.data).toHaveProperty('location', 'Data Center B');
        expect(response.body.data).toHaveProperty('status', 'maintenance');
      });

      it('should validate update data', async () => {
        const updateData = {
          ipv4: 'invalid-ip-address'
        };

        const response = await request(app)
          .put(`/api/v1/asset-management/${testAsset.uuid}`)
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
          .put(`/api/v1/asset-management/${testAsset.uuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(403);
      });
    });
  });

  describe('Asset Cost Management', () => {
    describe('POST /api/v1/asset-management/:uuid/cost', () => {
      it('should add cost information to asset', async () => {
        const costData = {
          purchasePrice: 5000.00,
          currentValue: 3000.00,
          vendor: 'Dell Technologies',
          purchaseDate: '2023-01-15',
          warrantyExpiration: '2026-01-15',
          maintenanceCost: 500.00,
          billingFrequency: 'monthly'
        };

        const response = await request(app)
          .post(`/api/v1/asset-management/${testAsset.uuid}/cost`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(costData)
          .expect(201);

        expect(response.body).toHaveProperty('message', 'Asset cost information added successfully');
        expect(response.body.data).toHaveProperty('purchasePrice', 5000.00);
        expect(response.body.data).toHaveProperty('vendor', 'Dell Technologies');
      });

      it('should validate cost data types', async () => {
        const costData = {
          purchasePrice: 'invalid-price', // Should be number
          vendor: 'Test Vendor'
        };

        const response = await request(app)
          .post(`/api/v1/asset-management/${testAsset.uuid}/cost`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(costData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });
    });

    describe('GET /api/v1/asset-management/:uuid/cost', () => {
      it('should return asset cost information', async () => {
        const response = await request(app)
          .get(`/api/v1/asset-management/${testAsset.uuid}/cost`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Asset cost information retrieved successfully');
        expect(response.body.data).toHaveProperty('purchasePrice');
        expect(response.body.data).toHaveProperty('vendor');
      });
    });

    describe('PUT /api/v1/asset-management/:uuid/cost', () => {
      it('should update asset cost information', async () => {
        const updateData = {
          currentValue: 2500.00,
          maintenanceCost: 600.00
        };

        const response = await request(app)
          .put(`/api/v1/asset-management/${testAsset.uuid}/cost`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Asset cost information updated successfully');
        expect(response.body.data).toHaveProperty('currentValue', 2500.00);
        expect(response.body.data).toHaveProperty('maintenanceCost', 600.00);
      });
    });
  });

  describe('Asset Lifecycle Management', () => {
    describe('POST /api/v1/asset-management/:uuid/lifecycle', () => {
      it('should add lifecycle information to asset', async () => {
        const lifecycleData = {
          purchaseDate: '2023-01-15',
          warrantyStart: '2023-01-15',
          warrantyEnd: '2026-01-15',
          expectedEol: '2028-01-15',
          lifecycleStage: 'production',
          supportLevel: 'premium'
        };

        const response = await request(app)
          .post(`/api/v1/asset-management/${testAsset.uuid}/lifecycle`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(lifecycleData)
          .expect(201);

        expect(response.body).toHaveProperty('message', 'Asset lifecycle information added successfully');
        expect(response.body.data).toHaveProperty('lifecycleStage', 'production');
        expect(response.body.data).toHaveProperty('supportLevel', 'premium');
      });

      it('should validate date formats', async () => {
        const lifecycleData = {
          purchaseDate: 'invalid-date',
          warrantyStart: '2023-01-15'
        };

        const response = await request(app)
          .post(`/api/v1/asset-management/${testAsset.uuid}/lifecycle`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(lifecycleData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });
    });

    describe('GET /api/v1/asset-management/:uuid/lifecycle', () => {
      it('should return asset lifecycle information', async () => {
        const response = await request(app)
          .get(`/api/v1/asset-management/${testAsset.uuid}/lifecycle`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Asset lifecycle information retrieved successfully');
        expect(response.body.data).toHaveProperty('lifecycleStage');
        expect(response.body.data).toHaveProperty('supportLevel');
      });
    });
  });

  describe('Asset Analytics', () => {
    describe('GET /api/v1/asset-management/analytics/overview', () => {
      it('should return asset analytics overview', async () => {
        const response = await request(app)
          .get('/api/v1/asset-management/analytics/overview')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Asset analytics retrieved successfully');
        expect(response.body.data).toHaveProperty('totalAssets');
        expect(response.body.data).toHaveProperty('assetsByType');
        expect(response.body.data).toHaveProperty('assetsByCriticality');
        expect(response.body.data).toHaveProperty('assetsByStatus');
        expect(response.body.data).toHaveProperty('totalValue');
      });
    });

    describe('GET /api/v1/asset-management/analytics/cost-analysis', () => {
      it('should return cost analysis data', async () => {
        const response = await request(app)
          .get('/api/v1/asset-management/analytics/cost-analysis')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Cost analysis retrieved successfully');
        expect(response.body.data).toHaveProperty('totalPurchaseValue');
        expect(response.body.data).toHaveProperty('totalCurrentValue');
        expect(response.body.data).toHaveProperty('totalMaintenanceCost');
        expect(response.body.data).toHaveProperty('costByVendor');
        expect(response.body.data).toHaveProperty('depreciationAnalysis');
      });
    });

    describe('GET /api/v1/asset-management/analytics/lifecycle-analysis', () => {
      it('should return lifecycle analysis data', async () => {
        const response = await request(app)
          .get('/api/v1/asset-management/analytics/lifecycle-analysis')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Lifecycle analysis retrieved successfully');
        expect(response.body.data).toHaveProperty('assetsByLifecycleStage');
        expect(response.body.data).toHaveProperty('warrantyExpirations');
        expect(response.body.data).toHaveProperty('eolPredictions');
        expect(response.body.data).toHaveProperty('replacementSchedule');
      });
    });
  });

  describe('Security and Permissions', () => {
    it('should require authentication for all endpoints', async () => {
      await request(app)
        .get('/api/v1/asset-management')
        .expect(401);

      await request(app)
        .post('/api/v1/asset-management')
        .send({ name: 'Test' })
        .expect(401);
    });

    it('should enforce role-based permissions for create/update/delete', async () => {
      const assetData = {
        name: 'Unauthorized Asset',
        assetType: 'server'
      };

      // Regular user should not be able to create assets
      await request(app)
        .post('/api/v1/asset-management')
        .set('Authorization', `Bearer ${authToken}`)
        .send(assetData)
        .expect(403);

      // Regular user should not be able to update assets
      await request(app)
        .put(`/api/v1/asset-management/${testAsset.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Unauthorized update' })
        .expect(403);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid UUID format gracefully', async () => {
      await request(app)
        .get('/api/v1/asset-management/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should handle non-existent assets gracefully', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      
      await request(app)
        .get(`/api/v1/asset-management/${fakeUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      await request(app)
        .put(`/api/v1/asset-management/${fakeUuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Update non-existent' })
        .expect(404);
    });

    it('should validate request data thoroughly', async () => {
      const invalidData = {
        name: '', // Empty name
        assetType: 'invalid_type', // Invalid enum value
        ipv4: '999.999.999.999', // Invalid IP
        criticality: 'invalid_criticality' // Invalid enum value
      };

      const response = await request(app)
        .post('/api/v1/asset-management')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
      expect(response.body).toHaveProperty('details');
    });
  });
});
