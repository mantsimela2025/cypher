/**
 * Progress Dashboard Component
 * Comprehensive analytics and reporting for RMF implementation progress
 * Provides visual insights, metrics, and advanced reporting capabilities
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
import AnalyticsReportModal from "./AnalyticsReportModal";

const ProgressDashboard = ({ 
  controls = [],
  tasks = [],
  systemData = {},
  timeframe = 'current', // current, week, month, quarter
  className = ""
}) => {
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [chartType, setChartType] = useState('donut'); // donut, bar, line
  const [reportPeriod, setReportPeriod] = useState('week');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // Sample task data for analytics (would come from API in real implementation)
  const sampleTasks = [
    { id: 1, controlId: 'AC-1', status: 'todo', priority: 'HIGH', assignee: 'John Doe', dueDate: '2024-01-15', estimatedHours: 16, actualHours: 0, createdDate: '2024-01-01' },
    { id: 2, controlId: 'AC-2', status: 'in_progress', priority: 'HIGH', assignee: 'Jane Smith', dueDate: '2024-01-20', estimatedHours: 24, actualHours: 8, createdDate: '2024-01-02' },
    { id: 3, controlId: 'SC-7', status: 'todo', priority: 'HIGH', assignee: 'Mike Johnson', dueDate: '2024-01-25', estimatedHours: 32, actualHours: 0, createdDate: '2024-01-03' },
    { id: 4, controlId: 'AU-2', status: 'completed', priority: 'MEDIUM', assignee: 'Sarah Wilson', dueDate: '2024-01-10', estimatedHours: 20, actualHours: 18, createdDate: '2023-12-20' },
    { id: 5, controlId: 'CM-2', status: 'review', priority: 'MEDIUM', assignee: 'John Doe', dueDate: '2024-01-18', estimatedHours: 12, actualHours: 10, createdDate: '2024-01-05' },
    { id: 6, controlId: 'AU-6', status: 'completed', priority: 'MEDIUM', assignee: 'Jane Smith', dueDate: '2024-01-12', estimatedHours: 16, actualHours: 15, createdDate: '2023-12-25' }
  ];

  /**
   * Calculate comprehensive metrics
   */
  const metrics = useMemo(() => {
    const allTasks = tasks.length > 0 ? tasks : sampleTasks;
    const today = new Date();
    
    // Control status metrics
    const controlsByStatus = {
      not_started: controls.filter(c => c.implementationStatus === 'not_started').length,
      in_progress: controls.filter(c => c.implementationStatus === 'in_progress').length,
      completed: controls.filter(c => c.implementationStatus === 'completed').length,
      verified: controls.filter(c => c.implementationStatus === 'verified').length
    };

    // Task status metrics
    const tasksByStatus = {
      todo: allTasks.filter(t => t.status === 'todo').length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
      review: allTasks.filter(t => t.status === 'review').length,
      completed: allTasks.filter(t => t.status === 'completed').length
    };

    // Priority distribution
    const tasksByPriority = {
      HIGH: allTasks.filter(t => t.priority === 'HIGH').length,
      MEDIUM: allTasks.filter(t => t.priority === 'MEDIUM').length,
      LOW: allTasks.filter(t => t.priority === 'LOW').length
    };

    // Time tracking metrics
    const totalEstimated = allTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
    const totalActual = allTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
    const timeEfficiency = totalEstimated > 0 ? Math.round((totalActual / totalEstimated) * 100) : 0;

    // Overdue tasks
    const overdueTasks = allTasks.filter(task => 
      new Date(task.dueDate) < today && task.status !== 'completed'
    ).length;

    // Progress calculations
    const totalControls = controls.length;
    const completedControls = controlsByStatus.completed + controlsByStatus.verified;
    const overallProgress = totalControls > 0 ? Math.round((completedControls / totalControls) * 100) : 0;

    // Team workload
    const teamWorkload = {};
    allTasks.forEach(task => {
      if (task.assignee) {
        if (!teamWorkload[task.assignee]) {
          teamWorkload[task.assignee] = { total: 0, completed: 0, inProgress: 0, estimated: 0, actual: 0 };
        }
        teamWorkload[task.assignee].total++;
        teamWorkload[task.assignee].estimated += task.estimatedHours || 0;
        teamWorkload[task.assignee].actual += task.actualHours || 0;
        if (task.status === 'completed') teamWorkload[task.assignee].completed++;
        if (task.status === 'in_progress') teamWorkload[task.assignee].inProgress++;
      }
    });

    // Control family distribution
    const controlFamilies = {};
    controls.forEach(control => {
      if (!controlFamilies[control.family]) {
        controlFamilies[control.family] = { total: 0, completed: 0 };
      }
      controlFamilies[control.family].total++;
      if (control.implementationStatus === 'completed' || control.implementationStatus === 'verified') {
        controlFamilies[control.family].completed++;
      }
    });

    return {
      controlsByStatus,
      tasksByStatus,
      tasksByPriority,
      totalEstimated,
      totalActual,
      timeEfficiency,
      overdueTasks,
      overallProgress,
      teamWorkload,
      controlFamilies,
      totalControls,
      totalTasks: allTasks.length
    };
  }, [controls, tasks, sampleTasks]);

  /**
   * Generate chart data for different visualizations
   */
  const getChartData = (type) => {
    switch (type) {
      case 'control_status':
        return [
          { label: 'Not Started', value: metrics.controlsByStatus.not_started, color: '#6c757d' },
          { label: 'In Progress', value: metrics.controlsByStatus.in_progress, color: '#ffc107' },
          { label: 'Completed', value: metrics.controlsByStatus.completed, color: '#198754' },
          { label: 'Verified', value: metrics.controlsByStatus.verified, color: '#0d6efd' }
        ];
      case 'task_status':
        return [
          { label: 'To Do', value: metrics.tasksByStatus.todo, color: '#6c757d' },
          { label: 'In Progress', value: metrics.tasksByStatus.in_progress, color: '#ffc107' },
          { label: 'Review', value: metrics.tasksByStatus.review, color: '#17a2b8' },
          { label: 'Completed', value: metrics.tasksByStatus.completed, color: '#198754' }
        ];
      case 'priority':
        return [
          { label: 'High', value: metrics.tasksByPriority.HIGH, color: '#dc3545' },
          { label: 'Medium', value: metrics.tasksByPriority.MEDIUM, color: '#ffc107' },
          { label: 'Low', value: metrics.tasksByPriority.LOW, color: '#198754' }
        ];
      default:
        return [];
    }
  };

  /**
   * Render simple donut chart
   */
  const renderDonutChart = (data, title) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <div className="text-center text-soft">No data available</div>;

    return (
      <div className="text-center">
        <div className="position-relative d-inline-block">
          <svg width="120" height="120" className="donut-chart">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage * 2.51} 251.2`;
              const strokeDashoffset = index === 0 ? 0 : -data.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 251.2, 0);
              
              return (
                <circle
                  key={index}
                  cx="60"
                  cy="60"
                  r="40"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 60 60)"
                />
              );
            })}
          </svg>
          <div className="position-absolute top-50 start-50 translate-middle">
            <div className="h4 mb-0">{total}</div>
            <div className="small text-soft">Total</div>
          </div>
        </div>
        <div className="mt-3">
          {data.map((item, index) => (
            <div key={index} className="d-flex justify-content-between align-items-center mb-1">
              <div className="d-flex align-items-center">
                <div 
                  className="me-2" 
                  style={{ 
                    width: '12px', 
                    height: '12px', 
                    backgroundColor: item.color, 
                    borderRadius: '2px' 
                  }}
                ></div>
                <span className="small">{item.label}</span>
              </div>
              <span className="small fw-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`progress-dashboard ${className}`}>
      {/* Dashboard Header */}
      <PreviewCard>
        <div className="card-inner">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6>Implementation Progress Dashboard</h6>
              <p className="text-soft mb-0">
                Comprehensive analytics and insights for RMF implementation progress
              </p>
            </div>
            <div className="d-flex gap-2">
              <select 
                className="form-select form-select-sm"
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="all">All Time</option>
              </select>
              <Button
                color="outline-primary"
                size="sm"
                onClick={() => setShowAnalyticsModal(true)}
              >
                <Icon name="download" className="me-1"></Icon>
                Export Report
              </Button>
            </div>
          </div>

          {/* Key Metrics Overview */}
          <Row className="g-3 mb-4">
            <Col md="3">
              <div className="text-center p-3 bg-primary bg-opacity-10 rounded">
                <div className="h3 text-primary mb-1">{metrics.overallProgress}%</div>
                <div className="small text-soft">Overall Progress</div>
                <div className="progress mt-2" style={{ height: '4px' }}>
                  <div className="progress-bar bg-primary" style={{ width: `${metrics.overallProgress}%` }}></div>
                </div>
              </div>
            </Col>
            <Col md="3">
              <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                <div className="h3 text-success mb-1">
                  {metrics.controlsByStatus.completed + metrics.controlsByStatus.verified}
                </div>
                <div className="small text-soft">Controls Completed</div>
                <div className="small text-muted">of {metrics.totalControls} total</div>
              </div>
            </Col>
            <Col md="3">
              <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                <div className="h3 text-warning mb-1">{metrics.tasksByStatus.in_progress}</div>
                <div className="small text-soft">Tasks In Progress</div>
                <div className="small text-muted">of {metrics.totalTasks} total</div>
              </div>
            </Col>
            <Col md="3">
              <div className="text-center p-3 bg-danger bg-opacity-10 rounded">
                <div className="h3 text-danger mb-1">{metrics.overdueTasks}</div>
                <div className="small text-soft">Overdue Tasks</div>
                <div className="small text-muted">Need attention</div>
              </div>
            </Col>
          </Row>

          {/* Time Tracking Metrics */}
          <Row className="g-3">
            <Col md="4">
              <div className="text-center p-3 border rounded">
                <div className="h4 text-info mb-1">{metrics.totalEstimated}h</div>
                <div className="small text-soft">Estimated Hours</div>
              </div>
            </Col>
            <Col md="4">
              <div className="text-center p-3 border rounded">
                <div className="h4 text-primary mb-1">{metrics.totalActual}h</div>
                <div className="small text-soft">Actual Hours</div>
              </div>
            </Col>
            <Col md="4">
              <div className="text-center p-3 border rounded">
                <div className={`h4 mb-1 ${metrics.timeEfficiency <= 100 ? 'text-success' : 'text-warning'}`}>
                  {metrics.timeEfficiency}%
                </div>
                <div className="small text-soft">Time Efficiency</div>
              </div>
            </Col>
          </Row>
        </div>
      </PreviewCard>

      {/* Charts and Analytics */}
      <Row className="g-4">
        {/* Control Status Chart */}
        <Col md="4">
          <PreviewCard>
            <div className="card-inner">
              <h6 className="mb-4">Control Implementation Status</h6>
              {renderDonutChart(getChartData('control_status'), 'Controls')}
            </div>
          </PreviewCard>
        </Col>

        {/* Task Status Chart */}
        <Col md="4">
          <PreviewCard>
            <div className="card-inner">
              <h6 className="mb-4">Task Status Distribution</h6>
              {renderDonutChart(getChartData('task_status'), 'Tasks')}
            </div>
          </PreviewCard>
        </Col>

        {/* Priority Distribution Chart */}
        <Col md="4">
          <PreviewCard>
            <div className="card-inner">
              <h6 className="mb-4">Task Priority Distribution</h6>
              {renderDonutChart(getChartData('priority'), 'Priority')}
            </div>
          </PreviewCard>
        </Col>
      </Row>

      {/* Team Performance */}
      <Block>
        <PreviewCard>
          <div className="card-inner">
            <h6 className="mb-4">Team Performance & Workload</h6>
            <Row className="g-3">
              {Object.entries(metrics.teamWorkload).map(([member, workload]) => (
                <Col key={member} md="6" lg="4">
                  <div className="border rounded p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong className="small">{member}</strong>
                      <span className="badge bg-light text-dark">{workload.total} tasks</span>
                    </div>
                    <div className="mb-2">
                      <div className="d-flex justify-content-between small">
                        <span>Completed:</span>
                        <span>{workload.completed}/{workload.total}</span>
                      </div>
                      <div className="progress mt-1" style={{ height: '4px' }}>
                        <div 
                          className="progress-bar bg-success" 
                          style={{ width: `${workload.total > 0 ? (workload.completed / workload.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between small text-soft">
                      <span>Hours: {workload.actual}h / {workload.estimated}h</span>
                      <span>{workload.inProgress} active</span>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </PreviewCard>
      </Block>

      {/* Control Family Progress */}
      <Block>
        <PreviewCard>
          <div className="card-inner">
            <h6 className="mb-4">Control Family Implementation Progress</h6>
            <Row className="g-3">
              {Object.entries(metrics.controlFamilies).map(([family, data]) => (
                <Col key={family} md="6" lg="3">
                  <div className="text-center p-3 border rounded">
                    <div className="h5 mb-1">{family}</div>
                    <div className="small text-soft mb-2">{data.completed}/{data.total} completed</div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div
                        className="progress-bar bg-primary"
                        style={{ width: `${data.total > 0 ? (data.completed / data.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="small text-soft mt-1">
                      {data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0}%
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </PreviewCard>
      </Block>

      {/* Implementation Timeline & Milestones */}
      <Block>
        <PreviewCard>
          <div className="card-inner">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6>Implementation Timeline & Milestones</h6>
              <Button color="outline-info" size="sm">
                <Icon name="calendar" className="me-1"></Icon>
                View Full Timeline
              </Button>
            </div>

            <div className="timeline-dashboard">
              <Row className="g-4">
                <Col md="6">
                  <div className="milestone-card p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        <Icon name="check-circle" className="text-success me-2"></Icon>
                        <strong>Phase 1: Foundation Controls</strong>
                      </div>
                      <span className="badge bg-success">Completed</span>
                    </div>
                    <div className="small text-soft mb-2">AC-1, AU-2 implementation completed</div>
                    <div className="progress" style={{ height: '4px' }}>
                      <div className="progress-bar bg-success" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </Col>
                <Col md="6">
                  <div className="milestone-card p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        <Icon name="clock" className="text-warning me-2"></Icon>
                        <strong>Phase 2: Core Security</strong>
                      </div>
                      <span className="badge bg-warning">In Progress</span>
                    </div>
                    <div className="small text-soft mb-2">AC-2, SC-7 implementation ongoing</div>
                    <div className="progress" style={{ height: '4px' }}>
                      <div className="progress-bar bg-warning" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </Col>
                <Col md="6">
                  <div className="milestone-card p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        <Icon name="play" className="text-info me-2"></Icon>
                        <strong>Phase 3: Configuration Mgmt</strong>
                      </div>
                      <span className="badge bg-secondary">Planned</span>
                    </div>
                    <div className="small text-soft mb-2">CM-2, CM-6 scheduled for next phase</div>
                    <div className="progress" style={{ height: '4px' }}>
                      <div className="progress-bar bg-secondary" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                </Col>
                <Col md="6">
                  <div className="milestone-card p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        <Icon name="flag" className="text-primary me-2"></Icon>
                        <strong>Phase 4: Assessment Ready</strong>
                      </div>
                      <span className="badge bg-light text-dark">Future</span>
                    </div>
                    <div className="small text-soft mb-2">All controls implemented and verified</div>
                    <div className="progress" style={{ height: '4px' }}>
                      <div className="progress-bar bg-light" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </PreviewCard>
      </Block>

      {/* Risk & Issues Tracking */}
      <Block>
        <PreviewCard>
          <div className="card-inner">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6>Risk & Issues Tracking</h6>
              <Button color="outline-danger" size="sm">
                <Icon name="alert-triangle" className="me-1"></Icon>
                Report Issue
              </Button>
            </div>

            <Row className="g-3">
              <Col md="4">
                <div className="text-center p-3 bg-danger bg-opacity-10 rounded">
                  <div className="h4 text-danger mb-1">2</div>
                  <div className="small text-soft">High Risk Items</div>
                  <div className="small text-muted mt-1">Require immediate attention</div>
                </div>
              </Col>
              <Col md="4">
                <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                  <div className="h4 text-warning mb-1">5</div>
                  <div className="small text-soft">Medium Risk Items</div>
                  <div className="small text-muted mt-1">Monitor closely</div>
                </div>
              </Col>
              <Col md="4">
                <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                  <div className="h4 text-success mb-1">12</div>
                  <div className="small text-soft">Resolved Issues</div>
                  <div className="small text-muted mt-1">Successfully mitigated</div>
                </div>
              </Col>
            </Row>

            <div className="mt-4">
              <div className="alert alert-warning">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Icon name="alert-triangle" className="me-2"></Icon>
                    <strong>Resource Constraint:</strong> SC-7 implementation delayed due to network team availability
                  </div>
                  <Button color="outline-warning" size="sm">View Details</Button>
                </div>
              </div>
              <div className="alert alert-info">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Icon name="info" className="me-2"></Icon>
                    <strong>Dependency Alert:</strong> CM-2 waiting for AC-2 completion before proceeding
                  </div>
                  <Button color="outline-info" size="sm">View Details</Button>
                </div>
              </div>
            </div>
          </div>
        </PreviewCard>
      </Block>

      {/* Analytics Report Modal */}
      <AnalyticsReportModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        controls={controls}
        tasks={tasks}
        systemData={systemData}
      />
    </div>
  );
};

export default ProgressDashboard;
