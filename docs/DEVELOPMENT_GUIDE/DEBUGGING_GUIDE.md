# CYPHER APPLICATION DEBUGGING GUIDE

## 🎯 Overview

This comprehensive guide covers debugging techniques and tools for the CYPHER application, including both React frontend and Node.js backend debugging in VS Code. Whether you're troubleshooting API issues, React component problems, or full-stack integration challenges, this guide provides practical solutions.

## 📋 Table of Contents

1. [VS Code Setup for Debugging](#vs-code-setup-for-debugging)
2. [React Frontend Debugging](#react-frontend-debugging)
3. [Node.js Backend Debugging](#nodejs-backend-debugging)
4. [Performance Debugging](#performance-debugging) ⭐ **NEW**
5. [Full-Stack Debugging](#full-stack-debugging)
6. [Common Debugging Scenarios](#common-debugging-scenarios)
7. [Debugging Tools and Extensions](#debugging-tools-and-extensions)
8. [Best Practices](#best-practices)

## 🔧 VS Code Setup for Debugging

### Debug Configuration

Create `.vscode/launch.json` in your CYPHER project root:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug CYPHER Full Stack",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/start-full-stack.js",
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "name": "Debug React in Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/client/src",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/*"
      }
    },
    {
      "name": "Debug API Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/api/server.js",
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "development",
        "PORT": "3001"
      }
    },
    {
      "name": "Debug Client Only",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/client/server.js",
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "development",
        "PORT": "3000"
      }
    }
  ]
}
```

### VS Code Extensions for Debugging

**Essential Extensions:**
- **JavaScript Debugger** (built-in)
- **React Developer Tools** (browser extension)
- **Thunder Client** (API testing)
- **Error Lens** (inline error display)
- **Bracket Pair Colorizer** (code readability)

## 🎨 React Frontend Debugging

### Method 1: Console Debugging (Quick & Effective)

**Enhanced Console Logging in Components:**

```javascript
// Example: AdminUsers.jsx debugging
import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/apiClient';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Component lifecycle debugging
  useEffect(() => {
    console.log('🔍 AdminUsers: Component mounted');
    console.log('📊 AdminUsers: Initial state:', { users, loading, error });
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.group('🚀 AdminUsers: Fetching users');
      console.log('📋 Request params:', filters);
      
      setLoading(true);
      setError(null);
      
      const response = await api.get('/users', { params: filters });
      
      console.log('✅ API Response:', response.data);
      console.log('📊 Users count:', response.data.data?.length);
      
      if (response.data.success) {
        setUsers(response.data.data);
        console.log('✅ Users state updated successfully');
      } else {
        console.warn('⚠️ API returned success: false');
        setError(response.data.message);
      }
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      console.error('📋 Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        config: err.config
      });
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  // State change debugging
  useEffect(() => {
    console.log('🔄 AdminUsers: Users state changed:', {
      count: users.length,
      users: users.slice(0, 3) // Log first 3 users for brevity
    });
  }, [users]);

  useEffect(() => {
    console.log('⏳ AdminUsers: Loading state changed:', loading);
  }, [loading]);

  useEffect(() => {
    if (error) {
      console.error('🚨 AdminUsers: Error state changed:', error);
    }
  }, [error]);

  return (
    <div className="admin-users">
      {/* Component JSX */}
    </div>
  );
};

export default AdminUsers;
```

### Method 2: Custom Debug Hook

**Create a reusable debug hook:**

```javascript
// hooks/useDebug.js
import { useEffect, useRef } from 'react';

export const useDebug = (componentName, props = {}, state = {}) => {
  const renderCount = useRef(0);
  const prevProps = useRef(props);
  const prevState = useRef(state);

  useEffect(() => {
    renderCount.current += 1;
    
    console.group(`🔍 ${componentName} Debug - Render #${renderCount.current}`);
    
    // Check for props changes
    const propsChanged = Object.keys(props).filter(
      key => JSON.stringify(props[key]) !== JSON.stringify(prevProps.current[key])
    );
    
    if (propsChanged.length > 0) {
      console.log('📝 Props Changed:', propsChanged.reduce((acc, key) => {
        acc[key] = { 
          from: prevProps.current[key], 
          to: props[key] 
        };
        return acc;
      }, {}));
    }
    
    // Check for state changes
    const stateChanged = Object.keys(state).filter(
      key => JSON.stringify(state[key]) !== JSON.stringify(prevState.current[key])
    );
    
    if (stateChanged.length > 0) {
      console.log('🔄 State Changed:', stateChanged.reduce((acc, key) => {
        acc[key] = { 
          from: prevState.current[key], 
          to: state[key] 
        };
        return acc;
      }, {}));
    }
    
    console.log('📊 Current Props:', props);
    console.log('📊 Current State:', state);
    console.groupEnd();
    
    prevProps.current = props;
    prevState.current = state;
  });

  return renderCount.current;
};

// Usage in components
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  // Debug this component
  const renderCount = useDebug('AdminUsers', 
    { filters }, 
    { users, loading, usersCount: users.length }
  );

  return (
    <div className="admin-users">
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          Render #{renderCount} | Users: {users.length} | Loading: {loading.toString()}
        </div>
      )}
      {/* Rest of component */}
    </div>
  );
};
```

### Method 3: React Developer Tools

**Browser Extension Setup:**
1. Install React Developer Tools for your browser
2. Open `http://localhost:3000`
3. Open DevTools (F12)
4. Navigate to "Components" tab

**Using React DevTools:**
- **Inspect Components**: Click on components to see props and state
- **Edit Props/State**: Modify values in real-time
- **Component Tree**: Navigate the component hierarchy
- **Profiler**: Analyze component performance
- **Hooks**: Inspect custom hooks and their values

### Method 4: Error Boundary Implementation

**Create comprehensive error boundary:**

```javascript
// components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      eventId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const eventId = Date.now().toString();
    
    console.group('🚨 React Error Boundary - Error Caught');
    console.error('Event ID:', eventId);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Stack:', error.stack);
    console.groupEnd();
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      this.logErrorToService(error, errorInfo, eventId);
    }
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
      eventId: eventId
    });
  }

  logErrorToService = (error, errorInfo, eventId) => {
    // Implementation for error tracking service
    console.log('Logging error to external service:', eventId);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>🚨 Something went wrong</h2>
            <p>We're sorry, but something unexpected happened.</p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>🔍 Error Details (Development Mode)</summary>
                <div className="error-info">
                  <p><strong>Event ID:</strong> {this.state.eventId}</p>
                  <p><strong>Error:</strong> {this.state.error?.toString()}</p>
                  <p><strong>Component Stack:</strong></p>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                  <p><strong>Error Stack:</strong></p>
                  <pre>{this.state.error?.stack}</pre>
                </div>
              </details>
            )}
            
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              🔄 Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

**Wrap your application:**

```javascript
// App.jsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Your routes */}
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

### Method 5: Network Debugging for API Calls

**Enhanced API Client with Debugging:**

```javascript
// utils/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor with detailed logging
apiClient.interceptors.request.use(
  (config) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    config.metadata = { 
      startTime: new Date(),
      requestId: requestId
    };
    
    console.group(`🚀 API Request [${requestId}]: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('📋 Request Details:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      headers: config.headers,
      params: config.params,
      data: config.data,
      timeout: config.timeout
    });
    console.groupEnd();
    
    return config;
  },
  (error) => {
    console.error('❌ Request Setup Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with detailed logging
apiClient.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata.startTime;
    const requestId = response.config.metadata.requestId;
    
    console.group(`✅ API Response [${requestId}]: ${response.status} (${duration}ms)`);
    console.log('📊 Response Details:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      duration: `${duration}ms`
    });
    
    // Log performance warnings
    if (duration > 5000) {
      console.warn('⚠️ Slow API Response:', `${duration}ms`);
    }
    
    console.groupEnd();
    
    return response;
  },
  (error) => {
    const duration = error.config?.metadata ? 
      new Date() - error.config.metadata.startTime : 0;
    const requestId = error.config?.metadata?.requestId || 'unknown';
    
    console.group(`❌ API Error [${requestId}]: ${error.response?.status || 'Network'} (${duration}ms)`);
    console.error('🔍 Error Analysis:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
        params: error.config?.params
      },
      duration: `${duration}ms`
    });
    
    // Handle specific error types
    if (error.code === 'ECONNABORTED') {
      console.error('🕐 Request Timeout:', error.config?.timeout);
    }
    
    if (error.response?.status === 401) {
      console.error('🔐 Authentication Error - Token may be expired');
    }
    
    if (error.response?.status >= 500) {
      console.error('🚨 Server Error - Check API server logs');
    }
    
    console.groupEnd();
    
    // Global error handling
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export { apiClient };
export default apiClient;

