# Policies and Procedures Management System Requirements

## System Overview

The Policies and Procedures Management System is a comprehensive governance platform within RAS-DASH designed for enterprise security policy lifecycle management, regulatory compliance documentation, and operational procedure standardization. This system supports AI-powered document generation, workflow-based approval processes, version control, and automated compliance mapping across multiple frameworks including NIST 800-53, FedRAMP, FISMA, and custom organizational standards.

## Core Functionality

### Policy Management
- **Policy Lifecycle Management**: Complete lifecycle from draft creation through approval, publication, review, and retirement
- **Version Control**: Comprehensive version tracking with change history and rollback capabilities
- **AI-Powered Generation**: Intelligent policy creation using system data, asset context, and compliance frameworks
- **Template Library**: Extensive library of policy templates for various compliance requirements
- **Approval Workflows**: Configurable approval processes with stakeholder notifications and tracking

### Procedure Management
- **Step-by-Step Documentation**: Detailed procedural documentation with structured step creation
- **Policy Linkage**: Direct association between procedures and governing policies
- **Resource Management**: Attachment support for supporting documentation, tools, and references
- **Role-Based Procedures**: Assignment of responsible roles and stakeholders for procedure execution
- **Automated Review Cycles**: Scheduled review processes with notification and tracking systems

### Document Generation
- **AI-Assisted Creation**: OpenAI GPT-4o integration for intelligent document generation
- **System-Aware Generation**: Context-aware generation using actual system assets and vulnerability data
- **Multi-Framework Support**: Support for NIST, FedRAMP, FISMA, SOX, HIPAA, and custom frameworks
- **Compliance Mapping**: Automatic mapping of policies to regulatory controls and requirements

### Administrative Interface
- **Comprehensive Dashboard**: Admin interface at `/policies` with full document management capabilities
- **Advanced Search**: Multi-field search across policies, procedures, content, and metadata
- **Review Management**: Centralized review tracking with overdue alerts and automated notifications
- **Workflow Management**: Visual workflow builder for custom approval and review processes

## Database Schema

### Policies Table
```sql
CREATE TABLE policies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category VARCHAR(100),
  policy_type VARCHAR(50) NOT NULL,
  version VARCHAR(20) DEFAULT '1.0',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'archived')),
  approved_at TIMESTAMP,
  approved_by INTEGER REFERENCES users(id),
  effective_date TIMESTAMP,
  review_date TIMESTAMP,
  metadata JSONB,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- AI Generation Fields
  system_id VARCHAR(255), -- UUID from ingestion_systems
  asset_ids JSONB, -- Array of asset UUIDs
  ai_prompt TEXT,
  ai_model VARCHAR(50),
  generation_source VARCHAR(50) DEFAULT 'manual' CHECK (generation_source IN ('manual', 'ai_generated', 'template')),
  template_type VARCHAR(100),
  compliance_framework VARCHAR(100),
  auto_update BOOLEAN DEFAULT false
);

CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_type ON policies(policy_type);
CREATE INDEX idx_policies_category ON policies(category);
CREATE INDEX idx_policies_review_date ON policies(review_date);
CREATE INDEX idx_policies_system_id ON policies(system_id);
CREATE INDEX idx_policies_compliance_framework ON policies(compliance_framework);
CREATE INDEX idx_policies_generation_source ON policies(generation_source);
```

### Procedures Table
```sql
CREATE TABLE procedures (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content TEXT,
  procedure_type VARCHAR(50) NOT NULL,
  related_policy_id INTEGER REFERENCES policies(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'archived')),
  version VARCHAR(20) DEFAULT '1.0',
  effective_date TIMESTAMP,
  review_date TIMESTAMP,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  steps JSONB, -- Array of structured procedure steps
  resources JSONB, -- Required tools, documents, access
  responsible_roles JSONB, -- Array of roles responsible for execution
  prerequisites JSONB, -- Prerequisites for procedure execution
  expected_outcomes JSONB, -- Success criteria and expected results
  exceptions JSONB, -- Conditions for procedure bypass
  metadata JSONB,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- AI Generation Fields
  system_id VARCHAR(255), -- UUID from ingestion_systems
  asset_ids JSONB, -- Array of asset UUIDs
  ai_prompt TEXT,
  ai_model VARCHAR(50),
  generation_source VARCHAR(50) DEFAULT 'manual' CHECK (generation_source IN ('manual', 'ai_generated', 'template')),
  template_type VARCHAR(100),
  auto_update BOOLEAN DEFAULT false
);

CREATE INDEX idx_procedures_status ON procedures(status);
CREATE INDEX idx_procedures_type ON procedures(procedure_type);
CREATE INDEX idx_procedures_policy_id ON procedures(related_policy_id);
CREATE INDEX idx_procedures_review_date ON procedures(review_date);
CREATE INDEX idx_procedures_system_id ON procedures(system_id);
CREATE INDEX idx_procedures_generation_source ON procedures(generation_source);
```

### Policy Templates Table
```sql
CREATE TABLE policy_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('policy', 'procedure', 'plan', 'guide')),
  category VARCHAR(100),
  framework VARCHAR(100), -- NIST, FedRAMP, FISMA, etc.
  template_content TEXT NOT NULL,
  ai_prompt_template TEXT,
  required_sections JSONB, -- Required document sections
  compliance_controls JSONB, -- Associated compliance controls
  asset_requirements JSONB, -- Required asset types/attributes
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_policy_templates_type ON policy_templates(document_type);
CREATE INDEX idx_policy_templates_framework ON policy_templates(framework);
CREATE INDEX idx_policy_templates_category ON policy_templates(category);
CREATE INDEX idx_policy_templates_active ON policy_templates(is_active);
```

### Policy Workflows Table
```sql
CREATE TABLE policy_workflows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  workflow_type VARCHAR(50) NOT NULL CHECK (workflow_type IN ('approval', 'review', 'publication', 'retirement')),
  steps JSONB NOT NULL, -- Workflow step definitions
  approval_roles JSONB, -- Roles required for approval at each step
  notification_config JSONB, -- Email/notification configuration
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_policy_workflows_type ON policy_workflows(workflow_type);
CREATE INDEX idx_policy_workflows_active ON policy_workflows(is_active);
```

