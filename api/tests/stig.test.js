const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/db');
const { users, stigLibrary, stigAssessments, stigFindings } = require('../src/db/schema');
const jwt = require('jsonwebtoken');

describe('STIG Service Tests', () => {
  let authToken;
  let adminToken;
  let testUser;
  let testAdmin;
  let testStigRule;
  let testAssessment;

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
        role: 'security-analyst',
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
    if (testAssessment) {
      await db.delete(stigFindings).where({ assessmentId: testAssessment.id });
      await db.delete(stigAssessments).where({ id: testAssessment.id });
    }
    if (testStigRule) {
      await db.delete(stigLibrary).where({ id: testStigRule.id });
    }
    await db.delete(users).where({ id: testAdmin.id });
    await db.delete(users).where({ id: testUser.id });
  });

  describe('STIG Library Management', () => {
    describe('POST /api/v1/stig/library', () => {
      it('should create a new STIG rule with valid data', async () => {
        const stigData = {
          stigId: 'V-12345',
          title: 'Test STIG Rule',
          description: 'This is a test STIG rule for unit testing',
          severity: 'medium',
          category: 'configuration',
          classification: 'unclassified',
          checkText: 'Verify that the test configuration is properly set',
          fixText: 'Configure the test setting according to security requirements',
          ruleVersion: '1.0',
          stigVersion: '1R1',
          releaseDate: '2024-01-15',
          source: 'DISA',
          tags: ['test', 'configuration', 'security'],
          references: [
            {
              type: 'NIST',
              identifier: 'AC-2',
              url: 'https://nvd.nist.gov/800-53/Rev4/control/AC-2'
            }
          ]
        };

        const response = await request(app)
          .post('/api/v1/stig/library')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(stigData)
          .expect(201);

        expect(response.body).toHaveProperty('message', 'STIG rule created successfully');
        expect(response.body.data).toHaveProperty('stigId', 'V-12345');
        expect(response.body.data).toHaveProperty('title', 'Test STIG Rule');
        expect(response.body.data).toHaveProperty('severity', 'medium');
        expect(response.body.data).toHaveProperty('category', 'configuration');

        testStigRule = response.body.data;
      });

      it('should validate required fields', async () => {
        const stigData = {
          title: 'Missing STIG ID',
          description: 'This should fail validation'
        };

        const response = await request(app)
          .post('/api/v1/stig/library')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(stigData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should validate STIG ID format', async () => {
        const stigData = {
          stigId: 'INVALID-FORMAT', // Should be V-XXXXX format
          title: 'Invalid STIG ID Format',
          description: 'Testing invalid STIG ID format',
          severity: 'low'
        };

        const response = await request(app)
          .post('/api/v1/stig/library')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(stigData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should prevent duplicate STIG IDs', async () => {
        const stigData = {
          stigId: 'V-12345', // Same as created above
          title: 'Duplicate STIG ID',
          description: 'This should fail due to duplicate STIG ID',
          severity: 'high'
        };

        const response = await request(app)
          .post('/api/v1/stig/library')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(stigData)
          .expect(409);

        expect(response.body).toHaveProperty('error', 'Conflict');
      });

      it('should require admin privileges', async () => {
        const stigData = {
          stigId: 'V-99999',
          title: 'Unauthorized STIG',
          description: 'Should not be created',
          severity: 'low'
        };

        await request(app)
          .post('/api/v1/stig/library')
          .set('Authorization', `Bearer ${authToken}`)
          .send(stigData)
          .expect(403);
      });
    });

    describe('GET /api/v1/stig/library', () => {
      it('should return list of STIG rules with pagination', async () => {
        const response = await request(app)
          .get('/api/v1/stig/library')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'STIG library retrieved successfully');
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should support filtering by severity', async () => {
        const response = await request(app)
          .get('/api/v1/stig/library?severity=medium')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        response.body.data.forEach(rule => {
          expect(rule.severity).toBe('medium');
        });
      });

      it('should support filtering by category', async () => {
        const response = await request(app)
          .get('/api/v1/stig/library?category=configuration')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        response.body.data.forEach(rule => {
          expect(rule.category).toBe('configuration');
        });
      });

      it('should support search functionality', async () => {
        const response = await request(app)
          .get('/api/v1/stig/library?search=Test STIG Rule')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.length).toBeGreaterThan(0);
        const found = response.body.data.some(rule => 
          rule.title.includes('Test STIG Rule') || 
          rule.description.includes('Test STIG Rule')
        );
        expect(found).toBe(true);
      });

      it('should support pagination parameters', async () => {
        const response = await request(app)
          .get('/api/v1/stig/library?page=1&limit=5')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.pagination).toHaveProperty('page', 1);
        expect(response.body.pagination).toHaveProperty('limit', 5);
        expect(response.body.data.length).toBeLessThanOrEqual(5);
      });
    });

    describe('GET /api/v1/stig/library/:id', () => {
      it('should return STIG rule by ID', async () => {
        const response = await request(app)
          .get(`/api/v1/stig/library/${testStigRule.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'STIG rule retrieved successfully');
        expect(response.body.data).toHaveProperty('id', testStigRule.id);
        expect(response.body.data).toHaveProperty('stigId', 'V-12345');
        expect(response.body.data).toHaveProperty('title', 'Test STIG Rule');
      });

      it('should return 404 for non-existent STIG rule', async () => {
        const response = await request(app)
          .get('/api/v1/stig/library/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body).toHaveProperty('error', 'Not found');
      });
    });

    describe('PUT /api/v1/stig/library/:id', () => {
      it('should update STIG rule with valid data', async () => {
        const updateData = {
          description: 'Updated test STIG rule description',
          checkText: 'Updated check text for verification',
          fixText: 'Updated fix text with new procedures'
        };

        const response = await request(app)
          .put(`/api/v1/stig/library/${testStigRule.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'STIG rule updated successfully');
        expect(response.body.data).toHaveProperty('description', 'Updated test STIG rule description');
        expect(response.body.data).toHaveProperty('checkText', 'Updated check text for verification');
      });

      it('should prevent updating STIG ID', async () => {
        const updateData = {
          stigId: 'V-99999' // Should not be allowed to change
        };

        const response = await request(app)
          .put(`/api/v1/stig/library/${testStigRule.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should require admin privileges', async () => {
        const updateData = {
          description: 'Unauthorized update'
        };

        await request(app)
          .put(`/api/v1/stig/library/${testStigRule.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(403);
      });
    });
  });

  describe('STIG Assessments', () => {
    describe('POST /api/v1/stig/assessments', () => {
      it('should create a new STIG assessment', async () => {
        const assessmentData = {
          name: 'Test STIG Assessment',
          description: 'Test assessment for unit testing',
          targetSystem: 'Test System',
          assessmentType: 'manual',
          stigVersion: '1R1',
          assessor: testUser.id,
          scheduledDate: '2024-02-01',
          dueDate: '2024-02-15',
          scope: ['V-12345'],
          metadata: {
            environment: 'test',
            priority: 'normal'
          }
        };

        const response = await request(app)
          .post('/api/v1/stig/assessments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(assessmentData)
          .expect(201);

        expect(response.body).toHaveProperty('message', 'STIG assessment created successfully');
        expect(response.body.data).toHaveProperty('name', 'Test STIG Assessment');
        expect(response.body.data).toHaveProperty('targetSystem', 'Test System');
        expect(response.body.data).toHaveProperty('status', 'pending');

        testAssessment = response.body.data;
      });

      it('should validate required fields', async () => {
        const assessmentData = {
          description: 'Missing name field'
        };

        const response = await request(app)
          .post('/api/v1/stig/assessments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(assessmentData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });

      it('should validate date formats', async () => {
        const assessmentData = {
          name: 'Invalid Date Assessment',
          targetSystem: 'Test System',
          scheduledDate: 'invalid-date'
        };

        const response = await request(app)
          .post('/api/v1/stig/assessments')
          .set('Authorization', `Bearer ${authToken}`)
          .send(assessmentData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });
    });

    describe('GET /api/v1/stig/assessments', () => {
      it('should return list of STIG assessments', async () => {
        const response = await request(app)
          .get('/api/v1/stig/assessments')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'STIG assessments retrieved successfully');
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should support filtering by status', async () => {
        const response = await request(app)
          .get('/api/v1/stig/assessments?status=pending')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        response.body.data.forEach(assessment => {
          expect(assessment.status).toBe('pending');
        });
      });

      it('should support filtering by assessor', async () => {
        const response = await request(app)
          .get(`/api/v1/stig/assessments?assessor=${testUser.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        response.body.data.forEach(assessment => {
          expect(assessment.assessor).toBe(testUser.id);
        });
      });
    });

    describe('PUT /api/v1/stig/assessments/:id/status', () => {
      it('should update assessment status', async () => {
        const statusData = {
          status: 'in_progress',
          notes: 'Starting assessment execution'
        };

        const response = await request(app)
          .put(`/api/v1/stig/assessments/${testAssessment.id}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(statusData)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Assessment status updated successfully');
        expect(response.body.data).toHaveProperty('status', 'in_progress');
      });

      it('should validate status transitions', async () => {
        const statusData = {
          status: 'invalid_status'
        };

        const response = await request(app)
          .put(`/api/v1/stig/assessments/${testAssessment.id}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(statusData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });
    });
  });

  describe('STIG Findings', () => {
    describe('POST /api/v1/stig/assessments/:id/findings', () => {
      it('should create a new finding for assessment', async () => {
        const findingData = {
          stigRuleId: testStigRule.id,
          status: 'open',
          severity: 'medium',
          finding: 'Configuration does not meet STIG requirements',
          recommendation: 'Update configuration according to STIG guidelines',
          evidence: {
            screenshots: [],
            logs: ['Configuration file shows non-compliant setting'],
            commands: ['cat /etc/config.conf']
          },
          affectedSystems: ['Test System'],
          estimatedEffort: 2,
          dueDate: '2024-02-20'
        };

        const response = await request(app)
          .post(`/api/v1/stig/assessments/${testAssessment.id}/findings`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(findingData)
          .expect(201);

        expect(response.body).toHaveProperty('message', 'STIG finding created successfully');
        expect(response.body.data).toHaveProperty('stigRuleId', testStigRule.id);
        expect(response.body.data).toHaveProperty('status', 'open');
        expect(response.body.data).toHaveProperty('severity', 'medium');
      });

      it('should validate finding data', async () => {
        const findingData = {
          // Missing required stigRuleId
          status: 'open',
          finding: 'Invalid finding without rule ID'
        };

        const response = await request(app)
          .post(`/api/v1/stig/assessments/${testAssessment.id}/findings`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(findingData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid request');
      });
    });

    describe('GET /api/v1/stig/assessments/:id/findings', () => {
      it('should return findings for assessment', async () => {
        const response = await request(app)
          .get(`/api/v1/stig/assessments/${testAssessment.id}/findings`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'STIG findings retrieved successfully');
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should support filtering by status', async () => {
        const response = await request(app)
          .get(`/api/v1/stig/assessments/${testAssessment.id}/findings?status=open`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        response.body.data.forEach(finding => {
          expect(finding.status).toBe('open');
        });
      });

      it('should support filtering by severity', async () => {
        const response = await request(app)
          .get(`/api/v1/stig/assessments/${testAssessment.id}/findings?severity=medium`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        response.body.data.forEach(finding => {
          expect(finding.severity).toBe('medium');
        });
      });
    });
  });

  describe('STIG Analytics', () => {
    describe('GET /api/v1/stig/analytics/overview', () => {
      it('should return STIG analytics overview', async () => {
        const response = await request(app)
          .get('/api/v1/stig/analytics/overview')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'STIG analytics retrieved successfully');
        expect(response.body.data).toHaveProperty('totalRules');
        expect(response.body.data).toHaveProperty('totalAssessments');
        expect(response.body.data).toHaveProperty('totalFindings');
        expect(response.body.data).toHaveProperty('complianceRate');
        expect(response.body.data).toHaveProperty('findingsBySeverity');
        expect(response.body.data).toHaveProperty('assessmentsByStatus');
      });
    });

    describe('GET /api/v1/stig/analytics/compliance-trends', () => {
      it('should return compliance trend data', async () => {
        const response = await request(app)
          .get('/api/v1/stig/analytics/compliance-trends')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Compliance trends retrieved successfully');
        expect(response.body.data).toHaveProperty('monthlyTrends');
        expect(response.body.data).toHaveProperty('categoryTrends');
        expect(response.body.data).toHaveProperty('severityTrends');
      });
    });
  });

  describe('Security and Permissions', () => {
    it('should require authentication for all endpoints', async () => {
      await request(app)
        .get('/api/v1/stig/library')
        .expect(401);

      await request(app)
        .post('/api/v1/stig/assessments')
        .send({ name: 'Test' })
        .expect(401);
    });

    it('should enforce role-based permissions', async () => {
      // Create a regular user token
      const regularUserToken = jwt.sign(
        { 
          id: testUser.id, 
          email: testUser.email, 
          role: 'user' // Regular user, not security-analyst
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      // Regular users should not be able to create STIG rules
      await request(app)
        .post('/api/v1/stig/library')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          stigId: 'V-99999',
          title: 'Unauthorized Rule',
          description: 'Should not be created',
          severity: 'low'
        })
        .expect(403);

      // Regular users should not be able to create assessments
      await request(app)
        .post('/api/v1/stig/assessments')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          name: 'Unauthorized Assessment',
          targetSystem: 'Test System'
        })
        .expect(403);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid assessment ID gracefully', async () => {
      await request(app)
        .get('/api/v1/stig/assessments/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should handle non-existent resources gracefully', async () => {
      await request(app)
        .get('/api/v1/stig/library/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      await request(app)
        .get('/api/v1/stig/assessments/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should validate complex nested data structures', async () => {
      const invalidFindingData = {
        stigRuleId: testStigRule.id,
        status: 'open',
        evidence: 'invalid-evidence-format', // Should be object
        affectedSystems: 'invalid-array-format' // Should be array
      };

      const response = await request(app)
        .post(`/api/v1/stig/assessments/${testAssessment.id}/findings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidFindingData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
    });
  });
});
