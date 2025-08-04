import React, { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";

const CreatePolicyPanel = ({ show, onClose }) => {
  const editorRef = useRef(null);

  return (
    <div className={`offcanvas offcanvas-end${show ? ' show' : ''} bg-white`} tabIndex="-1" style={{ visibility: show ? 'visible' : 'hidden', width: 700, maxWidth: '100%', background: '#fff' }}>
      <div className="offcanvas-header border-bottom">
        <div>
          <span className="text-success me-2" style={{ fontSize: 22, verticalAlign: 'middle' }}>
            <i className="bi bi-check2-circle"></i>
          </span>
          <span className="fw-bold" style={{ fontSize: 20 }}>Create New Policy</span>
          <div className="text-muted small mt-1">Create a new organizational policy. Fill in the required information below.</div>
        </div>
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
      </div>
      <div className="offcanvas-body">
        <form>
          <div className="mb-3">
            <label className="form-label fw-semibold">Title *</label>
            <input type="text" className="form-control" placeholder="Policy title" required />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Category</label>
            <select className="form-select">
              <option>Security</option>
              <option>Policy</option>
              <option>Procedure</option>
              <option>Architecture</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Status</label>
            <select className="form-select">
              <option>Draft</option>
              <option>Active</option>
              <option>Archived</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Version</label>
            <input type="text" className="form-control" defaultValue="1.0" />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Description</label>
            <textarea className="form-control" rows={3} placeholder="Describe the policy purpose and scope"></textarea>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Content</label>
            <Editor
              apiKey="no-api-key"
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue="<p>Enter the full policy content here</p>"
              init={{
                height: 220,
                menubar: false,
                plugins: [
                  'advlist autolink lists link charmap preview anchor',
                  'searchreplace visualblocks code',
                  'insertdatetime table paste help wordcount'
                ],
                toolbar:
                  'undo redo | formatselect | bold italic underline strikethrough | bullist numlist | alignleft aligncenter alignright | link | removeformat | help',
                content_style: 'body { font-family:Inter,Arial,sans-serif; font-size:16px }'
              }}
            />
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary fw-semibold" style={{ background: '#b3b9e6', borderColor: '#b3b9e6' }} disabled> Create Policy </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePolicyPanel;
