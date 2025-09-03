# Frontend Foundation - Technical Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing the Asset Management frontend foundation with navigation-aware lazy loading, React components, and modern UX patterns.

---

## 🎨 **Task CYPHER-AM-005: Frontend Foundation Implementation**

### **Prerequisites**
- React application setup complete
- TanStack Query configured
- Navigation-aware lazy loading hooks available
- Asset Management API endpoints functional
- TypeScript configured

---

## 📋 **Subtask AM-005-1: Navigation-Aware Lazy Loading ⭐**

### **Files to Create:**
```
client/src/pages/assets/AssetInventory.jsx
client/src/hooks/useNavigationLazyLoad.js
client/src/utils/assetsApi.js
client/src/components/assets/LoadingStates.jsx
client/src/components/assets/ErrorStates.jsx
```

### **Step 1: Create Navigation-Aware Lazy Loading Hook**
```javascript
// client/src/hooks/useNavigationLazyLoad.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Navigation-aware lazy loading hook
 * Automatically loads data when navigating to specified paths
 */
export const useNavigationLazyLoad = (
  fetchFunction,
  options = {}
) => {
  const {
    triggerPaths = [],
    cacheTime = 2 * 60 * 1000, // 2 minutes default
    loadOnMount = true,
    onSuccess,
    onError,
    dependencies = []
  } = options;

  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  
  const fetchRef = useRef(fetchFunction);
  fetchRef.current = fetchFunction;

  // Check if current path matches trigger paths
  const shouldTrigger = triggerPaths.length === 0 || 
    triggerPaths.some(path => location.pathname.includes(path));

  // Check if data is still fresh
  const isDataFresh = lastFetch && 
    (Date.now() - lastFetch) < cacheTime;

  const fetchData = useCallback(async (force = false) => {
    // Don't fetch if data is fresh and not forced
    if (!force && isDataFresh && data) {
      return data;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchRef.current();
      setData(result);
      setHasLoaded(true);
      setLastFetch(Date.now());
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to load data';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [data, isDataFresh, onSuccess, onError]);

  // Auto-load on navigation or mount
  useEffect(() => {
    if (shouldTrigger && (loadOnMount || hasLoaded)) {
      fetchData();
    }
  }, [location.pathname, shouldTrigger, loadOnMount, ...dependencies]);

  // Refresh function for manual reload
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Clear function to reset state
  const clear = useCallback(() => {
    setData(null);
    setError(null);
    setHasLoaded(false);
    setLastFetch(null);
  }, []);

  return {
    data,
    loading,
    error,
    hasLoaded,
    refresh,
    clear,
    isDataFresh
  };
};
```

