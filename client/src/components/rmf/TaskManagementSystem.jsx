/**
 * Task Management System Component
 * Comprehensive task tracking and management for RMF implementation
 * Provides Kanban board, task creation, assignment, and progress tracking
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

const TaskManagementSystem = ({ 
  controls = [],
  onTaskCreate = () => {},
  onTaskUpdate = () => {},
  onTaskDelete = () => {},
  className = ""
}) => {
  const [viewMode, setViewMode] = useState('kanban'); // kanban, list, calendar
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Sample tasks data (would come from API in real implementation)
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Develop Access Control Policy Document',
      description: 'Create comprehensive access control policy document for AC-1 implementation',
      controlId: 'AC-1',
      status: 'todo',
      priority: 'HIGH',
      assignee: 'John Doe',
      dueDate: '2024-01-15',
      createdDate: '2024-01-01',
      estimatedHours: 16,
      actualHours: 0,
      tags: ['policy', 'documentation'],
      dependencies: [],
      subtasks: [
        { id: 101, title: 'Research organizational requirements', completed: true },
        { id: 102, title: 'Draft policy framework', completed: false },
        { id: 103, title: 'Review with stakeholders', completed: false }
      ]
    },
    {
      id: 2,
      title: 'Configure Account Management System',
      description: 'Set up automated account management system for AC-2 control',
      controlId: 'AC-2',
      status: 'in_progress',
      priority: 'HIGH',
      assignee: 'Jane Smith',
      dueDate: '2024-01-20',
      createdDate: '2024-01-02',
      estimatedHours: 24,
      actualHours: 8,
      tags: ['configuration', 'automation'],
      dependencies: [1],
      subtasks: [
        { id: 201, title: 'Install account management software', completed: true },
        { id: 202, title: 'Configure user roles and permissions', completed: true },
        { id: 203, title: 'Set up automated provisioning', completed: false },
        { id: 204, title: 'Test account lifecycle processes', completed: false }
      ]
    },
    {
      id: 3,
      title: 'Deploy Network Firewalls',
      description: 'Deploy and configure network firewalls for SC-7 boundary protection',
      controlId: 'SC-7',
      status: 'todo',
      priority: 'HIGH',
      assignee: 'Mike Johnson',
      dueDate: '2024-01-25',
      createdDate: '2024-01-03',
      estimatedHours: 32,
      actualHours: 0,
      tags: ['network', 'security', 'infrastructure'],
      dependencies: [],
      subtasks: []
    },
    {
      id: 4,
      title: 'Implement Audit Logging',
      description: 'Set up comprehensive audit logging system for AU-2',
      controlId: 'AU-2',
      status: 'completed',
      priority: 'MEDIUM',
      assignee: 'Sarah Wilson',
      dueDate: '2024-01-10',
      createdDate: '2023-12-20',
      estimatedHours: 20,
      actualHours: 18,
      tags: ['logging', 'monitoring'],
      dependencies: [],
      subtasks: [
        { id: 401, title: 'Configure log collection', completed: true },
        { id: 402, title: 'Set up log analysis', completed: true },
        { id: 403, title: 'Create audit reports', completed: true }
      ]
    },
    {
      id: 5,
      title: 'Document Baseline Configuration',
      description: 'Create and maintain baseline configuration documentation for CM-2',
      controlId: 'CM-2',
      status: 'review',
      priority: 'MEDIUM',
      assignee: 'John Doe',
      dueDate: '2024-01-18',
      createdDate: '2024-01-05',
      estimatedHours: 12,
      actualHours: 10,
      tags: ['documentation', 'configuration'],
      dependencies: [2],
      subtasks: []
    }
  ]);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    controlId: '',
    priority: 'MEDIUM',
    assignee: '',
    dueDate: '',
    estimatedHours: 8,
    tags: []
  });

  // Task status columns for Kanban board
  const statusColumns = [
    { id: 'todo', title: 'To Do', color: 'secondary' },
    { id: 'in_progress', title: 'In Progress', color: 'warning' },
    { id: 'review', title: 'Review', color: 'info' },
    { id: 'completed', title: 'Completed', color: 'success' }
  ];

  // Team members for assignment
  const teamMembers = [
    'John Doe',
    'Jane Smith', 
    'Mike Johnson',
    'Sarah Wilson',
    'David Brown'
  ];

  /**
   * Filter tasks based on current filters
   */
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterAssignee !== 'all' && task.assignee !== filterAssignee) return false;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      return true;
    });
  }, [tasks, filterAssignee, filterPriority]);

  /**
   * Group tasks by status for Kanban view
   */
  const tasksByStatus = useMemo(() => {
    const grouped = {};
    statusColumns.forEach(column => {
      grouped[column.id] = filteredTasks.filter(task => task.status === column.id);
    });
    return grouped;
  }, [filteredTasks, statusColumns]);

  /**
   * Get priority color
   */
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'success';
      default: return 'secondary';
    }
  };

  /**
   * Handle task creation
   */
  const handleCreateTask = () => {
    if (!newTask.title.trim()) return;

    const task = {
      ...newTask,
      id: Date.now(),
      status: 'todo',
      createdDate: new Date().toISOString().split('T')[0],
      actualHours: 0,
      subtasks: [],
      dependencies: []
    };

    setTasks(prev => [...prev, task]);
    setNewTask({
      title: '',
      description: '',
      controlId: '',
      priority: 'MEDIUM',
      assignee: '',
      dueDate: '',
      estimatedHours: 8,
      tags: []
    });
    setShowTaskForm(false);
    onTaskCreate(task);
  };

  /**
   * Handle task status change (drag and drop simulation)
   */
  const handleTaskStatusChange = (taskId, newStatus) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
    onTaskUpdate(taskId, { status: newStatus });
  };

  /**
   * Calculate task progress
   */
  const getTaskProgress = (task) => {
    if (!task.subtasks.length) return task.status === 'completed' ? 100 : 0;
    const completed = task.subtasks.filter(st => st.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  };

  /**
   * Get task statistics
   */
  const getTaskStats = () => {
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length
    };
  };

  const stats = getTaskStats();

  return (
    <div className={`task-management-system ${className}`}>
      <style jsx>{`
        .task-card {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .task-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .timeline {
          position: relative;
          padding-left: 20px;
        }
        .timeline-item {
          position: relative;
          margin-bottom: 15px;
        }
        .timeline-marker {
          position: absolute;
          left: -25px;
          top: 5px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .timeline-item:not(:last-child)::before {
          content: '';
          position: absolute;
          left: -21px;
          top: 15px;
          width: 2px;
          height: calc(100% + 10px);
          background-color: #e5e5e5;
        }
      `}</style>
      {/* Header */}
      <PreviewCard>
        <div className="card-inner">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6>Task Management System</h6>
              <p className="text-soft mb-0">
                Comprehensive task tracking and management for RMF implementation
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button 
                color="primary"
                onClick={() => setShowTaskForm(true)}
              >
                <Icon name="plus" className="me-1"></Icon>
                New Task
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <Row className="g-3 mb-4">
            <Col md="2">
              <div className="text-center p-2 bg-light rounded">
                <div className="h5 mb-1">{stats.total}</div>
                <div className="small text-soft">Total Tasks</div>
              </div>
            </Col>
            <Col md="2">
              <div className="text-center p-2 bg-secondary bg-opacity-10 rounded">
                <div className="h5 mb-1">{stats.todo}</div>
                <div className="small text-soft">To Do</div>
              </div>
            </Col>
            <Col md="2">
              <div className="text-center p-2 bg-warning bg-opacity-10 rounded">
                <div className="h5 mb-1">{stats.inProgress}</div>
                <div className="small text-soft">In Progress</div>
              </div>
            </Col>
            <Col md="2">
              <div className="text-center p-2 bg-info bg-opacity-10 rounded">
                <div className="h5 mb-1">{stats.review}</div>
                <div className="small text-soft">Review</div>
              </div>
            </Col>
            <Col md="2">
              <div className="text-center p-2 bg-success bg-opacity-10 rounded">
                <div className="h5 mb-1">{stats.completed}</div>
                <div className="small text-soft">Completed</div>
              </div>
            </Col>
            <Col md="2">
              <div className="text-center p-2 bg-danger bg-opacity-10 rounded">
                <div className="h5 mb-1">{stats.overdue}</div>
                <div className="small text-soft">Overdue</div>
              </div>
            </Col>
          </Row>

          {/* Filters and View Controls */}
          <Row className="g-3 mb-4">
            <Col md="3">
              <select 
                className="form-select form-select-sm"
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
              >
                <option value="all">All Assignees</option>
                {teamMembers.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </Col>
            <Col md="3">
              <select 
                className="form-select form-select-sm"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </Col>
            <Col md="6">
              <div className="d-flex gap-2 justify-content-end">
                <Button 
                  color={viewMode === 'kanban' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                >
                  <Icon name="columns" className="me-1"></Icon>
                  Kanban
                </Button>
                <Button 
                  color={viewMode === 'list' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <Icon name="list" className="me-1"></Icon>
                  List
                </Button>
                <Button 
                  color={viewMode === 'calendar' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                >
                  <Icon name="calendar" className="me-1"></Icon>
                  Calendar
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      </PreviewCard>

      {/* Task Views */}
      {viewMode === 'kanban' && (
        <Block>
          <Row className="g-3">
            {statusColumns.map(column => (
              <Col key={column.id} md="3">
                <PreviewCard>
                  <div className="card-inner">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">{column.title}</h6>
                      <span className={`badge bg-${column.color}`}>
                        {tasksByStatus[column.id]?.length || 0}
                      </span>
                    </div>
                    
                    <div className="task-column" style={{ minHeight: '400px' }}>
                      {tasksByStatus[column.id]?.map(task => (
                        <div
                          key={task.id}
                          className="task-card mb-3 p-3 border rounded bg-white cursor-pointer"
                          onClick={() => setSelectedTask(task)}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-1 small">{task.title}</h6>
                            <span className={`badge bg-${getPriorityColor(task.priority)} badge-sm`}>
                              {task.priority}
                            </span>
                          </div>
                          
                          <p className="small text-soft mb-2">{task.description}</p>
                          
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="badge bg-light text-dark small">{task.controlId}</span>
                            <span className="small text-soft">{task.assignee}</span>
                          </div>
                          
                          {task.subtasks.length > 0 && (
                            <div className="mb-2">
                              <div className="progress" style={{ height: '4px' }}>
                                <div 
                                  className="progress-bar bg-primary" 
                                  style={{ width: `${getTaskProgress(task)}%` }}
                                ></div>
                              </div>
                              <div className="small text-soft mt-1">
                                {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks
                              </div>
                            </div>
                          )}
                          
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="small text-soft">Due: {task.dueDate}</span>
                            <div className="d-flex gap-1">
                              {task.status !== 'todo' && (
                                <Button 
                                  color="outline-secondary" 
                                  size="sm"
                                  onClick={() => handleTaskStatusChange(task.id, 'todo')}
                                >
                                  ←
                                </Button>
                              )}
                              {task.status !== 'completed' && (
                                <Button 
                                  color="outline-primary" 
                                  size="sm"
                                  onClick={() => {
                                    const nextStatus = {
                                      'todo': 'in_progress',
                                      'in_progress': 'review',
                                      'review': 'completed'
                                    }[task.status];
                                    if (nextStatus) handleTaskStatusChange(task.id, nextStatus);
                                  }}
                                >
                                  →
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PreviewCard>
              </Col>
            ))}
          </Row>
        </Block>
      )}

      {viewMode === 'list' && (
        <Block>
          <PreviewCard>
            <div className="card-inner">
              <div className="alert alert-info">
                <Icon name="info" className="me-2"></Icon>
                List view coming soon! Currently showing Kanban view above.
              </div>
            </div>
          </PreviewCard>
        </Block>
      )}

      {viewMode === 'calendar' && (
        <Block>
          <PreviewCard>
            <div className="card-inner">
              <div className="alert alert-info">
                <Icon name="info" className="me-2"></Icon>
                Calendar view coming soon! Currently showing Kanban view above.
              </div>
            </div>
          </PreviewCard>
        </Block>
      )}

      {/* Task Creation Modal/Form */}
      {showTaskForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Task</h5>
                <Button 
                  color="outline-secondary" 
                  size="sm"
                  onClick={() => setShowTaskForm(false)}
                >
                  <Icon name="cross"></Icon>
                </Button>
              </div>
              <div className="modal-body">
                <Row className="g-3">
                  <Col md="12">
                    <label className="form-label">Task Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter task title..."
                    />
                  </Col>
                  <Col md="12">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter task description..."
                    ></textarea>
                  </Col>
                  <Col md="6">
                    <label className="form-label">Control ID</label>
                    <select
                      className="form-select"
                      value={newTask.controlId}
                      onChange={(e) => setNewTask(prev => ({ ...prev, controlId: e.target.value }))}
                    >
                      <option value="">Select control...</option>
                      {controls.map(control => (
                        <option key={control.id} value={control.id}>
                          {control.id} - {control.name}
                        </option>
                      ))}
                    </select>
                  </Col>
                  <Col md="6">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={newTask.priority}
                      onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </Col>
                  <Col md="6">
                    <label className="form-label">Assignee</label>
                    <select
                      className="form-select"
                      value={newTask.assignee}
                      onChange={(e) => setNewTask(prev => ({ ...prev, assignee: e.target.value }))}
                    >
                      <option value="">Select assignee...</option>
                      {teamMembers.map(member => (
                        <option key={member} value={member}>{member}</option>
                      ))}
                    </select>
                  </Col>
                  <Col md="6">
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </Col>
                  <Col md="6">
                    <label className="form-label">Estimated Hours</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newTask.estimatedHours}
                      onChange={(e) => setNewTask(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 0 }))}
                      min="1"
                      max="200"
                    />
                  </Col>
                </Row>
              </div>
              <div className="modal-footer">
                <Button color="outline-secondary" onClick={() => setShowTaskForm(false)}>
                  Cancel
                </Button>
                <Button color="primary" onClick={handleCreateTask}>
                  Create Task
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title">{selectedTask.title}</h5>
                  <div className="d-flex gap-2 mt-1">
                    <span className={`badge bg-${getPriorityColor(selectedTask.priority)}`}>
                      {selectedTask.priority}
                    </span>
                    <span className="badge bg-light text-dark">{selectedTask.controlId}</span>
                    <span className={`badge bg-${statusColumns.find(c => c.id === selectedTask.status)?.color}`}>
                      {statusColumns.find(c => c.id === selectedTask.status)?.title}
                    </span>
                  </div>
                </div>
                <Button
                  color="outline-secondary"
                  size="sm"
                  onClick={() => setSelectedTask(null)}
                >
                  <Icon name="cross"></Icon>
                </Button>
              </div>
              <div className="modal-body">
                <Row className="g-4">
                  <Col md="8">
                    <div className="mb-4">
                      <h6>Description</h6>
                      <p className="text-soft">{selectedTask.description}</p>
                    </div>

                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6>Subtasks ({selectedTask.subtasks.filter(st => st.completed).length}/{selectedTask.subtasks.length})</h6>
                        <Button color="outline-primary" size="sm">
                          <Icon name="plus" className="me-1"></Icon>
                          Add Subtask
                        </Button>
                      </div>
                      {selectedTask.subtasks.length > 0 ? (
                        <div className="subtask-list">
                          {selectedTask.subtasks.map(subtask => (
                            <div key={subtask.id} className="d-flex align-items-center mb-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                className="form-check-input me-2"
                                checked={subtask.completed}
                                onChange={() => {
                                  // Handle subtask toggle
                                  console.log('Toggle subtask', subtask.id);
                                }}
                              />
                              <span className={subtask.completed ? 'text-decoration-line-through text-muted' : ''}>
                                {subtask.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-soft">No subtasks yet. Add subtasks to break down this task.</p>
                      )}
                    </div>

                    <div className="mb-4">
                      <h6>Activity Log</h6>
                      <div className="timeline">
                        <div className="timeline-item">
                          <div className="timeline-marker bg-primary"></div>
                          <div className="timeline-content">
                            <div className="small text-soft">Task created</div>
                            <div className="text-muted small">{selectedTask.createdDate}</div>
                          </div>
                        </div>
                        {selectedTask.status !== 'todo' && (
                          <div className="timeline-item">
                            <div className="timeline-marker bg-warning"></div>
                            <div className="timeline-content">
                              <div className="small text-soft">Task started</div>
                              <div className="text-muted small">Progress tracking</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Col>

                  <Col md="4">
                    <div className="mb-4">
                      <h6>Task Details</h6>
                      <div className="mb-3">
                        <label className="form-label small">Assignee</label>
                        <select className="form-select form-select-sm">
                          <option value={selectedTask.assignee}>{selectedTask.assignee}</option>
                          {teamMembers.filter(m => m !== selectedTask.assignee).map(member => (
                            <option key={member} value={member}>{member}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label small">Due Date</label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          defaultValue={selectedTask.dueDate}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small">Priority</label>
                        <select className="form-select form-select-sm" defaultValue={selectedTask.priority}>
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h6>Time Tracking</h6>
                      <div className="mb-2">
                        <div className="d-flex justify-content-between">
                          <span className="small">Estimated:</span>
                          <span className="small">{selectedTask.estimatedHours}h</span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="d-flex justify-content-between">
                          <span className="small">Actual:</span>
                          <span className="small">{selectedTask.actualHours}h</span>
                        </div>
                      </div>
                      <div className="progress mb-2" style={{ height: '6px' }}>
                        <div
                          className="progress-bar bg-primary"
                          style={{ width: `${Math.min((selectedTask.actualHours / selectedTask.estimatedHours) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <Button color="outline-primary" size="sm" className="w-100">
                        <Icon name="clock" className="me-1"></Icon>
                        Log Time
                      </Button>
                    </div>

                    <div className="mb-4">
                      <h6>Tags</h6>
                      <div className="d-flex flex-wrap gap-1">
                        {selectedTask.tags.map((tag, index) => (
                          <span key={index} className="badge bg-light text-dark">{tag}</span>
                        ))}
                        <Button color="outline-secondary" size="sm">
                          <Icon name="plus"></Icon>
                        </Button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h6>Dependencies</h6>
                      {selectedTask.dependencies.length > 0 ? (
                        <div>
                          {selectedTask.dependencies.map(depId => {
                            const depTask = tasks.find(t => t.id === depId);
                            return depTask ? (
                              <div key={depId} className="small mb-1 p-2 bg-light rounded">
                                {depTask.title}
                              </div>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <p className="small text-soft">No dependencies</p>
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
              <div className="modal-footer">
                <Button color="outline-secondary" onClick={() => setSelectedTask(null)}>
                  Close
                </Button>
                <Button color="primary">
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagementSystem;
