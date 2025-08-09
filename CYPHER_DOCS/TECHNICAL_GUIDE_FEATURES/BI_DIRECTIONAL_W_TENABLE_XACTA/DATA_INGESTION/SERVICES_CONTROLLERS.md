# Data Ingestion Services and Controllers

## Overview

This document provides comprehensive specifications for the Data Ingestion services and controllers, including all business logic, data processing methods, error handling, and API endpoint implementations. The architecture follows a layered approach with services handling business logic and controllers managing HTTP requests/responses.

## Architecture Pattern

```
HTTP Request → Controller → Service → Database
              ↓           ↓         ↓
           Validation   Business   Data
           Error        Logic      Persistence
           Handling     Processing
```

## Service Layer Implementation

### DataIngestionService

The core service class handling all data ingestion business logic.

#### File: `server/services/DataIngestionService.ts`

```typescript
import { db } from '../db';
import { 
  ingestionBatches, 
  ingestionAssets, 
  ingestionVulnerabilities,
  ingestionSystems,
  ingestionControls,
  ingestionPoams,
  ingestionErrors,
  ingestionDataQuality,
  type NewIngestionBatch,
  type NewIngestionAsset,
  type NewIngestionVulnerability,
  type IngestionStatistics
} from '@shared/schema';
import { eq, and, count, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class DataIngestionService {
  
  // ============================================================================
  // BATCH MANAGEMENT METHODS
  // ============================================================================

  /**
   * Creates a new ingestion batch for tracking data import operations
   * @param batchData - Batch configuration and metadata
   * @returns Promise<IngestionBatch> - Created batch record
   */
  async createBatch(batchData: {
    sourceSystem: string;
    batchType: string;
    fileName?: string;
    totalRecords?: number;
    createdBy: number;
    metadata?: any;
  }) {
    const batchId = uuidv4();
    
    const newBatch: NewIngestionBatch = {
      batchId,
      sourceSystem: batchData.sourceSystem,
      batchType: batchData.batchType,
      fileName: batchData.fileName,
      totalRecords: batchData.totalRecords,
      createdBy: batchData.createdBy,
      metadata: batchData.metadata
    };

    const [batch] = await db.insert(ingestionBatches).values(newBatch).returning();
    return batch;
  }

  /**
   * Updates batch status and statistics
   * @param batchId - UUID of the batch
   * @param updates - Status and statistics updates
   * @returns Promise<IngestionBatch> - Updated batch record
   */
  async updateBatchStatus(batchId: string, updates: {
    status?: string;
    successfulRecords?: number;
    failedRecords?: number;
    errorDetails?: string;
    completedAt?: Date;
  }) {
    const [updatedBatch] = await db
      .update(ingestionBatches)
      .set({
        ...updates,
        ...(updates.completedAt && { completedAt: updates.completedAt })
      })
      .where(eq(ingestionBatches.batchId, batchId))
      .returning();

    return updatedBatch;
  }

  /**
   * Retrieves batch status and processing statistics
   * @param batchId - UUID of the batch
   * @returns Promise<IngestionBatch | null> - Batch record with statistics
   */
  async getBatchStatus(batchId: string) {
    const [batch] = await db
      .select()
      .from(ingestionBatches)
      .where(eq(ingestionBatches.batchId, batchId));

    return batch || null;
  }

  // ============================================================================
  // TENABLE DATA INGESTION METHODS
  // ============================================================================

  /**
   * Processes and imports Tenable asset data
   * @param assetsData - Array of asset objects from Tenable export
   * @param batchId - UUID of the ingestion batch
   * @returns Promise<ProcessingResult> - Import statistics and results
   */
  async ingestTenableAssets(assetsData: any[], batchId: string) {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const assetData of assetsData) {
      try {
        results.processed++;

        // Validate required fields
        if (!assetData.id) {
          throw new Error('Asset ID is required');
        }

        // Transform Tenable data to internal schema
        const assetRecord = {
          assetUuid: assetData.id,
          hostname: assetData.hostname || null,
          netbiosName: assetData.netbios_name || null,
          systemId: assetData.system_id || null,
          hasAgent: assetData.has_agent || false,
          hasPluginResults: assetData.has_plugin_results || false,
          firstSeen: assetData.first_seen ? new Date(assetData.first_seen) : null,
          lastSeen: assetData.last_seen ? new Date(assetData.last_seen) : null,
          exposureScore: assetData.exposure_score || null,
          acrScore: assetData.acr_score ? parseFloat(assetData.acr_score) : null,
          criticalityRating: assetData.criticality_rating || null,
          ingestionSource: 'tenable',
          ingestionBatchId: batchId,
          rawJson: assetData
        };

        // Insert or update asset record
        await db
          .insert(ingestionAssets)
          .values(assetRecord)
          .onConflictDoUpdate({
            target: ingestionAssets.assetUuid,
            set: assetRecord
          });

        // Process related data (network interfaces, tags, etc.)
        await this.processAssetNetworkData(assetData.id, assetData.network_interfaces || []);
        await this.processAssetTags(assetData.id, assetData.tags || []);
        await this.processAssetOperatingSystems(assetData.id, assetData.operating_systems || []);

        results.successful++;

      } catch (error) {
        results.failed++;
        const errorRecord = {
          batchId,
          tableName: 'ingestion_assets',
          recordIdentifier: assetData.id || 'unknown',
          errorType: 'processing_error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          rawData: assetData
        };

        results.errors.push(errorRecord);
        await this.logIngestionError(errorRecord);
      }
    }

    // Update batch statistics
    await this.updateBatchStatus(batchId, {
      successfulRecords: results.successful,
      failedRecords: results.failed,
      status: results.failed > 0 ? 'completed_with_errors' : 'completed',
      completedAt: new Date()
    });

    return results;
  }

  /**
   * Processes and imports Tenable vulnerability data
   * @param vulnerabilitiesData - Array of vulnerability objects from Tenable export
   * @param batchId - UUID of the ingestion batch
   * @returns Promise<ProcessingResult> - Import statistics and results
   */
  async ingestTenableVulnerabilities(vulnerabilitiesData: any[], batchId: string) {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const vulnData of vulnerabilitiesData) {
      try {
        results.processed++;

        // Validate required fields
        if (!vulnData.plugin_id || !vulnData.asset_uuid) {
          throw new Error('Plugin ID and Asset UUID are required');
        }

        // Transform Tenable vulnerability data
        const vulnerabilityRecord = {
          batchId,
          pluginId: vulnData.plugin_id.toString(),
          vulnerabilityName: vulnData.plugin_name || 'Unknown Vulnerability',
          severity: this.normalizeSeverity(vulnData.severity),
          cvssScore: vulnData.cvss_base_score ? parseFloat(vulnData.cvss_base_score) : null,
          cvssVector: vulnData.cvss_vector || null,
          description: vulnData.description || null,
          solution: vulnData.solution || null,
          state: vulnData.state || 'Open',
          firstFound: vulnData.first_found ? new Date(vulnData.first_found) : null,
          lastFound: vulnData.last_found ? new Date(vulnData.last_found) : null,
          assetUuid: vulnData.asset_uuid,
          rawData: vulnData
        };

        // Insert vulnerability record
        const [insertedVuln] = await db
          .insert(ingestionVulnerabilities)
          .values(vulnerabilityRecord)
          .returning();

        // Process CVE mappings if present
        if (vulnData.cves && Array.isArray(vulnData.cves)) {
          await this.processVulnerabilityCves(insertedVuln.id, vulnData.cves, batchId);
        }

        results.successful++;

      } catch (error) {
        results.failed++;
        const errorRecord = {
          batchId,
          tableName: 'ingestion_vulnerabilities',
          recordIdentifier: `${vulnData.plugin_id}_${vulnData.asset_uuid}`,
          errorType: 'processing_error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          rawData: vulnData
        };

        results.errors.push(errorRecord);
        await this.logIngestionError(errorRecord);
      }
    }

    // Update batch statistics
    await this.updateBatchStatus(batchId, {
      successfulRecords: results.successful,
      failedRecords: results.failed,
      status: results.failed > 0 ? 'completed_with_errors' : 'completed',
      completedAt: new Date()
    });

    return results;
  }

  // ============================================================================
  // XACTA DATA INGESTION METHODS
  // ============================================================================

  /**
   * Processes and imports Xacta system data
   * @param systemsData - Array of system objects from Xacta export
   * @param batchId - UUID of the ingestion batch
   * @returns Promise<ProcessingResult> - Import statistics and results
   */
  async ingestXactaSystems(systemsData: any[], batchId: string) {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const systemData of systemsData) {
      try {
        results.processed++;

        // Validate required fields
        if (!systemData.system_id || !systemData.name) {
          throw new Error('System ID and Name are required');
        }

        // Transform Xacta system data
        const systemRecord = {
          systemId: systemData.system_id,
          name: systemData.name,
          uuid: systemData.uuid || uuidv4(),
          status: systemData.status || 'Active',
          authorizationBoundary: systemData.authorization_boundary || null,
          systemType: systemData.system_type || null,
          responsibleOrganization: systemData.responsible_organization || null,
          systemOwner: systemData.system_owner || null,
          informationSystemSecurityOfficer: systemData.isso || null,
          authorizingOfficial: systemData.authorizing_official || null,
          lastAssessmentDate: systemData.last_assessment_date ? new Date(systemData.last_assessment_date) : null,
          authorizationDate: systemData.authorization_date ? new Date(systemData.authorization_date) : null,
          authorizationTerminationDate: systemData.authorization_termination_date ? new Date(systemData.authorization_termination_date) : null,
          ingestionSource: 'xacta',
          ingestionBatchId: batchId,
          rawJson: systemData
        };

        // Insert or update system record
        await db
          .insert(ingestionSystems)
          .values(systemRecord)
          .onConflictDoUpdate({
            target: ingestionSystems.systemId,
            set: systemRecord
          });

        // Process system impact levels if present
        if (systemData.impact_levels) {
          await this.processSystemImpactLevels(systemData.system_id, systemData.impact_levels);
        }

        results.successful++;

      } catch (error) {
        results.failed++;
        const errorRecord = {
          batchId,
          tableName: 'ingestion_systems',
          recordIdentifier: systemData.system_id || 'unknown',
          errorType: 'processing_error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          rawData: systemData
        };

        results.errors.push(errorRecord);
        await this.logIngestionError(errorRecord);
      }
    }

    return results;
  }

  /**
   * Processes and imports Xacta control data
   * @param controlsData - Array of control objects from Xacta export
   * @param batchId - UUID of the ingestion batch
   * @returns Promise<ProcessingResult> - Import statistics and results
   */
  async ingestXactaControls(controlsData: any[], batchId: string) {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const controlData of controlsData) {
      try {
        results.processed++;

        // Validate required fields
        if (!controlData.control_id) {
          throw new Error('Control ID is required');
        }

        // Transform Xacta control data
        const controlRecord = {
          controlId: controlData.control_id,
          controlTitle: controlData.control_title || null,
          family: controlData.family || null,
          implementationStatus: controlData.implementation_status || 'Not Implemented',
          assessmentStatus: controlData.assessment_status || 'Not Assessed',
          controlOrigination: controlData.control_origination || null,
          implementationGuidance: controlData.implementation_guidance || null,
          assessmentProcedures: controlData.assessment_procedures || null,
          systemId: controlData.system_id || null,
          responsibleRole: controlData.responsible_role || null,
          lastAssessed: controlData.last_assessed ? new Date(controlData.last_assessed) : null,
          nextAssessmentDue: controlData.next_assessment_due ? new Date(controlData.next_assessment_due) : null,
          ingestionSource: 'xacta',
          ingestionBatchId: batchId,
          rawJson: controlData
        };

        // Insert control record
        const [insertedControl] = await db
          .insert(ingestionControls)
          .values(controlRecord)
          .returning();

        // Process control findings if present
        if (controlData.findings && Array.isArray(controlData.findings)) {
          await this.processControlFindings(insertedControl.id, controlData.findings);
        }

        // Process control evidence if present
        if (controlData.evidence && Array.isArray(controlData.evidence)) {
          await this.processControlEvidence(insertedControl.id, controlData.evidence);
        }

        results.successful++;

      } catch (error) {
        results.failed++;
        const errorRecord = {
          batchId,
          tableName: 'ingestion_controls',
          recordIdentifier: controlData.control_id || 'unknown',
          errorType: 'processing_error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          rawData: controlData
        };

        results.errors.push(errorRecord);
        await this.logIngestionError(errorRecord);
      }
    }

    return results;
  }

  /**
   * Processes and imports Xacta POAM data
   * @param poamsData - Array of POAM objects from Xacta export
   * @param batchId - UUID of the ingestion batch
   * @returns Promise<ProcessingResult> - Import statistics and results
   */
  async ingestXactaPoams(poamsData: any[], batchId: string) {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const poamData of poamsData) {
      try {
        results.processed++;

        // Validate required fields
        if (!poamData.poam_id) {
          throw new Error('POAM ID is required');
        }

        // Transform Xacta POAM data
        const poamRecord = {
          poamId: poamData.poam_id,
          systemId: poamData.system_id || null,
          weaknessDescription: poamData.weakness_description || null,
          weaknessDetectionSource: poamData.weakness_detection_source || null,
          remediationPlan: poamData.remediation_plan || null,
          resourcesRequired: poamData.resources_required || null,
          scheduledCompletion: poamData.scheduled_completion ? new Date(poamData.scheduled_completion) : null,
          milestoneChanges: poamData.milestone_changes || null,
          sourceOfDiscovery: poamData.source_of_discovery || null,
          status: poamData.status || 'Open',
          comments: poamData.comments || null,
          rawWeaknessDescription: poamData.raw_weakness_description || null,
          weaknessRiskLevel: poamData.weakness_risk_level || null,
          likelihood: poamData.likelihood || null,
          impact: poamData.impact || null,
          impactDescription: poamData.impact_description || null,
          residualRiskLevel: poamData.residual_risk_level || null,
          recommendations: poamData.recommendations || null,
          riskRating: poamData.risk_rating || null,
          ingestionSource: 'xacta',
          ingestionBatchId: batchId,
          rawJson: poamData
        };

        // Insert POAM record
        const [insertedPoam] = await db
          .insert(ingestionPoams)
          .values(poamRecord)
          .returning();

        // Process POAM milestones if present
        if (poamData.milestones && Array.isArray(poamData.milestones)) {
          await this.processPoamMilestones(poamData.poam_id, poamData.milestones);
        }

        // Process POAM asset associations if present
        if (poamData.affected_assets && Array.isArray(poamData.affected_assets)) {
          await this.processPoamAssets(poamData.poam_id, poamData.affected_assets);
        }

        // Process POAM CVE associations if present
        if (poamData.cves && Array.isArray(poamData.cves)) {
          await this.processPoamCves(poamData.poam_id, poamData.cves);
        }

        results.successful++;

      } catch (error) {
        results.failed++;
        const errorRecord = {
          batchId,
          tableName: 'ingestion_poams',
          recordIdentifier: poamData.poam_id || 'unknown',
          errorType: 'processing_error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          rawData: poamData
        };

        results.errors.push(errorRecord);
        await this.logIngestionError(errorRecord);
      }
    }

    return results;
  }

  // ============================================================================
  // STATISTICS AND REPORTING METHODS
  // ============================================================================

  /**
   * Generates comprehensive ingestion statistics
   * @returns Promise<IngestionStatistics> - System-wide ingestion metrics
   */
  async getIngestionStats(): Promise<IngestionStatistics> {
    // Get batch statistics
    const batchStats = await db
      .select({
        totalBatches: count(),
        successfulBatches: count(sql`CASE WHEN status = 'completed' THEN 1 END`),
        failedBatches: count(sql`CASE WHEN status = 'failed' THEN 1 END`)
      })
      .from(ingestionBatches);

    // Get record counts
    const [assetCount] = await db.select({ count: count() }).from(ingestionAssets);
    const [vulnerabilityCount] = await db.select({ count: count() }).from(ingestionVulnerabilities);
    const [controlCount] = await db.select({ count: count() }).from(ingestionControls);
    const [poamCount] = await db.select({ count: count() }).from(ingestionPoams);

    // Calculate average processing time
    const avgProcessingTime = await db
      .select({
        avgTime: sql<number>`AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))`
      })
      .from(ingestionBatches)
      .where(eq(ingestionBatches.status, 'completed'));

    return {
      totalBatches: batchStats[0]?.totalBatches || 0,
      successfulBatches: batchStats[0]?.successfulBatches || 0,
      failedBatches: batchStats[0]?.failedBatches || 0,
      totalAssets: assetCount.count,
      totalVulnerabilities: vulnerabilityCount.count,
      totalControls: controlCount.count,
      totalPoams: poamCount.count,
      averageProcessingTime: avgProcessingTime[0]?.avgTime || 0
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Normalizes severity values from different sources
   * @param severity - Raw severity value
   * @returns string - Normalized severity level
   */
  private normalizeSeverity(severity: any): string {
    if (typeof severity === 'number') {
      if (severity >= 10) return 'Critical';
      if (severity >= 7) return 'High';
      if (severity >= 4) return 'Medium';
      if (severity >= 0.1) return 'Low';
      return 'Info';
    }

    const severityStr = severity?.toString().toLowerCase();
    if (severityStr?.includes('critical')) return 'Critical';
    if (severityStr?.includes('high')) return 'High';
    if (severityStr?.includes('medium')) return 'Medium';
    if (severityStr?.includes('low')) return 'Low';
    return 'Info';
  }

  /**
   * Logs ingestion errors for troubleshooting and monitoring
   * @param errorData - Error details and context
   * @returns Promise<void>
   */
  private async logIngestionError(errorData: {
    batchId: string;
    tableName: string;
    recordIdentifier: string;
    errorType: string;
    errorMessage: string;
    rawData: any;
  }): Promise<void> {
    await db.insert(ingestionErrors).values(errorData);
  }

  // Additional utility methods for processing related data...
  // (processAssetNetworkData, processAssetTags, processVulnerabilityCves, etc.)
}

export const dataIngestionService = new DataIngestionService();
```

