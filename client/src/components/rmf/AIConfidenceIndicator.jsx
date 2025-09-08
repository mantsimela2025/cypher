/**
 * AI Confidence Indicator Component
 * Visual indicator for AI recommendation confidence with detailed breakdown
 */

import React, { useState } from 'react';
import { Badge, Progress, Tooltip, Card, CardBody } from 'reactstrap';
import { Icon } from '@/components/Component';

const AIConfidenceIndicator = ({ 
  confidence = 0, 
  breakdown = null, 
  showDetails = false, 
  size = 'normal', // 'small', 'normal', 'large'
  variant = 'badge', // 'badge', 'progress', 'detailed'
  tooltip = true,
  className = ''
}) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // Confidence level classification
  const getConfidenceLevel = (score) => {
    if (score >= 90) return { level: 'very_high', label: 'Very High', color: 'success' };
    if (score >= 75) return { level: 'high', label: 'High', color: 'info' };
    if (score >= 60) return { level: 'medium', label: 'Medium', color: 'warning' };
    if (score >= 40) return { level: 'low', label: 'Low', color: 'danger' };
    return { level: 'very_low', label: 'Very Low', color: 'secondary' };
  };

  const confidenceInfo = getConfidenceLevel(confidence);

  // Size configurations
  const sizeConfig = {
    small: { 
      badgeClass: 'badge-sm', 
      progressHeight: '4px', 
      iconSize: '0.8rem',
      fontSize: '0.75rem'
    },
    normal: { 
      badgeClass: '', 
      progressHeight: '6px', 
      iconSize: '1rem',
      fontSize: '0.875rem'
    },
    large: { 
      badgeClass: 'badge-lg', 
      progressHeight: '8px', 
      iconSize: '1.2rem',
      fontSize: '1rem'
    }
  };

  const config = sizeConfig[size] || sizeConfig.normal;

  // Default breakdown if not provided
  const defaultBreakdown = {
    dataQuality: Math.min(100, confidence + Math.random() * 10 - 5),
    modelAccuracy: Math.min(100, confidence + Math.random() * 8 - 4),
    contextRelevance: Math.min(100, confidence + Math.random() * 6 - 3),
    historicalPerformance: Math.min(100, confidence + Math.random() * 12 - 6)
  };

  const confidenceBreakdown = breakdown || defaultBreakdown;

  // Tooltip content
  const tooltipContent = (
    <div style={{ textAlign: 'left', minWidth: '200px' }}>
      <div className="fw-bold mb-2">AI Confidence Breakdown</div>
      <div className="small">
        <div className="d-flex justify-content-between mb-1">
          <span>Data Quality:</span>
          <span>{Math.round(confidenceBreakdown.dataQuality)}%</span>
        </div>
        <div className="d-flex justify-content-between mb-1">
          <span>Model Accuracy:</span>
          <span>{Math.round(confidenceBreakdown.modelAccuracy)}%</span>
        </div>
        <div className="d-flex justify-content-between mb-1">
          <span>Context Relevance:</span>
          <span>{Math.round(confidenceBreakdown.contextRelevance)}%</span>
        </div>
        <div className="d-flex justify-content-between">
          <span>Historical Performance:</span>
          <span>{Math.round(confidenceBreakdown.historicalPerformance)}%</span>
        </div>
      </div>
    </div>
  );

  // Badge variant
  if (variant === 'badge') {
    const badgeElement = (
      <Badge 
        color={confidenceInfo.color} 
        className={`${config.badgeClass} ${className}`}
        id={tooltip ? `confidence-badge-${Math.random().toString(36).substr(2, 9)}` : undefined}
        style={{ fontSize: config.fontSize }}
      >
        <Icon name="cpu" className="me-1" style={{ fontSize: config.iconSize }}></Icon>
        {confidence}% {size !== 'small' && confidenceInfo.label}
      </Badge>
    );

    return tooltip ? (
      <>
        {badgeElement}
        <Tooltip 
          placement="top" 
          isOpen={tooltipOpen} 
          target={badgeElement.props.id}
          toggle={() => setTooltipOpen(!tooltipOpen)}
        >
          {tooltipContent}
        </Tooltip>
      </>
    ) : badgeElement;
  }

  // Progress variant
  if (variant === 'progress') {
    const progressId = `confidence-progress-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className={className}>
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className="small text-muted">AI Confidence</span>
          <Badge color={confidenceInfo.color} className={config.badgeClass}>
            {confidence}%
          </Badge>
        </div>
        <Progress 
          value={confidence} 
          color={confidenceInfo.color}
          style={{ height: config.progressHeight }}
          id={tooltip ? progressId : undefined}
        />
        {tooltip && (
          <Tooltip 
            placement="top" 
            isOpen={tooltipOpen} 
            target={progressId}
            toggle={() => setTooltipOpen(!tooltipOpen)}
          >
            {tooltipContent}
          </Tooltip>
        )}
      </div>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <Card className={`border-${confidenceInfo.color} ${className}`}>
        <CardBody className="p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">
              <Icon name="cpu" className="text-primary me-2"></Icon>
              AI Confidence Analysis
            </h6>
            <Badge color={confidenceInfo.color} className="fs-6">
              {confidence}% {confidenceInfo.label}
            </Badge>
          </div>

          {/* Overall Confidence */}
          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <span className="small fw-bold">Overall Confidence</span>
              <span className="small">{confidence}%</span>
            </div>
            <Progress value={confidence} color={confidenceInfo.color} />
          </div>

          {/* Confidence Breakdown */}
          <div className="confidence-breakdown">
            <h6 className="small fw-bold mb-2">Confidence Factors</h6>
            
            <div className="mb-2">
              <div className="d-flex justify-content-between mb-1">
                <span className="small">Data Quality</span>
                <span className="small">{Math.round(confidenceBreakdown.dataQuality)}%</span>
              </div>
              <Progress 
                value={confidenceBreakdown.dataQuality} 
                color={getConfidenceLevel(confidenceBreakdown.dataQuality).color}
                size="sm"
              />
            </div>

            <div className="mb-2">
              <div className="d-flex justify-content-between mb-1">
                <span className="small">Model Accuracy</span>
                <span className="small">{Math.round(confidenceBreakdown.modelAccuracy)}%</span>
              </div>
              <Progress 
                value={confidenceBreakdown.modelAccuracy} 
                color={getConfidenceLevel(confidenceBreakdown.modelAccuracy).color}
                size="sm"
              />
            </div>

            <div className="mb-2">
              <div className="d-flex justify-content-between mb-1">
                <span className="small">Context Relevance</span>
                <span className="small">{Math.round(confidenceBreakdown.contextRelevance)}%</span>
              </div>
              <Progress 
                value={confidenceBreakdown.contextRelevance} 
                color={getConfidenceLevel(confidenceBreakdown.contextRelevance).color}
                size="sm"
              />
            </div>

            <div className="mb-2">
              <div className="d-flex justify-content-between mb-1">
                <span className="small">Historical Performance</span>
                <span className="small">{Math.round(confidenceBreakdown.historicalPerformance)}%</span>
              </div>
              <Progress 
                value={confidenceBreakdown.historicalPerformance} 
                color={getConfidenceLevel(confidenceBreakdown.historicalPerformance).color}
                size="sm"
              />
            </div>
          </div>

          {/* Confidence Interpretation */}
          <div className="mt-3 pt-3 border-top">
            <div className="small text-muted">
              <Icon name="info" className="me-1"></Icon>
              <strong>Interpretation:</strong> {getConfidenceInterpretation(confidence)}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return null;
};

// Helper function for confidence interpretation
const getConfidenceInterpretation = (confidence) => {
  if (confidence >= 90) {
    return "Extremely reliable recommendation. AI has high certainty based on comprehensive analysis.";
  }
  if (confidence >= 75) {
    return "Highly reliable recommendation. AI analysis shows strong confidence in the suggestion.";
  }
  if (confidence >= 60) {
    return "Moderately reliable recommendation. Consider reviewing with subject matter expert.";
  }
  if (confidence >= 40) {
    return "Low confidence recommendation. Manual review and validation strongly recommended.";
  }
  return "Very low confidence. AI recommendation should be used as guidance only.";
};

export default AIConfidenceIndicator;
