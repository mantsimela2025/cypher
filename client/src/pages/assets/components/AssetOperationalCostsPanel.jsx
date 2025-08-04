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
import { assetOperationalCostsApi } from "@/utils/assetOperationalCostsApi";
import { toast } from "react-toastify";
import "./AssetSlideOutPanels.css";

const AssetOperationalCostsPanel = ({ isOpen, onClose, assetUuid, assetData }) => {
  const [costsData, setCostsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    yearMonth: assetOperationalCostsApi.getCurrentMonth(),
    powerCost: '',
    spaceCost: '',
    networkCost: '',
    storageCost: '',
    laborCost: '',
    otherCosts: '',
    notes: ''
  });

  // Fetch costs data when panel opens
  useEffect(() => {
    if (isOpen && assetUuid) {
      fetchCostsData();
    }
  }, [isOpen, assetUuid]);

  const fetchCostsData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Fetching operational costs for asset:', assetUuid);
      console.log('🔑 Auth token available:', !!localStorage.getItem('accessToken'));
      console.log('🌐 API URL:', `http://localhost:3001/api/v1/asset-management/operational-costs?assetUuid=${assetUuid}`);

      const response = await assetOperationalCostsApi.getOperationalCosts(assetUuid, {
        sortBy: 'yearMonth',
        sortOrder: 'desc'
      });
      console.log('📡 API Response:', response);
      console.log('📊 Response data type:', typeof response.data);
      console.log('📊 Response data length:', response.data?.length);
      
      if (response.data) {
        setCostsData(response.data);
      } else {
        setCostsData([]);
      }
    } catch (err) {
      console.error('❌ Error fetching operational costs:', err);
      setError(err.message);
      setCostsData([]);
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
      yearMonth: record.yearMonth || '',
      powerCost: record.powerCost || '',
      spaceCost: record.spaceCost || '',
      networkCost: record.networkCost || '',
      storageCost: record.storageCost || '',
      laborCost: record.laborCost || '',
      otherCosts: record.otherCosts || '',
      notes: record.notes || ''
    });
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setEditingRecord(null);
    setFormData({
      yearMonth: assetOperationalCostsApi.getCurrentMonth(),
      powerCost: '',
      spaceCost: '',
      networkCost: '',
      storageCost: '',
      laborCost: '',
      otherCosts: '',
      notes: ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        assetUuid: assetUuid,
        powerCost: parseFloat(formData.powerCost) || 0,
        spaceCost: parseFloat(formData.spaceCost) || 0,
        networkCost: parseFloat(formData.networkCost) || 0,
        storageCost: parseFloat(formData.storageCost) || 0,
        laborCost: parseFloat(formData.laborCost) || 0,
        otherCosts: parseFloat(formData.otherCosts) || 0
      };

      if (editingRecord) {
        await assetOperationalCostsApi.updateOperationalCost(editingRecord.id, payload);
        toast.success('Operational costs updated successfully');
      } else {
        await assetOperationalCostsApi.createOperationalCost(payload);
        toast.success('Operational costs created successfully');
      }

      await fetchCostsData();
      setIsEditing(false);
      setEditingRecord(null);
    } catch (err) {
      console.error('❌ Error saving operational costs:', err);
      setError(err.message);
      toast.error('Failed to save operational costs');
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
    if (!window.confirm('Are you sure you want to delete this operational cost record?')) {
      return;
    }

    setLoading(true);
    try {
      await assetOperationalCostsApi.deleteOperationalCost(record.id);
      toast.success('Operational cost record deleted successfully');
      await fetchCostsData();
    } catch (err) {
      console.error('❌ Error deleting operational cost record:', err);
      setError(err.message);
      toast.error('Failed to delete operational cost record');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCost = (record) => {
    return assetOperationalCostsApi.calculateTotalCost(record);
  };

  const formatCurrency = (amount) => {
    return assetOperationalCostsApi.formatCurrency(amount);
  };

  const formatMonth = (yearMonth) => {
    if (!yearMonth) return 'Unknown';
    const date = new Date(yearMonth);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  return (
    <SlideOutPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Operational Costs"
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
            <p className="mt-2 panel-text-muted">Loading operational costs...</p>
          </div>
        )}

        {!loading && !isEditing && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Monthly Operational Costs</h6>
              <Button color="primary" size="sm" onClick={handleAddNew}>
                <Icon name="plus" className="me-1" />
                Add New Month
              </Button>
            </div>

            {costsData.length === 0 ? (
              <Card className="panel-border-light">
                <CardBody className="panel-empty-state">
                  <Icon name="info" className="panel-text-muted mb-2" style={{ fontSize: '2rem' }} />
                  <p className="panel-text-muted mb-0">No operational cost records found for this asset.</p>
                  <Button color="primary" size="sm" className="mt-2" onClick={handleAddNew}>
                    <Icon name="plus" className="me-1" />
                    Add First Record
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <div className="panel-card-list">
                {costsData.map((record, index) => (
                  <Card key={record.id || index} className="panel-card">
                    <CardHeader className="panel-card-header">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-0">{formatMonth(record.yearMonth)}</h6>
                          <small className="panel-text-muted">
                            Total: <strong>{formatCurrency(calculateTotalCost(record))}</strong>
                          </small>
                        </div>
                        <div className="d-flex panel-gap-1">
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
                    <CardBody className="panel-card-body">
                      <Row>
                        <Col md={6}>
                          <div className="panel-data-section">
                            <div className="panel-data-row">
                              <span className="label">Power:</span>
                              <span className="value">{formatCurrency(record.powerCost)}</span>
                            </div>
                            <div className="panel-data-row">
                              <span className="label">Space:</span>
                              <span className="value">{formatCurrency(record.spaceCost)}</span>
                            </div>
                            <div className="panel-data-row">
                              <span className="label">Network:</span>
                              <span className="value">{formatCurrency(record.networkCost)}</span>
                            </div>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="panel-data-section">
                            <div className="panel-data-row">
                              <span className="label">Storage:</span>
                              <span className="value">{formatCurrency(record.storageCost)}</span>
                            </div>
                            <div className="panel-data-row">
                              <span className="label">Labor:</span>
                              <span className="value">{formatCurrency(record.laborCost)}</span>
                            </div>
                            <div className="panel-data-row">
                              <span className="label">Other:</span>
                              <span className="value">{formatCurrency(record.otherCosts)}</span>
                            </div>
                          </div>
                        </Col>
                      </Row>
                      {record.notes && (
                        <div className="mt-2 pt-2 border-top">
                          <small className="text-muted">
                            <Icon name="file-text" className="me-1" />
                            {record.notes}
                          </small>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {isEditing && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">
                {editingRecord ? 'Edit' : 'Add'} Operational Costs
              </h6>
              <div className="panel-actions">
                <Button color="secondary" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button color="primary" size="sm" onClick={handleSave} disabled={loading}>
                  {loading && <Spinner size="sm" className="me-1" />}
                  Save
                </Button>
              </div>
            </div>

            <Form className="panel-form">
              <Row>
                <Col md={12}>
                  <FormGroup>
                    <Label for="yearMonth">Month <span className="text-danger">*</span></Label>
                    <Input
                      type="month"
                      id="yearMonth"
                      name="yearMonth"
                      value={formData.yearMonth ? formData.yearMonth.substring(0, 7) : ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, yearMonth: e.target.value + '-01' }))}
                      required
                    />
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label for="powerCost">Power Cost ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      id="powerCost"
                      name="powerCost"
                      value={formData.powerCost}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="spaceCost">Space Cost ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      id="spaceCost"
                      name="spaceCost"
                      value={formData.spaceCost}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label for="networkCost">Network Cost ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      id="networkCost"
                      name="networkCost"
                      value={formData.networkCost}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="storageCost">Storage Cost ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      id="storageCost"
                      name="storageCost"
                      value={formData.storageCost}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label for="laborCost">Labor Cost ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      id="laborCost"
                      name="laborCost"
                      value={formData.laborCost}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label for="otherCosts">Other Costs ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      id="otherCosts"
                      name="otherCosts"
                      value={formData.otherCosts}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <FormGroup>
                    <Label for="notes">Notes</Label>
                    <Input
                      type="textarea"
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Additional notes about these operational costs..."
                    />
                  </FormGroup>
                </Col>
              </Row>

              <div className="mt-3 p-3 bg-light rounded">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">Estimated Total:</span>
                  <span className="fw-bold text-primary">
                    {formatCurrency(
                      (parseFloat(formData.powerCost) || 0) +
                      (parseFloat(formData.spaceCost) || 0) +
                      (parseFloat(formData.networkCost) || 0) +
                      (parseFloat(formData.storageCost) || 0) +
                      (parseFloat(formData.laborCost) || 0) +
                      (parseFloat(formData.otherCosts) || 0)
                    )}
                  </span>
                </div>
              </div>
            </Form>
          </div>
        )}
      </div>
    </SlideOutPanel>
  );
};

export default AssetOperationalCostsPanel;
