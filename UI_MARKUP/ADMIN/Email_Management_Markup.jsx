import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const Tabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "logs", label: "Email Logs" },
    { id: "templates", label: "Email Templates" },
    { id: "smtp", label: "SMTP Configuration" },
    { id: "apis", label: "Email APIs" },
  ];

  return (
    <ul className="nav nav-tabs mb-4">
      {tabs.map((tab) => (
        <li className="nav-item" key={tab.id}>
          <button
            className={`nav-link ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        </li>
      ))}
    </ul>
  );
};

const EmailLogs = () => {
  return (
    <div>
      <h5>Filters</h5>
      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <input type="text" className="form-control" placeholder="Search subject or content..." />
        </div>
        <div className="col-md-2">
          <select className="form-select">
            <option>All Statuses</option>
          </select>
        </div>
        <div className="col-md-2">
          <select className="form-select">
            <option>All Categories</option>
          </select>
        </div>
        <div className="col-md-2">
          <input type="date" className="form-control" placeholder="From Date" />
        </div>
        <div className="col-md-2">
          <input type="date" className="form-control" placeholder="To Date" />
        </div>
        <div className="col-md-1">
          <select className="form-select">
            <option>All Services</option>
          </select>
        </div>
      </div>

      <div className="d-flex gap-2 mb-3">
        <button className="btn btn-outline-secondary btn-sm">Reset Filters</button>
        <button className="btn btn-outline-secondary btn-sm">Refresh</button>
        <button className="btn btn-danger btn-sm ms-auto">Delete Old (30+ days)</button>
      </div>

      <h5>Email Logs</h5>
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Subject</th>
              <th>Recipient</th>
              <th>Status</th>
              <th>Service</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={8} className="text-center">
                No email logs available
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const EmailTemplates = () => {
  return (
    <div>
      <h5>Template Filters</h5>
      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <select className="form-select">
            <option>All Types</option>
          </select>
        </div>
        <div className="col-md-3">
          <select className="form-select">
            <option>All Categories</option>
          </select>
        </div>
        <div className="col-md-4">
          <input type="text" className="form-control" placeholder="Search templates..." />
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100">Create Template</button>
        </div>
      </div>

      <h5>Email Templates</h5>
      <table className="table table-bordered table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Type</th>
            <th>Category</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={6} className="text-center">
              No templates found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const SMTPConfig = () => {
  const [form, setForm] = useState({
    host: "",
    port: "587",
    username: "",
    password: "",
    fromAddress: "",
    tls: false,
    disabled: true,
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};
    if (!form.host) newErrors.host = "SMTP Host is required";
    if (!form.username) newErrors.username = "Username is required";
    if (!form.password) newErrors.password = "Password is required";
    if (!form.fromAddress || !/\S+@\S+\.\S+/.test(form.fromAddress))
      newErrors.fromAddress = "Valid email address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      alert("SMTP configuration saved successfully!");
    }
  };

  return (
    <div>
      <h5>SMTP Server Configuration</h5>
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label>SMTP Host</label>
          <input
            type="text"
            className={`form-control ${errors.host ? "is-invalid" : ""}`}
            value={form.host}
            onChange={(e) => setForm({ ...form, host: e.target.value })}
          />
          {errors.host && <div className="invalid-feedback">{errors.host}</div>}
        </div>
        <div className="col-md-6">
          <label>SMTP Port</label>
          <input
            type="text"
            className="form-control"
            value={form.port}
            onChange={(e) => setForm({ ...form, port: e.target.value })}
          />
        </div>
        <div className="col-md-6">
          <label>Username</label>
          <input
            type="text"
            className={`form-control ${errors.username ? "is-invalid" : ""}`}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          {errors.username && <div className="invalid-feedback">{errors.username}</div>}
        </div>
        <div className="col-md-6">
          <label>Password</label>
          <input
            type="password"
            className={`form-control ${errors.password ? "is-invalid" : ""}`}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {errors.password && <div className="invalid-feedback">{errors.password}</div>}
        </div>
        <div className="col-md-6">
          <label>Default From Address</label>
          <input
            type="email"
            className={`form-control ${errors.fromAddress ? "is-invalid" : ""}`}
            value={form.fromAddress}
            onChange={(e) => setForm({ ...form, fromAddress: e.target.value })}
          />
          {errors.fromAddress && <div className="invalid-feedback">{errors.fromAddress}</div>}
        </div>
        <div className="col-md-6 d-flex align-items-end">
          <div className="form-check form-switch">
            <input
              type="checkbox"
              className="form-check-input"
              checked={form.tls}
              onChange={(e) => setForm({ ...form, tls: e.target.checked })}
            />
            <label className="form-check-label">Secure Connection (TLS)</label>
          </div>
        </div>
      </div>

      <div className="form-check form-switch mb-3">
        <input
          type="checkbox"
          className="form-check-input"
          checked={form.disabled}
          onChange={(e) => setForm({ ...form, disabled: e.target.checked })}
        />
        <label className="form-check-label">SMTP Server Disabled</label>
      </div>

      {form.disabled && (
        <div className="alert alert-warning">
          SMTP Server Disabled: Email sending via SMTP is currently disabled. Enable it to start sending emails.
        </div>
      )}

      <div className="d-flex gap-2">
        <button className="btn btn-outline-secondary">Test Connection</button>
        <button className="btn btn-primary ms-auto" onClick={handleSave}>
          Save Configuration
        </button>
      </div>
    </div>
  );
};

const EmailAPIs = () => {
  const [form, setForm] = useState({
    provider: "SendGrid",
    apiKey: "",
    fromAddress: "",
    webhook: "",
    disabled: true,
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};
    if (!form.apiKey) newErrors.apiKey = "API Key is required";
    if (!form.fromAddress || !/\S+@\S+\.\S+/.test(form.fromAddress))
      newErrors.fromAddress = "Valid email address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      alert("Email API configuration saved successfully!");
    }
  };

  return (
    <div>
      <h5>Email API Integration</h5>
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label>Email Service Provider</label>
          <select
            className="form-select"
            value={form.provider}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
          >
            <option>SendGrid</option>
          </select>
        </div>
        <div className="col-md-6">
          <label>API Key</label>
          <input
            type="text"
            className={`form-control ${errors.apiKey ? "is-invalid" : ""}`}
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
          />
          {errors.apiKey && <div className="invalid-feedback">{errors.apiKey}</div>}
        </div>
        <div className="col-md-6">
          <label>Default From Address</label>
          <input
            type="email"
            className={`form-control ${errors.fromAddress ? "is-invalid" : ""}`}
            value={form.fromAddress}
            onChange={(e) => setForm({ ...form, fromAddress: e.target.value })}
          />
          {errors.fromAddress && <div className="invalid-feedback">{errors.fromAddress}</div>}
        </div>
        <div className="col-md-6">
          <label>Webhook URL (Optional)</label>
          <input
            type="text"
            className="form-control"
            value={form.webhook}
            onChange={(e) => setForm({ ...form, webhook: e.target.value })}
          />
        </div>
      </div>

      <div className="form-check form-switch mb-3">
        <input
          type="checkbox"
          className="form-check-input"
          checked={form.disabled}
          onChange={(e) => setForm({ ...form, disabled: e.target.checked })}
        />
        <label className="form-check-label">Email API Disabled</label>
      </div>

      {form.disabled && (
        <div className="alert alert-warning">
          Email API Disabled: Email sending via SendGrid is currently disabled. Enable it to start sending emails.
        </div>
      )}

      <button className="btn btn-primary" onClick={handleSave}>
        Save Configuration
      </button>
    </div>
  );
};

const EmailManagement = () => {
  const [activeTab, setActiveTab] = useState("logs");

  return (
    <div className="container my-4">
      <h3>Email Management</h3>
      <p className="text-muted">
        Centralized management for all email-related settings, templates, and logs.
      </p>
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="card card-body">
        {activeTab === "logs" && <EmailLogs />}
        {activeTab === "templates" && <EmailTemplates />}
        {activeTab === "smtp" && <SMTPConfig />}
        {activeTab === "apis" && <EmailAPIs />}
      </div>
    </div>
  );
};

export default EmailManagement;