## Controller Layer Implementation

### DataIngestionController

The controller class handling HTTP requests and responses for data ingestion operations.

#### File: `server/controllers/DataIngestionController.ts`

```typescript
import { Request, Response } from 'express';
import { dataIngestionService } from '../services/DataIngestionService';
import { z } from 'zod';

// Validation schemas
const tenableAssetsSchema = z.array(z.object({
  id: z.string(),
  hostname: z.string().optional(),
  netbios_name: z.string().optional(),
  system_id: z.string().optional(),
  has_agent: z.boolean().optional(),
  exposure_score: z.number().optional()
}));

const tenableVulnerabilitiesSchema = z.array(z.object({
  plugin_id: z.union([z.string(), z.number()]),
  plugin_name: z.string(),
  asset_uuid: z.string(),
  severity: z.union([z.string(), z.number()]),
  cvss_base_score: z.number().optional(),
  state: z.string().optional()
}));

export class DataIngestionController {

  // ============================================================================
  // TENABLE INGESTION ENDPOINTS
  // ============================================================================

  /**
   * Ingests Tenable asset data
   * POST /api/ingestion/tenable/assets
   */
  async ingestTenableAssets(req: Request, res: Response) {
    try {
      // Validate request body
      const validatedData = tenableAssetsSchema.parse(req.body);
      
      // Get user ID from authenticated session
      const userId = req.user?.id || 1; // Default for testing

      // Create ingestion batch
      const batch = await dataIngestionService.createBatch({
        sourceSystem: 'tenable',
        batchType: 'assets',
        totalRecords: validatedData.length,
        createdBy: userId,
        metadata: { endpoint: 'tenable/assets', timestamp: new Date() }
      });

      // Process the asset data
      const results = await dataIngestionService.ingestTenableAssets(
        validatedData, 
        batch.batchId
      );

      res.status(200).json({
        success: true,
        batchId: batch.batchId,
        results: {
          processed: results.processed,
          successful: results.successful,
          failed: results.failed,
          errorCount: results.errors.length
        },
        message: `Processed ${results.processed} assets with ${results.successful} successful and ${results.failed} failed`
      });

    } catch (error) {
      console.error('Error ingesting Tenable assets:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
          message: 'Request body does not match expected schema'
        });
      }

      res.status(500).json({
        error: 'Internal server error ingesting Tenable assets',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  /**
   * Ingests Tenable vulnerability data
   * POST /api/ingestion/tenable/vulnerabilities
   */
  async ingestTenableVulnerabilities(req: Request, res: Response) {
    try {
      // Validate request body
      const validatedData = tenableVulnerabilitiesSchema.parse(req.body);
      
      // Get user ID from authenticated session
      const userId = req.user?.id || 1; // Default for testing

      // Create ingestion batch
      const batch = await dataIngestionService.createBatch({
        sourceSystem: 'tenable',
        batchType: 'vulnerabilities',
        totalRecords: validatedData.length,
        createdBy: userId,
        metadata: { endpoint: 'tenable/vulnerabilities', timestamp: new Date() }
      });

      // Process the vulnerability data
      const results = await dataIngestionService.ingestTenableVulnerabilities(
        validatedData, 
        batch.batchId
      );

      res.status(200).json({
        success: true,
        batchId: batch.batchId,
        results: {
          processed: results.processed,
          successful: results.successful,
          failed: results.failed,
          errorCount: results.errors.length
        },
        message: `Processed ${results.processed} vulnerabilities with ${results.successful} successful and ${results.failed} failed`
      });

    } catch (error) {
      console.error('Error ingesting Tenable vulnerabilities:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
          message: 'Request body does not match expected schema'
        });
      }

      res.status(500).json({
        error: 'Internal server error ingesting Tenable vulnerabilities',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  // ============================================================================
  // XACTA INGESTION ENDPOINTS
  // ============================================================================

  /**
   * Ingests Xacta system data
   * POST /api/ingestion/xacta/systems
   */
  async ingestXactaSystems(req: Request, res: Response) {
    try {
      const systemsData = req.body;
      
      if (!Array.isArray(systemsData)) {
        return res.status(400).json({
          error: 'Invalid request body',
          message: 'Expected an array of system objects'
        });
      }

      const userId = req.user?.id || 1;

      // Create ingestion batch
      const batch = await dataIngestionService.createBatch({
        sourceSystem: 'xacta',
        batchType: 'systems',
        totalRecords: systemsData.length,
        createdBy: userId,
        metadata: { endpoint: 'xacta/systems', timestamp: new Date() }
      });

      // Process the system data
      const results = await dataIngestionService.ingestXactaSystems(
        systemsData, 
        batch.batchId
      );

      res.status(200).json({
        success: true,
        batchId: batch.batchId,
        results: {
          processed: results.processed,
          successful: results.successful,
          failed: results.failed,
          errorCount: results.errors.length
        },
        message: `Processed ${results.processed} systems with ${results.successful} successful and ${results.failed} failed`
      });

    } catch (error) {
      console.error('Error ingesting Xacta systems:', error);
      res.status(500).json({
        error: 'Internal server error ingesting Xacta systems',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  /**
   * Ingests Xacta control data
   * POST /api/ingestion/xacta/controls
   */
  async ingestXactaControls(req: Request, res: Response) {
    try {
      const controlsData = req.body;
      
      if (!Array.isArray(controlsData)) {
        return res.status(400).json({
          error: 'Invalid request body',
          message: 'Expected an array of control objects'
        });
      }

      const userId = req.user?.id || 1;

      // Create ingestion batch
      const batch = await dataIngestionService.createBatch({
        sourceSystem: 'xacta',
        batchType: 'controls',
        totalRecords: controlsData.length,
        createdBy: userId,
        metadata: { endpoint: 'xacta/controls', timestamp: new Date() }
      });

      // Process the control data
      const results = await dataIngestionService.ingestXactaControls(
        controlsData, 
        batch.batchId
      );

      res.status(200).json({
        success: true,
        batchId: batch.batchId,
        results: {
          processed: results.processed,
          successful: results.successful,
          failed: results.failed,
          errorCount: results.errors.length
        },
        message: `Processed ${results.processed} controls with ${results.successful} successful and ${results.failed} failed`
      });

    } catch (error) {
      console.error('Error ingesting Xacta controls:', error);
      res.status(500).json({
        error: 'Internal server error ingesting Xacta controls',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  /**
   * Ingests Xacta POAM data
   * POST /api/ingestion/xacta/poams
   */
  async ingestXactaPoams(req: Request, res: Response) {
    try {
      const poamsData = req.body;
      
      if (!Array.isArray(poamsData)) {
        return res.status(400).json({
          error: 'Invalid request body',
          message: 'Expected an array of POAM objects'
        });
      }

      const userId = req.user?.id || 1;

      // Create ingestion batch
      const batch = await dataIngestionService.createBatch({
        sourceSystem: 'xacta',
        batchType: 'poams',
        totalRecords: poamsData.length,
        createdBy: userId,
        metadata: { endpoint: 'xacta/poams', timestamp: new Date() }
      });

      // Process the POAM data
      const results = await dataIngestionService.ingestXactaPoams(
        poamsData, 
        batch.batchId
      );

      res.status(200).json({
        success: true,
        batchId: batch.batchId,
        results: {
          processed: results.processed,
          successful: results.successful,
          failed: results.failed,
          errorCount: results.errors.length
        },
        message: `Processed ${results.processed} POAMs with ${results.successful} successful and ${results.failed} failed`
      });

    } catch (error) {
      console.error('Error ingesting Xacta POAMs:', error);
      res.status(500).json({
        error: 'Internal server error ingesting Xacta POAMs',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  // ============================================================================
  // MONITORING AND MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * Gets batch processing status
   * GET /api/ingestion/batch/:batchId/status
   */
  async getBatchStatus(req: Request, res: Response) {
    try {
      const { batchId } = req.params;

      if (!batchId) {
        return res.status(400).json({
          error: 'Missing batch ID',
          message: 'Batch ID is required in the URL path'
        });
      }

      const batch = await dataIngestionService.getBatchStatus(batchId);

      if (!batch) {
        return res.status(404).json({
          error: 'Batch not found',
          message: `No batch found with ID: ${batchId}`
        });
      }

      res.status(200).json({
        success: true,
        batch
      });

    } catch (error) {
      console.error('Error getting batch status:', error);
      res.status(500).json({
        error: 'Internal server error getting batch status',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  /**
   * Gets ingestion statistics
   * GET /api/ingestion/statistics
   */
  async getIngestionStats(req: Request, res: Response) {
    try {
      const stats = await dataIngestionService.getIngestionStats();

      res.status(200).json({
        success: true,
        statistics: stats
      });

    } catch (error) {
      console.error('Error getting ingestion stats:', error);
      res.status(500).json({
        error: 'Internal server error getting ingestion statistics',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  /**
   * Health check endpoint
   * GET /api/ingestion/health
   */
  async healthCheck(req: Request, res: Response) {
    try {
      res.status(200).json({
        success: true,
        message: 'Data ingestion service is healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
}

export const dataIngestionController = new DataIngestionController();
```

