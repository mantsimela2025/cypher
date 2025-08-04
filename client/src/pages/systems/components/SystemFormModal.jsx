import React, { useState, useEffect } from "react";
import { Modal, ModalBody, ModalHeader, ModalFooter, Button, Form, FormGroup, Label, Input } from "reactstrap";
import { Icon, RSelect } from "@/components/Component";
import { systemsApi } from "@/utils/systemsApi";
import { toast } from "react-toastify";

const SystemFormModal = ({ modal, setModal, modalType, system, formData }) => {
  const [form, setForm] = useState({
    systemId: "",
    name: "",
    systemType: "",
    status: "active",
    responsibleOrganization: "",
    systemOwner: "",
    informationSystemSecurityOfficer: "",
    authorizingOfficial: "",
    confidentialityImpact: "",
    integrityImpact: "",
    availabilityImpact: "",
    authorizationBoundary: ""
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (modalType === "edit" && system) {
      setForm({
        systemId: system.systemId || "",
        name: system.name || "",
        systemType: system.systemType || "",
        status: system.status || "active",
        responsibleOrganization: system.responsibleOrganization || "",
        systemOwner: system.systemOwner || "",
        informationSystemSecurityOfficer: system.informationSystemSecurityOfficer || "",
        authorizingOfficial: system.authorizingOfficial || "",
        confidentialityImpact: system.confidentialityImpact || "",
        integrityImpact: system.integrityImpact || "",
        availabilityImpact: system.availabilityImpact || "",
        authorizationBoundary: system.authorizationBoundary || ""
      });
    } else if (modalType === "add") {
      setForm({
        systemId: "",
        name: "",
        systemType: "",
        status: "active",
        responsibleOrganization: "",
        systemOwner: "",
        informationSystemSecurityOfficer: "",
        authorizingOfficial: "",
        confidentialityImpact: "",
        integrityImpact: "",
        availabilityImpact: "",
        authorizationBoundary: ""
      });
    }
  }, [modalType, system]);

  const closeModal = () => {
    if (modalType === "edit") {
      setModal(prev => ({ ...prev, edit: false }));
    } else {
      setModal(prev => ({ ...prev, add: false }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, selectedOption) => {
    setForm(prev => ({ ...prev, [name]: selectedOption.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (modalType === "edit") {
        result = await systemsApi.updateSystem(system.id, form);
      } else {
        result = await systemsApi.createSystem(form);
      }

      if (result.success) {
        toast.success(`System ${modalType === "edit" ? 'updated' : 'created'} successfully`);
        closeModal();
        // TODO: Trigger data refresh in parent component
      }
    } catch (error) {
      console.error(`Error ${modalType === "edit" ? 'updating' : 'creating'} system:`, error);
      toast.error(`Failed to ${modalType === "edit" ? 'update' : 'create'} system. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const systemTypeOptions = [
    { value: "web", label: "Web Server" },
    { value: "database", label: "Database" },
    { value: "application", label: "Application" },
    { value: "network", label: "Network Device" },
    { value: "security", label: "Security Device" },
    { value: "storage", label: "Storage System" },
    { value: "virtualization", label: "Virtualization Platform" }
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "maintenance", label: "Maintenance" },
    { value: "decommissioned", label: "Decommissioned" }
  ];

  const impactLevelOptions = [
    { value: "low", label: "Low" },
    { value: "moderate", label: "Moderate" },
    { value: "high", label: "High" }
  ];

  return (
    <Modal isOpen={modal} toggle={closeModal} size="lg" className="modal-dialog-centered">
      <ModalHeader toggle={closeModal}>
        <Icon name={modalType === "edit" ? "edit" : "plus"} className="me-2" />
        {modalType === "edit" ? "Edit System" : "Add New System"}
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="row g-3">
            <div className="col-md-6">
              <FormGroup>
                <Label htmlFor="systemId">System ID *</Label>
                <Input
                  type="text"
                  id="systemId"
                  name="systemId"
                  value={form.systemId}
                  onChange={handleInputChange}
                  placeholder="Enter system ID"
                  required
                />
              </FormGroup>
            </div>
            <div className="col-md-6">
              <FormGroup>
                <Label htmlFor="name">System Name *</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Enter system name"
                  required
                />
              </FormGroup>
            </div>
            <div className="col-md-6">
              <FormGroup>
                <Label>System Type</Label>
                <RSelect
                  options={systemTypeOptions}
                  value={systemTypeOptions.find(option => option.value === form.systemType)}
                  onChange={(selected) => handleSelectChange('systemType', selected)}
                  placeholder="Select system type"
                />
              </FormGroup>
            </div>
            <div className="col-md-6">
              <FormGroup>
                <Label>Status</Label>
                <RSelect
                  options={statusOptions}
                  value={statusOptions.find(option => option.value === form.status)}
                  onChange={(selected) => handleSelectChange('status', selected)}
                  placeholder="Select status"
                />
              </FormGroup>
            </div>
            <div className="col-md-6">
              <FormGroup>
                <Label htmlFor="responsibleOrganization">Responsible Organization</Label>
                <Input
                  type="text"
                  id="responsibleOrganization"
                  name="responsibleOrganization"
                  value={form.responsibleOrganization}
                  onChange={handleInputChange}
                  placeholder="Enter organization name"
                />
              </FormGroup>
            </div>
            <div className="col-md-6">
              <FormGroup>
                <Label htmlFor="systemOwner">System Owner</Label>
                <Input
                  type="text"
                  id="systemOwner"
                  name="systemOwner"
                  value={form.systemOwner}
                  onChange={handleInputChange}
                  placeholder="Enter system owner name"
                />
              </FormGroup>
            </div>
            <div className="col-md-6">
              <FormGroup>
                <Label htmlFor="informationSystemSecurityOfficer">Information System Security Officer</Label>
                <Input
                  type="text"
                  id="informationSystemSecurityOfficer"
                  name="informationSystemSecurityOfficer"
                  value={form.informationSystemSecurityOfficer}
                  onChange={handleInputChange}
                  placeholder="Enter ISSO name"
                />
              </FormGroup>
            </div>
            <div className="col-md-6">
              <FormGroup>
                <Label htmlFor="authorizingOfficial">Authorizing Official</Label>
                <Input
                  type="text"
                  id="authorizingOfficial"
                  name="authorizingOfficial"
                  value={form.authorizingOfficial}
                  onChange={handleInputChange}
                  placeholder="Enter AO name"
                />
              </FormGroup>
            </div>
            <div className="col-md-4">
              <FormGroup>
                <Label>Confidentiality Impact</Label>
                <RSelect
                  options={impactLevelOptions}
                  value={impactLevelOptions.find(option => option.value === form.confidentialityImpact)}
                  onChange={(selected) => handleSelectChange('confidentialityImpact', selected)}
                  placeholder="Select impact level"
                />
              </FormGroup>
            </div>
            <div className="col-md-4">
              <FormGroup>
                <Label>Integrity Impact</Label>
                <RSelect
                  options={impactLevelOptions}
                  value={impactLevelOptions.find(option => option.value === form.integrityImpact)}
                  onChange={(selected) => handleSelectChange('integrityImpact', selected)}
                  placeholder="Select impact level"
                />
              </FormGroup>
            </div>
            <div className="col-md-4">
              <FormGroup>
                <Label>Availability Impact</Label>
                <RSelect
                  options={impactLevelOptions}
                  value={impactLevelOptions.find(option => option.value === form.availabilityImpact)}
                  onChange={(selected) => handleSelectChange('availabilityImpact', selected)}
                  placeholder="Select impact level"
                />
              </FormGroup>
            </div>
            <div className="col-12">
              <FormGroup>
                <Label htmlFor="authorizationBoundary">Authorization Boundary</Label>
                <Input
                  type="textarea"
                  id="authorizationBoundary"
                  name="authorizationBoundary"
                  value={form.authorizationBoundary}
                  onChange={handleInputChange}
                  placeholder="Describe the system's authorization boundary"
                  rows="3"
                />
              </FormGroup>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={closeModal} disabled={loading}>
            Cancel
          </Button>
          <Button color="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Icon name="loader" className="me-1" />
                {modalType === "edit" ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Icon name={modalType === "edit" ? "edit" : "plus"} className="me-1" />
                {modalType === "edit" ? "Update System" : "Create System"}
              </>
            )}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default SystemFormModal;
