import React, { useState } from "react";
import { FileText, ClipboardList } from "lucide-react";

const SearchTab = () => {
  const [activeSubTab, setActiveSubTab] = useState("policies");

  return (
    <div className="row g-4">
      {/* Search Filters */}
      <div className="col-md-4 col-lg-3">
        <div className="card h-100">
          <div className="card-body">
            <h5 className="fw-bold mb-1">Search Filters</h5>
            <div className="text-muted mb-4" style={{ fontSize: "0.97rem" }}>
              Refine your search criteria
            </div>
            <form>
              <div className="mb-3">
                <label className="form-label fw-semibold">Keywords</label>
                <input type="text" className="form-control" placeholder="Search for keywords..." />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Category</label>
                <select className="form-select">
                  <option>All Categories</option>
                  <option>Security</option>
                  <option>Policy</option>
                  <option>Procedure</option>
                  <option>Architecture</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Status</label>
                <select className="form-select">
                  <option>All Statuses</option>
                  <option>Draft</option>
                  <option>Active</option>
                  <option>Archived</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Effective Date (From)</label>
                <input type="date" className="form-control" />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Effective Date (To)</label>
                <input type="date" className="form-control" />
              </div>
              <button type="button" className="btn btn-primary w-100 mt-2">
                <i className="bi bi-search me-2"></i>Search
              </button>
            </form>
          </div>
        </div>
      </div>
      {/* Results & Tabs */}
      <div className="col-md-8 col-lg-9">
        <div className="d-flex justify-content-center mb-3">
          <div className="bg-light rounded-pill d-flex" style={{ width: 320 }}>
            <button
              className={`btn rounded-pill flex-fill fw-semibold${activeSubTab === "policies" ? " btn-white border" : " text-muted"}`}
              style={{ boxShadow: "none" }}
              onClick={() => setActiveSubTab("policies")}
            >
              Policies
            </button>
            <button
              className={`btn rounded-pill flex-fill fw-semibold${activeSubTab === "procedures" ? " btn-white border" : " text-muted"}`}
              style={{ boxShadow: "none" }}
              onClick={() => setActiveSubTab("procedures")}
            >
              Procedures
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            {activeSubTab === "policies" ? (
              <>
                <div className="d-flex align-items-center mb-2 fw-semibold">
                  <FileText size={20} className="me-2" /> Policy Results
                </div>
                <div className="text-muted mb-4" style={{ fontSize: "0.97rem" }}>
                  Search for policies using the filters
                </div>
                <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 180 }}>
                  <FileText size={48} className="mb-2 text-secondary" />
                  <div className="fw-semibold mb-1">No matching policies found</div>
                  <div className="text-muted">Try adjusting your search criteria to see more results</div>
                </div>
              </>
            ) : (
              <>
                <div className="d-flex align-items-center mb-2 fw-semibold">
                  <ClipboardList size={20} className="me-2" /> Procedure Results
                </div>
                <div className="text-muted mb-4" style={{ fontSize: "0.97rem" }}>
                  Search for procedures using the filters
                </div>
                <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 180 }}>
                  <ClipboardList size={48} className="mb-2 text-secondary" />
                  <div className="fw-semibold mb-1">No matching procedures found</div>
                  <div className="text-muted">Try adjusting your search criteria to see more results</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchTab;
