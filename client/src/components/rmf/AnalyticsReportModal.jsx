/**
 * Analytics Report Modal Component
 * Detailed analytics and reporting modal for RMF implementation
 * Provides exportable reports and detailed insights
 */

import React, { useState } from "react";
import {
  Button,
  Icon,
  Row,
  Col,
} from "@/components/Component";

const AnalyticsReportModal = ({ 
  isOpen = false,
  onClose = () => {},
  controls = [],
  tasks = [],
  systemData = {},
  className = ""
}) => {
  const [reportType, setReportType] = useState('executive');
  const [reportFormat, setReportFormat] = useState('pdf');
  const [dateRange, setDateRange] = useState('month');

  if (!isOpen) return null;

  // Sample data for detailed analytics
  const analyticsData = {
    executiveSummary: {
      totalControls: controls.length,
      completedControls: controls.filter(c => c.implementationStatus === 'completed' || c.implementationStatus === 'verified').length,
      overallProgress: Math.round(((controls.filter(c => c.implementationStatus === 'completed' || c.implementationStatus === 'verified').length) / controls.length) * 100),
      estimatedCompletion: '2024-03-15',
      budgetUtilization: 68,
      riskLevel: 'MEDIUM'
    },
    detailedMetrics: {
      controlFamilies: {
        'AC': { total: 2, completed: 1, inProgress: 1, notStarted: 0 },
        'SC': { total: 1, completed: 0, inProgress: 0, notStarted: 1 },
        'AU': { total: 2, completed: 2, inProgress: 0, notStarted: 0 },
        'CM': { total: 1, completed: 0, inProgress: 0, notStarted: 1 }
      },
      timeTracking: {
        totalEstimated: 120,
        totalActual: 51,
        efficiency: 85,
        averageTaskDuration: 12.5
      },
      teamPerformance: {
        'John Doe': { tasks: 2, completed: 1, efficiency: 90 },
        'Jane Smith': { tasks: 2, completed: 2, efficiency: 95 },
        'Mike Johnson': { tasks: 1, completed: 0, efficiency: 0 },
        'Sarah Wilson': { tasks: 1, completed: 1, efficiency: 110 }
      }
    },
    recommendations: [
      {
        type: 'PRIORITY',
        title: 'Accelerate High Priority Controls',
        description: 'Focus resources on AC-1 and SC-7 to maintain timeline',
        impact: 'HIGH',
        effort: 'MEDIUM'
      },
      {
        type: 'RESOURCE',
        title: 'Additional Network Security Expertise',
        description: 'Consider bringing in specialist for SC-7 implementation',
        impact: 'MEDIUM',
        effort: 'LOW'
      },
      {
        type: 'PROCESS',
        title: 'Implement Parallel Task Execution',
        description: 'Some controls can be implemented simultaneously',
        impact: 'MEDIUM',
        effort: 'LOW'
      }
    ]
  };

  const handleExportReport = () => {
    alert(`Exporting ${reportType} report as ${reportFormat.toUpperCase()} for ${dateRange} period...`);
    // In real implementation, this would generate and download the report
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h5 className="modal-title">Analytics & Reporting</h5>
              <p className="text-soft mb-0">Comprehensive implementation analytics and insights</p>
            </div>
            <Button 
              color="outline-secondary" 
              size="sm"
              onClick={onClose}
            >
              <Icon name="cross"></Icon>
            </Button>
          </div>
          
          <div className="modal-body">
            {/* Report Configuration */}
            <Row className="g-3 mb-4">
              <Col md="4">
                <label className="form-label small">Report Type</label>
                <select 
                  className="form-select form-select-sm"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="executive">Executive Summary</option>
                  <option value="detailed">Detailed Analytics</option>
                  <option value="technical">Technical Report</option>
                  <option value="compliance">Compliance Report</option>
                </select>
              </Col>
              <Col md="4">
                <label className="form-label small">Date Range</label>
                <select 
                  className="form-select form-select-sm"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="all">All Time</option>
                </select>
              </Col>
              <Col md="4">
                <label className="form-label small">Export Format</label>
                <select 
                  className="form-select form-select-sm"
                  value={reportFormat}
                  onChange={(e) => setReportFormat(e.target.value)}
                >
                  <option value="pdf">PDF Report</option>
                  <option value="excel">Excel Spreadsheet</option>
                  <option value="csv">CSV Data</option>
                  <option value="json">JSON Data</option>
                </select>
              </Col>
            </Row>

            {/* Executive Summary Report */}
            {reportType === 'executive' && (
              <div className="report-content">
                <div className="mb-4">
                  <h6 className="border-bottom pb-2">Executive Summary</h6>
                  <Row className="g-4 mt-2">
                    <Col md="6">
                      <div className="p-3 bg-light rounded">
                        <h6 className="text-primary">Implementation Status</h6>
                        <div className="mb-2">
                          <div className="d-flex justify-content-between">
                            <span>Overall Progress:</span>
                            <strong>{analyticsData.executiveSummary.overallProgress}%</strong>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="d-flex justify-content-between">
                            <span>Controls Completed:</span>
                            <strong>{analyticsData.executiveSummary.completedControls}/{analyticsData.executiveSummary.totalControls}</strong>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="d-flex justify-content-between">
                            <span>Estimated Completion:</span>
                            <strong>{analyticsData.executiveSummary.estimatedCompletion}</strong>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col md="6">
                      <div className="p-3 bg-light rounded">
                        <h6 className="text-success">Key Metrics</h6>
                        <div className="mb-2">
                          <div className="d-flex justify-content-between">
                            <span>Budget Utilization:</span>
                            <strong>{analyticsData.executiveSummary.budgetUtilization}%</strong>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="d-flex justify-content-between">
                            <span>Risk Level:</span>
                            <span className="badge bg-warning">{analyticsData.executiveSummary.riskLevel}</span>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="d-flex justify-content-between">
                            <span>Team Efficiency:</span>
                            <strong>{analyticsData.detailedMetrics.timeTracking.efficiency}%</strong>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>

                <div className="mb-4">
                  <h6 className="border-bottom pb-2">Key Recommendations</h6>
                  {analyticsData.recommendations.map((rec, index) => (
                    <div key={index} className="alert alert-info mb-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{rec.title}</strong>
                          <p className="mb-1 small">{rec.description}</p>
                          <div className="d-flex gap-2">
                            <span className={`badge ${rec.impact === 'HIGH' ? 'bg-danger' : rec.impact === 'MEDIUM' ? 'bg-warning' : 'bg-success'}`}>
                              {rec.impact} Impact
                            </span>
                            <span className={`badge ${rec.effort === 'HIGH' ? 'bg-danger' : rec.effort === 'MEDIUM' ? 'bg-warning' : 'bg-success'}`}>
                              {rec.effort} Effort
                            </span>
                          </div>
                        </div>
                        <Icon name={rec.type === 'PRIORITY' ? 'flag' : rec.type === 'RESOURCE' ? 'users' : 'settings'}></Icon>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Analytics Report */}
            {reportType === 'detailed' && (
              <div className="report-content">
                <div className="mb-4">
                  <h6 className="border-bottom pb-2">Control Family Analysis</h6>
                  <Row className="g-3 mt-2">
                    {Object.entries(analyticsData.detailedMetrics.controlFamilies).map(([family, data]) => (
                      <Col key={family} md="6" lg="3">
                        <div className="text-center p-3 border rounded">
                          <div className="h5 mb-1">{family} Family</div>
                          <div className="small text-soft mb-2">
                            {data.completed}/{data.total} completed
                          </div>
                          <div className="progress mb-2" style={{ height: '6px' }}>
                            <div 
                              className="progress-bar bg-primary" 
                              style={{ width: `${(data.completed / data.total) * 100}%` }}
                            ></div>
                          </div>
                          <div className="small">
                            <div>In Progress: {data.inProgress}</div>
                            <div>Not Started: {data.notStarted}</div>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>

                <div className="mb-4">
                  <h6 className="border-bottom pb-2">Team Performance Analysis</h6>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Team Member</th>
                          <th>Assigned Tasks</th>
                          <th>Completed</th>
                          <th>Completion Rate</th>
                          <th>Efficiency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(analyticsData.detailedMetrics.teamPerformance).map(([member, data]) => (
                          <tr key={member}>
                            <td>{member}</td>
                            <td>{data.tasks}</td>
                            <td>{data.completed}</td>
                            <td>
                              <div className="progress" style={{ height: '4px' }}>
                                <div 
                                  className="progress-bar bg-success" 
                                  style={{ width: `${(data.completed / data.tasks) * 100}%` }}
                                ></div>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${data.efficiency >= 100 ? 'bg-success' : data.efficiency >= 80 ? 'bg-warning' : 'bg-danger'}`}>
                                {data.efficiency}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mb-4">
                  <h6 className="border-bottom pb-2">Time Tracking Analysis</h6>
                  <Row className="g-3 mt-2">
                    <Col md="3">
                      <div className="text-center p-3 border rounded">
                        <div className="h4 text-info">{analyticsData.detailedMetrics.timeTracking.totalEstimated}h</div>
                        <div className="small text-soft">Total Estimated</div>
                      </div>
                    </Col>
                    <Col md="3">
                      <div className="text-center p-3 border rounded">
                        <div className="h4 text-primary">{analyticsData.detailedMetrics.timeTracking.totalActual}h</div>
                        <div className="small text-soft">Total Actual</div>
                      </div>
                    </Col>
                    <Col md="3">
                      <div className="text-center p-3 border rounded">
                        <div className="h4 text-success">{analyticsData.detailedMetrics.timeTracking.efficiency}%</div>
                        <div className="small text-soft">Efficiency</div>
                      </div>
                    </Col>
                    <Col md="3">
                      <div className="text-center p-3 border rounded">
                        <div className="h4 text-warning">{analyticsData.detailedMetrics.timeTracking.averageTaskDuration}h</div>
                        <div className="small text-soft">Avg Task Duration</div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            )}

            {/* Technical Report */}
            {reportType === 'technical' && (
              <div className="report-content">
                <div className="alert alert-info">
                  <Icon name="info" className="me-2"></Icon>
                  Technical report includes detailed control implementation specifications, configuration details, and technical documentation.
                </div>
                <div className="text-center py-4">
                  <Icon name="file-docs" className="text-soft" style={{ fontSize: '3rem' }}></Icon>
                  <h6 className="mt-3 text-soft">Technical Report Preview</h6>
                  <p className="text-soft">
                    Detailed technical documentation and implementation specifications will be generated.
                  </p>
                </div>
              </div>
            )}

            {/* Compliance Report */}
            {reportType === 'compliance' && (
              <div className="report-content">
                <div className="alert alert-success">
                  <Icon name="shield-check" className="me-2"></Icon>
                  Compliance report includes control implementation status, evidence collection, and audit readiness assessment.
                </div>
                <div className="text-center py-4">
                  <Icon name="award" className="text-soft" style={{ fontSize: '3rem' }}></Icon>
                  <h6 className="mt-3 text-soft">Compliance Report Preview</h6>
                  <p className="text-soft">
                    Comprehensive compliance documentation and audit trail will be generated.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <Button color="outline-secondary" onClick={onClose}>
              Close
            </Button>
            <Button color="primary" onClick={handleExportReport}>
              <Icon name="download" className="me-1"></Icon>
              Export Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReportModal;
