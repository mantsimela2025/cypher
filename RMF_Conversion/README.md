# RMF System - Bootstrap v5 Conversion

This folder contains the converted RMF (Risk Management Framework) components from TypeScript/React with shadcn/ui to JavaScript/React with Bootstrap v5 styling.

## Overview

The RMF system automates the 6-step Risk Management Framework process, reducing traditional 12-24 month ATO timelines to 3-6 months through AI automation. This conversion provides the same functionality using Bootstrap v5 for styling instead of Tailwind CSS and shadcn/ui components.

## Converted Components

### Pages
- **RMFDashboard.jsx** - Main dashboard with system overview, metrics, and AI insights
- **SystemDetails.jsx** - Detailed system view with tabbed interface for process tracking
- **SystemsNew.jsx** - Form for adding new systems to the RMF process
- **SystemCategorizationWizard.jsx** - Step-by-step wizard for system categorization

### Components
- **ComplianceHeatmap.jsx** - Visual heatmap showing NIST 800-53 control family implementation status

### Utilities
- **bootstrap-helpers.js** - Utility functions for Bootstrap styling and common UI patterns

## Key Features Converted

### 1. RMF Dashboard
- **Bootstrap Cards** for metrics display with icon integration
- **Progress bars** using Bootstrap progress components
- **Responsive grid system** for layout
- **Modal dialogs** for AI recommendation application
- **Badge system** for risk levels and status indicators

### 2. System Details
- **Bootstrap tabs** for organizing information (Overview, Process, Categorization, Artifacts)
- **Breadcrumb navigation** using Bootstrap breadcrumbs
- **Table components** for artifacts and documentation
- **Progress tracking** with Bootstrap progress bars
- **Alert components** for AI categorization reasoning

### 3. System Creation & Categorization
- **Form controls** using Bootstrap form classes
- **Multi-step wizard** with Bootstrap cards and navigation
- **Radio button groups** for impact level selection
- **Checkbox groups** for special factors
- **AI analysis integration** with loading states

### 4. Compliance Heatmap
- **Responsive grid** showing control family implementation percentages
- **Color-coded cards** indicating implementation levels
- **Legend system** for understanding implementation status
- **Tooltip integration** for detailed information

## Dependencies Required

```html
<!-- Bootstrap CSS -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

<!-- Bootstrap Icons -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
```

## Usage Example

```javascript
import React from 'react';
import { RMFDashboard, SystemDetails, SystemsNew, SystemCategorizationWizard } from './RMF_Conversion';

function App() {
  return (
    <div className="App">
      {/* Use any of the converted components */}
      <RMFDashboard />
    </div>
  );
}

export default App;
```

## Bootstrap Classes Used

### Layout
- `container`, `container-fluid` - Page containers
- `row`, `col-*` - Grid system for responsive layout
- `d-flex`, `justify-content-*`, `align-items-*` - Flexbox utilities

### Components
- `card`, `card-header`, `card-body` - Card components
- `btn`, `btn-primary`, `btn-outline-*` - Button styling
- `badge`, `bg-*` - Status indicators
- `progress`, `progress-bar` - Progress tracking
- `nav`, `nav-tabs`, `tab-content` - Tab navigation
- `modal`, `modal-dialog` - Modal dialogs
- `alert`, `alert-*` - Information alerts
- `table`, `table-hover` - Data tables

### Form Controls
- `form-control`, `form-select` - Input styling
- `form-check`, `form-check-input` - Checkboxes and radios
- `form-label` - Label styling

### Utilities
- `text-*` - Text colors and alignment
- `bg-*` - Background colors
- `p-*`, `m-*` - Padding and margins
- `border`, `rounded` - Border and corner styling

## Conversion Notes

1. **State Management**: Converted from TypeScript to JavaScript while maintaining React hooks
2. **Styling**: Replaced Tailwind CSS classes with Bootstrap v5 equivalents
3. **Icons**: Changed from Lucide React to Bootstrap Icons
4. **Modals**: Implemented using Bootstrap modal component instead of custom dialog
5. **Forms**: Used Bootstrap form controls instead of shadcn/ui form components
6. **Navigation**: Implemented with Bootstrap breadcrumbs and tab navigation

## AI Integration Points

The converted components maintain all AI-powered features:
- **System categorization recommendations** with confidence levels
- **Security control suggestions** based on NIST guidelines
- **Risk assessment automation** using OpenAI integration
- **Process optimization insights** for ATO timeline reduction

## Mock Data

All components include mock data for demonstration purposes. In a real implementation, replace the mock data with actual API calls to your backend services.

## Responsive Design

All components are fully responsive using Bootstrap's grid system and responsive utilities:
- **Mobile-first** design approach
- **Tablet optimization** with appropriate column layouts
- **Desktop enhancement** with expanded layouts and additional information display