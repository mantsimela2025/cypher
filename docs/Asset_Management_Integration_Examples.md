# Asset Management - CYPHER Infrastructure Integration Examples

## Overview
This document provides detailed integration examples for implementing Asset Management using CYPHER's existing infrastructure for authentication, audit logging, notifications, and email services.

---

## 🔐 Authentication & RBAC Integration

### Asset-Specific Permissions Setup
```sql
-- Add asset management permissions to existing permissions table
INSERT INTO permissions (name, description, module) VALUES
('asset.view', 'View assets and asset details', 'asset_management'),
('asset.create', 'Create new assets', 'asset_management'),
('asset.edit', 'Edit existing assets', 'asset_management'),
('asset.delete', 'Delete assets (soft delete)', 'asset_management'),
('asset.bulk_operations', 'Perform bulk asset operations', 'asset_management'),
('asset.export', 'Export asset data to various formats', 'asset_management'),
('asset.import', 'Import asset data from files', 'asset_management'),
('asset.discovery', 'Run automated asset discovery scans', 'asset_management'),
('asset.admin', 'Full asset management administration', 'asset_management');

-- Assign permissions to existing roles
-- Admin role gets all permissions
INSERT INTO rolePermissions (roleId, permissionId)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'admin' AND p.module = 'asset_management';

-- User role gets view and basic operations
INSERT INTO rolePermissions (roleId, permissionId)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'user' AND p.name IN ('asset.view', 'asset.create', 'asset.edit');

-- Moderator role gets extended permissions
INSERT INTO rolePermissions (roleId, permissionId)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'moderator' AND p.name IN ('asset.view', 'asset.create', 'asset.edit', 'asset.export', 'asset.import');
```

### API Route Protection Examples
```javascript
// api/src/routes/assetManagement.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission, requireOwnershipOrAdmin, ensureAdmin } = require('../middleware/auth');
const assetController = require('../controllers/assetController');

// Basic CRUD operations with permission checks
router.get('/assets', [
  authenticateToken,
  requirePermission('asset.view')
], assetController.getAssets);

router.post('/assets', [
  authenticateToken,
  requirePermission('asset.create'),
  validateBody(createAssetSchema)
], assetController.createAsset);

router.get('/assets/:id', [
  authenticateToken,
  requirePermission('asset.view')
], assetController.getAsset);

router.put('/assets/:id', [
  authenticateToken,
  requirePermission('asset.edit'),
  requireOwnershipOrAdmin('asset') // Check if user owns asset or is admin
], assetController.updateAsset);

router.delete('/assets/:id', [
  authenticateToken,
  requirePermission('asset.delete'),
  requireOwnershipOrAdmin('asset')
], assetController.deleteAsset);

// Advanced operations with special permissions
router.post('/assets/bulk-update', [
  authenticateToken,
  requirePermission('asset.bulk_operations'),
  validateBody(bulkUpdateSchema)
], assetController.bulkUpdate);

router.post('/assets/import', [
  authenticateToken,
  requirePermission('asset.import'),
  upload.single('file')
], assetController.importAssets);

router.get('/assets/export', [
  authenticateToken,
  requirePermission('asset.export')
], assetController.exportAssets);

// Discovery operations (admin only)
router.post('/assets/discovery/start', [
  authenticateToken,
  requirePermission('asset.discovery'),
  ensureAdmin
], assetController.startDiscovery);

module.exports = router;
```

---

## 📋 Audit Logging Integration