## 🔧 Node.js Backend Debugging

### Method 1: VS Code Debugger with Breakpoints

**Start debugging session:**
1. Set breakpoints in your API code (click in gutter next to line numbers)
2. Press F5 or go to "Run and Debug" panel
3. Select "Debug API Server" configuration
4. Server starts in debug mode

**Example: Debugging UserController:**

```javascript
// api/src/controllers/userController.js
class UserController {
  async getAllUsers(req, res) {
    try {
      // Set breakpoint here to inspect request
      const { page, limit, search, isActive } = req.query;
      console.log('🔍 UserController: Request query params:', req.query);

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        isActive: isActive !== undefined ? isActive === 'true' : undefined
      };

      // Set breakpoint here to inspect processed options
      console.log('📊 UserController: Processed options:', options);

      const result = await this.userService.getAllUsers(options);

      // Set breakpoint here to inspect service result
      console.log('✅ UserController: Service result:', {
        userCount: result.users?.length,
        pagination: result.pagination
      });

      res.json({
        success: true,
        message: 'Users retrieved successfully',
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      // Set breakpoint here to inspect errors
      console.error('❌ UserController: Error in getAllUsers:', {
        message: error.message,
        stack: error.stack,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: error.message
      });
    }
  }
}
```

### Method 2: Enhanced Console Logging

