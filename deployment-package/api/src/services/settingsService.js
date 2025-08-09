const { db } = require('../db');
const { settings } = require('../db/schema');
const { eq, and, desc, asc, sql, count, like, ilike, inArray } = require('drizzle-orm');
const auditLogService = require('./auditLogService');

class SettingsService {

  // ==================== CRUD OPERATIONS ====================

  /**
   * Get all settings with filtering and pagination
   */
  async getAllSettings(filters = {}, pagination = {}) {
    try {
      const { category, isPublic, isEditable, search } = filters;
      const { page = 1, limit = 50, sortBy = 'category', sortOrder = 'asc' } = pagination;

      let query = db.select({
        id: settings.id,
        key: settings.key,
        value: settings.value,
        dataType: settings.dataType,
        category: settings.category,
        description: settings.description,
        isPublic: settings.isPublic,
        isEditable: settings.isEditable,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt
      })
      .from(settings);

      // Apply filters
      const conditions = [];

      if (category) {
        conditions.push(eq(settings.category, category));
      }

      if (typeof isPublic === 'boolean') {
        conditions.push(eq(settings.isPublic, isPublic));
      }

      if (typeof isEditable === 'boolean') {
        conditions.push(eq(settings.isEditable, isEditable));
      }

      if (search) {
        conditions.push(
          sql`(${settings.key} ILIKE ${`%${search}%`} OR ${settings.description} ILIKE ${`%${search}%`})`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = settings[sortBy] || settings.category;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const settingsData = await query;

      // Get total count
      let countQuery = db.select({ count: count() }).from(settings);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: settingsData,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  }

  /**
   * Get setting by ID
   */
  async getSettingById(id) {
    try {
      const [setting] = await db.select()
        .from(settings)
        .where(eq(settings.id, id))
        .limit(1);

      if (!setting) {
        throw new Error('Setting not found');
      }

      return setting;
    } catch (error) {
      console.error('Error getting setting by ID:', error);
      throw error;
    }
  }

  /**
   * Get setting by key
   */
  async getSettingByKey(key) {
    try {
      const [setting] = await db.select()
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);

      if (!setting) {
        throw new Error('Setting not found');
      }

      return setting;
    } catch (error) {
      console.error('Error getting setting by key:', error);
      throw error;
    }
  }

  /**
   * Get setting value by key with type conversion
   */
  async getSettingValue(key) {
    try {
      const setting = await this.getSettingByKey(key);
      return this.convertSettingValue(setting.value, setting.dataType);
    } catch (error) {
      console.error('Error getting setting value:', error);
      return null;
    }
  }

  /**
   * Get multiple settings by keys
   */
  async getSettingsByKeys(keys) {
    try {
      const settingsData = await db.select()
        .from(settings)
        .where(inArray(settings.key, keys));

      // Convert to key-value object with type conversion
      const result = {};
      settingsData.forEach(setting => {
        result[setting.key] = {
          value: this.convertSettingValue(setting.value, setting.dataType),
          dataType: setting.dataType,
          category: setting.category,
          description: setting.description,
          isPublic: setting.isPublic,
          isEditable: setting.isEditable
        };
      });

      return result;
    } catch (error) {
      console.error('Error getting settings by keys:', error);
      throw error;
    }
  }

  /**
   * Get public settings (for frontend)
   */
  async getPublicSettings() {
    try {
      const publicSettings = await db.select({
        key: settings.key,
        value: settings.value,
        dataType: settings.dataType,
        category: settings.category,
        description: settings.description
      })
      .from(settings)
      .where(eq(settings.isPublic, true))
      .orderBy(asc(settings.category), asc(settings.key));

      // Convert to nested object by category
      const result = {};
      publicSettings.forEach(setting => {
        if (!result[setting.category]) {
          result[setting.category] = {};
        }
        result[setting.category][setting.key] = {
          value: this.convertSettingValue(setting.value, setting.dataType),
          dataType: setting.dataType,
          description: setting.description
        };
      });

      return result;
    } catch (error) {
      console.error('Error getting public settings:', error);
      throw error;
    }
  }

  /**
   * Create new setting
   */
  async createSetting(settingData, userId) {
    try {
      console.log('📝 Creating setting:', settingData.key);

      // Validate data type and convert value
      const convertedValue = this.validateAndConvertValue(settingData.value, settingData.dataType);

      const [newSetting] = await db.insert(settings)
        .values({
          key: settingData.key,
          value: convertedValue,
          dataType: settingData.dataType || 'string',
          category: settingData.category || 'general',
          description: settingData.description,
          isPublic: settingData.isPublic || false,
          isEditable: settingData.isEditable !== false, // Default to true
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Log audit trail
      await auditLogService.createAuditLog({
        userId: userId,
        module: 'settings',
        action: 'setting_created',
        resourceType: 'setting',
        resourceId: newSetting.id,
        details: {
          key: newSetting.key,
          category: newSetting.category,
          dataType: newSetting.dataType
        }
      });

      return newSetting;
    } catch (error) {
      console.error('Error creating setting:', error);
      throw error;
    }
  }

  /**
   * Update setting
   */
  async updateSetting(id, updateData, userId) {
    try {
      console.log('📝 Updating setting:', id);

      // Get existing setting
      const existingSetting = await this.getSettingById(id);

      // Check if setting is editable
      if (!existingSetting.isEditable) {
        throw new Error('Setting is not editable');
      }

      // Validate and convert value if provided
      let convertedValue = existingSetting.value;
      if (updateData.value !== undefined) {
        const dataType = updateData.dataType || existingSetting.dataType;
        convertedValue = this.validateAndConvertValue(updateData.value, dataType);
      }

      const [updatedSetting] = await db.update(settings)
        .set({
          value: convertedValue,
          dataType: updateData.dataType || existingSetting.dataType,
          category: updateData.category || existingSetting.category,
          description: updateData.description !== undefined ? updateData.description : existingSetting.description,
          isPublic: updateData.isPublic !== undefined ? updateData.isPublic : existingSetting.isPublic,
          isEditable: updateData.isEditable !== undefined ? updateData.isEditable : existingSetting.isEditable,
          updatedAt: new Date()
        })
        .where(eq(settings.id, id))
        .returning();

      // Log audit trail
      await auditLogService.createAuditLog({
        userId: userId,
        module: 'settings',
        action: 'setting_updated',
        resourceType: 'setting',
        resourceId: id,
        oldValues: existingSetting,
        newValues: updatedSetting,
        details: {
          key: updatedSetting.key,
          oldValue: existingSetting.value,
          newValue: updatedSetting.value,
          category: updatedSetting.category
        }
      });

      return updatedSetting;
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  }

  /**
   * Update setting by key
   */
  async updateSettingByKey(key, value, userId) {
    try {
      const setting = await this.getSettingByKey(key);
      return await this.updateSetting(setting.id, { value }, userId);
    } catch (error) {
      console.error('Error updating setting by key:', error);
      throw error;
    }
  }

  /**
   * Delete setting
   */
  async deleteSetting(id, userId) {
    try {
      console.log('🗑️ Deleting setting:', id);

      // Get setting details for audit
      const setting = await this.getSettingById(id);

      // Check if setting is editable (deletable)
      if (!setting.isEditable) {
        throw new Error('Setting is not deletable');
      }

      await db.delete(settings)
        .where(eq(settings.id, id));

      // Log audit trail
      await auditLogService.createAuditLog({
        userId: userId,
        module: 'settings',
        action: 'setting_deleted',
        resourceType: 'setting',
        resourceId: id,
        oldValues: setting,
        details: {
          key: setting.key,
          category: setting.category
        }
      });

      return { success: true, message: 'Setting deleted successfully' };
    } catch (error) {
      console.error('Error deleting setting:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Convert setting value based on data type
   */
  convertSettingValue(value, dataType) {
    if (value === null || value === undefined) {
      return null;
    }

    try {
      switch (dataType) {
        case 'boolean':
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === '1';
          }
          return Boolean(value);

        case 'number':
          if (typeof value === 'number') return value;
          const num = parseFloat(value);
          if (isNaN(num)) throw new Error('Invalid number format');
          return num;

        case 'json':
          if (typeof value === 'object') return value;
          return JSON.parse(value);

        case 'array':
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') {
            return JSON.parse(value);
          }
          return [value];

        case 'string':
        default:
          return String(value);
      }
    } catch (error) {
      console.warn(`Error converting setting value: ${error.message}`);
      return value; // Return original value if conversion fails
    }
  }

  /**
   * Validate and convert value for storage
   */
  validateAndConvertValue(value, dataType) {
    if (value === null || value === undefined) {
      return null;
    }

    try {
      switch (dataType) {
        case 'boolean':
          return String(Boolean(value));

        case 'number':
          const num = parseFloat(value);
          if (isNaN(num)) throw new Error('Invalid number format');
          return String(num);

        case 'json':
        case 'array':
          if (typeof value === 'string') {
            JSON.parse(value); // Validate JSON
            return value;
          }
          return JSON.stringify(value);

        case 'string':
        default:
          return String(value);
      }
    } catch (error) {
      throw new Error(`Invalid value for data type ${dataType}: ${error.message}`);
    }
  }

  /**
   * Get settings categories
   */
  async getCategories() {
    try {
      const categories = await db.select({
        category: settings.category,
        count: count()
      })
      .from(settings)
      .groupBy(settings.category)
      .orderBy(asc(settings.category));

      return categories;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Bulk update settings
   */
  async bulkUpdateSettings(settingsData, userId) {
    try {
      console.log('📝 Bulk updating settings:', Object.keys(settingsData).length);

      const results = [];
      
      for (const [key, value] of Object.entries(settingsData)) {
        try {
          const result = await this.updateSettingByKey(key, value, userId);
          results.push({ key, success: true, setting: result });
        } catch (error) {
          results.push({ key, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Error bulk updating settings:', error);
      throw error;
    }
  }
}

module.exports = new SettingsService();