## Service Integration Examples

### Using the Services in Your Application

```typescript
// Example: Processing a large Tenable export file
import { dataIngestionService } from './services/DataIngestionService';
import fs from 'fs';

async function processTenable ExportFile(filePath: string, userId: number) {
  try {
    // Read and parse the export file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const exportData = JSON.parse(fileContent);

    // Process assets if present
    if (exportData.assets) {
      const assetBatch = await dataIngestionService.createBatch({
        sourceSystem: 'tenable',
        batchType: 'assets',
        fileName: path.basename(filePath),
        totalRecords: exportData.assets.length,
        createdBy: userId
      });

      const assetResults = await dataIngestionService.ingestTenableAssets(
        exportData.assets,
        assetBatch.batchId
      );
      
      console.log(`Asset ingestion completed: ${assetResults.successful}/${assetResults.processed} successful`);
    }

    // Process vulnerabilities if present
    if (exportData.vulnerabilities) {
      const vulnBatch = await dataIngestionService.createBatch({
        sourceSystem: 'tenable',
        batchType: 'vulnerabilities',
        fileName: path.basename(filePath),
        totalRecords: exportData.vulnerabilities.length,
        createdBy: userId
      });

      const vulnResults = await dataIngestionService.ingestTenableVulnerabilities(
        exportData.vulnerabilities,
        vulnBatch.batchId
      );
      
      console.log(`Vulnerability ingestion completed: ${vulnResults.successful}/${vulnResults.processed} successful`);
    }

  } catch (error) {
    console.error('Error processing Tenable export file:', error);
    throw error;
  }
}
```

