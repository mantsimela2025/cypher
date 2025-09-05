# API Client Consistency Guide

## 🎯 **Overview**

This guide ensures consistent API consumption patterns across the CYPHER client application. All API calls should use the centralized `apiClient` utility for consistency, security, and maintainability.

## ✅ **Correct API Usage Patterns**

### **1. Use apiClient for All API Calls**

```javascript
// ✅ CORRECT - Use apiClient
import { apiClient } from '@/utils/apiClient';

export const myApi = {
  async getData(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/data?${queryString}` : '/data';
    return await apiClient.get(endpoint);
  },

  async createData(data) {
    return await apiClient.post('/data', data);
  },

  async updateData(id, data) {
    return await apiClient.put(`/data/${id}`, data);
  },

  async deleteData(id) {
    return await apiClient.delete(`/data/${id}`);
  }
};
```

### **2. Environment-Aware Configuration**

```javascript
// ✅ CORRECT - Use centralized config
import { API_CONFIG, log } from '@/utils/config';

// API base URL is automatically determined by environment
const endpoint = '/users'; // Relative path
log.api('Making request to:', endpoint);
```

## ❌ **Incorrect Patterns to Avoid**

### **1. Direct fetch() Calls**

```javascript
// ❌ WRONG - Direct fetch without token management
const response = await fetch('/api/v1/data', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
  }
});
```

### **2. Hardcoded URLs**

```javascript
// ❌ WRONG - Hardcoded URLs
const API_BASE_URL = 'http://localhost:3001/api/v1';
const response = await fetch(`${API_BASE_URL}/data`);
```

### **3. Manual Token Management**

```javascript
// ❌ WRONG - Manual token handling
const token = localStorage.getItem('accessToken');
if (!token) {
  // Manual redirect logic
}
```

## 🔧 **Migration Guide**

### **Step 1: Replace Direct fetch() Calls**

**Before:**
```javascript
const response = await fetch('/api/v1/users', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

**After:**
```javascript
import { apiClient } from '@/utils/apiClient';

const data = await apiClient.get('/users');
```

### **Step 2: Remove Hardcoded URLs**

**Before:**
```javascript
const API_BASE_URL = 'http://localhost:3001/api/v1';
const url = `${API_BASE_URL}/users`;
```

**After:**
```javascript
// URL is handled automatically by apiClient
const endpoint = '/users';
```

### **Step 3: Update Error Handling**

**Before:**
```javascript
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
} catch (error) {
  console.error('API error:', error);
}
```

**After:**
```javascript
try {
  const data = await apiClient.get('/users');
  // apiClient handles response parsing and errors automatically
} catch (error) {
  // apiClient provides consistent error messages
  console.error('API error:', error.message);
}
```

## 🌍 **Environment Configuration**

### **Client Environment Files**

- **`.env.development`** - Development settings
- **`.env.production`** - Production settings
- **`.env`** - Default/local overrides

### **Environment Variables**

```bash
# Client (.env files)
REACT_APP_API_BASE_URL=http://localhost:3001/api/v1  # Development
REACT_APP_API_BASE_URL=https://api.your-domain.com/api/v1  # Production

# API (.env file)
PORT=3001                    # Development
PORT=${PORT:-3001}          # Production (uses environment variable or default)
CORS_ORIGIN=http://localhost:3000                    # Development
CORS_ORIGIN=${FRONTEND_URL:-https://your-domain.com} # Production
```

## 🔍 **Benefits of Consistent API Usage**

### **1. Automatic Token Management**
- Automatic token refresh
- Session expiration handling
- Logout and redirect on auth failure

### **2. Environment Flexibility**
- Automatic URL configuration
- Easy deployment across environments
- No hardcoded values

### **3. Error Handling**
- Consistent error messages
- Automatic error logging
- User-friendly error notifications

### **4. Caching Integration**
- Automatic cache invalidation
- Request deduplication
- Performance optimization

## 📋 **Checklist for API Files**

- [ ] Uses `apiClient` instead of direct `fetch()`
- [ ] No hardcoded URLs or base URLs
- [ ] Imports from `@/utils/apiClient`
- [ ] Uses relative endpoints (e.g., `/users` not `http://localhost:3001/api/v1/users`)
- [ ] Includes proper error handling
- [ ] Uses consistent logging with `log.api()`
- [ ] Follows naming conventions (`myApi.js`, `myApi.getData()`)

## 🚀 **Quick Fix Commands**

### **Find Inconsistent API Usage**
```bash
# Find direct fetch calls
grep -r "fetch(" client/src --include="*.js" --include="*.jsx"

# Find hardcoded URLs
grep -r "localhost:3001" client/src --include="*.js" --include="*.jsx"
grep -r "http://" client/src --include="*.js" --include="*.jsx"
```

### **Validate Configuration**
```javascript
// Add to your main App component
import config from '@/utils/config';

useEffect(() => {
  const validation = config.validateConfig();
  if (!validation.isValid) {
    console.warn('Configuration issues:', validation.issues);
  }
}, []);
```

## 📚 **Related Documentation**

- [API Development Guide](./API_DEVELOPMENT_GUIDE.md)
- [Development Patterns Guide](./DEVELOPMENT_PATTERNS_GUIDE.md)
- [Environment Configuration Guide](./ENVIRONMENT_CONFIGURATION_GUIDE.md)

---

**Remember:** Consistency in API usage leads to more maintainable, secure, and reliable applications! 🎯
