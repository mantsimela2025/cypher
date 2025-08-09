const axios = require('axios');
const { db } = require('../../db');
const { systems, controls, poams, controlPoams } = require('../../db/schema');
const { eq, and } = require('drizzle-orm');

/**
 * Xacta RM Pro API Integration Service
 * Mimics Xacta compliance and risk management functionality
 */
class XactaService {
  constructor() {
    this.baseUrl = process.env.XACTA_BASE_URL || 'http://localhost:5001/xacta';
    this.apiKey = process.env.XACTA_API_KEY || 'mock_api_key';
    this.username = process.env.XACTA_USERNAME || 'mock_user';
    this.password = process.env.XACTA_PASSWORD || 'mock_password';
    this.apiVersion = 'v2';
    this.rateLimitDelay = 100; // Reduced for mock server
    this.useMockData = !process.env.XACTA_API_KEY || process.env.NODE_ENV === 'test';
  }

  /**
   * Initialize Xacta API client
   */
  async initialize() {
    if (!this.apiKey || !this.username) {
      console.warn('Xacta API credentials not configured. Using mock data.');
      this.useMockData = true;
      return;
    }

    try {
      // Authenticate and get session token
      await this.authenticate();
      console.log('✅ Xacta API connection established');
    } catch (error) {
      console.error('❌ Xacta API connection failed:', error.message);
      this.useMockData = true;
    }
  }

  /**
   * Authenticate with Xacta API
   */
  async authenticate() {
    if (this.useMockData) return { token: 'mock-token' };

    const authData = {
      username: this.username,
      password: this.password,
      api_key: this.apiKey
    };

    const response = await axios.post(`${this.baseUrl}/auth/login`, authData);
    this.sessionToken = response.data.token;
    return response.data;
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    if (this.useMockData) {
      return this.getMockResponse(endpoint, method);
    }

    // For mock server (localhost:5001), don't use API version prefix
    const isMockServer = this.baseUrl.includes('localhost:5001');
    const apiPath = isMockServer ? endpoint : `/${this.apiVersion}${endpoint}`;

    const config = {
      method,
      url: `${this.baseUrl}${apiPath}`,
      headers: {
        'Authorization': `Bearer ${this.sessionToken || this.apiKey}`,
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      }
    };

    if (data) {
      config.data = data;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

    return await axios(config);
  }

  /**
   * Get mock response for development/testing
   */
  getMockResponse(endpoint, method) {
    const mockData = {
      '/controls': {
        controls: [
          {
            id: 'AC-1',
            family: 'Access Control',
            title: 'Access Control Policy and Procedures',
            description: 'The organization develops, documents, and disseminates access control policy and procedures.',
            baseline: 'Low',
            priority: 'P1',
            status: 'implemented',
            implementation_status: 'fully_implemented',
            assessment_status: 'assessed',
            responsible_role: 'Information System Security Officer',
            implementation_guidance: 'Develop comprehensive access control policies',
            assessment_procedures: 'Review access control documentation and procedures',
            references: ['NIST SP 800-53', 'FISMA'],
            last_assessed: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            next_assessment: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000)
          },
          {
            id: 'AC-2',
            family: 'Access Control',
            title: 'Account Management',
            description: 'The organization manages information system accounts.',
            baseline: 'Low',
            priority: 'P1',
            status: 'partially_implemented',
            implementation_status: 'partially_implemented',
            assessment_status: 'pending',
            responsible_role: 'System Administrator',
            implementation_guidance: 'Implement automated account management procedures',
            assessment_procedures: 'Review account management processes and controls',
            references: ['NIST SP 800-53'],
            last_assessed: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            next_assessment: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000)
          }
        ],
        pagination: {
          total: 2,
          limit: 50,
          offset: 0
        }
      },
      '/assessments': {
        assessments: [
          {
            id: 'assessment-001',
            name: 'Annual Security Assessment 2024',
            type: 'security_assessment',
            framework: 'NIST_800_53',
            status: 'in_progress',
            start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            target_completion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            assessor: 'Third Party Assessor',
            scope: 'Full system assessment',
            progress: 75,
            total_controls: 325,
            assessed_controls: 244,
            findings_count: 12
          }
        ]
      },
      '/findings': {
        findings: [
          {
            id: 'finding-001',
            control_id: 'AC-2',
            assessment_id: 'assessment-001',
            type: 'deficiency',
            severity: 'moderate',
            status: 'open',
            title: 'Incomplete Account Management Procedures',
            description: 'Account management procedures do not fully address automated account provisioning.',
            recommendation: 'Implement automated account provisioning and de-provisioning procedures.',
            risk_rating: 'moderate',
            likelihood: 'likely',
            impact: 'moderate',
            identified_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            target_closure: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            assigned_to: 'System Administrator',
            remediation_status: 'in_progress'
          }
        ]
      },
      '/poams': {
        poams: [
          {
            id: 'poam-001',
            control_id: 'AC-2',
            finding_id: 'finding-001',
            title: 'Implement Automated Account Management',
            description: 'Develop and implement automated account provisioning procedures',
            status: 'open',
            priority: 'high',
            risk_level: 'moderate',
            scheduled_completion: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            assigned_to: 'IT Security Team',
            estimated_cost: 25000,
            resources_required: 'Security engineer, System administrator',
            milestones: [
              {
                id: 1,
                description: 'Requirements analysis',
                due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                status: 'completed'
              },
              {
                id: 2,
                description: 'Tool selection and procurement',
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: 'in_progress'
              }
            ]
          }
        ]
      }
    };

