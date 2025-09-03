# AI-Powered RMF System - Implementation Guide
## Practical Code Examples and UI Implementation

This guide provides concrete implementation examples for building the AI-powered Risk Management Framework system.

---

## Database Schema Implementation

### Drizzle Schema for RMF System
```typescript
// shared/rmf-schema.ts
import { pgTable, serial, varchar, text, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Core RMF Systems table
export const rmfSystems = pgTable('rmf_systems', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  systemType: varchar('system_type', { length: 100 }),
  categorization: jsonb('categorization'), // FIPS 199 data
  boundaryDescription: text('boundary_description'),
  status: varchar('status', { length: 50 }).default('planning'),
  aoId: integer('ao_id').references(() => users.id), // Authorizing Official
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// RMF Process Steps tracking
export const rmfProcessStatus = pgTable('rmf_process_status', {
  id: serial('id').primaryKey(),
  systemId: integer('system_id').references(() => rmfSystems.id),
  currentStep: integer('current_step').notNull(), // 1-6
  stepStatus: varchar('step_status', { length: 50 }).default('not_started'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  artifacts: jsonb('artifacts'), // Document references
  aiRecommendations: jsonb('ai_recommendations'),
  automationLevel: integer('automation_level').default(0) // 0-100%
});

// Control Implementation tracking
export const controlImplementations = pgTable('control_implementations', {
  id: serial('id').primaryKey(),
  systemId: integer('system_id').references(() => rmfSystems.id),
  controlId: varchar('control_id', { length: 50 }).notNull(), // AC-2, AU-1, etc.
  controlFamily: varchar('control_family', { length: 20 }), // AC, AU, CM, etc.
  implementationStatus: varchar('implementation_status', { length: 50 }),
  implementationDescription: text('implementation_description'),
  evidenceLinks: jsonb('evidence_links'),
  assessmentResults: jsonb('assessment_results'),
  aiAnalysis: jsonb('ai_analysis'),
  riskLevel: varchar('risk_level', { length: 20 }),
  implementationDate: timestamp('implementation_date'),
  lastAssessed: timestamp('last_assessed')
});

// POA&M (Plan of Action & Milestones) tracking
export const poamItems = pgTable('poam_items', {
  id: serial('id').primaryKey(),
  systemId: integer('system_id').references(() => rmfSystems.id),
  controlId: varchar('control_id', { length: 50 }),
  weaknessDescription: text('weakness_description'),
  riskLevel: varchar('risk_level', { length: 20 }),
  mitigationPlan: text('mitigation_plan'),
  scheduledCompletion: timestamp('scheduled_completion'),
  responsibleParty: varchar('responsible_party', { length: 255 }),
  status: varchar('status', { length: 50 }).default('open'),
  aiGenerated: boolean('ai_generated').default(false),
  estimatedCost: integer('estimated_cost'),
  businessImpact: text('business_impact')
});

// Document artifacts management
export const rmfDocuments = pgTable('rmf_documents', {
  id: serial('id').primaryKey(),
  systemId: integer('system_id').references(() => rmfSystems.id),
  documentType: varchar('document_type', { length: 100 }), // SSP, SAR, POA&M
  documentPath: varchar('document_path', { length: 500 }),
  version: integer('version').default(1),
  generatedByAi: boolean('generated_by_ai').default(false),
  approvalStatus: varchar('approval_status', { length: 50 }).default('draft'),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// AI-generated insights and recommendations
export const aiInsights = pgTable('ai_insights', {
  id: serial('id').primaryKey(),
  systemId: integer('system_id').references(() => rmfSystems.id),
  insightType: varchar('insight_type', { length: 100 }), // risk_analysis, control_recommendation, etc.
  priority: integer('priority'), // 1-5
  title: varchar('title', { length: 255 }),
  description: text('description'),
  recommendation: text('recommendation'),
  confidence: integer('confidence'), // 0-100%
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at').defaultNow()
});

// Relations
export const rmfSystemsRelations = relations(rmfSystems, ({ many, one }) => ({
  processStatus: many(rmfProcessStatus),
  controlImplementations: many(controlImplementations),
  poamItems: many(poamItems),
  documents: many(rmfDocuments),
  aiInsights: many(aiInsights),
  authorizingOfficial: one(users, {
    fields: [rmfSystems.aoId],
    references: [users.id]
  })
}));

// Export types
export type RMFSystem = typeof rmfSystems.$inferSelect;
export type InsertRMFSystem = typeof rmfSystems.$inferInsert;
export type ControlImplementation = typeof controlImplementations.$inferSelect;
export type POAMItem = typeof poamItems.$inferSelect;
export type RMFDocument = typeof rmfDocuments.$inferSelect;
export type AIInsight = typeof aiInsights.$inferSelect;
```

