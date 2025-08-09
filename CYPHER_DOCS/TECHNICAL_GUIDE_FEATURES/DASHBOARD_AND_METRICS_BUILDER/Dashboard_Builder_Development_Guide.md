# Dashboard Builder Development Guide - ReactFlow Implementation

This comprehensive guide provides everything needed to replicate the RAS DASH dashboard builder implementation in another application. The dashboard builder features drag-and-drop functionality, grid snapping, widget resizing, and real-time metric visualization using ReactFlow.

## Table of Contents
1. [UI Design Layout](#ui-design-layout)
2. [Database Schema](#database-schema)
3. [Service Layer](#service-layer)
4. [Controllers](#controllers)
5. [API Routes](#api-routes)
6. [Step-by-Step Functionality](#step-by-step-functionality)
7. [Implementation Guide](#implementation-guide)

## 1. UI Design Layout

### Main Interface Structure
The dashboard builder uses a three-panel layout:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Header Bar (Controls)                        │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│   Sidebar    │              Canvas Area                         │
│   (Metrics)  │            (ReactFlow)                          │
│              │                                                  │
│   - Search   │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│   - Filter   │  │ Widget  │ │ Widget  │ │ Widget  │           │
│   - Metrics  │  │   1     │ │   2     │ │   3     │           │
│   List       │  └─────────┘ └─────────┘ └─────────┘           │
│              │                                                  │
│   Grid       │              Drop Zone                          │
│   Controls   │                                                  │
│              │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

### Component Breakdown

#### Header Controls
- Save Dashboard button with dialog
- Grid snap toggle
- Grid size selector (10px-40px)
- Theme selector

#### Left Sidebar (300px width)
- **Search Box**: Filter metrics by name/description
- **Category Filter**: Dropdown for metric categories
- **Metrics List**: Draggable metric cards with:
  - Metric name and description
  - Chart type icon
  - Category badge
  - Drag handle icon

#### Main Canvas
- **ReactFlow Container**: Full-height drag-and-drop canvas
- **Grid Background**: Visual grid with configurable spacing
- **Widget Components**: Resizable metric widgets
- **Empty State**: Instructions when no widgets present

### Widget Design
Each widget displays:
- Header with metric name and chart icon
- Category badge
- Optional description
- Resize handles (visible when selected)
- Blue border when selected

## 2. Database Schema

### SQL Script to Create All Required Tables

```sql
-- Dashboard Builder Core Tables
CREATE TABLE dashboards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}',
    is_default BOOLEAN DEFAULT false,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE dashboard_widgets (
    id SERIAL PRIMARY KEY,
    dashboard_id INTEGER REFERENCES dashboards(id) ON DELETE CASCADE,
    metric_id INTEGER,
    position_x DECIMAL(10,2) NOT NULL,
    position_y DECIMAL(10,2) NOT NULL,
    width INTEGER DEFAULT 300,
    height INTEGER DEFAULT 200,
    widget_config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Widget Templates System
CREATE TABLE widget_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    chart_type VARCHAR(100) NOT NULL,
    template_config JSONB NOT NULL DEFAULT '{}',
    size_preset VARCHAR(50) DEFAULT 'medium',
    color_scheme VARCHAR(50) DEFAULT 'default',
    is_system BOOLEAN DEFAULT false,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Dashboard Themes System
CREATE TABLE dashboard_themes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    theme_config JSONB NOT NULL DEFAULT '{}',
    color_palette JSONB DEFAULT '{}',
    typography JSONB DEFAULT '{}',
    grid_settings JSONB DEFAULT '{}',
    is_system BOOLEAN DEFAULT true,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Metrics Table (Required for widgets)
CREATE TABLE metrics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    chart_type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    sql_query TEXT,
    chart_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sample Data Insertion
INSERT INTO widget_templates (name, description, chart_type, template_config, size_preset, color_scheme, is_system) VALUES
('Standard Bar Chart', 'Basic bar chart template', 'bar', '{"responsive": true, "maintainAspectRatio": false}', 'medium', 'default', true),
('Compact Line Chart', 'Small line chart for trends', 'line', '{"responsive": true, "legend": {"display": false}}', 'small', 'minimal', true),
('Large Pie Chart', 'Detailed pie chart with labels', 'pie', '{"responsive": true, "plugins": {"legend": {"position": "right"}}}', 'large', 'colorful', true);

INSERT INTO dashboard_themes (name, description, theme_config, color_palette, typography, grid_settings, is_system) VALUES
('Default Light', 'Standard light theme', '{"background": "#ffffff", "border": "#e2e8f0"}', '{"primary": "#3b82f6", "secondary": "#64748b"}', '{"fontSize": "14px", "fontFamily": "Inter"}', '{"snapSize": 20, "showGrid": true}', true),
('Dark Professional', 'Professional dark theme', '{"background": "#1f2937", "border": "#374151"}', '{"primary": "#60a5fa", "secondary": "#9ca3af"}', '{"fontSize": "14px", "fontFamily": "Inter"}', '{"snapSize": 20, "showGrid": true}', true);

INSERT INTO metrics (name, description, chart_type, category, sql_query) VALUES
('Total Vulnerabilities', 'Count of all identified vulnerabilities', 'bar', 'Vulnerabilities', 'SELECT COUNT(*) as value FROM vulnerabilities'),
('Critical Vulnerabilities', 'Count of critical severity vulnerabilities', 'pie', 'Vulnerabilities', 'SELECT severity, COUNT(*) as count FROM vulnerabilities GROUP BY severity'),
('Remediation Timeline', 'Timeline of vulnerability remediation', 'line', 'Remediation', 'SELECT DATE(fixed_date) as date, COUNT(*) as fixed FROM vulnerabilities WHERE fixed_date IS NOT NULL GROUP BY DATE(fixed_date)'),
('Asset Discovery Growth', 'Growth in discovered assets over time', 'line', 'AI Analytics', 'SELECT DATE(created_at) as date, COUNT(*) as discovered FROM assets GROUP BY DATE(created_at)'),
('Compliance Score', 'Overall compliance percentage', 'pie', 'Compliance', 'SELECT control_family, AVG(compliance_score) as score FROM compliance_controls GROUP BY control_family'),
('Patch Management Status', 'Status of patch deployment', 'bar', 'Patching', 'SELECT patch_status, COUNT(*) as count FROM patch_deployments GROUP BY patch_status');

-- Create indexes for performance
CREATE INDEX idx_dashboard_widgets_dashboard_id ON dashboard_widgets(dashboard_id);
CREATE INDEX idx_dashboard_widgets_metric_id ON dashboard_widgets(metric_id);
CREATE INDEX idx_dashboards_created_by ON dashboards(created_by);
CREATE INDEX idx_metrics_category ON metrics(category);
CREATE INDEX idx_metrics_chart_type ON metrics(chart_type);
```

### Database Table Relationships

```
dashboards (1) ──── (∞) dashboard_widgets
metrics (1) ──── (∞) dashboard_widgets
widget_templates (1) ──── (∞) [used by widgets]
dashboard_themes (1) ──── (∞) [applied to dashboards]
```

## 3. Service Layer

### Core Services

#### 1. DashboardService
**Purpose**: Handle dashboard CRUD operations and layout management
- `createDashboard(data)`: Create new dashboard with widgets
- `updateDashboard(id, data)`: Update dashboard layout and widgets
- `getDashboards()`: Retrieve all dashboards
- `getDashboardById(id)`: Get dashboard with widgets and metrics
- `deleteDashboard(id)`: Remove dashboard and associated widgets

#### 2. MetricsService
**Purpose**: Manage available metrics for dashboard widgets
- `getAllMetrics()`: Get all available metrics
- `getMetricsByCategory(category)`: Filter metrics by category
- `getMetricData(metricId)`: Execute metric query and return data
- `validateMetric(metric)`: Ensure metric SQL query is safe

#### 3. WidgetTemplateService
**Purpose**: Manage reusable widget templates
- `getTemplates()`: Get all widget templates
- `getTemplatesByChartType(type)`: Filter templates by chart type
- `createTemplate(data)`: Create custom template
- `applyTemplate(widgetId, templateId)`: Apply template to widget

#### 4. DashboardThemeService
**Purpose**: Handle dashboard visual themes
- `getThemes()`: Get all available themes
- `getThemeById(id)`: Get specific theme configuration
- `applyTheme(dashboardId, themeId)`: Apply theme to dashboard
- `createCustomTheme(data)`: Create user-defined theme

#### 5. GridService
**Purpose**: Handle grid snapping and layout calculations
- `snapToGrid(position, gridSize)`: Snap coordinates to grid
- `calculateOptimalSize(chartType)`: Determine best widget size
- `detectCollisions(widgets)`: Check for widget overlaps
- `autoLayout(widgets)`: Automatically arrange widgets

## 4. Controllers

### 1. DashboardController (`server/controllers/dashboardController.ts`)
**Routes**: `/api/dashboards/*`
- `getAllDashboards()`: GET - List all dashboards
- `getDashboardById()`: GET - Get dashboard with widgets
- `createDashboard()`: POST - Create new dashboard
- `updateDashboard()`: PUT - Update dashboard layout
- `deleteDashboard()`: DELETE - Remove dashboard

### 2. MetricsController (`server/controllers/metricsController.ts`)
**Routes**: `/api/metrics/*`
- `getAllMetrics()`: GET - List available metrics
- `getMetricsByCategory()`: GET - Filter by category
- `executeMetric()`: POST - Run metric query
- `validateMetricQuery()`: POST - Validate SQL query

### 3. WidgetTemplateController (`server/controllers/widgetTemplateController.ts`)
**Routes**: `/api/widget-templates/*`
- `getAllWidgetTemplates()`: GET - List all templates
- `getTemplatesByChartType()`: GET - Filter by chart type
- `createWidgetTemplate()`: POST - Create template
- `updateWidgetTemplate()`: PUT - Update template
- `deleteWidgetTemplate()`: DELETE - Remove template

### 4. DashboardThemeController (`server/controllers/dashboardThemeController.ts`)
**Routes**: `/api/dashboard-themes/*`
- `getAllDashboardThemes()`: GET - List all themes
- `getDashboardThemeById()`: GET - Get theme details
- `createDashboardTheme()`: POST - Create theme
- `updateDashboardTheme()`: PUT - Update theme
- `deleteDashboardTheme()`: DELETE - Remove theme

### 5. DashboardMetricsController (`server/controllers/dashboardMetricsController.ts`)
**Routes**: `/api/dashboard-metrics/*`
- `getMetricsForDashboard()`: GET - Get metrics for specific dashboard
- `addMetricToDashboard()`: POST - Add metric widget to dashboard
- `updateWidgetPosition()`: PUT - Update widget position/size
- `removeMetricFromDashboard()`: DELETE - Remove widget

## 5. API Routes

### Dashboard Management Routes
```typescript
// Get all dashboards
GET /api/dashboards
Response: { dashboards: Dashboard[] }

// Get dashboard by ID with widgets
GET /api/dashboards/:id
Response: { dashboard: Dashboard, widgets: Widget[] }

// Create new dashboard
POST /api/dashboards
Body: { name: string, description?: string, layout: object, widgets?: Widget[] }
Response: Dashboard

// Update dashboard
PUT /api/dashboards/:id
Body: { name?: string, description?: string, layout?: object, widgets?: Widget[] }
Response: Dashboard

// Delete dashboard
DELETE /api/dashboards/:id
Response: { message: string }
```

### Metrics Routes
```typescript
// Get all metrics
GET /api/metrics
Response: { metrics: Metric[] }

// Get metrics by category
GET /api/metrics?category=:category
Response: { metrics: Metric[] }

// Execute metric query
POST /api/metrics/:id/execute
Response: { data: any[], executionTime: number }
```

### Widget Template Routes
```typescript
// Get all widget templates
GET /api/widget-templates
Response: { templates: WidgetTemplate[] }

// Get templates by chart type
GET /api/widget-templates?chartType=:type
Response: { templates: WidgetTemplate[] }

// Create widget template
POST /api/widget-templates
Body: { name: string, chartType: string, templateConfig: object }
Response: WidgetTemplate
```

### Dashboard Theme Routes
```typescript
// Get all themes
GET /api/dashboard-themes
Response: { themes: DashboardTheme[] }

// Get theme by ID
GET /api/dashboard-themes/:id
Response: DashboardTheme

// Create dashboard theme
POST /api/dashboard-themes
Body: { name: string, themeConfig: object, colorPalette: object }
Response: DashboardTheme
```

## 6. Step-by-Step Functionality

### A. Initial Load Process
1. **Component Initialization**
   - Load available metrics from `/api/metrics`
   - Initialize ReactFlow with empty state
   - Set up drag-and-drop handlers
   - Configure grid snapping system

2. **UI Setup**
   - Render left sidebar with metrics list
   - Display search and filter controls
   - Show empty canvas with instructions
   - Initialize grid background

### B. Metric Discovery and Display
1. **Metrics Loading**
   - Fetch all metrics with categories
   - Group metrics by category for filtering
   - Display metrics as draggable cards
   - Show chart type icons and descriptions

2. **Search and Filter**
   - Real-time search by metric name/description
   - Category-based filtering
   - Dynamic list updates
   - Search highlighting

### C. Drag and Drop Process
1. **Drag Initiation**
   - User clicks and drags metric from sidebar
   - Set drag data with metric information
   - Show drag preview/ghost image
   - Update cursor to indicate drag state

2. **Drop Zone Interaction**
   - Canvas area acts as drop zone
   - Show drop indicators during drag over
   - Calculate drop position relative to canvas
   - Apply grid snapping if enabled

3. **Widget Creation**
   - Create new ReactFlow node at drop position
   - Generate unique node ID
   - Set initial size based on chart type
   - Add widget to canvas nodes array

### D. Widget Interaction
1. **Selection**
   - Click widget to select
   - Show blue border and resize handles
   - Update selected state in ReactFlow
   - Enable resize and move operations

2. **Resizing**
   - Display corner resize handles when selected
   - Drag handles to change widget dimensions
   - Maintain minimum size constraints
   - Apply grid snapping to size changes

3. **Moving**
   - Click and drag widget to reposition
   - Apply grid snapping during move
   - Update widget position in real-time
   - Prevent overlapping if collision detection enabled

### E. Grid System
1. **Visual Grid**
   - Background dots or lines at configurable intervals
   - Grid size adjustable (10px, 20px, 30px, 40px)
   - Visual feedback for snap positions
   - Toggle grid visibility

2. **Snap Functionality**
   - Snap widget positions to grid points
   - Snap widget sizes to grid increments
   - Configurable snap tolerance
   - Disable snapping option available

### F. Dashboard Persistence
1. **Save Process**
   - Collect all widget positions and configurations
   - Serialize ReactFlow state to JSON
   - Send dashboard data to API
   - Store layout and widget relationships

2. **Load Process**
   - Fetch dashboard by ID
   - Restore ReactFlow nodes and edges
   - Position widgets according to saved layout
   - Apply theme and grid settings

### G. Theme Application
1. **Theme Selection**
   - Load available themes from API
   - Preview theme colors and styles
   - Apply theme to canvas and widgets
   - Save theme preference with dashboard

2. **Style Updates**
   - Update CSS custom properties
   - Change widget border colors
   - Modify background patterns
   - Adjust typography settings

## 7. Implementation Guide

### Prerequisites
```bash
npm install reactflow react-query @tanstack/react-query
npm install @radix-ui/react-dialog @radix-ui/react-select
npm install lucide-react tailwindcss
```

### Key Dependencies
- **ReactFlow**: Drag-and-drop canvas with nodes and edges
- **React Query**: API state management and caching
- **Radix UI**: Accessible UI components
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library

### Core Implementation Steps

#### 1. Set Up Database Schema
```sql
-- Execute the SQL script from section 2 to create all required tables
-- Ensure proper indexes are created for performance
-- Insert sample data for testing
```

#### 2. Create Backend Controllers
```typescript
// Implement all controllers from section 4
// Set up proper error handling and validation
// Add authentication and authorization as needed
```

#### 3. Set Up API Routes
```typescript
// Configure Express routes for all API endpoints
// Add middleware for validation and error handling
// Implement proper HTTP status codes
```

#### 4. Build Frontend Components
```typescript
// Create main DashboardBuilder component
// Implement MetricWidget component with ReactFlow
// Build sidebar with search and filter functionality
// Configure drag-and-drop handlers
```

#### 5. Integrate ReactFlow
```typescript
// Set up ReactFlow provider and canvas
// Configure node types and custom components
// Implement grid snapping functionality
// Add resize handles and controls
```

#### 6. Add State Management
```typescript
// Use React Query for API calls
// Implement local state for canvas operations
// Handle loading and error states
// Add optimistic updates for better UX
```

### Testing Strategy
1. **Unit Tests**: Test individual components and utilities
2. **Integration Tests**: Test API endpoints and database operations
3. **E2E Tests**: Test complete user workflows
4. **Performance Tests**: Verify canvas performance with many widgets

### Performance Considerations
- Virtualize metric list for large datasets
- Implement lazy loading for widget data
- Use React.memo for expensive components
- Optimize ReactFlow rendering settings
- Cache API responses appropriately

### Security Considerations
- Validate and sanitize SQL queries in metrics
- Implement proper authentication for dashboard access
- Use parameterized queries to prevent injection
- Validate widget configurations before saving
- Implement rate limiting on API endpoints

This comprehensive guide provides all the information needed to replicate the dashboard builder functionality in any React application using ReactFlow as the foundation.