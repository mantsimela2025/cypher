const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/db');
const { users, roles, permissions, rolePermissions } = require('../src/db/schema');
const jwt = require('jsonwebtoken');

describe('RBAC Service Tests', () => {
  let authToken;
  let adminToken;
  let testUser;
  let testAdmin;
  let testRole;
  let testPermission;

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
    if (testRole) {
      await db.delete(rolePermissions).where({ roleId: testRole.id });
      await db.delete(roles).where({ id: testRole.id });
    }
    if (testPermission) {
      await db.delete(permissions).where({ id: testPermission.id });
    }
    await db.delete(users).where({ id: testAdmin.id });
    await db.delete(users).where({ id: testUser.id });
  });

  describe('Role Management', () => {
    describe('POST /api/v1/roles', () => {
      it('should create a new role with admin privileges', async () => {
        const roleData = {
          name: 'test-role',
          description: 'Test role for unit tests',
          isDefault: false
        };

        const response = await request(app)
          .post('/api/v1/roles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(roleData)
          .expect(201);

        expect(response.body).toHaveProperty('message', 'Role created successfully');
        expect(response.body.data).toHaveProperty('name', 'test-role');
        expect(response.body.data).toHaveProperty('description', 'Test role for unit tests');

        testRole = response.body.data;
      });

      it('should reject role creation without admin privileges', async () => {
        const roleData = {
          name: 'unauthorized-role',
          description: 'Should not be created'
        };

        await request(app)
          .post('/api/v1/roles')
          .set('Authorization', `Bearer ${authToken}`)
          .send(roleData)
          .expect(403);
      });

      it('should validate required fields', async () => {
        const roleData = {
          description: 'Missing name field'
        };

        const response = await request(app)
          .post('/api/v1/roles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(roleData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should reject duplicate role names', async () => {
        const roleData = {
          name: 'test-role', // Same as created above
          description: 'Duplicate role name'
        };

        const response = await request(app)
          .post('/api/v1/roles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(roleData)
          .expect(409);

        expect(response.body).toHaveProperty('error', 'Conflict');
      });
    });

    describe('GET /api/v1/roles', () => {
      it('should return list of roles with admin privileges', async () => {
        const response = await request(app)
          .get('/api/v1/roles')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Roles retrieved successfully');
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/v1/roles?page=1&limit=5')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.pagination).toHaveProperty('page', 1);
        expect(response.body.pagination).toHaveProperty('limit', 5);
      });

      it('should deny access without admin privileges', async () => {
        await request(app)
          .get('/api/v1/roles')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });
    });

    describe('GET /api/v1/roles/:id', () => {
      it('should return role by ID with admin privileges', async () => {
        const response = await request(app)
          .get(`/api/v1/roles/${testRole.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Role retrieved successfully');
        expect(response.body.data).toHaveProperty('id', testRole.id);
        expect(response.body.data).toHaveProperty('name', 'test-role');
      });

      it('should return 404 for non-existent role', async () => {
        const response = await request(app)
          .get('/api/v1/roles/99999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body).toHaveProperty('error', 'Not found');
      });
    });

    describe('PUT /api/v1/roles/:id', () => {
      it('should update role with admin privileges', async () => {
        const updateData = {
          description: 'Updated test role description'
        };

        const response = await request(app)
          .put(`/api/v1/roles/${testRole.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Role updated successfully');
        expect(response.body.data).toHaveProperty('description', 'Updated test role description');
      });

      it('should prevent updating system roles', async () => {
        // Try to update admin role (assuming it exists and is protected)
        const updateData = {
          name: 'modified-admin'
        };

        // First get admin role ID
        const rolesResponse = await request(app)
          .get('/api/v1/roles')
          .set('Authorization', `Bearer ${adminToken}`);

        const adminRole = rolesResponse.body.data.find(role => role.name === 'admin');
        
        if (adminRole) {
          const response = await request(app)
            .put(`/api/v1/roles/${adminRole.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updateData)
            .expect(403);

          expect(response.body).toHaveProperty('error', 'Forbidden');
        }
      });
    });
  });

  describe('Permission Management', () => {
    describe('POST /api/v1/permissions', () => {
      it('should create a new permission with admin privileges', async () => {
        const permissionData = {
          name: 'test-permission',
          description: 'Test permission for unit tests',
          category: 'test'
        };

        const response = await request(app)
          .post('/api/v1/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(permissionData)
          .expect(201);

        expect(response.body).toHaveProperty('message', 'Permission created successfully');
        expect(response.body.data).toHaveProperty('name', 'test-permission');

        testPermission = response.body.data;
      });

      it('should validate permission name format', async () => {
        const permissionData = {
          name: 'Invalid Permission Name!', // Invalid characters
          description: 'Should be rejected'
        };

        const response = await request(app)
          .post('/api/v1/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(permissionData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });
    });

    describe('GET /api/v1/permissions', () => {
      it('should return list of permissions', async () => {
        const response = await request(app)
          .get('/api/v1/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should support category filtering', async () => {
        const response = await request(app)
          .get('/api/v1/permissions?category=test')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0]).toHaveProperty('category', 'test');
      });
    });
  });

  describe('Role-Permission Assignment', () => {
    describe('POST /api/v1/roles/:id/permissions', () => {
      it('should assign permission to role', async () => {
        const assignmentData = {
          permissionIds: [testPermission.id]
        };

        const response = await request(app)
          .post(`/api/v1/roles/${testRole.id}/permissions`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(assignmentData)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Permissions assigned successfully');
      });

      it('should prevent duplicate permission assignments', async () => {
        const assignmentData = {
          permissionIds: [testPermission.id] // Same permission as above
        };

        const response = await request(app)
          .post(`/api/v1/roles/${testRole.id}/permissions`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(assignmentData)
          .expect(409);

        expect(response.body).toHaveProperty('error', 'Conflict');
      });
    });

    describe('GET /api/v1/roles/:id/permissions', () => {
      it('should return role permissions', async () => {
        const response = await request(app)
          .get(`/api/v1/roles/${testRole.id}/permissions`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('DELETE /api/v1/roles/:roleId/permissions/:permissionId', () => {
      it('should remove permission from role', async () => {
        const response = await request(app)
          .delete(`/api/v1/roles/${testRole.id}/permissions/${testPermission.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Permission removed successfully');
      });
    });
  });

  describe('User Permission Checking', () => {
    describe('GET /api/v1/users/:id/permissions', () => {
      it('should return user effective permissions', async () => {
        const response = await request(app)
          .get(`/api/v1/users/${testUser.id}/permissions`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('permissions');
        expect(Array.isArray(response.body.data.permissions)).toBe(true);
      });
    });

    describe('POST /api/v1/users/check-permission', () => {
      it('should check if user has specific permission', async () => {
        const checkData = {
          userId: testUser.id,
          permission: 'users:view'
        };

        const response = await request(app)
          .post('/api/v1/users/check-permission')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(checkData)
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('hasPermission');
        expect(typeof response.body.data.hasPermission).toBe('boolean');
      });
    });
  });

  describe('Security Tests', () => {
    it('should require authentication for all RBAC endpoints', async () => {
      // Test without token
      await request(app)
        .get('/api/v1/roles')
        .expect(401);

      await request(app)
        .post('/api/v1/roles')
        .send({ name: 'test' })
        .expect(401);

      await request(app)
        .get('/api/v1/permissions')
        .expect(401);
    });

    it('should validate JWT token format', async () => {
      await request(app)
        .get('/api/v1/roles')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should prevent privilege escalation', async () => {
      // Regular user trying to create admin role
      const roleData = {
        name: 'fake-admin',
        description: 'Attempting privilege escalation'
      };

      await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(roleData)
        .expect(403);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid role ID gracefully', async () => {
      await request(app)
        .get('/api/v1/roles/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should handle empty permission arrays', async () => {
      const assignmentData = {
        permissionIds: []
      };

      const response = await request(app)
        .post(`/api/v1/roles/${testRole.id}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });

    it('should handle non-existent permission IDs', async () => {
      const assignmentData = {
        permissionIds: [99999]
      };

      const response = await request(app)
        .post(`/api/v1/roles/${testRole.id}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not found');
    });
  });
});
