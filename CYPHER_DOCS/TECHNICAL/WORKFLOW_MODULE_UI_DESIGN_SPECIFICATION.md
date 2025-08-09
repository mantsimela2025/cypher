# Workflow Module - UI Design & Component Specification

## Overview

This document provides comprehensive UI design specifications for the Workflow Management Module, detailing every visual component, interaction pattern, layout structure, and styling approach needed to recreate the professional workflow builder interface with identical look and feel.

## Design System Foundation

### Color Palette
```css
/* Primary workflow colors */
--workflow-primary: #6366f1;      /* Indigo 500 - Primary actions */
--workflow-primary-dark: #4f46e5;  /* Indigo 600 - Hover states */
--workflow-primary-light: #a5b4fc; /* Indigo 300 - Disabled states */

/* Node type colors */
--trigger-color: #10b981;         /* Green 500 - Trigger nodes */
--action-color: #3b82f6;          /* Blue 500 - Action nodes */
--condition-color: #f59e0b;       /* Amber 500 - Condition nodes */
--approval-color: #8b5cf6;        /* Purple 500 - Approval nodes */
--integration-color: #6366f1;     /* Indigo 500 - Integration nodes */
--notification-color: #ec4899;    /* Pink 500 - Notification nodes */

/* Status colors */
--status-pending: #6b7280;        /* Gray 500 */
--status-running: #3b82f6;        /* Blue 500 */
--status-completed: #10b981;      /* Green 500 */
--status-failed: #ef4444;         /* Red 500 */
--status-paused: #f59e0b;         /* Amber 500 */
--status-waiting: #8b5cf6;        /* Purple 500 */

/* Background colors */
--canvas-bg: #f9fafb;             /* Gray 50 - Canvas background */
--grid-color: #e5e7eb;            /* Gray 200 - Grid dots */
--panel-bg: #ffffff;              /* White - Panel backgrounds */
--hover-bg: #f3f4f6;              /* Gray 100 - Hover states */
```

### Typography Scale
```css
/* Workflow-specific typography */
.workflow-title {
  font-size: 1.875rem;            /* 30px */
  font-weight: 700;
  line-height: 1.2;
  color: #111827;
}

.workflow-subtitle {
  font-size: 1.125rem;            /* 18px */
  font-weight: 600;
  line-height: 1.4;
  color: #374151;
}

.node-label {
  font-size: 0.875rem;            /* 14px */
  font-weight: 500;
  line-height: 1.4;
  color: #111827;
}

.node-description {
  font-size: 0.75rem;             /* 12px */
  font-weight: 400;
  line-height: 1.3;
  color: #6b7280;
}

.status-text {
  font-size: 0.75rem;             /* 12px */
  font-weight: 600;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### Spacing System
```css
/* Workflow-specific spacing variables */
--space-node-padding: 12px;       /* Internal node padding */
--space-panel-padding: 16px;      /* Panel content padding */
--space-section-gap: 24px;        /* Gap between sections */
--space-node-gap: 8px;            /* Gap between node elements */
--space-button-gap: 8px;          /* Gap between buttons */

/* Grid and layout spacing */
--canvas-grid-size: 20px;         /* Canvas grid size */
--node-min-width: 240px;          /* Minimum node width */
--node-min-height: 80px;          /* Minimum node height */
--panel-min-width: 320px;         /* Minimum panel width */
```

## Main Layout Structure

### WorkflowBuilderPage Layout
```
┌─────────────────────────────────────────────────────────────┐
│                    Header Bar (60px)                        │
│  Workflow Name | Save | Execute | Templates | Settings      │
├─────────────────────────────────────────────────────────────┤
│ Left Panel   │        Main Canvas Area         │ Right Panel│
│ (320px)      │         (flexible)              │ (320px)    │
│              │                                 │            │
│ Node Library │    React Flow Canvas            │ Config     │
│ - Triggers   │    - Visual Workflow Builder    │ Panel      │
│ - Actions    │    - Drag & Drop Interface      │ - Props    │
│ - Conditions │    - Real-time Connections      │ - Settings │
│ - Approvals  │    - Execution Visualization    │ - Preview  │
│ - Integrations│   - Grid Background            │ - Help     │
│ - Notifications│  - Zoom Controls              │            │
│              │                                 │            │
├─────────────────────────────────────────────────────────────┤
│                   Status Bar (40px)                         │
│  Execution Status | Progress | Zoom Level | Grid Toggle     │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints
```css
/* Desktop layout (1200px+) */
@media (min-width: 1200px) {
  .workflow-layout {
    display: grid;
    grid-template-columns: 320px 1fr 320px;
    grid-template-rows: 60px 1fr 40px;
    height: 100vh;
  }
}

/* Tablet layout (768px - 1199px) */
@media (min-width: 768px) and (max-width: 1199px) {
  .workflow-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    grid-template-rows: 60px 1fr 40px;
  }
  
  .right-panel {
    position: absolute;
    right: 0;
    top: 60px;
    width: 280px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
  
  .right-panel.open {
    transform: translateX(0);
  }
}

/* Mobile layout (< 768px) */
@media (max-width: 767px) {
  .workflow-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  
  .left-panel,
  .right-panel {
    position: fixed;
    top: 60px;
    left: 0;
    width: 100%;
    height: calc(100vh - 100px);
    transform: translateY(100%);
    transition: transform 0.3s ease;
    z-index: 50;
  }
}
```

