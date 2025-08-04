import React, { useState, useEffect } from "react";
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import {
  DropdownMenu,
  DropdownToggle,
  UncontrolledDropdown,
  DropdownItem,
} from "reactstrap";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  Icon,
  Button,
  PreviewCard,
  ReactDataTable,
  UserAvatar,
} from "@/components/Component";
import SystemsStatsCards from "./components/SystemsStatsCards";
import SystemsSearchFilter from "./components/SystemsSearchFilter";
import SystemsDataTable from "./components/SystemsDataTable";
import SystemDetailsPanel from "./components/SystemDetailsPanel";
import { systemsApi } from "@/utils/systemsApi";
import { toast, ToastContainer } from "react-toastify";

const SystemsMainPage = () => {
  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [sm, updateSm] = useState(false);
  const [selectedSystems, setSelectedSystems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(50);
  const [filters, setFilters] = useState({
    status: "",
    systemType: "",
    riskLevel: "",
    source: "",
  });

  // System Details Panel state
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [selectedSystemData, setSelectedSystemData] = useState(null);

  // Helper function to get first letters for avatar
  const findUpper = (string) => {
    const matches = string.match(/[A-Z]/g);
    return matches ? matches.join("").slice(0, 2) : string.slice(0, 2).toUpperCase();
  };

  // Get risk level badge color
  const getRiskBadgeColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
      case 'operational': return 'success';
      case 'inactive': return 'secondary';
      case 'maintenance': return 'warning';
      case 'error': return 'danger';
      default: return 'secondary';
    }
  };

  // Calculate time ago
  const timeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  // Define columns for ReactDataTable (matching the reference design)
  const systemsColumns = [
    {
      name: "System",
      selector: (row) => row.name,
      grow: 2,
      style: { paddingRight: "20px" },
      cell: (row) => (
        <div className="user-card mt-2 mb-2">
          <UserAvatar
            theme="primary"
            text={findUpper(row.name)}
          />
          <div className="user-info">
            <span className="tb-lead" style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              {row.name}
            </span>
            <span className="tb-sub" style={{ fontSize: '0.75rem', color: '#8094ae' }}>{row.systemId}</span>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      name: "Type",
      selector: (row) => row.systemType,
      cell: (row) => {
        const getSystemTypeIcon = (type) => {
          const typeMap = {
            // Core Infrastructure
            'server': { icon: 'server', color: 'primary' },
            'database': { icon: 'db', color: 'success' },
            'db': { icon: 'db', color: 'success' },
            'database server': { icon: 'db', color: 'success' },
            'sql': { icon: 'db', color: 'success' },
            'mysql': { icon: 'db', color: 'success' },
            'postgresql': { icon: 'db', color: 'success' },
            'oracle': { icon: 'db', color: 'success' },

            // Web Systems
            'web': { icon: 'globe', color: 'info' },
            'web server': { icon: 'globe', color: 'info' },
            'website': { icon: 'globe', color: 'info' },
            'webserver': { icon: 'globe', color: 'info' },
            'http': { icon: 'globe', color: 'info' },
            'https': { icon: 'globe', color: 'info' },
            'apache': { icon: 'globe', color: 'info' },
            'nginx': { icon: 'globe', color: 'info' },
            'iis': { icon: 'globe', color: 'info' },

            // User Devices
            'workstation': { icon: 'monitor', color: 'info' },
            'desktop': { icon: 'monitor', color: 'info' },
            'laptop': { icon: 'laptop', color: 'info' },
            'pc': { icon: 'monitor', color: 'info' },
            'computer': { icon: 'monitor', color: 'info' },

            // Network & Infrastructure
            'network': { icon: 'wifi', color: 'warning' },
            'router': { icon: 'wifi', color: 'warning' },
            'switch': { icon: 'network', color: 'warning' },
            'firewall': { icon: 'shield', color: 'danger' },
            'load balancer': { icon: 'network', color: 'warning' },
            'infrastructure': { icon: 'network', color: 'warning' },

            // Storage Systems
            'storage': { icon: 'hard-drive', color: 'purple' },
            'nas': { icon: 'hard-drive', color: 'purple' },
            'san': { icon: 'hard-drive', color: 'purple' },
            'backup': { icon: 'hard-drive', color: 'gray' },

            // Security Systems
            'security': { icon: 'shield-check', color: 'danger' },
            'antivirus': { icon: 'shield', color: 'danger' },
            'ids': { icon: 'shield-alert', color: 'danger' },
            'ips': { icon: 'shield-check', color: 'danger' },

            // Applications & Services
            'application': { icon: 'layers', color: 'teal' },
            'app': { icon: 'layers', color: 'teal' },
            'service': { icon: 'setting', color: 'teal' },
            'api': { icon: 'code', color: 'teal' },

            // Virtualization & Cloud
            'virtual': { icon: 'cloud', color: 'indigo' },
            'vm': { icon: 'cloud', color: 'indigo' },
            'virtual machine': { icon: 'cloud', color: 'indigo' },
            'cloud': { icon: 'cloud', color: 'indigo' },
            'container': { icon: 'box', color: 'orange' },
            'docker': { icon: 'box', color: 'orange' },
            'kubernetes': { icon: 'box', color: 'orange' },

            // Mobile & IoT
            'mobile': { icon: 'mobile', color: 'pink' },
            'tablet': { icon: 'tablet', color: 'pink' },
            'iot': { icon: 'cpu', color: 'cyan' },
            'sensor': { icon: 'cpu', color: 'cyan' },

            // Other
            'printer': { icon: 'printer', color: 'gray' },
            'scanner': { icon: 'camera', color: 'gray' },
            'phone': { icon: 'call', color: 'pink' }
          };

          const systemType = (type || 'unknown').toLowerCase().trim();
          return typeMap[systemType] || { icon: 'help-circle', color: 'light' };
        };

        const typeInfo = getSystemTypeIcon(row.systemType);

        return (
          <div className="d-flex align-items-center" style={{minWidth:'120px'}}>
            <Icon
              name={typeInfo.icon}
              className={`text-${typeInfo.color} me-2`}
              style={{ fontSize: '1.3rem' }}
            />
            <span className="tb-sub" style={{ fontSize: '0.875rem', fontWeight: '500', color: '#526484' }}>
              {row.systemType || 'Unknown'}
            </span>
          </div>
        );
      },
      sortable: true,
      hide: "sm",
    },
    {
      name: "Confidentiality Impact",
      selector: (row) => row.confidentialityImpact,
      cell: (row) => {
        const getImpactBadgeStyle = (impact) => {
          const impactMap = {
            'high': { bg: '#dc3545', color: '#ffffff', text: 'High' },
            'moderate': { bg: '#ffc107', color: '#000000', text: 'Moderate' },
            'low': { bg: '#28a745', color: '#ffffff', text: 'Low' },
            'unknown': { bg: '#6c757d', color: '#ffffff', text: 'Unknown' }
          };
          const impactLevel = (impact || 'unknown').toLowerCase();
          return impactMap[impactLevel] || impactMap['unknown'];
        };

        const badgeStyle = getImpactBadgeStyle(row.confidentialityImpact);

        return (
          <div style={{minWidth:'100px'}}>
            <span
              className="badge"
              style={{
                backgroundColor: badgeStyle.bg,
                color: badgeStyle.color,
                fontSize: '0.75rem',
                fontWeight: '500',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                textTransform: 'capitalize'
              }}
            >
              {badgeStyle.text}
            </span>
          </div>
        );
      },
      sortable: true,
      hide: 480,
    },
    {
      name: "Owner",
      selector: (row) => row.systemOwner,
      cell: (row) => (
        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#526484' }}>
          {row.systemOwner || 'Unassigned'}
        </span>
      ),
      sortable: true,
      hide: "md",
    },
    {
      name: "Integrity Impact",
      selector: (row) => row.integrityImpact,
      sortable: true,
      hide: "md",
      cell: (row) => {
        const getImpactBadgeStyle = (impact) => {
          const impactMap = {
            'high': { bg: '#dc3545', color: '#ffffff', text: 'High' },
            'moderate': { bg: '#ffc107', color: '#000000', text: 'Moderate' },
            'low': { bg: '#28a745', color: '#ffffff', text: 'Low' },
            'unknown': { bg: '#6c757d', color: '#ffffff', text: 'Unknown' }
          };
          const impactLevel = (impact || 'unknown').toLowerCase();
          return impactMap[impactLevel] || impactMap['unknown'];
        };

        const badgeStyle = getImpactBadgeStyle(row.integrityImpact);

        return (
          <div style={{minWidth:'120px'}}>
            <span
              className="badge"
              style={{
                backgroundColor: badgeStyle.bg,
                color: badgeStyle.color,
                fontSize: '0.75rem',
                fontWeight: '500',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                textTransform: 'capitalize'
              }}
            >
              {badgeStyle.text}
            </span>
          </div>
        );
      },
    },
    {
      name: "Availability Impact",
      selector: (row) => row.availabilityImpact,
      sortable: true,
      cell: (row) => {
        const getImpactBadgeStyle = (impact) => {
          const impactMap = {
            'high': { bg: '#dc3545', color: '#ffffff', text: 'High' },
            'moderate': { bg: '#ffc107', color: '#000000', text: 'Moderate' },
            'low': { bg: '#28a745', color: '#ffffff', text: 'Low' },
            'unknown': { bg: '#6c757d', color: '#ffffff', text: 'Unknown' }
          };
          const impactLevel = (impact || 'unknown').toLowerCase();
          return impactMap[impactLevel] || impactMap['unknown'];
        };

        const badgeStyle = getImpactBadgeStyle(row.availabilityImpact);

        return (
          <div style={{minWidth:'120px'}}>
            <span
              className="badge"
              style={{
                backgroundColor: badgeStyle.bg,
                color: badgeStyle.color,
                fontSize: '0.75rem',
                fontWeight: '500',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                textTransform: 'capitalize'
              }}
            >
              {badgeStyle.text}
            </span>
          </div>
        );
      },
      hide: "lg",
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      hide: "sm",
      cell: (row) => (
        <span
          className={`tb-status ms-1 text-${getStatusBadgeColor(row.status)}`}
          style={{ fontSize: '0.875rem', fontWeight: '500' }}
        >
          {row.status}
        </span>
      ),
    },
    {
      name: "Action",
      cell: (row) => (
        <div className="nk-tb-col-tools" style={{minWidth:'60px'}}>
          <ul className="nk-tb-actions gx-1">
            <li>
              <Button
                size="sm"
                color="primary"
                onClick={() => handleViewDetails(row)}
                className="btn-icon"
              >
                <Icon name="eye" />
              </Button>
            </li>
          </ul>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  // Fetch systems data
  useEffect(() => {
    // Test direct fetch first
    console.log('Testing direct fetch to API...');
    fetch('http://localhost:3001/api/v1/systems')
      .then(response => {
        console.log('Direct fetch response:', response);
        return response.json();
      })
      .then(data => {
        console.log('Direct fetch data:', data);
      })
      .catch(error => {
        console.error('Direct fetch error:', error);
      });

    fetchSystems();
    fetchStats();
  }, [currentPage, itemPerPage, filters]);

  const fetchSystems = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemPerPage,
        ...filters,
      };

      console.log('Fetching systems with params:', params);
      const data = await systemsApi.getSystems(params);
      console.log('Systems API response:', data);

      if (data.success) {
        console.log('Setting systems data:', data.data);
        setSystems(data.data);
      } else {
        console.error('API returned success: false');
      }
    } catch (error) {
      console.error('Error fetching systems:', error);
      toast.error('Failed to load systems. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('Fetching systems stats...');
      const data = await systemsApi.getSystemsStats();
      console.log('Stats API response:', data);

      if (data.success) {
        console.log('Setting stats data:', data.data);
        setStats(data.data);
      } else {
        console.error('Stats API returned success: false');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load system statistics.');
    }
  };

  // Handle row selection for ReactDataTable
  const handleRowSelected = (state) => {
    setSelectedSystems(state.selectedRows.map(row => row.id));
  };

  // Handle View Details click
  const handleViewDetails = (system) => {
    console.log('handleViewDetails called with system:', system);
    setSelectedSystemId(system.id);
    setSelectedSystemData(system);
    setDetailsPanelOpen(true);
  };

  // Handle closing details panel
  const handleCloseDetailsPanel = () => {
    setDetailsPanelOpen(false);
    setSelectedSystemId(null);
    setSelectedSystemData(null);
  };

  // Handle filter changes
  const onFilterUpdate = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle export
  const handleExport = async (format) => {
    try {
      const blob = await systemsApi.exportSystems(format, filters);
      const filename = `systems-export-${new Date().toISOString().split('T')[0]}.${format}`;
      systemsApi.downloadFile(blob, filename);
      toast.success(`Systems exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting systems:', error);
      toast.error('Failed to export systems. Please try again.');
    }
  };

  // Test API call function
  const testApiCall = async () => {
    console.log('=== TESTING API CALL ===');
    try {
      const response = await fetch('http://localhost:3001/api/v1/systems');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);
        toast.success(`API Test Success! Found ${data.data?.length || 0} systems`);
      } else {
        console.error('API Response not OK:', response.status, response.statusText);
        toast.error(`API Test Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('API Test Error:', error);
      toast.error(`API Test Error: ${error.message}`);
    }
  };

  return (
    <React.Fragment>
      <Head title="Systems Management" />
      <Content>
        <BlockHead size="sm">
          <div className="nk-block-between">
            <BlockHeadContent>
              <BlockTitle page tag="h3">
                Systems Management
              </BlockTitle>
              <BlockDes className="text-soft">
                <p>Manage and monitor your IT systems, security posture, and compliance status.</p>
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <div className="toggle-wrap nk-block-tools-toggle">
                <Button
                  className={`btn-icon btn-trigger toggle-expand me-n1 ${sm ? "active" : ""}`}
                  onClick={() => updateSm(!sm)}
                >
                  <Icon name="more-v"></Icon>
                </Button>
                <div className="toggle-expand-content" style={{ display: sm ? "block" : "none" }}>
                  <ul className="nk-block-tools g-3">
                    <li>
                      <Button color="info" onClick={testApiCall}>
                        <Icon name="activity"></Icon>
                        <span>Test API</span>
                      </Button>
                    </li>
                    <li className="nk-block-tools-opt">
                      <Button color="primary">
                        <Icon name="plus"></Icon>
                        <span>Add System</span>
                      </Button>
                    </li>
                    <li>
                      <UncontrolledDropdown>
                        <DropdownToggle tag="a" className="dropdown-toggle btn btn-white btn-dim btn-outline-light">
                          <Icon name="download-cloud" className="d-none d-sm-inline"></Icon>
                          <span>Export</span>
                          <Icon className="dd-indc" name="chevron-right"></Icon>
                        </DropdownToggle>
                        <DropdownMenu>
                          <ul className="link-list-opt no-bdr">
                            <li>
                              <DropdownItem
                                href="#"
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  handleExport('csv');
                                }}
                              >
                                Export as CSV
                              </DropdownItem>
                            </li>
                            <li>
                              <DropdownItem
                                href="#"
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  handleExport('json');
                                }}
                              >
                                Export as JSON
                              </DropdownItem>
                            </li>
                          </ul>
                        </DropdownMenu>
                      </UncontrolledDropdown>
                    </li>
                  </ul>
                </div>
              </div>
            </BlockHeadContent>
          </div>
        </BlockHead>

        {/* Stats Cards */}
        <SystemsStatsCards stats={stats} />





        {/* Systems DataTable with Filter and Show Icons */}
        <Block size="lg">
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h4">Systems Inventory</BlockTitle>
              <p>
                Complete list of all systems in your environment with advanced filtering and search capabilities.
              </p>
            </BlockHeadContent>
          </BlockHead>

          {console.log('Rendering SystemsDataTable with systems:', systems, 'Loading:', loading)}
          <SystemsDataTable
            data={systems}
            columns={systemsColumns}
            loading={loading}
            onSelectedRowsChange={handleRowSelected}
            clearSelectedRows={selectedSystems.length === 0}
            onViewDetails={handleViewDetails}
            className="nk-tb-list"
          />
        </Block>
      </Content>
      <ToastContainer />

      {/* System Details Slide-out Panel */}
      <SystemDetailsPanel
        isOpen={detailsPanelOpen}
        onClose={handleCloseDetailsPanel}
        systemId={selectedSystemId}
        systemData={selectedSystemData}
      />
    </React.Fragment>
  );
};

export default SystemsMainPage;
