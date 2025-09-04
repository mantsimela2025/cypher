# 🏗️ API Development Best Practices Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Session Management & Timeout Handling](#session-management--timeout-handling)
3. [Backend API Layer Standards](#backend-api-layer-standards)
4. [Frontend Client Layer Standards](#frontend-client-layer-standards)
5. [Cache Management Patterns](#cache-management-patterns)
6. [Security & Validation Patterns](#security--validation-patterns)
7. [Development Checklists](#development-checklists)
8. [Quick Reference Templates](#quick-reference-templates)

---

## 🎯 Overview

This guide establishes comprehensive best practices for API development in the CYPHER application, ensuring consistent session management, optimal performance, and reliable user experience.

### Key Principles
- **Automatic Session Management**: No more timeout issues
- **Efficient Caching**: Better performance and UX
- **Consistent Security**: Proper authentication and authorization
- **Reliable Data Loading**: Predictable loading states
- **User-Friendly Errors**: Clear error messages
- **Optimal Performance**: Lazy loading and smart caching

---

## 🔐 Session Management & Timeout Handling

### Authentication Type: JWT Token-Based

#### Token Lifecycle
```javascript
// Access Token: 15 minutes (short-lived)
expiresIn: '15m'

// Refresh Token: 7 days (long-lived)  
expiresIn: '7d'
```

#### Automatic Refresh Flow
1. **Token Check**: Every API call checks token expiration
2. **Auto Refresh**: Expired tokens automatically refreshed
3. **Seamless UX**: Users never see login screen during refresh
4. **Fallback**: Redirect to login only if refresh fails

### Timeout Layers
- **JWT Access Token**: 15 minutes
- **API Cache**: 5 minutes (configurable)
- **Backend Route Cache**: 3-15 minutes (varies by endpoint)

### Solution Components
- ✅ **Enhanced API Client**: Automatic token refresh
- ✅ **Timeout Manager**: Proactive monitoring and warnings
- ✅ **Session Status Component**: Real-time status display
- ✅ **Cache Management**: Smart invalidation strategies

---

## 🎯 Backend API Layer Standards

### 1. Consistent Response Structure

**✅ Always use this response format:**

```javascript
// ✅ Standard Success Response
res.status(200).json({
  success: true,
  data: result,
  message: 'Operation completed successfully',
  pagination: { page: 1, limit: 10, total: 100, pages: 10 } // if applicable
});

// ✅ Standard Error Response  
res.status(400).json({
  success: false,
  message: 'Validation failed',
  errors: ['Field is required'], // detailed errors if applicable
});
```

### 2. Authentication Middleware

**✅ Always protect routes with authentication:**

```javascript
// ✅ Protected Route Pattern
router.get('/assets', authenticateToken, assetsController.getAssets);
router.post('/assets', authenticateToken, validateAsset, assetsController.createAsset);

// ✅ Optional Authentication (for public endpoints)
router.get('/public-data', optionalAuth, controller.getPublicData);
```

### 3. Caching Strategy

**✅ Apply appropriate caching based on data volatility:**

```javascript
// ✅ Caching Guidelines
app.use('/api/v1/assets', cache(300), require('./routes/assets')); // 5 min - frequently changing
app.use('/api/v1/systems', cache(900), require('./routes/systems')); // 15 min - stable data
app.use('/api/v1/categories', cache(1800), require('./routes/categories')); // 30 min - rarely changes
app.use('/api/v1/real-time-metrics', require('./routes/metrics')); // No cache - real-time data
```

### 4. Error Handling Pattern

**✅ Consistent error handling:**

```javascript
// ✅ Controller Error Pattern
const controller = {
  async getAssets(req, res, next) {
    try {
      const result = await assetService.getAssets(req.query);
      
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: 'Assets retrieved successfully'
      });
    } catch (error) {
      // Let global error handler manage it
      next(error);
    }
  }
};
```

---

## 🖥️ Frontend Client Layer Standards

### 1. Enhanced API Utilities Pattern

**✅ Always use the enhanced API pattern:**

```javascript
// ✅ Enhanced API Utility Pattern
import { apiClient } from './apiClient';
import { cacheUtils } from './apiCache';

export const newFeatureApi = {
  async getData(params = {}) {
    try {
      console.log('🌐 Fetching data...');
      
      // Use apiClient for automatic token refresh
      const result = await apiClient.get(`/new-feature?${new URLSearchParams(params)}`);
      
      console.log('✅ Data received:', result);
      return {
        success: true,
        data: result.data,
        pagination: result.pagination
      };
    } catch (error) {
      console.error('❌ Failed to fetch data:', error);
      
      // Session timeout is handled by apiClient
      if (error.message.includes('Session expired')) {
        throw error;
      }
      
      throw new Error(`Failed to load data: ${error.message}`);
    }
  },

  async createData(data) {
    try {
      const result = await apiClient.post('/new-feature', data);
      
      // Clear related cache after successful creation
      cacheUtils.invalidateResource('new-feature');
      
      return {
        success: true,
        data: result.data,
        message: result.message || 'Created successfully'
      };
    } catch (error) {
      console.error('❌ Failed to create data:', error);
      throw new Error(`Failed to create: ${error.message}`);
    }
  }
};
```

### 2. Component Data Loading Pattern

**✅ Use this pattern for loading data in components:**

```javascript
// ✅ Component Data Loading Pattern
import React, { useState, useEffect } from 'react';
import { newFeatureApi } from '@/utils/newFeatureApi';
import { useAuth } from '@/context/AuthContext';

const NewFeatureComponent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  const loadData = async (params = {}) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await newFeatureApi.getData(params);
      setData(response.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError(error.message);
      
      // Don't show error for session timeouts (handled by timeout manager)
      if (!error.message.includes('Session expired')) {
        // Show user-friendly error
        setError('Failed to load data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  // Component JSX...
};
```

### 3. Form Submission Pattern

**✅ Use this pattern for form submissions:**

```javascript
// ✅ Form Submission Pattern
const handleSubmit = async (formData) => {
  setLoading(true);
  setError(null);
  setSuccess(false);
  
  try {
    const response = await newFeatureApi.createData(formData);
    
    setSuccess(true);
    
    // Refresh data after successful creation
    await loadData();
    
    // Close form or reset
    onClose();
  } catch (error) {
    console.error('Submission failed:', error);
    
    // Don't show error for session timeouts
    if (!error.message.includes('Session expired')) {
      setError(error.message);
    }
  } finally {
    setLoading(false);
  }
};
```

---

## 🔄 Cache Management Patterns

### 1. Cache Invalidation Strategy

**✅ Clear cache after data modifications:**

```javascript
// ✅ Cache Invalidation Patterns
export const dataApi = {
  async createItem(data) {
    const result = await apiClient.post('/items', data);
    
    // Clear related caches
    cacheUtils.invalidateResource('items');
    cacheUtils.invalidateResource('dashboard'); // if dashboard shows this data
    
    return result;
  },

  async updateItem(id, data) {
    const result = await apiClient.put(`/items/${id}`, data);
    
    // Clear specific item and list caches
    cacheUtils.invalidatePattern(`items/${id}`);
    cacheUtils.invalidateResource('items');
    
    return result;
  },

  async deleteItem(id) {
    const result = await apiClient.delete(`/items/${id}`);
    
    // Clear all related caches
    cacheUtils.invalidateResource('items');
    
    return result;
  }
};
```

### 2. Lazy Loading with Cache

**✅ Use LazyDataLoader for consistent UX:**

```javascript
// ✅ Lazy Loading Pattern
import LazyDataLoader from '@/components/LazyDataLoader';

const DataSection = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await dataApi.getData();
      setData(response.data);
      setHasLoaded(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LazyDataLoader
      data={data}
      loading={loading}
      error={error}
      hasLoaded={hasLoaded}
      loadData={loadData}
      loadingMessage="Loading data..."
      errorMessage="Failed to load data"
      emptyMessage="No data available"
    >
      {/* Your data display component */}
      <DataDisplay data={data} />
    </LazyDataLoader>
  );
};
```

---

## 🛡️ Security & Validation Patterns

### 1. Input Validation

**✅ Always validate on both client and server:**

```javascript
// ✅ Backend Validation
const validateAsset = [
  body('hostname').notEmpty().withMessage('Hostname is required'),
  body('systemId').notEmpty().withMessage('System ID is required'),
  body('ipAddress').optional().isIP().withMessage('Invalid IP address'),
];

// ✅ Frontend Validation (React Hook Form)
const { register, handleSubmit, formState: { errors } } = useForm({
  defaultValues: {
    hostname: '',
    systemId: '',
    ipAddress: ''
  }
});

const onSubmit = async (data) => {
  // Additional client-side validation if needed
  if (!data.hostname.trim()) {
    setError('Hostname is required');
    return;
  }

  // Submit data
  await submitData(data);
};
```

### 2. Permission Checks

**✅ Check permissions on both layers:**

```javascript
// ✅ Backend Permission Check
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

// ✅ Frontend Permission Check
const { user } = useAuth();

const canCreateAssets = user?.permissions?.includes('assets:create');

return (
  <div>
    {canCreateAssets && (
      <Button onClick={openCreatePanel}>Add Asset</Button>
    )}
  </div>
);
```

---

## 📋 Development Checklists

### ✅ Backend API Checklist:
- [ ] Uses consistent response structure
- [ ] Protected with `authenticateToken` middleware
- [ ] Includes appropriate caching headers
- [ ] Has proper error handling with `next(error)`
- [ ] Validates input data
- [ ] Checks user permissions
- [ ] Logs important operations
- [ ] Returns meaningful error messages

### ✅ Frontend API Checklist:
- [ ] Uses `apiClient` for automatic token refresh
- [ ] Handles session timeouts gracefully
- [ ] Implements proper loading states
- [ ] Shows user-friendly error messages
- [ ] Invalidates cache after mutations
- [ ] Uses lazy loading for performance
- [ ] Checks user permissions before showing UI
- [ ] Provides retry mechanisms

---

## 🎯 Quick Reference Templates

### Backend Route Template:
```javascript
// ✅ Complete Backend Route Template
router.get('/items',
  authenticateToken,           // Authentication
  requirePermission('items:read'), // Authorization
  validateQuery,               // Input validation
  cache(300),                 // Caching (5 minutes)
  async (req, res, next) => {
    try {
      const result = await itemService.getItems(req.query);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: 'Items retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);
```

### Frontend API Template:
```javascript
// ✅ Complete Frontend API Template
export const itemsApi = {
  async getItems(params = {}) {
    try {
      const endpoint = `/items?${new URLSearchParams(params)}`;
      const result = await apiClient.get(endpoint);

      return {
        success: true,
        data: result.data,
        pagination: result.pagination
      };
    } catch (error) {
      if (error.message.includes('Session expired')) {
        throw error;
      }
      throw new Error(`Failed to load items: ${error.message}`);
    }
  }
};
```

---

## 🚀 Implementation Guide

### Adding Session Status to Your App:

1. **Add to Header/Navbar:**
```jsx
import SessionStatus from '@/components/SessionStatus';

// In your header component
<SessionStatus showExtendButton={true} showTimeRemaining={true} />
```

2. **Test the Implementation:**
- Leave page idle for 13+ minutes
- Should see warning at 13 minutes
- Data should remain loaded after token refresh
- Session should extend automatically on API calls

### Optional Enhancements:
- **Session Extension Modal**: More prominent session extension dialog
- **Offline Detection**: Handle network disconnections
- **Background Sync**: Sync data when connection restored

---

## 🎯 Summary

By following these patterns, you'll ensure:

- **🔄 Automatic Session Management**: No more timeout issues
- **💾 Efficient Caching**: Better performance and UX
- **🛡️ Consistent Security**: Proper authentication and authorization
- **📊 Reliable Data Loading**: Predictable loading states
- **🎯 User-Friendly Errors**: Clear error messages
- **⚡ Optimal Performance**: Lazy loading and smart caching

**Key Principle**: Always use the enhanced `apiClient` and `cacheUtils` - they handle all the complex timeout and session management automatically! 🎉

---

## 📞 Support

For questions or clarifications about these best practices, refer to:
- `client/src/utils/apiClient.js` - Enhanced API client with token refresh
- `client/src/utils/timeoutManager.js` - Comprehensive timeout management
- `client/src/utils/apiCache.js` - Smart caching utilities
- `client/src/components/SessionStatus.jsx` - Session status component

---

*Last Updated: 2025-08-22*
*Version: 1.0*
