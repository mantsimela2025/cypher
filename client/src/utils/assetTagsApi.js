const API_BASE_URL = 'http://localhost:3001/api/v1';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('accessToken');
};

// Create headers with auth token
const createHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Handle API response
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

export const assetTagsApi = {
  // Get all tags for a specific asset
  async getAssetTags(assetUuid, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.tagKey) params.append('tagKey', filters.tagKey);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await fetch(`${API_BASE_URL}/asset-tags/${assetUuid}?${params}`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch asset tags');
    }
  },

  // Get tags for multiple assets (for table display)
  async getMultipleAssetTags(assetUuids) {
    try {
      const response = await fetch(`${API_BASE_URL}/asset-tags/multiple`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({ assetUuids })
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch multiple asset tags');
    }
  },

  // Get all unique tag keys
  async getTagKeys() {
    try {
      const response = await fetch(`${API_BASE_URL}/asset-tags/keys`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch tag keys');
    }
  },

  // Get all values for a specific tag key
  async getTagValues(tagKey) {
    try {
      const response = await fetch(`${API_BASE_URL}/asset-tags/keys/${tagKey}/values`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch tag values');
    }
  },

  // Add a new tag to an asset
  async addAssetTag(assetUuid, tagKey, tagValue) {
    try {
      const response = await fetch(`${API_BASE_URL}/asset-tags/${assetUuid}`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({ tagKey, tagValue })
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to add asset tag');
    }
  },

  // Remove a tag from an asset
  async removeAssetTag(tagId) {
    try {
      const response = await fetch(`${API_BASE_URL}/asset-tags/tag/${tagId}`, {
        method: 'DELETE',
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to remove asset tag');
    }
  },

  // Update a tag value
  async updateAssetTag(tagId, newValue) {
    try {
      const response = await fetch(`${API_BASE_URL}/asset-tags/tag/${tagId}`, {
        method: 'PUT',
        headers: createHeaders(),
        body: JSON.stringify({ tagValue: newValue })
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to update asset tag');
    }
  },

  // Bulk add tags to an asset
  async bulkAddTags(assetUuid, tags) {
    try {
      const response = await fetch(`${API_BASE_URL}/asset-tags/${assetUuid}/bulk`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({ tags })
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to bulk add tags');
    }
  },

  // Search assets by tags
  async searchAssetsByTags(tagFilters, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);

      const response = await fetch(`${API_BASE_URL}/asset-tags/search?${params}`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({ tagFilters })
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to search assets by tags');
    }
  },

  // Get tag statistics
  async getTagStatistics() {
    try {
      const response = await fetch(`${API_BASE_URL}/asset-tags/statistics`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch tag statistics');
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