    return { data: mockData[endpoint] || {} };
  }

  /**
   * Get systems with filtering
   */
  async getSystems(filters = {}) {
    const params = new URLSearchParams();

    if (filters.impact_level) params.append('impact_level', filters.impact_level);
    if (filters.status) params.append('status', filters.status);
    if (filters.system_type) params.append('system_type', filters.system_type);
    if (filters.limit) params.append('per_page', filters.limit);
    if (filters.page) params.append('page', filters.page);

    const endpoint = `/systems?${params.toString()}`;
    const response = await this.makeRequest(endpoint);

    return response.data;
  }

  /**
   * Get specific system by ID
   */
  async getSystem(systemId) {
    const response = await this.makeRequest(`/systems/${systemId}`);
    return response.data;
  }

  /**
   * Get assets for a specific system
   */
  async getSystemAssets(systemId) {
    const response = await this.makeRequest(`/systems/${systemId}/assets`);
    return response.data;
  }

  /**
   * Get system-asset relationships
   */
  async getSystemAssetRelationships(filters = {}) {
    const params = new URLSearchParams();

    if (filters.system_id) params.append('system_id', filters.system_id);
    if (filters.asset_uuid) params.append('asset_uuid', filters.asset_uuid);

    const endpoint = `/system-assets?${params.toString()}`;
    const response = await this.makeRequest(endpoint);

    return response.data;
  }

  /**
   * Get compliance controls
   */
  async getControls(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.family) params.append('family', filters.family);
    if (filters.baseline) params.append('baseline', filters.baseline);
    if (filters.status) params.append('status', filters.status);
    if (filters.assessment_status) params.append('assessment_status', filters.assessment_status);

    const endpoint = `/controls?${params.toString()}`;
    const response = await this.makeRequest(endpoint);
    
    return response.data;
  }

  /**
   * Get assessments
   */
  async getAssessments(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.framework) params.append('framework', filters.framework);

    const endpoint = `/assessments?${params.toString()}`;
    const response = await this.makeRequest(endpoint);
    
    return response.data;
  }

  /**
   * Get findings
   */
  async getFindings(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.control_id) params.append('control_id', filters.control_id);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.status) params.append('status', filters.status);
    if (filters.assessment_id) params.append('assessment_id', filters.assessment_id);

    const endpoint = `/findings?${params.toString()}`;
    const response = await this.makeRequest(endpoint);
    
    return response.data;
  }

  /**
   * Get POAMs (Plan of Action and Milestones)
   */
  async getPOAMs(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.control_id) params.append('control_id', filters.control_id);

    const endpoint = `/poams?${params.toString()}`;
    const response = await this.makeRequest(endpoint);
    
    return response.data;
  }

  /**
   * Create or update POAM
   */
  async createPOAM(poamData) {
    const response = await this.makeRequest('/poams', 'POST', poamData);
    return response.data;
  }

  /**
   * Update control implementation status
   */
  async updateControlStatus(controlId, statusData) {
    const response = await this.makeRequest(`/controls/${controlId}/status`, 'PUT', statusData);
    return response.data;
  }

  /**
   * Sync systems to local database
   */
  async syncSystems(filters = {}) {
    try {
      console.log('🔄 Syncing systems from Xacta...');

      const systemData = await this.getSystems(filters);
      const syncResults = {
        total: 0,
        created: 0,
        updated: 0,
        errors: []
      };

      for (const system of systemData.systems || []) {
        try {
          syncResults.total++;

          // Check if system already exists
          const [existing] = await db.select()
            .from(systems)
            .where(eq(systems.systemId, system.system_id));

          const systemRecord = {
            systemId: system.system_id,
            name: system.name,
            uuid: system.uuid,
            status: system.status,
            authorizationBoundary: system.authorization_boundary,
            systemType: system.system_type,
            responsibleOrganization: system.responsible_organization,
            systemOwner: system.system_owner,
            informationSystemSecurityOfficer: system.information_system_security_officer,
            authorizingOfficial: system.authorizing_official,
            lastAssessmentDate: system.last_assessment_date,
            authorizationDate: system.authorization_date,
            authorizationTerminationDate: system.authorization_termination_date,
            source: 'xacta',
            rawJson: system,
            confidentialityImpact: system.confidentiality_impact,
            integrityImpact: system.integrity_impact,
            availabilityImpact: system.availability_impact,
            updatedAt: new Date()
          };

          if (existing) {
            await db.update(systems)
              .set(systemRecord)
              .where(eq(systems.id, existing.id));
            syncResults.updated++;
          } else {
            await db.insert(systems).values({
              ...systemRecord,
              createdAt: new Date()
            });
            syncResults.created++;
          }

        } catch (error) {
          syncResults.errors.push({
            systemId: system.system_id,
            error: error.message
          });
        }
      }

      console.log(`✅ Xacta system sync completed: ${syncResults.created} created, ${syncResults.updated} updated`);
      return syncResults;

    } catch (error) {
      console.error('❌ Xacta system sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync compliance controls to local database
   */
  async syncControls(filters = {}) {
    try {
      console.log('🔄 Syncing compliance controls from Xacta...');

      const controlData = await this.getControls(filters);
      const syncResults = {
        total: 0,
        created: 0,
        updated: 0,
        errors: []
      };

      for (const control of controlData.controls || []) {
        try {
          syncResults.total++;

          // Check if control already exists
          const [existing] = await db.select()
            .from(controls)
            .where(and(
              eq(controls.systemId, control.system_id),
              eq(controls.controlId, control.id)
            ));

          const controlRecord = {
            systemId: control.system_id,
            controlId: control.id,
            controlTitle: control.title,
            family: control.family,
            priority: control.priority,
            implementationStatus: control.implementation_status,
            assessmentStatus: control.assessment_status,
            responsibleRole: control.responsible_role,
            lastAssessed: control.last_assessed,
            implementationGuidance: control.implementation_guidance,
            residualRisk: control.residual_risk,
            source: 'xacta',
            rawJson: control,
            updatedAt: new Date()
          };

          if (existing) {
            await db.update(controls)
              .set(controlRecord)
              .where(eq(controls.id, existing.id));
            syncResults.updated++;
          } else {
            await db.insert(controls).values({
              ...controlRecord,
              createdAt: new Date()
            });
            syncResults.created++;
          }

        } catch (error) {
          syncResults.errors.push({
            controlId: control.id,
            error: error.message
          });
        }
      }

      console.log(`✅ Xacta control sync completed: ${syncResults.created} created, ${syncResults.updated} updated`);
      return syncResults;

    } catch (error) {
      console.error('❌ Xacta control sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync POAMs to local database
   */
  async syncPOAMs(filters = {}) {
    try {
      console.log('🔄 Syncing POAMs from Xacta...');

      const poamData = await this.getPOAMs(filters);
      const syncResults = {
        total: 0,
        created: 0,
        updated: 0,
        errors: []
      };

      for (const poam of poamData.poams || []) {
        try {
          syncResults.total++;

          // Check if POAM already exists
          const [existing] = await db.select()
            .from(poams)
            .where(eq(poams.poamId, poam.id));

          const poamRecord = {
            poamId: poam.id,
            systemId: poam.system_id,
            weaknessDescription: poam.description,
            securityControl: poam.control_id,
            resources: poam.resources_required,
            scheduledCompletion: poam.scheduled_completion,
            poc: poam.assigned_to,
            status: poam.status,
            riskRating: poam.risk_level,
            likelihood: poam.likelihood,
            impact: poam.impact,
            mitigationStrategy: poam.remediation_plan,
            costEstimate: poam.estimated_cost?.toString(),
            source: 'xacta',
            rawJson: poam,
            updatedAt: new Date()
          };

          if (existing) {
            await db.update(poams)
              .set(poamRecord)
              .where(eq(poams.id, existing.id));
            syncResults.updated++;
          } else {
            await db.insert(poams).values({
              ...poamRecord,
              createdAt: new Date()
            });
            syncResults.created++;
          }

        } catch (error) {
          syncResults.errors.push({
            poamId: poam.id,
            error: error.message
          });
        }
      }

      console.log(`✅ Xacta POAM sync completed: ${syncResults.created} created, ${syncResults.updated} updated`);
      return syncResults;

    } catch (error) {
      console.error('❌ Xacta POAM sync failed:', error);
      throw error;
    }
  }

  /**
   * Get sync status and health
   */
  async getSyncStatus() {
    return {
      service: 'xacta',
      status: this.useMockData ? 'mock' : 'connected',
      lastSync: new Date(),
      apiVersion: this.apiVersion,
      sessionValid: !!this.sessionToken,
      health: 'healthy'
    };
  }
}

// Create and export singleton instance
const xactaService = new XactaService();

module.exports = xactaService;