**Service Layer Debugging:**

```javascript
// api/src/services/userService.js
class UserService {
  async getAllUsers(options = {}) {
    console.group('🔍 UserService: getAllUsers called');
    console.log('📋 Input options:', options);

    try {
      const { page = 1, limit = 10, search, isActive } = options;
      const offset = (page - 1) * limit;

      console.log('📊 Calculated values:', { page, limit, offset });

      // Build query conditions
      const conditions = [];
      if (search) {
        conditions.push(ilike(users.email, `%${search}%`));
        console.log('🔍 Added search condition for:', search);
      }
      if (isActive !== undefined) {
        conditions.push(eq(users.isActive, isActive));
        console.log('🔍 Added isActive condition:', isActive);
      }

      console.log('📋 Query conditions count:', conditions.length);

      // Execute query
      console.time('Database Query');
      const result = await db
        .select({
          id: users.id,
          email: users.email,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          isActive: users.isActive,
          createdAt: users.createdAt
        })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit)
        .offset(offset);
      console.timeEnd('Database Query');

      console.log('✅ Query result:', {
        count: result.length,
        firstUser: result[0]?.email,
        lastUser: result[result.length - 1]?.email
      });

      const response = {
        users: result,
        pagination: {
          page,
          limit,
          total: result.length,
          hasMore: result.length === limit
        }
      };

      console.log('📊 Service response:', {
        userCount: response.users.length,
        pagination: response.pagination
      });

      console.groupEnd();
      return response;

    } catch (error) {
      console.error('❌ UserService: Database error:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        options: options
      });
      console.groupEnd();
      throw error;
    }
  }
}
```

### Method 3: Database Query Debugging

**Enhanced Database Debugging:**

```javascript
// api/src/db/index.js
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// Create connection with logging
const sql = postgres(process.env.DATABASE_URL, {
  debug: process.env.NODE_ENV === 'development',
  onnotice: (notice) => {
    console.log('📋 PostgreSQL Notice:', notice);
  }
});

// Enhanced database instance with query logging
const db = drizzle(sql, {
  logger: {
    logQuery: (query, params) => {
      console.group('🗄️ Database Query');
      console.log('📝 SQL:', query);
      console.log('📋 Params:', params);
      console.log('🕐 Timestamp:', new Date().toISOString());
      console.groupEnd();
    }
  }
});

module.exports = { db, sql };
```

### Method 4: Middleware Debugging

**Authentication Middleware Debugging:**

