# STIG Management UI Components and Layout

## Overview

This document provides comprehensive documentation of all frontend components, layouts, and user interface elements in the STIG Management system. The UI is built using React, TypeScript, and shadcn/ui components with a professional design similar to STIG Manager.

## Main Page Component

### STIGManagementPage.tsx
**Location**: `client/src/pages/STIGManagementPage.tsx`  
**Purpose**: Main container page for all STIG management functionality

## Page Structure and Layout

### Overall Layout Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Header Bar                               │
├─────────────────┬───────────────────────────────────────────┤
│                 │                                           │
│   Left          │            Main Content Area             │
│   Navigation    │                                           │
│   Tree          │                                           │
│                 │                                           │
│                 │                                           │
│                 │                                           │
└─────────────────┴───────────────────────────────────────────┘
```

### 1. Header Bar Component
**Purpose**: Application branding and global actions

**Layout**:
```jsx
<div className="bg-white border-b">
  <div className="flex items-center justify-between px-6 py-4">
    {/* Left Side: Branding */}
    <div className="flex items-center space-x-4">
      <Shield className="w-8 h-8 text-blue-600" />
      <div>
        <h1>STIG Manager</h1>
        <p>Security Technical Implementation Guide Management</p>
      </div>
    </div>
    
    {/* Right Side: Actions */}
    <div className="flex items-center space-x-2">
      <Button>Initialize Mappings</Button>
      <CreateCollectionDialog />
    </div>
  </div>
</div>
```

**Features**:
- **Shield Icon**: Blue shield icon for security branding
- **Title**: "STIG Manager" with descriptive subtitle
- **Initialize Mappings Button**: Populates database with default STIG mappings
- **Create Collection Button**: Opens dialog for new collection creation

### 2. Left Navigation Tree
**Purpose**: Collection navigation and STIG library access  
**Width**: 320px fixed  
**Background**: White with border-right

**Sections**:

#### Collections Section
```jsx
<div className="p-4">
  <h3 className="font-semibold text-gray-900 mb-3">Collections</h3>
  <ScrollArea className="h-[300px]">
    {collections.map(collection => (
      <CollectionItem 
        key={collection.id}
        collection={collection}
        isSelected={selectedCollection?.id === collection.id}
        onClick={() => setSelectedCollection(collection)}
      />
    ))}
  </ScrollArea>
</div>
```

**Collection Item Features**:
- **Folder Icon**: Visual indicator for collection type
- **Selection State**: Blue background and left border for active collection
- **Hover Effects**: Gray background on hover
- **Truncated Text**: Prevents overflow of long collection names

#### STIG Library Section
```jsx
<div className="p-4 flex-1">
  <h3 className="font-semibold text-gray-900 mb-3">STIG Library</h3>
  <div className="space-y-2">
    <Button variant="outline" size="sm" className="w-full justify-start">
      <Download className="w-4 h-4 mr-2" />
      Download STIGs
    </Button>
    <Button variant="outline" size="sm" className="w-full justify-start">
      <Upload className="w-4 h-4 mr-2" />
      Import CKL/XCCDF
    </Button>
  </div>
</div>
```

**Features**:
- **Download STIGs**: Integration point for official DISA downloads
- **Import CKL/XCCDF**: File upload for existing compliance data
- **Full-width Buttons**: Consistent left-aligned layout with icons

### 3. Main Content Area
**Purpose**: Tabbed interface for collection management

## Tab System Components

### Tab Navigation
```jsx
<TabsList className="grid w-full grid-cols-5">
  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
  <TabsTrigger value="assets">Assets</TabsTrigger>
  <TabsTrigger value="stigs">STIGs</TabsTrigger>
  <TabsTrigger value="reviews">Reviews</TabsTrigger>
  <TabsTrigger value="instructions">Instructions</TabsTrigger>
</TabsList>
```

**Tab Descriptions**:
- **Dashboard**: Collection overview and metrics
- **Assets**: Asset management and STIG assignments
- **STIGs**: STIG library and mapping management
- **Reviews**: Compliance review interface
- **Instructions**: User guide and help content

### 1. Dashboard Tab Component

#### CollectionDashboard Component
**Purpose**: Overview metrics and collection summary

**Metrics Cards Layout**:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
  <MetricCard
    title="Total Assets"
    value={assets.length}
    icon={<Users className="w-6 h-6" />}
    trend="+12%"
  />
  <MetricCard
    title="STIG Assignments"
    value={totalAssignments}
    icon={<Shield className="w-6 h-6" />}
    trend="+8%"
  />
  <MetricCard
    title="Compliant"
    value={compliantCount}
    icon={<CheckCircle className="w-6 h-6" />}
    color="green"
  />
  <MetricCard
    title="Findings"
    value={findingsCount}
    icon={<AlertTriangle className="w-6 h-6" />}
    color="red"
  />
</div>
```