### Asset Service with Audit Logging
```javascript
// api/src/services/AssetManagementService.js
const { auditLogService } = require('./AuditLogService');
const db = require('../db/connection');
const { assets } = require('../db/schema/assets');

class AssetManagementService {
  
  async createAsset(assetData, userId, req) {
    const transaction = await db.transaction();
    
    try {
      // Create the asset
      const [newAsset] = await transaction.insert(assets).values({
        ...assetData,
        createdBy: userId,
        createdAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date()
      }).returning();

      // Log the creation using existing AuditLogService
      await auditLogService.logUserAction(
        userId,
        'asset_created',
        'asset',
        newAsset.id,
        `Created asset: ${newAsset.name}`,
        {
          assetData: newAsset,
          assetType: newAsset.type,
          location: newAsset.location
        },
        req
      );

      await transaction.commit();
      return newAsset;
      
    } catch (error) {
      await transaction.rollback();
      
      // Log the failed attempt
      await auditLogService.logUserAction(
        userId,
        'asset_creation_failed',
        'asset',
        null,
        `Failed to create asset: ${error.message}`,
        { assetData, error: error.message },
        req
      );
      
      throw error;
    }
  }

  async updateAsset(assetId, updates, userId, req) {
    const transaction = await db.transaction();
    
    try {
      // Get the current asset for comparison
      const [currentAsset] = await transaction.select().from(assets).where(eq(assets.id, assetId));
      
      if (!currentAsset) {
        throw new Error('Asset not found');
      }

      // Update the asset
      const [updatedAsset] = await transaction
        .update(assets)
        .set({
          ...updates,
          updatedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(assets.id, assetId))
        .returning();

      // Log the update with old and new values
      await auditLogService.logUserAction(
        userId,
        'asset_updated',
        'asset',
        assetId,
        `Updated asset: ${updatedAsset.name}`,
        {
          oldValues: currentAsset,
          newValues: updatedAsset,
          changes: this.getChangedFields(currentAsset, updatedAsset)
        },
        req
      );

      await transaction.commit();
      return updatedAsset;
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async bulkUpdateAssets(assetIds, updates, userId, req) {
    const batchId = `bulk_${Date.now()}_${userId}`;
    const transaction = await db.transaction();
    
    try {
      const updatedAssets = [];
      
      for (const assetId of assetIds) {
        const [updatedAsset] = await transaction
          .update(assets)
          .set({
            ...updates,
            updatedBy: userId,
            updatedAt: new Date()
          })
          .where(eq(assets.id, assetId))
          .returning();
          
        updatedAssets.push(updatedAsset);
      }

      // Log bulk operation with batch ID
      await auditLogService.logUserAction(
        userId,
        'asset_bulk_updated',
        'asset',
        null,
        `Bulk updated ${assetIds.length} assets`,
        {
          batchId,
          assetIds,
          updates,
          affectedCount: updatedAssets.length
        },
        req
      );

      await transaction.commit();
      return { updatedAssets, batchId };
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteAsset(assetId, userId, req, permanent = false) {
    const transaction = await db.transaction();
    
    try {
      const [asset] = await transaction.select().from(assets).where(eq(assets.id, assetId));
      
      if (!asset) {
        throw new Error('Asset not found');
      }

      if (permanent) {
        // Hard delete
        await transaction.delete(assets).where(eq(assets.id, assetId));
        
        await auditLogService.logUserAction(
          userId,
          'asset_permanently_deleted',
          'asset',
          assetId,
          `Permanently deleted asset: ${asset.name}`,
          { deletedAsset: asset },
          req
        );
      } else {
        // Soft delete
        const [deletedAsset] = await transaction
          .update(assets)
          .set({
            deletedAt: new Date(),
            deletedBy: userId,
            updatedBy: userId,
            updatedAt: new Date()
          })
          .where(eq(assets.id, assetId))
          .returning();

        await auditLogService.logUserAction(
          userId,
          'asset_deleted',
          'asset',
          assetId,
          `Deleted asset: ${asset.name}`,
          { deletedAsset },
          req
        );
      }

      await transaction.commit();
      return asset;
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Helper method to identify changed fields
  getChangedFields(oldValues, newValues) {
    const changes = {};
    for (const key in newValues) {
      if (oldValues[key] !== newValues[key]) {
        changes[key] = {
          from: oldValues[key],
          to: newValues[key]
        };
      }
    }
    return changes;
  }
}

module.exports = new AssetManagementService();
```

