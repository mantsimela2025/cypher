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
  Alert
} from "reactstrap";
import { Icon } from "@/components/Component";
import SlideOutPanel from "@/components/partials/SlideOutPanel";
import { assetManagementApi } from "@/utils/assetManagementApi";
import "./AssetSlideOutPanels.css";

const AssetLifecyclePanel = ({ isOpen, onClose, assetUuid, assetData }) => {
  const [lifecycleData, setLifecycleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    purchaseDate: '',
    warrantyEndDate: '',
    manufacturerEolDate: '',
    internalEolDate: '',
    replacementCycleMonths: '',
    estimatedReplacementCost: '',
    replacementBudgetYear: '',
    replacementBudgetQuarter: '',
    replacementNotes: ''
  });

  // Fetch lifecycle data when panel opens
  useEffect(() => {
    if (isOpen && assetUuid) {
      fetchLifecycleData();
    }
  }, [isOpen, assetUuid]);

  const fetchLifecycleData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Fetching lifecycle data for asset:', assetUuid);
      const response = await assetManagementApi.getLifecycleRecords({ assetUuid });
      console.log('📡 API Response:', response);

      if (response.data && response.data.length > 0) {
        const lifecycle = response.data[0];
        console.log('✅ Found lifecycle data:', lifecycle);
        setLifecycleData(lifecycle);
        setFormData({
          purchaseDate: lifecycle.purchaseDate || '',
          warrantyEndDate: lifecycle.warrantyEndDate || '',
          manufacturerEolDate: lifecycle.manufacturerEolDate || '',
          internalEolDate: lifecycle.internalEolDate || '',
          replacementCycleMonths: lifecycle.replacementCycleMonths || '',
          estimatedReplacementCost: lifecycle.estimatedReplacementCost || '',
          replacementBudgetYear: lifecycle.replacementBudgetYear || '',
          replacementBudgetQuarter: lifecycle.replacementBudgetQuarter || '',
          replacementNotes: lifecycle.replacementNotes || ''
        });
      } else {
        // No lifecycle data exists, prepare for creation
        console.log('ℹ️ No lifecycle data found, switching to create mode');
        setLifecycleData(null);
        setIsEditing(true);
      }
    } catch (err) {
      console.error('❌ Error fetching lifecycle data:', err);
      console.error('Error details:', err.message);
      setError(`Failed to load lifecycle data: ${err.message}`);
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

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const dataToSave = {
        ...formData,
        assetUuid,
        // Convert empty strings to null
        purchaseDate: formData.purchaseDate || null,
        warrantyEndDate: formData.warrantyEndDate || null,
        manufacturerEolDate: formData.manufacturerEolDate || null,
        internalEolDate: formData.internalEolDate || null,
        replacementCycleMonths: formData.replacementCycleMonths ? parseInt(formData.replacementCycleMonths) : null,
        estimatedReplacementCost: formData.estimatedReplacementCost ? parseFloat(formData.estimatedReplacementCost) : null,
        replacementBudgetYear: formData.replacementBudgetYear ? parseInt(formData.replacementBudgetYear) : null,
        replacementBudgetQuarter: formData.replacementBudgetQuarter ? parseInt(formData.replacementBudgetQuarter) : null
      };

      if (lifecycleData) {
        // Update existing record
        await assetManagementApi.updateLifecycleRecord(lifecycleData.id, dataToSave);
      } else {
        // Create new record
        await assetManagementApi.createLifecycleRecord(dataToSave);
      }
      
      setIsEditing(false);
      await fetchLifecycleData(); // Refresh data
    } catch (err) {
      console.error('Error saving lifecycle data:', err);
      setError('Failed to save lifecycle data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (lifecycleData) {
      // Reset form to original data
      setFormData({
        purchaseDate: lifecycleData.purchaseDate || '',
        warrantyEndDate: lifecycleData.warrantyEndDate || '',
        manufacturerEolDate: lifecycleData.manufacturerEolDate || '',
        internalEolDate: lifecycleData.internalEolDate || '',
        replacementCycleMonths: lifecycleData.replacementCycleMonths || '',
        estimatedReplacementCost: lifecycleData.estimatedReplacementCost || '',
        replacementBudgetYear: lifecycleData.replacementBudgetYear || '',
        replacementBudgetQuarter: lifecycleData.replacementBudgetQuarter || '',
        replacementNotes: lifecycleData.replacementNotes || ''
      });
    }
  };

  const handleDelete = async () => {
    if (!lifecycleData || !window.confirm('Are you sure you want to delete this lifecycle record?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await assetManagementApi.deleteLifecycleRecord(lifecycleData.id);
      setLifecycleData(null);
      setIsEditing(true); // Switch to create mode
      setFormData({
        purchaseDate: '',
        warrantyEndDate: '',
        manufacturerEolDate: '',
        internalEolDate: '',
        replacementCycleMonths: '',
        estimatedReplacementCost: '',
        replacementBudgetYear: '',
        replacementBudgetQuarter: '',
        replacementNotes: ''
      });
    } catch (err) {
      console.error('Error deleting lifecycle data:', err);
      setError('Failed to delete lifecycle data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getQuarterText = (quarter) => {
    const quarters = { 1: 'Q1', 2: 'Q2', 3: 'Q3', 4: 'Q4' };
    return quarters[quarter] || 'Not set';
  };

  const panelTitle = (
    <>
      <Icon name="clock" className="me-2"></Icon>
      Asset Lifecycle / <strong className="text-primary small">{assetData?.hostname || 'Loading...'}</strong>
    </>
  );

  return (
    <SlideOutPanel
      isOpen={isOpen}
      onClose={onClose}
      title={panelTitle}
      width="800px"
    >
      <div className="asset-lifecycle-content">
        {loading && (
          <div className="text-center p-4">
            <Spinner size="lg" />
            <p className="mt-2">Loading lifecycle data...</p>
          </div>
        )}

        {error && (
          <Alert color="danger" className="m-3">
            {error}
          </Alert>
        )}

        {!loading && (
          <div className="p-3">
            {/* Action Buttons */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">
                {lifecycleData ? 'Lifecycle Information' : 'Create Lifecycle Record'}
              </h5>
              <div style={{ display: 'flex', gap: '8px' }}>
                {!isEditing && lifecycleData && (
                  <>
                    <Button color="primary" size="sm" onClick={() => setIsEditing(true)} style={{ height: '32px' }}>
                      <Icon name="edit" className="me-1"></Icon>
                      Edit
                    </Button>
                    <Button color="danger" size="sm" onClick={handleDelete} style={{ height: '32px' }}>
                      <Icon name="trash" className="me-1"></Icon>
                      Delete
                    </Button>
                  </>
                )}
                {isEditing && (
                  <>
                    <Button color="primary" size="sm" onClick={handleSave} disabled={loading} style={{ height: '32px' }}>
                      <Icon name="check" className="me-1"></Icon>
                      Save
                    </Button>
                    <Button color="info" size="sm" onClick={handleCancel} style={{ height: '32px' }}>
                      <Icon name="cross" className="me-1"></Icon>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            {isEditing ? (
              <Form>
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label for="purchaseDate">Purchase Date</Label>
                      <Input
                        type="date"
                        id="purchaseDate"
                        name="purchaseDate"
                        value={formData.purchaseDate}
                        onChange={handleInputChange}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="warrantyEndDate">Warranty End Date</Label>
                      <Input
                        type="date"
                        id="warrantyEndDate"
                        name="warrantyEndDate"
                        value={formData.warrantyEndDate}
                        onChange={handleInputChange}
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label for="manufacturerEolDate">Manufacturer EOL Date</Label>
                      <Input
                        type="date"
                        id="manufacturerEolDate"
                        name="manufacturerEolDate"
                        value={formData.manufacturerEolDate}
                        onChange={handleInputChange}
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="internalEolDate">Internal EOL Date</Label>
                      <Input
                        type="date"
                        id="internalEolDate"
                        name="internalEolDate"
                        value={formData.internalEolDate}
                        onChange={handleInputChange}
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label for="replacementCycleMonths">Replacement Cycle (Months)</Label>
                      <Input
                        type="number"
                        id="replacementCycleMonths"
                        name="replacementCycleMonths"
                        value={formData.replacementCycleMonths}
                        onChange={handleInputChange}
                        min="1"
                        max="240"
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="estimatedReplacementCost">Estimated Replacement Cost</Label>
                      <Input
                        type="number"
                        id="estimatedReplacementCost"
                        name="estimatedReplacementCost"
                        value={formData.estimatedReplacementCost}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label for="replacementBudgetYear">Replacement Budget Year</Label>
                      <Input
                        type="number"
                        id="replacementBudgetYear"
                        name="replacementBudgetYear"
                        value={formData.replacementBudgetYear}
                        onChange={handleInputChange}
                        min="2024"
                        max="2050"
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="replacementBudgetQuarter">Replacement Budget Quarter</Label>
                      <Input
                        type="select"
                        id="replacementBudgetQuarter"
                        name="replacementBudgetQuarter"
                        value={formData.replacementBudgetQuarter}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Quarter</option>
                        <option value="1">Q1</option>
                        <option value="2">Q2</option>
                        <option value="3">Q3</option>
                        <option value="4">Q4</option>
                      </Input>
                    </FormGroup>
                  </Col>
                </Row>

                <FormGroup>
                  <Label for="replacementNotes">Replacement Notes</Label>
                  <Input
                    type="textarea"
                    id="replacementNotes"
                    name="replacementNotes"
                    value={formData.replacementNotes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter any notes about replacement planning..."
                  />
                </FormGroup>
              </Form>
            ) : (
              <div className="lifecycle-display">
                {lifecycleData ? (
                  <div className="profile-ud-list">
                    <div className="profile-ud-item">
                      <div className="profile-ud">
                        <span className="profile-ud-label">Purchase Date</span>
                        <span className="profile-ud-value">{formatDate(lifecycleData.purchaseDate)}</span>
                      </div>
                    </div>
                    <div className="profile-ud-item">
                      <div className="profile-ud">
                        <span className="profile-ud-label">Warranty End Date</span>
                        <span className="profile-ud-value">{formatDate(lifecycleData.warrantyEndDate)}</span>
                      </div>
                    </div>
                    <div className="profile-ud-item">
                      <div className="profile-ud">
                        <span className="profile-ud-label">Manufacturer EOL</span>
                        <span className="profile-ud-value">{formatDate(lifecycleData.manufacturerEolDate)}</span>
                      </div>
                    </div>
                    <div className="profile-ud-item">
                      <div className="profile-ud">
                        <span className="profile-ud-label">Internal EOL</span>
                        <span className="profile-ud-value">{formatDate(lifecycleData.internalEolDate)}</span>
                      </div>
                    </div>
                    <div className="profile-ud-item">
                      <div className="profile-ud">
                        <span className="profile-ud-label">Replacement Cycle</span>
                        <span className="profile-ud-value">
                          {lifecycleData.replacementCycleMonths ? `${lifecycleData.replacementCycleMonths} months` : 'Not set'}
                        </span>
                      </div>
                    </div>
                    <div className="profile-ud-item">
                      <div className="profile-ud">
                        <span className="profile-ud-label">Estimated Cost</span>
                        <span className="profile-ud-value">{formatCurrency(lifecycleData.estimatedReplacementCost)}</span>
                      </div>
                    </div>
                    <div className="profile-ud-item">
                      <div className="profile-ud">
                        <span className="profile-ud-label">Budget Year</span>
                        <span className="profile-ud-value">{lifecycleData.replacementBudgetYear || 'Not set'}</span>
                      </div>
                    </div>
                    <div className="profile-ud-item">
                      <div className="profile-ud">
                        <span className="profile-ud-label">Budget Quarter</span>
                        <span className="profile-ud-value">{getQuarterText(lifecycleData.replacementBudgetQuarter)}</span>
                      </div>
                    </div>
                    {lifecycleData.replacementNotes && (
                      <div className="profile-ud-item">
                        <div className="profile-ud">
                          <span className="profile-ud-label">Notes</span>
                          <span className="profile-ud-value">{lifecycleData.replacementNotes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <Icon name="clock" size="3x" className="text-muted mb-3"></Icon>
                    <h6>No Lifecycle Data</h6>
                    <p className="text-muted">No lifecycle information has been recorded for this asset.</p>
                    <Button color="primary" size="sm" onClick={() => setIsEditing(true)} style={{ height: '32px' }}>
                      <Icon name="plus" className="me-1"></Icon>
                      Create Lifecycle Record
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </SlideOutPanel>
  );
};

export default AssetLifecyclePanel;