```javascript
// api/src/middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  console.group('🔐 Authentication Middleware');

  const authHeader = req.headers['authorization'];
  console.log('📋 Auth header:', authHeader ? 'Present' : 'Missing');

  const token = authHeader && authHeader.split(' ')[1];
  console.log('🎫 Token extracted:', token ? `${token.substring(0, 20)}...` : 'None');

  if (!token) {
    console.log('❌ No token provided');
    console.groupEnd();
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('❌ Token verification failed:', {
        name: err.name,
        message: err.message,
        expiredAt: err.expiredAt
      });
      console.groupEnd();
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    console.log('✅ Token verified for user:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    req.user = user;
    console.groupEnd();
    next();
  });
};
```

### Method 5: API Route Debugging

**Route-Level Debugging:**

```javascript
// api/src/routes/userRoutes.js
const express = require('express');
const UserController = require('../controllers/userController');

const router = express.Router();
const userController = new UserController();

// Debug middleware for all user routes
router.use((req, res, next) => {
  console.group(`🛣️ User Route: ${req.method} ${req.originalUrl}`);
  console.log('📋 Request details:', {
    method: req.method,
    url: req.originalUrl,
    query: req.query,
    body: req.body,
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'Present' : 'Missing',
      'user-agent': req.headers['user-agent']
    },
    user: req.user ? { id: req.user.id, email: req.user.email } : 'Not authenticated'
  });
  console.groupEnd();
  next();
});

router.get('/',
  authenticateToken,
  requireRole(['admin', 'user']),
  (req, res, next) => {
    console.log('🔍 GET /users - Calling controller');
    userController.getAllUsers(req, res).catch(next);
  }
);
```

## � Performance Debugging

### Overview

Performance debugging helps identify and resolve slow application startup, API bottlenecks, and inefficient data loading patterns. The CYPHER application has been optimized with lazy loading to achieve 70-80% faster startup times.

> **See**: [Performance Optimization Guide](./PERFORMANCE_OPTIMIZATION_GUIDE.md) for complete optimization strategies.

### 1. Application Startup Performance

**Measuring Initial Load Time:**

```javascript
// Add to client/src/main.jsx
console.time('App Startup');

// Add to your main App component
const App = () => {
  useEffect(() => {
    console.timeEnd('App Startup');
  }, []);

  return <Router />;
};
```

**Expected Performance Metrics:**
- **Before Optimization**: 3-5 seconds initial load
- **After Lazy Loading**: 0.5-1 second initial load ⚡

### 2. Debugging Slow Components

**Identify components loading data on mount:**

```javascript
// ❌ PROBLEMATIC: Immediate data loading
const SlowComponent = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    console.log('🐌 Loading data immediately on mount');
    fetchData(); // This slows down app startup
  }, []);
};

// ✅ OPTIMIZED: Lazy loading
const FastComponent = () => {
  const dataLazyLoad = useLazyLoadOnDemand(async () => {
    console.log('⚡ Loading data on user request');
    return await fetchData();
  });

  return (
    <LazyDataLoader {...dataLazyLoad}>
      {(data) => <DataDisplay data={data} />}
    </LazyDataLoader>
  );
};
```

### 3. API Performance Debugging

**Add timing to API calls:**

```javascript
// In apiClient.js
const makeRequest = async (url, options) => {
  const startTime = performance.now();
  console.log(`🔍 API Request: ${options.method} ${url}`);

  try {
    const response = await fetch(fullUrl, requestOptions);
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    console.log(`✅ API Response: ${response.status} in ${duration}ms`);
    return response;
  } catch (error) {
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    console.error(`❌ API Error: ${error.message} after ${duration}ms`);
    throw error;
  }
};
```

### 4. Database Query Performance

**Add query timing to services:**

```javascript
// In service files
const getAllRecords = async (filters = {}) => {
  const startTime = performance.now();
  console.log('🔍 Database Query: getAllRecords', filters);

  try {
    const result = await db.select().from(tableName);
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    console.log(`✅ Query completed: ${result.length} records in ${duration}ms`);
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    console.error(`❌ Query failed after ${duration}ms:`, error);
    throw error;
  }
};
```

### 5. Browser Performance Tools

**Chrome DevTools Performance Tab:**

1. **Open DevTools** (F12)
2. **Go to Performance tab**
3. **Click Record** and reload the page
4. **Stop recording** after page loads
5. **Analyze the timeline** for:
   - Long tasks (>50ms)
   - Network requests
   - JavaScript execution time
   - Rendering performance

