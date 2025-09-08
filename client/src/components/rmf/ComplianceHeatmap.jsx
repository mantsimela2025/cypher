/**
 * NIST 800-53 Compliance Heatmap Component
 * Interactive visualization of control family implementation status
 * with drill-down capabilities and detailed analytics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardBody, Modal, ModalHeader, ModalBody, Badge, Progress, Button } from 'reactstrap';
import { Icon } from '@/components/Component';
import { log } from '@/utils/config';
import { toast } from 'react-toastify';

const ComplianceHeatmap = ({ 
  data = {}, 
  onFamilyClick = null, 
  showLegend = true, 
  interactive = true,
  size = 'normal' // 'small', 'normal', 'large'
}) => {
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [detailModal, setDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [familyDetails, setFamilyDetails] = useState(null);

  // NIST 800-53 Control Families with enhanced metadata
  const controlFamilies = [
    { 
      code: 'AC', 
      name: 'Access Control', 
      description: 'Controls for limiting information system access to authorized users, processes, or devices',
      totalControls: 25,
      criticalControls: ['AC-2', 'AC-3', 'AC-6', 'AC-17']
    },
    { 
      code: 'AU', 
      name: 'Audit and Accountability', 
      description: 'Controls for creating, protecting, and retaining audit records',
      totalControls: 16,
      criticalControls: ['AU-2', 'AU-3', 'AU-6', 'AU-12']
    },
    { 
      code: 'AT', 
      name: 'Awareness and Training', 
      description: 'Controls for security awareness and training programs',
      totalControls: 6,
      criticalControls: ['AT-2', 'AT-3']
    },
    { 
      code: 'CM', 
      name: 'Configuration Management', 
      description: 'Controls for establishing and maintaining baseline configurations',
      totalControls: 14,
      criticalControls: ['CM-2', 'CM-6', 'CM-7', 'CM-8']
    },
    { 
      code: 'CP', 
      name: 'Contingency Planning', 
      description: 'Controls for establishing, maintaining, and implementing contingency plans',
      totalControls: 13,
      criticalControls: ['CP-2', 'CP-4', 'CP-9', 'CP-10']
    },
    { 
      code: 'IA', 
      name: 'Identification and Authentication', 
      description: 'Controls for identifying and authenticating users and devices',
      totalControls: 12,
      criticalControls: ['IA-2', 'IA-4', 'IA-5', 'IA-8']
    },
    { 
      code: 'IR', 
      name: 'Incident Response', 
      description: 'Controls for establishing incident response capabilities',
      totalControls: 10,
      criticalControls: ['IR-4', 'IR-6', 'IR-8']
    },
    { 
      code: 'MA', 
      name: 'Maintenance', 
      description: 'Controls for performing periodic and timely maintenance',
      totalControls: 7,
      criticalControls: ['MA-2', 'MA-4']
    },
    { 
      code: 'MP', 
      name: 'Media Protection', 
      description: 'Controls for protecting information system media',
      totalControls: 8,
      criticalControls: ['MP-2', 'MP-6']
    },
    { 
      code: 'PE', 
      name: 'Physical and Environmental Protection', 
      description: 'Controls for physical access and environmental protections',
      totalControls: 20,
      criticalControls: ['PE-2', 'PE-3', 'PE-6']
    },
    { 
      code: 'PL', 
      name: 'Planning', 
      description: 'Controls for developing, documenting, and updating security plans',
      totalControls: 9,
      criticalControls: ['PL-2', 'PL-4']
    },
    { 
      code: 'PS', 
      name: 'Personnel Security', 
      description: 'Controls for personnel security policies and procedures',
      totalControls: 8,
      criticalControls: ['PS-2', 'PS-3', 'PS-6']
    },
    { 
      code: 'RA', 
      name: 'Risk Assessment', 
      description: 'Controls for assessing and managing organizational risk',
      totalControls: 10,
      criticalControls: ['RA-3', 'RA-5']
    },
    { 
      code: 'CA', 
      name: 'Security Assessment and Authorization', 
      description: 'Controls for assessing, authorizing, and monitoring security controls',
      totalControls: 9,
      criticalControls: ['CA-2', 'CA-5', 'CA-6']
    },
    { 
      code: 'SC', 
      name: 'System and Communications Protection', 
      description: 'Controls for protecting information in processing and transit',
      totalControls: 46,
      criticalControls: ['SC-7', 'SC-8', 'SC-13', 'SC-23']
    },
    { 
      code: 'SI', 
      name: 'System and Information Integrity', 
      description: 'Controls for identifying, reporting, and correcting flaws',
      totalControls: 23,
      criticalControls: ['SI-2', 'SI-3', 'SI-4', 'SI-7']
    }
  ];

  // Color scheme for implementation levels
  const getHeatmapColor = (percentage) => {
    if (percentage >= 90) return { bg: 'success', intensity: 'high' };
    if (percentage >= 75) return { bg: 'info', intensity: 'medium-high' };
    if (percentage >= 50) return { bg: 'warning', intensity: 'medium' };
    if (percentage >= 25) return { bg: 'danger', intensity: 'low' };
    return { bg: 'secondary', intensity: 'none' };
  };

  const getTextColor = (percentage) => {
    return percentage >= 50 ? 'text-white' : 'text-dark';
  };

  // Handle family click for drill-down
  const handleFamilyClick = async (family) => {
    if (!interactive) return;

    try {
      setLoading(true);
      setSelectedFamily(family);
      
      log.info('🔍 Loading details for control family:', family.code);
      
      // Simulate API call for family details
      // In real implementation, this would fetch detailed control data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const familyData = data[family.code] || {};
      const mockDetails = {
        implementedControls: Math.floor((familyData.implementationPercentage || 0) * family.totalControls / 100),
        totalControls: family.totalControls,
        criticalControlsImplemented: Math.floor(family.criticalControls.length * (familyData.implementationPercentage || 0) / 100),
        lastAssessment: '2024-01-15',
        nextAssessment: '2024-04-15',
        riskLevel: familyData.implementationPercentage >= 75 ? 'Low' : familyData.implementationPercentage >= 50 ? 'Medium' : 'High',
        findings: Math.max(0, family.totalControls - Math.floor((familyData.implementationPercentage || 0) * family.totalControls / 100)),
        trends: {
          lastMonth: Math.random() > 0.5 ? 'improving' : 'stable',
          change: Math.floor(Math.random() * 10) - 5
        }
      };
      
      setFamilyDetails(mockDetails);
      setDetailModal(true);
      
      // Call external handler if provided
      if (onFamilyClick) {
        onFamilyClick(family, familyData);
      }
      
    } catch (error) {
      log.error('❌ Failed to load family details:', error.message);
      toast.error('Failed to load control family details');
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall statistics
  const calculateOverallStats = () => {
    const families = Object.keys(data);
    if (families.length === 0) return { average: 0, total: 0, implemented: 0 };

    const totalPercentage = families.reduce((sum, family) => {
      return sum + (data[family]?.implementationPercentage || 0);
    }, 0);

    const totalControls = controlFamilies.reduce((sum, family) => sum + family.totalControls, 0);
    const implementedControls = families.reduce((sum, familyCode) => {
      const family = controlFamilies.find(f => f.code === familyCode);
      const percentage = data[familyCode]?.implementationPercentage || 0;
      return sum + Math.floor((percentage * (family?.totalControls || 0)) / 100);
    }, 0);

    return {
      average: Math.round(totalPercentage / families.length),
      total: totalControls,
      implemented: implementedControls
    };
  };

  const stats = calculateOverallStats();

  // Size configurations
  const sizeConfig = {
    small: { cardHeight: '60px', fontSize: 'small', cols: 'col-6 col-sm-4 col-md-3 col-lg-2' },
    normal: { cardHeight: '80px', fontSize: 'normal', cols: 'col-6 col-sm-4 col-md-3 col-lg-2' },
    large: { cardHeight: '100px', fontSize: 'large', cols: 'col-6 col-sm-3 col-md-2 col-xl-1' }
  };

  const config = sizeConfig[size] || sizeConfig.normal;

  if (Object.keys(data).length === 0) {
    return (
      <Card className="border-0">
        <CardBody className="text-center py-5">
          <Icon name="grid-alt" className="text-muted mb-3" style={{ fontSize: '3rem' }}></Icon>
          <h6 className="text-muted">No compliance data available</h6>
          <p className="text-muted small mb-0">
            Control family implementation data will appear here once systems are assessed
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="compliance-heatmap">
      {/* Overall Statistics */}
      {size !== 'small' && (
        <div className="mb-4">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <Icon name="target" className="text-primary me-2"></Icon>
                <div>
                  <div className="fw-bold">{stats.average}%</div>
                  <small className="text-muted">Average Implementation</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <Icon name="check-circle" className="text-success me-2"></Icon>
                <div>
                  <div className="fw-bold">{stats.implemented}/{stats.total}</div>
                  <small className="text-muted">Controls Implemented</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-center">
                <Icon name="shield" className="text-info me-2"></Icon>
                <div>
                  <div className="fw-bold">{controlFamilies.length}</div>
                  <small className="text-muted">Control Families</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Grid */}
      <div className="row g-2">
        {controlFamilies.map((family) => {
          const familyData = data[family.code] || {};
          const percentage = familyData.implementationPercentage || 0;
          const colorScheme = getHeatmapColor(percentage);
          const textColor = getTextColor(percentage);
          
          return (
            <div key={family.code} className={config.cols}>
              <Card 
                className={`h-100 border-0 ${interactive ? 'cursor-pointer' : ''} bg-${colorScheme.bg} ${textColor}`}
                style={{ 
                  minHeight: config.cardHeight,
                  transition: 'all 0.2s ease',
                  transform: selectedFamily?.code === family.code ? 'scale(1.05)' : 'scale(1)'
                }}
                onClick={() => handleFamilyClick(family)}
                title={`${family.name}: ${percentage}% implemented (${Math.floor(percentage * family.totalControls / 100)}/${family.totalControls} controls)`}
              >
                <CardBody className="p-2 d-flex flex-column justify-content-center text-center">
                  <h6 className={`card-title mb-1 ${config.fontSize === 'small' ? 'small' : ''}`}>
                    {family.code}
                  </h6>
                  <div className="fw-bold mb-1">{percentage}%</div>
                  {size !== 'small' && (
                    <small className="opacity-75 text-truncate" style={{ fontSize: '0.7rem' }}>
                      {family.name}
                    </small>
                  )}
                  {interactive && (
                    <Icon 
                      name="eye" 
                      className="position-absolute top-0 end-0 m-1 opacity-50" 
                      style={{ fontSize: '0.8rem' }}
                    ></Icon>
                  )}
                </CardBody>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-3">
          <div className="d-flex justify-content-center align-items-center gap-3 small">
            <span className="fw-bold">Implementation Level:</span>
            <div className="d-flex align-items-center gap-1">
              <div className="bg-secondary rounded" style={{width: '12px', height: '12px'}}></div>
              <span>0%</span>
            </div>
            <div className="d-flex align-items-center gap-1">
              <div className="bg-danger rounded" style={{width: '12px', height: '12px'}}></div>
              <span>25-49%</span>
            </div>
            <div className="d-flex align-items-center gap-1">
              <div className="bg-warning rounded" style={{width: '12px', height: '12px'}}></div>
              <span>50-74%</span>
            </div>
            <div className="d-flex align-items-center gap-1">
              <div className="bg-info rounded" style={{width: '12px', height: '12px'}}></div>
              <span>75-89%</span>
            </div>
            <div className="d-flex align-items-center gap-1">
              <div className="bg-success rounded" style={{width: '12px', height: '12px'}}></div>
              <span>90%+</span>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={detailModal} toggle={() => setDetailModal(false)} size="lg">
        <ModalHeader toggle={() => setDetailModal(false)}>
          {selectedFamily && (
            <div className="d-flex align-items-center">
              <Icon name="shield" className="text-primary me-2"></Icon>
              <div>
                <div>{selectedFamily.code} - {selectedFamily.name}</div>
                <small className="text-muted">{selectedFamily.description}</small>
              </div>
            </div>
          )}
        </ModalHeader>
        <ModalBody>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-2">Loading control family details...</p>
            </div>
          ) : familyDetails && selectedFamily ? (
            <div>
              {/* Implementation Overview */}
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <div className="text-center">
                    <div className="display-6 fw-bold text-primary">
                      {Math.round((familyDetails.implementedControls / familyDetails.totalControls) * 100)}%
                    </div>
                    <small className="text-muted">Implementation Rate</small>
                  </div>
                </div>
                <div className="col-md-9">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Controls Implemented</span>
                      <span>{familyDetails.implementedControls}/{familyDetails.totalControls}</span>
                    </div>
                    <Progress 
                      value={(familyDetails.implementedControls / familyDetails.totalControls) * 100}
                      color={getHeatmapColor((familyDetails.implementedControls / familyDetails.totalControls) * 100).bg}
                    />
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Critical Controls</span>
                      <span>{familyDetails.criticalControlsImplemented}/{selectedFamily.criticalControls.length}</span>
                    </div>
                    <Progress 
                      value={(familyDetails.criticalControlsImplemented / selectedFamily.criticalControls.length) * 100}
                      color="warning"
                    />
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <Card className="border-0 bg-light">
                    <CardBody className="p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">Risk Level</div>
                          <Badge color={familyDetails.riskLevel === 'Low' ? 'success' : familyDetails.riskLevel === 'Medium' ? 'warning' : 'danger'}>
                            {familyDetails.riskLevel}
                          </Badge>
                        </div>
                        <Icon name="alert-triangle" className="text-muted"></Icon>
                      </div>
                    </CardBody>
                  </Card>
                </div>
                <div className="col-md-6">
                  <Card className="border-0 bg-light">
                    <CardBody className="p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">Open Findings</div>
                          <div className="text-danger">{familyDetails.findings}</div>
                        </div>
                        <Icon name="flag" className="text-muted"></Icon>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>

              {/* Assessment Timeline */}
              <div className="mb-4">
                <h6 className="mb-3">Assessment Timeline</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="d-flex align-items-center">
                      <Icon name="calendar" className="text-success me-2"></Icon>
                      <div>
                        <div className="small text-muted">Last Assessment</div>
                        <div>{new Date(familyDetails.lastAssessment).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex align-items-center">
                      <Icon name="clock" className="text-warning me-2"></Icon>
                      <div>
                        <div className="small text-muted">Next Assessment</div>
                        <div>{new Date(familyDetails.nextAssessment).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Critical Controls */}
              <div className="mb-4">
                <h6 className="mb-3">Critical Controls</h6>
                <div className="row g-2">
                  {selectedFamily.criticalControls.map((control, index) => (
                    <div key={control} className="col-md-6">
                      <div className="d-flex align-items-center p-2 border rounded">
                        <Badge 
                          color={index < familyDetails.criticalControlsImplemented ? 'success' : 'outline-secondary'}
                          className="me-2"
                        >
                          {control}
                        </Badge>
                        <span className="small">
                          {index < familyDetails.criticalControlsImplemented ? 'Implemented' : 'Not Implemented'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-2">
                <Button color="primary" size="sm">
                  <Icon name="file-text" className="me-1"></Icon>
                  View Assessment Report
                </Button>
                <Button color="outline-secondary" size="sm">
                  <Icon name="download" className="me-1"></Icon>
                  Export Details
                </Button>
                <Button color="outline-info" size="sm">
                  <Icon name="edit" className="me-1"></Icon>
                  Update Status
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Icon name="alert-circle" className="text-muted mb-2" style={{ fontSize: '2rem' }}></Icon>
              <p className="text-muted">No details available for this control family</p>
            </div>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};

export default ComplianceHeatmap;
