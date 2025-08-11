import React, { useState, useEffect } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import {
  Card,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  UncontrolledDropdown,
  Badge,
  Button,
  Input,
  Form,
  FormGroup,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  Collapse,
  Row,
  Col
} from "reactstrap";
import {
  Block,
  BlockDes,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  Icon,
  BlockBetween,
} from "@/components/Component";
import DataTable from "react-data-table-component";

const PatchLibrary = () => {
  const [patches, setPatches] = useState([]);
  const [filteredPatches, setFilteredPatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [bulkActionModal, setBulkActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");
  
  // Filter states
  const [filters, setFilters] = useState({
    severity: [],
    vendor: [],
    type: [],
    status: [],
    dateRange: { from: "", to: "" }
  });

  // Fetch patches from API
  useEffect(() => {
    const fetchPatches = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/v1/patches?limit=100', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPatches(data.data || []);
          setFilteredPatches(data.data || []);
        } else {
          // Fallback mock data
          setPatches(mockPatches);
          setFilteredPatches(mockPatches);
        }
      } catch (error) {
        console.error('Error fetching patches:', error);
        // Use mock data on error
        setPatches(mockPatches);
        setFilteredPatches(mockPatches);
      } finally {
        setLoading(false);
      }
    };

    fetchPatches();
  }, []);

  // Mock data for development
  const mockPatches = [
    {
      id: "1",
      patchId: "MS-2024-001",
      title: "Windows Security Update for CVE-2024-1234",
      vendor: "Microsoft",
      severity: "critical",
      type: "security",
      status: "available",
      releaseDate: "2024-01-15T00:00:00Z",
      downloadSize: 52428800,
      rebootRequired: true,
      affectedAssets: 145,
      vulnerabilities: ["CVE-2024-1234", "CVE-2024-1235"]
    },
    {
      id: "2",
      patchId: "ADOBE-2024-002",
      title: "Adobe Reader Security Update",
      vendor: "Adobe",
      severity: "high",
      type: "security",
      status: "approved",
      releaseDate: "2024-01-10T00:00:00Z",
      downloadSize: 124780800,
      rebootRequired: false,
      affectedAssets: 89,
      vulnerabilities: ["CVE-2024-2345"]
    },
    {
      id: "3",
      patchId: "JAVA-2024-003",
      title: "Java Runtime Environment Update 8u401",
      vendor: "Oracle",
      severity: "medium",
      type: "bug_fix",
      status: "scheduled",
      releaseDate: "2024-01-08T00:00:00Z",
      downloadSize: 73400320,
      rebootRequired: false,
      affectedAssets: 234,
      vulnerabilities: []
    },
    {
      id: "4",
      patchId: "CHROME-2024-004",
      title: "Google Chrome Security Update v121",
      vendor: "Google",
      severity: "high",
      type: "security",
      status: "completed",
      releaseDate: "2024-01-05T00:00:00Z",
      downloadSize: 187695104,
      rebootRequired: false,
      affectedAssets: 312,
      vulnerabilities: ["CVE-2024-3456", "CVE-2024-3457"]
    },
    {
      id: "5",
      patchId: "WIN-2024-005",
      title: "Windows 11 Cumulative Update KB5034763",
      vendor: "Microsoft",
      severity: "medium",
      type: "enhancement",
      status: "failed",
      releaseDate: "2024-01-12T00:00:00Z",
      downloadSize: 419430400,
      rebootRequired: true,
      affectedAssets: 67,
      vulnerabilities: []
    }
  ];

  // Filter and search logic
  useEffect(() => {
    let filtered = patches.filter(patch => {
      // Search filter
      const matchesSearch = searchTerm === "" ||
        patch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patch.patchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patch.vendor.toLowerCase().includes(searchTerm.toLowerCase());

      // Severity filter
      const matchesSeverity = filters.severity.length === 0 || filters.severity.includes(patch.severity);
      
      // Vendor filter
      const matchesVendor = filters.vendor.length === 0 || filters.vendor.includes(patch.vendor);
      
      // Type filter
      const matchesType = filters.type.length === 0 || filters.type.includes(patch.type);
      
      // Status filter
      const matchesStatus = filters.status.length === 0 || filters.status.includes(patch.status);

      return matchesSearch && matchesSeverity && matchesVendor && matchesType && matchesStatus;
    });

    setFilteredPatches(filtered);
  }, [patches, searchTerm, filters]);

  // Handle row selection
  const handleRowSelection = (state) => {
    setSelectedRows(state.selectedRows);
  };

  // Handle bulk actions
  const handleBulkAction = (action) => {
    setSelectedAction(action);
    setBulkActionModal(true);
  };

  const executeBulkAction = async () => {
    const token = localStorage.getItem('accessToken');
    const patchIds = selectedRows.map(row => row.id);

    try {
      let endpoint = '';
      let body = {};

      switch (selectedAction) {
        case 'approve':
          endpoint = '/api/v1/patches/bulk/update-status';
          body = { patchIds, status: 'approved' };
          break;
        case 'schedule':
          endpoint = '/api/v1/patches/bulk/update-status';
          body = { patchIds, status: 'scheduled' };
          break;
        case 'cancel':
          endpoint = '/api/v1/patches/bulk/update-status';
          body = { patchIds, status: 'cancelled' };
          break;
        case 'delete':
          endpoint = '/api/v1/patches/bulk/delete';
          body = { patchIds };
          break;
      }

      const response = await fetch(endpoint, {
        method: selectedAction === 'delete' ? 'DELETE' : 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        // Refresh data
        window.location.reload();
      }
    } catch (error) {
      console.error('Bulk action error:', error);
    }

    setBulkActionModal(false);
    setSelectedRows([]);
  };

  // Export functions
  const handleExport = (format) => {
    // Export logic based on format (csv, pdf, excel)
    console.log(`Exporting ${filteredPatches.length} patches as ${format}`);
  };

  // Severity badge color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  // Status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'secondary';
      case 'approved': return 'info';
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'cancelled': return 'dark';
      default: return 'secondary';
    }
  };

  // Data table columns
  const columns = [
    {
      name: 'Patch ID',
      selector: row => row.patchId,
      sortable: true,
      width: '120px',
      cell: row => (
        <div className="tb-lead">
          <span className="title">{row.patchId}</span>
        </div>
      ),
    },
    {
      name: 'Title',
      selector: row => row.title,
      sortable: true,
      grow: 2,
      cell: row => (
        <div className="tb-lead">
          <span className="title">{row.title}</span>
          <span className="sub-text">{row.vendor}</span>
        </div>
      ),
    },
    {
      name: 'Severity',
      selector: row => row.severity,
      sortable: true,
      width: '100px',
      cell: row => (
        <Badge color={getSeverityColor(row.severity)} className="badge-dim">
          {row.severity}
        </Badge>
      ),
    },
    {
      name: 'Type',
      selector: row => row.type,
      sortable: true,
      width: '110px',
      cell: row => (
        <span className="tb-sub">{row.type.replace('_', ' ')}</span>
      ),
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      width: '100px',
      cell: row => (
        <Badge color={getStatusColor(row.status)} className="badge-dim">
          {row.status}
        </Badge>
      ),
    },
    {
      name: 'Release Date',
      selector: row => row.releaseDate,
      sortable: true,
      width: '120px',
      cell: row => (
        <span className="tb-sub">{new Date(row.releaseDate).toLocaleDateString()}</span>
      ),
    },
    {
      name: 'Assets',
      selector: row => row.affectedAssets,
      sortable: true,
      width: '80px',
      cell: row => (
        <span className="tb-amount">{row.affectedAssets}</span>
      ),
    },
    {
      name: 'Size',
      selector: row => row.downloadSize,
      sortable: true,
      width: '90px',
      cell: row => (
        <span className="tb-sub">{(row.downloadSize / 1048576).toFixed(1)} MB</span>
      ),
    },
    {
      name: 'Actions',
      width: '90px',
      cell: row => (
        <UncontrolledDropdown>
          <DropdownToggle tag="a" className="dropdown-toggle btn btn-icon btn-trigger">
            <Icon name="more-h"></Icon>
          </DropdownToggle>
          <DropdownMenu end>
            <ul className="link-list-opt no-bdr">
              <li>
                <DropdownItem tag="a" href="#" onClick={(e) => { e.preventDefault(); /* View details */ }}>
                  <Icon name="eye"></Icon>
                  <span>View Details</span>
                </DropdownItem>
              </li>
              <li>
                <DropdownItem tag="a" href="#" onClick={(e) => { e.preventDefault(); /* Deploy patch */ }}>
                  <Icon name="play-circle"></Icon>
                  <span>Deploy</span>
                </DropdownItem>
              </li>
              <li>
                <DropdownItem tag="a" href="#" onClick={(e) => { e.preventDefault(); /* Edit patch */ }}>
                  <Icon name="edit"></Icon>
                  <span>Edit</span>
                </DropdownItem>
              </li>
              <li>
                <DropdownItem tag="a" href="#" onClick={(e) => { e.preventDefault(); /* Delete patch */ }}>
                  <Icon name="trash"></Icon>
                  <span>Delete</span>
                </DropdownItem>
              </li>
            </ul>
          </DropdownMenu>
        </UncontrolledDropdown>
      ),
    },
  ];

  // Custom styles for data table
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f5f6fa',
        borderTopStyle: 'solid',
        borderTopWidth: '1px',
        borderTopColor: '#e5e9f2',
      },
    },
    headCells: {
      style: {
        fontSize: '13px',
        fontWeight: '500',
        color: '#526484',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    cells: {
      style: {
        fontSize: '14px',
        color: '#364a63',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
      },
    },
  };

  return (
    <React.Fragment>
      <Head title="Patch Management - Patch Library" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>Patch Library</BlockTitle>
              <BlockDes className="text-soft">
                <p>Comprehensive patch repository with search, filtering, and management capabilities</p>
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <div className="toggle-wrap nk-block-tools-toggle">
                <ul className="nk-block-tools g-3">
                  <li>
                    <UncontrolledDropdown>
                      <DropdownToggle tag="a" className="dropdown-toggle btn btn-outline-light btn-white">
                        <Icon name="download-cloud"></Icon>
                        <span>Export</span>
                      </DropdownToggle>
                      <DropdownMenu end>
                        <ul className="link-list-opt no-bdr">
                          <li><DropdownItem tag="a" href="#" onClick={(e) => { e.preventDefault(); handleExport('csv'); }}><span>CSV</span></DropdownItem></li>
                          <li><DropdownItem tag="a" href="#" onClick={(e) => { e.preventDefault(); handleExport('pdf'); }}><span>PDF</span></DropdownItem></li>
                          <li><DropdownItem tag="a" href="#" onClick={(e) => { e.preventDefault(); handleExport('excel'); }}><span>Excel</span></DropdownItem></li>
                        </ul>
                      </DropdownMenu>
                    </UncontrolledDropdown>
                  </li>
                  <li>
                    <Button color="primary" onClick={() => setFilterOpen(!filterOpen)}>
                      <Icon name="filter"></Icon>
                      <span>Filter</span>
                    </Button>
                  </li>
                  <li className="nk-block-tools-opt">
                    <Button color="primary">
                      <Icon name="plus"></Icon>
                      <span>Add Patch</span>
                    </Button>
                  </li>
                </ul>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        <Block>
          <Card className="card-bordered">
            <div className="card-inner">
              {/* Search and bulk actions bar */}
              <div className="nk-tb-list-head">
                <div className="nk-tb-list-search">
                  <Icon name="search"></Icon>
                  <Input
                    type="text"
                    className="form-control border-transparent form-focus-none"
                    placeholder="Search patches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {selectedRows.length > 0 && (
                  <div className="nk-tb-list-tools">
                    <div className="nk-tb-list-tools-opt">
                      <span className="sub-text">{selectedRows.length} selected</span>
                      <UncontrolledDropdown>
                        <DropdownToggle tag="a" className="dropdown-toggle btn btn-trigger btn-icon">
                          <Icon name="more-h"></Icon>
                        </DropdownToggle>
                        <DropdownMenu end>
                          <ul className="link-list-opt no-bdr">
                            <li><DropdownItem tag="a" href="#" onClick={(e) => { e.preventDefault(); handleBulkAction('approve'); }}><span>Approve Selected</span></DropdownItem></li>
                            <li><DropdownItem tag="a" href="#" onClick={(e) => { e.preventDefault(); handleBulkAction('schedule'); }}><span>Schedule Selected</span></DropdownItem></li>
                            <li><DropdownItem tag="a" href="#" onClick={(e) => { e.preventDefault(); handleBulkAction('cancel'); }}><span>Cancel Selected</span></DropdownItem></li>
                            <li><DropdownItem tag="a" href="#" onClick={(e) => { e.preventDefault(); handleBulkAction('delete'); }}><span>Delete Selected</span></DropdownItem></li>
                          </ul>
                        </DropdownMenu>
                      </UncontrolledDropdown>
                    </div>
                  </div>
                )}
              </div>

              {/* Filter Panel */}
              <Collapse isOpen={filterOpen}>
                <div className="filter-wrap">
                  <Row className="gy-2 gx-md-3">
                    <Col size="4">
                      <FormGroup>
                        <Label className="form-label" htmlFor="severity">Severity</Label>
                        <Input type="select" id="severity" multiple>
                          <option value="critical">Critical</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col size="4">
                      <FormGroup>
                        <Label className="form-label" htmlFor="vendor">Vendor</Label>
                        <Input type="select" id="vendor" multiple>
                          <option value="Microsoft">Microsoft</option>
                          <option value="Adobe">Adobe</option>
                          <option value="Oracle">Oracle</option>
                          <option value="Google">Google</option>
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col size="4">
                      <FormGroup>
                        <Label className="form-label" htmlFor="status">Status</Label>
                        <Input type="select" id="status" multiple>
                          <option value="available">Available</option>
                          <option value="approved">Approved</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>
                  <div className="filter-button-wrap">
                    <Button size="sm" color="primary">Apply Filter</Button>
                    <Button size="sm" color="secondary" className="ms-2">Reset</Button>
                  </div>
                </div>
              </Collapse>

              {/* Data Table */}
              <DataTable
                columns={columns}
                data={filteredPatches}
                pagination
                paginationPerPage={25}
                paginationRowsPerPageOptions={[10, 25, 50, 100]}
                selectableRows
                onSelectedRowsChange={handleRowSelection}
                clearSelectedRows={selectedRows.length === 0}
                progressPending={loading}
                progressComponent={
                  <div className="d-flex justify-content-center p-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                  </div>
                }
                customStyles={customStyles}
                responsive
                highlightOnHover
                noDataComponent={
                  <div className="text-center p-4">
                    <Icon name="inbox" className="text-muted mb-2" style={{ fontSize: '2rem' }}></Icon>
                    <p className="text-muted">No patches found</p>
                  </div>
                }
              />
            </div>
          </Card>
        </Block>

        {/* Bulk Action Confirmation Modal */}
        <Modal isOpen={bulkActionModal} toggle={() => setBulkActionModal(false)}>
          <ModalHeader toggle={() => setBulkActionModal(false)}>
            Confirm Bulk Action
          </ModalHeader>
          <ModalBody>
            <p>Are you sure you want to <strong>{selectedAction}</strong> {selectedRows.length} selected patch(es)?</p>
            <div className="d-flex justify-content-end gap-2">
              <Button color="secondary" onClick={() => setBulkActionModal(false)}>Cancel</Button>
              <Button color="primary" onClick={executeBulkAction}>Confirm</Button>
            </div>
          </ModalBody>
        </Modal>
      </Content>
    </React.Fragment>
  );
};

export default PatchLibrary;