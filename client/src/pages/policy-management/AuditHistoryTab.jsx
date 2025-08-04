import React, { useState } from "react";
import { FileText, List, LayoutGrid, Check, Clock, User, CalendarDays, Pencil, Eye, CheckCircle, Trash2 } from "lucide-react";

const demoLogs = [
  {
    title: "Information Security Policy",
    type: "Policy",
    action: "Updated",
    icon: <Clock size={18} className="me-1 text-primary" />, // Updated
    desc: "Updated section 3.4 on password requirements",
    user: "John Smith",
    date: "Apr 03, 2025"
  },
  {
    title: "GDPR Compliance Policy",
    type: "Policy",
    action: "Created",
    icon: <Pencil size={18} className="me-1 text-success" />, // Created
    desc: "Created new policy for GDPR compliance",
    user: "Sarah Johnson",
    date: "Apr 02, 2025"
  },
  {
    title: "Password Management Policy",
    type: "Policy",
    action: "Reviewed",
    icon: <Eye size={18} className="me-1 text-warning" />, // Reviewed
    desc: "Completed quarterly review with no changes",
    user: "Alex Rodriguez",
    date: "Apr 01, 2025"
  },
  {
    title: "Incident Response Procedure",
    type: "Procedure",
    action: "Approved",
    icon: <CheckCircle size={18} className="me-1 text-info" />, // Approved
    desc: "Approved v2.3 of the procedure",
    user: "Emily Chen",
    date: "Mar 30, 2025"
  },
  {
    title: "Legacy Security Guidelines",
    type: "Policy",
    action: "Deleted",
    icon: <Trash2 size={18} className="me-1 text-danger" />, // Deleted
    desc: "Archived outdated security guidelines",
    user: "Mark Wilson",
    date: "Mar 28, 2025"
  },
  {
    title: "Data Backup Procedure",
    type: "Procedure",
    action: "Updated",
    icon: <Clock size={18} className="me-1 text-primary" />, // Updated
    desc: "Updated recovery time objectives in section 2.1",
    user: "Lisa Brown",
    date: "Mar 27, 2025"
  },
  {
    title: "Remote Work Security Policy",
    type: "Policy",
    action: "Published",
    icon: <CheckCircle size={18} className="me-1 text-success" />, // Published
    desc: "Published new version 3.0",
    user: "David Miller",
    date: "Mar 25, 2025"
  }
];

const actionOptions = [
  "All Actions",
  "Created",
  "Updated",
  "Approved",
  "Reviewed",
  "Deleted"
];

const AuditHistoryTab = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [view, setView] = useState("list");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-11 col-xl-10">
          <div className="card">
            <div className="card-body">
              {/* Tabs and Controls */}
              <div className="d-flex flex-wrap align-items-center mb-3 gap-2">
                <div className="btn-group me-3" role="group">
                  <button className={`btn rounded-pill fw-semibold${activeTab === "all" ? " btn-light border" : " text-muted"}`} onClick={() => setActiveTab("all")}>All Activity</button>
                  <button className={`btn rounded-pill fw-semibold${activeTab === "policies" ? " btn-light border" : " text-muted"}`} onClick={() => setActiveTab("policies")}>Policies</button>
                  <button className={`btn rounded-pill fw-semibold${activeTab === "procedures" ? " btn-light border" : " text-muted"}`} onClick={() => setActiveTab("procedures")}>Procedures</button>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
                  <button className={`btn${view === "list" ? " btn-primary" : " btn-outline-secondary"}`} style={{padding: 0, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setView("list")}> <List size={12} /> </button>
                  <button className={`btn${view === "grid" ? " btn-primary" : " btn-outline-secondary"}`} style={{padding: 0, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setView("grid")}> <LayoutGrid size={12} /> </button>
                  <input className="form-control ms-2" style={{ width: 220, minWidth: 120 }} placeholder="Search audit logs..." />
                  <div className="dropdown" style={{ minWidth: 140 }}>
                    <button className="btn btn-outline-secondary dropdown-toggle w-100 text-start" type="button" onClick={() => setShowDropdown(!showDropdown)}>
                      {actionFilter}
                    </button>
                    <ul className={`dropdown-menu w-100${showDropdown ? " show" : ""}`} style={{ minWidth: 140 }}>
                      {actionOptions.map(opt => (
                        <li key={opt}>
                          <button className="dropdown-item d-flex align-items-center" onClick={() => { setActionFilter(opt); setShowDropdown(false); }}>
                            {actionFilter === opt && <Check size={16} className="me-2 text-primary" />} {opt}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              {/* Log Title and Subtitle */}
              <div className="fw-bold mb-1" style={{ fontSize: "1.2rem" }}>
                {activeTab === "all" ? "All Activity Log" : activeTab === "policies" ? "Policy Activity Log" : "Procedure Activity Log"}
              </div>
              <div className="text-muted mb-3" style={{ fontSize: "0.97rem" }}>
                {activeTab === "all"
                  ? "Recent activity across all policies and procedures"
                  : activeTab === "policies"
                  ? "Recent activity for policies only"
                  : "Recent activity for procedures only"}
              </div>
              {/* Activity Log */}
              {view === "list" ? (
                <div className="vstack gap-3">
                  {demoLogs.map((log, idx) => (
                    <div className="card mb-3 shadow-sm border-0 rounded-3" key={idx}>
                      <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center">
                        <div className="mb-2 mb-md-0">
                          <div className="fw-semibold d-flex align-items-center mb-1">
                            <FileText size={18} className="me-2 text-secondary" /> {log.title}
                            <span className="badge bg-light text-secondary ms-2">{log.type}</span>
                          </div>
                          <div className="d-flex align-items-center mb-1">
                            {log.icon}
                            <span className="fw-semibold me-2">{log.action}</span>
                          </div>
                          <div className="text-muted">{log.desc}</div>
                        </div>
                        <div className="text-end text-md-end">
                          <div className="text-muted small mb-1">
                            <CalendarDays size={15} className="me-1" /> {log.date}
                          </div>
                          <div className="text-muted small">
                            <User size={15} className="me-1" /> {log.user}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="row g-3">
                  {demoLogs.map((log, idx) => (
                    <div className="col-md-6 col-lg-4" key={idx}>
                      <div className="card mb-3 shadow-sm border-0 rounded-3 h-100 d-flex flex-column justify-content-between">
                        <div className="card-body">
                          <div className="fw-semibold d-flex align-items-center mb-1">
                            <FileText size={18} className="me-2 text-secondary" /> {log.title}
                            <span className="badge bg-light text-secondary ms-2">{log.type}</span>
                          </div>
                          <div className="d-flex align-items-center mb-1">
                            {log.icon}
                            <span className="fw-semibold me-2">{log.action}</span>
                          </div>
                          <div className="text-muted">{log.desc}</div>
                        </div>
                        <div className="card-footer bg-transparent border-0 text-muted small mt-3 d-flex align-items-center justify-content-between">
                          <span><User size={15} className="me-1" /> {log.user}</span>
                          <span><CalendarDays size={15} className="me-1" /> {log.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditHistoryTab;