---

## Backend Services Implementation

### AI-Powered RMF Service
```typescript
// server/services/rmfService.ts
import OpenAI from 'openai';
import { RMFSystem, ControlImplementation, POAMItem } from '@shared/rmf-schema';

export class RMFService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }

  // Step 1: AI-Powered System Categorization
  async categorizeSystem(systemData: {
    name: string;
    description: string;
    dataTypes: string[];
    businessProcesses: string[];
  }): Promise<{
    confidentiality: 'low' | 'moderate' | 'high';
    integrity: 'low' | 'moderate' | 'high';
    availability: 'low' | 'moderate' | 'high';
    reasoning: string;
    confidence: number;
  }> {
    const prompt = `
    Analyze the following system for FIPS 199 categorization:
    
    System: ${systemData.name}
    Description: ${systemData.description}
    Data Types: ${systemData.dataTypes.join(', ')}
    Business Processes: ${systemData.businessProcesses.join(', ')}
    
    Provide categorization for:
    1. Confidentiality impact (low/moderate/high)
    2. Integrity impact (low/moderate/high) 
    3. Availability impact (low/moderate/high)
    
    Consider:
    - PII, PHI, financial data (confidentiality)
    - Critical business processes (integrity)
    - Service availability requirements (availability)
    
    Respond in JSON format with reasoning.
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  }

  // Step 2: AI Control Selection and Tailoring
  async selectControls(systemCategory: {
    confidentiality: string;
    integrity: string; 
    availability: string;
  }, systemContext: {
    environment: string;
    cloudProvider?: string;
    regulations: string[];
  }): Promise<{
    baselineControls: string[];
    additionalControls: string[];
    tailoringRecommendations: Array<{
      controlId: string;
      recommendation: string;
      rationale: string;
    }>;
  }> {
    // Determine baseline from highest impact level
    const impactLevels = [systemCategory.confidentiality, systemCategory.integrity, systemCategory.availability];
    const highestImpact = impactLevels.includes('high') ? 'high' : 
                         impactLevels.includes('moderate') ? 'moderate' : 'low';

    const baselineMap = {
      'low': ['AC-1', 'AC-2', 'AC-3', 'AC-7', 'AC-8', 'AU-1', 'AU-2', 'AU-3', 'AU-6', 'AU-9', 'AU-12'],
      'moderate': ['AC-1', 'AC-2', 'AC-3', 'AC-4', 'AC-5', 'AC-6', 'AC-7', 'AC-8', 'AC-11', 'AC-12', 'AC-14', 'AC-17', 'AC-18', 'AC-19', 'AC-20', 'AC-22'],
      'high': ['AC-1', 'AC-2', 'AC-3', 'AC-4', 'AC-5', 'AC-6', 'AC-7', 'AC-8', 'AC-11', 'AC-12', 'AC-14', 'AC-16', 'AC-17', 'AC-18', 'AC-19', 'AC-20', 'AC-21', 'AC-22', 'AC-23', 'AC-24', 'AC-25']
    };

    const prompt = `
    Based on system categorization (${highestImpact} impact) and context:
    Environment: ${systemContext.environment}
    Cloud Provider: ${systemContext.cloudProvider || 'None'}
    Regulations: ${systemContext.regulations.join(', ')}
    
    Recommend:
    1. Additional controls beyond baseline
    2. Control tailoring recommendations
    3. Compensating controls if needed
    
    Focus on practical implementation for this environment.
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const aiRecommendations = JSON.parse(response.choices[0].message.content);

    return {
      baselineControls: baselineMap[highestImpact],
      additionalControls: aiRecommendations.additionalControls || [],
      tailoringRecommendations: aiRecommendations.tailoringRecommendations || []
    };
  }

  // Step 4: AI-Powered Assessment and POA&M Generation
  async generatePOAM(findings: Array<{
    controlId: string;
    finding: string;
    severity: string;
    evidence: string;
  }>): Promise<POAMItem[]> {
    const poamItems: POAMItem[] = [];

    for (const finding of findings) {
      const prompt = `
      Create a POA&M item for this security finding:
      
      Control: ${finding.controlId}
      Finding: ${finding.finding}
      Severity: ${finding.severity}
      Evidence: ${finding.evidence}
      
      Generate:
      1. Clear weakness description
      2. Detailed mitigation plan with specific steps
      3. Realistic timeline for completion
      4. Required resources and responsible parties
      5. Risk level assessment
      6. Business impact if not remediated
      
      Provide actionable, specific recommendations.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const poamData = JSON.parse(response.choices[0].message.content);
      
      poamItems.push({
        controlId: finding.controlId,
        weaknessDescription: poamData.weaknessDescription,
        mitigationPlan: poamData.mitigationPlan,
        riskLevel: finding.severity,
        scheduledCompletion: new Date(Date.now() + (poamData.timelineDays * 24 * 60 * 60 * 1000)),
        responsibleParty: poamData.responsibleParty,
        status: 'open',
        aiGenerated: true,
        estimatedCost: poamData.estimatedCost,
        businessImpact: poamData.businessImpact
      } as POAMItem);
    }

    return poamItems;
  }

  // Document Generation Service
  async generateSSP(systemData: RMFSystem, controls: ControlImplementation[]): Promise<string> {
    const prompt = `
    Generate a comprehensive System Security Plan (SSP) for:
    
    System: ${systemData.name}
    Description: ${systemData.description}
    Type: ${systemData.systemType}
    Categorization: ${JSON.stringify(systemData.categorization)}
    
    Controls Implemented: ${controls.length} controls
    
    Include all required sections per NIST SP 800-18:
    1. System Identification
    2. System Categorization
    3. System Boundary
    4. System Environment
    5. Control Implementation Details
    6. Interconnections
    7. Appendices
    
    Generate professional, compliance-ready documentation.
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000
    });

    return response.choices[0].message.content;
  }

  // Risk Analysis Engine
  async analyzeRisk(systemId: number): Promise<{
    overallRiskScore: number;
    riskFactors: Array<{
      factor: string;
      impact: number;
      likelihood: number;
      mitigation: string;
    }>;
    recommendations: string[];
  }> {
    // Implementation would analyze current control implementations,
    // identified vulnerabilities, threat landscape, etc.
    // This is a simplified version
    
    const controls = await this.getControlImplementations(systemId);
    const poamItems = await this.getPOAMItems(systemId);
    
    const prompt = `
    Analyze risk for system with:
    - ${controls.length} implemented controls
    - ${poamItems.length} open POA&M items
    - ${poamItems.filter(p => p.riskLevel === 'high').length} high-risk findings
    
    Provide:
    1. Overall risk score (0-100)
    2. Key risk factors with impact/likelihood
    3. Specific mitigation recommendations
    4. Timeline for risk reduction
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  }

  // Helper methods (simplified)
  private async getControlImplementations(systemId: number): Promise<ControlImplementation[]> {
    // Database query to get control implementations
    return [];
  }

  private async getPOAMItems(systemId: number): Promise<POAMItem[]> {
    // Database query to get POA&M items
    return [];
  }
}
```

---

## Frontend Components Implementation

### Main RMF Dashboard Component
```tsx
// client/src/pages/rmf/RMFDashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface RMFDashboardProps {}