### Asset Audit Event Constants
```javascript
// api/src/constants/assetAuditEvents.js
const ASSET_AUDIT_EVENTS = {
  // Basic CRUD operations
  ASSET_CREATED: 'asset_created',
  ASSET_UPDATED: 'asset_updated',
  ASSET_DELETED: 'asset_deleted',
  ASSET_RESTORED: 'asset_restored',
  ASSET_PERMANENTLY_DELETED: 'asset_permanently_deleted',
  
  // Bulk operations
  ASSET_BULK_CREATED: 'asset_bulk_created',
  ASSET_BULK_UPDATED: 'asset_bulk_updated',
  ASSET_BULK_DELETED: 'asset_bulk_deleted',
  
  // Import/Export operations
  ASSET_IMPORTED: 'asset_imported',
  ASSET_EXPORTED: 'asset_exported',
  ASSET_IMPORT_FAILED: 'asset_import_failed',
  
  // Discovery operations
  ASSET_DISCOVERY_STARTED: 'asset_discovery_started',
  ASSET_DISCOVERY_COMPLETED: 'asset_discovery_completed',
  ASSET_DISCOVERY_FAILED: 'asset_discovery_failed',
  
  // Assignment operations
  ASSET_ASSIGNED: 'asset_assigned',
  ASSET_UNASSIGNED: 'asset_unassigned',
  
  // Lifecycle events
  ASSET_STATUS_CHANGED: 'asset_status_changed',
  ASSET_WARRANTY_UPDATED: 'asset_warranty_updated',
  
  // Failed operations
  ASSET_CREATION_FAILED: 'asset_creation_failed',
  ASSET_UPDATE_FAILED: 'asset_update_failed',
  ASSET_DELETE_FAILED: 'asset_delete_failed'
};

module.exports = { ASSET_AUDIT_EVENTS };
```

---

## 🔔 Notification System Integration

### Asset Notification Templates
```javascript
// api/src/config/assetNotificationTemplates.js
const ASSET_NOTIFICATION_TEMPLATES = [
  {
    module: 'asset_management',
    eventType: 'asset_created',
    name: 'Asset Created',
    subject: 'New Asset Added: {{asset_name}}',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2c3e50;">New Asset Added</h2>
        <p>A new asset has been added to your inventory:</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <table style="width: 100%;">
            <tr><td><strong>Asset Name:</strong></td><td>{{asset_name}}</td></tr>
            <tr><td><strong>Type:</strong></td><td>{{asset_type}}</td></tr>
            <tr><td><strong>Serial Number:</strong></td><td>{{serial_number}}</td></tr>
            <tr><td><strong>Location:</strong></td><td>{{location}}</td></tr>
            <tr><td><strong>Added by:</strong></td><td>{{user_name}}</td></tr>
            <tr><td><strong>Date Added:</strong></td><td>{{created_date}}</td></tr>
          </table>
        </div>
        
        <p><a href="{{dashboard_url}}/assets/{{asset_id}}" style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Asset Details</a></p>
      </div>
    `,
    format: 'html',
    variables: ['asset_name', 'asset_type', 'serial_number', 'location', 'user_name', 'created_date', 'dashboard_url', 'asset_id'],
    channels: ['email', 'in_app'],
    conditions: {
      userPreferences: ['asset_notifications'],
      roles: ['admin', 'moderator']
    }
  },
  
  {
    module: 'asset_management',
    eventType: 'warranty_expiring',
    name: 'Warranty Expiring Soon',
    subject: '⚠️ Warranty Expiring Soon: {{asset_name}}',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #e74c3c;">⚠️ Warranty Expiring Soon</h2>
        <p>The warranty for one of your assets is expiring soon:</p>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <table style="width: 100%;">
            <tr><td><strong>Asset:</strong></td><td>{{asset_name}}</td></tr>
            <tr><td><strong>Serial Number:</strong></td><td>{{serial_number}}</td></tr>
            <tr><td><strong>Warranty Expires:</strong></td><td style="color: #e74c3c;"><strong>{{expiry_date}}</strong></td></tr>
            <tr><td><strong>Days Remaining:</strong></td><td style="color: #e74c3c;"><strong>{{days_remaining}}</strong></td></tr>
            <tr><td><strong>Vendor:</strong></td><td>{{vendor}}</td></tr>
            <tr><td><strong>Location:</strong></td><td>{{location}}</td></tr>
          </table>
        </div>
        
        <p><strong>Action Required:</strong> Please contact your vendor to renew the warranty or plan for asset replacement.</p>
        
        <p>
          <a href="{{dashboard_url}}/assets/{{asset_id}}" style="background: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">View Asset</a>
          <a href="{{dashboard_url}}/assets/{{asset_id}}/warranty" style="background: #f39c12; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Update Warranty</a>
        </p>
      </div>
    `,
    format: 'html',
    variables: ['asset_name', 'serial_number', 'expiry_date', 'days_remaining', 'vendor', 'location', 'dashboard_url', 'asset_id'],
    channels: ['email', 'slack', 'in_app'],
    priority: 'high',
    conditions: {
      userPreferences: ['warranty_alerts'],
      roles: ['admin', 'moderator', 'user']
    }
  },
  
  {
    module: 'asset_management',
    eventType: 'discovery_completed',
    name: 'Asset Discovery Completed',
    subject: '🔍 Asset Discovery Scan Complete - {{new_assets_count}} New Assets Found',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #27ae60;">🔍 Asset Discovery Completed</h2>
        <p>Your asset discovery scan has been completed successfully.</p>
        
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0;">Scan Results:</h3>
          <table style="width: 100%;">
            <tr><td><strong>Scan Type:</strong></td><td>{{scan_type}}</td></tr>
            <tr><td><strong>Duration:</strong></td><td>{{scan_duration}}</td></tr>
            <tr><td><strong>New Assets Found:</strong></td><td style="color: #27ae60;"><strong>{{new_assets_count}}</strong></td></tr>
            <tr><td><strong>Updated Assets:</strong></td><td>{{updated_assets_count}}</td></tr>
            <tr><td><strong>Total Scanned:</strong></td><td>{{total_scanned}}</td></tr>
          </table>
        </div>
        
        {{#if new_assets_count}}
        <p><strong>Next Steps:</strong> Review the newly discovered assets and verify their details.</p>
        {{/if}}
        
        <p><a href="{{dashboard_url}}/assets?filter=recently_discovered" style="background: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Discovered Assets</a></p>
      </div>
    `,
    format: 'html',
    variables: ['scan_type', 'scan_duration', 'new_assets_count', 'updated_assets_count', 'total_scanned', 'dashboard_url'],
    channels: ['email', 'slack', 'in_app'],
    conditions: {
      userPreferences: ['discovery_notifications'],
      roles: ['admin', 'moderator']
    }
  }
];