### Policy Workflow History Table
```sql
CREATE TABLE policy_workflow_history (
  id SERIAL PRIMARY KEY,
  policy_id INTEGER REFERENCES policies(id) ON DELETE CASCADE,
  procedure_id INTEGER REFERENCES procedures(id) ON DELETE CASCADE,
  workflow_id INTEGER REFERENCES policy_workflows(id),
  current_step INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  assigned_to INTEGER REFERENCES users(id),
  comments TEXT,
  metadata JSONB,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_policy_workflow_history_policy_id ON policy_workflow_history(policy_id);
CREATE INDEX idx_policy_workflow_history_procedure_id ON policy_workflow_history(procedure_id);
CREATE INDEX idx_policy_workflow_history_status ON policy_workflow_history(status);
CREATE INDEX idx_policy_workflow_history_assigned_to ON policy_workflow_history(assigned_to);
```

## Sequelize Model Implementation

### Policy Model (server/models/Policy.ts)
```typescript
import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

export interface PolicyAttributes {
  id: number;
  title: string;
  description?: string;
  content: string;
  category?: string;
  policyType: string;
  version?: string;
  status: 'draft' | 'pending' | 'approved' | 'archived';
  approvedAt?: Date;
  approvedBy?: number;
  effectiveDate?: Date;
  reviewDate?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  
  // AI Generation Fields
  systemId?: string;
  assetIds?: string[];
  aiPrompt?: string;
  aiModel?: string;
  generationSource?: 'manual' | 'ai_generated' | 'template';
  templateType?: string;
  complianceFramework?: string;
  autoUpdate?: boolean;
}

export interface PolicyCreationAttributes extends Optional<PolicyAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class PolicyModel extends Model<PolicyAttributes, PolicyCreationAttributes> implements PolicyAttributes {
  public id!: number;
  public title!: string;
  public description?: string;
  public content!: string;
  public category?: string;
  public policyType!: string;
  public version?: string;
  public status!: 'draft' | 'pending' | 'approved' | 'archived';
  public approvedAt?: Date;
  public approvedBy?: number;
  public effectiveDate?: Date;
  public reviewDate?: Date;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public createdBy?: number;
  
  // AI Generation Fields
  public systemId?: string;
  public assetIds?: string[];
  public aiPrompt?: string;
  public aiModel?: string;
  public generationSource?: 'manual' | 'ai_generated' | 'template';
  public templateType?: string;
  public complianceFramework?: string;
  public autoUpdate?: boolean;
}

export const initPolicyModel = (sequelize: Sequelize): typeof PolicyModel => {
  PolicyModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      policyType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'policy_type'
      },
      version: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: '1.0'
      },
      status: {
        type: DataTypes.ENUM('draft', 'pending', 'approved', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approved_at'
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'approved_by',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      effectiveDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'effective_date'
      },
      reviewDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'review_date'
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
      },
      
      // AI Generation Fields
      systemId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'system_id'
      },
      assetIds: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'asset_ids'
      },
      aiPrompt: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'ai_prompt'
      },
      aiModel: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'ai_model'
      },
      generationSource: {
        type: DataTypes.ENUM('manual', 'ai_generated', 'template'),
        allowNull: true,
        defaultValue: 'manual',
        field: 'generation_source'
      },
      templateType: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'template_type'
      },
      complianceFramework: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'compliance_framework'
      },
      autoUpdate: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        field: 'auto_update'
      }
    },
    {
      sequelize,
      tableName: 'policies',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  return PolicyModel;
};
```

### Procedure Model (server/models/Procedure.ts)
```typescript
import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

export interface ProcedureAttributes {
  id: number;
  title: string;
  description?: string;
  content?: string;
  procedureType: string;
  relatedPolicyId?: number;
  status: 'draft' | 'pending' | 'approved' | 'archived';
  version?: string;
  effectiveDate?: Date;
  reviewDate?: Date;
  approvedBy?: number;
  approvedAt?: Date;
  steps?: any[];
  resources?: any[];
  responsibleRoles?: string[];
  prerequisites?: any[];
  expectedOutcomes?: any[];
  exceptions?: any[];
  metadata?: Record<string, any>;
  createdBy?: number;
  createdAt: Date;
  updatedAt: Date;
  
  // AI Generation Fields
  systemId?: string;
  assetIds?: string[];
  aiPrompt?: string;
  aiModel?: string;
  generationSource?: 'manual' | 'ai_generated' | 'template';
  templateType?: string;
  autoUpdate?: boolean;
}

export interface ProcedureCreationAttributes extends Optional<ProcedureAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class ProcedureModel extends Model<ProcedureAttributes, ProcedureCreationAttributes> implements ProcedureAttributes {
  public id!: number;
  public title!: string;
  public description?: string;
  public content?: string;
  public procedureType!: string;
  public relatedPolicyId?: number;
  public status!: 'draft' | 'pending' | 'approved' | 'archived';
  public version?: string;
  public effectiveDate?: Date;
  public reviewDate?: Date;
  public approvedBy?: number;
  public approvedAt?: Date;
  public steps?: any[];
  public resources?: any[];
  public responsibleRoles?: string[];
  public prerequisites?: any[];
  public expectedOutcomes?: any[];
  public exceptions?: any[];
  public metadata?: Record<string, any>;
  public createdBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // AI Generation Fields
  public systemId?: string;
  public assetIds?: string[];
  public aiPrompt?: string;
  public aiModel?: string;
  public generationSource?: 'manual' | 'ai_generated' | 'template';
  public templateType?: string;
  public autoUpdate?: boolean;
}

export const initProcedureModel = (sequelize: Sequelize): typeof ProcedureModel => {
  ProcedureModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      procedureType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'procedure_type'
      },
      relatedPolicyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'related_policy_id',
        references: {
          model: 'policies',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      status: {
        type: DataTypes.ENUM('draft', 'pending', 'approved', 'archived'),
        allowNull: false,
        defaultValue: 'draft',
      },
      version: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: '1.0'
      },
      effectiveDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'effective_date'
      },
      reviewDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'review_date'
      },
      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'approved_by',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'approved_at'
      },
      steps: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      resources: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      responsibleRoles: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'responsible_roles'
      },
      prerequisites: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      expectedOutcomes: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'expected_outcomes'
      },
      exceptions: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
      },
      
      // AI Generation Fields
      systemId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'system_id'
      },
      assetIds: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'asset_ids'
      },
      aiPrompt: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'ai_prompt'
      },
      aiModel: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'ai_model'
      },
      generationSource: {
        type: DataTypes.ENUM('manual', 'ai_generated', 'template'),
        allowNull: true,
        defaultValue: 'manual',
        field: 'generation_source'
      },
      templateType: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'template_type'
      },
      autoUpdate: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        field: 'auto_update'
      }
    },
    {
      sequelize,
      tableName: 'procedures',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  return ProcedureModel;
};
```