**Key Metrics to Monitor:**
- **First Contentful Paint (FCP)**: <1.5 seconds
- **Largest Contentful Paint (LCP)**: <2.5 seconds
- **Time to Interactive (TTI)**: <3 seconds
- **API Response Times**: <500ms for most endpoints

### 6. Memory Leak Debugging

**Detect memory leaks in React components:**

```javascript
// Add to components that might leak
useEffect(() => {
  const interval = setInterval(() => {
    console.log('Memory usage:', performance.memory?.usedJSHeapSize);
  }, 5000);

  return () => {
    clearInterval(interval); // Always cleanup!
  };
}, []);
```

### 7. Network Performance

**Monitor API calls during startup:**

```javascript
// Add to main App component
useEffect(() => {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes('/api/')) {
        console.log(`📡 API Call: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
      }
    });
  });

  observer.observe({ entryTypes: ['resource'] });

  return () => observer.disconnect();
}, []);
```

### 8. Performance Debugging Checklist

**Before Optimization:**
- [ ] Measure initial load time
- [ ] Count API calls on startup
- [ ] Identify slow components
- [ ] Check for memory leaks

**After Optimization:**
- [ ] Verify faster startup (<1 second)
- [ ] Confirm reduced API calls (0-2 on startup)
- [ ] Test lazy loading functionality
- [ ] Monitor ongoing performance

**Tools to Use:**
- [ ] Chrome DevTools Performance tab
- [ ] React Developer Tools Profiler
- [ ] Network tab for API monitoring
- [ ] Console timing for custom metrics

## �🔄 Full-Stack Debugging

### Method 1: End-to-End Request Tracing

**Add request IDs for tracing:**

```javascript
// api/src/middleware/requestTracing.js
const { v4: uuidv4 } = require('uuid');

const requestTracing = (req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;

  console.log(`🆔 Request ID: ${requestId} - ${req.method} ${req.originalUrl}`);

  // Add to response headers for frontend debugging
  res.setHeader('X-Request-ID', requestId);

  next();
};

