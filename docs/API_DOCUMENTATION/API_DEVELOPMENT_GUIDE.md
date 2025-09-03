# API Development Guide

## Table of Contents

1. [Overview](#overview)
2. [Backend API Development](#backend-api-development)
3. [Frontend API Consumption](#frontend-api-consumption)
4. [Lazy Loading and Performance](#lazy-loading-and-performance) ⭐ **NEW**
5. [Security and Authentication](#security-and-authentication)
6. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)
7. [Testing Patterns](#testing-patterns)
8. [Performance Best Practices](#performance-best-practices)
9. [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview

This guide establishes standardized patterns for developing and consuming APIs in the RAS Dashboard application. Following these patterns will prevent common issues like SQL syntax errors, authentication failures, and inconsistent error handling.

### Design Principles

- **Consistency**: All APIs follow the same structure and response format
- **Security**: Authentication and authorization are applied consistently
- **Error Handling**: Structured error responses with proper HTTP status codes
- **Performance**: Optimized database queries, lazy loading, and caching strategies
- **Maintainability**: Clear separation of concerns between layers
- **Lazy Loading**: Frontend components load data on demand for better performance

---

## Backend API Development

### 1. Service Layer Pattern

**Location**: `api/src/services/`

The service layer handles all database operations and business logic. It must use Drizzle ORM with proper SQL syntax.

#### ✅ Correct Service Implementation

```javascript
const { and, eq, sql } = require('drizzle-orm');
const { db } = require('../db');
const { tableName, relatedTable } = require('../db/schema');

class ExampleService {
  async getAllRecords(filters = {}, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      // ✅ CORRECT: Proper COUNT syntax with table reference
      const records = await db.select({
        id: tableName.id,
        name: tableName.name,
        description: tableName.description,
        createdAt: tableName.createdAt,
        updatedAt: tableName.updatedAt,
        // ✅ CORRECT: COUNT with proper table reference
        relatedCount: sql`COUNT(${relatedTable.id})`.as('related_count'),
      })
        .from(tableName)
        .leftJoin(relatedTable, eq(relatedTable.foreignKey, tableName.id))
        .groupBy(
          tableName.id,
          tableName.name,
          tableName.description,
          tableName.createdAt,
          tableName.updatedAt
        )
        .limit(limit)
        .offset(offset);

      return { data: records, total: records.length };
    } catch (error) {
      console.error('Error in getAllRecords:', error);
      throw error;
    }
  }

  async searchRecords(searchTerm) {
    try {
      // ✅ CORRECT: Proper ILIKE syntax with parameter binding
      const records = await db.select()
        .from(tableName)
        .where(sql`${tableName.name} ILIKE ${`%${searchTerm}%`} OR ${tableName.description} ILIKE ${`%${searchTerm}%`}`);
      
      return records;
    } catch (error) {
      console.error('Error in searchRecords:', error);
      throw error;
    }
  }

  async createRecord(data) {
    try {
      const [inserted] = await db.insert(tableName)
        .values(data)
        .returning();
      return inserted;
    } catch (error) {
      console.error('Error in createRecord:', error);
      throw error;
    }
  }

  async updateRecord(id, data) {
    try {
      const [updated] = await db.update(tableName)
        .set({ ...data, updatedAt: sql`NOW()` })
        .where(eq(tableName.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error in updateRecord:', error);
      throw error;
    }
  }

  async deleteRecord(id) {
    try {
      // Cascade delete related records first if needed
      await db.delete(relatedTable).where(eq(relatedTable.foreignKey, id));
      
      const result = await db.delete(tableName)
        .where(eq(tableName.id, id));
      return result;
    } catch (error) {
      console.error('Error in deleteRecord:', error);
      throw error;
    }
  }
}

module.exports = new ExampleService();
```

#### ❌ Common SQL Syntax Errors to Avoid

```javascript
// ❌ WRONG: Empty COUNT() function
memberCount: sql`COUNT()`.as('member_count'),

// ✅ CORRECT: COUNT with table reference
memberCount: sql`COUNT(${relatedTable.id})`.as('member_count'),

// ❌ WRONG: Incomplete SQL template
.where(sql`${users.id} NOT IN ()`);

// ✅ CORRECT: Complete SQL with subquery
.where(sql`${users.id} NOT IN (${subquery})`);

// ❌ WRONG: Broken ILIKE syntax
.where(sql`ILIKE  OR ILIKE `);

// ✅ CORRECT: Proper ILIKE with parameters
.where(sql`${table.field1} ILIKE ${`%${searchTerm}%`} OR ${table.field2} ILIKE ${`%${searchTerm}%`}`);
```

### 2. Controller Layer Pattern

**Location**: `api/src/controllers/`

Controllers handle HTTP requests, validate input, and return structured responses.

#### ✅ Correct Controller Implementation

```javascript
const serviceName = require('../services/serviceNameService');
const { validationResult } = require('express-validator');

class ExampleController {
  async getAll(req, res) {
    try {
      // Extract and validate query parameters
      const {
        page = 1,
        limit = 50,
        search = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filters = { search };
      const options = {
        limit: parseInt(limit, 10),
        offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
        sortBy,
        sortOrder
      };

      const result = await serviceName.getAllRecords(filters, options);
      
      // ✅ CORRECT: Structured success response
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total: result.total,
          totalPages: Math.ceil(result.total / parseInt(limit, 10))
        },
        message: `Retrieved ${result.data.length} records`
      });
    } catch (error) {
      console.error('Error in getAll:', error);
      
      // ✅ CORRECT: Structured error response
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve records',
        timestamp: new Date().toISOString()
      });
    }
  }

  async getById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      
      // ✅ CORRECT: Input validation
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid ID parameter'
        });
      }

      const record = await serviceName.getById(id);
      
      if (!record) {
        return res.status(404).json({
          success: false,
          error: 'Record not found'
        });
      }

      res.status(200).json({
        success: true,
        data: record
      });
    } catch (error) {
      console.error('Error in getById:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve record'
      });
    }
  }

  async create(req, res) {
    try {
      // ✅ CORRECT: Validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const createdBy = req.user?.id || req.body.createdBy;
      const data = { ...req.body, createdBy };

      const record = await serviceName.createRecord(data);
      
      res.status(201).json({
        success: true,
        data: record,
        message: 'Record created successfully'
      });
    } catch (error) {
      console.error('Error in create:', error);
      
      // ✅ CORRECT: Handle specific error types
      if (error.code === '23505') { // PostgreSQL unique violation
        return res.status(409).json({
          success: false,
          error: 'Record already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create record'
      });
    }
  }

  async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const id = parseInt(req.params.id, 10);
      const updatedRecord = await serviceName.updateRecord(id, req.body);
      
      res.status(200).json({
        success: true,
        data: updatedRecord,
        message: 'Record updated successfully'
      });
    } catch (error) {
      console.error('Error in update:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update record'
      });
    }
  }

  async delete(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      await serviceName.deleteRecord(id);
      
      res.status(200).json({
        success: true,
        message: 'Record deleted successfully'
      });
    } catch (error) {
      console.error('Error in delete:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete record'
      });
    }
  }
}

module.exports = new ExampleController();
```

### 3. Routes Layer Pattern

**Location**: `api/src/routes/`

Routes define endpoints, apply middleware, and connect controllers.

#### ✅ Correct Route Implementation

```javascript
const express = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/exampleController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// ✅ CORRECT: Input validation middleware
const validateCreate = [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('description').optional().trim(),
  body('email').optional().isEmail().withMessage('Valid email required'),
];

const validateUpdate = [
  param('id').isInt().withMessage('Invalid ID'),
  body('name').optional().notEmpty().trim().withMessage('Name cannot be empty'),
  body('description').optional().trim(),
];

// ✅ CORRECT: Apply authentication to all routes
router.use(authenticateToken);

// ✅ CORRECT: RESTful routes with proper permissions
router.get('/', 
  requireRole(['admin', 'user']), 
  controller.getAll
);

router.get('/:id', 
  param('id').isInt().withMessage('Invalid ID'),
  requireRole(['admin', 'user']), 
  controller.getById
);

router.post('/', 
  requireRole(['admin']), 
  validateCreate, 
  controller.create
);

router.put('/:id', 
  requireRole(['admin']), 
  validateUpdate, 
  controller.update
);

router.delete('/:id', 
  param('id').isInt().withMessage('Invalid ID'),
  requireRole(['admin']), 
  controller.delete
);

module.exports = router;
```

#### ✅ Correct Route Registration in Main App

```javascript
// api/src/app.js
const express = require('express');
const app = express();

// ✅ CORRECT: Register routes with proper base paths
app.use('/api/v1/admin/example', require('./routes/admin/exampleRoutes'));
app.use('/api/v1/example', require('./routes/exampleRoutes'));

// ✅ CORRECT: Admin routes registration
app.use('/api/v1/admin', require('./routes/admin'));
```

---

## Frontend API Consumption

### 1. API Client Pattern

**Location**: `client/src/utils/apiClient.js`

Use the centralized `apiClient` utility for all API requests. The `apiClient` provides HTTP method functions that automatically handle authentication, token refresh, and error handling.

#### ✅ Correct API Client Usage

```javascript
// utils/exampleApi.js
import { apiClient } from '@/utils/apiClient';

export const exampleApi = {
  // ✅ CORRECT: GET with query parameters
  async getAll(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const url = params.toString() ? `/admin/example?${params}` : '/admin/example';
      return await apiClient.get(url);
    } catch (error) {
      console.error('Error fetching records:', error);
      throw error;
    }
  },

  // ✅ CORRECT: GET by ID
  async getById(id) {
    try {
      return await apiClient.get(`/admin/example/${id}`);
    } catch (error) {
      console.error(`Error fetching record ${id}:`, error);
      throw error;
    }
  },

  // ✅ CORRECT: POST for creation
  async create(data) {
    try {
      return await apiClient.post('/admin/example', data);
    } catch (error) {
      console.error('Error creating record:', error);
      throw error;
    }
  },

  // ✅ CORRECT: PUT for updates
  async update(id, data) {
    try {
      return await apiClient.put(`/admin/example/${id}`, data);
    } catch (error) {
      console.error(`Error updating record ${id}:`, error);
      throw error;
    }
  },

  // ✅ CORRECT: PATCH for partial updates
  async patch(id, data) {
    try {
      return await apiClient.patch(`/admin/example/${id}`, data);
    } catch (error) {
      console.error(`Error updating record ${id}:`, error);
      throw error;
    }
  },

  // ✅ CORRECT: DELETE
  async delete(id) {
    try {
      return await apiClient.delete(`/admin/example/${id}`);
    } catch (error) {
      console.error(`Error deleting record ${id}:`, error);
      throw error;
    }
  }
};
```

#### ✅ apiClient HTTP Methods

The `apiClient` provides the following HTTP method functions:

```javascript
// GET request
const response = await apiClient.get('/path/to/resource');

// POST request with data
const response = await apiClient.post('/path/to/resource', { name: 'value' });

// PUT request with data
const response = await apiClient.put('/path/to/resource/1', { name: 'updated' });

// PATCH request with partial data
const response = await apiClient.patch('/path/to/resource/1', { status: 'active' });

// DELETE request
const response = await apiClient.delete('/path/to/resource/1');
```

#### 🚨 IMPORTANT: Common apiClient Mistakes

```javascript
// ❌ WRONG: Using apiClient as a function (old pattern)
const response = await apiClient('/api/v1/data', {
  method: 'GET',
  body: JSON.stringify(data)
});

// ❌ WRONG: Using full URLs
const response = await apiClient.get('http://localhost:3001/api/v1/data');

// ❌ WRONG: Manual JSON.stringify in body
const response = await apiClient.post('/data', {
  body: JSON.stringify(data)
});

// ✅ CORRECT: Use HTTP method functions with relative paths
const response = await apiClient.get('/data');
const response = await apiClient.post('/data', data); // Auto-stringified

// ✅ CORRECT: Relative paths are automatically prefixed with API base URL
// '/data' becomes 'http://localhost:3001/api/v1/data'
```

#### ✅ API Client Features

The `apiClient` automatically handles:

- **Authentication**: Adds `Authorization: Bearer <token>` header
- **Token Refresh**: Automatically refreshes expired access tokens
- **Base URL**: Prepends API base URL to relative paths
- **JSON Handling**: Automatically stringifies request bodies and parses responses
- **Error Handling**: Provides consistent error messages and status codes
- **Session Management**: Redirects to login on authentication failures

### 2. Component API Integration Pattern

#### ✅ Correct Component Implementation

```javascript
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { exampleApi } from '@/utils/exampleApi';

const ExampleComponent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '' });

  // ✅ CORRECT: Fetch data with proper error handling
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching data...');
      const response = await exampleApi.getAll(filters);
      
      if (response.success) {
        console.log(`📊 SUCCESS: Received ${response.data.length} records`);
        setData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      
      // ✅ CORRECT: Handle different error types
      if (err.message.includes('status: 401')) {
        setError('Authentication required. Please log in.');
        toast.error('Session expired. Please log in again.');
      } else if (err.message.includes('status: 403')) {
        setError('Access denied. Insufficient permissions.');
        toast.error('You do not have permission to view this data.');
      } else if (err.message.includes('status: 500')) {
        setError('Server error. Please try again later.');
        toast.error('Server error. Please try again later.');
      } else {
        setError(err.message);
        toast.error(`Failed to load data: ${err.message}`);
      }
      
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORRECT: Create with optimistic updates
  const handleCreate = async (newRecord) => {
    try {
      const response = await exampleApi.create(newRecord);
      
      if (response.success) {
        setData(prevData => [...prevData, response.data]);
        toast.success('Record created successfully!');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create record');
      }
    } catch (error) {
      console.error('Error creating record:', error);
      toast.error(`Failed to create record: ${error.message}`);
      throw error;
    }
  };

  // ✅ CORRECT: Update with optimistic updates
  const handleUpdate = async (id, updatedData) => {
    try {
      const response = await exampleApi.update(id, updatedData);
      
      if (response.success) {
        setData(prevData => 
          prevData.map(item => 
            item.id === id ? response.data : item
          )
        );
        toast.success('Record updated successfully!');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update record');
      }
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error(`Failed to update record: ${error.message}`);
      throw error;
    }
  };

  // ✅ CORRECT: Delete with confirmation
  const handleDelete = async (id) => {
    try {
      const response = await exampleApi.delete(id);
      
      if (response.success) {
        setData(prevData => prevData.filter(item => item.id !== id));
        toast.success('Record deleted successfully!');
      } else {
        throw new Error(response.error || 'Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error(`Failed to delete record: ${error.message}`);
      throw error;
    }
  };

  // ✅ CORRECT: Effect with dependency array
  useEffect(() => {
    fetchData();
  }, [filters]); // Re-fetch when filters change

  // ✅ CORRECT: Loading and error states
  if (loading) {
    return (
      <div className="d-flex justify-content-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <h6>Error Loading Data</h6>
        <p>{error}</p>
        <button className="btn btn-outline-danger btn-sm" onClick={fetchData}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Component content */}
      {data.length === 0 ? (
        <div className="text-center p-4">
          <p>No data available</p>
          <button className="btn btn-primary" onClick={() => handleCreate({})}>
            Add First Record
          </button>
        </div>
      ) : (
        // Render data table or list
        data.map(item => (
          <div key={item.id}>
            {/* Item rendering */}
          </div>
        ))
      )}
    </div>
  );
};

export default ExampleComponent;
```

---

## Lazy Loading and Performance

### 🚀 Performance-First Frontend Development

**IMPORTANT**: All new frontend components should implement lazy loading to improve application startup performance by 70-80%.

> **See**: [Performance Optimization Guide](../DEVELOPMENT_GUIDE/PERFORMANCE_OPTIMIZATION_GUIDE.md) for complete implementation details.

### 1. Lazy Loading Hook Pattern

**❌ AVOID: Immediate data loading on mount**
```javascript
// DON'T DO THIS - Causes slow app startup
const ExampleComponent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData(); // Loads immediately when component mounts
  }, []);

  // This causes multiple API calls during app startup
};
```

**✅ CORRECT: Lazy loading with user control**
```javascript
import { useLazyLoadOnDemand } from "@/hooks/useLazyLoad";
import LazyDataLoader from "@/components/LazyDataLoader";

const ExampleComponent = () => {
  // ✅ Data loads only when user requests it
  const dataLazyLoad = useLazyLoadOnDemand(async () => {
    const response = await exampleApi.getAll();
    if (response.success) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch data');
  });

  return (
    <LazyDataLoader
      {...dataLazyLoad}
      loadingMessage="Loading data..."
      loadButtonText="Load Data"
      emptyMessage="No data available"
      minHeight="300px"
    >
      {(data) => (
        <DataTable
          data={data}
          columns={columns}
          onView={handleView}
        />
      )}
    </LazyDataLoader>
  );
};
```

### 2. API Client with Lazy Loading

**Pattern**: Combine API utilities with lazy loading hooks

```javascript
// ✅ CORRECT: API function for lazy loading
const fetchSystemsData = async (signal) => {
  try {
    const response = await systemsApi.getSystems({
      page: 1,
      limit: 50
    });

    // Check if request was cancelled
    if (signal?.aborted) {
      throw new Error('Request cancelled');
    }

    return response.data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request cancelled');
    }
    throw error;
  }
};

// ✅ CORRECT: Use with lazy loading hook
const systemsLazyLoad = useLazyLoadOnDemand(fetchSystemsData);
```

### 3. Performance Benefits

**Before Lazy Loading**:
- Initial app load: 3-5 seconds
- API calls on startup: 8-12 concurrent calls
- Time to interactive: 4-6 seconds
- Poor user experience with loading screens

**After Lazy Loading**:
- Initial app load: 0.5-1 second ⚡
- API calls on startup: 0-2 calls
- Time to interactive: 1-2 seconds
- Users see content immediately

### 4. When to Use Lazy Loading

**✅ Use lazy loading for**:
- Large datasets (>100 items)
- Heavy API calls (>1 second response)
- Optional content (admin panels, detailed views)
- Dashboard widgets
- Search results
- File uploads/downloads

**❌ Don't use lazy loading for**:
- Critical navigation data
- User authentication
- Small, fast datasets (<10 items)
- Essential UI components

### 5. Error Handling with Lazy Loading

```javascript
// ✅ CORRECT: Comprehensive error handling
const dataLazyLoad = useLazyLoadOnDemand(async () => {
  try {
    const response = await apiCall();

    if (!response.success) {
      throw new Error(response.error || 'API request failed');
    }

    return response.data;
  } catch (error) {
    // Log error for debugging
    console.error('Lazy load error:', error);

    // Provide user-friendly error messages
    if (error.message.includes('401')) {
      throw new Error('Authentication required. Please log in.');
    } else if (error.message.includes('403')) {
      throw new Error('Access denied. Insufficient permissions.');
    } else if (error.message.includes('500')) {
      throw new Error('Server error. Please try again later.');
    }

    throw error;
  }
});
```

---

## Security and Authentication

### Overview

The CYPHER application uses a simple, efficient role-based authentication system that provides security without the complexity of granular permissions. This system is built around JWT tokens and three primary user roles.

**Authentication System Architecture:**
- **JWT Tokens**: Secure, stateless authentication tokens
- **Role-Based Authorization**: Simple role checking (admin, user, moderator)
- **Middleware**: `authenticateToken` and `requireRole` functions

**User Roles:**
- `admin`: Full access to all operations (create, read, update, delete)
- `user`: Read-only access to most resources
- `moderator`: Limited administrative access (if needed)

### 1. Backend Authentication Middleware

**Location**: `api/src/middleware/auth.js`

#### ✅ Correct Authentication Pattern

```javascript
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { users } = require('../db/schema');
const { eq } = require('drizzle-orm');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ CORRECT: Verify user still exists and is active
    const user = await db.select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user.length || !user[0].isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    req.user = user[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};
```

### 2. Role-Based Authorization System

#### Authorization Patterns

**Read Operations** (GET endpoints):
```javascript
// Allow both admin and user roles
router.get('/', requireRole(['admin', 'user']), controller.getAll);
router.get('/:id', requireRole(['admin', 'user']), controller.getById);
```

**Write Operations** (POST, PUT, DELETE endpoints):
```javascript
// Restrict to admin only
router.post('/', requireRole(['admin']), controller.create);
router.put('/:id', requireRole(['admin']), controller.update);
router.delete('/:id', requireRole(['admin']), controller.delete);
```

**Mixed Access Patterns**:
```javascript
// Some resources may allow user modifications
router.put('/profile/:id', requireRole(['admin', 'user']), controller.updateProfile);

// Sensitive operations restricted to admin
router.post('/system/reset', requireRole(['admin']), controller.systemReset);
```

#### Role Definitions

| Role | Access Level | Typical Use Cases |
|------|-------------|-------------------|
| `admin` | Full CRUD access | System administration, user management, configuration |
| `user` | Read access + limited write | View dashboards, update own profile, generate reports |
| `moderator` | Limited admin access | Content moderation, user support (if implemented) |

#### JWT Token Structure

```javascript
// Token payload contains user information
{
  userId: 123,
  email: "user@example.com",
  username: "john_doe",
  role: "admin",  // This is used for authorization
  iat: 1640995200,
  exp: 1641081600
}
```

### 2. Frontend Authentication Pattern

**Location**: `client/src/utils/apiClient.js`

The existing `apiClient` already handles authentication correctly:

```javascript
// ✅ CORRECT: Uses accessToken from localStorage
const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

// ✅ CORRECT: Automatic token refresh
const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  
  // Refresh logic...
};

// ✅ CORRECT: Handles token expiration
export const apiClient = async (url, options = {}) => {
  let accessToken = getAccessToken();

  // Check if token expired, try to refresh
  if (isTokenExpired(accessToken)) {
    accessToken = await refreshAccessToken();
    if (!accessToken) {
      toast.error('Session expired. Please log in again.');
      logoutAndRedirect();
      return Promise.reject(new Error('Session expired'));
    }
  }

  // Add Authorization header
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
  };

  // Make request...
};
```

---

## Common Pitfalls and Solutions

### 1. SQL Syntax Errors

#### ❌ Problem: Malformed COUNT() Functions
```javascript
// This causes "syntax error at or near ')'"
memberCount: sql`COUNT()`.as('member_count'),
```

#### ✅ Solution: Proper COUNT() Syntax
```javascript
// Always specify what to count
memberCount: sql`COUNT(${relatedTable.id})`.as('member_count'),
// Or count all rows
memberCount: sql`COUNT(*)`.as('member_count'),
```

#### ❌ Problem: Incomplete SQL Templates
```javascript
// This creates malformed SQL
.where(sql`${users.id} NOT IN ()`);
```

#### ✅ Solution: Complete SQL Templates
```javascript
// Include the subquery
const subquery = db.select({ userId: membersTable.userId })
  .from(membersTable)
  .where(eq(membersTable.groupId, groupId));

.where(sql`${users.id} NOT IN (${subquery})`);
```

#### ❌ Problem: Broken ILIKE Queries
```javascript
// This creates syntax errors
.where(sql`ILIKE  OR ILIKE `);
```

#### ✅ Solution: Proper ILIKE with Parameters
```javascript
.where(sql`${users.username} ILIKE ${`%${searchTerm}%`} OR ${users.email} ILIKE ${`%${searchTerm}%`}`);
```

### 2. Error Handling Issues

#### ❌ Problem: Inconsistent Error Responses
```javascript
// Different error formats across endpoints
res.status(500).send('Error');
res.json({ error: 'Something failed' });
throw new Error('Database error');
```

#### ✅ Solution: Standardized Error Format
```javascript
// Always use this format
res.status(statusCode).json({
  success: false,
  error: errorMessage,
  timestamp: new Date().toISOString(),
  ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
});
```

### 3. Authentication Issues

#### ❌ Problem: Missing Authentication Middleware
```javascript
// Route without authentication
router.get('/sensitive-data', controller.getSensitiveData);
```

#### ✅ Solution: Always Apply Authentication
```javascript
// Apply to all routes
router.use(authenticateToken);
router.get('/sensitive-data', requireRole(['admin']), controller.getSensitiveData);
```

### 4. Frontend API Issues

#### ❌ Problem: Using Old apiClient Function Pattern
```javascript
// Don't use apiClient as a function (old pattern)
const response = await apiClient('/api/v1/data', {
  method: 'GET',
  body: JSON.stringify(data)
});

// Don't use fetch directly
const response = await fetch('/api/v1/data', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

#### ✅ Solution: Use New apiClient HTTP Method Functions
```javascript
// Use the new HTTP method functions
const response = await apiClient.get('/data');
const response = await apiClient.post('/data', data);
const response = await apiClient.put('/data/1', updatedData);
const response = await apiClient.delete('/data/1');
```

#### ❌ Problem: "apiClient.get is not a function" Error
This error occurs when components try to use HTTP method functions on an apiClient that was exported as a plain function.

```javascript
// This will cause the error if apiClient is exported as a function
const result = await apiClient.get('/access-requests');
```

#### ✅ Solution: Ensure apiClient Exports HTTP Methods
```javascript
// In apiClient.js - Export object with HTTP methods
export const apiClient = {
  get: (url, options = {}) => makeRequest(url, { ...options, method: 'GET' }),
  post: (url, data, options = {}) => makeRequest(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data)
  }),
  // ... other methods
};

// In components - Use HTTP method functions
const result = await apiClient.get('/access-requests');
const result = await apiClient.post('/access-requests/1/approve', { username: 'user' });
```

---

## Testing Patterns

### 1. Service Layer Testing

```javascript
// tests/services/exampleService.test.js
const ExampleService = require('../../src/services/ExampleService');
const { db } = require('../../src/db');

describe('ExampleService', () => {
  beforeEach(async () => {
    // Setup test data
    await db.insert(tableName).values({
      name: 'Test Record',
      description: 'Test Description'
    });
  });

  afterEach(async () => {
    // Cleanup test data
    await db.delete(tableName);
  });

  it('should get all records', async () => {
    const result = await ExampleService.getAllRecords();
    
    expect(result).toBeDefined();
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('should create a new record', async () => {
    const data = {
      name: 'New Record',
      description: 'New Description'
    };

    const result = await ExampleService.createRecord(data);
    
    expect(result).toBeDefined();
    expect(result.name).toBe(data.name);
    expect(result.id).toBeDefined();
  });
});
```

### 2. API Endpoint Testing

```javascript
// tests/api/example.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Example API', () => {
  let authToken;

  beforeAll(async () => {
    // Get authentication token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'testuser', password: 'testpass' });
    
    authToken = loginResponse.body.data.accessToken;
  });

  it('should get all records', async () => {
    const response = await request(app)
      .get('/api/v1/example')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  it('should create a new record', async () => {
    const newRecord = {
      name: 'Test Record',
      description: 'Test Description'
    };

    const response = await request(app)
      .post('/api/v1/example')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newRecord)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(newRecord.name);
  });

  it('should return 401 without authentication', async () => {
    await request(app)
      .get('/api/v1/example')
      .expect(401);
  });
});
```

---

## Performance Best Practices

### 1. Database Query Optimization

```javascript
// ✅ CORRECT: Use indexes and limit results
const getRecordsOptimized = async (filters, options) => {
  const { limit = 50, offset = 0 } = options;
  
  // Use limit and offset for pagination
  const records = await db.select()
    .from(tableName)
    .where(buildWhereClause(filters))
    .limit(limit)
    .offset(offset);
    
  // Get total count separately for pagination
  const [{ count }] = await db.select({ 
    count: sql`COUNT(*)` 
  }).from(tableName).where(buildWhereClause(filters));
  
  return { data: records, total: count };
};
```

### 2. API Response Caching

```javascript
// ✅ CORRECT: Cache GET responses
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    
    const cacheKey = req.originalUrl;
    const cachedResponse = cache.get(cacheKey);
    
    if (cachedResponse) {
      res.set('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }
    
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200) {
        cache.set(cacheKey, body, duration);
      }
      return originalJson(body);
    };
    
    next();
  };
};

// Apply to read-only endpoints
router.get('/', cacheMiddleware(600), controller.getAll);
```

### 3. Frontend Performance

```javascript
// ✅ CORRECT: Debounced search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Use in component
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearchTerm) {
    fetchData({ search: debouncedSearchTerm });
  }
}, [debouncedSearchTerm]);
```

---

## Troubleshooting Guide

### 1. Common HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (creation) |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (unique violations) |
| 422 | Unprocessable Entity | Valid format but invalid business logic |
| 500 | Internal Server Error | Unexpected server errors |

### 2. Debug SQL Queries

```javascript
// Enable Drizzle query logging in development
const db = drizzle(connection, {
  schema,
  logger: process.env.NODE_ENV === 'development'
});

// Add logging to service methods
async getAllRecords(filters) {
  console.log('🔍 SQL Query Filters:', filters);
  
  try {
    const result = await query;
    console.log('📊 Query Result Count:', result.length);
    return result;
  } catch (error) {
    console.error('❌ SQL Error:', error);
    console.error('🔍 Query Details:', { filters, error: error.message });
    throw error;
  }
}
```

### 3. API Error Investigation

```javascript
// Add request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? '❌' : '✅';
    
    console.log(`${logLevel} ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    
    if (res.statusCode >= 400) {
      console.log('📝 Request Body:', req.body);
      console.log('👤 User:', req.user?.username || 'Anonymous');
    }
  });
  
  next();
};

app.use(requestLogger);
```

### 4. Health Check Endpoint

```javascript
// Add to main app
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    database: db ? 'Connected' : 'Disconnected',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  });
});
```

---

## Checklist for New API Development

### Backend Checklist:

- [ ] Service layer uses proper Drizzle ORM syntax
- [ ] All COUNT() functions include table references
- [ ] All ILIKE queries are properly parameterized
- [ ] SQL templates are complete (no empty parentheses)
- [ ] Controller has structured error handling
- [ ] Routes use `authenticateToken` middleware
- [ ] Routes apply appropriate `requireRole` permissions
- [ ] Input validation with `express-validator`
- [ ] Consistent JSON response format
- [ ] Database queries use pagination
- [ ] Proper HTTP status codes are used

### Frontend Checklist:

- [ ] Uses `apiClient` HTTP method functions (get, post, put, patch, delete)
- [ ] Uses relative paths (not full URLs) with apiClient
- [ ] Does NOT use old apiClient function pattern `apiClient(url, options)`
- [ ] Proper error handling with toast notifications
- [ ] Loading states implemented
- [ ] Handles 401/403 errors appropriately
- [ ] Uses debouncing for search inputs
- [ ] Implements optimistic updates where appropriate
- [ ] Follows consistent naming conventions

### Security Checklist:

- [ ] Authentication required on all protected routes
- [ ] Role-based access control implemented
- [ ] Input validation on all endpoints
- [ ] No sensitive data in logs
- [ ] CORS configured properly
- [ ] Rate limiting on authentication endpoints

### Testing Checklist:

- [ ] Service layer unit tests
- [ ] API endpoint integration tests
- [ ] Authentication tests
- [ ] Error handling tests
- [ ] Edge case testing

Following this guide will help prevent the types of SQL syntax errors, authentication issues, and inconsistent patterns that commonly occur in API development. Always refer back to these patterns when creating new APIs or debugging existing ones.