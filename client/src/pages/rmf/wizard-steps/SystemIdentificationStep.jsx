/**
 * RMF Wizard - System Identification Step
 * Clean interface for defining system boundaries and components
 */

import React, { useState, useEffect } from "react";
import { Row, Col, FormGroup, Label, Input, Button, Badge } from "reactstrap";
import { Icon, RSelect, DataTable, DataTableHead, DataTableBody, DataTableRow } from "@/components/Component";

const SystemIdentificationStep = ({ 
  stepData = {}, 
  onDataChange, 
  canProceed 
}) => {
  const [systems, setSystems] = useState(stepData.systems || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSystem, setEditingSystem] = useState(null);
  
  const [systemForm, setSystemForm] = useState({
    name: '',
    description: '',
    systemType: '',
    boundary: '',
    components: '',
    owner: '',
    status: 'active'
  });

  const [errors, setErrors] = useState({});

  // System type options
  const systemTypeOptions = [
    { value: 'web_application', label: 'Web Application' },
    { value: 'database', label: 'Database System' },
    { value: 'network_infrastructure', label: 'Network Infrastructure' },
    { value: 'cloud_service', label: 'Cloud Service' },
    { value: 'mobile_application', label: 'Mobile Application' },
    { value: 'desktop_application', label: 'Desktop Application' },
    { value: 'iot_device', label: 'IoT Device' },
    { value: 'other', label: 'Other' }
  ];

  // Update parent when systems change
  useEffect(() => {
    onDataChange({ systems });
  }, [systems, onDataChange]);

  // Validate form
  useEffect(() => {
    const newErrors = {};
    
    if (showAddForm || editingSystem) {
      if (!systemForm.name?.trim()) {
        newErrors.name = 'System name is required';
      }
      
      if (!systemForm.description?.trim()) {
        newErrors.description = 'System description is required';
      }
      
      if (!systemForm.systemType) {
        newErrors.systemType = 'System type is required';
      }

      if (!systemForm.owner?.trim()) {
        newErrors.owner = 'System owner is required';
      }
    }

    setErrors(newErrors);
  }, [systemForm, showAddForm, editingSystem]);

  /**
   * Handle form input changes
   */
  const handleInputChange = (field, value) => {
    setSystemForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handle select changes
   */
  const handleSelectChange = (field, selectedOption) => {
    setSystemForm(prev => ({
      ...prev,
      [field]: selectedOption?.value || ''
    }));
  };

  /**
   * Add new system
   */
  const handleAddSystem = () => {
    if (Object.keys(errors).length === 0 && systemForm.name && systemForm.description && systemForm.systemType && systemForm.owner) {
      const newSystem = {
        ...systemForm,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      
      setSystems(prev => [...prev, newSystem]);
      setSystemForm({
        name: '',
        description: '',
        systemType: '',
        boundary: '',
        components: '',
        owner: '',
        status: 'active'
      });
      setShowAddForm(false);
    }
  };

  /**
   * Edit system
   */
  const handleEditSystem = (system) => {
    setSystemForm(system);
    setEditingSystem(system.id);
    setShowAddForm(true);
  };

  /**
   * Update system
   */
  const handleUpdateSystem = () => {
    if (Object.keys(errors).length === 0 && systemForm.name && systemForm.description && systemForm.systemType && systemForm.owner) {
      setSystems(prev => prev.map(sys => 
        sys.id === editingSystem ? { ...systemForm, id: editingSystem } : sys
      ));
      setSystemForm({
        name: '',
        description: '',
        systemType: '',
        boundary: '',
        components: '',
        owner: '',
        status: 'active'
      });
      setEditingSystem(null);
      setShowAddForm(false);
    }
  };

  /**
   * Delete system
   */
  const handleDeleteSystem = (systemId) => {
    if (window.confirm('Are you sure you want to delete this system?')) {
      setSystems(prev => prev.filter(sys => sys.id !== systemId));
    }
  };

  /**
   * Cancel form
   */
  const handleCancelForm = () => {
    setSystemForm({
      name: '',
      description: '',
      systemType: '',
      boundary: '',
      components: '',
      owner: '',
      status: 'active'
    });
    setEditingSystem(null);
    setShowAddForm(false);
    setErrors({});
  };

  return (
    <div className="system-identification-step">
      
      {/* Step Introduction */}
      <div className="step-intro mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="step-icon me-3">
            <Icon name="grid" className="text-primary" style={{ fontSize: '24px' }}></Icon>
          </div>
          <div>
            <h6 className="mb-1">System Identification</h6>
            <p className="text-soft mb-0">
              Define the information systems that will be part of this RMF project
            </p>
          </div>
        </div>
      </div>

      {/* Systems List */}
      <div className="systems-list mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">
            Information Systems ({systems.length})
          </h6>
          <Button 
            color="primary" 
            size="sm" 
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm}
          >
            <Icon name="plus" className="me-1"></Icon>
            Add System
          </Button>
        </div>

        {systems.length > 0 ? (
          <DataTable className="table-responsive">
            <DataTableHead>
              <DataTableRow>
                <th>System Name</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {systems.map((system) => (
                <DataTableRow key={system.id}>
                  <td>
                    <div>
                      <span className="fw-bold">{system.name}</span>
                      <div className="text-soft small">{system.description}</div>
                    </div>
                  </td>
                  <td>
                    <Badge color="outline-primary" className="text-capitalize">
                      {system.systemType?.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td>{system.owner}</td>
                  <td>
                    <Badge color={system.status === 'active' ? 'success' : 'warning'}>
                      {system.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Button 
                      color="outline-primary" 
                      size="sm" 
                      className="me-1"
                      onClick={() => handleEditSystem(system)}
                    >
                      <Icon name="edit"></Icon>
                    </Button>
                    <Button 
                      color="outline-danger" 
                      size="sm"
                      onClick={() => handleDeleteSystem(system.id)}
                    >
                      <Icon name="trash"></Icon>
                    </Button>
                  </td>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        ) : (
          <div className="text-center py-4">
            <Icon name="grid" className="text-muted mb-2" style={{ fontSize: '48px' }}></Icon>
            <p className="text-muted">No systems defined yet</p>
            <p className="text-soft small">Add your first information system to get started</p>
          </div>
        )}
      </div>

      {/* Add/Edit System Form */}
      {showAddForm && (
        <div className="system-form border rounded p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">
              {editingSystem ? 'Edit System' : 'Add New System'}
            </h6>
            <Button color="outline-secondary" size="sm" onClick={handleCancelForm}>
              <Icon name="cross"></Icon>
            </Button>
          </div>

          <Row className="g-3">
            <Col md="6">
              <FormGroup>
                <Label className="form-label">System Name *</Label>
                <Input
                  type="text"
                  placeholder="Enter system name"
                  value={systemForm.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  invalid={!!errors.name}
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </FormGroup>
            </Col>

            <Col md="6">
              <FormGroup>
                <Label className="form-label">System Type *</Label>
                <RSelect
                  options={systemTypeOptions}
                  value={systemTypeOptions.find(opt => opt.value === systemForm.systemType)}
                  onChange={(option) => handleSelectChange('systemType', option)}
                  placeholder="Select system type"
                />
                {errors.systemType && <div className="text-danger small">{errors.systemType}</div>}
              </FormGroup>
            </Col>

            <Col md="12">
              <FormGroup>
                <Label className="form-label">Description *</Label>
                <Input
                  type="textarea"
                  rows="2"
                  placeholder="Describe the system's purpose and functionality"
                  value={systemForm.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  invalid={!!errors.description}
                />
                {errors.description && <div className="invalid-feedback">{errors.description}</div>}
              </FormGroup>
            </Col>

            <Col md="6">
              <FormGroup>
                <Label className="form-label">System Owner *</Label>
                <Input
                  type="text"
                  placeholder="Enter system owner name"
                  value={systemForm.owner}
                  onChange={(e) => handleInputChange('owner', e.target.value)}
                  invalid={!!errors.owner}
                />
                {errors.owner && <div className="invalid-feedback">{errors.owner}</div>}
              </FormGroup>
            </Col>

            <Col md="6">
              <FormGroup>
                <Label className="form-label">System Boundary</Label>
                <Input
                  type="text"
                  placeholder="Define system boundary"
                  value={systemForm.boundary}
                  onChange={(e) => handleInputChange('boundary', e.target.value)}
                />
              </FormGroup>
            </Col>

            <Col md="12">
              <FormGroup>
                <Label className="form-label">Key Components</Label>
                <Input
                  type="textarea"
                  rows="2"
                  placeholder="List key system components and interfaces"
                  value={systemForm.components}
                  onChange={(e) => handleInputChange('components', e.target.value)}
                />
              </FormGroup>
            </Col>
          </Row>

          <div className="d-flex gap-2 mt-3">
            <Button 
              color="primary" 
              onClick={editingSystem ? handleUpdateSystem : handleAddSystem}
              disabled={Object.keys(errors).length > 0}
            >
              <Icon name={editingSystem ? "check" : "plus"} className="me-1"></Icon>
              {editingSystem ? 'Update System' : 'Add System'}
            </Button>
            <Button color="outline-secondary" onClick={handleCancelForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Validation Status */}
      {systems.length === 0 && (
        <div className="validation-status mt-3">
          <div className="alert alert-warning d-flex align-items-center">
            <Icon name="alert-triangle" className="me-2"></Icon>
            Please add at least one information system to continue
          </div>
        </div>
      )}

    </div>
  );
};

export default SystemIdentificationStep;