## Service Layer Implementation

### Policy Service (server/services/PolicyService.ts)
```typescript
import { PolicyModel, PolicyAttributes, PolicyCreationAttributes } from '../models/Policy';
import { ProcedureModel } from '../models/Procedure';
import { Op, WhereOptions } from 'sequelize';

export interface PolicyFilter {
  status?: string;
  policyType?: string;
  category?: string;
  complianceFramework?: string;
  generationSource?: string;
  search?: string;
  reviewDue?: boolean;
}

export interface PolicySearchOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  filters?: PolicyFilter;
}

export class PolicyService {
  
  /**
   * Get paginated list of policies with advanced filtering
   */
  async getPolicies(options: PolicySearchOptions = {}): Promise<{
    policies: PolicyAttributes[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'title',
      sortDirection = 'ASC',
      filters = {}
    } = options;
    
    const whereClause: WhereOptions = {};
    
    // Apply filters
    if (filters.status) {
      whereClause.status = filters.status;
    }
    
    if (filters.policyType) {
      whereClause.policyType = filters.policyType;
    }
    
    if (filters.category) {
      whereClause.category = filters.category;
    }
    
    if (filters.complianceFramework) {
      whereClause.complianceFramework = filters.complianceFramework;
    }
    
    if (filters.generationSource) {
      whereClause.generationSource = filters.generationSource;
    }
    
    if (filters.search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${filters.search}%` } },
        { description: { [Op.iLike]: `%${filters.search}%` } },
        { content: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }
    
    if (filters.reviewDue) {
      whereClause.reviewDate = {
        [Op.lte]: new Date()
      };
    }
    
    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await PolicyModel.findAndCountAll({
      where: whereClause,
      limit: pageSize,
      offset,
      order: [[sortBy, sortDirection]],
      distinct: true
    });
    
    return {
      policies: rows.map(row => row.toJSON()),
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize)
    };
  }
  
  /**
   * Get policy by ID with related procedures
   */
  async getPolicyById(id: number): Promise<PolicyAttributes & { procedures?: any[] } | null> {
    const policy = await PolicyModel.findByPk(id, {
      include: [
        {
          model: ProcedureModel,
          as: 'procedures',
          required: false
        }
      ]
    });
    
    return policy ? policy.toJSON() : null;
  }
  
  /**
   * Create new policy
   */
  async createPolicy(policyData: PolicyCreationAttributes): Promise<PolicyAttributes> {
    const policy = await PolicyModel.create(policyData);
    return policy.toJSON();
  }
  
  /**
   * Update existing policy
   */
  async updatePolicy(id: number, updates: Partial<PolicyCreationAttributes>): Promise<PolicyAttributes | null> {
    const [affectedRows] = await PolicyModel.update(
      { ...updates, updatedAt: new Date() },
      { where: { id } }
    );
    
    if (affectedRows === 0) {
      return null;
    }
    
    const updatedPolicy = await PolicyModel.findByPk(id);
    return updatedPolicy ? updatedPolicy.toJSON() : null;
  }
  
  /**
   * Delete policy
   */
  async deletePolicy(id: number): Promise<boolean> {
    const deletedRows = await PolicyModel.destroy({
      where: { id }
    });
    
    return deletedRows > 0;
  }
  
  /**
   * Get policies by status
   */
  async getPoliciesByStatus(status: string): Promise<PolicyAttributes[]> {
    const policies = await PolicyModel.findAll({
      where: { status },
      order: [['title', 'ASC']]
    });
    
    return policies.map(policy => policy.toJSON());
  }
  
  /**
   * Get policies requiring review
   */
  async getPoliciesRequiringReview(): Promise<PolicyAttributes[]> {
    const policies = await PolicyModel.findAll({
      where: {
        reviewDate: {
          [Op.lte]: new Date()
        },
        status: {
          [Op.ne]: 'archived'
        }
      },
      order: [['reviewDate', 'ASC']]
    });
    
    return policies.map(policy => policy.toJSON());
  }
  
  /**
   * Search policies with full-text search
   */
  async searchPolicies(searchTerm: string, options: PolicySearchOptions = {}): Promise<{
    policies: PolicyAttributes[];
    total: number;
  }> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'title',
      sortDirection = 'ASC'
    } = options;
    
    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await PolicyModel.findAndCountAll({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${searchTerm}%` } },
          { description: { [Op.iLike]: `%${searchTerm}%` } },
          { content: { [Op.iLike]: `%${searchTerm}%` } },
          { category: { [Op.iLike]: `%${searchTerm}%` } }
        ]
      },
      limit: pageSize,
      offset,
      order: [[sortBy, sortDirection]]
    });
    
    return {
      policies: rows.map(row => row.toJSON()),
      total: count
    };
  }
  
  /**
   * Approve policy
   */
  async approvePolicy(id: number, approvedBy: number): Promise<PolicyAttributes | null> {
    const [affectedRows] = await PolicyModel.update(
      {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date()
      },
      { where: { id } }
    );
    
    if (affectedRows === 0) {
      return null;
    }
    
    const approvedPolicy = await PolicyModel.findByPk(id);
    return approvedPolicy ? approvedPolicy.toJSON() : null;
  }
  
  /**
   * Archive policy
   */
  async archivePolicy(id: number): Promise<PolicyAttributes | null> {
    const [affectedRows] = await PolicyModel.update(
      {
        status: 'archived',
        updatedAt: new Date()
      },
      { where: { id } }
    );
    
    if (affectedRows === 0) {
      return null;
    }
    
    const archivedPolicy = await PolicyModel.findByPk(id);
    return archivedPolicy ? archivedPolicy.toJSON() : null;
  }
  
  /**
   * Get policy statistics
   */
  async getPolicyStatistics(): Promise<{
    totalPolicies: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    reviewsDue: number;
    recentlyUpdated: number;
  }> {
    const totalPolicies = await PolicyModel.count();
    
    const statusStats = await PolicyModel.findAll({
      attributes: ['status', [PolicyModel.sequelize!.fn('COUNT', PolicyModel.sequelize!.col('id')), 'count']],
      group: ['status'],
      raw: true
    });
    
    const typeStats = await PolicyModel.findAll({
      attributes: ['policyType', [PolicyModel.sequelize!.fn('COUNT', PolicyModel.sequelize!.col('id')), 'count']],
      group: ['policyType'],
      raw: true
    });
    
    const reviewsDue = await PolicyModel.count({
      where: {
        reviewDate: {
          [Op.lte]: new Date()
        },
        status: {
          [Op.ne]: 'archived'
        }
      }
    });
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentlyUpdated = await PolicyModel.count({
      where: {
        updatedAt: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });
    
    const byStatus: Record<string, number> = {};
    statusStats.forEach((stat: any) => {
      byStatus[stat.status] = parseInt(stat.count);
    });
    
    const byType: Record<string, number> = {};
    typeStats.forEach((stat: any) => {
      byType[stat.policyType] = parseInt(stat.count);
    });
    
    return {
      totalPolicies,
      byStatus,
      byType,
      reviewsDue,
      recentlyUpdated
    };
  }
}

export const policyService = new PolicyService();
```

### Policy Generator Service (server/services/PolicyGeneratorService.ts)
```typescript
import OpenAI from 'openai';
import { db } from '../db';
import { PolicyModel } from '../models/Policy';
import { ProcedureModel } from '../models/Procedure';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_MODEL_STR = "gpt-4o";

interface PolicyGenerationRequest {
  templateId: number;
  systemId: string;
  assetIds: string[];
  title: string;
  description?: string;
  customPrompt?: string;
  framework?: string;
  policyType?: string;
  procedureType?: string;
}

interface SystemContext {
  system: any;
  assets: any[];
  vulnerabilities: any[];
  controls: any[];
  riskProfile: any;
}

export class PolicyGeneratorService {
  
  /**
   * Generate AI-powered policy document
   */
  async generatePolicy(request: PolicyGenerationRequest): Promise<any> {
    // Get template details
    const template = await this.getTemplate(request.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Gather system context
    const context = await this.gatherSystemContext(request.systemId, request.assetIds);

    // Generate AI content
    const generatedContent = await this.generateWithAI(template, context, request);

    // Parse and structure content
    const structuredContent = this.parseGeneratedContent(generatedContent, template);

    // Create policy record
    const policy = await this.createPolicyRecord({
      ...request,
      template,
      content: structuredContent.content,
      sections: structuredContent.sections,
      generatedContent
    });

    return policy;
  }

  /**
   * Generate AI-powered procedure document
   */
  async generateProcedure(request: PolicyGenerationRequest): Promise<any> {
    // Get template details
    const template = await this.getTemplate(request.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Gather system context
    const context = await this.gatherSystemContext(request.systemId, request.assetIds);

    // Generate AI content with procedure-specific prompts
    const generatedContent = await this.generateProcedureWithAI(template, context, request);

    // Parse and structure content
    const structuredContent = this.parseProcedureContent(generatedContent, template);

    // Create procedure record
    const procedure = await this.createProcedureRecord({
      ...request,
      template,
      content: structuredContent.content,
      steps: structuredContent.steps,
      generatedContent
    });

    return procedure;
  }

  private async getTemplate(templateId: number): Promise<any> {
    const [template] = await db.execute(`
      SELECT * FROM policy_templates WHERE id = $1 AND is_active = true
    `, [templateId]);
    
    return template;
  }

  private async gatherSystemContext(systemId: string, assetIds: string[]): Promise<SystemContext> {
    // Get system information
    const [system] = await db.execute(`
      SELECT * FROM ingestion_systems WHERE uuid = $1
    `, [systemId]);

    // Get asset information
    const assets = await db.execute(`
      SELECT * FROM ingestion_assets 
      WHERE uuid = ANY($1) OR system_id = $2
    `, [assetIds, systemId]);

    // Get vulnerability data
    const vulnerabilities = await db.execute(`
      SELECT 
        v.*,
        COUNT(*) as vuln_count,
        AVG(CAST(cvss_score AS DECIMAL)) as avg_cvss,
        MAX(CAST(cvss_score AS DECIMAL)) as max_cvss
      FROM ingestion_vulnerabilities v
      WHERE v.system_id = $1 
        OR v.asset_id = ANY($2)
      GROUP BY v.id
      ORDER BY v.cvss_score DESC
      LIMIT 50
    `, [systemId, assetIds]);

    // Get relevant controls
    const controls = await db.execute(`
      SELECT * FROM ingestion_controls 
      WHERE system_id = $1
      ORDER BY priority DESC
      LIMIT 20
    `, [systemId]);

    // Calculate risk profile
    const riskProfile = await this.calculateRiskProfile(systemId, assetIds);

    return {
      system,
      assets,
      vulnerabilities,
      controls,
      riskProfile
    };
  }

  private async generateWithAI(template: any, context: SystemContext, request: PolicyGenerationRequest): Promise<string> {
    const prompt = this.buildPolicyPrompt(template, context, request);

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL_STR,
      messages: [
        {
          role: "system",
          content: `You are an expert cybersecurity policy writer with deep knowledge of compliance frameworks including NIST 800-53, FedRAMP, FISMA, SOX, and HIPAA. Generate comprehensive, professional security policies based on actual system data and vulnerability assessments.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || '';
  }

  private async generateProcedureWithAI(template: any, context: SystemContext, request: PolicyGenerationRequest): Promise<string> {
    const prompt = this.buildProcedurePrompt(template, context, request);

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL_STR,
      messages: [
        {
          role: "system",
          content: `You are an expert in creating detailed cybersecurity procedures and operational documentation. Generate step-by-step procedures that are actionable, specific, and tailored to the actual system environment and security controls.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || '';
  }

  private buildPolicyPrompt(template: any, context: SystemContext, request: PolicyGenerationRequest): string {
    return `
Generate a comprehensive ${request.framework || 'NIST'} security policy document with the following requirements:

TEMPLATE INFORMATION:
- Template: ${template.name}
- Framework: ${template.framework}
- Category: ${template.category}

SYSTEM CONTEXT:
- System: ${context.system?.name} (${context.system?.uuid})
- Description: ${context.system?.description}
- Environment: ${context.system?.environment}
- Classification: ${context.system?.classification}
- Asset Count: ${context.assets?.length || 0}
- Critical Vulnerabilities: ${context.vulnerabilities?.filter((v: any) => parseFloat(v.cvss_score) >= 7).length || 0}

POLICY REQUIREMENTS:
- Title: ${request.title}
- Description: ${request.description || 'Generate appropriate description'}
- Policy Type: ${request.policyType || 'security'}
- Custom Instructions: ${request.customPrompt || 'Follow standard best practices'}

RISK PROFILE:
- Risk Level: ${context.riskProfile?.level}
- Key Risk Factors: ${context.riskProfile?.factors?.join(', ')}
- Compliance Requirements: ${context.riskProfile?.complianceRequirements?.join(', ')}

Generate a policy document that includes:
1. Executive Summary
2. Purpose and Scope
3. Policy Statements
4. Roles and Responsibilities
5. Implementation Requirements
6. Compliance and Enforcement
7. Review and Maintenance

Ensure the policy addresses the specific vulnerabilities and risks identified in the system context.
    `;
  }

  private buildProcedurePrompt(template: any, context: SystemContext, request: PolicyGenerationRequest): string {
    return `
Generate a detailed cybersecurity procedure document with the following requirements:

TEMPLATE INFORMATION:
- Template: ${template.name}
- Framework: ${template.framework}
- Category: ${template.category}

SYSTEM CONTEXT:
- System: ${context.system?.name} (${context.system?.uuid})
- Environment: ${context.system?.environment}
- Assets: ${context.assets?.map((a: any) => a.name).join(', ')}
- Key Vulnerabilities: ${context.vulnerabilities?.slice(0, 5).map((v: any) => v.plugin_name).join(', ')}

PROCEDURE REQUIREMENTS:
- Title: ${request.title}
- Description: ${request.description || 'Generate appropriate description'}
- Procedure Type: ${request.procedureType || 'operational'}
- Custom Instructions: ${request.customPrompt || 'Follow standard operational procedures'}

Generate a procedure that includes:
1. Purpose and Scope
2. Prerequisites and Requirements
3. Detailed Step-by-Step Instructions
4. Required Tools and Resources
5. Responsible Roles
6. Expected Outcomes
7. Troubleshooting Guidelines
8. Compliance Checkpoints

Format the steps as numbered, actionable items with specific commands, configurations, or actions.
    `;
  }

  private parseGeneratedContent(content: string, template: any): { content: string; sections: any[] } {
    const sections: any[] = [];
    const lines = content.split('\n');
    let currentSection = '';
    let currentContent = '';

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Check if line is a section header (starts with number or ##)
      if (trimmedLine.match(/^\d+\.\s+/) || trimmedLine.startsWith('##')) {
        if (currentSection) {
          sections.push({
            title: currentSection,
            content: currentContent.trim()
          });
        }
        currentSection = trimmedLine.replace(/^\d+\.\s+|##\s+/, '');
        currentContent = '';
      } else {
        currentContent += line + '\n';
      }
    });

    // Add the last section
    if (currentSection) {
      sections.push({
        title: currentSection,
        content: currentContent.trim()
      });
    }

    return {
      content,
      sections
    };
  }

  private parseProcedureContent(content: string, template: any): { content: string; steps: any[] } {
    const steps: any[] = [];
    const lines = content.split('\n');
    let currentStep = 0;
    let currentStepContent = '';

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Check if line is a step (starts with number)
      if (trimmedLine.match(/^\d+\.\s+/)) {
        if (currentStep > 0) {
          steps.push({
            stepNumber: currentStep,
            instruction: currentStepContent.trim(),
            type: 'action'
          });
        }
        currentStep++;
        currentStepContent = trimmedLine.replace(/^\d+\.\s+/, '');
      } else if (currentStep > 0) {
        currentStepContent += ' ' + trimmedLine;
      }
    });

    // Add the last step
    if (currentStep > 0) {
      steps.push({
        stepNumber: currentStep,
        instruction: currentStepContent.trim(),
        type: 'action'
      });
    }

    return {
      content,
      steps
    };
  }

  private async createPolicyRecord(data: any): Promise<any> {
    const policy = await PolicyModel.create({
      title: data.title,
      description: data.description,
      content: data.content,
      policyType: data.policyType || 'security',
      status: 'draft',
      version: '1.0',
      systemId: data.systemId,
      assetIds: data.assetIds,
      aiPrompt: data.customPrompt,
      aiModel: DEFAULT_MODEL_STR,
      generationSource: 'ai_generated',
      templateType: data.template?.name,
      complianceFramework: data.framework,
      metadata: {
        template: data.template,
        generationMetadata: {
          generatedAt: new Date(),
          context: data.context
        }
      }
    });

    return policy.toJSON();
  }

  private async createProcedureRecord(data: any): Promise<any> {
    const procedure = await ProcedureModel.create({
      title: data.title,
      description: data.description,
      content: data.content,
      procedureType: data.procedureType || 'operational',
      status: 'draft',
      version: '1.0',
      steps: data.steps,
      systemId: data.systemId,
      assetIds: data.assetIds,
      aiPrompt: data.customPrompt,
      aiModel: DEFAULT_MODEL_STR,
      generationSource: 'ai_generated',
      templateType: data.template?.name,
      metadata: {
        template: data.template,
        generationMetadata: {
          generatedAt: new Date(),
          context: data.context
        }
      }
    });

    return procedure.toJSON();
  }

  private async calculateRiskProfile(systemId: string, assetIds: string[]): Promise<any> {
    // Calculate risk level based on vulnerabilities
    const [riskData] = await db.execute(`
      SELECT 
        COUNT(*) as total_vulns,
        COUNT(CASE WHEN CAST(cvss_score AS DECIMAL) >= 9 THEN 1 END) as critical_vulns,
        COUNT(CASE WHEN CAST(cvss_score AS DECIMAL) >= 7 THEN 1 END) as high_vulns,
        AVG(CAST(cvss_score AS DECIMAL)) as avg_cvss
      FROM ingestion_vulnerabilities
      WHERE system_id = $1 OR asset_id = ANY($2)
    `, [systemId, assetIds]);

    const level = riskData.critical_vulns > 0 ? 'Critical' : 
                  riskData.high_vulns > 5 ? 'High' : 
                  riskData.avg_cvss > 5 ? 'Medium' : 'Low';

    return {
      level,
      factors: [
        `${riskData.total_vulns} total vulnerabilities`,
        `${riskData.critical_vulns} critical vulnerabilities`,
        `Average CVSS: ${parseFloat(riskData.avg_cvss).toFixed(1)}`
      ],
      complianceRequirements: ['NIST 800-53', 'FedRAMP']
    };
  }

  /**
   * Get available templates
   */
  async getTemplates(category?: string): Promise<any[]> {
    let query = 'SELECT * FROM policy_templates WHERE is_active = true';
    const params = [];
    
    if (category) {
      query += ' AND category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY framework, document_type, name';
    
    const templates = await db.execute(query, params);
    return templates;
  }

  /**
   * Get generated documents
   */
  async getGeneratedDocuments(type: 'policy' | 'procedure', systemId?: string): Promise<any[]> {
    const table = type === 'policy' ? 'policies' : 'procedures';
    let query = `SELECT * FROM ${table} WHERE generation_source = 'ai_generated'`;
    const params = [];
    
    if (systemId) {
      query += ' AND system_id = $1';
      params.push(systemId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const documents = await db.execute(query, params);
    return documents;
  }

  /**
   * Get systems for document generation
   */
  async getSystems(): Promise<any[]> {
    const systems = await db.execute(`
      SELECT 
        uuid,
        name,
        description,
        classification,
        environment,
        criticality,
        owner,
        created_at,
        (SELECT COUNT(*) FROM ingestion_assets WHERE system_id = ingestion_systems.uuid) as asset_count,
        (SELECT COUNT(*) FROM ingestion_vulnerabilities WHERE system_id = ingestion_systems.uuid) as vulnerability_count
      FROM ingestion_systems 
      ORDER BY name
    `);
    
    return systems;
  }
}

export const policyGeneratorService = new PolicyGeneratorService();
```

## API Routes Implementation

### Policy Routes (server/routes/policyRoutes.ts)
```typescript
import { Router } from 'express';
import { z } from 'zod';
import { policyService } from '../services/PolicyService';
import { policyGeneratorService } from '../services/PolicyGeneratorService';

const router = Router();

// Validation schemas
const createPolicySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  content: z.string().min(1),
  category: z.string().optional(),
  policyType: z.string().min(1),
  version: z.string().default('1.0'),
  effectiveDate: z.string().datetime().optional(),
  reviewDate: z.string().datetime().optional(),
  systemId: z.string().optional(),
  assetIds: z.array(z.string()).optional(),
  complianceFramework: z.string().optional()
});

const updatePolicySchema = createPolicySchema.partial();

const generatePolicySchema = z.object({
  templateId: z.number(),
  systemId: z.string(),
  assetIds: z.array(z.string()),
  title: z.string().min(1),
  description: z.string().optional(),
  customPrompt: z.string().optional(),
  framework: z.string().optional(),
  policyType: z.string().optional()
});

/**
 * GET /api/policies
 * Get paginated list of policies with filtering
 */
router.get('/policies', async (req, res) => {
  try {
    const {
      page = '1',
      pageSize = '10',
      sortBy = 'title',
      sortDirection = 'ASC',
      status,
      policyType,
      category,
      complianceFramework,
      generationSource,
      search,
      reviewDue
    } = req.query;

    const options = {
      page: parseInt(page as string, 10),
      pageSize: parseInt(pageSize as string, 10),
      sortBy: sortBy as string,
      sortDirection: (sortDirection as string).toUpperCase() as 'ASC' | 'DESC',
      filters: {
        status: status as string,
        policyType: policyType as string,
        category: category as string,
        complianceFramework: complianceFramework as string,
        generationSource: generationSource as string,
        search: search as string,
        reviewDue: reviewDue === 'true'
      }
    };

    const result = await policyService.getPolicies(options);
    res.json(result);
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

/**
 * GET /api/policies/:id
 * Get policy by ID with related procedures
 */
router.get('/policies/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid policy ID' });
    }

    const policy = await policyService.getPolicyById(id);
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json(policy);
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ error: 'Failed to fetch policy' });
  }
});

/**
 * POST /api/policies
 * Create new policy
 */
router.post('/policies', async (req, res) => {
  try {
    const validatedData = createPolicySchema.parse(req.body);
    
    const policy = await policyService.createPolicy({
      ...validatedData,
      createdBy: req.user?.id // Assuming user is attached to request
    });

    res.status(201).json(policy);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating policy:', error);
    res.status(500).json({ error: 'Failed to create policy' });
  }
});

/**
 * PUT /api/policies/:id
 * Update existing policy
 */
router.put('/policies/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid policy ID' });
    }

    const validatedData = updatePolicySchema.parse(req.body);
    
    const policy = await policyService.updatePolicy(id, validatedData);
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json(policy);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating policy:', error);
    res.status(500).json({ error: 'Failed to update policy' });
  }
});

/**
 * DELETE /api/policies/:id
 * Delete policy
 */
router.delete('/policies/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid policy ID' });
    }

    const success = await policyService.deletePolicy(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({ error: 'Failed to delete policy' });
  }
});

/**
 * POST /api/policies/:id/approve
 * Approve policy
 */
router.post('/policies/:id/approve', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid policy ID' });
    }

    const policy = await policyService.approvePolicy(id, req.user?.id || 0);
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json(policy);
  } catch (error) {
    console.error('Error approving policy:', error);
    res.status(500).json({ error: 'Failed to approve policy' });
  }
});

/**
 * POST /api/policies/:id/archive
 * Archive policy
 */
router.post('/policies/:id/archive', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid policy ID' });
    }

    const policy = await policyService.archivePolicy(id);
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json(policy);
  } catch (error) {
    console.error('Error archiving policy:', error);
    res.status(500).json({ error: 'Failed to archive policy' });
  }
});

/**
 * GET /api/policies/search
 * Search policies
 */
router.get('/policies/search', async (req, res) => {
  try {
    const { q: searchTerm, page = '1', pageSize = '10' } = req.query;
    
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const options = {
      page: parseInt(page as string, 10),
      pageSize: parseInt(pageSize as string, 10)
    };

    const result = await policyService.searchPolicies(searchTerm as string, options);
    res.json(result);
  } catch (error) {
    console.error('Error searching policies:', error);
    res.status(500).json({ error: 'Failed to search policies' });
  }
});

/**
 * GET /api/policies/statistics
 * Get policy statistics
 */
router.get('/policies/statistics', async (req, res) => {
  try {
    const statistics = await policyService.getPolicyStatistics();
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching policy statistics:', error);
    res.status(500).json({ error: 'Failed to fetch policy statistics' });
  }
});

/**
 * GET /api/policies/reviews/due
 * Get policies requiring review
 */
router.get('/policies/reviews/due', async (req, res) => {
  try {
    const policies = await policyService.getPoliciesRequiringReview();
    res.json({ policies });
  } catch (error) {
    console.error('Error fetching policies requiring review:', error);
    res.status(500).json({ error: 'Failed to fetch policies requiring review' });
  }
});

/**
 * POST /api/policies/generate
 * Generate policy using AI
 */
router.post('/policies/generate', async (req, res) => {
  try {
    const validatedData = generatePolicySchema.parse(req.body);
    
    const policy = await policyGeneratorService.generatePolicy(validatedData);
    
    res.status(201).json(policy);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error generating policy:', error);
    res.status(500).json({ error: 'Failed to generate policy' });
  }
});

export default router;
```

## UI Components Implementation

### Policies Main Page (client/src/pages/policies/index.tsx)
```typescript
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { 
  FileText, 
  MoreVertical, 
  Plus, 
  Download, 
  FileEdit, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  CheckCircle,
  Clock,
  Archive,
  Sparkles
} from "lucide-react";

interface Policy {
  id: number;
  title: string;
  description?: string;
  content: string;
  category?: string;
  policyType: string;
  version?: string;
  status: 'draft' | 'pending' | 'approved' | 'archived';
  approvedAt?: string;
  approvedBy?: number;
  effectiveDate?: string;
  reviewDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  generationSource?: string;
  complianceFramework?: string;
}

export default function PoliciesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [frameworkFilter, setFrameworkFilter] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [editPolicy, setEditPolicy] = useState<any>(null);
  const [newPolicy, setNewPolicy] = useState({
    title: "",
    description: "",
    content: "",
    policyType: "security",
    category: "",
    complianceFramework: "",
    version: "1.0"
  });

  const pageSize = 10;

  // Fetch policies with filters
  const {
    data: policiesData,
    isLoading: isPoliciesLoading,
    error: policiesError,
  } = useQuery({
    queryKey: ['/api/policies', page, searchTerm, statusFilter, typeFilter, frameworkFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('policyType', typeFilter);
      if (frameworkFilter) params.append('complianceFramework', frameworkFilter);

      const response = await fetch(`/api/policies?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch policies');
      }
      return response.json();
    },
  });

  // Fetch policy statistics
  const { data: statisticsData } = useQuery({
    queryKey: ['/api/policies/statistics'],
    queryFn: async () => {
      const response = await fetch('/api/policies/statistics');
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      return response.json();
    },
  });

  // Create policy mutation
  const createPolicyMutation = useMutation({
    mutationFn: async (policyData: any) => {
      const response = await fetch('/api/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policyData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create policy: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/policies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/policies/statistics'] });
      setShowCreateDialog(false);
      toast({
        title: "Policy Created",
        description: "The new policy has been created successfully",
      });
      // Reset form
      setNewPolicy({
        title: "",
        description: "",
        content: "",
        policyType: "security",
        category: "",
        complianceFramework: "",
        version: "1.0"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to create policy: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Update policy mutation
  const updatePolicyMutation = useMutation({
    mutationFn: async (policyData: any) => {
      const response = await fetch(`/api/policies/${policyData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policyData),
      });

      if (!response.ok) {
        throw new Error('Failed to update policy');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/policies'] });
      setShowEditDialog(false);
      toast({
        title: "Policy Updated",
        description: "The policy has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update policy: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Delete policy mutation
  const deletePolicyMutation = useMutation({
    mutationFn: async (policyId: number) => {
      const response = await fetch(`/api/policies/${policyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete policy');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/policies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/policies/statistics'] });
      toast({
        title: "Policy Deleted",
        description: "The policy has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to delete policy: " + error.message,
        variant: "destructive",
      });
    }
  });

  // Approve policy mutation
  const approvePolicyMutation = useMutation({
    mutationFn: async (policyId: number) => {
      const response = await fetch(`/api/policies/${policyId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to approve policy');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/policies'] });
      toast({
        title: "Policy Approved",
        description: "The policy has been approved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to approve policy: " + error.message,
        variant: "destructive",
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800"><Archive className="w-3 h-3 mr-1" />Archived</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const getGenerationSourceBadge = (source?: string) => {
    if (source === 'ai_generated') {
      return <Badge className="bg-purple-100 text-purple-800"><Sparkles className="w-3 h-3 mr-1" />AI Generated</Badge>;
    }
    return null;
  };

  const handleCreatePolicy = () => {
    createPolicyMutation.mutate(newPolicy);
  };

  const handleUpdatePolicy = () => {
    updatePolicyMutation.mutate(editPolicy);
  };

  const handleDeletePolicy = (policyId: number) => {
    if (confirm('Are you sure you want to delete this policy?')) {
      deletePolicyMutation.mutate(policyId);
    }
  };

  const handleApprovePolicy = (policyId: number) => {
    approvePolicyMutation.mutate(policyId);
  };

  const openEditDialog = (policy: Policy) => {
    setEditPolicy({ ...policy });
    setShowEditDialog(true);
  };

  const openDetailsSheet = (policy: Policy) => {
    setSelectedPolicy(policy);
    setShowDetailsSheet(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Policies & Procedures</h1>
          <p className="text-muted-foreground">
            Manage security policies, compliance documentation, and operational procedures
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/policies/generator">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Generator
            </Link>
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Policy
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statisticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{statisticsData.totalPolicies}</div>
              <p className="text-xs text-muted-foreground">Total Policies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{statisticsData.byStatus?.approved || 0}</div>
              <p className="text-xs text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{statisticsData.reviewsDue}</div>
              <p className="text-xs text-muted-foreground">Reviews Due</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{statisticsData.recentlyUpdated}</div>
              <p className="text-xs text-muted-foreground">Recently Updated</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="administrative">Administrative</SelectItem>
              </SelectContent>
            </Select>
            <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Frameworks</SelectItem>
                <SelectItem value="NIST">NIST 800-53</SelectItem>
                <SelectItem value="FedRAMP">FedRAMP</SelectItem>
                <SelectItem value="FISMA">FISMA</SelectItem>
                <SelectItem value="SOX">SOX</SelectItem>
                <SelectItem value="HIPAA">HIPAA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Policies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Policies</CardTitle>
          <CardDescription>
            {policiesData ? `${policiesData.total} total policies` : 'Loading policies...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPoliciesLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : policiesError ? (
            <div className="text-center text-destructive">
              Failed to load policies. Please try again.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Framework</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Review Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policiesData?.policies?.map((policy: Policy) => (
                  <TableRow key={policy.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{policy.title}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {policy.description || 'No description'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{policy.policyType}</Badge>
                    </TableCell>
                    <TableCell>{policy.complianceFramework || '-'}</TableCell>
                    <TableCell>{getStatusBadge(policy.status)}</TableCell>
                    <TableCell>{policy.version}</TableCell>
                    <TableCell>
                      {policy.reviewDate ? formatDate(new Date(policy.reviewDate)) : '-'}
                    </TableCell>
                    <TableCell>{getGenerationSourceBadge(policy.generationSource)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetailsSheet(policy)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(policy)}>
                            <FileEdit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {policy.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleApprovePolicy(policy.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeletePolicy(policy.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Policy Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Policy</DialogTitle>
            <DialogDescription>
              Create a new security policy or compliance document
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="title" className="text-right">Title</label>
              <Input
                id="title"
                value={newPolicy.title}
                onChange={(e) => setNewPolicy({ ...newPolicy, title: e.target.value })}
                className="col-span-3"
                placeholder="Policy title"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="description" className="text-right">Description</label>
              <Textarea
                id="description"
                value={newPolicy.description}
                onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                className="col-span-3"
                placeholder="Policy description"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="type" className="text-right">Type</label>
              <Select value={newPolicy.policyType} onValueChange={(value) => setNewPolicy({ ...newPolicy, policyType: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select policy type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="administrative">Administrative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="framework" className="text-right">Framework</label>
              <Select value={newPolicy.complianceFramework} onValueChange={(value) => setNewPolicy({ ...newPolicy, complianceFramework: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select compliance framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NIST">NIST 800-53</SelectItem>
                  <SelectItem value="FedRAMP">FedRAMP</SelectItem>
                  <SelectItem value="FISMA">FISMA</SelectItem>
                  <SelectItem value="SOX">SOX</SelectItem>
                  <SelectItem value="HIPAA">HIPAA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="content" className="text-right">Content</label>
              <Textarea
                id="content"
                value={newPolicy.content}
                onChange={(e) => setNewPolicy({ ...newPolicy, content: e.target.value })}
                className="col-span-3 min-h-32"
                placeholder="Policy content"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePolicy} disabled={createPolicyMutation.isPending}>
              {createPolicyMutation.isPending ? 'Creating...' : 'Create Policy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Policy Details Sheet */}
      <Sheet open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
        <SheetContent className="w-[600px] sm:w-[800px]">
          <SheetHeader>
            <SheetTitle>{selectedPolicy?.title}</SheetTitle>
            <SheetDescription>
              Policy details and information
            </SheetDescription>
          </SheetHeader>
          {selectedPolicy && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Status</h4>
                  <p>{getStatusBadge(selectedPolicy.status)}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Type</h4>
                  <p>{selectedPolicy.policyType}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Version</h4>
                  <p>{selectedPolicy.version}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Framework</h4>
                  <p>{selectedPolicy.complianceFramework || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Created</h4>
                  <p>{formatDate(new Date(selectedPolicy.createdAt))}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Review Date</h4>
                  <p>{selectedPolicy.reviewDate ? formatDate(new Date(selectedPolicy.reviewDate)) : 'Not set'}</p>
                </div>
              </div>
              
              {selectedPolicy.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedPolicy.description}</p>
                </div>
              )}
              
              <div>
                <h4 className="font-semibold mb-2">Content</h4>
                <div className="border rounded p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{selectedPolicy.content}</pre>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
```

## System Features

### Policy Lifecycle Management
- **Multi-Stage Workflow**: Draft creation, stakeholder review, approval, publication, periodic review, and retirement
- **Version Control**: Comprehensive versioning with change tracking and rollback capabilities
- **Approval Workflows**: Configurable approval processes with role-based permissions and notifications
- **Review Management**: Automated review scheduling with overdue alerts and tracking

### AI-Powered Document Generation
- **Context-Aware Generation**: AI generation using actual system assets, vulnerabilities, and compliance requirements
- **Template-Based Creation**: Extensive template library for various compliance frameworks and document types
- **Custom Prompts**: Support for custom AI instructions to tailor document generation
- **Multi-Framework Support**: NIST 800-53, FedRAMP, FISMA, SOX, HIPAA, and custom organizational frameworks

### Advanced Search and Management
- **Multi-Field Search**: Search across titles, descriptions, content, and metadata
- **Advanced Filtering**: Filter by status, type, framework, generation source, and review status
- **Bulk Operations**: Batch approval, archival, and export capabilities
- **Export Options**: PDF, DOCX, and structured data export formats

### Compliance and Audit Features
- **Compliance Mapping**: Automatic mapping of policies to regulatory controls and requirements
- **Audit Trails**: Complete audit logging of all policy operations and changes
- **Review Tracking**: Comprehensive review history with comments and approval chains
- **Evidence Collection**: Automated evidence gathering for compliance audits

## Security & Performance Requirements

### Security Features
- **Role-Based Access Control**: Granular permissions for policy creation, editing, approval, and viewing
- **Data Encryption**: Encrypted storage of sensitive policy content and metadata
- **Audit Logging**: Complete audit trails for all policy operations and access
- **Document Integrity**: Version control and change tracking for document integrity

### Performance Optimizations
- **Database Indexing**: Optimized indexes for search, filtering, and sorting operations
- **Content Caching**: Redis caching for frequently accessed policies and templates
- **Pagination**: Efficient pagination for large policy databases
- **Background Processing**: Asynchronous AI generation and document processing

### Scalability Considerations
- **Horizontal Scaling**: Support for multiple application instances with shared storage
- **Database Optimization**: Query optimization for large-scale policy management
- **Document Storage**: Scalable document storage with CDN support
- **API Rate Limiting**: Protection against abuse and resource exhaustion

## Integration Points

### AI Service Integration
- **OpenAI API**: GPT-4o integration for intelligent document generation
- **Prompt Engineering**: Advanced prompt templates for different document types
- **Model Management**: Support for multiple AI models and fallback options
- **Cost Optimization**: Token usage tracking and optimization

### External System Integration
- **Asset Management**: Integration with asset discovery and vulnerability management systems
- **Compliance Tools**: Integration with GRC platforms and compliance management tools
- **Version Control**: GitLab/GitHub integration for policy version control
- **Document Management**: SharePoint, Confluence, and other document management systems

### Workflow Integration
- **Approval Systems**: Integration with enterprise approval workflow systems
- **Notification Services**: Email, Slack, Teams integration for notifications and alerts
- **Calendar Integration**: Review scheduling and reminder integration
- **Reporting Tools**: Integration with business intelligence and reporting platforms

This comprehensive documentation provides complete technical specifications for recreating the Policies and Procedures Management system in any compatible environment, maintaining consistency with the established documentation pattern for enterprise-grade system portability.