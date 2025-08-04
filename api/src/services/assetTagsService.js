const { db } = require('../db');
const { assetTags } = require('../db/schema/assetManagement');
const { assets } = require('../db/schema/assets');
const { eq, and, sql, desc, asc } = require('drizzle-orm');

class AssetTagsService {
  // Get all tags for a specific asset
  async getAssetTags(assetUuid, filters = {}) {
    try {
      let query = db.select({
        id: assetTags.id,
        tagKey: assetTags.tagKey,
        tagValue: assetTags.tagValue,
        createdAt: assetTags.createdAt,
        assetUuid: assetTags.assetUuid
      })
      .from(assetTags)
      .where(eq(assetTags.assetUuid, assetUuid));

      // Apply tag key filter if provided
      if (filters.tagKey) {
        query = query.where(and(
          eq(assetTags.assetUuid, assetUuid),
          eq(assetTags.tagKey, filters.tagKey)
        ));
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'tagKey';
      const sortOrder = filters.sortOrder || 'asc';
      
      if (sortOrder === 'desc') {
        query = query.orderBy(desc(assetTags[sortBy]));
      } else {
        query = query.orderBy(asc(assetTags[sortBy]));
      }

      const tags = await query;

      return {
        success: true,
        data: tags,
        count: tags.length
      };
    } catch (error) {
      console.error('Error fetching asset tags:', error);
      throw new Error(`Failed to fetch asset tags: ${error.message}`);
    }
  }

  // Get all unique tag keys
  async getTagKeys() {
    try {
      const tagKeys = await db.select({
        tagKey: assetTags.tagKey,
        count: sql`count(*)`.as('count')
      })
      .from(assetTags)
      .groupBy(assetTags.tagKey)
      .orderBy(asc(assetTags.tagKey));

      return {
        success: true,
        data: tagKeys
      };
    } catch (error) {
      console.error('Error fetching tag keys:', error);
      throw new Error(`Failed to fetch tag keys: ${error.message}`);
    }
  }

  // Get all values for a specific tag key
  async getTagValues(tagKey) {
    try {
      const tagValues = await db.select({
        tagValue: assetTags.tagValue,
        count: sql`count(*)`.as('count')
      })
      .from(assetTags)
      .where(eq(assetTags.tagKey, tagKey))
      .groupBy(assetTags.tagValue)
      .orderBy(asc(assetTags.tagValue));

      return {
        success: true,
        data: tagValues
      };
    } catch (error) {
      console.error('Error fetching tag values:', error);
      throw new Error(`Failed to fetch tag values: ${error.message}`);
    }
  }

  // Add a new tag to an asset
  async addAssetTag(assetUuid, tagKey, tagValue) {
    try {
      // Check if tag already exists
      const existingTag = await db.select()
        .from(assetTags)
        .where(and(
          eq(assetTags.assetUuid, assetUuid),
          eq(assetTags.tagKey, tagKey),
          eq(assetTags.tagValue, tagValue)
        ));

      if (existingTag.length > 0) {
        return {
          success: false,
          message: 'Tag already exists for this asset'
        };
      }

      // Insert new tag
      const [newTag] = await db.insert(assetTags)
        .values({
          assetUuid,
          tagKey,
          tagValue
        })
        .returning();

      return {
        success: true,
        data: newTag,
        message: 'Tag added successfully'
      };
    } catch (error) {
      console.error('Error adding asset tag:', error);
      throw new Error(`Failed to add asset tag: ${error.message}`);
    }
  }

  // Remove a tag from an asset
  async removeAssetTag(tagId) {
    try {
      const deletedTag = await db.delete(assetTags)
        .where(eq(assetTags.id, tagId))
        .returning();

      if (deletedTag.length === 0) {
        return {
          success: false,
          message: 'Tag not found'
        };
      }

      return {
        success: true,
        data: deletedTag[0],
        message: 'Tag removed successfully'
      };
    } catch (error) {
      console.error('Error removing asset tag:', error);
      throw new Error(`Failed to remove asset tag: ${error.message}`);
    }
  }

  // Bulk add tags to an asset
  async bulkAddTags(assetUuid, tags) {
    try {
      const tagsToInsert = tags.map(tag => ({
        assetUuid,
        tagKey: tag.tagKey,
        tagValue: tag.tagValue
      }));

      const insertedTags = await db.insert(assetTags)
        .values(tagsToInsert)
        .returning();

      return {
        success: true,
        data: insertedTags,
        count: insertedTags.length,
        message: `${insertedTags.length} tags added successfully`
      };
    } catch (error) {
      console.error('Error bulk adding tags:', error);
      throw new Error(`Failed to bulk add tags: ${error.message}`);
    }
  }

  // Search assets by tags
  async searchAssetsByTags(tagFilters, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      // Build the query to find assets with matching tags
      let query = db.select({
        assetUuid: assetTags.assetUuid,
        hostname: assets.hostname,
        systemId: assets.systemId,
        criticalityRating: assets.criticalityRating,
        tagCount: sql`count(*)`.as('tagCount')
      })
      .from(assetTags)
      .leftJoin(assets, eq(assetTags.assetUuid, assets.assetUuid));

      // Apply tag filters
      if (tagFilters && tagFilters.length > 0) {
        const tagConditions = tagFilters.map(filter => 
          and(
            eq(assetTags.tagKey, filter.tagKey),
            eq(assetTags.tagValue, filter.tagValue)
          )
        );
        
        // For multiple tag filters, we want assets that have ALL specified tags
        // This requires a more complex query with subqueries
        // For now, we'll implement OR logic (assets with ANY of the specified tags)
        query = query.where(sql`(${tagConditions.join(' OR ')})`);
      }

      query = query
        .groupBy(assetTags.assetUuid, assets.hostname, assets.systemId, assets.criticalityRating)
        .orderBy(desc(sql`count(*)`))
        .limit(limit)
        .offset(offset);

      const results = await query;

      return {
        success: true,
        data: results,
        count: results.length
      };
    } catch (error) {
      console.error('Error searching assets by tags:', error);
      throw new Error(`Failed to search assets by tags: ${error.message}`);
    }
  }

