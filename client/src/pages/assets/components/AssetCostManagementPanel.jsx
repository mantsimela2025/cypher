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
  Table
} from "reactstrap";
import { Icon } from "@/components/Component";
import SlideOutPanel from "@/components/partials/SlideOutPanel";
import "./AssetSlideOutPanels.css";
import { apiClient } from "@/utils/apiClient";
import { log } from "@/utils/config";

const AssetCostManagementPanel = ({
  isOpen,
  onClose,
  assetUuid,
  assetData
}) => {
  const [costData, setCostData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    costType: 'purchase',
    amount: '',
    currency: 'USD',
    billingCycle: 'one_time',
    startDate: '',
    endDate: '',
    vendor: '',
    contractNumber: '',
    purchaseOrder: '',
    invoiceNumber: '',
    costCenter: '',
    budgetCode: '',
    notes: ''
  });

  const costTypes = [
    { value: 'purchase', label: 'Purchase' },
    { value: 'lease', label: 'Lease' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'support', label: 'Support' },
    { value: 'license', label: 'License' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'upgrade', label: 'Upgrade' },
    { value: 'repair', label: 'Repair' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'other', label: 'Other' }
  ];

  const billingCycles = [
    { value: 'one_time', label: 'One Time' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'semi_annual', label: 'Semi-Annual' },
    { value: 'annual', label: 'Annual' },
    { value: 'biennial', label: 'Biennial' }
  ];

  useEffect(() => {
    if (isOpen && assetUuid) {
      fetchCostData();
    }
  }, [isOpen, assetUuid]);

  const fetchCostData = async () => {
    setLoading(true);
    setError(null);
    try {
      log.api('Fetching asset cost data:', assetUuid);
      const data = await apiClient.get(`/asset-management/costs?assetUuid=${assetUuid}`);
      setCostData(data.data || []);
      log.info('Asset cost data loaded:', data.data?.length || 0, 'records');
    } catch (err) {
      log.error('Error fetching cost data:', err.message);
      setError(`Failed to load cost data: ${err.message}`);
      setCostData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      costType: record.costType || 'purchase',
      amount: record.amount || '',
      currency: record.currency || 'USD',
      billingCycle: record.billingCycle || 'one_time',
      startDate: record.startDate ? record.startDate.split('T')[0] : '',
      endDate: record.endDate ? record.endDate.split('T')[0] : '',
      vendor: record.vendor || '',
      contractNumber: record.contractNumber || '',
      purchaseOrder: record.purchaseOrder || '',
      invoiceNumber: record.invoiceNumber || '',
      costCenter: record.costCenter || '',
      budgetCode: record.budgetCode || '',
      notes: record.notes || ''
    });
    setIsEditing(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setFormData({
      costType: 'purchase',
      amount: '',
      currency: 'USD',
      billingCycle: 'one_time',
      startDate: '',
      endDate: '',
      vendor: '',
      contractNumber: '',
      purchaseOrder: '',
      invoiceNumber: '',
      costCenter: '',
      budgetCode: '',
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
        amount: parseFloat(formData.amount)
      };

      if (editingRecord) {
        log.api('Updating asset cost record:', editingRecord.id);
        await apiClient.put(`/asset-management/costs/${editingRecord.id}`, payload);
      } else {
        log.api('Creating new asset cost record for:', assetUuid);
        await apiClient.post('/asset-management/costs', payload);
      }

      await fetchCostData();
      setIsEditing(false);
      setEditingRecord(null);
      log.info('Asset cost record saved successfully');

    } catch (err) {
      log.error('Error saving cost record:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this cost record?')) {
      return;
    }

    setLoading(true);
    try {
      log.api('Deleting asset cost record:', recordId);
      await apiClient.delete(`/asset-management/costs/${recordId}`);
      await fetchCostData();
      log.info('Asset cost record deleted successfully');
    } catch (err) {
      log.error('Error deleting cost record:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingRecord(null);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getBadgeColor = (costType) => {
    const colors = {
      purchase: 'primary',
      lease: 'info',
      maintenance: 'warning',
      support: 'secondary',
      license: 'success',
      subscription: 'info',
      upgrade: 'primary',
      repair: 'warning',
      insurance: 'dark',
      other: 'light'
    };
    return colors[costType] || 'light';
  };

  const getTotalCost = () => {
    return costData.reduce((total, record) => total + parseFloat(record.amount || 0), 0);
  };

  const panelTitle = (
    <>
      <Icon name="dollar-sign" className="me-2"></Icon>
      Cost Management / <strong className="text-primary small">{assetData?.hostname || 'Loading...'}</strong>
    </>
  );

  return (
    <SlideOutPanel
      isOpen={isOpen}
      onClose={onClose}
      title={panelTitle}
      width="800px"
    >
      <div className="asset-cost-management-content">

        {loading && (
          <div className="text-center p-4">
            <Spinner size="lg" />
            <p className="mt-2">Loading cost data...</p>
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
                {costData.length > 0 ? `Cost Records (${costData.length})` : 'Cost Management'}
              </h5>
              <div className="d-flex" style={{ gap: '8px' }}>
                {!isEditing && (
                  <Button color="primary" size="sm" onClick={handleAdd} style={{ height: '32px' }}>
                    <Icon name="plus" className="me-1"></Icon>
                    Add Cost
                  </Button>
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
                  <Col md={6}>
                    <FormGroup>
                      <Label for="costType">Cost Type</Label>
                      <Input
                        type="select"
                        name="costType"
                        id="costType"
                        value={formData.costType}
                        onChange={handleInputChange}
                      >
                        {costTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="amount">Amount</Label>
                      <Input
                        type="number"
                        name="amount"
                        id="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="currency">Currency</Label>
                      <Input
                        type="select"
                        name="currency"
                        id="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </Input>
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="billingCycle">Billing Cycle</Label>
                      <Input
                        type="select"
                        name="billingCycle"
                        id="billingCycle"
                        value={formData.billingCycle}
                        onChange={handleInputChange}
                      >
                        {billingCycles.map(cycle => (
                          <option key={cycle.value} value={cycle.value}>
                            {cycle.label}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="startDate">Start Date</Label>
                      <Input
                        type="date"
                        name="startDate"
                        id="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="endDate">End Date</Label>
                      <Input
                        type="date"
                        name="endDate"
                        id="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <FormGroup>
                  <Label for="vendor">Vendor</Label>
                  <Input
                    type="text"
                    name="vendor"
                    id="vendor"
                    value={formData.vendor}
                    onChange={handleInputChange}
                    placeholder="Vendor name"
                  />
                </FormGroup>

                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="contractNumber">Contract Number</Label>
                      <Input
                        type="text"
                        name="contractNumber"
                        id="contractNumber"
                        value={formData.contractNumber}
                        onChange={handleInputChange}
                        placeholder="Contract number"
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="purchaseOrder">Purchase Order</Label>
                      <Input
                        type="text"
                        name="purchaseOrder"
                        id="purchaseOrder"
                        value={formData.purchaseOrder}
                        onChange={handleInputChange}
                        placeholder="PO number"
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="costCenter">Cost Center</Label>
                      <Input
                        type="text"
                        name="costCenter"
                        id="costCenter"
                        value={formData.costCenter}
                        onChange={handleInputChange}
                        placeholder="Cost center"
                      />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="budgetCode">Budget Code</Label>
                      <Input
                        type="text"
                        name="budgetCode"
                        id="budgetCode"
                        value={formData.budgetCode}
                        onChange={handleInputChange}
                        placeholder="Budget code"
                      />
                    </FormGroup>
                  </Col>
                </Row>

                <FormGroup>
                  <Label for="notes">Notes</Label>
                  <Input
                    type="textarea"
                    name="notes"
                    id="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes..."
                    rows="3"
                  />
                </FormGroup>
              </Form>
            ) : (
              <div className="cost-display">
                {costData.length > 0 ? (
                  <div className="cost-records">
                    <div className="mb-3">
                      <small className="text-muted">
                        Total Cost: <strong className="text-primary">{formatCurrency(getTotalCost())}</strong>
                      </small>
                    </div>
                    {costData.map((record, index) => (
                      <div key={record.id || index} className="profile-ud-list mb-4">
                        <div className="mb-2">
                          <div className="d-flex align-items-center">
                            <Badge color={getBadgeColor(record.costType)} className="me-2">
                              {costTypes.find(t => t.value === record.costType)?.label || record.costType}
                            </Badge>
                            <strong className="text-primary">
                              {formatCurrency(record.amount)}
                            </strong>
                            <span className="text-muted ms-2">
                              ({billingCycles.find(b => b.value === record.billingCycle)?.label || record.billingCycle})
                            </span>
                          </div>
                        </div>

                        {record.vendor && (
                          <div className="profile-ud-item">
                            <div className="profile-ud">
                              <span className="profile-ud-label">Vendor</span>
                              <span className="profile-ud-value">{record.vendor}</span>
                            </div>
                          </div>
                        )}

                        {record.contractNumber && (
                          <div className="profile-ud-item">
                            <div className="profile-ud">
                              <span className="profile-ud-label">Contract Number</span>
                              <span className="profile-ud-value">{record.contractNumber}</span>
                            </div>
                          </div>
                        )}

                        {record.costCenter && (
                          <div className="profile-ud-item">
                            <div className="profile-ud">
                              <span className="profile-ud-label">Cost Center</span>
                              <span className="profile-ud-value">{record.costCenter}</span>
                            </div>
                          </div>
                        )}

                        {record.budgetCode && (
                          <div className="profile-ud-item">
                            <div className="profile-ud">
                              <span className="profile-ud-label">Budget Code</span>
                              <span className="profile-ud-value">{record.budgetCode}</span>
                            </div>
                          </div>
                        )}

                        {(record.startDate || record.endDate) && (
                          <div className="profile-ud-item">
                            <div className="profile-ud">
                              <span className="profile-ud-label">Period</span>
                              <span className="profile-ud-value">
                                {record.startDate && new Date(record.startDate).toLocaleDateString()}
                                {record.startDate && record.endDate && ' - '}
                                {record.endDate && new Date(record.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}

                        {record.notes && (
                          <div className="profile-ud-item">
                            <div className="profile-ud">
                              <span className="profile-ud-label">Notes</span>
                              <span className="profile-ud-value">{record.notes}</span>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #e5e9f2' }}>
                          <Button
                            color="primary"
                            size="lg"
                            onClick={() => handleEdit(record)}
                          >
                            <Icon name="edit" className="me-1"></Icon>
                            Edit
                          </Button>
                          <Button
                            color="danger"
                            size="lg"
                            onClick={() => handleDelete(record.id)}
                          >
                            <Icon name="trash" className="me-1"></Icon>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <Icon name="dollar-sign" size="3x" className="text-muted mb-3"></Icon>
                    <h6>No Cost Records</h6>
                    <p className="text-muted">No cost information has been recorded for this asset.</p>
                    <Button color="primary" size="sm" onClick={handleAdd} style={{ height: '32px' }}>
                      <Icon name="plus" className="me-1"></Icon>
                      Create Cost Record
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

export default AssetCostManagementPanel;
