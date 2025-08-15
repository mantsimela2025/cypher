import React, { useState, useEffect } from "react";
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import {
  Block,
  BlockBetween,
  BlockDes,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  Icon,
  Button,
  ReactDataTable,
} from "@/components/Component";
import {
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Form,
  FormGroup,
  Label,
  Input,
  Alert,
  Spinner,
} from "reactstrap";
import classnames from "classnames";
import SlideOutPanel from "@/components/partials/SlideOutPanel";

const NlqAdmin = () => {
  const [activeTab, setActiveTab] = useState("dataSources");
  
  // Data Sources state
  const [dataSources, setDataSources] = useState([]);
  const [dataSourcesLoading, setDataSourcesLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDataSource, setEditingDataSource] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
  
  // Schema/Prompt state
  const [schemaConfig, setSchemaConfig] = useState({
    prompt: '',
    schema_context: ''
  });
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaSaving, setSchemaSaving] = useState(false);
  
  // Query Tester state
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  
  // Logs state
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  
  // Form state for data source add/edit
  const [formData, setFormData] = useState({
    name: '',
    type: 'table',
    enabled: true,
    schema: '{}',
    description: '',
    sample_data: '[]'
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSaving, setFormSaving] = useState(false);

  // Mock data for demonstration
  const mockDataSources = [
    {
      id: 1,
      name: 'Assets',
      type: 'table',
      enabled: true,
      description: 'Asset inventory data',
      schema: { id: 'uuid', name: 'string', type: 'string' },
      sample_data: [{ id: '123', name: 'Server-01', type: 'server' }]
    },
    {
      id: 2,
      name: 'Vulnerabilities',
      type: 'table',
      enabled: true,
      description: 'CVE and vulnerability data',
      schema: { id: 'uuid', cve_id: 'string', severity: 'string' },
      sample_data: [{ id: '456', cve_id: 'CVE-2024-0001', severity: 'high' }]
    }
  ];

  useEffect(() => {
    if (activeTab === "dataSources") {
      // Simulate loading data sources
      setDataSourcesLoading(true);
      setTimeout(() => {
        setDataSources(mockDataSources);
        setDataSourcesLoading(false);
      }, 500);
    }
  }, [activeTab]);

  // Data Sources handlers
  const handleAddDataSource = () => {
    setFormData({
      name: '',
      type: 'table',
      enabled: true,
      schema: '{}',
      description: '',
      sample_data: '[]'
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEditDataSource = (dataSource) => {
    setFormData({
      name: dataSource.name,
      type: dataSource.type,
      enabled: dataSource.enabled,
      schema: JSON.stringify(dataSource.schema, null, 2),
      description: dataSource.description,
      sample_data: JSON.stringify(dataSource.sample_data, null, 2)
    });
    setEditingDataSource(dataSource);
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleDeleteDataSource = (dataSource) => {
    setDeleteConfirm({ show: true, id: dataSource.id, name: dataSource.name });
  };

  const confirmDelete = () => {
    setDataSources(prev => prev.filter(ds => ds.id !== deleteConfirm.id));
    setDeleteConfirm({ show: false, id: null, name: '' });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    
    try {
      JSON.parse(formData.schema);
    } catch {
      errors.schema = 'Invalid JSON format';
    }
    
    try {
      JSON.parse(formData.sample_data);
    } catch {
      errors.sample_data = 'Invalid JSON format';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = () => {
    if (!validateForm()) return;
    
    setFormSaving(true);
    setTimeout(() => {
      const newDataSource = {
        id: showEditModal ? editingDataSource.id : Date.now(),
        ...formData,
        schema: JSON.parse(formData.schema),
        sample_data: JSON.parse(formData.sample_data)
      };
      
      if (showEditModal) {
        setDataSources(prev => prev.map(ds => ds.id === editingDataSource.id ? newDataSource : ds));
      } else {
        setDataSources(prev => [...prev, newDataSource]);
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setFormSaving(false);
    }, 1000);
  };

  const dataSourceColumns = [
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <div>
          <span className="fw-bold">{row.name}</span>
          <div className="text-soft small">ID: {row.id}</div>
        </div>
      ),
    },
    {
      name: "Type",
      selector: (row) => row.type,
      sortable: true,
      cell: (row) => (
        <span className="badge badge-dim bg-primary">{row.type}</span>
      ),
    },
    {
      name: "Status",
      selector: (row) => row.enabled,
      sortable: true,
      cell: (row) => (
        <span className={`badge badge-dim ${row.enabled ? 'bg-success' : 'bg-gray'}`}>
          {row.enabled ? 'Enabled' : 'Disabled'}
        </span>
      ),
    },
    {
      name: "Description",
      selector: (row) => row.description,
      cell: (row) => row.description || <span className="text-soft">No description</span>,
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
                <DropdownItem onClick={() => handleEditDataSource(row)}>
                  <Icon name="edit"></Icon>
                  <span>Edit</span>
                </DropdownItem>
              </li>
              <li className="divider"></li>
              <li>
                <DropdownItem onClick={() => handleDeleteDataSource(row)}>
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

  const renderDataSourcesTab = () => (
    <div className="card card-bordered">
      <div className="card-inner">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="mb-1">Data Sources</h5>
            <p className="text-soft mb-0">Manage data sources for NLQ queries</p>
          </div>
          <Button color="primary" onClick={handleAddDataSource}>
            <Icon name="plus"></Icon>
            <span>Add Data Source</span>
          </Button>
        </div>
        
        {dataSourcesLoading ? (
          <div className="text-center py-5">
            <Spinner color="primary" />
            <div className="mt-3 text-soft">Loading data sources...</div>
          </div>
        ) : (
          <ReactDataTable
            data={dataSources}
            columns={dataSourceColumns}
            pagination
            noDataComponent={
              <div className="text-center py-5">
                <Icon name="database" className="display-1 text-muted mb-3"></Icon>
                <h5 className="mt-3">No data sources found</h5>
                <p className="text-muted">Add your first data source to get started with NLQ.</p>
                <Button color="primary" onClick={handleAddDataSource}>
                  <Icon name="plus"></Icon>
                  <span>Add Data Source</span>
                </Button>
              </div>
            }
            className="nk-tb-list"
          />
        )}
      </div>
    </div>
  );

  const handleSchemaSubmit = () => {
    setSchemaSaving(true);
    setTimeout(() => {
      setSchemaSaving(false);
      // Show success message
    }, 1000);
  };

  const renderSchemaPromptTab = () => (
    <div className="card card-bordered">
      <div className="card-inner">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="mb-1">Schema & Prompt Configuration</h5>
            <p className="text-soft mb-0">Configure system prompts and schema context</p>
          </div>
        </div>
        
        {schemaLoading ? (
          <div className="text-center py-5">
            <Spinner color="primary" />
            <div className="mt-3 text-soft">Loading configuration...</div>
          </div>
        ) : (
          <Form>
            <FormGroup>
              <Label>System Prompt</Label>
              <Input
                type="textarea"
                rows={3}
                value={schemaConfig.prompt}
                onChange={(e) => setSchemaConfig(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="Enter system prompt for the NLQ engine..."
              />
            </FormGroup>
            <FormGroup>
              <Label>Schema Context (JSON)</Label>
              <Input
                type="textarea"
                rows={5}
                value={schemaConfig.schema_context}
                onChange={(e) => setSchemaConfig(prev => ({ ...prev, schema_context: e.target.value }))}
                placeholder="Enter schema context as JSON..."
              />
            </FormGroup>
            <Button
              color="primary"
              onClick={handleSchemaSubmit}
              disabled={schemaSaving}
            >
              {schemaSaving ? <><Spinner size="sm" className="me-2" />Saving...</> : 'Save Configuration'}
            </Button>
          </Form>
        )}
      </div>
    </div>
  );

  const handleTestQuery = () => {
    if (!testQuery.trim()) return;
    
    setTestLoading(true);
    setTestResult(null);
    
    // Simulate API call
    setTimeout(() => {
      setTestResult({
        interpreted: "The user is asking for all assets with high severity vulnerabilities",
        generated_query: "SELECT a.name, a.type, v.cve_id, v.severity FROM assets a JOIN vulnerabilities v ON a.id = v.asset_id WHERE v.severity = 'high'",
        result: [
          { name: 'Server-01', type: 'server', cve_id: 'CVE-2024-0001', severity: 'high' },
          { name: 'Workstation-05', type: 'workstation', cve_id: 'CVE-2024-0002', severity: 'high' }
        ]
      });
      setTestLoading(false);
    }, 2000);
  };

  const renderQueryTesterTab = () => (
    <div className="card card-bordered">
      <div className="card-inner">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="mb-1">Query Tester</h5>
            <p className="text-soft mb-0">Test NLQ queries in real-time</p>
          </div>
        </div>
        
        <FormGroup>
          <div className="input-group">
            <Input
              type="text"
              placeholder="Ask a question in natural language..."
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              disabled={testLoading}
            />
            <Button
              color="primary"
              onClick={handleTestQuery}
              disabled={testLoading || !testQuery.trim()}
            >
              {testLoading ? <><Spinner size="sm" className="me-2" />Testing...</> : 'Test Query'}
            </Button>
          </div>
        </FormGroup>

        {testResult && (
          <div className="card mt-4">
            <div className="card-inner">
              <h6>LLM Reasoning:</h6>
              <p className="text-soft">{testResult.interpreted}</p>
              
              <h6 className="mt-3">Generated Query:</h6>
              <pre className="bg-light p-3 rounded">{testResult.generated_query}</pre>
              
              <h6 className="mt-3">Result:</h6>
              <pre className="bg-light p-3 rounded">{JSON.stringify(testResult.result, null, 2)}</pre>
            </div>
          </div>
        )}

        {!testResult && !testLoading && (
          <Alert color="info" className="mt-4">
            <Icon name="info" className="me-2"></Icon>
            Enter a natural language question above and click "Test Query" to see the results.
          </Alert>
        )}
      </div>
    </div>
  );

  const mockLogs = [
    {
      id: 1,
      created_at: new Date().toISOString(),
      user_id: 'user123',
      question: 'Show me all critical vulnerabilities',
      status: 'success',
      interpreted: 'User wants to see vulnerabilities with critical severity',
      generated_query: 'SELECT * FROM vulnerabilities WHERE severity = "critical"',
      result: [{ count: 15 }]
    },
    {
      id: 2,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      user_id: 'user456',
      question: 'How many servers do we have?',
      status: 'success',
      interpreted: 'User wants count of assets with type server',
      generated_query: 'SELECT COUNT(*) FROM assets WHERE type = "server"',
      result: [{ count: 42 }]
    }
  ];

  useEffect(() => {
    if (activeTab === "logs") {
      setLogsLoading(true);
      setTimeout(() => {
        setLogs(mockLogs);
        setLogsLoading(false);
      }, 500);
    }
  }, [activeTab]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !logSearch || log.question.toLowerCase().includes(logSearch.toLowerCase());
    const matchesStatus = !logStatusFilter || log.status === logStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const logColumns = [
    {
      name: "Time",
      selector: (row) => row.created_at,
      sortable: true,
      cell: (row) => new Date(row.created_at).toLocaleString(),
    },
    {
      name: "User",
      selector: (row) => row.user_id,
      cell: (row) => row.user_id || <span className="text-soft">-</span>,
    },
    {
      name: "Question",
      selector: (row) => row.question,
      cell: (row) => (
        <span className="text-truncate" style={{ maxWidth: '200px' }}>
          {row.question}
        </span>
      ),
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => (
        <span className={`badge badge-dim ${row.status === 'success' ? 'bg-success' : 'bg-danger'}`}>
          {row.status}
        </span>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <Button size="sm" color="primary" outline onClick={() => {
          setSelectedLog(row);
          setShowLogModal(true);
        }}>
          <Icon name="eye"></Icon>
          View
        </Button>
      ),
    },
  ];

  const renderLogsTab = () => (
    <div className="card card-bordered">
      <div className="card-inner">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="mb-1">Query Logs</h5>
            <p className="text-soft mb-0">View query history and performance metrics</p>
          </div>
        </div>
        
        <div className="row mb-3">
          <div className="col-md-6">
            <FormGroup>
              <Input
                type="text"
                placeholder="Search questions..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
              />
            </FormGroup>
          </div>
          <div className="col-md-3">
            <FormGroup>
              <Input
                type="select"
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </Input>
            </FormGroup>
          </div>
        </div>
        
        {logsLoading ? (
          <div className="text-center py-5">
            <Spinner color="primary" />
            <div className="mt-3 text-soft">Loading logs...</div>
          </div>
        ) : (
          <ReactDataTable
            data={filteredLogs}
            columns={logColumns}
            pagination
            noDataComponent={
              <div className="text-center py-5">
                <Icon name="file-text" className="display-1 text-muted mb-3"></Icon>
                <h5 className="mt-3">No query logs found</h5>
                <p className="text-muted">Query logs will appear here once users start using NLQ.</p>
              </div>
            }
            className="nk-tb-list"
          />
        )}
      </div>
    </div>
  );

  return (
    <React.Fragment>
      <Head title="Admin - NLQ Management"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>
                Natural Language Query (NLQ) Administration
              </BlockTitle>
              <BlockDes className="text-soft">
                <p>Manage and configure natural language query functionality.</p>
              </BlockDes>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>
        
        <Block>
          {/* Tab Navigation */}
          <Nav tabs className="mt-n3">
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === "dataSources" })}
                onClick={() => setActiveTab("dataSources")}
                style={{ cursor: "pointer" }}
              >
                <Icon name="database" /> <span>Data Sources</span>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === "schemaPrompt" })}
                onClick={() => setActiveTab("schemaPrompt")}
                style={{ cursor: "pointer" }}
              >
                <Icon name="setting" /> <span>Schema & Prompt</span>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === "queryTester" })}
                onClick={() => setActiveTab("queryTester")}
                style={{ cursor: "pointer" }}
              >
                <Icon name="play" /> <span>Query Tester</span>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === "logs" })}
                onClick={() => setActiveTab("logs")}
                style={{ cursor: "pointer" }}
              >
                <Icon name="file-text" /> <span>Logs</span>
              </NavLink>
            </NavItem>
          </Nav>

          {/* Tab Content */}
          <TabContent activeTab={activeTab}>
            <TabPane tabId="dataSources">
              {activeTab === "dataSources" && renderDataSourcesTab()}
            </TabPane>
            <TabPane tabId="schemaPrompt">
              {activeTab === "schemaPrompt" && renderSchemaPromptTab()}
            </TabPane>
            <TabPane tabId="queryTester">
              {activeTab === "queryTester" && renderQueryTesterTab()}
            </TabPane>
            <TabPane tabId="logs">
              {activeTab === "logs" && renderLogsTab()}
            </TabPane>
          </TabContent>
        </Block>

        {/* Data Source Add/Edit Slide-out Panel */}
        <SlideOutPanel
          isOpen={showAddModal || showEditModal}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
          }}
          title={showEditModal ? 'Edit Data Source' : 'Add Data Source'}
          width="600px"
        >
          <div className="p-4">
            <Form>
              <FormGroup>
                <Label>Name <span className="text-danger">*</span></Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={showEditModal}
                  invalid={!!formErrors.name}
                />
                {formErrors.name && <div className="invalid-feedback d-block">{formErrors.name}</div>}
              </FormGroup>
              <FormGroup>
                <Label>Type</Label>
                <Input
                  type="select"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="table">Table</option>
                  <option value="api">API</option>
                  <option value="service">Service</option>
                </Input>
              </FormGroup>
              <FormGroup check>
                <Input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                />
                <Label check htmlFor="enabled">Enabled</Label>
              </FormGroup>
              <FormGroup>
                <Label>Description</Label>
                <Input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </FormGroup>
              <FormGroup>
                <Label>Schema (JSON) <span className="text-danger">*</span></Label>
                <Input
                  type="textarea"
                  rows={3}
                  value={formData.schema}
                  onChange={(e) => setFormData(prev => ({ ...prev, schema: e.target.value }))}
                  invalid={!!formErrors.schema}
                />
                {formErrors.schema && <div className="invalid-feedback d-block">{formErrors.schema}</div>}
              </FormGroup>
              <FormGroup>
                <Label>Sample Data (JSON Array)</Label>
                <Input
                  type="textarea"
                  rows={2}
                  value={formData.sample_data}
                  onChange={(e) => setFormData(prev => ({ ...prev, sample_data: e.target.value }))}
                  invalid={!!formErrors.sample_data}
                />
                {formErrors.sample_data && <div className="invalid-feedback d-block">{formErrors.sample_data}</div>}
              </FormGroup>
              <div className="d-flex gap-2 pt-3">
                <Button color="secondary" onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onClick={handleFormSubmit}
                  disabled={formSaving || !formData.name.trim()}
                >
                  {formSaving ? <><Spinner size="sm" className="me-2" />Saving...</> : 'Save'}
                </Button>
              </div>
            </Form>
          </div>
        </SlideOutPanel>

        {/* Delete Confirmation Slide-out Panel */}
        <SlideOutPanel
          isOpen={deleteConfirm.show}
          onClose={() => setDeleteConfirm({ show: false, id: null, name: '' })}
          title="Delete Data Source"
          width="500px"
        >
          <div className="p-4">
            <div className="d-flex align-items-center mb-3">
              <Icon name="alert-triangle" className="text-warning fs-3 me-3"></Icon>
              <div>
                <h6 className="mb-1">Are you sure you want to delete this data source?</h6>
                <p className="text-muted mb-0">
                  Data Source: <strong>{deleteConfirm.name}</strong>
                </p>
              </div>
            </div>
            <p className="text-muted mb-4">
              This action cannot be undone. The data source will be removed from all NLQ configurations.
            </p>
            <div className="d-flex gap-2">
              <Button color="secondary" onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}>
                Cancel
              </Button>
              <Button color="danger" onClick={confirmDelete}>
                Delete Data Source
              </Button>
            </div>
          </div>
        </SlideOutPanel>

        {/* Log Detail Slide-out Panel */}
        <SlideOutPanel
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          title="Query Log Details"
          width="800px"
        >
          <div className="p-4">
            {selectedLog && (
              <>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Time:</strong> {new Date(selectedLog.created_at).toLocaleString()}
                  </div>
                  <div className="col-md-6">
                    <strong>User:</strong> {selectedLog.user_id || '-'}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Status:</strong>{' '}
                    <span className={`badge badge-dim ${selectedLog.status === 'success' ? 'bg-success' : 'bg-danger'}`}>
                      {selectedLog.status}
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <strong>Question:</strong>
                  <p className="mt-1">{selectedLog.question}</p>
                </div>
                <div className="mb-3">
                  <strong>LLM Reasoning:</strong>
                  <p className="text-soft mt-1">{selectedLog.interpreted}</p>
                </div>
                <div className="mb-3">
                  <strong>Generated Query:</strong>
                  <pre className="bg-light p-3 rounded mt-1">{selectedLog.generated_query}</pre>
                </div>
                <div className="mb-3">
                  <strong>Result:</strong>
                  <pre className="bg-light p-3 rounded mt-1">{JSON.stringify(selectedLog.result, null, 2)}</pre>
                </div>
                <div className="pt-3">
                  <Button color="secondary" onClick={() => setShowLogModal(false)}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </SlideOutPanel>
      </Content>
    </React.Fragment>
  );
};

export default NlqAdmin;
