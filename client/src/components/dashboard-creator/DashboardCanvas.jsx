import React, { useState, useRef } from "react";
import {
  Button,
  Icon,
} from "@/components/Component";
import {
  Card,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
} from "reactstrap";

const DashboardCanvas = ({ widgets, onWidgetsChange, gridSettings, onGridSettingsChange }) => {
  const canvasRef = useRef(null);
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Default grid settings
  const defaultGridSettings = {
    showGrid: true,
    gridSize: 20,
    snapToGrid: true,
    ...gridSettings
  };

  // Handle drop from metrics library
  const handleDrop = (e) => {
    e.preventDefault();
    
    try {
      const metricData = JSON.parse(e.dataTransfer.getData('application/json'));
      const canvasRect = canvasRef.current.getBoundingClientRect();
      
      // Calculate position relative to canvas
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;
      
      // Snap to grid if enabled
      const finalX = defaultGridSettings.snapToGrid 
        ? Math.round(x / defaultGridSettings.gridSize) * defaultGridSettings.gridSize
        : x;
      const finalY = defaultGridSettings.snapToGrid 
        ? Math.round(y / defaultGridSettings.gridSize) * defaultGridSettings.gridSize
        : y;

      // Create new widget
      const newWidget = {
        id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metricId: metricData.id,
        metricName: metricData.name,
        metricType: metricData.type,
        metricCategory: metricData.category,
        metricData: metricData,
        x: Math.max(0, finalX),
        y: Math.max(0, finalY),
        width: getDefaultWidgetWidth(metricData.type),
        height: getDefaultWidgetHeight(metricData.type),
        config: {}
      };

      // Add widget to canvas
      const updatedWidgets = [...widgets, newWidget];
      onWidgetsChange(updatedWidgets);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Get default widget dimensions based on type
  const getDefaultWidgetWidth = (type) => {
    const widths = {
      counter: 200,
      gauge: 250,
      percentage: 200,
      trend: 400,
      ratio: 300,
      status: 200
    };
    return widths[type] || 250;
  };

  const getDefaultWidgetHeight = (type) => {
    const heights = {
      counter: 120,
      gauge: 200,
      percentage: 120,
      trend: 240,
      ratio: 240,
      status: 120
    };
    return heights[type] || 150;
  };

  // Handle widget drag start
  const handleWidgetDragStart = (e, widget) => {
    setDraggedWidget(widget);
    const rect = e.target.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle widget drag end
  const handleWidgetDragEnd = (e) => {
    if (!draggedWidget) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - dragOffset.x;
    const y = e.clientY - canvasRect.top - dragOffset.y;

    // Snap to grid if enabled
    const finalX = defaultGridSettings.snapToGrid 
      ? Math.round(x / defaultGridSettings.gridSize) * defaultGridSettings.gridSize
      : x;
    const finalY = defaultGridSettings.snapToGrid 
      ? Math.round(y / defaultGridSettings.gridSize) * defaultGridSettings.gridSize
      : y;

    // Update widget position
    const updatedWidgets = widgets.map(w => 
      w.id === draggedWidget.id 
        ? { ...w, x: Math.max(0, finalX), y: Math.max(0, finalY) }
        : w
    );

    onWidgetsChange(updatedWidgets);
    setDraggedWidget(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // Remove widget
  const removeWidget = (widgetId) => {
    const updatedWidgets = widgets.filter(w => w.id !== widgetId);
    onWidgetsChange(updatedWidgets);
  };

  // Toggle grid visibility
  const toggleGrid = () => {
    onGridSettingsChange({
      ...defaultGridSettings,
      showGrid: !defaultGridSettings.showGrid
    });
  };

  // Change grid size
  const changeGridSize = (size) => {
    onGridSettingsChange({
      ...defaultGridSettings,
      gridSize: size
    });
  };

  // Toggle snap to grid
  const toggleSnapToGrid = () => {
    onGridSettingsChange({
      ...defaultGridSettings,
      snapToGrid: !defaultGridSettings.snapToGrid
    });
  };

  // Clear all widgets
  const clearAllWidgets = () => {
    if (window.confirm('Are you sure you want to remove all widgets?')) {
      onWidgetsChange([]);
    }
  };

  // Render widget
  const renderWidget = (widget) => {
    const { metricData } = widget;
    
    // Get widget color
    const getWidgetColor = () => {
      if (metricData.metadata && metricData.metadata.color) {
        return metricData.metadata.color;
      }
      
      const categoryColors = {
        systems: '#3b82f6',
        assets: '#f59e0b',
        vulnerabilities: '#ef4444',
        security: '#10b981',
        performance: '#8b5cf6',
        compliance: '#06b6d4',
        operational: '#f97316',
        financial: '#ec4899'
      };
      
      return categoryColors[metricData.category] || '#6b7280';
    };

    // Get widget icon
    const getWidgetIcon = () => {
      if (metricData.metadata && metricData.metadata.icon) {
        return metricData.metadata.icon;
      }
      
      const typeIcons = {
        counter: 'hash',
        gauge: 'speedometer',
        percentage: 'percent',
        trend: 'trending-up',
        ratio: 'pie-chart',
        status: 'check-circle'
      };
      
      return typeIcons[metricData.type] || 'activity';
    };

    // Format value
    const formatValue = () => {
      if (metricData.unit === 'percentage') {
        return `${metricData.value}%`;
      }
      if (metricData.unit === 'currency') {
        return `$${metricData.value.toLocaleString()}`;
      }
      return metricData.value.toLocaleString();
    };

    return (
      <div
        key={widget.id}
        className="dashboard-widget"
        draggable
        onDragStart={(e) => handleWidgetDragStart(e, widget)}
        onDragEnd={handleWidgetDragEnd}
        style={{
          position: 'absolute',
          left: widget.x,
          top: widget.y,
          width: widget.width,
          height: widget.height,
          cursor: 'move',
          zIndex: draggedWidget?.id === widget.id ? 1000 : 1
        }}
      >
        <Card className="card-bordered h-100">
          <div className="card-inner h-100 d-flex flex-column">
            {/* Widget Header */}
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="d-flex align-items-center">
                <div 
                  className="widget-icon me-2"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    backgroundColor: getWidgetColor(),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px'
                  }}
                >
                  <Icon name={getWidgetIcon()} />
                </div>
                <h6 className="widget-title mb-0" style={{ fontSize: '12px' }}>
                  {metricData.name}
                </h6>
              </div>
              <UncontrolledDropdown>
                <DropdownToggle tag="a" className="dropdown-toggle btn btn-icon btn-trigger btn-sm">
                  <Icon name="more-h" />
                </DropdownToggle>
                <DropdownMenu end>
                  <ul className="link-list-opt no-bdr">
                    <li>
                      <DropdownItem
                        tag="a"
                        href="#"
                        onClick={(ev) => {
                          ev.preventDefault();
                          // TODO: Open widget configuration modal
                        }}
                      >
                        <Icon name="edit" />
                        <span>Configure</span>
                      </DropdownItem>
                    </li>
                    <li>
                      <DropdownItem
                        tag="a"
                        href="#"
                        onClick={(ev) => {
                          ev.preventDefault();
                          removeWidget(widget.id);
                        }}
                      >
                        <Icon name="trash" />
                        <span>Remove</span>
                      </DropdownItem>
                    </li>
                  </ul>
                </DropdownMenu>
              </UncontrolledDropdown>
            </div>

            {/* Widget Content */}
            <div className="flex-grow-1 d-flex align-items-center justify-content-center">
              <div className="text-center">
                <div className="widget-value" style={{ fontSize: '24px', fontWeight: '700', color: getWidgetColor() }}>
                  {formatValue()}
                </div>
                {metricData.unit && metricData.unit !== 'percentage' && metricData.unit !== 'currency' && (
                  <div className="widget-unit text-soft" style={{ fontSize: '11px' }}>
                    {metricData.unit}
                  </div>
                )}
              </div>
            </div>

            {/* Widget Footer */}
            <div className="widget-footer">
              <small className="text-soft">{metricData.category}</small>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="dashboard-canvas-container">
      {/* Canvas Header */}
      <div className="canvas-header mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1">Dashboard Canvas</h6>
            <p className="text-soft mb-0">Drag metrics from the sidebar to create widgets</p>
          </div>
          <div className="canvas-controls">
            <Button 
              color="light" 
              size="sm" 
              className="me-2"
              onClick={toggleGrid}
            >
              <Icon name="grid-alt" />
              <span>{defaultGridSettings.showGrid ? 'Hide' : 'Show'} Grid</span>
            </Button>
            
            <UncontrolledDropdown className="me-2">
              <DropdownToggle tag="a" className="dropdown-toggle btn btn-light btn-sm">
                <Icon name="settings" />
                <span>Grid: {defaultGridSettings.gridSize}px</span>
              </DropdownToggle>
              <DropdownMenu>
                <ul className="link-list-opt no-bdr">
                  {[10, 20, 30].map(size => (
                    <li key={size}>
                      <DropdownItem
                        tag="a"
                        href="#"
                        onClick={(ev) => {
                          ev.preventDefault();
                          changeGridSize(size);
                        }}
                      >
                        <span>{size}px Grid</span>
                      </DropdownItem>
                    </li>
                  ))}
                </ul>
              </DropdownMenu>
            </UncontrolledDropdown>

            <Button 
              color="light" 
              size="sm" 
              className="me-2"
              onClick={toggleSnapToGrid}
            >
              <Icon name={defaultGridSettings.snapToGrid ? 'check-square' : 'square'} />
              <span>Snap to Grid</span>
            </Button>

            {widgets.length > 0 && (
              <Button 
                color="danger" 
                size="sm"
                outline
                onClick={clearAllWidgets}
              >
                <Icon name="trash" />
                <span>Clear All</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="dashboard-canvas"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          position: 'relative',
          minHeight: '600px',
          border: '2px dashed #e5e7eb',
          borderRadius: '8px',
          backgroundColor: '#fafafa',
          backgroundImage: defaultGridSettings.showGrid 
            ? `radial-gradient(circle, #d1d5db 1px, transparent 1px)`
            : 'none',
          backgroundSize: defaultGridSettings.showGrid 
            ? `${defaultGridSettings.gridSize}px ${defaultGridSettings.gridSize}px`
            : 'auto'
        }}
      >
        {/* Empty State */}
        {widgets.length === 0 && (
          <div className="canvas-empty-state">
            <div 
              className="d-flex flex-column align-items-center justify-content-center h-100"
              style={{ minHeight: '400px' }}
            >
              <Icon name="dashboard" className="text-soft" style={{ fontSize: '4rem' }} />
              <h5 className="mt-3 text-soft">Start Building Your Dashboard</h5>
              <p className="text-soft text-center">
                Drag metrics from the sidebar to create widgets.<br />
                You can rearrange and resize widgets as needed.
              </p>
            </div>
          </div>
        )}

        {/* Render Widgets */}
        {widgets.map(renderWidget)}
      </div>

      {/* Canvas Footer */}
      <div className="canvas-footer mt-3">
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-soft">
            {widgets.length} widget{widgets.length !== 1 ? 's' : ''} added
          </small>
          <small className="text-soft">
            Grid: {defaultGridSettings.gridSize}px | 
            Snap: {defaultGridSettings.snapToGrid ? 'On' : 'Off'} | 
            Grid: {defaultGridSettings.showGrid ? 'Visible' : 'Hidden'}
          </small>
        </div>
      </div>
    </div>
  );
};

export default DashboardCanvas;
