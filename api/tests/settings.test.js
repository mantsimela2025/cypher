const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/db');
const { users, settings } = require('../src/db/schema');
const jwt = require('jsonwebtoken');

describe('Settings API Tests', () => {
  let authToken;
  let testUser;
  let testSetting;

  beforeAll(async () => {
    // Create test user
    const [user] = await db.insert(users)
      .values({
        firstName: 'Test',
        lastName: 'Settings',
        email: 'test.settings@example.com',
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
    await db.delete(settings).where({ key: 'test_setting' });
    await db.delete(settings).where({ key: 'test_setting_2' });
    await db.delete(users).where({ id: testUser.id });
  });

  describe('GET /api/v1/settings/public', () => {
    it('should return public settings without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/settings/public')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Public settings retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(typeof response.body.data).toBe('object');
    });
  });

  describe('POST /api/v1/settings', () => {
    it('should create a new setting with valid data', async () => {
      const settingData = {
        key: 'test_setting',
        value: 'test_value',
        dataType: 'string',
        category: 'test',
        description: 'Test setting for unit tests',
        isPublic: false,
        isEditable: true
      };

      const response = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(settingData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Setting created successfully');
      expect(response.body.data).toHaveProperty('key', 'test_setting');
      expect(response.body.data).toHaveProperty('value', 'test_value');
      expect(response.body.data).toHaveProperty('dataType', 'string');

      testSetting = response.body.data;
    });

    it('should reject duplicate setting key', async () => {
      const settingData = {
        key: 'test_setting',
        value: 'duplicate_value',
        dataType: 'string',
        category: 'test'
      };

      const response = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(settingData)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Conflict');
    });

    it('should validate required fields', async () => {
      const settingData = {
        value: 'test_value'
        // Missing required 'key' field
      };

      const response = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(settingData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });

    it('should require authentication', async () => {
      const settingData = {
        key: 'test_setting_unauth',
        value: 'test_value'
      };

      await request(app)
        .post('/api/v1/settings')
        .send(settingData)
        .expect(401);
    });
  });

  describe('GET /api/v1/settings', () => {
    it('should return list of settings with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Settings retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support filtering by category', async () => {
      const response = await request(app)
        .get('/api/v1/settings?category=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('category', 'test');
    });

    it('should support search functionality', async () => {
      const response = await request(app)
        .get('/api/v1/settings?search=test_setting')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].key).toContain('test_setting');
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/settings?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/v1/settings/:id', () => {
    it('should return setting by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/settings/${testSetting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Setting retrieved successfully');
      expect(response.body.data).toHaveProperty('id', testSetting.id);
      expect(response.body.data).toHaveProperty('key', 'test_setting');
    });

    it('should return 404 for non-existent setting', async () => {
      const response = await request(app)
        .get('/api/v1/settings/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not found');
    });

    it('should validate ID parameter', async () => {
      const response = await request(app)
        .get('/api/v1/settings/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid setting ID');
    });
  });

  describe('GET /api/v1/settings/key/:key', () => {
    it('should return setting by key', async () => {
      const response = await request(app)
        .get('/api/v1/settings/key/test_setting')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Setting retrieved successfully');
      expect(response.body.data).toHaveProperty('key', 'test_setting');
    });

    it('should return 404 for non-existent key', async () => {
      const response = await request(app)
        .get('/api/v1/settings/key/non_existent_key')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not found');
    });
  });

  describe('PUT /api/v1/settings/:id', () => {
    it('should update setting by ID', async () => {
      const updateData = {
        value: 'updated_test_value',
        description: 'Updated test setting description'
      };

      const response = await request(app)
        .put(`/api/v1/settings/${testSetting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Setting updated successfully');
      expect(response.body.data).toHaveProperty('value', 'updated_test_value');
      expect(response.body.data).toHaveProperty('description', 'Updated test setting description');
    });

    it('should validate data types', async () => {
      // Create a number setting first
      const numberSetting = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'test_number_setting',
          value: '123',
          dataType: 'number',
          category: 'test'
        });

      // Try to update with invalid number
      const response = await request(app)
        .put(`/api/v1/settings/${numberSetting.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          value: 'not_a_number',
          dataType: 'number'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid value');

      // Clean up
      await db.delete(settings).where({ key: 'test_number_setting' });
    });
  });

  describe('PUT /api/v1/settings/key/:key', () => {
    it('should update setting by key', async () => {
      const updateData = {
        value: 'key_updated_value'
      };

      const response = await request(app)
        .put('/api/v1/settings/key/test_setting')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Setting updated successfully');
      expect(response.body.data).toHaveProperty('value', 'key_updated_value');
    });

    it('should require value field', async () => {
      const response = await request(app)
        .put('/api/v1/settings/key/test_setting')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });
  });

  describe('GET /api/v1/settings/categories', () => {
    it('should return list of categories', async () => {
      const response = await request(app)
        .get('/api/v1/settings/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Categories retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Should include our test category
      const testCategory = response.body.data.find(cat => cat.category === 'test');
      expect(testCategory).toBeDefined();
      expect(testCategory.count).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/v1/settings/bulk-update', () => {
    beforeEach(async () => {
      // Create additional test setting for bulk update
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'test_setting_2',
          value: 'original_value',
          dataType: 'string',
          category: 'test'
        });
    });

    it('should bulk update multiple settings', async () => {
      const bulkData = {
        test_setting: 'bulk_updated_1',
        test_setting_2: 'bulk_updated_2'
      };

      const response = await request(app)
        .put('/api/v1/settings/bulk-update')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.message).toContain('Bulk update completed');
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data.summary.successful).toBe(2);
      expect(response.body.data.summary.failed).toBe(0);
    });

    it('should handle partial failures in bulk update', async () => {
      const bulkData = {
        test_setting: 'bulk_updated_valid',
        non_existent_key: 'this_will_fail'
      };

      const response = await request(app)
        .put('/api/v1/settings/bulk-update')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.data.summary.successful).toBe(1);
      expect(response.body.data.summary.failed).toBe(1);
    });
  });

  describe('DELETE /api/v1/settings/:id', () => {
    it('should delete setting by ID', async () => {
      // Create a setting to delete
      const settingToDelete = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'test_delete_setting',
          value: 'to_be_deleted',
          category: 'test'
        });

      const response = await request(app)
        .delete(`/api/v1/settings/${settingToDelete.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Setting deleted successfully');

      // Verify setting is deleted
      await request(app)
        .get(`/api/v1/settings/${settingToDelete.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should prevent deletion of non-editable settings', async () => {
      // Create a non-editable setting
      const nonEditableSetting = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'test_non_editable',
          value: 'protected',
          category: 'test',
          isEditable: false
        });

      const response = await request(app)
        .delete(`/api/v1/settings/${nonEditableSetting.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden');

      // Clean up
      await db.delete(settings).where({ key: 'test_non_editable' });
    });
  });

  describe('Data Type Conversion', () => {
    it('should handle boolean data type correctly', async () => {
      const booleanSetting = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'test_boolean',
          value: true,
          dataType: 'boolean',
          category: 'test'
        });

      expect(booleanSetting.body.data.value).toBe('true');

      // Clean up
      await db.delete(settings).where({ key: 'test_boolean' });
    });

    it('should handle number data type correctly', async () => {
      const numberSetting = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'test_number',
          value: 42,
          dataType: 'number',
          category: 'test'
        });

      expect(numberSetting.body.data.value).toBe('42');

      // Clean up
      await db.delete(settings).where({ key: 'test_number' });
    });

    it('should handle JSON data type correctly', async () => {
      const jsonValue = { key: 'value', array: [1, 2, 3] };
      const jsonSetting = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'test_json',
          value: jsonValue,
          dataType: 'json',
          category: 'test'
        });

      expect(jsonSetting.body.data.value).toBe(JSON.stringify(jsonValue));

      // Clean up
      await db.delete(settings).where({ key: 'test_json' });
    });
  });
});
