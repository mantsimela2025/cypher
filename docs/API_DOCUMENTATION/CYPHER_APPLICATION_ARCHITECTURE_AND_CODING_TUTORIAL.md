# CYPHER APPLICATION ARCHITECTURE AND CODING TUTORIAL

## 🎯 Overview

This comprehensive tutorial explains the CYPHER application architecture, coding patterns, and development practices. It's designed for developers who may be new to Node.js, React, or full-stack development, providing step-by-step explanations using real code from the CYPHER application.

## 📋 Table of Contents

1. [Application Architecture Overview](#application-architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Backend Architecture (API)](#backend-architecture-api)
5. [Frontend Architecture (Client)](#frontend-architecture-client)
6. [Database Layer](#database-layer)
7. [Authentication & Authorization](#authentication--authorization)
8. [API Development Patterns](#api-development-patterns)
9. [Frontend Development Patterns](#frontend-development-patterns)
10. [Step-by-Step Feature Development](#step-by-step-feature-development)

## 🏗️ Application Architecture Overview

CYPHER follows a **3-tier architecture** pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                        │
│  React Frontend (Port 3000) - User Interface & Experience  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION TIER                        │
│   Node.js API (Port 3001) - Business Logic & Services     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        DATA TIER                            │
│      PostgreSQL Database - Data Storage & Management       │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Separation of Concerns**: Each tier has distinct responsibilities
2. **RESTful API Design**: Clean, predictable API endpoints
3. **Component-Based Frontend**: Reusable React components with lazy loading
4. **Service Layer Pattern**: Business logic separated from controllers
5. **Database Abstraction**: ORM/Query Builder for database operations
6. **Performance-First Design**: Lazy loading and optimized data fetching

## 🛠️ Technology Stack

### Backend (API)
- **Runtime**: Node.js v20+
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest + Supertest

### Frontend (Client)
- **Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: CSS + Custom Components
- **State Management**: React Context + Hooks
- **HTTP Client**: Axios
- **Routing**: React Router

### Development Tools
- **Package Manager**: npm
- **Process Manager**: Concurrently (runs both API and Client)
- **Code Quality**: ESLint + Prettier
- **Version Control**: Git

## 📁 Project Structure

```
cypher/
├── api/                          # Backend Application
│   ├── src/
│   │   ├── controllers/          # Request handlers
│   │   ├── services/            # Business logic
│   │   ├── routes/              # API endpoints
│   │   ├── db/                  # Database configuration
│   │   │   └── schema/          # Database schemas
│   │   ├── middleware/          # Custom middleware
│   │   ├── config/              # Configuration files
│   │   └── utils/               # Utility functions
│   ├── scripts/                 # Database & utility scripts
│   ├── package.json             # Backend dependencies
│   └── server.js                # Application entry point
├── client/                       # Frontend Application
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Page components
│   │   ├── layout/              # Layout components
│   │   ├── utils/               # Utility functions
│   │   ├── context/             # React Context providers
│   │   └── images/              # Static assets
│   ├── public/                  # Public assets
│   ├── package.json             # Frontend dependencies
│   └── index.html               # HTML template
├── docs/                        # Documentation
├── scripts/                     # Project-wide scripts
├── package.json                 # Root package.json
└── start-full-stack.js          # Full-stack startup script
```

## 🔧 Backend Architecture (API)

### 1. Application Entry Point

**File**: `api/server.js`

```javascript
const express = require('express');
const { swaggerSetup } = require('./src/config/swagger');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Setup Swagger documentation
swaggerSetup(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount API routes
app.use('/api/v1/users', require('./src/routes/userRoutes'));
app.use('/api/v1/auth', require('./src/routes/authRoutes'));
app.use('/api/v1/systems', require('./src/routes/systems'));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CYPHER API Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});
```

**Key Concepts:**
- **Express.js**: Web framework for Node.js
- **Middleware**: Functions that execute during request/response cycle
- **Route Mounting**: Organizing endpoints by feature
- **Environment Variables**: Configuration through process.env

### 2. Database Layer with Drizzle ORM

**File**: `api/src/db/schema/users.js`

```javascript
const { pgTable, serial, varchar, boolean, timestamp } = require('drizzle-orm/pg-core');

// Define user table schema
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

module.exports = { users };
```

**Key Concepts:**
- **Schema Definition**: Defining database table structure
- **Data Types**: Different column types (serial, varchar, boolean, timestamp)
- **Constraints**: Primary keys, unique constraints, not null
- **Defaults**: Default values for columns

### 3. Service Layer Pattern

**File**: `api/src/services/userService.js`

```javascript
const { db } = require('../db');
const { users } = require('../db/schema/users');
const { eq, and, ilike } = require('drizzle-orm');
const bcrypt = require('bcrypt');

class UserService {
  /**
   * Get all users with pagination and filtering
   */
  async getAllUsers(options = {}) {
    const { page = 1, limit = 10, search, isActive } = options;
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];
    if (search) {
      conditions.push(
        ilike(users.email, `%${search}%`),
        ilike(users.username, `%${search}%`)
      );
    }
    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }

    // Execute query
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive,
        isVerified: users.isVerified,
        createdAt: users.createdAt
      })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset);

    return {
      users: result,
      pagination: {
        page,
        limit,
        total: result.length,
        hasMore: result.length === limit
      }
    };
  }

  /**
   * Create a new user
   */
  async createUser(userData) {
    const { email, username, password, firstName, lastName } = userData;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        username,
        firstName,
        lastName,
        passwordHash
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt
      });

    return newUser;
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive,
        isVerified: users.isVerified,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, id));

    return user;
  }

  /**
   * Update user
   */
  async updateUser(id, updateData) {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        updatedAt: users.updatedAt
      });

    return updatedUser;
  }
}

module.exports = UserService;
```

**Key Concepts:**
- **Service Layer**: Business logic separated from controllers
- **Class-based Services**: Organized methods for related operations
- **Database Queries**: Using Drizzle ORM query builder
- **Data Validation**: Input validation and sanitization
- **Error Handling**: Proper error management
- **Security**: Password hashing with bcrypt

### 4. Controller Layer

**File**: `api/src/controllers/userController.js`

```javascript
const UserService = require('../services/userService');

class UserController {
  constructor() {
    this.userService = new UserService();
  }

  /**
   * Get all users
   * GET /api/v1/users
   */
  async getAllUsers(req, res) {
    try {
      const { page, limit, search, isActive } = req.query;
      
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        isActive: isActive !== undefined ? isActive === 'true' : undefined
      };

      const result = await this.userService.getAllUsers(options);

      res.json({
        success: true,
        message: 'Users retrieved successfully',
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: error.message
      });
    }
  }

  /**
   * Create new user
   * POST /api/v1/users
   */
  async createUser(req, res) {
    try {
      const { email, username, password, firstName, lastName } = req.body;

      // Basic validation
      if (!email || !username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email, username, and password are required'
        });
      }

      const newUser = await this.userService.createUser({
        email,
        username,
        password,
        firstName,
        lastName
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser
      });
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message
      });
    }
  }

  /**
   * Get user by ID
   * GET /api/v1/users/:id
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      const user = await this.userService.getUserById(parseInt(id));
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        error: error.message
      });
    }
  }
}

module.exports = UserController;
```

**Key Concepts:**
- **Controller Pattern**: Handles HTTP requests and responses
- **Request/Response Handling**: Processing req and res objects
- **Error Handling**: Try-catch blocks and proper error responses
- **HTTP Status Codes**: Appropriate status codes for different scenarios
- **Input Validation**: Checking required fields and data types
- **Consistent Response Format**: Standardized API response structure

### 5. Route Layer

**File**: `api/src/routes/userRoutes.js`

```javascript
const express = require('express');
const UserController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const userController = new UserController();

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for email or username
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/',
  authenticateToken,
  requirePermission('users:read'),
  userController.getAllUsers.bind(userController)
);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/',
  authenticateToken,
  requireRole(['admin']),
  userController.createUser.bind(userController)
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:id',
  authenticateToken,
  requireRole(['admin', 'user']),
  userController.getUserById.bind(userController)
);

module.exports = router;
```

**Key Concepts:**
- **Express Router**: Modular route handling
- **Middleware Chain**: Authentication and authorization middleware
- **Swagger Documentation**: API documentation with JSDoc comments
- **Method Binding**: Binding controller methods to maintain `this` context
- **Route Parameters**: Handling URL parameters and query strings

### 6. Middleware Layer

**File**: `api/src/middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Authenticate JWT token middleware
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Add user info to request object
    req.user = user;
    next();
  });
};

/**
 * Optional authentication middleware
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, config.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};
```

**Key Concepts:**
- **Middleware Functions**: Functions that execute during request processing
- **JWT Verification**: Validating JSON Web Tokens
- **Request Modification**: Adding user data to request object
- **Error Handling**: Proper error responses for authentication failures
- **Next Function**: Passing control to the next middleware

## 🎨 Frontend Architecture (Client)

### 1. Application Entry Point

**File**: `client/src/main.jsx`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

**Key Concepts:**
- **React 18**: Modern React with createRoot
- **React Router**: Client-side routing
- **Context Providers**: Global state management
- **Component Hierarchy**: Wrapping components for global functionality

### 2. Main Application Component

**File**: `client/src/App.jsx`

```javascript
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './layout/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/admin/users/AdminUsers';
import Systems from './pages/systems/Systems';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="admin/users" element={<Users />} />
        <Route path="systems" element={<Systems />} />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
```

**Key Concepts:**
- **React Router**: Declarative routing with Routes and Route
- **Conditional Rendering**: Different UI based on authentication state
- **Protected Routes**: Restricting access to authenticated users
- **Navigation**: Programmatic navigation with Navigate component
- **Nested Routes**: Organizing routes hierarchically

### 3. React Context for State Management

**File**: `client/src/context/AuthContext.jsx`

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../utils/apiClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Set token in API client
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Verify token is still valid
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await apiClient.get('/auth/verify');
      if (response.data.success) {
        setUser(response.data.data.user);
        setIsAuthenticated(true);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        const { token, user } = response.data.data;

        // Store token
        localStorage.setItem('authToken', token);

        // Set token in API client
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Update state
        setUser(user);
        setIsAuthenticated(true);

        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    // Clear token
    localStorage.removeItem('authToken');

    // Remove token from API client
    delete apiClient.defaults.headers.common['Authorization'];

    // Clear state
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Key Concepts:**
- **React Context**: Global state management without prop drilling
- **Custom Hooks**: useAuth hook for consuming context
- **useEffect**: Side effects for token verification
- **localStorage**: Persisting authentication state
- **API Client Integration**: Setting authorization headers
- **Error Handling**: Graceful handling of authentication errors

### 4. API Client Utility

**File**: `client/src/utils/apiClient.js`

```javascript
import axios from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to requests for debugging
    config.metadata = { startTime: new Date() };

    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`✅ API Response: ${response.status} (${duration}ms)`);

    return response;
  },
  (error) => {
    const duration = error.config?.metadata ?
      new Date() - error.config.metadata.startTime : 0;

    console.error(`❌ API Error: ${error.response?.status || 'Network'} (${duration}ms)`);

    // Handle authentication errors globally
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Convenience methods
export const api = {
  // GET request
  get: (url, config = {}) => apiClient.get(url, config),

  // POST request
  post: (url, data = {}, config = {}) => apiClient.post(url, data, config),

  // PUT request
  put: (url, data = {}, config = {}) => apiClient.put(url, data, config),

  // DELETE request
  delete: (url, config = {}) => apiClient.delete(url, config),

  // PATCH request
  patch: (url, data = {}, config = {}) => apiClient.patch(url, data, config)
};

export { apiClient };
export default apiClient;
```

**Key Concepts:**
- **Axios Configuration**: Base URL, timeout, default headers
- **Interceptors**: Request and response middleware
- **Error Handling**: Global error handling and authentication
- **Debugging**: Request/response logging with timing
- **Convenience Methods**: Simplified API methods

### 5. React Component Example

**File**: `client/src/pages/admin/users/AdminUsers.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/apiClient';
import './AdminUsers.css';

const AdminUsers = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false
  });
  const [filters, setFilters] = useState({
    search: '',
    isActive: undefined
  });

  // Fetch users effect
  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive })
      };

      const response = await api.get('/users', { params });

      if (response.data.success) {
        setUsers(response.data.data);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }));
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleUserToggle = async (userId, currentStatus) => {
    try {
      const response = await api.patch(`/users/${userId}`, {
        isActive: !currentStatus
      });

      if (response.data.success) {
        // Update local state
        setUsers(prev => prev.map(user =>
          user.id === userId
            ? { ...user, isActive: !currentStatus }
            : user
        ));
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div className="admin-users">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-users">
        <div className="error-container">
          <h3>Error Loading Users</h3>
          <p>{error}</p>
          <button onClick={fetchUsers} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage system users and their permissions</p>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users..."
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filters.isActive === undefined ? 'active' : ''}`}
            onClick={() => setFilters(prev => ({ ...prev, isActive: undefined }))}
          >
            All Users
          </button>
          <button
            className={`filter-btn ${filters.isActive === true ? 'active' : ''}`}
            onClick={() => setFilters(prev => ({ ...prev, isActive: true }))}
          >
            Active
          </button>
          <button
            className={`filter-btn ${filters.isActive === false ? 'active' : ''}`}
            onClick={() => setFilters(prev => ({ ...prev, isActive: false }))}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <div className="user-details">
                      <div className="user-name">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="user-username">@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => handleUserToggle(user.id, user.isActive)}
                    className={`btn btn-sm ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination-container">
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="btn btn-secondary"
        >
          Previous
        </button>

        <span className="pagination-info">
          Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
        </span>

        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={!pagination.hasMore}
          className="btn btn-secondary"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminUsers;
```

**Key Concepts:**
- **React Hooks**: useState, useEffect for state and side effects
- **API Integration**: Using custom API client for data fetching
- **State Management**: Managing loading, error, and data states
- **Event Handling**: User interactions and form handling
- **Conditional Rendering**: Different UI based on state
- **Component Lifecycle**: useEffect for data fetching
- **Error Handling**: User-friendly error messages
- **Pagination**: Handling paginated data
- **Filtering**: Search and filter functionality

## 🚀 Step-by-Step Feature Development

Let's walk through developing a complete feature from backend to frontend using the CYPHER patterns.

### Example: Building a "Systems Management" Feature

#### Step 1: Define Database Schema

**File**: `api/src/db/schema/systems.js`

```javascript
const { pgTable, serial, varchar, text, boolean, timestamp, integer } = require('drizzle-orm/pg-core');

const systems = pgTable('systems', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ipAddress: varchar('ip_address', { length: 45 }),
  operatingSystem: varchar('operating_system', { length: 100 }),
  environment: varchar('environment', { length: 50 }).default('production'),
  isActive: boolean('is_active').default(true),
  lastScanDate: timestamp('last_scan_date'),
  vulnerabilityCount: integer('vulnerability_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

module.exports = { systems };
```

#### Step 2: Create Service Layer

**File**: `api/src/services/systemsService.js`

```javascript
const { db } = require('../db');
const { systems } = require('../db/schema/systems');
const { eq, ilike, and } = require('drizzle-orm');

class SystemsService {
  async getAllSystems(options = {}) {
    const { page = 1, limit = 10, search, environment, isActive } = options;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      conditions.push(ilike(systems.name, `%${search}%`));
    }
    if (environment) {
      conditions.push(eq(systems.environment, environment));
    }
    if (isActive !== undefined) {
      conditions.push(eq(systems.isActive, isActive));
    }

    const result = await db
      .select()
      .from(systems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(systems.createdAt);

    return {
      systems: result,
      pagination: {
        page,
        limit,
        total: result.length,
        hasMore: result.length === limit
      }
    };
  }

  async createSystem(systemData) {
    const [newSystem] = await db
      .insert(systems)
      .values(systemData)
      .returning();

    return newSystem;
  }

  async updateSystem(id, updateData) {
    const [updatedSystem] = await db
      .update(systems)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(systems.id, id))
      .returning();

    return updatedSystem;
  }

  async deleteSystem(id) {
    await db
      .delete(systems)
      .where(eq(systems.id, id));
  }
}

module.exports = SystemsService;
```

#### Step 3: Create Controller

**File**: `api/src/controllers/systemsController.js`

```javascript
const SystemsService = require('../services/systemsService');

class SystemsController {
  constructor() {
    this.systemsService = new SystemsService();
  }

  async getAllSystems(req, res) {
    try {
      const { page, limit, search, environment, isActive } = req.query;

      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search,
        environment,
        isActive: isActive !== undefined ? isActive === 'true' : undefined
      };

      const result = await this.systemsService.getAllSystems(options);

      res.json({
        success: true,
        message: 'Systems retrieved successfully',
        data: result.systems,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error getting systems:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve systems',
        error: error.message
      });
    }
  }

  async createSystem(req, res) {
    try {
      const systemData = req.body;

      // Validation
      if (!systemData.name) {
        return res.status(400).json({
          success: false,
          message: 'System name is required'
        });
      }

      const newSystem = await this.systemsService.createSystem(systemData);

      res.status(201).json({
        success: true,
        message: 'System created successfully',
        data: newSystem
      });
    } catch (error) {
      console.error('Error creating system:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create system',
        error: error.message
      });
    }
  }
}

module.exports = SystemsController;
```

#### Step 4: Create Routes

**File**: `api/src/routes/systems.js`

```javascript
const express = require('express');
const SystemsController = require('../controllers/systemsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const systemsController = new SystemsController();

/**
 * @swagger
 * /api/v1/systems:
 *   get:
 *     summary: Get all systems
 *     tags: [Systems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Systems retrieved successfully
 */
router.get('/',
  authenticateToken,
  requireRole(['admin', 'user']),
  systemsController.getAllSystems.bind(systemsController)
);

/**
 * @swagger
 * /api/v1/systems:
 *   post:
 *     summary: Create a new system
 *     tags: [Systems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               ipAddress:
 *                 type: string
 *               operatingSystem:
 *                 type: string
 *               environment:
 *                 type: string
 *                 enum: [development, staging, production]
 *     responses:
 *       201:
 *         description: System created successfully
 */
router.post('/',
  authenticateToken,
  requireRole(['admin']),
  systemsController.createSystem.bind(systemsController)
);

module.exports = router;
```

#### Step 5: Create Frontend Component

**File**: `client/src/pages/systems/Systems.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { api } from '../../utils/apiClient';
import SystemCard from './components/SystemCard';
import CreateSystemModal from './components/CreateSystemModal';
import './Systems.css';

const Systems = () => {
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    environment: '',
    isActive: undefined
  });

  useEffect(() => {
    fetchSystems();
  }, [filters]);

  const fetchSystems = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        ...filters,
        ...(filters.search && { search: filters.search }),
        ...(filters.environment && { environment: filters.environment }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive })
      };

      const response = await api.get('/systems', { params });

      if (response.data.success) {
        setSystems(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error fetching systems:', err);
      setError('Failed to fetch systems');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSystem = async (systemData) => {
    try {
      const response = await api.post('/systems', systemData);

      if (response.data.success) {
        setSystems(prev => [response.data.data, ...prev]);
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error('Error creating system:', err);
      throw new Error('Failed to create system');
    }
  };

  return (
    <div className="systems-page">
      <div className="page-header">
        <h1>Systems Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          Add System
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <input
          type="text"
          placeholder="Search systems..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          className="search-input"
        />

        <select
          value={filters.environment}
          onChange={(e) => setFilters(prev => ({ ...prev, environment: e.target.value }))}
          className="filter-select"
        >
          <option value="">All Environments</option>
          <option value="development">Development</option>
          <option value="staging">Staging</option>
          <option value="production">Production</option>
        </select>
      </div>

      {/* Systems Grid */}
      {loading ? (
        <div className="loading-container">Loading systems...</div>
      ) : error ? (
        <div className="error-container">{error}</div>
      ) : (
        <div className="systems-grid">
          {systems.map(system => (
            <SystemCard
              key={system.id}
              system={system}
              onUpdate={fetchSystems}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateSystemModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSystem}
        />
      )}
    </div>
  );
};

export default Systems;
```

#### Step 6: Register Routes in App

**File**: `api/src/app.js` (add this line)

```javascript
app.use('/api/v1/systems', cache(900), require('./routes/systems'));
```

**File**: `client/src/App.jsx` (add this route)

```javascript
<Route path="systems" element={<Systems />} />
```

### Development Workflow Summary

1. **Database First**: Define schema with proper relationships
2. **Service Layer**: Implement business logic and data operations
3. **Controller Layer**: Handle HTTP requests and responses
4. **Route Layer**: Define API endpoints with middleware
5. **Frontend Component**: Create React component with state management
6. **Integration**: Connect frontend to backend via API calls
7. **Testing**: Test both API endpoints and UI components

## 📚 Best Practices and Patterns

### Backend Best Practices

1. **Consistent Error Handling**
```javascript
// Always use try-catch in controllers
try {
  const result = await this.service.operation();
  res.json({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  res.status(500).json({
    success: false,
    message: 'Operation failed',
    error: error.message
  });
}
```

2. **Input Validation**
```javascript
// Validate required fields
if (!email || !password) {
  return res.status(400).json({
    success: false,
    message: 'Email and password are required'
  });
}
```

3. **Consistent Response Format**
```javascript
// Success response
{ success: true, message: 'Operation successful', data: result }

// Error response
{ success: false, message: 'Error message', error: 'Detailed error' }
```

### Frontend Best Practices

1. **Loading States**
```javascript
const [loading, setLoading] = useState(true);

if (loading) {
  return <div className="loading-spinner">Loading...</div>;
}
```

2. **Error Handling**
```javascript
const [error, setError] = useState(null);

if (error) {
  return <div className="error-message">{error}</div>;
}
```

3. **State Management**
```javascript
// Use useState for component state
const [data, setData] = useState([]);

// Use useEffect for side effects
useEffect(() => {
  fetchData();
}, [dependency]);
```

4. **Performance Optimization with Lazy Loading** ⭐ **NEW**
```javascript
import { useLazyLoadOnDemand } from "@/hooks/useLazyLoad";
import LazyDataLoader from "@/components/LazyDataLoader";

// ❌ AVOID: Immediate data loading
useEffect(() => {
  fetchData(); // Slows down app startup
}, []);

// ✅ CORRECT: Lazy loading
const dataLazyLoad = useLazyLoadOnDemand(async () => {
  const response = await api.getData();
  return response.data;
});

return (
  <LazyDataLoader {...dataLazyLoad} loadButtonText="Load Data">
    {(data) => <DataComponent data={data} />}
  </LazyDataLoader>
);
```

**Performance Benefits:**
- **70-80% faster** initial app load
- **90% reduction** in startup API calls
- **Better user experience** with instant app startup

### Code Organization

1. **File Naming**: Use descriptive, consistent names
2. **Component Structure**: One component per file
3. **Import Organization**: Group imports logically
4. **Function Organization**: Pure functions first, then hooks
5. **CSS Organization**: Component-specific CSS files

### Security Practices

1. **Authentication**: Always verify tokens
2. **Authorization**: Check permissions for protected routes
3. **Input Sanitization**: Validate and sanitize all inputs
4. **Error Messages**: Don't expose sensitive information
5. **HTTPS**: Use secure connections in production

---

**🎉 You now have a complete understanding of the CYPHER application architecture and development patterns!**

This tutorial provides the foundation for developing features in the CYPHER application. Follow these patterns and practices to maintain consistency and quality across the codebase.