module.exports = { ASSET_NOTIFICATION_TEMPLATES };
```

### Asset Notification Service Integration
```javascript
// api/src/services/AssetNotificationService.js
const { notificationService } = require('./NotificationService');
const { emailService } = require('./EmailService');
const { ASSET_NOTIFICATION_TEMPLATES } = require('../config/assetNotificationTemplates');

class AssetNotificationService {

  constructor() {
    this.initializeTemplates();
  }

  async initializeTemplates() {
    // Create notification templates if they don't exist
    for (const template of ASSET_NOTIFICATION_TEMPLATES) {
      try {
        const existing = await notificationService.getTemplateByModuleAndEvent(
          template.module,
          template.eventType
        );

        if (!existing) {
          await notificationService.createTemplate(template, 1); // System user
          console.log(`✅ Created asset notification template: ${template.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create template ${template.name}:`, error);
      }
    }
  }

  async sendAssetCreatedNotification(asset, createdBy) {
    try {
      const templateData = {
        asset_name: asset.name,
        asset_type: asset.type,
        serial_number: asset.serialNumber || 'N/A',
        location: asset.location || 'Not specified',
        user_name: createdBy.firstName + ' ' + createdBy.lastName,
        created_date: new Date(asset.createdAt).toLocaleDateString(),
        dashboard_url: process.env.FRONTEND_URL || 'http://localhost:3000',
        asset_id: asset.id
      };

      // Send in-app notification
      await notificationService.createNotification({
        userId: null, // Broadcast to all users with permission
        title: `New Asset Added: ${asset.name}`,
        message: `Asset ${asset.name} has been added by ${templateData.user_name}`,
        type: 'info',
        module: 'asset_management',
        eventType: 'asset_created',
        metadata: { assetId: asset.id, templateData }
      });

      // Send email notifications to admins and moderators
      const adminUsers = await this.getUsersByRole(['admin', 'moderator']);
      for (const user of adminUsers) {
        if (user.preferences?.asset_notifications !== false) {
          await emailService.sendTemplatedEmail(
            user.email,
            'asset_created',
            templateData
          );
        }
      }

      console.log(`📧 Asset creation notifications sent for: ${asset.name}`);

    } catch (error) {
      console.error('Error sending asset created notification:', error);
    }
  }

  async sendWarrantyExpiringNotification(asset, daysRemaining) {
    try {
      const templateData = {
        asset_name: asset.name,
        serial_number: asset.serialNumber || 'N/A',
        expiry_date: new Date(asset.warrantyExpiry).toLocaleDateString(),
        days_remaining: daysRemaining,
        vendor: asset.vendor || 'Unknown',
        location: asset.location || 'Not specified',
        dashboard_url: process.env.FRONTEND_URL || 'http://localhost:3000',
        asset_id: asset.id
      };

      // Send high-priority notification
      await notificationService.createNotification({
        userId: null,
        title: `⚠️ Warranty Expiring: ${asset.name}`,
        message: `Warranty expires in ${daysRemaining} days`,
        type: 'warning',
        module: 'asset_management',
        eventType: 'warranty_expiring',
        priority: 'high',
        metadata: { assetId: asset.id, daysRemaining, templateData }
      });

      // Send email to all users who can manage assets
      const users = await this.getUsersWithPermission('asset.edit');
      for (const user of users) {
        if (user.preferences?.warranty_alerts !== false) {
          await emailService.sendTemplatedEmail(
            user.email,
            'warranty_expiring',
            templateData
          );
        }
      }

      // Send Slack notification if configured
      if (process.env.SLACK_WEBHOOK_URL) {
        await this.sendSlackNotification(
          `⚠️ Warranty expiring for ${asset.name} in ${daysRemaining} days`
        );
      }

      console.log(`⚠️ Warranty expiring notifications sent for: ${asset.name}`);

    } catch (error) {
      console.error('Error sending warranty expiring notification:', error);
    }
  }

  async sendDiscoveryCompletedNotification(discoveryResults, userId) {
    try {
      const templateData = {
        scan_type: discoveryResults.scanType,
        scan_duration: discoveryResults.duration,
        new_assets_count: discoveryResults.newAssetsCount,
        updated_assets_count: discoveryResults.updatedAssetsCount,
        total_scanned: discoveryResults.totalScanned,
        dashboard_url: process.env.FRONTEND_URL || 'http://localhost:3000'
      };

      // Send notification to the user who started the discovery
      await notificationService.createNotification({
        userId: userId,
        title: `🔍 Discovery Complete - ${discoveryResults.newAssetsCount} New Assets`,
        message: `Asset discovery found ${discoveryResults.newAssetsCount} new assets`,
        type: 'success',
        module: 'asset_management',
        eventType: 'discovery_completed',
        metadata: { discoveryResults, templateData }
      });

      // Send email notification
      const user = await this.getUserById(userId);
      if (user && user.preferences?.discovery_notifications !== false) {
        await emailService.sendTemplatedEmail(
          user.email,
          'discovery_completed',
          templateData
        );
      }

      console.log(`🔍 Discovery completion notifications sent`);

    } catch (error) {
      console.error('Error sending discovery completed notification:', error);
    }
  }

  // Helper methods
  async getUsersByRole(roles) {
    // Implementation would query users with specific roles
    // This integrates with your existing user management system
    return await db.select()
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(inArray(roles.name, roles));
  }

  async getUsersWithPermission(permission) {
    // Implementation would query users with specific permission
    // This integrates with your existing RBAC system
    return await db.select()
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
      .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(permissions.name, permission));
  }

