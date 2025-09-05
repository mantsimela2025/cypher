import React, { useState, useEffect, useMemo } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  BlockBetween,
  Row,
  Col,
  Button,
  Icon,
  ReactDataTable,
  UserAvatar,
  RSelect,
} from "@/components/Component";
import { apiClient } from "@/utils/apiClient";
import { log } from "@/utils/config";
import {
  Card,
  UncontrolledDropdown,
  DropdownMenu,
  DropdownToggle,
  DropdownItem,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Badge,
  Progress,
} from "reactstrap";
import "./DocumentLibrary.css";

const DocumentLibrary = () => {
  // State management
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [onSearchText, setOnSearchText] = useState("");
  const [onSearch, setOnSearch] = useState(false);

  // Filter states
  const [filterValues, setFilterValues] = useState({
    reviewStatus: "",
    mimeType: "",
    uploadedBy: "",
    dateRange: ""
  });

  // Modal states
  const [previewModal, setPreviewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadModal, setUploadModal] = useState(false);

  // Mock data for development
  const mockDocuments = [
    {
      id: 1,
      name: "Security Policy Document",
      description: "Comprehensive security policy for organizational compliance",
      fileName: "security_policy_v2.pdf",
      fileSize: 2048576,
      mimeType: "application/pdf",
      reviewStatus: "approved",
      uploadedBy: { id: 1, firstName: "John", lastName: "Doe", email: "john.doe@company.com" },
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-20T14:45:00Z",
      categories: ["Security", "Policy"],
      tags: ["compliance", "security", "policy"],
      associatedControls: ["AC-1", "AC-2", "SC-1"]
    },
    {
      id: 2,
      name: "Network Architecture Diagram",
      description: "Current network topology and security zones",
      fileName: "network_diagram_2024.png",
      fileSize: 5242880,
      mimeType: "image/png",
      reviewStatus: "pending",
      uploadedBy: { id: 2, firstName: "Jane", lastName: "Smith", email: "jane.smith@company.com" },
      createdAt: "2024-01-18T09:15:00Z",
      updatedAt: "2024-01-18T09:15:00Z",
      categories: ["Architecture", "Network"],
      tags: ["network", "diagram", "architecture"],
      associatedControls: ["SC-7", "SC-8"]
    },
    {
      id: 3,
      name: "Incident Response Plan",
      description: "Step-by-step incident response procedures",
      fileName: "incident_response_plan.docx",
      fileSize: 1048576,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      reviewStatus: "approved",
      uploadedBy: { id: 3, firstName: "Mike", lastName: "Johnson", email: "mike.johnson@company.com" },
      createdAt: "2024-01-10T16:20:00Z",
      updatedAt: "2024-01-22T11:30:00Z",
      categories: ["Security", "Procedures"],
      tags: ["incident", "response", "procedures"],
      associatedControls: ["IR-1", "IR-4", "IR-8"]
    }
  ];

  // Initialize data
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        log.api('Fetching documents from document library');
        const data = await apiClient.get('/artifacts');
        setDocuments(data.artifacts || []);
        log.info('Documents loaded successfully:', data.artifacts?.length || 0, 'documents');
      } catch (error) {
        log.error('Error fetching documents:', error.message);
        log.warn('Falling back to mock data');
        // Fallback to mock data if API fails
        setDocuments(mockDocuments);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Helper functions
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return 'file-pdf';
    if (mimeType?.includes('image')) return 'img';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return 'file-docs';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return 'file-xls';
    if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return 'file-ppt';
    return 'file';
  };

  const getFileTypeClass = (mimeType) => {
    if (mimeType?.includes('pdf')) return 'file-pdf';
    if (mimeType?.includes('image')) return 'file-img';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return 'file-doc';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return 'file-xls';
    if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return 'file-ppt';
    return 'file-default';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'success', text: 'Approved' },
      pending: { color: 'warning', text: 'Pending Review' },
      rejected: { color: 'danger', text: 'Rejected' }
    };
    return statusConfig[status] || { color: 'secondary', text: 'Unknown' };
  };

  // Define columns for ReactDataTable (matching Asset Inventory format)
  const documentColumns = [
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Document</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.name,
      sortable: true,
      grow: 2,
      style: { paddingRight: "20px" },
      cell: (row) => (
        <div className="user-card mt-2 mb-2">
          <div className={`user-avatar document-icon ${getFileTypeClass(row.mimeType)}`}>
            <Icon name={getFileIcon(row.mimeType)} />
          </div>
          <div className="user-info">
            <span className="tb-lead" style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              {row.name}
            </span>
            <div className="text-soft" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>
              {row.description}
            </div>
          </div>
        </div>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>File Info</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.fileName,
      sortable: true,
      cell: (row) => (
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
            {row.fileName}
          </div>
          <div className="text-soft" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>
            {formatFileSize(row.fileSize)}
          </div>
        </div>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Status</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.reviewStatus,
      sortable: true,
      width: "120px",
      cell: (row) => {
        const statusBadge = getStatusBadge(row.reviewStatus);
        return (
          <span className={`badge badge-dim bg-${statusBadge.color}`} style={{ fontWeight: '600' }}>
            {statusBadge.text}
          </span>
        );
      },
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Uploaded By</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.uploadedBy.firstName,
      sortable: true,
      grow: 1.5,
      cell: (row) => (
        <div className="user-card">
          <UserAvatar
            size="sm"
            theme="primary"
            text={`${row.uploadedBy.firstName.charAt(0)}${row.uploadedBy.lastName.charAt(0)}`}
          />
          <div className="user-info">
            <span className="tb-lead" style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              {row.uploadedBy.firstName} {row.uploadedBy.lastName}
            </span>
            <div className="text-soft" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>
              {row.uploadedBy.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Date</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.createdAt,
      sortable: true,
      cell: (row) => (
        <div style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#526484' }}>
          {new Date(row.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <UncontrolledDropdown>
          <DropdownToggle tag="a" className="dropdown-toggle btn btn-icon btn-trigger">
            <Icon name="more-h"></Icon>
          </DropdownToggle>
          <DropdownMenu end>
            <ul className="link-list-opt no-bdr">
              <li>
                <DropdownItem
                  tag="a"
                  href="#preview"
                  onClick={(ev) => {
                    ev.preventDefault();
                    setSelectedDocument(row);
                    setPreviewModal(true);
                  }}
                >
                  <Icon name="eye"></Icon>
                  <span>Preview</span>
                </DropdownItem>
              </li>
              <li>
                <DropdownItem tag="a" href="#download">
                  <Icon name="download"></Icon>
                  <span>Download</span>
                </DropdownItem>
              </li>
              <li>
                <DropdownItem tag="a" href="#edit">
                  <Icon name="edit"></Icon>
                  <span>Edit</span>
                </DropdownItem>
              </li>
              <li>
                <DropdownItem tag="a" href="#share">
                  <Icon name="share"></Icon>
                  <span>Share</span>
                </DropdownItem>
              </li>
              <li className="divider"></li>
              <li>
                <DropdownItem tag="a" href="#delete" className="text-danger">
                  <Icon name="trash"></Icon>
                  <span>Delete</span>
                </DropdownItem>
              </li>
            </ul>
          </DropdownMenu>
        </UncontrolledDropdown>
      ),
      allowOverflow: true,
      button: true,
    },
  ];

  return (
    <React.Fragment>
      <Head title="Document Library" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle page>Document Library</BlockTitle>
              <BlockDes className="text-soft">
                Browse and manage your document collection
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <div className="toggle-wrap nk-block-tools-toggle">
                <Button
                  className="btn-icon btn-trigger toggle-expand me-n1"
                  color="transparent"
                >
                  <Icon name="menu-alt-r"></Icon>
                </Button>
                <div className="toggle-expand-content">
                  <ul className="nk-block-tools g-3">
                    <li>
                      <Button color="primary" onClick={() => setUploadModal(true)}>
                        <Icon name="plus" />
                        <span>Add Document</span>
                      </Button>
                    </li>
                    <li>
                      <Button color="secondary" onClick={() => window.location.href = '/document-management/upload'}>
                        <Icon name="upload" />
                        <span>Upload</span>
                      </Button>
                    </li>
                  </ul>
                </div>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {/* Search and Filter Section */}
        <Block>
          <Card className="card-bordered">
            <div className="card-inner">
              <Row className="g-3">
                <Col md="4">
                  <FormGroup>
                    <Label>Search Documents</Label>
                    <div className="form-control-wrap">
                      <div className="form-icon form-icon-left">
                        <Icon name="search"></Icon>
                      </div>
                      <Input
                        type="text"
                        placeholder="Search by name, description..."
                        value={onSearchText}
                        onChange={(e) => setOnSearchText(e.target.value)}
                      />
                    </div>
                  </FormGroup>
                </Col>
                <Col md="2">
                  <FormGroup>
                    <Label>Status</Label>
                    <RSelect
                      options={[
                        { value: "", label: "All Status" },
                        { value: "approved", label: "Approved" },
                        { value: "pending", label: "Pending" },
                        { value: "rejected", label: "Rejected" }
                      ]}
                      value={{ value: filterValues.reviewStatus, label: filterValues.reviewStatus || "All Status" }}
                      onChange={(selected) => setFilterValues({...filterValues, reviewStatus: selected.value})}
                    />
                  </FormGroup>
                </Col>
                <Col md="2">
                  <FormGroup>
                    <Label>File Type</Label>
                    <RSelect
                      options={[
                        { value: "", label: "All Types" },
                        { value: "application/pdf", label: "PDF" },
                        { value: "image", label: "Images" },
                        { value: "document", label: "Documents" }
                      ]}
                      value={{ value: filterValues.mimeType, label: filterValues.mimeType || "All Types" }}
                      onChange={(selected) => setFilterValues({...filterValues, mimeType: selected.value})}
                    />
                  </FormGroup>
                </Col>
                <Col md="2">
                  <FormGroup>
                    <Label>Date Range</Label>
                    <RSelect
                      options={[
                        { value: "", label: "All Dates" },
                        { value: "today", label: "Today" },
                        { value: "week", label: "This Week" },
                        { value: "month", label: "This Month" }
                      ]}
                      value={{ value: filterValues.dateRange, label: filterValues.dateRange || "All Dates" }}
                      onChange={(selected) => setFilterValues({...filterValues, dateRange: selected.value})}
                    />
                  </FormGroup>
                </Col>
                <Col md="2">
                  <FormGroup>
                    <Label>&nbsp;</Label>
                    <div className="d-grid">
                      <Button color="primary" onClick={() => setOnSearch(!onSearch)}>
                        <Icon name="search" />
                        <span>Search</span>
                      </Button>
                    </div>
                  </FormGroup>
                </Col>
              </Row>
            </div>
          </Card>
        </Block>

        {/* Documents Table */}
        <Block>
          <ReactDataTable
            data={documents}
            columns={documentColumns}
            pagination
            actions
            className="nk-tb-list"
            selectableRows
          />
        </Block>

        {/* Document Preview Modal */}
        <Modal isOpen={previewModal} toggle={() => setPreviewModal(false)} size="lg">
          <ModalHeader toggle={() => setPreviewModal(false)}>
            <Icon name="eye" className="me-2" />
            Document Preview
          </ModalHeader>
          <ModalBody>
            {selectedDocument && (
              <div>
                <Row className="g-3 mb-4">
                  <Col md="8">
                    <div className="d-flex align-items-center">
                      <div className="user-avatar bg-primary me-3">
                        <Icon name={getFileIcon(selectedDocument.mimeType)} />
                      </div>
                      <div>
                        <h5 className="mb-1">{selectedDocument.name}</h5>
                        <p className="text-soft mb-0">{selectedDocument.description}</p>
                      </div>
                    </div>
                  </Col>
                  <Col md="4" className="text-end">
                    <Badge color={getStatusBadge(selectedDocument.reviewStatus).color} className="mb-2">
                      {getStatusBadge(selectedDocument.reviewStatus).text}
                    </Badge>
                    <div className="text-soft small">
                      {formatFileSize(selectedDocument.fileSize)}
                    </div>
                  </Col>
                </Row>

                <Row className="g-3">
                  <Col md="6">
                    <div className="form-group">
                      <Label className="form-label">File Name</Label>
                      <div className="form-control-plaintext">{selectedDocument.fileName}</div>
                    </div>
                  </Col>
                  <Col md="6">
                    <div className="form-group">
                      <Label className="form-label">File Type</Label>
                      <div className="form-control-plaintext">{selectedDocument.mimeType}</div>
                    </div>
                  </Col>
                  <Col md="6">
                    <div className="form-group">
                      <Label className="form-label">Uploaded By</Label>
                      <div className="form-control-plaintext">
                        {selectedDocument.uploadedBy.firstName} {selectedDocument.uploadedBy.lastName}
                      </div>
                    </div>
                  </Col>
                  <Col md="6">
                    <div className="form-group">
                      <Label className="form-label">Upload Date</Label>
                      <div className="form-control-plaintext">
                        {new Date(selectedDocument.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Col>
                  <Col md="12">
                    <div className="form-group">
                      <Label className="form-label">Categories</Label>
                      <div className="form-control-plaintext">
                        {selectedDocument.categories.map((category, index) => (
                          <Badge key={index} color="secondary" className="me-1">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Col>
                  <Col md="12">
                    <div className="form-group">
                      <Label className="form-label">Tags</Label>
                      <div className="form-control-plaintext">
                        {selectedDocument.tags.map((tag, index) => (
                          <Badge key={index} color="info" className="me-1">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Col>
                  <Col md="12">
                    <div className="form-group">
                      <Label className="form-label">Associated Controls</Label>
                      <div className="form-control-plaintext">
                        {selectedDocument.associatedControls.map((control, index) => (
                          <Badge key={index} color="primary" className="me-1">
                            {control}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Preview Area */}
                <div className="mt-4">
                  <Label className="form-label">Document Preview</Label>
                  <div className="border rounded p-4 text-center bg-light">
                    <Icon name={getFileIcon(selectedDocument.mimeType)} className="text-soft" style={{ fontSize: '4rem' }} />
                    <p className="mt-3 text-soft">
                      Preview not available for this file type.<br />
                      Click download to view the full document.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary">
              <Icon name="download" className="me-1" />
              Download
            </Button>
            <Button color="secondary" onClick={() => setPreviewModal(false)}>
              Close
            </Button>
          </ModalFooter>
        </Modal>

        {/* Upload Modal */}
        <Modal isOpen={uploadModal} toggle={() => setUploadModal(false)} size="lg">
          <ModalHeader toggle={() => setUploadModal(false)}>
            <Icon name="upload" className="me-2" />
            Upload Document
          </ModalHeader>
          <ModalBody>
            <Form>
              <Row className="g-3">
                <Col md="12">
                  <FormGroup>
                    <Label className="form-label">Document Name</Label>
                    <Input type="text" placeholder="Enter document name" />
                  </FormGroup>
                </Col>
                <Col md="12">
                  <FormGroup>
                    <Label className="form-label">Description</Label>
                    <Input type="textarea" rows="3" placeholder="Enter document description" />
                  </FormGroup>
                </Col>
                <Col md="12">
                  <FormGroup>
                    <Label className="form-label">File Upload</Label>
                    <div className="form-control-wrap">
                      <div className="form-file">
                        <Input type="file" className="form-file-input" id="customFile" />
                        <label className="form-file-label" htmlFor="customFile">Choose file</label>
                      </div>
                    </div>
                    <div className="form-note">
                      Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, PNG, JPG, JPEG
                    </div>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label className="form-label">Category</Label>
                    <RSelect
                      options={[
                        { value: "security", label: "Security" },
                        { value: "policy", label: "Policy" },
                        { value: "procedure", label: "Procedure" },
                        { value: "architecture", label: "Architecture" }
                      ]}
                      placeholder="Select category"
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label className="form-label">Tags</Label>
                    <Input type="text" placeholder="Enter tags (comma separated)" />
                  </FormGroup>
                </Col>
                <Col md="12">
                  <FormGroup>
                    <Label className="form-label">Associated Controls</Label>
                    <Input type="text" placeholder="Enter control IDs (comma separated)" />
                  </FormGroup>
                </Col>
              </Row>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button color="primary">
              <Icon name="upload" className="me-1" />
              Upload Document
            </Button>
            <Button color="secondary" onClick={() => setUploadModal(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </Content>
    </React.Fragment>
  );
};

export default DocumentLibrary;
