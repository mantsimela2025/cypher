import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { getDataSources, getNlqConfig, updateNlqConfig, addDataSource, updateDataSource, deleteDataSource, testNlqQuery, getNlqLogs, getNlqLogDetail } from "./nlqAdminApi";

function SchemaPromptTab() {
  const [prompt, setPrompt] = useState("");
  const [schemaContext, setSchemaContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getNlqConfig()
      .then((data) => {
        setPrompt(data.prompt || "");
        setSchemaContext(
          typeof data.schema_context === "string"
            ? data.schema_context
            : JSON.stringify(data.schema_context || {}, null, 2)
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateNlqConfig({
        prompt,
        schema_context: schemaContext,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h5>Schema & Prompt</h5>
      {loading ? (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div className="mb-3">
            <label className="form-label">System Prompt</label>
            <textarea
              className="form-control"
              rows={3}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Edit system prompt here..."
              disabled={saving}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Schema Context (JSON)</label>
            <textarea
              className="form-control"
              rows={5}
              value={schemaContext}
              onChange={e => setSchemaContext(e.target.value)}
              placeholder="Edit schema context here..."
              disabled={saving}
            />
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">Saved successfully!</div>}
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      )}
    </div>
  );
}

function DataSourcePanel({ show, mode, source, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: "",
    type: "table",
    enabled: true,
    schema: "{}",
    description: "",
    sample_data: "[]"
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [jsonError, setJsonError] = useState({ schema: null, sample_data: null });
  const [nameError, setNameError] = useState(null);
  const nameInputRef = React.useRef();

  // For duplicate name check
  const [allNames, setAllNames] = useState([]);
  useEffect(() => {
    if (window.dataSourcesForValidation) {
      setAllNames(window.dataSourcesForValidation.map(ds => ds.name));
    }
  }, [show]);

  useEffect(() => {
    if (show && nameInputRef.current) {
      nameInputRef.current.focus();
    }
    if (mode === "edit" && source) {
      setForm({
        name: source.name || "",
        type: source.type || "table",
        enabled: !!source.enabled,
        schema: JSON.stringify(source.schema || {}, null, 2),
        description: source.description || "",
        sample_data: JSON.stringify(source.sample_data || [], null, 2)
      });
    } else {
      setForm({
        name: "",
        type: "table",
        enabled: true,
        schema: "{}",
        description: "",
        sample_data: "[]"
      });
    }
    setError(null);
    setSuccess(false);
    setJsonError({ schema: null, sample_data: null });
    setNameError(null);
  }, [show, mode, source]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    if (name === "name") setNameError(null);
    if (name === "schema" || name === "sample_data") setJsonError((err) => ({ ...err, [name]: null }));
  };

  const validateJson = (field, value) => {
    try {
      JSON.parse(value);
      return null;
    } catch {
      return `Invalid JSON in ${field}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    // Validate required fields
    if (!form.name.trim()) {
      setNameError("Name is required");
      setSaving(false);
      return;
    }
    if (mode === "add" && allNames.includes(form.name.trim())) {
      setNameError("A data source with this name already exists.");
      setSaving(false);
      return;
    }
    // Validate JSON fields
    const schemaErr = validateJson("schema", form.schema);
    const sampleErr = validateJson("sample_data", form.sample_data);
    setJsonError({ schema: schemaErr, sample_data: sampleErr });
    if (schemaErr || sampleErr) {
      setSaving(false);
      return;
    }
    try {
      const payload = {
        ...form,
        schema: JSON.parse(form.schema),
        sample_data: JSON.parse(form.sample_data)
      };
      if (mode === "add") {
        await addDataSource(payload);
      } else {
        await updateDataSource(source.id, payload);
      }
      setSuccess(true);
      setTimeout(() => {
        onSaved();
      }, 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`offcanvas offcanvas-end${show ? " show" : ""}`} tabIndex="-1" style={{ visibility: show ? "visible" : "hidden", width: 420, zIndex: 2000 }}>
      <div className="offcanvas-header">
        <h5 className="offcanvas-title">{mode === "add" ? "Add Data Source" : "Edit Data Source"}</h5>
        <button type="button" className="btn-close" onClick={onClose}></button>
      </div>
      <div className="offcanvas-body">
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="mb-3">
            <label className="form-label">Name <span className="text-danger">*</span></label>
            <input className="form-control" name="name" value={form.name} onChange={handleChange} required disabled={mode === "edit"} ref={nameInputRef} />
            {nameError && <div className="text-danger small mt-1">{nameError}</div>}
          </div>
          <div className="mb-3">
            <label className="form-label">Type</label>
            <select className="form-select" name="type" value={form.type} onChange={handleChange} required>
              <option value="table">Table</option>
              <option value="api">API</option>
              <option value="service">Service</option>
            </select>
          </div>
          <div className="form-check mb-3">
            <input className="form-check-input" type="checkbox" name="enabled" checked={form.enabled} onChange={handleChange} id="enabledCheck" />
            <label className="form-check-label" htmlFor="enabledCheck">Enabled</label>
          </div>
          <div className="mb-3">
            <label className="form-label">Schema (JSON) <span className="text-danger">*</span>
              <span className="ms-1 text-muted" title='Describe the fields and types for this data source. Example: {"id":"uuid","name":"string"}'><i className="bi bi-info-circle"></i></span>
            </label>
            <textarea className="form-control" name="schema" rows={3} value={form.schema} onChange={handleChange} required />
            {jsonError.schema && <div className="text-danger small mt-1">{jsonError.schema}</div>}
          </div>
          <div className="mb-3">
            <label className="form-label">Description</label>
            <input className="form-control" name="description" value={form.description} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Sample Data (JSON Array)
              <span className="ms-1 text-muted" title='Provide example records for LLM context. Example: [{"id":1,"name":"web-server-01"}]'><i className="bi bi-info-circle"></i></span>
            </label>
            <textarea className="form-control" name="sample_data" rows={2} value={form.sample_data} onChange={handleChange} />
            {jsonError.sample_data && <div className="text-danger small mt-1">{jsonError.sample_data}</div>}
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">Saved successfully!</div>}
          <button className="btn btn-primary" type="submit" disabled={saving || !form.name.trim() || jsonError.schema || jsonError.sample_data || nameError}>
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}

function QueryTesterTab() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await testNlqQuery(question);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h5>Query Tester</h5>
      <form className="mb-3" onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Ask a question..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            disabled={loading}
          />
          <button className="btn btn-primary" type="submit" disabled={loading || !question.trim()}>
            {loading ? "Testing..." : "Test Query"}
          </button>
        </div>
      </form>
      {error && <div className="alert alert-danger">{error}</div>}
      {result && (
        <div className="card mb-3">
          <div className="card-body">
            <div className="mb-2"><strong>LLM Reasoning:</strong><br />{result.interpreted || <span className="text-muted">(none)</span>}</div>
            <div className="mb-2"><strong>Generated Query:</strong><br /><pre className="bg-light p-2 rounded">{result.generated_query || "(none)"}</pre></div>
            <div className="mb-2"><strong>Result:</strong><br /><pre className="bg-light p-2 rounded">{JSON.stringify(result.result, null, 2)}</pre></div>
            {result.error && <div className="alert alert-warning mt-2">{result.error}</div>}
          </div>
        </div>
      )}
      {!result && !error && <div className="alert alert-info">Results will appear here.</div>}
    </div>
  );
}

function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [logDetail, setLogDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    getNlqLogs()
      .then(setLogs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRowClick = async (log) => {
    setSelectedLog(log);
    setDetailLoading(true);
    setDetailError(null);
    setLogDetail(null);
    try {
      const detail = await getNlqLogDetail(log.id);
      setLogDetail(detail);
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedLog(null);
    setLogDetail(null);
    setDetailError(null);
  };

  // Filtering logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch = !search || (log.question && log.question.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || (log.status && log.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <h5>Logs</h5>
      <div className="row mb-2">
        <div className="col-md-4 mb-2">
          <input
            className="form-control"
            placeholder="Search question..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-3 mb-2">
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Question</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted">No logs found.</td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} style={{ cursor: "pointer" }} onClick={() => handleRowClick(log)}>
                  <td>{log.created_at ? new Date(log.created_at).toLocaleString() : ""}</td>
                  <td>{log.user_id || "-"}</td>
                  <td>{log.question}</td>
                  <td>{log.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      {/* Modal for log details */}
      {selectedLog && (
        <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,0.3)" }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Log Details</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                {detailLoading ? (
                  <div className="text-center my-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : detailError ? (
                  <div className="alert alert-danger">{detailError}</div>
                ) : logDetail ? (
                  <>
                    <div><strong>Time:</strong> {logDetail.created_at ? new Date(logDetail.created_at).toLocaleString() : ""}</div>
                    <div><strong>User:</strong> {logDetail.user_id || "-"}</div>
                    <div><strong>Question:</strong> {logDetail.question}</div>
                    <div><strong>Status:</strong> {logDetail.status}</div>
                    <div className="mt-2"><strong>LLM Reasoning:</strong><br />{logDetail.interpreted || <span className="text-muted">(none)</span>}</div>
                    <div className="mt-2"><strong>Generated Query:</strong><br /><pre className="bg-light p-2 rounded">{logDetail.generated_query || "(none)"}</pre></div>
                    <div className="mt-2"><strong>Result:</strong><br /><pre className="bg-light p-2 rounded">{JSON.stringify(logDetail.result, null, 2)}</pre></div>
                    {logDetail.error && <div className="alert alert-warning mt-2">{logDetail.error}</div>}
                  </>
                ) : null}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const NlqAdmin = () => {
  const [activeTab, setActiveTab] = useState("dataSources");
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [panelMode, setPanelMode] = useState("add"); // 'add' or 'edit'
  const [selectedSource, setSelectedSource] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDataSources = () => {
    setLoading(true);
    setError(null);
    getDataSources()
      .then((data) => {
        setDataSources(data);
        window.dataSourcesForValidation = data; // for duplicate name check in panel
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (activeTab === "dataSources") {
      fetchDataSources();
    }
  }, [activeTab]);

  const handleAdd = () => {
    setPanelMode("add");
    setSelectedSource(null);
    setShowPanel(true);
  };

  const handleEdit = (source) => {
    setPanelMode("edit");
    setSelectedSource(source);
    setShowPanel(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this data source?")) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteDataSource(id);
      fetchDataSources();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="container my-5">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">NLQ Admin Interface</h4>
        </div>
        <div className="card-body">
          {/* Tabs */}
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === "dataSources" ? "active" : ""}`} onClick={() => setActiveTab("dataSources")}>Data Sources</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === "schemaPrompt" ? "active" : ""}`} onClick={() => setActiveTab("schemaPrompt")}>Schema/Prompt</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === "queryTester" ? "active" : ""}`} onClick={() => setActiveTab("queryTester")}>Query Tester</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === "logs" ? "active" : ""}`} onClick={() => setActiveTab("logs")}>Logs</button>
            </li>
          </ul>

          {/* Tab Content */}
          {activeTab === "dataSources" && (
            <div>
              <h5>Data Sources</h5>
              {loading ? (
                <div className="text-center my-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-danger">{error}</div>
              ) : (
                <>
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Enabled</th>
                        <th>Description</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataSources.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center text-muted">No data sources found.</td>
                        </tr>
                      ) : (
                        dataSources.map((ds) => (
                          <tr key={ds.id}>
                            <td>{ds.name}</td>
                            <td>{ds.type}</td>
                            <td>{ds.enabled ? "Yes" : "No"}</td>
                            <td>{ds.description}</td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(ds)}>Edit</button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(ds.id)} disabled={deleteLoading && deletingId === ds.id}>Delete</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  {deleteError && <div className="alert alert-danger">{deleteError}</div>}
                  <button className="btn btn-success" onClick={handleAdd}>Add Data Source</button>
                </>
              )}
              {/* Slide-out panel for add/edit */}
              <DataSourcePanel
                show={showPanel}
                mode={panelMode}
                source={selectedSource}
                onClose={() => setShowPanel(false)}
                onSaved={() => {
                  setShowPanel(false);
                  fetchDataSources();
                }}
              />
            </div>
          )}

          {activeTab === "schemaPrompt" && (
            <SchemaPromptTab />
          )}

          {activeTab === "queryTester" && (
            <QueryTesterTab />
          )}

          {activeTab === "logs" && (
            <LogsTab />
          )}
        </div>
      </div>
    </div>
  );
};

export default NlqAdmin;