module.exports = requestTracing;
```

**Frontend request tracing:**

```javascript
// client/src/utils/apiClient.js
apiClient.interceptors.response.use(
  (response) => {
    const requestId = response.headers['x-request-id'];
    if (requestId) {
      console.log(`🆔 Response for Request ID: ${requestId}`);
    }
    return response;
  }
);
```

### Method 2: State Synchronization Debugging

**Debug state sync between frontend and backend:**

```javascript
// Custom hook for API state debugging
const useApiState = (endpoint, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchData = useCallback(async () => {
    const fetchId = Math.random().toString(36).substr(2, 9);

    console.group(`🔄 API State Sync [${fetchId}]: ${endpoint}`);
    console.log('📋 Dependencies changed:', dependencies);
    console.log('🕐 Last fetch:', lastFetch);

    try {
      setLoading(true);
      setError(null);

      const response = await api.get(endpoint);

      console.log('✅ Data fetched successfully:', {
        dataType: typeof response.data.data,
        dataLength: Array.isArray(response.data.data) ? response.data.data.length : 'N/A',
        timestamp: new Date().toISOString()
      });

      setData(response.data.data);
      setLastFetch(new Date().toISOString());

    } catch (err) {
      console.error('❌ Fetch failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  }, [endpoint, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, lastFetch };
};
```

## 🎯 Common Debugging Scenarios

### Scenario 1: Authentication Issues

**Problem**: User can't log in or gets 401 errors

**Debugging Steps:**
1. Check network tab for login request/response
2. Verify token is being stored in localStorage
3. Check if token is being sent in Authorization header
4. Verify token format and expiration
5. Check backend JWT verification

**Debug Code:**
```javascript
// Frontend auth debugging
const login = async (email, password) => {
  console.group('🔐 Login Debug');
  console.log('📋 Login attempt:', { email, passwordLength: password.length });

  try {
    const response = await api.post('/auth/login', { email, password });
    console.log('✅ Login response:', response.data);

    if (response.data.success) {
      const { token } = response.data.data;
      console.log('🎫 Token received:', token.substring(0, 20) + '...');

      localStorage.setItem('authToken', token);
      console.log('💾 Token stored in localStorage');

      // Verify token was stored
      const storedToken = localStorage.getItem('authToken');
      console.log('✅ Token verification:', storedToken ? 'Found' : 'Missing');
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data);
  }
  console.groupEnd();
};
```

### Scenario 2: API Data Not Loading

**Problem**: Frontend components show loading state but no data appears

**Debugging Steps:**
1. Check network tab for API requests
2. Verify API endpoint is correct
3. Check authentication headers
4. Verify response data structure
5. Check component state updates

**Debug Code:**
```javascript
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const debugFetch = async () => {
      console.group('📊 AdminUsers Data Fetch Debug');

      try {
        console.log('🚀 Starting fetch...');
        console.log('🔍 Current state:', { usersCount: users.length, loading });

        const response = await api.get('/users');
        console.log('📡 Raw response:', response);
        console.log('📋 Response data:', response.data);

        if (response.data.success) {
          console.log('✅ API success, updating state...');
          console.log('👥 Users data:', response.data.data);
          setUsers(response.data.data);
          console.log('✅ State updated');
        } else {
          console.warn('⚠️ API returned success: false');
        }
      } catch (error) {
        console.error('❌ Fetch error:', error);
      } finally {
        setLoading(false);
        console.log('✅ Loading set to false');
      }

      console.groupEnd();
    };

    debugFetch();
  }, []);

  // Debug render
  console.log('🎨 AdminUsers render:', { usersCount: users.length, loading });

  return (
    <div>
      {loading ? (
        <div>Loading... (Debug: {users.length} users loaded)</div>
      ) : (
        <div>
          <p>Debug: Showing {users.length} users</p>
          {users.map(user => (
            <div key={user.id}>{user.email}</div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Scenario 3: Database Connection Issues

**Problem**: API returns 500 errors, database queries fail

**Debugging Steps:**
1. Check database connection string
2. Verify database server is running
3. Check database credentials
4. Test connection with database client
5. Review database logs

**Debug Code:**
```javascript
// api/src/db/index.js
const testConnection = async () => {
  console.group('🗄️ Database Connection Test');

  try {
    console.log('📋 Connection string:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@'));

    const result = await sql`SELECT NOW() as current_time, version() as version`;
    console.log('✅ Database connected successfully:', result[0]);

    // Test a simple query
    const userCount = await db.select({ count: sql`count(*)` }).from(users);
    console.log('📊 User count test:', userCount[0]);

  } catch (error) {
    console.error('❌ Database connection failed:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  }

  console.groupEnd();
};

// Call on server start
testConnection();

### Scenario 4: Module Import Errors

**Problem:** Server crashes with "Cannot find module" errors

**Symptoms:**
```
Error: Cannot find module '../middleware/permissions'
Require stack:
- C:\CYPHER\cypher\api\src\routes\globalMetrics.js
```

**Debugging Steps:**
1. Check the exact file path in the error message
2. Verify the file exists at the expected location
3. Check for typos in the import path
4. Verify the correct file name and extension

**Debug Code:**
```javascript
// Check what files exist in the middleware directory
const fs = require('fs');
const path = require('path');

const middlewareDir = path.join(__dirname, '../middleware');
console.log('📁 Middleware directory contents:');
fs.readdirSync(middlewareDir).forEach(file => {
  console.log(`   📄 ${file}`);
});

// Verify the correct import path
try {
  const { requireRole } = require('../middleware/auth');
  console.log('✅ Auth middleware loaded successfully');
} catch (error) {
  console.error('❌ Failed to load auth middleware:', error.message);
}
```

**Solution:**
```javascript
// Wrong import (old RBAC system)
const { requirePermission } = require('../middleware/rbac');

// Correct import (simple role-based system)
const { requireRole } = require('../middleware/auth');
```

**Prevention:**
- Use VS Code IntelliSense for auto-completion
- Check file existence before importing
- Use consistent naming conventions
- Keep import paths relative and accurate

## 🛠️ Debugging Tools and Extensions

### Essential VS Code Extensions

**Core Debugging Extensions:**
- **JavaScript Debugger** (built-in) - Node.js and browser debugging
- **Thunder Client** - API testing within VS Code
- **Error Lens** - Inline error and warning display
- **Bracket Pair Colorizer** - Visual bracket matching
- **GitLens** - Git integration and blame information

**React-Specific Extensions:**
- **ES7+ React/Redux/React-Native snippets** - Code snippets
- **Auto Rename Tag** - Automatically rename paired HTML/JSX tags
- **Prettier** - Code formatting
- **ESLint** - Code linting and error detection

### Browser Developer Tools

**Chrome DevTools Features:**
- **Console**: Advanced logging and debugging
- **Network**: API request/response monitoring
- **Sources**: Breakpoint debugging with source maps
- **Application**: localStorage, sessionStorage, cookies
- **Performance**: React component performance profiling

**React Developer Tools:**
- **Components Tab**: Component tree inspection
- **Profiler Tab**: Performance analysis
- **Props/State Editing**: Real-time value modification
- **Hook Inspection**: Custom hook debugging

### External Debugging Tools

**API Testing Tools:**
- **Postman** - Comprehensive API testing
- **Insomnia** - Lightweight API client
- **Thunder Client** - VS Code integrated API testing

**Database Tools:**
- **pgAdmin** - PostgreSQL administration
- **DBeaver** - Universal database tool
- **TablePlus** - Modern database client

**Monitoring Tools:**
- **Node.js Inspector** - Built-in Node.js debugger
- **PM2 Monit** - Process monitoring
- **Winston** - Advanced logging library

## 📋 Best Practices

### Console Logging Best Practices

**1. Use Structured Logging:**
```javascript
// Good: Structured and informative
console.log('🔍 UserService: Fetching users', {
  page: 1,
  limit: 10,
  filters: { search: 'john', isActive: true },
  timestamp: new Date().toISOString()
});

// Bad: Unstructured and unclear
console.log('getting users', page, limit);
```

**2. Use Console Groups:**
```javascript
// Group related logs together
console.group('🚀 API Request: POST /users');
console.log('📋 Request data:', userData);
console.log('🔐 User permissions:', userPermissions);
console.log('⏱️ Request timestamp:', new Date().toISOString());
console.groupEnd();
```

**3. Use Appropriate Log Levels:**
```javascript
console.log('ℹ️ Info: Normal operation');
console.warn('⚠️ Warning: Potential issue');
console.error('❌ Error: Something went wrong');
console.debug('🔍 Debug: Detailed information');
```

**4. Include Context Information:**
```javascript
const debugContext = {
  component: 'AdminUsers',
  action: 'fetchUsers',
  user: req.user?.email,
  requestId: req.requestId,
  timestamp: new Date().toISOString()
};

console.log('🔍 Debug context:', debugContext);
```

### Error Handling Best Practices

**1. Comprehensive Error Information:**
```javascript
try {
  await riskyOperation();
} catch (error) {
  console.error('❌ Operation failed:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    context: {
      operation: 'riskyOperation',
      parameters: { /* relevant params */ },
      timestamp: new Date().toISOString()
    }
  });
}
```

**2. Error Boundaries for React:**
```javascript
// Always wrap your app in error boundaries
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**3. Global Error Handlers:**
```javascript
// Backend: Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 Global error handler:', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    user: req.user?.email,
    requestId: req.requestId
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    requestId: req.requestId
  });
});

// Frontend: Global error handler
window.addEventListener('error', (event) => {
  console.error('🚨 Global JavaScript error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});
```

### Performance Debugging

**1. Measure API Response Times:**
```javascript
const measureApiCall = async (apiCall, description) => {
  const startTime = performance.now();

  try {
    const result = await apiCall();
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`⏱️ ${description}: ${duration.toFixed(2)}ms`);

    if (duration > 1000) {
      console.warn(`⚠️ Slow API call detected: ${description} took ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.error(`❌ ${description} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};

// Usage
const users = await measureApiCall(
  () => api.get('/users'),
  'Fetch users'
);
```

**2. React Component Performance:**
```javascript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  console.log('🎨 ExpensiveComponent render:', data.length, 'items');

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
});

// Use useMemo for expensive calculations
const ExpensiveCalculation = ({ items }) => {
  const expensiveValue = useMemo(() => {
    console.log('🧮 Calculating expensive value...');
    return items.reduce((sum, item) => sum + item.value, 0);
  }, [items]);

  return <div>Total: {expensiveValue}</div>;
};
```

### Security Debugging

**1. Sanitize Sensitive Data in Logs:**
```javascript
const sanitizeForLogging = (data) => {
  const sanitized = { ...data };

  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.secret;

  // Mask email addresses in production
  if (process.env.NODE_ENV === 'production' && sanitized.email) {
    sanitized.email = sanitized.email.replace(/(.{2}).*@/, '$1***@');
  }

  return sanitized;
};

console.log('👤 User data:', sanitizeForLogging(userData));
```

**2. Debug Authentication Flow:**
```javascript
const debugAuth = (req, res, next) => {
  console.group('🔐 Authentication Debug');
  console.log('📋 Headers:', {
    authorization: req.headers.authorization ? 'Present' : 'Missing',
    'content-type': req.headers['content-type'],
    origin: req.headers.origin
  });

  if (req.user) {
    console.log('👤 Authenticated user:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      permissions: req.user.permissions?.length || 0
    });
  } else {
    console.log('❌ No authenticated user');
  }

  console.groupEnd();
  next();
};
```

## 🚨 Troubleshooting Common Issues

### Issue 1: "Cannot read property of undefined"

**Symptoms:** React components crash with undefined property errors

**Debug Steps:**
```javascript
// Add defensive checks and logging
const UserProfile = ({ user }) => {
  console.log('👤 UserProfile props:', { user });

  if (!user) {
    console.warn('⚠️ UserProfile: No user prop provided');
    return <div>Loading user...</div>;
  }

  if (!user.profile) {
    console.warn('⚠️ UserProfile: User has no profile data');
    return <div>No profile data available</div>;
  }

  return (
    <div>
      <h1>{user.profile?.firstName || 'Unknown'} {user.profile?.lastName || 'User'}</h1>
    </div>
  );
};
```

### Issue 2: API Requests Failing Silently

**Symptoms:** No error messages, requests seem to disappear

**Debug Steps:**
```javascript
// Enhanced error handling in API client
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log all error details
    console.group('❌ API Request Failed');
    console.error('URL:', error.config?.url);
    console.error('Method:', error.config?.method);
    console.error('Status:', error.response?.status);
    console.error('Response:', error.response?.data);
    console.error('Request Data:', error.config?.data);
    console.groupEnd();

    // Don't silently fail
    throw error;
  }
);
```

### Issue 3: Database Queries Not Working

**Symptoms:** API returns empty results or errors

**Debug Steps:**
```javascript
// Add query debugging to service layer
const getUsersWithDebug = async (options) => {
  console.group('🗄️ Database Query Debug');

  try {
    // Log the query being built
    console.log('📋 Query options:', options);

    const query = db
      .select()
      .from(users)
      .where(/* conditions */);

    // Log the actual SQL (if possible)
    console.log('📝 Generated SQL:', query.toSQL?.());

    const result = await query;
    console.log('✅ Query result:', {
      count: result.length,
      sample: result.slice(0, 2)
    });

    return result;
  } catch (error) {
    console.error('❌ Database query failed:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    throw error;
  } finally {
    console.groupEnd();
  }
};
```

### Issue 4: React State Not Updating

**Symptoms:** Component doesn't re-render after state changes

**Debug Steps:**
```javascript
const [users, setUsers] = useState([]);

// Debug state updates
const updateUsers = (newUsers) => {
  console.group('🔄 State Update Debug');
  console.log('📊 Current users:', users.length);
  console.log('📊 New users:', newUsers.length);
  console.log('🔍 Are they different?', users !== newUsers);
  console.log('🔍 Deep equal?', JSON.stringify(users) === JSON.stringify(newUsers));

  setUsers(newUsers);
  console.log('✅ setState called');
  console.groupEnd();
};

// Debug re-renders
useEffect(() => {
  console.log('🎨 Component re-rendered, users count:', users.length);
}, [users]);
```

## 📚 Additional Resources

### Documentation Links
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Node.js Debugging](https://nodejs.org/en/docs/guides/debugging-getting-started/)

### CYPHER-Specific Debugging
- **API Documentation**: `http://localhost:3001/api-docs`
- **API Testing**: `http://localhost:3001/api-test`
- **Health Check**: `http://localhost:3001/health`
- **Database Schema**: `api/src/db/schema/`

### Quick Debug Commands

```bash
# Start CYPHER in debug mode
npm run dev

# Test API endpoints
curl http://localhost:3001/health

# Check database connection
node -e "require('./api/src/db').testConnection()"

# View application logs
tail -f logs/application.log
```

---

**🎯 Remember: Good debugging is about being systematic, thorough, and patient. Use these tools and techniques to efficiently identify and resolve issues in your CYPHER application!**
```
```