**Visual Indicators**:
- **Color Coding**: Green for compliant, red for findings, blue for informational
- **Trend Arrows**: Up/down indicators for metric changes
- **Icons**: Lucide React icons for visual context

#### Recent Activity Section
```jsx
<Card className="mt-6">
  <CardHeader>
    <CardTitle>Recent Activity</CardTitle>
  </CardHeader>
  <CardContent>
    <ScrollArea className="h-64">
      {recentActivities.map(activity => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </ScrollArea>
  </CardContent>
</Card>
```

### 2. Assets Tab Component

#### AssetsView Component
**Purpose**: Asset listing and management interface

**Search and Filter Bar**:
```jsx
<div className="flex items-center space-x-4 p-4 bg-white border-b">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
    <Input
      placeholder="Search assets by name, hostname, or OS..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-10"
    />
  </div>
  <Button variant="outline" size="sm">
    <Filter className="w-4 h-4 mr-2" />
    Filter
  </Button>
  <Button size="sm">
    <Plus className="w-4 h-4 mr-2" />
    Add Asset
  </Button>
</div>
```

**Assets Grid Layout**:
```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
  {filteredAssets.map(asset => (
    <AssetCard
      key={asset.id}
      asset={asset}
      onSelect={() => setSelectedAsset(asset)}
      onEdit={() => openEditDialog(asset)}
    />
  ))}
</div>
```

#### AssetCard Component
**Purpose**: Individual asset display with key information

```jsx
<Card className="hover:shadow-md transition-shadow cursor-pointer">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <CardTitle className="text-base">{asset.name}</CardTitle>
      <CriticalityBadge level={asset.criticality} />
    </div>
    <p className="text-sm text-gray-500">{asset.hostname}</p>
  </CardHeader>
  <CardContent>
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-500">OS:</span>
        <span>{asset.operatingSystem}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Environment:</span>
        <EnvironmentBadge environment={asset.environment} />
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Last Scan:</span>
        <span>{formatDate(asset.lastScan)}</span>
      </div>
    </div>
    <Separator className="my-3" />
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">STIG Assignments</span>
      <Progress value={75} className="w-16 h-2" />
    </div>
  </CardContent>
</Card>
```

**Badge Components**:
- **CriticalityBadge**: Color-coded badges (red=critical, orange=high, yellow=medium, green=low)
- **EnvironmentBadge**: Environment indicators (production, staging, development)
- **StatusBadge**: Assignment status indicators

### 3. Instructions Tab Component

#### InstructionsView Component
**Purpose**: Comprehensive user guide and help documentation

**Content Structure**:
```jsx
<ScrollArea className="h-full">
  <div className="p-6 max-w-4xl mx-auto">
    <div className="space-y-8">
      <HelpSection title="Getting Started" icon={<FileText />}>
        <StepList steps={gettingStartedSteps} />
      </HelpSection>
      
      <HelpSection title="Collection Management" icon={<FolderOpen />}>
        <FeatureGuide features={collectionFeatures} />
      </HelpSection>
      
      <HelpSection title="Asset Management" icon={<Users />}>
        <WorkflowGuide workflows={assetWorkflows} />
      </HelpSection>
      
      <HelpSection title="STIG Assignment Logic" icon={<Shield />}>
        <AssignmentLogicExplanation />
      </HelpSection>
      
      <HelpSection title="Troubleshooting" icon={<AlertTriangle />}>
        <TroubleshootingGuide />
      </HelpSection>
    </div>
  </div>
</ScrollArea>
```

**Instruction Content**:
1. **Getting Started**: Basic navigation and setup
2. **Collection Management**: Creating and organizing collections
3. **Asset Management**: Adding assets and viewing assignments
4. **STIG Assignment Logic**: How automatic assignment works
5. **Testing Guide**: Using the "Test Assignment" functionality
6. **Troubleshooting**: Common issues and solutions

## Dialog Components

### 1. CreateCollectionDialog
**Purpose**: Modal for creating new STIG collections

```jsx
<Dialog>
  <DialogTrigger asChild>
    <Button size="sm">
      <Plus className="w-4 h-4 mr-2" />
      New Collection
    </Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Create STIG Collection</DialogTitle>
    </DialogHeader>
    <CollectionForm onSubmit={handleSubmit} isLoading={isLoading} />
  </DialogContent>
</Dialog>
```

**Form Fields**:
- **Name**: Required text field for collection name
- **Description**: Optional textarea for collection purpose
- **Settings**: Advanced options (auto-assignment, environment defaults)

### 2. AssetDetailsDialog
**Purpose**: Detailed view of asset information and STIG assignments

