import React, { useState, useMemo } from "react";
import { Button } from "reactstrap";

const EmailLogsDataTable = ({ data }) => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filtered data based on search
  const filteredData = useMemo(() => {
    if (!search) return data;
    return data.filter(
      (row) =>
        row.subject?.toLowerCase().includes(search.toLowerCase()) ||
        row.to?.toLowerCase().includes(search.toLowerCase()) ||
        row.status?.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  // Pagination
  const totalRows = filteredData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  // Handlers
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="card card-stretch nk-tb-list">
      <div className="card-inner position-relative card-tools-toggle">
        <div className="card-title-group">
          <div className="card-tools">
            <div className="form-inline flex-nowrap gx-3">
              <div className="form-wrap">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search subject, recipient, or status..."
                  value={search}
                  onChange={handleSearchChange}
                  style={{ minWidth: 220 }}
                />
              </div>
            </div>
          </div>
          <div className="card-tools me-n1">
            <div className="show-entries">
              <span className="show-label">Show</span>
              <select
                className="form-select w-80px"
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>
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
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center">
                  No email logs available
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}</td>
                  <td>{row.subject}</td>
                  <td>{row.to}</td>
                  <td>
                    <span className={`badge badge-${getStatusColor(row.status)}`}>
                      {row.status?.charAt(0).toUpperCase() + row.status?.slice(1)}
                    </span>
                  </td>
                  <td>{row.serviceName?.toUpperCase() || "-"}</td>
                  <td>{row.category?.charAt(0).toUpperCase() + row.category?.slice(1)}</td>
                  <td>
                    <Button size="sm" color="light" className="me-1">
                      View
                    </Button>
                    <Button size="sm" color="danger" outline>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      <div className="card-inner d-flex justify-content-between align-items-center">
        <div>
          Showing {paginatedData.length} of {totalRows} logs
        </div>
        <div>
          <nav>
            <ul className="pagination mb-0">
              <li className={`page-item${currentPage === 1 ? " disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => (
                <li
                  key={i + 1}
                  className={`page-item${currentPage === i + 1 ? " active" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
              <li className={`page-item${currentPage === totalPages ? " disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

function getStatusColor(status) {
  switch (status) {
    case "sent":
    case "delivered":
      return "success";
    case "failed":
    case "bounced":
      return "danger";
    case "pending":
      return "warning";
    default:
      return "secondary";
  }
}

export default EmailLogsDataTable;
