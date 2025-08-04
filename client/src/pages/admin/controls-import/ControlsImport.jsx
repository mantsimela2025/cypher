import React from "react";
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import {
  Block,
  BlockBetween,
  BlockDes,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
} from "@/components/Component";

const ControlsImport = () => {
  return (
    <React.Fragment>
      <Head title="Admin - Controls Import"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>
                Controls Import
              </BlockTitle>
              <BlockDes className="text-soft">
                <p>Import and manage security controls and compliance frameworks.</p>
              </BlockDes>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        <Block>
          <div className="card card-stretch">
            <div className="card-inner">
              {/* Tabs Navigation */}
<ul className="nav nav-tabs mb-4" id="controlsImportTabs" role="tablist">
  <li className="nav-item" role="presentation">
    <button className="nav-link active" id="file-upload-tab" data-bs-toggle="tab" data-bs-target="#file-upload" type="button" role="tab" aria-controls="file-upload" aria-selected="true">
      File Upload
    </button>
  </li>
  <li className="nav-item" role="presentation">
    <button className="nav-link" id="nist-tab" data-bs-toggle="tab" data-bs-target="#nist" type="button" role="tab" aria-controls="nist" aria-selected="false">
      NIST 800-53
    </button>
  </li>
</ul>
{/* Tabs Content */}
<div className="tab-content" id="controlsImportTabsContent">
  <div className="tab-pane fade show active" id="file-upload" role="tabpanel" aria-labelledby="file-upload-tab">
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 420 }}>
    <div className="card w-100" style={{ maxWidth: 600 }}>
      <div className="card-body">
        <h5 className="fw-bold mb-1">Upload Controls File</h5>
        <div className="text-muted mb-4" style={{ fontSize: "1.05rem" }}>
          Import compliance controls from CSV, Excel, or JSON files.
        </div>
        <form>
          <div className="mb-3">
            <label className="form-label fw-semibold">Select Framework</label>
            <select className="form-select" disabled>
              <option>Select a framework</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">File Type</label>
            <select className="form-select">
              <option>CSV</option>
              <option>JSON</option>
              <option>Excel</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">Control File</label>
            <div className="border border-2 rounded-3 p-4 text-center bg-light" style={{ borderStyle: 'dashed' }}>
              <div className="mb-2" style={{ fontSize: 32, color: '#b0b0b0' }}>
                <i className="bi bi-upload" />
              </div>
              <div className="fw-semibold">Click to upload or drag and drop</div>
              <div className="text-muted" style={{ fontSize: '0.95rem' }}>CSV file</div>
            </div>
          </div>
          <div className="d-flex justify-content-between">
            <button type="button" className="btn btn-outline-secondary">Cancel</button>
            <button type="button" className="btn btn-primary" disabled>Import Controls</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
<div className="tab-pane fade" id="nist" role="tabpanel" aria-labelledby="nist-tab">
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 350 }}>
    <div className="card w-100" style={{ maxWidth: 600 }}>
      <div className="card-body">
        <h5 className="fw-bold mb-1">Import NIST 800-53 Controls</h5>
        <div className="text-muted mb-4" style={{ fontSize: "1.05rem" }}>
          Import the latest NIST 800-53 Rev 5 controls directly from the standard.
        </div>
        <form>
          <div className="mb-3">
            <label className="form-label fw-semibold">Select Framework</label>
            <select className="form-select" disabled>
              <option>Select a framework</option>
            </select>
          </div>
          <div className="mb-4">
            <div className="alert alert-secondary mb-0" role="alert">
              <div className="fw-semibold mb-1">About NIST 800-53</div>
              <div>This will import the complete set of NIST Special Publication 800-53 Revision 5 security and privacy controls, including control enhancements and supplemental guidance.</div>
            </div>
          </div>
          <div className="d-flex justify-content-between">
            <button type="button" className="btn btn-outline-secondary">Cancel</button>
            <button type="button" className="btn btn-primary" disabled>Import NIST Controls</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
</div>
</div>
</div>
</Block>
      </Content>
    </React.Fragment>
  );
};

export default ControlsImport;
