import React, { useState } from "react";

const AuditLogs = () => {
  const [filters, setFilters] = useState({
    search: "",
    user: "all",
    action: "all",
    status: "all",
    date: "",
  });

  // Dummy log data - can be connected to API later
  const [logs] = useState([]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  return (
    <div className="container my-4">
      <div className="mb-4" style={{background: '#f7f9fb', padding: '2rem 1.5rem', borderRadius: '0.5rem'}}>
        <h2 style={{fontWeight: 700, color: '#364a63', marginBottom: 0}}>Audit Log</h2>
        <p className="text-muted" style={{marginTop: 8, fontSize: '1.05rem'}}>
          Centralized visibility and tracking for all system and user audit events.
        </p>
      </div>
      <div className="card card-body mb-4">
        <h5 className="mb-3">Filters</h5>
        <div className="row g-3">
          <div className="col-md-3">
            <input
              type="text"
              name="search"
              className="form-control"
              placeholder="Search logs..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>
          <div className="col-md-2">
            <select
              name="user"
              className="form-select"
              value={filters.user}
              onChange={handleFilterChange}
            >
              <option value="all">All Users</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          <div className="col-md-2">
            <select
              name="action"
              className="form-select"
              value={filters.action}
              onChange={handleFilterChange}
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
          </div>
          <div className="col-md-2">
            <select
              name="status"
              className="form-select"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="col-md-3">
            <input
              type="date"
              name="date"
              className="form-control"
              value={filters.date}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      </div>

      <div className="card card-body">
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Action</th>
                <th>Description</th>
                <th>Resource</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center">
                    No results found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>{log.user}</td>
                    <td>{log.action}</td>
                    <td>{log.description}</td>
                    <td>{log.resource}</td>
                    <td>{log.timestamp}</td>
                    <td>{log.status}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-secondary">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
