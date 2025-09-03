const AWS = require('aws-sdk');
const { db } = require('../db');
const { sql } = require('drizzle-orm');

class DocumentSettingsService {
  constructor() {
    this.defaultSettings = {
      s3: {
        bucketName: process.env.S3_DOCUMENTS_BUCKET || '',
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        cdnUrl: process.env.CLOUDFRONT_URL || '',
        encryption: 'AES256'
      },
      upload: {
        maxFileSize: parseInt(process.env.MAX_DOCUMENT_SIZE) || 100,
        maxFilesPerUpload: 10,
        allowedFileTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'text/csv',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp'
        ],
        generateThumbnails: true,
        virusScanEnabled: false
      },
      security: {
        requireAuthentication: true,
        enableVersioning: true,
        enableAuditLog: true,
        maxVersionsPerDocument: 10,
        autoDeleteAfterDays: 0,
        encryptionAtRest: true
      },
      notifications: {
        emailOnUpload: false,
        emailOnShare: true,
        emailOnDelete: true,
        adminNotifications: true
      },
      performance: {
        enableCaching: true,
        cacheExpirationHours: 24,
        enableCompression: true,
        thumbnailQuality: 80
      }
    };
  }

  // ==================== SETTINGS MANAGEMENT ====================

  /**
   * Get current document management settings
   */
  async getSettings() {
    try {
      // In a real implementation, you might store these in a settings table
      // For now, we'll return defaults merged with environment variables
      const settings = { ...this.defaultSettings };
      
      // Override with any database-stored settings
      // const dbSettings = await this.getSettingsFromDatabase();
      // if (dbSettings) {
      //   settings = { ...settings, ...dbSettings };
      // }

      // Mask sensitive information
      if (settings.s3.secretAccessKey) {
        settings.s3.secretAccessKey = '***' + settings.s3.secretAccessKey.slice(-4);
      }

      return settings;
    } catch (error) {
      console.error('❌ Error getting settings:', error);
      throw error;
    }
  }

  /**
   * Update document management settings
   */
  async updateSettings(newSettings, userId) {
    try {
      console.log('📝 Updating document settings by user:', userId);

      // Validate settings
      await this.validateSettings(newSettings);

      // In a real implementation, save to database
      // await this.saveSettingsToDatabase(newSettings, userId);

      // Update environment variables or configuration
      await this.applySettings(newSettings);

      console.log('✅ Settings updated successfully');
      return { success: true, message: 'Settings updated successfully' };
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Test S3 connection with provided credentials
   */
  async testS3Connection(s3Settings) {
    try {
      console.log('🧪 Testing S3 connection...');

      const s3 = new AWS.S3({
        region: s3Settings.region,
        accessKeyId: s3Settings.accessKeyId,
        secretAccessKey: s3Settings.secretAccessKey
      });

      // Test bucket access
      const params = {
        Bucket: s3Settings.bucketName,
        MaxKeys: 1
      };

      await s3.listObjectsV2(params).promise();
      
      // Test upload permissions by creating a test object
      const testKey = `test-connection-${Date.now()}.txt`;
      const uploadParams = {
        Bucket: s3Settings.bucketName,
        Key: testKey,
        Body: 'Connection test',
        ServerSideEncryption: s3Settings.encryption
      };

      await s3.upload(uploadParams).promise();
      
      // Clean up test object
      await s3.deleteObject({
        Bucket: s3Settings.bucketName,
        Key: testKey
      }).promise();

      console.log('✅ S3 connection test successful');
      return { 
        success: true, 
        message: 'S3 connection successful',
        details: {
          bucket: s3Settings.bucketName,
          region: s3Settings.region,
          permissions: ['read', 'write', 'delete']
        }
      };
    } catch (error) {
      console.error('❌ S3 connection test failed:', error);
      
      let errorMessage = 'S3 connection failed';
      if (error.code === 'NoSuchBucket') {
        errorMessage = 'Bucket does not exist';
      } else if (error.code === 'AccessDenied') {
        errorMessage = 'Access denied - check credentials and permissions';
      } else if (error.code === 'InvalidAccessKeyId') {
        errorMessage = 'Invalid access key ID';
      } else if (error.code === 'SignatureDoesNotMatch') {
        errorMessage = 'Invalid secret access key';
      }

      return { 
        success: false, 
        message: errorMessage,
        error: error.code || error.message
      };
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageUsage() {
    try {
      console.log('📊 Getting storage usage statistics...');

      // Get document statistics from database
      const documentStats = await db.execute(sql`
        SELECT 
          COUNT(*) as total_documents,
          SUM(size) as total_size,
          AVG(size) as average_size
        FROM documents 
        WHERE deleted_at IS NULL
      `);

      const versionStats = await db.execute(sql`
        SELECT 
          COUNT(*) as total_versions,
          SUM(size) as total_version_size
        FROM document_versions
      `);

      // Mock thumbnail stats (in real implementation, calculate from S3 or database)
      const thumbnailStats = {
        count: 892,
        size: 156 * 1024 * 1024 // 156 MB
      };

      const stats = documentStats[0];
      const versions = versionStats[0];

      return {
        documents: {
          count: parseInt(stats.total_documents) || 0,
          size: parseInt(stats.total_size) || 0,
          averageSize: parseInt(stats.average_size) || 0
        },
        versions: {
          count: parseInt(versions.total_versions) || 0,
          size: parseInt(versions.total_version_size) || 0
        },
        thumbnails: thumbnailStats,
        total: {
          size: (parseInt(stats.total_size) || 0) + 
                (parseInt(versions.total_version_size) || 0) + 
                thumbnailStats.size,
          allocated: 10 * 1024 * 1024 * 1024 // 10 GB
        }
      };
    } catch (error) {
      console.error('❌ Error getting storage usage:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Validate settings before saving
   */
  async validateSettings(settings) {
    // Validate S3 settings
    if (settings.s3) {
      if (!settings.s3.bucketName) {
        throw new Error('S3 bucket name is required');
      }
      if (!settings.s3.region) {
        throw new Error('AWS region is required');
      }
    }

    // Validate upload settings
    if (settings.upload) {
      if (settings.upload.maxFileSize < 1 || settings.upload.maxFileSize > 1000) {
        throw new Error('Max file size must be between 1 and 1000 MB');
      }
      if (settings.upload.maxFilesPerUpload < 1 || settings.upload.maxFilesPerUpload > 50) {
        throw new Error('Max files per upload must be between 1 and 50');
      }
    }

    // Validate security settings
    if (settings.security) {
      if (settings.security.maxVersionsPerDocument < 1 || settings.security.maxVersionsPerDocument > 100) {
        throw new Error('Max versions per document must be between 1 and 100');
      }
    }

    return true;
  }

  /**
   * Apply settings to the system
   */
  async applySettings(settings) {
    try {
      // In a real implementation, you might:
      // 1. Update environment variables
      // 2. Restart services if needed
      // 3. Clear caches
      // 4. Update AWS SDK configurations
      
      console.log('⚙️ Applying new settings...');
      
      // Example: Update AWS SDK configuration
      if (settings.s3) {
        AWS.config.update({
          region: settings.s3.region,
          accessKeyId: settings.s3.accessKeyId,
          secretAccessKey: settings.s3.secretAccessKey
        });
      }

      return true;
    } catch (error) {
      console.error('❌ Error applying settings:', error);
      throw error;
    }
  }

  /**
   * Get file type statistics
   */
  async getFileTypeStats() {
    try {
      const stats = await db.execute(sql`
        SELECT 
          mime_type,
          COUNT(*) as count,
          SUM(size) as total_size
        FROM documents 
        WHERE deleted_at IS NULL
        GROUP BY mime_type
        ORDER BY count DESC
      `);

      return stats.map(stat => ({
        mimeType: stat.mime_type,
        count: parseInt(stat.count),
        size: parseInt(stat.total_size),
        displayName: this.getMimeTypeDisplayName(stat.mime_type)
      }));
    } catch (error) {
      console.error('❌ Error getting file type stats:', error);
      throw error;
    }
  }

  /**
   * Get display name for MIME type
   */
  getMimeTypeDisplayName(mimeType) {
    const mimeTypeMap = {
      'application/pdf': 'PDF',
      'application/msword': 'Word (DOC)',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word (DOCX)',
      'application/vnd.ms-excel': 'Excel (XLS)',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel (XLSX)',
      'text/plain': 'Text',
      'image/jpeg': 'JPEG Image',
      'image/png': 'PNG Image'
    };

    return mimeTypeMap[mimeType] || mimeType.split('/')[1]?.toUpperCase() || 'Unknown';
  }
}

module.exports = new DocumentSettingsService();
