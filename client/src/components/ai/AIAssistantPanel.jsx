/**
 * AI Assistant Panel Component
 * Provides AI-powered FIPS 199 categorization assistance for RMF systems
 * Integrates seamlessly with existing RMF categorization workflow
 */

import React, { useState, useEffect } from "react";
import {
  Icon,
  Button,
  PreviewCard,
} from "@/components/Component";
import { rmfAIApi } from "@/utils/rmfAIApi";

const AIAssistantPanel = ({ 
  systemData = {}, 
  onAIResult = () => {}, 
  disabled = false,
  className = ""
}) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const [error, setError] = useState(null);

  // Reset AI result when system data changes significantly
  useEffect(() => {
    if (aiResult && (
      aiResult.systemName !== systemData.name ||
      aiResult.systemDescription !== systemData.description
    )) {
      setAiResult(null);
      setError(null);
    }
  }, [systemData.name, systemData.description, aiResult]);

  /**
   * Get impact level color for badges
   */
  const getImpactColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'LOW': return 'success';
      case 'MODERATE': return 'warning';
      case 'HIGH': return 'danger';
      default: return 'secondary';
    }
  };

  /**
   * Check if system data is sufficient for AI analysis
   */
  const canAnalyze = () => {
    return systemData.name && 
           systemData.name.trim().length >= 2 && 
           systemData.description && 
           systemData.description.trim().length >= 10;
  };

  /**
   * Handle AI analysis request
   */
  const handleAIAnalysis = async () => {
    if (!canAnalyze()) {
      setError('Please provide system name and description (minimum 10 characters) before AI analysis.');
      return;
    }

    setAiLoading(true);
    setError(null);

    try {
      console.log('🤖 Starting AI analysis for system:', systemData.name);
      
      // Prepare data for AI analysis
      const analysisData = {
        name: systemData.name,
        description: systemData.description,
        dataTypes: systemData.dataTypes || [],
        businessProcesses: systemData.businessProcesses || [],
        environment: systemData.environment || systemData.systemType || 'Not specified',
        userBase: systemData.userBase || 'Not specified'
      };

      const result = await rmfAIApi.categorizeSystem(analysisData);
      
      if (result.success && result.data.categorization) {
        const categorization = result.data.categorization;
        
        // Store additional metadata for comparison
        const enhancedResult = {
          ...categorization,
          systemName: systemData.name,
          systemDescription: systemData.description,
          analysisTimestamp: new Date().toISOString()
        };
        
        setAiResult(enhancedResult);
        console.log('✅ AI analysis completed:', enhancedResult);
      } else {
        throw new Error(result.message || 'AI analysis failed');
      }
    } catch (error) {
      console.error('❌ AI analysis error:', error);
      setError(error.message || 'AI analysis failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  /**
   * Handle applying AI suggestions to form
   */
  const handleApplyAISuggestions = () => {
    if (aiResult && onAIResult) {
      console.log('✅ Applying AI suggestions to form');
      onAIResult(aiResult);
    }
  };

  /**
   * Handle retrying AI analysis
   */
  const handleRetry = () => {
    setAiResult(null);
    setError(null);
    handleAIAnalysis();
  };

  return (
    <PreviewCard className={`h-100 ${className}`}>
      <div className="card-inner">
        {/* Header */}
        <div className="card-title-group mb-3">
          <div className="card-title">
            <h6 className="title d-flex align-items-center">
              <Icon name="cpu" className="me-2"></Icon>
              AI Assistant
            </h6>
          </div>
          {aiResult && (
            <div className="card-tools">
              <button 
                className="btn btn-sm btn-icon btn-outline-light"
                onClick={() => setAiResult(null)}
                title="Reset AI Analysis"
              >
                <Icon name="refresh"></Icon>
              </button>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="alert alert-danger alert-dismissible">
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError(null)}
            ></button>
            <div className="alert-text">
              <h6>Analysis Failed</h6>
              <p className="mb-2">{error}</p>
              <Button color="danger" size="sm" onClick={handleRetry}>
                <Icon name="refresh" className="me-1"></Icon>
                Retry Analysis
              </Button>
            </div>
          </div>
        )}

        {/* Initial State - No AI Result */}
        {!aiResult && !error && (
          <div className="text-center">
            <div className="mb-3">
              <Icon name="cpu" className="text-primary" style={{fontSize: '2rem'}}></Icon>
            </div>
            <h6 className="mb-2">FIPS 199 AI Analysis</h6>
            <p className="text-soft mb-3 small">
              Get AI-powered system categorization based on NIST guidelines. 
              The AI will analyze your system characteristics and recommend appropriate impact levels.
            </p>
            
            {!canAnalyze() && (
              <div className="alert alert-light mb-3">
                <p className="mb-0 small">
                  <Icon name="info" className="me-1"></Icon>
                  Please provide system name and description to enable AI analysis.
                </p>
              </div>
            )}
            
            <Button 
              color="primary" 
              size="sm"
              onClick={handleAIAnalysis}
              disabled={disabled || aiLoading || !canAnalyze()}
              className="btn-block"
            >
              {aiLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Analyzing System...
                </>
              ) : (
                <>
                  <Icon name="cpu" className="me-2"></Icon>
                  Analyze with AI
                </>
              )}
            </Button>
            
            {aiLoading && (
              <div className="mt-3">
                <div className="progress" style={{height: '4px'}}>
                  <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary" style={{width: '100%'}}></div>
                </div>
                <p className="text-soft mt-2 small">
                  AI is analyzing system characteristics and determining impact levels...
                </p>
              </div>
            )}
          </div>
        )}

        {/* AI Results Display */}
        {aiResult && !error && (
          <div>
            {/* Confidence Score */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Analysis Results</h6>
                <span className="text-soft small">
                  {new Date(aiResult.analysisTimestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="d-flex align-items-center mb-2">
                <span className="text-soft me-2 small">Confidence:</span>
                <div className="progress flex-grow-1 me-2" style={{height: '8px'}}>
                  <div 
                    className={`progress-bar ${aiResult.confidence >= 80 ? 'bg-success' : aiResult.confidence >= 60 ? 'bg-warning' : 'bg-danger'}`}
                    style={{width: `${aiResult.confidence}%`}}
                  ></div>
                </div>
                <span className={`fw-bold ${aiResult.confidence >= 80 ? 'text-success' : aiResult.confidence >= 60 ? 'text-warning' : 'text-danger'}`}>
                  {aiResult.confidence}%
                </span>
              </div>
            </div>

            {/* Impact Levels */}
            <div className="mb-3">
              <h6 className="mb-2">Impact Assessment</h6>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-soft">Confidentiality:</span>
                <span className={`badge badge-${getImpactColor(aiResult.confidentiality)}`}>
                  {aiResult.confidentiality}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-soft">Integrity:</span>
                <span className={`badge badge-${getImpactColor(aiResult.integrity)}`}>
                  {aiResult.integrity}
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-soft">Availability:</span>
                <span className={`badge badge-${getImpactColor(aiResult.availability)}`}>
                  {aiResult.availability}
                </span>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold">Overall Impact:</span>
                <span className={`badge badge-lg badge-${getImpactColor(aiResult.overall)}`}>
                  {aiResult.overall}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-grid gap-2 mb-3">
              <Button 
                color="success" 
                size="sm"
                onClick={handleApplyAISuggestions}
                className="btn-block"
              >
                <Icon name="check" className="me-2"></Icon>
                Apply AI Suggestions
              </Button>
              <Button 
                color="light" 
                size="sm"
                onClick={() => setShowReasoning(!showReasoning)}
                className="btn-block"
              >
                <Icon name={showReasoning ? "eye-off" : "info"} className="me-2"></Icon>
                {showReasoning ? 'Hide' : 'Show'} AI Reasoning
              </Button>
            </div>

            {/* AI Reasoning (Collapsible) */}
            {showReasoning && aiResult.reasoning && (
              <div className="alert alert-light">
                <h6 className="alert-heading d-flex align-items-center">
                  <Icon name="bulb" className="me-2"></Icon>
                  AI Analysis Reasoning
                </h6>
                <p className="mb-0 small" style={{lineHeight: '1.4'}}>
                  {aiResult.reasoning}
                </p>
                
                {/* Risk Factors */}
                {aiResult.risk_factors && aiResult.risk_factors.length > 0 && (
                  <div className="mt-3">
                    <h6 className="small mb-2">Key Risk Factors:</h6>
                    <ul className="mb-0 small">
                      {aiResult.risk_factors.map((factor, index) => (
                        <li key={index}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Recommendations */}
                {aiResult.recommendations && (
                  <div className="mt-3">
                    <h6 className="small mb-2">Recommendations:</h6>
                    <p className="mb-0 small">{aiResult.recommendations}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </PreviewCard>
  );
};

export default AIAssistantPanel;
