/**
 * Control Implementation Manager Component
 * Manages multiple control implementation cards with filtering, sorting, and bulk actions
 */

import React, { useState, useMemo } from "react";
import {
  Block,
  PreviewCard,
  Button,
  Icon,
  Row,
  Col,
} from "@/components/Component";
import ControlImplementationCard from "./ControlImplementationCard";

const ControlImplementationManager = ({ 
  controls = [],
  onControlUpdate = () => {},
  onBulkAction = () => {},
  className = ""
}) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [viewMode, setViewMode] = useState('cards'); // cards, list, kanban
  const [selectedControls, setSelectedControls] = useState([]);

  /**
   * Filter and sort controls
   */
  const filteredAndSortedControls = useMemo(() => {
    let filtered = [...controls];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(control => 
        control.implementationStatus === filterStatus
      );
    }

    // Apply priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(control => 
        control.priority?.toLowerCase() === filterPriority
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'id':
          return a.id.localeCompare(b.id);
        case 'family':
          return a.family.localeCompare(b.family);
        case 'status':
          return (a.implementationStatus || 'not_started').localeCompare(b.implementationStatus || 'not_started');
        default:
          return 0;
      }
    });

    return filtered;
  }, [controls, filterStatus, filterPriority, sortBy]);

  /**
   * Get status counts for filter badges
   */
  const getStatusCounts = () => {
    const counts = {
      all: controls.length,
      not_started: 0,
      in_progress: 0,
      completed: 0,
      verified: 0
    };

    controls.forEach(control => {
      const status = control.implementationStatus || 'not_started';
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    return counts;
  };

  /**
   * Handle control selection for bulk actions
   */
  const handleControlSelection = (controlId, selected) => {
    if (selected) {
      setSelectedControls(prev => [...prev, controlId]);
    } else {
      setSelectedControls(prev => prev.filter(id => id !== controlId));
    }
  };

  /**
   * Handle bulk actions
   */
  const handleBulkAction = (action) => {
    if (selectedControls.length === 0) {
      alert('Please select controls first');
      return;
    }

    switch (action) {
      case 'start':
        onBulkAction('start', selectedControls);
        break;
      case 'complete':
        onBulkAction('complete', selectedControls);
        break;
      case 'assign':
        const assignee = prompt('Enter assignee name:');
        if (assignee) {
          onBulkAction('assign', selectedControls, { assignee });
        }
        break;
      case 'set_due_date':
        const dueDate = prompt('Enter due date (YYYY-MM-DD):');
        if (dueDate) {
          onBulkAction('set_due_date', selectedControls, { dueDate });
        }
        break;
      default:
        break;
    }

    setSelectedControls([]);
  };

  const statusCounts = getStatusCounts();

  return (
    <div className={`control-implementation-manager ${className}`}>
      {/* Manager Header */}
      <PreviewCard>
        <div className="card-inner">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6>Control Implementation Manager</h6>
              <p className="text-soft mb-0">
                Manage and track implementation progress for all selected security controls
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button 
                color={viewMode === 'cards' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <Icon name="grid"></Icon>
              </Button>
              <Button 
                color={viewMode === 'list' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <Icon name="list"></Icon>
              </Button>
            </div>
          </div>

          {/* Filters and Actions */}
          <Row className="g-3 mb-4">
            <Col md="3">
              <label className="form-label small">Filter by Status</label>
              <select 
                className="form-select form-select-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status ({statusCounts.all})</option>
                <option value="not_started">Not Started ({statusCounts.not_started})</option>
                <option value="in_progress">In Progress ({statusCounts.in_progress})</option>
                <option value="completed">Completed ({statusCounts.completed})</option>
                <option value="verified">Verified ({statusCounts.verified})</option>
              </select>
            </Col>
            <Col md="3">
              <label className="form-label small">Filter by Priority</label>
              <select 
                className="form-select form-select-sm"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </Col>
            <Col md="3">
              <label className="form-label small">Sort by</label>
              <select 
                className="form-select form-select-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="priority">Priority</option>
                <option value="id">Control ID</option>
                <option value="family">Control Family</option>
                <option value="status">Status</option>
              </select>
            </Col>
            <Col md="3">
              <label className="form-label small">Bulk Actions</label>
              <div className="dropdown">
                <Button 
                  color="outline-primary" 
                  size="sm" 
                  className="dropdown-toggle w-100"
                  disabled={selectedControls.length === 0}
                  data-bs-toggle="dropdown"
                >
                  Actions ({selectedControls.length})
                </Button>
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => handleBulkAction('start')}>
                    <Icon name="play" className="me-2"></Icon>Start Selected
                  </button>
                  <button className="dropdown-item" onClick={() => handleBulkAction('complete')}>
                    <Icon name="check" className="me-2"></Icon>Mark Complete
                  </button>
                  <button className="dropdown-item" onClick={() => handleBulkAction('assign')}>
                    <Icon name="user" className="me-2"></Icon>Assign To...
                  </button>
                  <button className="dropdown-item" onClick={() => handleBulkAction('set_due_date')}>
                    <Icon name="calendar" className="me-2"></Icon>Set Due Date
                  </button>
                </div>
              </div>
            </Col>
          </Row>

          {/* Status Overview */}
          <Row className="g-3 mb-4">
            <Col md="3">
              <div className="text-center p-3 bg-light rounded">
                <div className="h4 text-secondary mb-1">{statusCounts.not_started}</div>
                <div className="small text-soft">Not Started</div>
              </div>
            </Col>
            <Col md="3">
              <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                <div className="h4 text-warning mb-1">{statusCounts.in_progress}</div>
                <div className="small text-soft">In Progress</div>
              </div>
            </Col>
            <Col md="3">
              <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                <div className="h4 text-success mb-1">{statusCounts.completed}</div>
                <div className="small text-soft">Completed</div>
              </div>
            </Col>
            <Col md="3">
              <div className="text-center p-3 bg-primary bg-opacity-10 rounded">
                <div className="h4 text-primary mb-1">{statusCounts.verified}</div>
                <div className="small text-soft">Verified</div>
              </div>
            </Col>
          </Row>
        </div>
      </PreviewCard>

      {/* Control Cards */}
      <Block>
        {filteredAndSortedControls.length === 0 ? (
          <PreviewCard>
            <div className="card-inner text-center py-5">
              <Icon name="shield-off" className="text-soft" style={{ fontSize: '3rem' }}></Icon>
              <h6 className="mt-3 text-soft">No Controls Found</h6>
              <p className="text-soft">
                No controls match the current filter criteria. Try adjusting your filters.
              </p>
            </div>
          </PreviewCard>
        ) : (
          <div className="control-cards-container">
            {viewMode === 'cards' ? (
              <Row className="g-4">
                {filteredAndSortedControls.map((control, index) => (
                  <Col key={control.id} lg="6" xl="4">
                    <div className="position-relative">
                      <input
                        type="checkbox"
                        className="form-check-input position-absolute"
                        style={{ top: '10px', left: '10px', zIndex: 10 }}
                        checked={selectedControls.includes(control.id)}
                        onChange={(e) => handleControlSelection(control.id, e.target.checked)}
                      />
                      <ControlImplementationCard
                        control={control}
                        onStatusChange={(controlId, status) => {
                          onControlUpdate(controlId, { implementationStatus: status });
                        }}
                        onTaskAdd={(controlId, task) => {
                          console.log('Task added to', controlId, task);
                        }}
                        onTaskUpdate={(controlId, taskId, updates) => {
                          console.log('Task updated', controlId, taskId, updates);
                        }}
                      />
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              // List view would go here
              <div className="alert alert-info">
                <Icon name="info" className="me-2"></Icon>
                List view coming soon! Currently showing card view.
              </div>
            )}
          </div>
        )}
      </Block>
    </div>
  );
};

export default ControlImplementationManager;
