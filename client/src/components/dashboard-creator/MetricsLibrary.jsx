import React, { useState, useEffect } from "react";
import {
  Icon,
  Button,
} from "@/components/Component";
import {
  Card,
  Badge,
  Input,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
} from "reactstrap";

const MetricsLibrary = ({ onMetricSelect }) => {
  const [metrics, setMetrics] = useState([]);
  const [filteredMetrics, setFilteredMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Category options
  const categories = [
    { value: 'all', label: 'All Categories', icon: 'grid-alt' },
    { value: 'systems', label: 'Systems', icon: 'server' },
    { value: 'assets', label: 'Assets', icon: 'package' },
    { value: 'vulnerabilities', label: 'Vulnerabilities', icon: 'shield-exclamation' },
    { value: 'security', label: 'Security', icon: 'shield-check' },
    { value: 'performance', label: 'Performance', icon: 'speedometer' },
    { value: 'compliance', label: 'Compliance', icon: 'check-square' },
    { value: 'operational', label: 'Operational', icon: 'activity' },
    { value: 'financial', label: 'Financial', icon: 'coins' }
  ];

  // Fetch metrics from API
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/v1/metrics/dashboard-creator', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMetrics(data.data.metrics || []);
          setFilteredMetrics(data.data.metrics || []);
        } else {
          console.error('Failed to fetch metrics');
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  // Filter metrics based on search and category
  useEffect(() => {
    let filtered = metrics;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(metric => metric.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(metric =>
        metric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (metric.description && metric.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredMetrics(filtered);
  }, [metrics, searchTerm, selectedCategory]);

  // Get metric icon from metadata or default
  const getMetricIcon = (metric) => {
    if (metric.metadata && metric.metadata.icon) {
      return metric.metadata.icon;
    }
    
    // Default icons based on type
    const typeIcons = {
      counter: 'hash',
      gauge: 'speedometer',
      percentage: 'percent',
      trend: 'trending-up',
      ratio: 'pie-chart',
      status: 'check-circle'
    };
    
    return typeIcons[metric.type] || 'activity';
  };

  // Get metric color from metadata or default
  const getMetricColor = (metric) => {
    if (metric.metadata && metric.metadata.color) {
      return metric.metadata.color;
    }
    
    // Default colors based on category
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
    
    return categoryColors[metric.category] || '#6b7280';
  };

  // Handle metric drag start
  const handleDragStart = (e, metric) => {
    e.dataTransfer.setData('application/json', JSON.stringify(metric));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Handle metric click (alternative to drag)
  const handleMetricClick = (metric) => {
    if (onMetricSelect) {
      onMetricSelect(metric);
    }
  };

  // Format metric value
  const formatMetricValue = (metric) => {
    if (metric.unit === 'percentage') {
      return `${metric.value}%`;
    }
    if (metric.unit === 'currency') {
      return `$${metric.value.toLocaleString()}`;
    }
    return metric.value.toLocaleString();
  };

  if (loading) {
    return (
      <Card className="card-bordered h-100">
        <div className="card-inner text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading metrics...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-bordered h-100">
      <div className="card-inner-group">
        {/* Header */}
        <div className="card-inner">
          <div className="card-title-group">
            <div className="card-title">
              <h6 className="title">Metrics Library</h6>
              <p className="text-soft">Drag metrics to your dashboard</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="card-inner border-top">
          <div className="form-group">
            <div className="form-control-wrap">
              <div className="form-icon form-icon-left">
                <Icon name="search" />
              </div>
              <Input
                type="text"
                className="form-control-outlined form-control-sm"
                placeholder="Search metrics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <UncontrolledDropdown>
              <DropdownToggle 
                tag="a" 
                className="dropdown-toggle btn btn-outline-light btn-sm"
              >
                <Icon name={categories.find(c => c.value === selectedCategory)?.icon || 'grid-alt'} />
                <span>{categories.find(c => c.value === selectedCategory)?.label || 'All Categories'}</span>
                <Icon name="chevron-down" />
              </DropdownToggle>
              <DropdownMenu>
                <ul className="link-list-opt no-bdr">
                  {categories.map((category) => (
                    <li key={category.value}>
                      <DropdownItem
                        tag="a"
                        href="#"
                        onClick={(ev) => {
                          ev.preventDefault();
                          setSelectedCategory(category.value);
                        }}
                      >
                        <Icon name={category.icon} />
                        <span>{category.label}</span>
                      </DropdownItem>
                    </li>
                  ))}
                </ul>
              </DropdownMenu>
            </UncontrolledDropdown>
          </div>
        </div>

        {/* Metrics List */}
        <div className="card-inner border-top" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {filteredMetrics.length === 0 ? (
            <div className="text-center py-4">
              <Icon name="inbox" className="text-soft" style={{ fontSize: '2rem' }} />
              <p className="text-soft mt-2">No metrics found</p>
            </div>
          ) : (
            <div className="metrics-list">
              {filteredMetrics.map((metric) => (
                <div
                  key={metric.id}
                  className="metric-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, metric)}
                  onClick={() => handleMetricClick(metric)}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'grab',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#fff'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = getMetricColor(metric);
                    e.target.style.boxShadow = `0 2px 8px rgba(0,0,0,0.1)`;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <div className="d-flex align-items-start">
                    <div 
                      className="metric-icon me-3"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: getMetricColor(metric),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    >
                      <Icon name={getMetricIcon(metric)} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="metric-name mb-1" style={{ fontSize: '13px', fontWeight: '600' }}>
                            {metric.name}
                          </h6>
                          {metric.description && (
                            <p className="metric-description text-soft mb-2" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                              {metric.description.length > 60 
                                ? `${metric.description.substring(0, 60)}...` 
                                : metric.description
                              }
                            </p>
                          )}
                        </div>
                        <Badge 
                          color="light" 
                          className="text-uppercase"
                          style={{ fontSize: '9px' }}
                        >
                          {metric.type}
                        </Badge>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="metric-value" style={{ fontSize: '12px', fontWeight: '600' }}>
                          {formatMetricValue(metric)}
                          {metric.unit && metric.unit !== 'percentage' && metric.unit !== 'currency' && (
                            <span className="text-soft ms-1">{metric.unit}</span>
                          )}
                        </div>
                        <Badge 
                          color="primary" 
                          className="badge-dim"
                          style={{ fontSize: '9px' }}
                        >
                          {metric.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="card-inner border-top">
          <div className="text-center">
            <small className="text-soft">
              {filteredMetrics.length} of {metrics.length} metrics
            </small>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MetricsLibrary;
