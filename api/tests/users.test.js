const request = require('supertest');
const app = require('../src/app');

describe('User Endpoints', () => {
  let accessToken;
  let userId;

  beforeEach(async () => {
    // Register and login to get access token
    const userData = {
      email: 'testuser@example.com',
      username: 'testuser',
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
    };

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    accessToken = registerResponse.body.data.accessToken;
    userId = registerResponse.body.data.user.id;
  });

  describe('GET /api/v1/users', () => {
    it('should get all users with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should return error without token', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/users?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.currentPage).toBe(1);
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/v1/users?search=test')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should get user by ID with valid token', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/v1/users/99999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create new user with valid data', async () => {
      const newUserData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'NewPass123!',
        firstName: 'New',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(newUserData.email);
    });

    it('should return validation error for invalid data', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        username: 'ab', // too short
        password: 'weak',
      };

      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should update user with valid data', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(updateData.firstName);
    });

    it('should return 404 for non-existent user', async () => {
      const updateData = {
        firstName: 'Updated',
      };

      const response = await request(app)
        .put('/api/v1/users/99999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete user', async () => {
      // Create a user to delete
      const newUserData = {
        email: 'todelete@example.com',
        username: 'todelete',
        password: 'DeletePass123!',
      };

      const createResponse = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newUserData);

      const userToDeleteId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/v1/users/${userToDeleteId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/v1/users/99999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
