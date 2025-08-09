# Comprehensive Developer Tutorial Guide

## Building a Vulnerability Management Platform with React, Node.js, and Express

_This guide provides a comprehensive walkthrough for developers new to React, Node.js, and Express.js, explaining how to build a vulnerability management platform from scratch._

## Table of Contents

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Setting Up the Development Environment](#setting-up-the-development-environment)
4. [Backend Development with Node.js and Express](#backend-development-with-nodejs-and-express)
5. [Frontend Development with React](#frontend-development-with-react)
6. [Database Design and Implementation](#database-design-and-implementation)
7. [Authentication and Authorization](#authentication-and-authorization)
8. [API Design and Implementation](#api-design-and-implementation)
9. [UI Component System](#ui-component-system)
10. [State Management](#state-management)
11. [Performance Optimization](#performance-optimization)
12. [Testing Strategies](#testing-strategies)
13. [Deployment Strategies](#deployment-strategies)
14. [Best Practices and Design Patterns](#best-practices-and-design-patterns)
15. [Resources and Further Learning](#resources-and-further-learning)

## Introduction

### Project Overview

The vulnerability management platform we'll build is designed to help organizations track, manage, and remediate security vulnerabilities across their IT infrastructure. The application combines several key features:

- **Vulnerability Scanning and Management**: Tracking vulnerabilities across systems
- **Compliance Management**: Ensuring systems meet security standards
- **Asset Management**: Maintaining an inventory of IT assets
- **Reporting and Analytics**: Generating insights from security data
- **API Documentation**: Self-documenting API endpoints

### Technologies Used

- **Backend**: Node.js, Express.js, PostgreSQL
- **Frontend**: React, TypeScript, Tailwind CSS
- **Authentication**: Passport.js, JWT
- **Documentation**: OpenAPI/Swagger
- **Testing**: Jest, React Testing Library
- **Deployment**: Docker, AWS

## System Architecture

### High-Level Architecture

The application follows a modern three-tier architecture:

1. **Presentation Layer**: React-based frontend with component-based UI
2. **Application Layer**: Express.js REST API handling business logic
3. **Data Layer**: PostgreSQL database with separate schemas for different concerns

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React UI      │     │  Express API    │     │   PostgreSQL    │
│                 │◄───►│                 │◄───►│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Key Design Decisions

- **API-First Design**: Building a well-documented RESTful API
- **Component-Based UI**: Creating reusable UI components with shadcn/ui
- **Role-Based Access Control**: Implementing granular permissions
- **Microservice-Ready**: Designing with potential microservice evolution in mind
- **Schema-Driven Development**: Using shared schemas between frontend and backend

## Setting Up the Development Environment

### Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL
- Git

### Project Initialization

```bash
# Create project directory
mkdir vulnerability-platform
cd vulnerability-platform

# Initialize package.json
npm init -y

# Create directory structure
mkdir -p server/routes server/controllers server/models server/middleware
mkdir -p client/src/components client/src/pages client/src/hooks client/src/lib
mkdir -p shared
```

### Setting Up the Backend

```bash
# Install core dependencies
npm install express pg dotenv cors helmet jsonwebtoken passport passport-local

# Install development dependencies
npm install --save-dev nodemon typescript ts-node @types/node @types/express
```

### Setting Up the Frontend

```bash
# Create React app with TypeScript
npx create-react-app client --template typescript

# Install key frontend dependencies
cd client
npm install react-router-dom @tanstack/react-query tailwindcss postcss autoprefixer
npm install lucide-react axios wouter
```

### Database Setup

```bash
# Install Drizzle ORM
npm install drizzle-orm @neondatabase/serverless
npm install --save-dev drizzle-kit

# Create database initialization script
touch server/db.ts
```

### Environment Configuration

Create a `.env` file in the root directory:

```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgres://username:password@localhost:5432/vulnerability_platform
JWT_SECRET=your_jwt_secret_here
```

## Backend Development with Node.js and Express

### Server Setup (server/index.ts)

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Import routes
import assetRoutes from './routes/assetRoutes';
import vulnerabilityRoutes from './routes/vulnerabilityRoutes';
import authRoutes from './routes/authRoutes';

// Use routes
app.use('/api/assets', assetRoutes);
app.use('/api/vulnerabilities', vulnerabilityRoutes);
app.use('/api/auth', authRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../client/build/index.html'));
  });
}

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Database Connection (server/db.ts)

```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../shared/schema';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
```

### Data Schema Definition (shared/schema.ts)

```typescript
import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Assets Table
export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  ipAddress: text('ip_address'),
  assetType: text('asset_type').notNull(),
  operatingSystem: text('operating_system'),
  owner: text('owner'),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Vulnerabilities Table
export const vulnerabilities = pgTable('vulnerabilities', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').notNull().references(() => assets.id),
  cveId: text('cve_id'),
  title: text('title').notNull(),
  description: text('description'),
  severity: text('severity').notNull(),
  status: text('status').default('open').notNull(),
  remediation: text('remediation'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Schema validation using Zod
export const insertUserSchema = createInsertSchema(users);
export const insertAssetSchema = createInsertSchema(assets);
export const insertVulnerabilitySchema = createInsertSchema(vulnerabilities);

// TypeScript Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type Vulnerability = typeof vulnerabilities.$inferSelect;
export type InsertVulnerability = z.infer<typeof insertVulnerabilitySchema>;
```

### Controller Implementation (server/controllers/assetController.ts)

```typescript
import { Request, Response } from 'express';
import { db } from '../db';
import { assets, insertAssetSchema } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Get all assets
export const getAllAssets = async (req: Request, res: Response) => {
  try {
    const allAssets = await db.select().from(assets);
    res.json(allAssets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
};

// Get asset by ID
export const getAssetById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const [asset] = await db.select().from(assets).where(eq(assets.id, parseInt(id)));
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
};

// Create a new asset
export const createAsset = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = insertAssetSchema.parse(req.body);
    
    // Insert into database
    const [newAsset] = await db.insert(assets).values(validatedData).returning();
    
    res.status(201).json(newAsset);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
};

// Update an asset
export const updateAsset = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Validate request body
    const validatedData = insertAssetSchema.partial().parse(req.body);
    
    // Update in database
    const [updatedAsset] = await db
      .update(assets)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(assets.id, parseInt(id)))
      .returning();
    
    if (!updatedAsset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(updatedAsset);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    
    console.error('Error updating asset:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
};

// Delete an asset
export const deleteAsset = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const [deletedAsset] = await db
      .delete(assets)
      .where(eq(assets.id, parseInt(id)))
      .returning();
    
    if (!deletedAsset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
};
```

### Routes Implementation (server/routes/assetRoutes.ts)

```typescript
import { Router } from 'express';
import {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset
} from '../controllers/assetController';
import { authenticateJWT, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Get all assets
router.get('/', authenticateJWT, getAllAssets);

// Get asset by ID
router.get('/:id', authenticateJWT, getAssetById);

// Create a new asset (admin only)
router.post('/', authenticateJWT, authorizeRole(['admin', 'asset_manager']), createAsset);

// Update an asset (admin only)
router.put('/:id', authenticateJWT, authorizeRole(['admin', 'asset_manager']), updateAsset);

// Delete an asset (admin only)
router.delete('/:id', authenticateJWT, authorizeRole(['admin']), deleteAsset);

export default router;
```

### Authentication Middleware (server/middleware/authMiddleware.ts)

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extended Request type to include the user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Verify JWT and attach user to request
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Check if user has required role
export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    next();
  };
};
```

### API Documentation with Swagger

```typescript
// server/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vulnerability Management API',
      version: '1.0.0',
      description: 'API for vulnerability management platform',
    },
    servers: [
      {
        url: '/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./server/routes/*.ts'], // Path to the API routes files
};

export default function setupSwagger(app: Express) {
  const specs = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}
```

## Frontend Development with React

### Project Structure

```
client/
├── public/
├── src/
│   ├── assets/           # Static assets like images, fonts
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Basic UI elements
│   │   ├── layout/       # Layout components
│   │   ├── forms/        # Form components
│   │   └── features/     # Feature-specific components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and helpers
│   ├── pages/           # Page components
│   ├── types/           # TypeScript type definitions
│   ├── services/        # API services
│   ├── App.tsx          # Main App component
│   ├── index.tsx        # Entry point
│   └── index.css        # Global styles
└── tailwind.config.js   # Tailwind CSS configuration
```

### React Router Setup (src/App.tsx)

```tsx
import { Switch, Route } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './lib/ProtectedRoute';

// Layouts
import AppLayout from './components/layout/AppLayout';
import AdminLayout from './components/layout/AdminLayout';

// Pages
import Dashboard from './pages/Dashboard';
import AssetManagement from './pages/assets/AssetManagement';
import VulnerabilityManagement from './pages/vulnerabilities/VulnerabilityManagement';
import ApiDocumentation from './pages/admin/ApiDocumentation';
import UserManagement from './pages/admin/UserManagement';
import AuthPage from './pages/AuthPage';
import NotFound from './pages/NotFound';

// Routes
function AdminRoutes() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/users">
          {() => <UserManagement />}
        </Route>
        <Route path="/admin/api-documentation">
          {() => <ApiDocumentation />}
        </Route>
      </Switch>
    </AdminLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppLayout>
          <Switch>
            {/* Public routes */}
            <Route path="/auth" component={AuthPage} />
            
            {/* Protected routes */}
            <ProtectedRoute path="/" component={Dashboard} />
            <ProtectedRoute path="/assets" component={AssetManagement} />
            <ProtectedRoute path="/vulnerabilities" component={VulnerabilityManagement} />
            <ProtectedRoute path="/admin" component={AdminRoutes} />
            <ProtectedRoute path="/admin/users" component={AdminRoutes} />
            <ProtectedRoute path="/admin/api-documentation" component={AdminRoutes} />
            
            {/* 404 route */}
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
```

### Protected Route Component (src/lib/ProtectedRoute.tsx)

```tsx
import { useAuth } from '../hooks/useAuth';
import { Route, Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
```

### Authentication Hook (src/hooks/useAuth.tsx)

```tsx
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User } from '../../../shared/schema';
import { apiRequest, queryClient } from '../lib/queryClient';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (userData: { username: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User | null, Error>({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/user');
        if (!response.ok) {
          return null;
        }
        return response.json();
      } catch (error) {
        return null;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(['/api/auth/user'], data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: { username: string; email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(['/api/auth/user'], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout');
      localStorage.removeItem('token');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/user'], null);
    },
  });

  const login = async (credentials: { username: string; password: string }) => {
    await loginMutation.mutateAsync(credentials);
  };

  const register = async (userData: { username: string; email: string; password: string }) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### API Request Client (src/lib/queryClient.ts)

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export async function apiRequest(
  method: string,
  url: string,
  data?: any
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add authorization token if available
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  return fetch(url, config);
}

// Helper function for React Query fetcher
export function getQueryFn(options?: { on401?: 'throw' | 'returnNull' }) {
  return async ({ queryKey }: { queryKey: (string | object)[] }) => {
    const [endpoint] = queryKey;
    
    const response = await apiRequest('GET', endpoint as string);
    
    if (response.status === 401 && options?.on401 === 'returnNull') {
      return null;
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    
    return response.json();
  };
}
```

### Asset Management Page (src/pages/assets/AssetManagement.tsx)

```tsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Asset } from '../../../../shared/schema';
import { getQueryFn, queryClient, apiRequest } from '../../lib/queryClient';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { AssetForm } from '../../components/features/assets/AssetForm';
import { PageHeader } from '../../components/layout/PageHeader';
import { Plus, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/Dialog';

export default function AssetManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const {
    data: assets = [],
    isLoading,
    refetch,
  } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
    queryFn: getQueryFn(),
  });

  const createAssetMutation = useMutation({
    mutationFn: async (newAsset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiRequest('POST', '/api/assets', newAsset);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create asset');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      setIsFormOpen(false);
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>>;
    }) => {
      const response = await apiRequest('PUT', `/api/assets/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update asset');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      setIsFormOpen(false);
      setSelectedAsset(null);
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/assets/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete asset');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
    },
  });

  const handleCreateAsset = (data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
    createAssetMutation.mutate(data);
  };

  const handleUpdateAsset = (data: Partial<Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>>) => {
    if (selectedAsset) {
      updateAssetMutation.mutate({ id: selectedAsset.id, data });
    }
  };

  const handleDeleteAsset = (id: number) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      deleteAssetMutation.mutate(id);
    }
  };

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsFormOpen(true);
  };

  const columns = [
    { accessor: 'name', header: 'Name' },
    { accessor: 'ipAddress', header: 'IP Address' },
    { accessor: 'assetType', header: 'Type' },
    { accessor: 'operatingSystem', header: 'OS' },
    { accessor: 'status', header: 'Status' },
    {
      accessor: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: Asset } }) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditAsset(row.original)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDeleteAsset(row.original.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container py-6">
      <PageHeader
        title="Asset Management"
        description="Track and manage your IT assets"
        actions={
          <div className="flex space-x-2">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => {
                setSelectedAsset(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          </div>
        }
      />

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={assets}
          isLoading={isLoading}
          emptyMessage="No assets found. Add your first asset to get started."
        />
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAsset ? 'Edit Asset' : 'Add New Asset'}
            </DialogTitle>
          </DialogHeader>
          <AssetForm
            defaultValues={selectedAsset || undefined}
            onSubmit={selectedAsset ? handleUpdateAsset : handleCreateAsset}
            isSubmitting={
              selectedAsset
                ? updateAssetMutation.isPending
                : createAssetMutation.isPending
            }
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### Asset Form Component (src/components/features/assets/AssetForm.tsx)

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertAssetSchema, Asset } from '../../../../../shared/schema';
import { Button } from '../../ui/Button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../ui/Form';
import { Input } from '../../ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/Select';

const formSchema = insertAssetSchema.omit({ id: true, createdAt: true, updatedAt: true });
type FormValues = z.infer<typeof formSchema>;

type AssetFormProps = {
  defaultValues?: Partial<Asset>;
  onSubmit: (data: FormValues) => void;
  isSubmitting?: boolean;
};

export function AssetForm({ defaultValues, onSubmit, isSubmitting }: AssetFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      ipAddress: defaultValues?.ipAddress || '',
      assetType: defaultValues?.assetType || 'server',
      operatingSystem: defaultValues?.operatingSystem || '',
      owner: defaultValues?.owner || '',
      status: defaultValues?.status || 'active',
    },
  });

  const assetTypes = [
    { label: 'Server', value: 'server' },
    { label: 'Workstation', value: 'workstation' },
    { label: 'Network Device', value: 'network' },
    { label: 'Mobile Device', value: 'mobile' },
    { label: 'IoT Device', value: 'iot' },
    { label: 'Virtual Machine', value: 'vm' },
    { label: 'Container', value: 'container' },
    { label: 'Cloud Instance', value: 'cloud' },
  ];

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Decommissioned', value: 'decommissioned' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Asset name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ipAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IP Address</FormLabel>
              <FormControl>
                <Input placeholder="192.168.1.1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assetType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assetTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="operatingSystem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Operating System</FormLabel>
              <FormControl>
                <Input placeholder="Windows Server 2022" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="owner"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Owner</FormLabel>
              <FormControl>
                <Input placeholder="IT Department" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : defaultValues ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

### API Documentation Component (src/pages/admin/ApiDocumentation.tsx)

```tsx
import { useEffect, useState } from 'react';
import { Book, Code, Copy, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { useToast } from '../../hooks/useToast';

export default function ApiDocumentation() {
  const { toast } = useToast();
  const [iframeHeight, setIframeHeight] = useState('800px');
  const apiDocsUrl = `${window.location.origin}/api-docs`;
  const apiJsonUrl = `${window.location.origin}/api-docs.json`;
  
  // Adjust iframe height based on window height
  useEffect(() => {
    const updateHeight = () => {
      const height = window.innerHeight - 250; // account for headers and padding
      setIframeHeight(`${height}px`);
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleCopyApiUrl = () => {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/api`);
    toast({
      title: "API URL copied",
      description: "Base API URL copied to clipboard",
    });
  };

  const handleCopySwaggerUrl = () => {
    navigator.clipboard.writeText(apiJsonUrl);
    toast({
      title: "Swagger JSON URL copied",
      description: "API definition URL copied to clipboard",
    });
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">API Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Explore and test the REST API endpoints available in the platform
          </p>
        </div>
      </div>

      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>API Information</CardTitle>
            <CardDescription>
              Integration details for developers and system administrators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex flex-col space-y-2">
                <div className="text-sm font-medium">Base API URL</div>
                <div className="flex items-center">
                  <code className="bg-muted px-2 py-1 rounded text-sm mr-2 flex-1">/api</code>
                  <Button variant="outline" size="icon" onClick={handleCopyApiUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <div className="text-sm font-medium">OpenAPI Specification</div>
                <div className="flex items-center">
                  <code className="bg-muted px-2 py-1 rounded text-sm mr-2 flex-1">{apiJsonUrl}</code>
                  <Button variant="outline" size="icon" onClick={handleCopySwaggerUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <div className="text-sm font-medium">Authentication</div>
                <div className="text-sm">JWT token based authentication</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="swagger">
        <TabsList className="mb-4">
          <TabsTrigger value="swagger">
            <div className="flex items-center">
              <Book className="mr-2 h-4 w-4" />
              <span>Swagger UI</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="integration">
            <div className="flex items-center">
              <Code className="mr-2 h-4 w-4" />
              <span>Integration Guide</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="swagger" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <iframe 
                src={apiDocsUrl} 
                width="100%" 
                height={iframeHeight} 
                style={{ border: 'none' }}
                title="API Documentation"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>API Integration Guide</CardTitle>
              <CardDescription>
                Guidelines for integrating with the platform API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Authentication</h3>
                  <p className="mb-2">
                    The API uses JWT authentication. To authenticate:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Call <code>/api/auth/login</code> with valid credentials</li>
                    <li>Store the returned JWT token</li>
                    <li>Include the token in all API requests as a Bearer token in the Authorization header</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Rate Limiting</h3>
                  <p>
                    API requests are limited to 100 requests per minute per user. When exceeded,
                    requests will return a <code>429 Too Many Requests</code> status code.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Client Libraries</h3>
                  <p className="mb-2">
                    You can generate client libraries for your language of choice using the
                    OpenAPI specification available at <code>{apiJsonUrl}</code>.
                  </p>
                  
                  <p>
                    <a 
                      href="https://editor.swagger.io" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary flex items-center hover:underline"
                    >
                      <span>Generate client libraries using Swagger Editor</span>
                      <ExternalLink className="ml-1 h-4 w-4" />
                    </a>
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Example Request</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                    <code>{`curl -X GET \
  "${window.location.origin}/api/assets" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer your_jwt_token"`}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Database Design and Implementation

### Database Schema

The application uses PostgreSQL with the following key schemas:

1. **Public Schema (Main Application)**
   - Users and authentication
   - Assets management
   - Vulnerabilities management
   - Compliance management

2. **Vulnerability Database Schema**
   - CVE records
   - Vulnerability metadata
   - Remediation information

### Database Migrations

For database migrations, we use Drizzle ORM's built-in migration tools:

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './shared/schema.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || '',
  },
} satisfies Config;
```

To run migrations:

```bash
# Generate migration files based on schema changes
npx drizzle-kit generate:pg

# Apply migrations to the database
node -r dotenv/config migrate.js
```

Migration script (migrate.js):

```javascript
const { migrate } = require('drizzle-orm/pg-core/migrate');
const { db, pool } = require('./server/db');
const { join } = require('path');

async function runMigrations() {
  console.log('Running migrations...');
  
  try {
    await migrate(db, { migrationsFolder: join(__dirname, 'migrations') });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
```

## Authentication and Authorization

### JWT-Based Authentication

The application uses JWT (JSON Web Tokens) for authentication:

1. **User Registration and Login**: Users register and login through dedicated endpoints
2. **Token Generation**: Upon successful authentication, a JWT is generated and returned
3. **Token Verification**: All protected routes verify the JWT in the request header
4. **Role-Based Access Control**: Different routes require different roles for access

### Authentication Controller (server/controllers/authController.ts)

```typescript
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users, insertUserSchema } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = insertUserSchema.parse(req.body);
    
    // Check if username already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, validatedData.username));
    
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        ...validatedData,
        password: hashedPassword,
      })
      .returning();
    
    // Generate JWT
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );
    
    // Omit password from response
    const { password, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  try {
    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );
    
    // Omit password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // User object is attached by the authenticateJWT middleware
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get user from database (to get the latest data)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Omit password from response
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Failed to get current user' });
  }
};
```

## API Design and Implementation

### RESTful API Design

The application follows REST principles for API design:

- **Resources as Nouns**: Each endpoint represents a resource (e.g., `/api/assets`)
- **HTTP Methods**: Using appropriate HTTP verbs (GET, POST, PUT, DELETE)
- **Status Codes**: Returning meaningful HTTP status codes
- **Filtering, Sorting, and Pagination**: Supporting query parameters for data manipulation

### API Documentation with Swagger

All APIs are documented using OpenAPI specification via Swagger:

- **Interactive UI**: Available at `/api-docs`
- **JSON Schema**: Available at `/api-docs.json`
- **Automatic Documentation**: Generated from routes and JSDoc comments

### Example Route Documentation

```typescript
/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: Get all assets
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of assets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Asset'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticateJWT, getAllAssets);

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     summary: Get an asset by ID
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Asset ID
 *     responses:
 *       200:
 *         description: Asset details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asset'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Asset not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateJWT, getAssetById);
```

## UI Component System

### Component Library with shadcn/ui

The application uses a component-based UI system based on shadcn/ui and Tailwind CSS:

- **Base Components**: Button, Input, Select, etc.
- **Composite Components**: DataTable, Forms, Modals, etc.
- **Layout Components**: Page layouts, headers, navigation
- **Feature Components**: Domain-specific components for features

### Responsive Design

The UI is designed to be responsive across different screen sizes:

- **Mobile-First Approach**: Designing for mobile and scaling up
- **Responsive Grid**: Using Tailwind's grid system
- **Adaptive Components**: Components that adapt to available space

## State Management

### React Query for API State

The application uses React Query for API state management:

- **Data Fetching**: Declarative data fetching with caching
- **Mutations**: Handling data mutations with optimistic updates
- **Invalidation**: Automatic cache invalidation for consistent state
- **Loading and Error States**: Built-in handling of loading and error states

### Context API for Application State

For global application state, the Context API is used:

- **Authentication State**: Managing user authentication status
- **UI State**: Managing global UI state like themes
- **Feature Flags**: Managing feature availability

## Performance Optimization

### Frontend Optimization

- **Code Splitting**: Using dynamic imports for route-based code splitting
- **Memoization**: Using React.memo and useMemo for component optimization
- **Virtualization**: Using virtualized lists for large datasets
- **Lazy Loading**: Lazy loading images and components

### Backend Optimization

- **Database Indexing**: Creating appropriate indexes for queries
- **Query Optimization**: Optimizing database queries
- **Caching**: Implementing caching for expensive operations
- **Rate Limiting**: Implementing rate limiting for API endpoints

## Testing Strategies

### Unit Testing

```typescript
// Example Jest test for a component
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    await userEvent.click(screen.getByRole('button', { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeDisabled();
  });
});
```

### Integration Testing

```typescript
// Example integration test for an API endpoint
import request from 'supertest';
import app from '../server';
import { db } from '../server/db';

describe('Assets API', () => {
  let authToken;
  let testAssetId;

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password123' });

    authToken = loginResponse.body.token;
  });

  it('should create a new asset', async () => {
    const response = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Server',
        ipAddress: '192.168.1.100',
        assetType: 'server',
        operatingSystem: 'Linux',
        status: 'active',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Server');

    testAssetId = response.body.id;
  });

  it('should get all assets', async () => {
    const response = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('should get a specific asset', async () => {
    const response = await request(app)
      .get(`/api/assets/${testAssetId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testAssetId);
    expect(response.body.name).toBe('Test Server');
  });

  it('should update an asset', async () => {
    const response = await request(app)
      .put(`/api/assets/${testAssetId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated Test Server',
        status: 'maintenance',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testAssetId);
    expect(response.body.name).toBe('Updated Test Server');
    expect(response.body.status).toBe('maintenance');
  });

  it('should delete an asset', async () => {
    const response = await request(app)
      .delete(`/api/assets/${testAssetId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Asset deleted successfully');

    // Verify asset is deleted
    const getResponse = await request(app)
      .get(`/api/assets/${testAssetId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getResponse.status).toBe(404);
  });
});
```

## Deployment Strategies

### Docker Deployment

Dockerfile for the application:

```dockerfile
# Base stage for dependencies
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./

# Development dependencies stage
FROM base AS dev-deps
RUN npm install

# Production dependencies stage
FROM base AS prod-deps
RUN npm install --production

# Build stage
FROM dev-deps AS build
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/client/build ./client/build

ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "dist/server/index.js"]
```

Docker Compose for local development:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      target: dev-deps
    ports:
      - '5000:5000'
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
    env_file: .env
    depends_on:
      - postgres

  postgres:
    image: postgres:14-alpine
    ports:
      - '5432:5432'
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: vulnerability_platform

volumes:
  postgres-data:
```

### AWS Deployment

For AWS deployment, consider the following architecture:

1. **Frontend**: Amazon S3 + CloudFront for static assets
2. **Backend**: Amazon ECS Fargate for containerized API
3. **Database**: Amazon RDS for PostgreSQL
4. **Load Balancing**: Amazon ALB for API routing
5. **SSL**: AWS Certificate Manager for HTTPS
6. **CI/CD**: AWS CodePipeline for automated deployment

## Best Practices and Design Patterns

### Backend Design Patterns

1. **Repository Pattern**: Abstracting data access logic
2. **Service Pattern**: Encapsulating business logic
3. **Middleware Pattern**: For request processing
4. **Controller Pattern**: For handling HTTP requests

### Frontend Design Patterns

1. **Container/Presentational Pattern**: Separating logic from UI
2. **Custom Hooks**: Extracting reusable logic
3. **Context + Reducer Pattern**: For state management
4. **Render Props Pattern**: For component composition

### Code Organization

1. **Feature-Based Structure**: Organizing code by feature
2. **Shared Code**: Extracting common utilities and components
3. **Type-Driven Development**: Using TypeScript types to drive implementation
4. **Consistent Naming**: Following naming conventions

## Resources and Further Learning

### Official Documentation

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)

### Books

- "React Design Patterns and Best Practices" by Michele Bertoli
- "Node.js Design Patterns" by Mario Casciaro and Luciano Mammino
- "Full Stack JavaScript Development with Node.js, React, and GraphQL" by Andrew Erlichson

### Courses

- [Epic React by Kent C. Dodds](https://epicreact.dev/)
- [Node.js, Express, MongoDB & More: The Complete Bootcamp](https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/)
- [TypeScript for JavaScript Developers](https://www.udemy.com/course/typescript-for-javascript-developers/)

### Communities

- [Stack Overflow](https://stackoverflow.com/)
- [DEV Community](https://dev.to/)
- [Reddit - r/reactjs](https://www.reddit.com/r/reactjs/)
- [Reddit - r/node](https://www.reddit.com/r/node/)

## Conclusion

This guide provides a comprehensive foundation for building a vulnerability management platform using React, Node.js, and Express. By following these patterns and examples, you'll be able to create a scalable, maintainable, and feature-rich application. Remember that the best way to learn is by doing, so don't hesitate to experiment and adapt these examples to your specific needs.