  // Get tag statistics
  async getTagStatistics() {
    try {
      // Get total counts
      const [totalTags] = await db.select({
        count: sql`count(*)`.as('count')
      }).from(assetTags);

      const [uniqueAssets] = await db.select({
        count: sql`count(distinct asset_uuid)`.as('count')
      }).from(assetTags);

      const [uniqueKeys] = await db.select({
        count: sql`count(distinct tag_key)`.as('count')
      }).from(assetTags);

      // Get top tag keys by usage
      const topTagKeys = await db.select({
        tagKey: assetTags.tagKey,
        count: sql`count(*)`.as('count')
      })
      .from(assetTags)
      .groupBy(assetTags.tagKey)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

      // Get tag distribution by key
      const tagDistribution = await db.select({
        tagKey: assetTags.tagKey,
        tagValue: assetTags.tagValue,
        count: sql`count(*)`.as('count')
      })
      .from(assetTags)
      .groupBy(assetTags.tagKey, assetTags.tagValue)
      .orderBy(assetTags.tagKey, desc(sql`count(*)`));

      return {
        success: true,
        data: {
          summary: {
            totalTags: parseInt(totalTags.count),
            uniqueAssets: parseInt(uniqueAssets.count),
            uniqueKeys: parseInt(uniqueKeys.count)
          },
          topTagKeys,
          tagDistribution
        }
      };
    } catch (error) {
      console.error('Error fetching tag statistics:', error);
      throw new Error(`Failed to fetch tag statistics: ${error.message}`);
    }
  }
}

module.exports = new AssetTagsService();
