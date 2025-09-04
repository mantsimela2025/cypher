/**
 * Control Implementation Card Component
 * Individual card for tracking security control implementation progress
 * Provides detailed status, tasks, and management for each control
 */

import React, { useState } from "react";
import {
  PreviewCard,
  Button,
  Icon,
  Row,
  Col,
} from "@/components/Component";

const ControlImplementationCard = ({ 
  control,
  onStatusChange = () => {},
  onTaskAdd = () => {},
  onTaskUpdate = () => {},
  className = ""
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Mock implementation data (would come from API in real implementation)
  const [implementationData, setImplementationData] = useState({
    status: 'not_started', // not_started, in_progress, completed, verified
    progress: 0,
    assignee: null,
    dueDate: null,
    startDate: null,
    completedDate: null,
    tasks: [
      { id: 1, title: 'Review control requirements', completed: false, assignee: 'John Doe' },
      { id: 2, title: 'Develop implementation plan', completed: false, assignee: null },
      { id: 3, title: 'Configure system settings', completed: false, assignee: null },
      { id: 4, title: 'Test and validate', completed: false, assignee: null }
    ],
    notes: '',
    evidence: [],
    dependencies: []
  });

  /**
   * Get status color and icon
   */
  const getStatusInfo = (status) => {
    switch (status) {
      case 'not_started':
        return { color: 'secondary', icon: 'clock', text: 'Not Started' };
      case 'in_progress':
        return { color: 'warning', icon: 'play', text: 'In Progress' };
      case 'completed':
        return { color: 'success', icon: 'check-circle', text: 'Completed' };
      case 'verified':
        return { color: 'primary', icon: 'shield-check', text: 'Verified' };
      default:
        return { color: 'secondary', icon: 'clock', text: 'Unknown' };
    }
  };

  /**
   * Get priority color
   */
  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'secondary';
    }
  };

  /**
   * Calculate progress percentage
   */
  const calculateProgress = () => {
    if (!implementationData.tasks.length) return 0;
    const completed = implementationData.tasks.filter(task => task.completed).length;
    return Math.round((completed / implementationData.tasks.length) * 100);
  };

  /**
   * Handle status change
   */
  const handleStatusChange = (newStatus) => {
    setImplementationData(prev => ({
      ...prev,
      status: newStatus,
      progress: calculateProgress()
    }));
    onStatusChange(control.id, newStatus);
  };

  /**
   * Handle task completion toggle
   */
  const handleTaskToggle = (taskId) => {
    setImplementationData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  /**
   * Add new task
   */
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      completed: false,
      assignee: null
    };

    setImplementationData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));

    setNewTaskTitle('');
    setShowTaskForm(false);
    onTaskAdd(control.id, newTask);
  };

  const statusInfo = getStatusInfo(implementationData.status);
  const progress = calculateProgress();

  return (
    <div className={`control-implementation-card ${className}`}>
      <PreviewCard>
        <div className="card-inner">
          {/* Card Header */}
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="flex-grow-1">
              <div className="d-flex align-items-center mb-2">
                <h6 className="mb-0 me-3">{control.id} - {control.name}</h6>
                <span className={`badge bg-${getPriorityColor(control.priority)}`}>
                  {control.priority}
                </span>
              </div>
              <div className="text-soft small mb-2">{control.family} Family</div>
              
              {/* Status and Progress */}
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center">
                  <Icon name={statusInfo.icon} className={`text-${statusInfo.color} me-1`}></Icon>
                  <span className={`badge bg-${statusInfo.color}`}>{statusInfo.text}</span>
                </div>
                <div className="d-flex align-items-center">
                  <span className="small text-soft me-2">Progress:</span>
                  <div className="progress" style={{ width: '100px', height: '6px' }}>
                    <div 
                      className="progress-bar bg-primary" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className="small text-soft ms-2">{progress}%</span>
                </div>
              </div>
            </div>
            
            <div className="d-flex gap-2">
              <Button 
                color="outline-primary" 
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                <Icon name={expanded ? "chevron-up" : "chevron-down"}></Icon>
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="d-flex gap-2 mb-3">
            <Button 
              color={implementationData.status === 'in_progress' ? 'warning' : 'outline-warning'}
              size="sm"
              onClick={() => handleStatusChange('in_progress')}
            >
              <Icon name="play" className="me-1"></Icon>
              Start
            </Button>
            <Button 
              color={implementationData.status === 'completed' ? 'success' : 'outline-success'}
              size="sm"
              onClick={() => handleStatusChange('completed')}
              disabled={implementationData.status === 'not_started'}
            >
              <Icon name="check" className="me-1"></Icon>
              Complete
            </Button>
            <Button 
              color="outline-info"
              size="sm"
              onClick={() => alert(`AI guidance for ${control.id} would open here`)}
            >
              <Icon name="cpu" className="me-1"></Icon>
              AI Help
            </Button>
          </div>

          {/* Expanded Details */}
          {expanded && (
            <div className="border-top pt-3">
              <Row className="g-4">
                {/* Tasks */}
                <Col md="6">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Implementation Tasks</h6>
                    <Button 
                      color="outline-primary" 
                      size="sm"
                      onClick={() => setShowTaskForm(!showTaskForm)}
                    >
                      <Icon name="plus" className="me-1"></Icon>
                      Add Task
                    </Button>
                  </div>

                  {/* Add Task Form */}
                  {showTaskForm && (
                    <div className="mb-3 p-3 bg-light rounded">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter task title..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                        <Button color="primary" onClick={handleAddTask}>
                          Add
                        </Button>
                        <Button 
                          color="outline-secondary" 
                          onClick={() => setShowTaskForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Task List */}
                  <div className="task-list">
                    {implementationData.tasks.map((task, index) => (
                      <div key={task.id} className="d-flex align-items-center mb-2 p-2 border rounded">
                        <input
                          type="checkbox"
                          className="form-check-input me-2"
                          checked={task.completed}
                          onChange={() => handleTaskToggle(task.id)}
                        />
                        <div className="flex-grow-1">
                          <div className={`small ${task.completed ? 'text-decoration-line-through text-muted' : ''}`}>
                            {task.title}
                          </div>
                          {task.assignee && (
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              Assigned to: {task.assignee}
                            </div>
                          )}
                        </div>
                        <Button color="outline-secondary" size="sm">
                          <Icon name="edit"></Icon>
                        </Button>
                      </div>
                    ))}
                  </div>
                </Col>

                {/* Details and Metadata */}
                <Col md="6">
                  <h6 className="mb-3">Implementation Details</h6>
                  
                  <div className="mb-3">
                    <label className="form-label small">Assignee</label>
                    <select className="form-select form-select-sm">
                      <option value="">Select assignee...</option>
                      <option value="john">John Doe</option>
                      <option value="jane">Jane Smith</option>
                      <option value="mike">Mike Johnson</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small">Due Date</label>
                    <input type="date" className="form-control form-control-sm" />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small">Implementation Notes</label>
                    <textarea 
                      className="form-control form-control-sm" 
                      rows="3"
                      placeholder="Add implementation notes, configurations, or observations..."
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small">Evidence & Documentation</label>
                    <div className="d-grid gap-2">
                      <Button color="outline-secondary" size="sm">
                        <Icon name="upload" className="me-1"></Icon>
                        Upload Evidence
                      </Button>
                      <Button color="outline-info" size="sm">
                        <Icon name="link" className="me-1"></Icon>
                        Add Reference Link
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </div>
      </PreviewCard>
    </div>
  );
};

export default ControlImplementationCard;