## Component Design Specifications

### 1. WorkflowBuilderPage Component

#### Header Bar Design
```tsx
// Header bar with professional styling
<header className="h-15 bg-white border-b border-gray-200 shadow-sm">
  <div className="h-full px-6 flex items-center justify-between">
    {/* Left section - Workflow info */}
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Workflow className="h-5 w-5 text-indigo-600" />
        <Input
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="text-lg font-semibold border-none bg-transparent p-0 h-auto focus:ring-0"
          placeholder="Untitled Workflow"
        />
      </div>
      <Badge variant="secondary" className="text-xs">
        {workflowCategory}
      </Badge>
    </div>
    
    {/* Center section - Main actions */}
    <div className="flex items-center space-x-3">
      <Button 
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
        className="bg-indigo-600 hover:bg-indigo-700"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save
          </>
        )}
      </Button>
      
      <Button
        onClick={handleExecute}
        disabled={isExecuting || !workflowId}
        variant="outline"
        className="border-green-500 text-green-600 hover:bg-green-50"
      >
        {isExecuting ? (
          <>
            <Timer className="h-4 w-4 mr-2 animate-spin" />
            Executing...
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Execute
          </>
        )}
      </Button>
    </div>
    
    {/* Right section - Utilities */}
    <div className="flex items-center space-x-2">
      <Button
        onClick={() => setShowTemplateManager(true)}
        variant="ghost"
        size="sm"
      >
        <FileTemplate className="h-4 w-4 mr-2" />
        Templates
      </Button>
      
      <Button variant="ghost" size="sm">
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  </div>
</header>
```

#### Canvas Area Design
```tsx
// Main React Flow canvas with custom styling
<div className="workflow-canvas flex-1 relative bg-gray-50">
  <ReactFlow
    nodes={nodes}
    edges={edges}
    onNodesChange={onNodesChange}
    onEdgesChange={onEdgesChange}
    onConnect={onConnect}
    onDrop={onDrop}
    onDragOver={onDragOver}
    onInit={setReactFlowInstance}
    nodeTypes={workflowNodeTypes}
    defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
    minZoom={0.2}
    maxZoom={2}
    snapToGrid={true}
    snapGrid={[20, 20]}
    className="workflow-react-flow"
  >
    {/* Custom background with grid pattern */}
    <Background
      variant={BackgroundVariant.Dots}
      gap={20}
      size={1}
      color="#e5e7eb"
    />
    
    {/* Zoom and fit controls */}
    <Controls
      showZoom={true}
      showFitView={true}
      showInteractive={true}
      position="bottom-right"
      className="react-flow-controls"
    />
    
    {/* Mini-map for navigation */}
    <MiniMap
      nodeColor={(node) => getNodeMiniMapColor(node.data.nodeType)}
      nodeStrokeColor="#374151"
      nodeStrokeWidth={2}
      nodeBorderRadius={4}
      maskColor="rgba(0, 0, 0, 0.1)"
      position="bottom-left"
      className="workflow-minimap"
    />
  </ReactFlow>
  
  {/* Execution overlay when workflow is running */}
  {isExecuting && (
    <div className="absolute inset-0 bg-black bg-opacity-20 z-10 flex items-center justify-center">
      <Card className="bg-white shadow-lg">
        <CardContent className="p-6 text-center">
          <Timer className="h-8 w-8 mx-auto mb-3 text-blue-600 animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Workflow Executing</h3>
          <p className="text-gray-600 mb-4">Running workflow steps...</p>
          <Progress value={executionProgress} className="w-64 mx-auto" />
        </CardContent>
      </Card>
    </div>
  )}
</div>
```

