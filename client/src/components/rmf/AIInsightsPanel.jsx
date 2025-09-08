/**
 * AI Insights Panel Component
 * Real-time AI-powered insights and recommendations for RMF processes
 * with confidence scoring and recommendation acceptance tracking
 */

import React, { useState, useEffect } from 'react';
import { Card, CardBody, Badge, Progress, Button, Alert, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Icon } from '@/components/Component';
import { rmfAIApi } from '@/utils/rmfApi';
import { log } from '@/utils/config';
import { toast } from 'react-toastify';

const AIInsightsPanel = ({ 
  systemData = null, 
  currentStep = null, 
  onRecommendationAccept = null,
  onRecommendationReject = null,
  showConfidenceScores = true,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [detailModal, setDetailModal] = useState(false);
  const [acceptanceHistory, setAcceptanceHistory] = useState([]);
  const [aiHealth, setAIHealth] = useState({ status: 'unknown', confidence: 0 });

  useEffect(() => {
    loadAIInsights();
    checkAIHealth();

    // Auto-refresh insights if enabled
    let refreshTimer;
    if (autoRefresh) {
      refreshTimer = setInterval(loadAIInsights, refreshInterval);
    }

    return () => {
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, [systemData, currentStep, autoRefresh, refreshInterval]);

  const loadAIInsights = async () => {
    if (!systemData) return;

    try {
      setLoading(true);
      log.info('🤖 Loading AI insights for system:', systemData.name);

      // Generate contextual insights based on current step and system data
      const contextualInsights = await generateContextualInsights();
      setInsights(contextualInsights);

      log.info('✅ AI insights loaded:', contextualInsights.length, 'insights');
    } catch (error) {
      log.error('❌ Failed to load AI insights:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkAIHealth = async () => {
    try {
      const healthResult = await rmfAIApi.getHealthStatus();
      if (healthResult.success) {
        setAIHealth(healthResult.data);
      }
    } catch (error) {
      log.error('❌ Failed to check AI health:', error.message);
      setAIHealth({ status: 'error', confidence: 0 });
    }
  };

  const generateContextualInsights = async () => {
    // Mock contextual insights based on current step and system data
    // In real implementation, this would call AI service with context
    const mockInsights = [
      {
        id: 1,
        type: 'categorization_optimization',
        title: 'System Categorization Refinement',
        description: 'Based on similar financial systems, consider elevating integrity impact to HIGH due to transaction processing requirements.',
        confidence: 92,
        priority: 'high',
        category: 'categorization',
        recommendation: {
          action: 'update_categorization',
          parameters: { integrity: 'high' },
          reasoning: 'Financial transaction systems typically require high integrity protection to prevent unauthorized modifications that could result in financial losses.',
          impact: 'This change would require additional integrity controls but significantly reduces financial risk.'
        },
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        applicableSteps: ['categorize']
      },
      {
        id: 2,
        type: 'control_enhancement',
        title: 'Enhanced Access Control Recommendation',
        description: 'AI analysis suggests implementing multi-factor authentication (AC-2) enhancements for this system type.',
        confidence: 87,
        priority: 'medium',
        category: 'controls',
        recommendation: {
          action: 'add_control_enhancement',
          parameters: { control: 'AC-2', enhancement: '(1)' },
          reasoning: 'Systems processing financial data benefit significantly from enhanced authentication mechanisms.',
          impact: 'Moderate implementation effort with high security benefit.'
        },
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        applicableSteps: ['select', 'implement']
      },
      {
        id: 3,
        type: 'compliance_gap',
        title: 'Potential Compliance Gap Detected',
        description: 'Missing audit trail requirements for financial data processing may impact SOX compliance.',
        confidence: 78,
        priority: 'high',
        category: 'compliance',
        recommendation: {
          action: 'add_audit_controls',
          parameters: { controls: ['AU-2', 'AU-3', 'AU-12'] },
          reasoning: 'Financial systems require comprehensive audit trails for regulatory compliance.',
          impact: 'Critical for compliance, moderate implementation complexity.'
        },
        aiGenerated: true,
        timestamp: new Date().toISOString(),
        applicableSteps: ['select', 'implement', 'assess']
      }
    ];

    // Filter insights based on current step
    if (currentStep) {
      return mockInsights.filter(insight => 
        insight.applicableSteps.includes(currentStep)
      );
    }

    return mockInsights;
  };

  const handleAcceptRecommendation = async (insight) => {
    try {
      log.info('✅ Accepting AI recommendation:', insight.title);

      // Track acceptance
      const acceptance = {
        insightId: insight.id,
        action: 'accepted',
        timestamp: new Date().toISOString(),
        confidence: insight.confidence,
        reasoning: insight.recommendation.reasoning
      };

      setAcceptanceHistory(prev => [...prev, acceptance]);

      // Call external handler if provided
      if (onRecommendationAccept) {
        await onRecommendationAccept(insight, acceptance);
      }

      // Remove insight from active list
      setInsights(prev => prev.filter(i => i.id !== insight.id));

      toast.success(`AI recommendation accepted: ${insight.title}`);
      setDetailModal(false);

    } catch (error) {
      log.error('❌ Failed to accept recommendation:', error.message);
      toast.error('Failed to accept AI recommendation');
    }
  };

  const handleRejectRecommendation = async (insight, reason = '') => {
    try {
      log.info('❌ Rejecting AI recommendation:', insight.title);

      // Track rejection
      const rejection = {
        insightId: insight.id,
        action: 'rejected',
        timestamp: new Date().toISOString(),
        confidence: insight.confidence,
        reason: reason
      };

      setAcceptanceHistory(prev => [...prev, rejection]);

      // Call external handler if provided
      if (onRecommendationReject) {
        await onRecommendationReject(insight, rejection);
      }

      // Remove insight from active list
      setInsights(prev => prev.filter(i => i.id !== insight.id));

      toast.info(`AI recommendation rejected: ${insight.title}`);
      setDetailModal(false);

    } catch (error) {
      log.error('❌ Failed to reject recommendation:', error.message);
      toast.error('Failed to reject AI recommendation');
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'success';
    if (confidence >= 75) return 'info';
    if (confidence >= 60) return 'warning';
    return 'danger';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'danger',
      medium: 'warning',
      low: 'info'
    };
    return colors[priority] || 'secondary';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      categorization: 'layers',
      controls: 'shield-check',
      compliance: 'check-circle',
      implementation: 'settings',
      assessment: 'eye',
      monitoring: 'activity'
    };
    return icons[category] || 'cpu';
  };

  if (!systemData) {
    return (
      <Card className="border-0">
        <CardBody className="text-center py-4">
          <Icon name="cpu" className="text-muted mb-2" style={{ fontSize: '2rem' }}></Icon>
          <p className="text-muted mb-0">No system data available for AI analysis</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="ai-insights-panel">
      {/* AI Health Status */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">
          <Icon name="cpu" className="text-primary me-2"></Icon>
          AI-Powered Insights
        </h6>
        <div className="d-flex align-items-center gap-2">
          <Badge 
            color={aiHealth.status === 'healthy' ? 'success' : aiHealth.status === 'degraded' ? 'warning' : 'danger'}
            className="badge-dim"
          >
            <Icon name="activity" className="me-1"></Icon>
            AI {aiHealth.status}
          </Badge>
          <Button color="outline-light" size="sm" onClick={loadAIInsights} disabled={loading}>
            <Icon name={loading ? 'loader' : 'reload'} className={loading ? 'spinning' : ''}></Icon>
          </Button>
        </div>
      </div>

      {/* Insights List */}
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
          <span className="text-muted">Analyzing system with AI...</span>
        </div>
      ) : insights.length > 0 ? (
        <div className="insights-list">
          {insights.map((insight) => (
            <Card key={insight.id} className="mb-3 border-start border-primary border-3">
              <CardBody className="p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center">
                    <Icon 
                      name={getCategoryIcon(insight.category)} 
                      className="text-primary me-2"
                    ></Icon>
                    <div>
                      <h6 className="mb-1">{insight.title}</h6>
                      <Badge color={getPriorityColor(insight.priority)} className="badge-dim me-2">
                        {insight.priority.toUpperCase()}
                      </Badge>
                      {showConfidenceScores && (
                        <Badge color={getConfidenceColor(insight.confidence)} className="badge-dim">
                          {insight.confidence}% confidence
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    color="outline-primary" 
                    size="sm"
                    onClick={() => {
                      setSelectedInsight(insight);
                      setDetailModal(true);
                    }}
                  >
                    <Icon name="eye"></Icon>
                  </Button>
                </div>
                
                <p className="text-muted mb-2 small">{insight.description}</p>
                
                {showConfidenceScores && (
                  <div className="mb-2">
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>AI Confidence</span>
                      <span>{insight.confidence}%</span>
                    </div>
                    <Progress 
                      value={insight.confidence} 
                      color={getConfidenceColor(insight.confidence)}
                      size="sm"
                    />
                  </div>
                )}

                <div className="d-flex gap-2">
                  <Button 
                    color="success" 
                    size="sm"
                    onClick={() => handleAcceptRecommendation(insight)}
                  >
                    <Icon name="check" className="me-1"></Icon>
                    Accept
                  </Button>
                  <Button 
                    color="outline-secondary" 
                    size="sm"
                    onClick={() => handleRejectRecommendation(insight)}
                  >
                    <Icon name="x" className="me-1"></Icon>
                    Dismiss
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Alert color="info" className="mb-0">
          <Icon name="info" className="me-2"></Icon>
          No AI insights available for the current system and step. AI will provide recommendations as you progress through the RMF process.
        </Alert>
      )}

      {/* Acceptance History Summary */}
      {acceptanceHistory.length > 0 && (
        <div className="mt-3 pt-3 border-top">
          <small className="text-muted">
            <Icon name="history" className="me-1"></Icon>
            {acceptanceHistory.filter(h => h.action === 'accepted').length} recommendations accepted, {' '}
            {acceptanceHistory.filter(h => h.action === 'rejected').length} dismissed
          </small>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={detailModal} toggle={() => setDetailModal(false)} size="lg">
        <ModalHeader toggle={() => setDetailModal(false)}>
          {selectedInsight && (
            <div className="d-flex align-items-center">
              <Icon name={getCategoryIcon(selectedInsight.category)} className="text-primary me-2"></Icon>
              <div>
                <div>{selectedInsight.title}</div>
                <small className="text-muted">AI-Generated Recommendation</small>
              </div>
            </div>
          )}
        </ModalHeader>
        <ModalBody>
          {selectedInsight && (
            <div>
              {/* Confidence and Priority */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="d-flex align-items-center">
                    <Icon name="target" className="text-primary me-2"></Icon>
                    <div>
                      <div className="small text-muted">Confidence Score</div>
                      <div className="fw-bold">{selectedInsight.confidence}%</div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-center">
                    <Icon name="flag" className="text-warning me-2"></Icon>
                    <div>
                      <div className="small text-muted">Priority Level</div>
                      <Badge color={getPriorityColor(selectedInsight.priority)}>
                        {selectedInsight.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h6 className="mb-2">Description</h6>
                <p className="text-muted">{selectedInsight.description}</p>
              </div>

              {/* AI Reasoning */}
              <div className="mb-4">
                <h6 className="mb-2">AI Analysis & Reasoning</h6>
                <div className="p-3 bg-light rounded">
                  <p className="mb-2">{selectedInsight.recommendation.reasoning}</p>
                  <div className="small text-muted">
                    <strong>Expected Impact:</strong> {selectedInsight.recommendation.impact}
                  </div>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="mb-4">
                <h6 className="mb-2">Recommended Action</h6>
                <div className="p-3 border rounded">
                  <div className="d-flex align-items-center mb-2">
                    <Icon name="arrow-right" className="text-success me-2"></Icon>
                    <code className="small">{selectedInsight.recommendation.action}</code>
                  </div>
                  {selectedInsight.recommendation.parameters && (
                    <div className="small text-muted">
                      <strong>Parameters:</strong> {JSON.stringify(selectedInsight.recommendation.parameters, null, 2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Confidence Visualization */}
              <div className="mb-4">
                <h6 className="mb-2">Confidence Breakdown</h6>
                <Progress 
                  value={selectedInsight.confidence} 
                  color={getConfidenceColor(selectedInsight.confidence)}
                  className="mb-2"
                />
                <div className="small text-muted">
                  Based on analysis of similar systems and NIST guidelines
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <div className="d-flex gap-2 w-100">
            <Button 
              color="success" 
              onClick={() => selectedInsight && handleAcceptRecommendation(selectedInsight)}
              className="flex-fill"
            >
              <Icon name="check" className="me-1"></Icon>
              Accept Recommendation
            </Button>
            <Button 
              color="outline-danger" 
              onClick={() => selectedInsight && handleRejectRecommendation(selectedInsight)}
              className="flex-fill"
            >
              <Icon name="x" className="me-1"></Icon>
              Dismiss
            </Button>
            <Button color="outline-secondary" onClick={() => setDetailModal(false)}>
              Close
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default AIInsightsPanel;
