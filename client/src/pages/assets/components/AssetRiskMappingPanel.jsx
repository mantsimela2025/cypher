import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Badge,
  Spinner,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Alert,
  Card,
  CardBody,
  CardHeader,
  Table
} from "reactstrap";
import { Icon } from "@/components/Component";
import SlideOutPanel from "@/components/partials/SlideOutPanel";
import { assetRiskMappingApi } from "@/utils/assetRiskMappingApi";
import { toast } from "react-toastify";
import "./AssetSlideOutPanels.css";

const AssetRiskMappingPanel = ({ isOpen, onClose, assetUuid, assetData }) => {
  const [mappingData, setMappingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    existingAssetId: '',
    riskModelId: '',
    costCenterId: '',
    mappingConfidence: '0.85',
    mappingMethod: 'automatic',
    mappingCriteria: '',
    notes: ''
  });

  // Fetch mapping data when panel opens
  useEffect(() => {
    if (isOpen && assetUuid) {
      fetchMappingData();
    }
  }, [isOpen, assetUuid]);

  const fetchMappingData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Fetching risk mapping for asset:', assetUuid);
      console.log('🔑 Auth token available:', !!localStorage.getItem('accessToken'));
      console.log('🌐 API URL:', `http://localhost:3001/api/v1/asset-management/risk-mapping?assetUuid=${assetUuid}`);

      const response = await assetRiskMappingApi.getRiskMappings(assetUuid, {
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      console.log('📡 API Response:', response);
      console.log('📊 Response data type:', typeof response.data);
      console.log('📊 Response data length:', response.data?.length);
      
      if (response.data) {
        setMappingData(response.data);
      } else {
        setMappingData([]);
      }
    } catch (err) {
      console.error('❌ Error fetching risk mapping:', err);
      setError(err.message);
      setMappingData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      existingAssetId: record.existingAssetId || '',
      riskModelId: record.riskModelId || '',
      costCenterId: record.costCenterId || '',
      mappingConfidence: record.mappingConfidence || '0.85',
      mappingMethod: record.mappingMethod || 'automatic',
      mappingCriteria: record.mappingCriteria ? JSON.stringify(record.mappingCriteria, null, 2) : '',
      notes: record.notes || ''
    });
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setEditingRecord(null);
    setFormData({
      existingAssetId: '',
      riskModelId: '',
      costCenterId: '',
      mappingConfidence: '0.85',
      mappingMethod: 'automatic',
      mappingCriteria: '',
      notes: ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let mappingCriteria = null;
      if (formData.mappingCriteria.trim()) {
        try {
          mappingCriteria = JSON.parse(formData.mappingCriteria);
        } catch (e) {
          throw new Error('Invalid JSON format in mapping criteria');
        }
      }

      const payload = {
        assetUuid: assetUuid,
        existingAssetId: parseInt(formData.existingAssetId) || null,
        riskModelId: parseInt(formData.riskModelId) || null,
        costCenterId: parseInt(formData.costCenterId) || null,
        mappingConfidence: parseFloat(formData.mappingConfidence),
        mappingMethod: formData.mappingMethod,
        mappingCriteria: mappingCriteria,
        notes: formData.notes || null
      };

      // Validate the data
      const validation = assetRiskMappingApi.validateMappingData(payload);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      if (editingRecord) {
        await assetRiskMappingApi.updateRiskMapping(editingRecord.id, payload);
        toast.success('Risk mapping updated successfully');
      } else {
        await assetRiskMappingApi.createRiskMapping(payload);
        toast.success('Risk mapping created successfully');
      }

      await fetchMappingData();
      setIsEditing(false);
      setEditingRecord(null);
    } catch (err) {
      console.error('❌ Error saving risk mapping:', err);
      setError(err.message);
      toast.error('Failed to save risk mapping');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingRecord(null);
    setError(null);
  };

  const handleDelete = async (record) => {
    if (!window.confirm('Are you sure you want to delete this risk mapping record?')) {
      return;
    }

    setLoading(true);
    try {
      await assetRiskMappingApi.deleteRiskMapping(record.id);
      toast.success('Risk mapping record deleted successfully');
      await fetchMappingData();
    } catch (err) {
      console.error('❌ Error deleting risk mapping record:', err);
      setError(err.message);
      toast.error('Failed to delete risk mapping record');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (record) => {
    setLoading(true);
    try {
      await assetRiskMappingApi.verifyRiskMapping(record.id, {
        verifiedAt: new Date().toISOString()
      });
      toast.success('Risk mapping verified successfully');
      await fetchMappingData();
    } catch (err) {
      console.error('❌ Error verifying risk mapping:', err);
      setError(err.message);
      toast.error('Failed to verify risk mapping');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SlideOutPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Risk Mapping"
      subtitle={assetData?.hostname || 'Asset'}
      size="lg"
    >
      <div className="asset-panel-container">
        {error && (
          <Alert color="danger" className="panel-alert">
            <Icon name="alert-circle" className="me-2" />
            {error}
          </Alert>
        )}

        {loading && !isEditing && (
          <div className="panel-loading">
            <Spinner color="primary" />
            <p className="mt-2 panel-text-muted">Loading risk mapping data...</p>
          </div>
        )}

        {!loading && !isEditing && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Risk Mapping Records</h6>
              <Button color="primary" size="sm" onClick={handleAddNew}>
                <Icon name="plus" className="me-1" />
                Add New Mapping
              </Button>
            </div>

            {mappingData.length === 0 ? (
              <Card className="panel-border-light">
                <CardBody className="panel-empty-state">
                  <Icon name="shield" className="panel-text-muted mb-2" style={{ fontSize: '2rem' }} />
                  <p className="panel-text-muted mb-0">No risk mapping records found for this asset.</p>
                  <Button color="primary" size="sm" className="mt-2" onClick={handleAddNew}>
                    <Icon name="plus" className="me-1" />
                    Add First Mapping
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <div className="panel-card-list">
                {mappingData.map((record, index) => {
                  const riskLevel = assetRiskMappingApi.getRiskLevel(record.riskModelId);
                  const verification = assetRiskMappingApi.getVerificationStatus(record);
                  const costCenterName = assetRiskMappingApi.getCostCenterName(record.costCenterId);
                  
                  return (
                    <Card key={record.id || index} className="mb-3 border-light">
                      <CardHeader className="bg-light border-bottom">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <Badge color={riskLevel.color} className="badge-dim">
                                Risk: {riskLevel.level.toUpperCase()}
                              </Badge>
                              <Badge 
                                color={assetRiskMappingApi.getConfidenceBadgeColor(record.mappingConfidence)} 
                                className="badge-dim"
                              >
                                {assetRiskMappingApi.formatConfidence(record.mappingConfidence)} Confidence
                              </Badge>
                              <Badge 
                                color={verification.color} 
                                className="badge-dim"
                              >
                                {verification.label}
                              </Badge>
                            </div>
                            <small className="text-muted">
                              Model ID: {record.riskModelId} | {costCenterName}
                            </small>
                          </div>
                          <div className="d-flex gap-1">
                            {!record.verifiedAt && (
                              <Button
                                color="success"
                                size="sm"
                                outline
                                onClick={() => handleVerify(record)}
                                title="Verify Mapping"
                              >
                                <Icon name="check-circle" />
                              </Button>
                            )}
                            <Button
                              color="primary"
                              size="sm"
                              outline
                              onClick={() => handleEdit(record)}
                            >
                              <Icon name="edit" />
                            </Button>
                            <Button
                              color="danger"
                              size="sm"
                              outline
                              onClick={() => handleDelete(record)}
                            >
                              <Icon name="trash" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <Row>
                          <Col md={6}>
                            <div className="mapping-details">
                              <div className="d-flex justify-content-between mb-1">
                                <span className="text-muted">Risk Model ID:</span>
                                <span>{record.riskModelId || 'N/A'}</span>
                              </div>
                              <div className="d-flex justify-content-between mb-1">
                                <span className="text-muted">Cost Center:</span>
                                <span>{costCenterName}</span>
                              </div>
                              <div className="d-flex justify-content-between mb-1">
                                <span className="text-muted">Method:</span>
                                <Badge 
                                  color={assetRiskMappingApi.getMethodBadgeColor(record.mappingMethod)}
                                  className="badge-dim"
                                >
                                  {assetRiskMappingApi.formatMappingMethod(record.mappingMethod)}
                                </Badge>
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="mapping-details">
                              <div className="d-flex justify-content-between mb-1">
                                <span className="text-muted">Existing Asset ID:</span>
                                <span>{record.existingAssetId || 'N/A'}</span>
                              </div>
                              <div className="d-flex justify-content-between mb-1">
                                <span className="text-muted">Created:</span>
                                <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                              </div>
                              {verification.date && (
                                <div className="d-flex justify-content-between mb-1">
                                  <span className="text-muted">Verified:</span>
                                  <span>{verification.date}</span>
                                </div>
                              )}
                            </div>
                          </Col>
                        </Row>
                        
                        {record.mappingCriteria && (
                          <div className="mt-2 pt-2 border-top">
                            <small className="text-muted d-block mb-1">
                              <Icon name="settings" className="me-1" />
                              Mapping Criteria:
                            </small>
                            <div className="criteria-list">
                              {assetRiskMappingApi.parseMappingCriteria(record.mappingCriteria).map((criterion, idx) => (
                                <div key={idx} className="d-flex justify-content-between align-items-center mb-1">
                                  <small className="text-muted">{criterion.name}:</small>
                                  <div className="d-flex align-items-center gap-1">
                                    <small>{Math.round(criterion.score * 100)}%</small>
                                    <div 
                                      className="progress-bar-mini" 
                                      style={{ 
                                        width: '40px', 
                                        height: '4px', 
                                        backgroundColor: '#e9ecef',
                                        borderRadius: '2px',
                                        overflow: 'hidden'
                                      }}
                                    >
                                      <div 
                                        style={{ 
                                          width: `${criterion.score * 100}%`, 
                                          height: '100%', 
                                          backgroundColor: '#007bff',
                                          borderRadius: '2px'
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {isEditing && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">
                {editingRecord ? 'Edit' : 'Add'} Risk Mapping
              </h6>
              <div className="d-flex gap-2">
                <Button color="secondary" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button color="primary" size="sm" onClick={handleSave} disabled={loading}>
                  {loading && <Spinner size="sm" className="me-1" />}
                  Save
                </Button>
              </div>
            </div>

            <Form>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label for="existingAssetId">Existing Asset ID</Label>
                    <Input
                      type="number"
                      id="existingAssetId"
                      name="existingAssetId"
                      value={formData.existingAssetId}
                      onChange={handleInputChange}
                      placeholder="Legacy asset identifier"
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="riskModelId">Risk Model ID</Label>
                    <Input
                      type="number"
                      id="riskModelId"
                      name="riskModelId"
                      value={formData.riskModelId}
                      onChange={handleInputChange}
                      placeholder="Risk model identifier"
                    />
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label for="costCenterId">Cost Center ID</Label>
                    <Input
                      type="number"
                      id="costCenterId"
                      name="costCenterId"
                      value={formData.costCenterId}
                      onChange={handleInputChange}
                      placeholder="Cost center identifier"
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="mappingConfidence">Mapping Confidence</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      id="mappingConfidence"
                      name="mappingConfidence"
                      value={formData.mappingConfidence}
                      onChange={handleInputChange}
                      placeholder="0.85"
                    />
                    <small className="text-muted">Value between 0 and 1 (e.g., 0.85 = 85%)</small>
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <FormGroup>
                    <Label for="mappingMethod">Mapping Method</Label>
                    <Input
                      type="select"
                      id="mappingMethod"
                      name="mappingMethod"
                      value={formData.mappingMethod}
                      onChange={handleInputChange}
                    >
                      <option value="automatic">Automatic</option>
                      <option value="manual">Manual</option>
                      <option value="hybrid">Hybrid</option>
                    </Input>
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <FormGroup>
                    <Label for="mappingCriteria">Mapping Criteria (JSON)</Label>
                    <Input
                      type="textarea"
                      id="mappingCriteria"
                      name="mappingCriteria"
                      value={formData.mappingCriteria}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder='{"criteria": ["hostname_match", "ip_match"], "scores": [0.95, 0.90]}'
                    />
                    <small className="text-muted">
                      Optional JSON object with criteria, scores, and weights
                    </small>
                  </FormGroup>
                </Col>
              </Row>
            </Form>
          </div>
        )}
      </div>
    </SlideOutPanel>
  );
};

export default AssetRiskMappingPanel;