  async getUserById(userId) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  async sendSlackNotification(message) {
    // Implementation for Slack notifications using existing webhook system
    if (process.env.SLACK_WEBHOOK_URL) {
      // Use existing webhook service
      await webhookService.sendWebhook(process.env.SLACK_WEBHOOK_URL, {
        text: message,
        channel: '#asset-management',
        username: 'CYPHER Asset Bot'
      });
    }
  }
}

module.exports = new AssetNotificationService();
```

---

## 📧 Email Service Integration

### Asset Email Templates
```javascript
// api/src/services/AssetEmailService.js
const { emailService } = require('./EmailService');
const { emailTemplateService } = require('./EmailTemplateService');

class AssetEmailService {

  constructor() {
    this.initializeEmailTemplates();
  }

  async initializeEmailTemplates() {
    const assetEmailTemplates = [
      {
        name: 'asset_created_email',
        description: 'Email notification for new asset creation',
        subject: 'New Asset Added: {{asset_name}}',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h2 style="color: #2c3e50; margin-bottom: 20px;">New Asset Added</h2>

              <p>Hello {{recipient_name}},</p>

              <p>A new asset has been added to the CYPHER Asset Management system:</p>

              <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0; font-weight: bold;">Asset Name:</td>
                    <td style="padding: 8px 0;">{{asset_name}}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0; font-weight: bold;">Type:</td>
                    <td style="padding: 8px 0;">{{asset_type}}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0; font-weight: bold;">Serial Number:</td>
                    <td style="padding: 8px 0;">{{serial_number}}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0; font-weight: bold;">Location:</td>
                    <td style="padding: 8px 0;">{{location}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Added by:</td>
                    <td style="padding: 8px 0;">{{user_name}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{dashboard_url}}/assets/{{asset_id}}"
                   style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View Asset Details
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

              <p style="color: #666; font-size: 12px;">
                This email was sent from the CYPHER Asset Management System.<br>
                If you no longer wish to receive these notifications, you can update your preferences in your user settings.
              </p>
            </div>
          </div>
        `,
        type: 'notification',
        status: 'active',
        variables: ['recipient_name', 'asset_name', 'asset_type', 'serial_number', 'location', 'user_name', 'dashboard_url', 'asset_id'],
        isHtml: true
      },

      {
        name: 'warranty_expiring_email',
        description: 'Email alert for expiring asset warranties',
        subject: '⚠️ URGENT: Warranty Expiring Soon - {{asset_name}}',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px;">
              <h2 style="color: #856404; margin-bottom: 20px;">⚠️ Warranty Expiring Soon</h2>

              <p>Hello {{recipient_name}},</p>

              <p><strong>URGENT:</strong> The warranty for one of your critical assets is expiring soon and requires immediate attention.</p>

              <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0; font-weight: bold;">Asset:</td>
                    <td style="padding: 8px 0;">{{asset_name}}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0; font-weight: bold;">Serial Number:</td>
                    <td style="padding: 8px 0;">{{serial_number}}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0; font-weight: bold;">Warranty Expires:</td>
                    <td style="padding: 8px 0; color: #dc3545; font-weight: bold;">{{expiry_date}}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0; font-weight: bold;">Days Remaining:</td>
                    <td style="padding: 8px 0; color: #dc3545; font-weight: bold; font-size: 18px;">{{days_remaining}}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0; font-weight: bold;">Vendor:</td>
                    <td style="padding: 8px 0;">{{vendor}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold;">Location:</td>
                    <td style="padding: 8px 0;">{{location}}</td>
                  </tr>
                </table>
              </div>

              <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="color: #721c24; margin-top: 0;">Action Required:</h4>
                <ul style="color: #721c24; margin-bottom: 0;">
                  <li>Contact your vendor immediately to renew the warranty</li>
                  <li>If renewal is not possible, plan for asset replacement</li>
                  <li>Update the asset record with new warranty information</li>
                  <li>Consider backup solutions if this is a critical asset</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{dashboard_url}}/assets/{{asset_id}}"
                   style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
                  View Asset Details
                </a>
                <a href="{{dashboard_url}}/assets/{{asset_id}}/warranty"
                   style="background: #ffc107; color: #212529; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Update Warranty
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

              <p style="color: #666; font-size: 12px;">
                This is an automated alert from the CYPHER Asset Management System.<br>
                For urgent issues, please contact your system administrator immediately.
              </p>
            </div>
          </div>
        `,
        type: 'alert',
        status: 'active',
        variables: ['recipient_name', 'asset_name', 'serial_number', 'expiry_date', 'days_remaining', 'vendor', 'location', 'dashboard_url', 'asset_id'],
        isHtml: true
      }
    ];

    // Create templates using existing EmailTemplateService
    for (const template of assetEmailTemplates) {
      try {
        const existing = await emailTemplateService.getTemplateByName(template.name);
        if (!existing) {
          await emailTemplateService.createTemplate(template);
          console.log(`✅ Created asset email template: ${template.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create email template ${template.name}:`, error);
      }
    }
  }

  async sendAssetCreatedEmail(recipients, assetData, createdBy) {
    try {
      const templateData = {
        asset_name: assetData.name,
        asset_type: assetData.type,
        serial_number: assetData.serialNumber || 'N/A',
        location: assetData.location || 'Not specified',
        user_name: `${createdBy.firstName} ${createdBy.lastName}`,
        dashboard_url: process.env.FRONTEND_URL || 'http://localhost:3000',
        asset_id: assetData.id
      };

      for (const recipient of recipients) {
        await emailService.sendTemplatedEmail(
          recipient.email,
          'asset_created_email',
          {
            ...templateData,
            recipient_name: `${recipient.firstName} ${recipient.lastName}`
          }
        );
      }

      console.log(`📧 Asset creation emails sent to ${recipients.length} recipients`);

    } catch (error) {
      console.error('Error sending asset created emails:', error);
      throw error;
    }
  }

  async sendWarrantyExpiringEmail(recipients, assetData, daysRemaining) {
    try {
      const templateData = {
        asset_name: assetData.name,
        serial_number: assetData.serialNumber || 'N/A',
        expiry_date: new Date(assetData.warrantyExpiry).toLocaleDateString(),
        days_remaining: daysRemaining,
        vendor: assetData.vendor || 'Unknown',
        location: assetData.location || 'Not specified',
        dashboard_url: process.env.FRONTEND_URL || 'http://localhost:3000',
        asset_id: assetData.id
      };

      for (const recipient of recipients) {
        await emailService.sendNotificationEmail(
          recipient.email,
          `⚠️ URGENT: Warranty Expiring Soon - ${assetData.name}`,
          await this.renderWarrantyExpiringTemplate({
            ...templateData,
            recipient_name: `${recipient.firstName} ${recipient.lastName}`
          })
        );
      }

      console.log(`⚠️ Warranty expiring emails sent to ${recipients.length} recipients`);

    } catch (error) {
      console.error('Error sending warranty expiring emails:', error);
      throw error;
    }
  }

  async renderWarrantyExpiringTemplate(data) {
    // Use existing email template service to render template
    return await emailTemplateService.renderTemplate('warranty_expiring_email', data);
  }
}

module.exports = new AssetEmailService();
```

---

## 🔧 Complete Integration Example

### Asset Controller with Full Integration
```javascript
// api/src/controllers/AssetController.js
const assetManagementService = require('../services/AssetManagementService');
const assetNotificationService = require('../services/AssetNotificationService');
const assetEmailService = require('../services/AssetEmailService');
const { auditLogService } = require('../services/AuditLogService');

class AssetController {

  async createAsset(req, res) {
    try {
      // Create asset using service with audit logging
      const newAsset = await assetManagementService.createAsset(
        req.body,
        req.user.id,
        req
      );

      // Send notifications
      await assetNotificationService.sendAssetCreatedNotification(
        newAsset,
        req.user
      );

      // Send email notifications to relevant users
      const adminUsers = await assetNotificationService.getUsersByRole(['admin', 'moderator']);
      await assetEmailService.sendAssetCreatedEmail(
        adminUsers,
        newAsset,
        req.user
      );

      res.status(201).json({
        success: true,
        message: 'Asset created successfully',
        data: newAsset
      });

    } catch (error) {
      // Error is already logged by the service layer
      console.error('Asset creation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create asset',
        error: error.message
      });
    }
  }

  async updateAsset(req, res) {
    try {
      const assetId = req.params.id;

      // Update asset with audit logging
      const updatedAsset = await assetManagementService.updateAsset(
        assetId,
        req.body,
        req.user.id,
        req
      );

      // Check if warranty was updated and send notification if needed
      if (req.body.warrantyExpiry) {
        const daysUntilExpiry = Math.ceil(
          (new Date(req.body.warrantyExpiry) - new Date()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= 30) {
          await assetNotificationService.sendWarrantyExpiringNotification(
            updatedAsset,
            daysUntilExpiry
          );
        }
      }

      res.json({
        success: true,
        message: 'Asset updated successfully',
        data: updatedAsset
      });

    } catch (error) {
      console.error('Asset update failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update asset',
        error: error.message
      });
    }
  }

  async bulkUpdateAssets(req, res) {
    try {
      const { assetIds, updates } = req.body;

      // Perform bulk update with audit logging
      const result = await assetManagementService.bulkUpdateAssets(
        assetIds,
        updates,
        req.user.id,
        req
      );

      // Send bulk operation notification
      await assetNotificationService.createNotification({
        userId: req.user.id,
        title: `Bulk Update Complete`,
        message: `Successfully updated ${result.updatedAssets.length} assets`,
        type: 'success',
        module: 'asset_management',
        eventType: 'bulk_update_completed',
        metadata: { batchId: result.batchId, count: result.updatedAssets.length }
      });

      res.json({
        success: true,
        message: `Successfully updated ${result.updatedAssets.length} assets`,
        data: {
          updatedAssets: result.updatedAssets,
          batchId: result.batchId
        }
      });

    } catch (error) {
      console.error('Bulk update failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update assets',
        error: error.message
      });
    }
  }
}

module.exports = new AssetController();
```

This comprehensive integration guide shows how to leverage all of CYPHER's existing infrastructure for the Asset Management implementation, significantly reducing development time and ensuring consistency across the platform.
```
