import React, { useState } from "react";
import CreatePolicyPanel from "./CreatePolicyPanel";
import SearchTab from "./SearchTab";
import AuditHistoryTab from "./AuditHistoryTab";

const Policies = () => {
  const [activeTab, setActiveTab] = useState("policies");
  const [showCreatePanel, setShowCreatePanel] = useState(false);

  // Helper for info icon
  const InfoIcon = () => (
    <i className="bi bi-info-circle ms-1" style={{ fontSize: "1rem", verticalAlign: "middle" }}></i>
  );

  return (
    <div className="container-fluid py-4">
      {/* Header Row */}
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center">
            Policy Management <InfoIcon />
          </h2>
          <div className="text-muted" style={{ fontSize: "1rem" }}>
            Create, edit, and publish organizational policies
          </div>
        </div>
        <button className="btn btn-primary fw-semibold" onClick={() => setShowCreatePanel(true)}>
          <i className="bi bi-plus-lg me-2"></i> Create New Policy
        </button>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        {[
          { key: "policies", label: "Policies" },
          { key: "procedures", label: "Procedures" },
          { key: "search", label: "Search" },
          { key: "workflow", label: "Workflow" },
          { key: "audit", label: "Audit History" },
        ].map(tab => (
          <li className="nav-item" key={tab.key}>
            <button
              className={`nav-link${activeTab === tab.key ? " active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab Content */}
      {activeTab === "policies" && (
        <>
          {/* Summary Cards */}
          <div className="row mb-4">
            <div className="col-md-4 mb-3 mb-md-0">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-1 fw-semibold">
                    Total Policies <InfoIcon />
                  </div>
                  <div className="text-muted mb-2" style={{ fontSize: "0.95rem" }}>
                    Across all categories
                  </div>
                  <div className="display-6 fw-bold">0</div>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-3 mb-md-0">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-1 fw-semibold">
                    Approved <InfoIcon />
                  </div>
                  <div className="text-muted mb-2" style={{ fontSize: "0.95rem" }}>
                    Active policies
                  </div>
                  <div className="display-6 fw-bold" style={{ color: '#198754' }}>0</div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-1 fw-semibold">
                    Requiring Review <InfoIcon />
                  </div>
                  <div className="text-muted mb-2" style={{ fontSize: "0.95rem" }}>
                    Within next 30 days
                  </div>
                  <div className="display-6 fw-bold" style={{ color: '#fd7e14' }}>0</div>
                </div>
              </div>
            </div>
          </div>

          {/* All Policies Section */}
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center mb-1 fw-semibold">
                All Policies <InfoIcon />
              </div>
              <div className="text-muted mb-3" style={{ fontSize: "0.95rem" }}>
                View and manage all organizational policies
              </div>
              <div className="text-center text-danger mb-4" style={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Error loading policies. Please try again.
              </div>
              <div className="d-flex justify-content-between">
                <button className="btn btn-outline-secondary" disabled>Previous</button>
                <button className="btn btn-outline-secondary" disabled>Next</button>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Placeholder for other tabs */}
      {activeTab === "search" && <SearchTab />}
      {activeTab === "audit" && <AuditHistoryTab />}
      {activeTab !== "policies" && activeTab !== "search" && activeTab !== "audit" && (
        <div className="card">
          <div className="card-body text-center text-muted" style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {[
              "Procedures",
              "Workflow"
            ].find(label => label.toLowerCase().replace(/ /g, "") === activeTab) || "Tab"} content coming soon.
          </div>
        </div>
      )}
      <CreatePolicyPanel show={showCreatePanel} onClose={() => setShowCreatePanel(false)} />
    </div>
  );
};

export default Policies;
