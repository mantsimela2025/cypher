import { apiClient } from './apiClient';
import { log } from './config';

export const assetTagsApi = {
  // Get all tags for a specific asset
  async getAssetTags(assetUuid, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.tagKey) params.append('tagKey', filters.tagKey);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const endpoint = params.toString() ? `/asset-tags/${assetUuid}?${params}` : `/asset-tags/${assetUuid}`;
      log.api('Getting asset tags for:', assetUuid, 'with filters:', filters);
      return await apiClient.get(endpoint);
    } catch (error) {
      log.error('Failed to fetch asset tags:', error.message);
      throw error;
    }
  },

  // Get tags for multiple assets (for table display)
  async getMultipleAssetTags(assetUuids) {
    try {
      log.api('Getting tags for multiple assets:', assetUuids.length, 'assets');
      return await apiClient.post('/asset-tags/multiple', { assetUuids });
    } catch (error) {
      log.error('Failed to fetch multiple asset tags:', error.message);
      throw error;
    }
  },

  // Get all unique tag keys
  async getTagKeys() {
    try {
      log.api('Getting all tag keys');
      return await apiClient.get('/asset-tags/keys');
    } catch (error) {
      log.error('Failed to fetch tag keys:', error.message);
      throw error;
    }
  },

  // Get all values for a specific tag key
  async getTagValues(tagKey) {
    try {
      log.api('Getting tag values for key:', tagKey);
      return await apiClient.get(`/asset-tags/keys/${tagKey}/values`);
    } catch (error) {
      log.error('Failed to fetch tag values:', error.message);
      throw error;
    }
  },

  // Add a new tag to an asset
  async addAssetTag(assetUuid, tagKey, tagValue) {
    try {
      log.api('Adding tag to asset:', assetUuid, 'key:', tagKey, 'value:', tagValue);
      return await apiClient.post(`/asset-tags/${assetUuid}`, { tagKey, tagValue });
    } catch (error) {
      log.error('Failed to add asset tag:', error.message);
      throw error;
    }
  },

  // Remove a tag from an asset
  async removeAssetTag(tagId) {
    try {
      log.api('Removing asset tag:', tagId);
      return await apiClient.delete(`/asset-tags/tag/${tagId}`);
    } catch (error) {
      log.error('Failed to remove asset tag:', error.message);
      throw error;
    }
  },

  // Update a tag value
  async updateAssetTag(tagId, newValue) {
    try {
      log.api('Updating asset tag:', tagId, 'to value:', newValue);
      return await apiClient.put(`/asset-tags/tag/${tagId}`, { tagValue: newValue });
    } catch (error) {
      log.error('Failed to update asset tag:', error.message);
      throw error;
    }
  },

  // Bulk add tags to an asset
  async bulkAddTags(assetUuid, tags) {
    try {
      log.api('Bulk adding tags to asset:', assetUuid, 'tags count:', tags.length);
      return await apiClient.post(`/asset-tags/${assetUuid}/bulk`, { tags });
    } catch (error) {
      log.error('Failed to bulk add tags:', error.message);
      throw error;
    }
  },

  // Search assets by tags
  async searchAssetsByTags(tagFilters, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);

      const endpoint = params.toString() ? `/asset-tags/search?${params}` : '/asset-tags/search';
      log.api('Searching assets by tags with filters:', tagFilters);
      return await apiClient.post(endpoint, { tagFilters });
    } catch (error) {
      log.error('Failed to search assets by tags:', error.message);
      throw error;
    }
  },

  // Get tag statistics
  async getTagStatistics() {
    try {
      log.api('Getting tag statistics');
      return await apiClient.get('/asset-tags/statistics');
    } catch (error) {
      log.error('Failed to fetch tag statistics:', error.message);
      throw error;
    }
  },

  // Helper function to format tags for display
  formatTagsForDisplay(tags) {
    if (!Array.isArray(tags)) return [];
    
    return tags.map(tag => ({
      id: tag.id,
      key: tag.tagKey,
      value: tag.tagValue,
      display: `${tag.tagKey}:${tag.tagValue}`,
      createdAt: tag.createdAt
    }));
  },

  // Helper function to group tags by key
  groupTagsByKey(tags) {
    if (!Array.isArray(tags)) return {};
    
    return tags.reduce((groups, tag) => {
      const key = tag.tagKey;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(tag);
      return groups;
    }, {});
  },

  // Helper function to get unique tag values for filtering
  getUniqueTagValues(tags, tagKey) {
    if (!Array.isArray(tags)) return [];
    
    return [...new Set(
      tags
        .filter(tag => tag.tagKey === tagKey)
        .map(tag => tag.tagValue)
    )].sort();
  },

  // Helper function to filter assets by tags
  filterAssetsByTags(assets, selectedTags) {
    if (!Array.isArray(assets) || !Array.isArray(selectedTags) || selectedTags.length === 0) {
      return assets;
    }

    return assets.filter(asset => {
      if (!asset.tags || !Array.isArray(asset.tags)) return false;
      
      // Check if asset has all selected tags (AND logic)
      return selectedTags.every(selectedTag => 
        asset.tags.some(assetTag => 
          assetTag.tagKey === selectedTag.tagKey && 
          assetTag.tagValue === selectedTag.tagValue
        )
      );
    });
  },

  // Helper function to get tag color based on tag key
  getTagColor(tagKey) {
    const colorMap = {
      'environment': 'primary',
      'asset_type': 'info',
      'criticality': 'warning',
      'location': 'success',
      'department': 'secondary',
      'compliance': 'danger',
      'default': 'light'
    };
    
    return colorMap[tagKey] || colorMap.default;
  },

  // Helper function to get tag icon based on tag key
  getTagIcon(tagKey) {
    const iconMap = {
      'environment': 'globe',
      'asset_type': 'server',
      'criticality': 'alert-triangle',
      'location': 'map-pin',
      'department': 'users',
      'compliance': 'shield-check',
      'default': 'tag'
    };
    
    return iconMap[tagKey] || iconMap.default;
  }
};