**Content Sections**:
- **Asset Information**: OS, IP, environment, criticality
- **STIG Assignments**: List of assigned STIGs with status
- **Recent Reviews**: Latest compliance review results
- **Assignment History**: Timeline of STIG assignments

### 3. AssignmentWizardDialog
**Purpose**: Guided workflow for manual STIG assignment

**Steps**:
1. **Asset Selection**: Choose target asset
2. **STIG Selection**: Browse available STIGs
3. **Priority Setting**: Set assignment priority
4. **Review**: Confirm assignment details

## Utility Components

### 1. Badge Components
```jsx
// Criticality Badge
<Badge variant={criticalityVariant(level)} className="text-xs">
  {level.toUpperCase()}
</Badge>

// Environment Badge  
<Badge variant="outline" className="text-xs">
  {environment}
</Badge>

// Status Badge
<Badge variant={statusVariant(status)} className="text-xs">
  {formatStatus(status)}
</Badge>
```

### 2. Progress Indicators
```jsx
// Compliance Progress
<div className="flex items-center space-x-2">
  <Progress value={compliancePercentage} className="flex-1" />
  <span className="text-sm text-gray-500">{compliancePercentage}%</span>
</div>

// Loading Spinner
<div className="flex items-center justify-center p-4">
  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
</div>
```

### 3. Empty States
```jsx
// No Collections
<div className="text-center p-8">
  <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
  <h3 className="text-lg font-medium text-gray-900 mb-2">No Collections</h3>
  <p className="text-gray-500 mb-4">Create your first STIG collection to get started</p>
  <CreateCollectionDialog />
</div>

// No Assets
<div className="text-center p-8">
  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
  <h3 className="text-lg font-medium text-gray-900 mb-2">No Assets</h3>
  <p className="text-gray-500 mb-4">Add assets to this collection to begin STIG management</p>
  <Button>Add Asset</Button>
</div>
```

## State Management

### React Query Integration
```typescript
// Collections Query
const { data: collections = [], isLoading: collectionsLoading } = useQuery({
  queryKey: ['/api/stig/collections']
});

// Assets Query (dependent on selected collection)
const { data: assets = [], isLoading: assetsLoading } = useQuery({
  queryKey: ['/api/stig/collections', selectedCollection?.id, 'assets'],
  enabled: !!selectedCollection?.id
});

// Mutations
const createCollectionMutation = useMutation({
  mutationFn: (data: { name: string; description?: string }) =>
    apiRequest('/api/stig/collections', 'POST', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/stig/collections'] });
    toast({ title: 'Collection created successfully' });
  }
});
```

### Local State Management
```typescript
// Component State
const [selectedCollection, setSelectedCollection] = useState<StigCollection | null>(null);
const [selectedAsset, setSelectedAsset] = useState<StigAsset | null>(null);
const [searchTerm, setSearchTerm] = useState('');
const [activeTab, setActiveTab] = useState('dashboard');

// Auto-select first collection
useEffect(() => {
  if (collections.length > 0 && !selectedCollection) {
    setSelectedCollection(collections[0]);
  }
}, [collections, selectedCollection]);
```

## Responsive Design

### Breakpoint Strategy
- **Mobile (sm)**: 640px - Single column layout, collapsed navigation
- **Tablet (md)**: 768px - Two column layout, visible navigation
- **Desktop (lg)**: 1024px - Three column layout, full feature set
- **Wide (xl)**: 1280px - Four column asset grid, expanded content

### Mobile Adaptations
```jsx
// Responsive Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// Responsive Navigation
<div className="w-80 bg-white border-r flex flex-col hidden lg:flex">

// Mobile Menu Button
<Button className="lg:hidden" variant="outline" size="sm">
  <Menu className="w-4 h-4" />
</Button>
```

## Accessibility Features

### ARIA Labels and Roles
```jsx
<Button 
  aria-label="Initialize STIG mappings"
  role="button"
  onClick={() => initializeMappingsMutation.mutate()}
>
  Initialize Mappings
</Button>

<TabsList role="tablist" aria-label="STIG Management Options">
  <TabsTrigger role="tab" aria-selected={activeTab === 'dashboard'}>
    Dashboard
  </TabsTrigger>
</TabsList>
```

### Keyboard Navigation
- **Tab Navigation**: Logical tab order through interface
- **Enter/Space**: Activate buttons and selection
- **Escape**: Close dialogs and reset filters
- **Arrow Keys**: Navigate between tab triggers

### Screen Reader Support
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Alt Text**: Descriptive text for icons and images
- **Live Regions**: Dynamic content announcements
- **Focus Management**: Proper focus handling in dialogs

This comprehensive UI component system provides a professional, accessible, and user-friendly interface for enterprise STIG management, maintaining consistency with government security tool standards while offering modern usability features.