## Error Handling Patterns

### Service-Level Error Handling
```typescript
// Example error handling in service methods
try {
  // Data processing logic
  const result = await processData(data);
  return result;
} catch (error) {
  // Log the error with context
  console.error('Service error:', {
    method: 'ingestTenableAssets',
    batchId: batchId,
    error: error.message,
    data: JSON.stringify(data).substring(0, 1000) // Truncate for logging
  });
  
  // Record error in database
  await this.logIngestionError({
    batchId,
    tableName: 'ingestion_assets',
    recordIdentifier: data.id || 'unknown',
    errorType: 'processing_error',
    errorMessage: error.message,
    rawData: data
  });
  
  // Re-throw for controller handling
  throw error;
}
```

### Controller-Level Error Handling
```typescript
// Example error handling in controller methods
try {
  // Service call
  const result = await dataIngestionService.ingestData(data);
  
  // Success response
  res.status(200).json({
    success: true,
    result
  });
  
} catch (error) {
  console.error('Controller error:', error);
  
  // Determine appropriate error response
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }
  
  if (error.message.includes('duplicate')) {
    return res.status(409).json({
      error: 'Duplicate data',
      message: 'This data has already been processed'
    });
  }
  
  // Generic server error
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
}
```

## Performance Considerations

### Batch Processing Optimization
- Process data in chunks to manage memory usage
- Use database transactions for data consistency
- Implement retry logic for transient failures
- Monitor processing times and optimize bottlenecks

### Database Connection Management
- Use connection pooling for high-volume ingestion
- Implement proper transaction boundaries
- Use bulk insert operations where possible
- Index strategy for query performance

---

This comprehensive service and controller implementation provides enterprise-grade data ingestion capabilities with robust error handling, validation, and monitoring features suitable for production deployment.