### 2. WorkflowNodeLibrary Component

#### Node Library Panel Design
```tsx
// Left panel with categorized node library
<div className="workflow-node-library h-full bg-white border-r border-gray-200 overflow-hidden">
  {/* Panel header */}
  <div className="p-4 border-b border-gray-200">
    <h2 className="text-lg font-semibold text-gray-900 mb-3">
      Workflow Components
    </h2>
    
    {/* Filter tabs */}
    <Tabs value={nodeLibraryFilter} onValueChange={setNodeLibraryFilter}>
      <TabsList className="grid w-full grid-cols-3 text-xs">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="trigger">Triggers</TabsTrigger>
        <TabsTrigger value="action">Actions</TabsTrigger>
      </TabsList>
    </Tabs>
    
    {/* Search filter */}
    <div className="relative mt-3">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search components..."
        className="pl-10 text-sm"
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
      />
    </div>
  </div>
  
  {/* Scrollable node list */}
  <ScrollArea className="flex-1">
    <div className="p-4 space-y-6">
      {Object.entries(nodesByCategory).map(([category, nodes]) => (
        <div key={category}>
          {/* Category header */}
          <div className="flex items-center mb-3">
            <div className="h-px bg-gray-200 flex-1" />
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {category}
            </h3>
            <div className="h-px bg-gray-200 flex-1" />
          </div>
          
          {/* Category nodes */}
          <div className="space-y-2">
            {nodes.map((node) => (
              <NodeLibraryItem key={node.id} node={node} />
            ))}
          </div>
        </div>
      ))}
    </div>
  </ScrollArea>
</div>
```

