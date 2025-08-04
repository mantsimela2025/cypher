import React from "react";
import { Modal, ModalBody, ModalHeader, ModalFooter, Button, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { Icon } from "@/components/Component";

const SystemDetailsModal = ({ modal, setModal, system }) => {
  const [activeTab, setActiveTab] = React.useState("overview");

  const closeModal = () => {
    setModal(prev => ({ ...prev, details: false }));
  };

  if (!system) return null;

  const toggleTab = (tab) => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  return (
    <Modal isOpen={modal} toggle={closeModal} size="xl" className="modal-dialog-centered">
      <ModalHeader toggle={closeModal}>
        <div className="d-flex align-items-center">
          <Icon name="server" className="me-2" />
          {system.name}
          <span className="badge badge-sm bg-primary ms-2">{system.systemId}</span>
        </div>
      </ModalHeader>
      <ModalBody>
        <Nav tabs className="nav-tabs-mb-icon nav-tabs-card">
          <NavItem>
            <NavLink
              href="#tab"
              className={activeTab === "overview" ? "active" : ""}
              onClick={(ev) => {
                ev.preventDefault();
                toggleTab("overview");
              }}
            >
              <Icon name="dashboard" />
              <span>Overview</span>
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              href="#tab"
              className={activeTab === "security" ? "active" : ""}
              onClick={(ev) => {
                ev.preventDefault();
                toggleTab("security");
              }}
            >
              <Icon name="shield-check" />
              <span>Security</span>
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              href="#tab"
              className={activeTab === "compliance" ? "active" : ""}
              onClick={(ev) => {
                ev.preventDefault();
                toggleTab("compliance");
              }}
            >
              <Icon name="clipboard-check" />
              <span>Compliance</span>
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              href="#tab"
              className={activeTab === "vulnerabilities" ? "active" : ""}
              onClick={(ev) => {
                ev.preventDefault();
                toggleTab("vulnerabilities");
              }}
            >
              <Icon name="alert-triangle" />
              <span>Vulnerabilities</span>
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              href="#tab"
              className={activeTab === "analytics" ? "active" : ""}
              onClick={(ev) => {
                ev.preventDefault();
                toggleTab("analytics");
              }}
            >
              <Icon name="bar-chart" />
              <span>Analytics</span>
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              href="#tab"
              className={activeTab === "audit" ? "active" : ""}
              onClick={(ev) => {
                ev.preventDefault();
                toggleTab("audit");
              }}
            >
              <Icon name="file-text" />
              <span>Audit Log</span>
            </NavLink>
          </NavItem>
        </Nav>

        <TabContent activeTab={activeTab}>
          <TabPane tabId="overview">
            <div className="p-4">
              <h6 className="title">System Overview</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">System Name</label>
                    <div className="form-control-plaintext">{system.name}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">System ID</label>
                    <div className="form-control-plaintext">{system.systemId}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <div className="form-control-plaintext">
                      <span className={`badge badge-${system.status === 'active' ? 'success' : 'secondary'}`}>
                        {system.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">System Type</label>
                    <div className="form-control-plaintext">{system.systemType || 'Not specified'}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">System Owner</label>
                    <div className="form-control-plaintext">{system.systemOwner || 'Not assigned'}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label className="form-label">Organization</label>
                    <div className="form-control-plaintext">{system.responsibleOrganization || 'Not specified'}</div>
                  </div>
                </div>
              </div>
            </div>
          </TabPane>
          
          <TabPane tabId="security">
            <div className="p-4">
              <h6 className="title">Security Posture</h6>
              <p className="text-soft">Security information and risk assessment details will be displayed here.</p>
            </div>
          </TabPane>
          
          <TabPane tabId="compliance">
            <div className="p-4">
              <h6 className="title">Compliance Status</h6>
              <p className="text-soft">Compliance framework status and control implementation details will be displayed here.</p>
            </div>
          </TabPane>
          
          <TabPane tabId="vulnerabilities">
            <div className="p-4">
              <h6 className="title">Vulnerabilities</h6>
              <p className="text-soft">System vulnerabilities and remediation status will be displayed here.</p>
            </div>
          </TabPane>
          
          <TabPane tabId="analytics">
            <div className="p-4">
              <h6 className="title">System Analytics</h6>
              <p className="text-soft">Performance metrics, usage statistics, and trend analysis will be displayed here.</p>
            </div>
          </TabPane>
          
          <TabPane tabId="audit">
            <div className="p-4">
              <h6 className="title">Audit Log</h6>
              <p className="text-soft">System change history, user actions, and compliance events will be displayed here.</p>
            </div>
          </TabPane>
        </TabContent>
      </ModalBody>
      <ModalFooter>
        <Button color="light" onClick={closeModal}>
          Close
        </Button>
        <Button color="outline-primary">
          <Icon name="download" className="me-1" />
          Export
        </Button>
        <Button color="primary">
          <Icon name="edit" className="me-1" />
          Edit System
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default SystemDetailsModal;
