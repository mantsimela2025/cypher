/**
 * AI Implementation Assistant Component
 * Provides AI-powered implementation guidance for RMF security controls
 * Integrates with the IMPLEMENT step workflow
 */

import React, { useState, useEffect } from "react";
import {
  Icon,
  Button,
  PreviewCard,
  Row,
  Col,
} from "@/components/Component";

const AIImplementationAssistant = ({ 
  selectedControls = [],
  systemData = {},
  onGuidanceReceived = () => {},
  className = ""
}) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [activeControl, setActiveControl] = useState(null);
  const [guidance, setGuidance] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState(null);

  // Initialize with welcome message
  useEffect(() => {
    setChatMessages([
      {
        type: 'ai',
        message: `👋 Hello! I'm your AI Implementation Assistant. I can help you implement the security controls selected for your ${systemData.name || 'system'}. Ask me about specific controls, configuration guidance, or implementation best practices!`,
        timestamp: new Date()
      }
    ]);
  }, [systemData.name]);

  /**
   * Get control-specific implementation guidance
   */
  const getControlGuidance = async (controlId) => {
    setAiLoading(true);
    setError(null);

    try {
      // Mock AI response for now - replace with actual API call
      const mockGuidance = {
        'AC-1': {
          title: 'Access Control Policy and Procedures',
          steps: [
            'Develop organizational access control policy',
            'Define access control procedures',
            'Assign roles and responsibilities',
            'Review and update annually'
          ],
          templates: ['Access Control Policy Template', 'Procedure Checklist'],
          timeline: '2-4 weeks',
          priority: 'HIGH',
          dependencies: ['Organizational policies framework']
        },
        'AC-2': {
          title: 'Account Management',
          steps: [
            'Implement automated account management system',
            'Define account types and privileges',
            'Establish account creation/modification procedures',
            'Set up account monitoring and review processes'
          ],
          templates: ['Account Management Procedures', 'Account Review Checklist'],
          timeline: '3-6 weeks',
          priority: 'HIGH',
          dependencies: ['AC-1 Policy established']
        },
        'SC-7': {
          title: 'Boundary Protection',
          steps: [
            'Deploy network firewalls and security gateways',
            'Configure network segmentation',
            'Implement intrusion detection systems',
            'Establish monitoring and logging'
          ],
          templates: ['Firewall Configuration Guide', 'Network Diagram Template'],
          timeline: '4-8 weeks',
          priority: 'HIGH',
          dependencies: ['Network architecture design']
        }
      };

      const controlGuidance = mockGuidance[controlId] || {
        title: `${controlId} Implementation`,
        steps: ['Review control requirements', 'Plan implementation approach', 'Deploy and configure', 'Test and validate'],
        templates: ['Implementation Checklist'],
        timeline: '2-4 weeks',
        priority: 'MEDIUM',
        dependencies: ['System documentation']
      };

      setGuidance(prev => ({
        ...prev,
        [controlId]: controlGuidance
      }));

      setActiveControl(controlId);
      
      // Add AI message to chat
      setChatMessages(prev => [...prev, {
        type: 'ai',
        message: `Here's the implementation guidance for ${controlId} - ${controlGuidance.title}. This typically takes ${controlGuidance.timeline} to implement.`,
        timestamp: new Date(),
        controlId: controlId
      }]);

    } catch (error) {
      console.error('❌ Failed to get control guidance:', error);
      setError('Failed to get implementation guidance. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  /**
   * Handle user chat input
   */
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    // Add user message
    const userMessage = {
      type: 'user',
      message: userInput,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);

    // Mock AI response based on input
    const input = userInput.toLowerCase();
    let aiResponse = '';

    if (input.includes('ac-') || input.includes('access control')) {
      aiResponse = '🔐 For Access Control implementation, I recommend starting with AC-1 (Policy) first, then AC-2 (Account Management). Would you like specific guidance on either of these?';
    } else if (input.includes('sc-') || input.includes('system protection')) {
      aiResponse = '🛡️ System and Communications Protection controls are critical. SC-7 (Boundary Protection) is usually the foundation. Need help with firewall configuration?';
    } else if (input.includes('timeline') || input.includes('schedule')) {
      aiResponse = '📅 Based on your HIGH baseline, I recommend a phased approach: Phase 1 (0-30 days): AC-1, AC-2; Phase 2 (30-60 days): SC-7, AU-2; Phase 3 (60-90 days): CM controls.';
    } else if (input.includes('help') || input.includes('how')) {
      aiResponse = '💡 I can help with: 1) Control-specific implementation steps, 2) Configuration templates, 3) Timeline planning, 4) Best practices, 5) Troubleshooting. What would you like to know?';
    } else {
      aiResponse = `I understand you're asking about "${userInput}". Let me provide some general implementation guidance. For specific controls, try asking about AC-1, AC-2, SC-7, or other control IDs.`;
    }

    // Add AI response
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        type: 'ai',
        message: aiResponse,
        timestamp: new Date()
      }]);
    }, 1000);

    setUserInput('');
  };

  return (
    <div className={`ai-implementation-assistant ${className}`}>
      <PreviewCard>
        <div className="card-inner">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6>
                <Icon name="cpu" className="me-2 text-primary"></Icon>
                AI Implementation Assistant
              </h6>
              <p className="text-soft mb-0">
                Get AI-powered guidance for implementing your security controls
              </p>
            </div>
            <div className="d-flex gap-2">
              <span className="badge bg-success">
                <Icon name="check-circle" className="me-1"></Icon>
                Online
              </span>
            </div>
          </div>

          <Row className="g-4">
            {/* Quick Control Actions */}
            <Col md="4">
              <div className="border rounded p-3">
                <h6 className="mb-3">
                  <Icon name="list-check" className="me-2"></Icon>
                  Quick Control Help
                </h6>
                <div className="d-grid gap-2">
                  {['AC-1', 'AC-2', 'SC-7', 'AU-2'].map(controlId => (
                    <Button
                      key={controlId}
                      color="outline-primary"
                      size="sm"
                      onClick={() => getControlGuidance(controlId)}
                      disabled={aiLoading}
                    >
                      {controlId} Guidance
                    </Button>
                  ))}
                </div>
              </div>
            </Col>

            {/* Chat Interface */}
            <Col md="8">
              <div className="border rounded">
                {/* Chat Messages */}
                <div className="p-3" style={{ height: '300px', overflowY: 'auto' }}>
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`mb-3 d-flex ${msg.type === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                      <div className={`p-2 rounded max-w-75 ${msg.type === 'user' ? 'bg-primary text-white' : 'bg-light'}`}>
                        <div className="small">{msg.message}</div>
                        <div className="text-muted small mt-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="d-flex justify-content-start mb-3">
                      <div className="bg-light p-2 rounded">
                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                        AI is thinking...
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="border-top p-3">
                  <form onSubmit={handleChatSubmit}>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ask about control implementation, timelines, best practices..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        disabled={aiLoading}
                      />
                      <Button type="submit" color="primary" disabled={aiLoading || !userInput.trim()}>
                        <Icon name="send"></Icon>
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </Col>
          </Row>

          {/* Active Control Guidance */}
          {activeControl && guidance[activeControl] && (
            <div className="mt-4">
              <div className="alert alert-info">
                <h6 className="mb-2">
                  <Icon name="info" className="me-2"></Icon>
                  {activeControl} - {guidance[activeControl].title}
                </h6>
                <Row>
                  <Col md="6">
                    <strong>Implementation Steps:</strong>
                    <ol className="mt-2">
                      {guidance[activeControl].steps.map((step, index) => (
                        <li key={index} className="small">{step}</li>
                      ))}
                    </ol>
                  </Col>
                  <Col md="6">
                    <div className="mb-2">
                      <strong>Timeline:</strong> <span className="badge bg-info">{guidance[activeControl].timeline}</span>
                    </div>
                    <div className="mb-2">
                      <strong>Priority:</strong> <span className={`badge ${guidance[activeControl].priority === 'HIGH' ? 'bg-danger' : 'bg-warning'}`}>
                        {guidance[activeControl].priority}
                      </span>
                    </div>
                    <div>
                      <strong>Templates Available:</strong>
                      <div className="mt-1">
                        {guidance[activeControl].templates.map((template, index) => (
                          <span key={index} className="badge bg-light text-dark me-1">{template}</span>
                        ))}
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger mt-3">
              <Icon name="alert-circle" className="me-2"></Icon>
              {error}
            </div>
          )}
        </div>
      </PreviewCard>
    </div>
  );
};

export default AIImplementationAssistant;