### **Step 2: Create Asset API Utilities**
```javascript
// client/src/utils/assetsApi.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/asset-management`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class AssetsApi {
  
  /**
   * Get assets with filtering and pagination
   */
  async getAssets(params = {}) {
    try {
      const response = await apiClient.get('/assets', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching assets:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch assets');
    }
  }

  /**
   * Get asset by ID
   */
  async getAsset(assetId) {
    try {
      const response = await apiClient.get(`/assets/${assetId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching asset:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch asset');
    }
  }

  /**
   * Create new asset
   */
  async createAsset(assetData) {
    try {
      const response = await apiClient.post('/assets', assetData);
      return response.data;
    } catch (error) {
      console.error('Error creating asset:', error);
      throw new Error(error.response?.data?.message || 'Failed to create asset');
    }
  }

  /**
   * Update asset
   */
  async updateAsset(assetId, updates) {
    try {
      const response = await apiClient.put(`/assets/${assetId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating asset:', error);
      throw new Error(error.response?.data?.message || 'Failed to update asset');
    }
  }

  /**
   * Delete asset
   */
  async deleteAsset(assetId) {
    try {
      const response = await apiClient.delete(`/assets/${assetId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete asset');
    }
  }

  /**
   * Get asset statistics
   */
  async getAssetStats(filters = {}) {
    try {
      const response = await apiClient.get('/assets/stats', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching asset stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch asset statistics');
    }
  }

  /**
   * Search assets
   */
  async searchAssets(searchQuery, filters = {}) {
    try {
      const response = await apiClient.post('/assets/search', {
        search: searchQuery,
        ...filters
      });
      return response.data;
    } catch (error) {
      console.error('Error searching assets:', error);
      throw new Error(error.response?.data?.message || 'Failed to search assets');
    }
  }

  /**
   * Get asset types
   */
  async getAssetTypes() {
    try {
      const response = await apiClient.get('/asset-types');
      return response.data;
    } catch (error) {
      console.error('Error fetching asset types:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch asset types');
    }
  }

  /**
   * Get asset locations
   */
  async getAssetLocations() {
    try {
      const response = await apiClient.get('/asset-locations');
      return response.data;
    } catch (error) {
      console.error('Error fetching asset locations:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch asset locations');
    }
  }

  /**
   * Bulk operations
   */
  async bulkUpdateAssets(assetIds, updates) {
    try {
      const response = await apiClient.post('/assets/bulk-update', {
        assetIds,
        updates
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk updating assets:', error);
      throw new Error(error.response?.data?.message || 'Failed to bulk update assets');
    }
  }

  /**
   * Export assets
   */
  async exportAssets(filters = {}, format = 'csv') {
    try {
      const response = await apiClient.get('/assets/export', {
        params: { ...filters, format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting assets:', error);
      throw new Error(error.response?.data?.message || 'Failed to export assets');
    }
  }
}

export const assetsApi = new AssetsApi();
export default assetsApi;
```

### **Step 3: Create Loading States Component**
```jsx
// client/src/components/assets/LoadingStates.jsx
import React from 'react';
import { Spin, Skeleton, Card, Row, Col } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

export const LoadingSpinner = ({ message = 'Loading...', size = 'default' }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: '40px 20px',
    minHeight: '200px'
  }}>
    <Spin 
      indicator={antIcon} 
      size={size}
      style={{ marginBottom: '16px' }}
    />
    <div style={{ 
      color: '#666', 
      fontSize: '14px',
      textAlign: 'center'
    }}>
      {message}
    </div>
  </div>
);

export const AssetTableSkeleton = ({ rows = 5 }) => (
  <div style={{ padding: '20px' }}>
    <Skeleton.Input 
      style={{ width: '300px', marginBottom: '20px' }} 
      active 
      size="large" 
    />
    {Array.from({ length: rows }).map((_, index) => (
      <Card key={index} style={{ marginBottom: '12px' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Skeleton.Input style={{ width: '100%' }} active />
          </Col>
          <Col span={4}>
            <Skeleton.Input style={{ width: '100%' }} active />
          </Col>
          <Col span={4}>
            <Skeleton.Input style={{ width: '100%' }} active />
          </Col>
          <Col span={4}>
            <Skeleton.Input style={{ width: '100%' }} active />
          </Col>
          <Col span={6}>
            <Skeleton.Input style={{ width: '100%' }} active />
          </Col>
        </Row>
      </Card>
    ))}
  </div>
);

export const AssetStatsCardsSkeleton = () => (
  <Row gutter={16} style={{ marginBottom: '24px' }}>
    {Array.from({ length: 4 }).map((_, index) => (
      <Col span={6} key={index}>
        <Card>
          <Skeleton.Input style={{ width: '60px', marginBottom: '8px' }} active />
          <Skeleton.Input style={{ width: '120px' }} active />
        </Card>
      </Col>
    ))}
  </Row>
);

export const AssetDetailsSkeleton = () => (
  <Card>
    <Row gutter={16}>
      <Col span={12}>
        <Skeleton.Input style={{ width: '100%', marginBottom: '16px' }} active size="large" />
        <Skeleton paragraph={{ rows: 4 }} active />
      </Col>
      <Col span={12}>
        <Skeleton.Input style={{ width: '100%', marginBottom: '16px' }} active size="large" />
        <Skeleton paragraph={{ rows: 4 }} active />
      </Col>
    </Row>
  </Card>
);

export const PageLoadingSkeleton = () => (
  <div style={{ padding: '24px' }}>
    <Skeleton.Input 
      style={{ width: '200px', marginBottom: '24px' }} 
      active 
      size="large" 
    />
    <AssetStatsCardsSkeleton />
    <AssetTableSkeleton />
  </div>
);
```

### **Step 4: Create Error States Component**
```jsx
// client/src/components/assets/ErrorStates.jsx
import React from 'react';
import { Result, Button, Alert, Card } from 'antd';
import { 
  ExclamationCircleOutlined, 
  ReloadOutlined, 
  WifiOutlined,
  LockOutlined,
  FileExclamationOutlined
} from '@ant-design/icons';

export const ErrorState = ({ 
  error, 
  onRetry, 
  title = 'Something went wrong',
  showRetry = true 
}) => {
  const getErrorIcon = (error) => {
    if (error?.includes('network') || error?.includes('timeout')) {
      return <WifiOutlined style={{ color: '#ff4d4f' }} />;
    }
    if (error?.includes('unauthorized') || error?.includes('permission')) {
      return <LockOutlined style={{ color: '#ff4d4f' }} />;
    }
    return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
  };

  return (
    <Result
      icon={getErrorIcon(error)}
      title={title}
      subTitle={error || 'An unexpected error occurred'}
      extra={showRetry && onRetry && (
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    />
  );
};

export const NetworkErrorState = ({ onRetry }) => (
  <Result
    icon={<WifiOutlined style={{ color: '#ff4d4f' }} />}
    title="Network Connection Error"
    subTitle="Unable to connect to the server. Please check your internet connection."
    extra={[
      <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry} key="retry">
        Retry Connection
      </Button>,
      <Button key="refresh" onClick={() => window.location.reload()}>
        Refresh Page
      </Button>
    ]}
  />
);

export const PermissionErrorState = () => (
  <Result
    icon={<LockOutlined style={{ color: '#ff4d4f' }} />}
    title="Access Denied"
    subTitle="You don't have permission to view this content. Please contact your administrator."
    extra={
      <Button type="primary" onClick={() => window.history.back()}>
        Go Back
      </Button>
    }
  />
);

export const NotFoundErrorState = ({ resourceName = 'resource' }) => (
  <Result
    icon={<FileExclamationOutlined style={{ color: '#ff4d4f' }} />}
    title={`${resourceName} Not Found`}
    subTitle={`The ${resourceName.toLowerCase()} you're looking for doesn't exist or has been removed.`}
    extra={
      <Button type="primary" onClick={() => window.history.back()}>
        Go Back
      </Button>
    }
  />
);

export const InlineErrorAlert = ({ 
  error, 
  onRetry, 
  closable = true,
  showIcon = true 
}) => (
  <Alert
    message="Error"
    description={error}
    type="error"
    showIcon={showIcon}
    closable={closable}
    action={onRetry && (
      <Button size="small" danger onClick={onRetry}>
        Retry
      </Button>
    )}
    style={{ marginBottom: '16px' }}
  />
);

export const ErrorBoundaryFallback = ({ error, resetError }) => (
  <Card style={{ margin: '24px' }}>
    <Result
      status="error"
      title="Application Error"
      subTitle="Something went wrong in the application. This error has been logged."
      extra={[
        <Button type="primary" onClick={resetError} key="reset">
          Try Again
        </Button>,
        <Button key="reload" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      ]}
    >
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          textAlign: 'left', 
          backgroundColor: '#f5f5f5', 
          padding: '16px', 
          borderRadius: '4px',
          marginTop: '16px'
        }}>
          <pre style={{ fontSize: '12px', margin: 0 }}>
            {error?.stack || error?.message}
          </pre>
        </div>
      )}
    </Result>
  </Card>
);
```

### **Testing Instructions:**
1. Test navigation-aware lazy loading by navigating to asset pages
2. Verify data caching works correctly with the specified cache time
3. Test error states with network failures and permission errors
4. Validate loading states display correctly during data fetching
5. Test refresh functionality and manual retry operations
6. Verify API integration works with authentication

---

## 📝 **Next Steps**

1. **Continue to [Asset Components](./05_Frontend_Foundation_Part2.md)** - Build core asset components
2. **Review [TanStack Query Integration](./05_Frontend_Foundation_Part3.md)** - Setup advanced data fetching
3. **Setup [Search & Filtering](./05_Frontend_Foundation_Part4.md)** - Implement advanced search interface

---

## 🔗 **Related Documents**

- [Storage Layer Implementation](./02_Storage_Layer_Implementation.md)
- [API Controllers Implementation](./04_API_Controllers_Implementation.md)
- [Technical Guide Index](./00_Asset_Management_Technical_Guide_Index.md)