#### Individual Node Library Item
```tsx
// Draggable node item with professional styling
<Card
  className="cursor-grab hover:shadow-md transition-all duration-200 border-l-4 group"
  style={{
    borderLeftColor: getNodeTypeColor(node.nodeType),
    backgroundColor: isHovered ? getNodeTypeColor(node.nodeType, 0.05) : 'white'
  }}
  draggable
  onDragStart={(event) => onDragStart(event, node)}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
>
  <CardContent className="p-3">
    <div className="flex items-start space-x-3">
      {/* Node icon */}
      <div 
        className="flex-shrink-0 mt-0.5 p-1.5 rounded transition-colors"
        style={{
          backgroundColor: getNodeTypeColor(node.nodeType, 0.1),
          color: getNodeTypeColor(node.nodeType)
        }}
      >
        {node.icon}
      </div>
      
      {/* Node info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-gray-700">
            {node.label}
          </h4>
          <Badge 
            variant="secondary" 
            className="text-xs shrink-0 ml-2"
            style={{
              backgroundColor: getNodeTypeColor(node.nodeType, 0.15),
              color: getNodeTypeColor(node.nodeType)
            }}
          >
            {node.nodeType}
          </Badge>
        </div>
        
        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
          {node.description}
        </p>
        
        {/* Node metadata */}
        <div className="flex items-center mt-2 space-x-2">
          {node.complexity && (
            <div className="flex items-center">
              <div className="flex space-x-0.5">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`w-1.5 h-1.5 rounded-full ${
                      level <= node.complexity 
                        ? 'bg-gray-400' 
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 ml-1">
                {node.complexity === 1 ? 'Simple' : 
                 node.complexity === 2 ? 'Medium' : 'Complex'}
              </span>
            </div>
          )}
          
          {node.tags && (
            <div className="flex flex-wrap gap-1">
              {node.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

### 3. Workflow Node Components

#### Base Node Design Pattern
```tsx
// Base styling for all workflow nodes
const BaseNodeWrapper: React.FC<{ 
  nodeType: string; 
  selected: boolean; 
  children: React.ReactNode 
}> = ({ nodeType, selected, children }) => {
  const nodeColors = getNodeTypeColors(nodeType);
  
  return (
    <Card 
      className={`
        w-64 border-2 transition-all duration-200 shadow-sm hover:shadow-md
        ${selected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
        ${nodeColors.borderClass}
        ${nodeColors.backgroundClass}
      `}
      style={{
        transform: selected ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {children}
    </Card>
  );
};
```

#### Trigger Node Design
```tsx
// Specialized trigger node with green color scheme
const TriggerNode: React.FC<NodeProps<WorkflowNodeData>> = memo(({ data, selected }) => {
  return (
    <BaseNodeWrapper nodeType="trigger" selected={selected}>
      <CardContent className="p-3">
        {/* Node header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-green-100 text-green-600">
              {getNodeIcon(data.label.toLowerCase().replace(/\s+/g, '_'))}
            </div>
            <span className="font-medium text-sm text-gray-900">{data.label}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            {getStatusIcon(data.executionStatus)}
            <Badge 
              variant="secondary" 
              className="text-xs bg-green-100 text-green-700 border-green-200"
            >
              Trigger
            </Badge>
          </div>
        </div>
        
        {/* Configuration preview */}
        {data.configuration && (
          <div className="text-xs text-gray-600 mb-2 p-2 bg-gray-50 rounded">
            {data.configuration.cronExpression && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Schedule: {data.configuration.cronExpression}</span>
              </div>
            )}
            {data.configuration.severity && (
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3" />
                <span>Severity: {data.configuration.severity.join(', ')}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Execution status */}
        {data.executionStatus && (
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">Status</span>
            <StatusBadge status={data.executionStatus} />
          </div>
        )}
        
        {/* Node actions */}
        <div className="flex justify-end mt-2">
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
      
      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-green-500 bg-white"
      />
    </BaseNodeWrapper>
  );
});
```

#### Action Node Design
```tsx
// Action node with blue color scheme and input/output handles
const ActionNode: React.FC<NodeProps<WorkflowNodeData>> = memo(({ data, selected }) => {
  return (
    <BaseNodeWrapper nodeType="action" selected={selected}>
      <CardContent className="p-3">
        {/* Node header with action icon */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-blue-100 text-blue-600">
              {getNodeIcon(data.label.toLowerCase().replace(/\s+/g, '_'))}
            </div>
            <span className="font-medium text-sm text-gray-900">{data.label}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            {getStatusIcon(data.executionStatus)}
            <Badge 
              variant="secondary" 
              className="text-xs bg-blue-100 text-blue-700 border-blue-200"
            >
              Action
            </Badge>
          </div>
        </div>
        
        {/* Action configuration preview */}
        {data.configuration && (
          <div className="text-xs text-gray-600 mb-2 space-y-1">
            {Object.entries(data.configuration).slice(0, 2).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                <span className="font-mono text-gray-800 truncate ml-2 max-w-24">
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Progress indicator for running actions */}
        {data.executionStatus === 'running' && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Executing...</span>
              <span>{data.executionData?.progress || 0}%</span>
            </div>
            <Progress 
              value={data.executionData?.progress || 0} 
              className="h-1"
            />
          </div>
        )}
      </CardContent>
      
      {/* Input/Output handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-blue-500 bg-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-blue-500 bg-white"
      />
    </BaseNodeWrapper>
  );
});
```

### 4. WorkflowConfigPanel Component

#### Configuration Panel Design
```tsx
// Right panel for node configuration
<div className="workflow-config-panel h-full bg-white border-l border-gray-200 overflow-hidden">
  {selectedNode ? (
    <>
      {/* Panel header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Configure Node
          </h2>
          <Button
            onClick={onClosePanel}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Node info summary */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
          <div 
            className="p-2 rounded"
            style={{
              backgroundColor: getNodeTypeColor(selectedNode.data.nodeType, 0.1),
              color: getNodeTypeColor(selectedNode.data.nodeType)
            }}
          >
            {getNodeIcon(selectedNode.data.label.toLowerCase().replace(/\s+/g, '_'))}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{selectedNode.data.label}</h3>
            <p className="text-sm text-gray-600 capitalize">{selectedNode.data.nodeType} Node</p>
          </div>
        </div>
      </div>
      
      {/* Configuration content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Basic configuration */}
          <div>
            <Label htmlFor="nodeLabel" className="text-sm font-medium">
              Node Label
            </Label>
            <Input
              id="nodeLabel"
              value={config.label || selectedNode.data.label}
              onChange={(e) => handleConfigChange('label', e.target.value)}
              className="mt-1"
            />
          </div>
          
          {/* Node-specific configuration */}
          {renderNodeSpecificConfig()}
          
          {/* Advanced settings */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded">
              <span className="text-sm font-medium">Advanced Settings</span>
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-2">
              <div>
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={config.timeout || 300}
                  onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="retryCount">Retry Count</Label>
                <Input
                  id="retryCount"
                  type="number"
                  value={config.retryCount || 0}
                  onChange={(e) => handleConfigChange('retryCount', parseInt(e.target.value))}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
      
      {/* Panel footer with actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            disabled={!hasChanges}
          >
            Reset
          </Button>
          
          <div className="flex space-x-2">
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              disabled={!hasChanges}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {hasChanges ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Apply Changes
                </>
              ) : (
                'No Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  ) : (
    /* Empty state when no node selected */
    <div className="h-full flex items-center justify-center text-center p-6">
      <div>
        <Settings className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Node Selected
        </h3>
        <p className="text-gray-600 max-w-sm">
          Select a workflow node from the canvas to configure its settings and properties.
        </p>
      </div>
    </div>
  )}
</div>
```

### 5. WorkflowExecutionMonitor Component

#### Execution Monitor Design
```tsx
// Real-time execution monitoring overlay
<div className="workflow-execution-monitor">
  {isExecuting && (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-96 bg-white shadow-xl border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Timer className="h-5 w-5 text-blue-600 animate-spin" />
              <CardTitle className="text-lg">Workflow Execution</CardTitle>
            </div>
            <Button
              onClick={() => setMinimized(!minimized)}
              variant="ghost"
              size="sm"
            >
              {minimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        
        {!minimized && (
          <CardContent className="space-y-4">
            {/* Overall progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-600">{executionProgress}%</span>
              </div>
              <Progress value={executionProgress} className="h-2" />
            </div>
            
            {/* Current step */}
            <div className="p-3 bg-blue-50 rounded">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-blue-900">
                  Current Step
                </span>
              </div>
              <p className="text-sm text-blue-800">{currentStepName}</p>
            </div>
            
            {/* Execution timeline */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-900">Execution Log</h4>
              {executionSteps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center space-x-3 p-2 rounded text-sm"
                  style={{
                    backgroundColor: getStepStatusColor(step.status, 0.1)
                  }}
                >
                  <div className="flex-shrink-0">
                    {getStepStatusIcon(step.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {step.duration ? `${step.duration}ms` : 'In progress...'}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTime(step.startedAt)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Execution controls */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <div className="flex space-x-2">
                <Button
                  onClick={handlePauseExecution}
                  variant="outline"
                  size="sm"
                  disabled={executionStatus !== 'running'}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
                <Button
                  onClick={handleCancelExecution}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Square className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
              
              <span className="text-xs text-gray-500">
                Started {formatTime(executionStartTime)}
              </span>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )}
</div>
```

## Animation and Interaction Patterns

### CSS Animations
```css
/* Workflow-specific animations */
@keyframes nodeGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
}

@keyframes edgeFlow {
  0% { stroke-dashoffset: 10; }
  100% { stroke-dashoffset: 0; }
}

@keyframes statusPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Apply animations to workflow elements */
.workflow-node.executing {
  animation: nodeGlow 2s infinite;
}

.workflow-edge.active {
  stroke-dasharray: 5;
  animation: edgeFlow 1s linear infinite;
}

.status-indicator.running {
  animation: statusPulse 1.5s ease-in-out infinite;
}
```

### Interaction States
```css
/* Hover effects for nodes */
.workflow-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease-in-out;
}

/* Selection states */
.workflow-node.selected {
  ring: 2px solid #6366f1;
  ring-offset: 2px;
  transform: scale(1.02);
}

/* Drag states */
.workflow-node.dragging {
  opacity: 0.8;
  transform: rotate(2deg);
  z-index: 1000;
}
```

## Accessibility Features

### Keyboard Navigation
```tsx
// Keyboard navigation for workflow builder
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Delete':
    case 'Backspace':
      if (selectedNode) {
        deleteNode(selectedNode.id);
      }
      break;
    case 'Escape':
      setSelectedNode(null);
      break;
    case 'Tab':
      // Navigate between nodes
      navigateToNextNode();
      break;
    case ' ':
      // Execute selected node
      if (selectedNode) {
        executeNode(selectedNode.id);
      }
      break;
  }
};
```

### ARIA Labels and Descriptions
```tsx
// Accessibility attributes for workflow elements
<div
  role="application"
  aria-label="Workflow Builder"
  aria-describedby="workflow-instructions"
>
  <div id="workflow-instructions" className="sr-only">
    Use arrow keys to navigate between workflow nodes. 
    Press Space to select a node, Delete to remove it.
  </div>
  
  {/* Workflow nodes with proper ARIA attributes */}
  <div
    role="button"
    tabIndex={0}
    aria-label={`${node.data.label} - ${node.data.nodeType} node`}
    aria-describedby={`node-${node.id}-description`}
    aria-selected={selectedNode?.id === node.id}
  >
    {/* Node content */}
  </div>
</div>
```

This comprehensive UI design specification provides all the visual details, component structures, styling approaches, and interaction patterns needed to recreate the workflow module interface with identical look, feel, and functionality in compatible environments.