export const RMFDashboard: React.FC<RMFDashboardProps> = () => {
  const { data: systemsOverview } = useQuery({
    queryKey: ['/api/rmf/systems/overview'],
    queryFn: () => fetch('/api/rmf/systems/overview').then(res => res.json())
  });

  const { data: complianceMetrics } = useQuery({
    queryKey: ['/api/rmf/compliance/metrics'],
    queryFn: () => fetch('/api/rmf/compliance/metrics').then(res => res.json())
  });

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStepIcon = (step: number, status: string) => {
    if (status === 'completed') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'in_progress') return <Clock className="h-5 w-5 text-blue-500" />;
    return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Risk Management Framework</h1>
          <p className="text-gray-600">AI-Powered Compliance Management</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            New System
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            AI Assistant
          </button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Systems</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemsOverview?.totalSystems || 0}</div>
            <p className="text-xs text-muted-foreground">
              {systemsOverview?.newThisMonth || 0} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ATO Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceMetrics?.atoCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {complianceMetrics?.atoPercentage || 0}% of systems
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {complianceMetrics?.highRiskCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Immediate attention required
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Automation</CardTitle>
            <div className="h-4 w-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceMetrics?.automationLevel || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Process automation level
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Systems Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Systems */}
        <Card>
          <CardHeader>
            <CardTitle>Systems in RMF Process</CardTitle>
            <CardDescription>Current status and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemsOverview?.systems?.map((system: any) => (
                <div key={system.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{system.name}</h4>
                      <Badge className={getRiskBadgeColor(system.riskLevel)}>
                        {system.riskLevel}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{system.description}</p>
                    <div className="mt-2">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <span>Step {system.currentStep}/6:</span>
                        <span>{system.stepName}</span>
                      </div>
                      <Progress value={system.progress} className="mt-1" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                      <div key={step} className="flex flex-col items-center">
                        {getStepIcon(step, step <= system.currentStep ? 'completed' : 'pending')}
                        <span className="text-xs mt-1">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle>AI Insights & Recommendations</CardTitle>
            <CardDescription>Automated analysis and suggestions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complianceMetrics?.aiInsights?.map((insight: any) => (
                <div key={insight.id} className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-blue-900">{insight.title}</h4>
                    <Badge variant="outline">{insight.confidence}% confidence</Badge>
                  </div>
                  <p className="text-sm text-blue-800 mt-1">{insight.description}</p>
                  <div className="mt-2">
                    <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                      Apply Recommendation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Heatmap</CardTitle>
          <CardDescription>Control implementation status across systems</CardDescription>
        </CardHeader>
        <CardContent>
          <ComplianceHeatmap data={complianceMetrics?.heatmapData} />
        </CardContent>
      </Card>
    </div>
  );
};

// Compliance Heatmap Component
const ComplianceHeatmap: React.FC<{ data: any }> = ({ data }) => {
  const controlFamilies = ['AC', 'AU', 'AT', 'CM', 'CP', 'IA', 'IR', 'MA', 'MP', 'PS', 'PE', 'PL', 'PM', 'RA', 'SA', 'SC', 'SI', 'SR'];
  
  const getImplementationColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="grid grid-cols-9 gap-2">
      {controlFamilies.map((family) => (
        <div key={family} className="text-center">
          <div className="text-xs font-medium mb-2">{family}</div>
          <div 
            className={`h-8 w-full rounded ${getImplementationColor(
              data?.[family]?.implementationPercentage || 0
            )} flex items-center justify-center text-white text-xs font-medium`}
          >
            {data?.[family]?.implementationPercentage || 0}%
          </div>
        </div>
      ))}
    </div>
  );
};
```

### System Categorization Wizard
```tsx
// client/src/pages/rmf/SystemCategorizationWizard.tsx
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, CheckCircle } from 'lucide-react';

interface SystemCategorizationWizardProps {
  systemId?: number;
  onComplete: (categorization: any) => void;
}

export const SystemCategorizationWizard: React.FC<SystemCategorizationWizardProps> = ({
  systemId,
  onComplete
}) => {
  const [step, setStep] = useState(1);
  const [systemData, setSystemData] = useState({
    name: '',
    description: '',
    dataTypes: [] as string[],
    businessProcesses: [] as string[],
    environment: '',
    users: ''
  });
  const [categorization, setCategorization] = useState<any>(null);

  const categorizationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/rmf/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: (result) => {
      setCategorization(result);
      setStep(3);
    }
  });

  const handleAICategorization = () => {
    categorizationMutation.mutate(systemData);
  };

  const dataTypeOptions = [
    'Personally Identifiable Information (PII)',
    'Protected Health Information (PHI)', 
    'Financial Data',
    'Intellectual Property',
    'Government Classified',
    'Business Confidential',
    'Public Information'
  ];

  const processOptions = [
    'Financial Transactions',
    'Customer Service',
    'Human Resources',
    'Research & Development',
    'Operations Management',
    'Compliance Reporting',
    'External Communications'
  ];

  const getImpactColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {step > stepNum ? <CheckCircle className="h-5 w-5" /> : stepNum}
            </div>
            {stepNum < 3 && (
              <div className={`w-20 h-1 ${step > stepNum ? 'bg-blue-600' : 'bg-gray-300'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: System Information */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Provide basic information about your system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">System Name</label>
              <Input
                value={systemData.name}
                onChange={(e) => setSystemData({...systemData, name: e.target.value})}
                placeholder="Enter system name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">System Description</label>
              <Textarea
                value={systemData.description}
                onChange={(e) => setSystemData({...systemData, description: e.target.value})}
                placeholder="Describe the system's purpose and functionality"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Data Types Processed</label>
              <div className="grid grid-cols-2 gap-2">
                {dataTypeOptions.map((dataType) => (
                  <div key={dataType} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={dataType}
                      checked={systemData.dataTypes.includes(dataType)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSystemData({
                            ...systemData,
                            dataTypes: [...systemData.dataTypes, dataType]
                          });
                        } else {
                          setSystemData({
                            ...systemData,
                            dataTypes: systemData.dataTypes.filter(dt => dt !== dataType)
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor={dataType} className="text-sm">{dataType}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Business Processes</label>
              <div className="grid grid-cols-2 gap-2">
                {processOptions.map((process) => (
                  <div key={process} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={process}
                      checked={systemData.businessProcesses.includes(process)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSystemData({
                            ...systemData,
                            businessProcesses: [...systemData.businessProcesses, process]
                          });
                        } else {
                          setSystemData({
                            ...systemData,
                            businessProcesses: systemData.businessProcesses.filter(bp => bp !== process)
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor={process} className="text-sm">{process}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!systemData.name || !systemData.description}>
                Next: AI Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: AI Categorization */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>AI-Powered Categorization</span>
            </CardTitle>
            <CardDescription>Let AI analyze your system and recommend FIPS 199 categorization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-medium mb-4">System Summary</h3>
              <div className="space-y-3 text-sm">
                <div><strong>Name:</strong> {systemData.name}</div>
                <div><strong>Description:</strong> {systemData.description}</div>
                <div>
                  <strong>Data Types:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {systemData.dataTypes.map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">{type}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <strong>Business Processes:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {systemData.businessProcesses.map((process) => (
                      <Badge key={process} variant="outline" className="text-xs">{process}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button 
                onClick={handleAICategorization}
                disabled={categorizationMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {categorizationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing System...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </div>

            {categorizationMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Error during analysis. Please try again.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results and Review */}
      {step === 3 && categorization && (
        <Card>
          <CardHeader>
            <CardTitle>Categorization Results</CardTitle>
            <CardDescription>Review AI recommendations and approve categorization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <h4 className="font-medium mb-2">Confidentiality</h4>
                <Badge className={getImpactColor(categorization.confidentiality)}>
                  {categorization.confidentiality?.toUpperCase()}
                </Badge>
              </div>
              <div className="text-center">
                <h4 className="font-medium mb-2">Integrity</h4>
                <Badge className={getImpactColor(categorization.integrity)}>
                  {categorization.integrity?.toUpperCase()}
                </Badge>
              </div>
              <div className="text-center">
                <h4 className="font-medium mb-2">Availability</h4>
                <Badge className={getImpactColor(categorization.availability)}>
                  {categorization.availability?.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">AI Reasoning</h4>
              <p className="text-sm text-gray-700">{categorization.reasoning}</p>
              <div className="mt-2">
                <Badge variant="outline">
                  {categorization.confidence}% Confidence
                </Badge>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Re-analyze
              </Button>
              <Button onClick={() => onComplete(categorization)}>
                Approve Categorization
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

This implementation provides a solid foundation for building an AI-powered RMF system with modern React components, intelligent automation, and comprehensive database design. The system automates the most time-consuming aspects of RMF compliance while maintaining the rigor required for government and enterprise security standards.