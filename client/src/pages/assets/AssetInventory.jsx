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
import AssetStatsCards from "./components/AssetStatsCards";
import AssetStatusCharts from "./components/AssetStatusCharts";

import AssetDataTable from "./components/AssetDataTable";
import AssetDetailsPanel from "./components/AssetDetailsPanel";
import AssetLifecyclePanel from "./components/AssetLifecyclePanel";
import AssetCostManagementPanel from "./components/AssetCostManagementPanel";
import AssetTagsManagementPanel from "./components/AssetTagsManagementPanel";
import AssetOperationalCostsPanel from "./components/AssetOperationalCostsPanel";
import AssetRiskMappingPanel from "./components/AssetRiskMappingPanel";
import AddAssetPanel from "./components/AddAssetPanel";
import DiagramGenerationPanel from "./components/DiagramGenerationPanel";
import { assetsApi } from "@/utils/assetsApi";
import { assetTagsApi } from "@/utils/assetTagsApi";
import { toast, ToastContainer } from "react-toastify";

const AssetInventory = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [chartData, setChartData] = useState({});
  const [pagination, setPagination] = useState({});
  const [sm, updateSm] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(50);
  const [filters, setFilters] = useState({
    criticality: "",
    hasAgent: "",
    source: "",
    search: "",
    assetType: "",
    tags: [], // Array of selected tag filters
  });

  // Asset details panel state
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [selectedAssetUuid, setSelectedAssetUuid] = useState(null);
  const [selectedAssetData, setSelectedAssetData] = useState(null);

  // Asset lifecycle panel state
  const [lifecyclePanelOpen, setLifecyclePanelOpen] = useState(false);

  // Asset cost management panel state
  const [costManagementPanelOpen, setCostManagementPanelOpen] = useState(false);

  // Asset tags management panel state
  const [tagsManagementPanelOpen, setTagsManagementPanelOpen] = useState(false);

  // Asset operational costs panel state
  const [operationalCostsPanelOpen, setOperationalCostsPanelOpen] = useState(false);

  // Asset risk mapping panel state
  const [riskMappingPanelOpen, setRiskMappingPanelOpen] = useState(false);

  // Add asset panel state
  const [addAssetPanelOpen, setAddAssetPanelOpen] = useState(false);

  // Diagram generation panel state
  const [diagramGenerationPanelOpen, setDiagramGenerationPanelOpen] = useState(false);

  // Helper function to get first letters for avatar
  const findUpper = (string) => {
    const matches = string.match(/[A-Z]/g);
    return matches ? matches.join("").slice(0, 2) : string.slice(0, 2).toUpperCase();
  };

  // Get criticality badge color
  const getCriticalityBadgeColor = (criticality) => {
    switch (criticality) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  // Get AES (Asset Exposure Score) badge color
  const getAESBadgeColor = (score) => {
    if (!score) return 'bg-secondary';
    if (score >= 700) return 'bg-danger';
    if (score >= 500) return 'bg-warning';
    if (score >= 300) return 'bg-info';
    return 'bg-success';
  };

  // Format date like Tenable (MM/DD/YYYY)
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
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

  // Define columns for ReactDataTable (matching Tenable format)
  const assetColumns = [
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Name</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.hostname,
      sortable: true,
      grow: 2,
      style: { paddingRight: "20px" },
      cell: (row) => (
        <div className="user-card mt-2 mb-2">
          <UserAvatar
            theme="primary"
            text={findUpper(row.hostname || row.netbiosName || 'UN')}
          />
          <div className="user-info">
            <span className="tb-lead" style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              {row.hostname || row.netbiosName || 'Unknown'}
            </span>
            <div className="text-soft" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>
              {row.assetUuid.substring(0, 8)}...
            </div>
          </div>
        </div>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>AES</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.exposureScore,
      sortable: true,
      width: "80px",
      cell: (row) => (
        <span className={`badge badge-dim ${getAESBadgeColor(row.exposureScore)}`} style={{ fontWeight: '600' }}>
          {row.exposureScore || 0}
        </span>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>ACR</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.acrScore,
      sortable: true,
      width: "80px",
      cell: (row) => (
        <div style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>
          {row.acrScore || 'N/A'}
        </div>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>IPv4 Address</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.ipv4Address,
      sortable: true,
      cell: (row) => (
        <div style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>
          {row.ipv4Address || 'N/A'}
        </div>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Operating System</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.operatingSystem,
      sortable: true,
      grow: 1.5,
      cell: (row) => (
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
            {row.operatingSystem || 'Unknown'}
          </div>
          {row.systemType && (
            <div className="text-soft" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>
              {row.systemType}
            </div>
          )}
        </div>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Last Seen</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.lastSeen,
      sortable: true,
      cell: (row) => (
        <div style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#526484' }}>
          {formatDate(row.lastSeen)}
        </div>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Source</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.source,
      sortable: true,
      cell: (row) => (
        <span className="badge badge-dim bg-info" style={{ fontWeight: '600' }}>
          {row.source || 'Unknown'}
        </span>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Tags</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.tags,
      sortable: true,
      grow: 1.5,
      cell: (row) => (
        <div className="d-flex flex-wrap gap-1">
          {row.tags && row.tags.length > 0 ? (
            row.tags.slice(0, 3).map((tag, index) => (
              <span
                key={tag.id || index}
                className={`badge badge-dim bg-${assetTagsApi.getTagColor(tag.key)} text-white`}
                style={{ fontSize: '0.75rem', fontWeight: '600' }}
                title={`${tag.key}: ${tag.value}`}
              >
                {tag.value}
              </span>
            ))
          ) : (
            <span className="text-soft" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>No tags</span>
          )}
          {row.tags && row.tags.length > 3 && (
            <span className="text-soft" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>
              +{row.tags.length - 3} more
            </span>
          )}
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
                  href="#view"
                  onClick={(ev) => {
                    ev.preventDefault();
                    handleViewAsset(row.assetUuid);
                  }}
                >
                  <Icon name="eye"></Icon>
                  <span>View Details</span>
                </DropdownItem>
              </li>
              <li>
                <DropdownItem
                  tag="a"
                  href="#vulnerabilities"
                  onClick={(ev) => {
                    ev.preventDefault();
                    handleViewVulnerabilities(row.assetUuid);
                  }}
                >
                  <Icon name="shield-check"></Icon>
                  <span>View Vulnerabilities</span>
                </DropdownItem>
              </li>
              <li>
                <DropdownItem
                  tag="a"
                  href="#lifecycle"
                  onClick={(ev) => {
                    ev.preventDefault();
                    handleViewLifecycle(row.assetUuid);
                  }}
                >
                  <Icon name="clock"></Icon>
                  <span>Asset Lifecycle</span>
                </DropdownItem>
              </li>
              <li>
                <DropdownItem
                  tag="a"
                  href="#costs"
                  onClick={(ev) => {
                    ev.preventDefault();
                    handleViewCosts(row.assetUuid);
                  }}
                >
                  <Icon name="coins"></Icon>
                  <span>Cost Management</span>
                </DropdownItem>
              </li>
              <li>
                <DropdownItem
                  tag="a"
                  href="#tags"
                  onClick={(ev) => {
                    ev.preventDefault();
                    handleManageTags(row.assetUuid);
                  }}
                >
                  <Icon name="tags"></Icon>
                  <span>Manage Tags</span>
                </DropdownItem>
              </li>
              <li>
                <DropdownItem
                  tag="a"
                  href="#operational-costs"
                  onClick={(ev) => {
                    ev.preventDefault();
                    handleViewOperationalCosts(row.assetUuid);
                  }}
                >
                  <Icon name="activity"></Icon>
                  <span>Operational Costs</span>
                </DropdownItem>
              </li>
              <li>
                <DropdownItem
                  tag="a"
                  href="#risk-mapping"
                  onClick={(ev) => {
                    ev.preventDefault();
                    handleViewRiskMapping(row.assetUuid);
                  }}
                >
                  <Icon name="shield"></Icon>
                  <span>Risk Mapping</span>
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

  // API Functions
  // Fetch tags for assets
  const fetchAssetTags = async (assetUuids) => {
    try {
      if (!assetUuids || assetUuids.length === 0) return {};

      const response = await assetTagsApi.getMultipleAssetTags(assetUuids);
      if (response.success) {
        return response.data;
      }
      return {};
    } catch (error) {
      console.error('Error fetching asset tags:', error);
      return {};
    }
  };

  const fetchAssets = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching assets...');

      // Build query parameters
      const params = {
        page: currentPage,
        limit: itemPerPage,
        ...filters
      };

      console.log('📡 API params:', params);
      const data = await assetsApi.getAssets(params);
      console.log('📥 API response:', data);

      if (data.success) {
        console.log(`📊 SUCCESS: Received ${data.data.assets.length} assets from API`);
        console.log(`📊 PAGINATION:`, data.data.pagination);
        console.log(`📊 FIRST 3 ASSETS:`, data.data.assets.slice(0, 3));

        // Process assets - no need to fetch additional details as core assets API includes everything
        const assetsWithDetails = data.data.assets.map(asset => {
          return {
            ...asset,
            // Use data from core assets API (already includes network and system info)
            ipv4Address: asset.ipv4Address || 'N/A',
            fqdn: asset.fqdn || 'N/A',
            macAddress: asset.macAddress || 'N/A',
            operatingSystem: asset.operatingSystem || 'Unknown',
            systemType: asset.systemType || 'Unknown',
            tags: asset.tags || [] // Ensure tags is always an array
          };
        });

        console.log(`📊 PROCESSED: Created ${assetsWithDetails.length} assets with details`);

        // Fetch tags for all assets
        try {
          const assetUuids = assetsWithDetails.map(asset => asset.assetUuid);
          const tagsByAsset = await fetchAssetTags(assetUuids);

          // Add tags to each asset
          const assetsWithTags = assetsWithDetails.map(asset => ({
            ...asset,
            tags: assetTagsApi.formatTagsForDisplay(tagsByAsset[asset.assetUuid] || [])
          }));

          console.log(`📊 TAGS: Added tags to ${assetsWithTags.length} assets`);
          console.log(`📊 SETTING STATE: About to set ${assetsWithTags.length} assets in state`);

          setAssets(assetsWithTags);
        } catch (tagError) {
          console.warn('Failed to fetch tags, proceeding without tags:', tagError);
          console.log(`📊 SETTING STATE: About to set ${assetsWithDetails.length} assets in state (no tags)`);
          setAssets(assetsWithDetails);
        }
        setPagination(data.data.pagination);

        console.log(`📊 STATE SET: Assets state should now have ${assetsWithDetails.length} items`);

        // Calculate stats
        const totalAssets = data.data.pagination.total;
        const criticalAssets = assetsWithDetails.filter(a => a.criticalityRating === 'critical').length;
        const agentAssets = assetsWithDetails.filter(a => a.hasAgent).length;
        const recentAssets = assetsWithDetails.filter(a => {
          const lastSeen = new Date(a.lastSeen);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return lastSeen > dayAgo;
        }).length;

        setStats({
          total: totalAssets,
          critical: criticalAssets,
          withAgent: agentAssets,
          recentlyActive: recentAssets
        });
      } else {
        throw new Error(data.message || 'Failed to fetch assets');
      }
    } catch (error) {
      console.error('❌ Error fetching assets:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });

      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast.error('Authentication required. Please log in.');
      } else {
        toast.error(`Failed to load assets: ${error.message}`);
      }

      setAssets([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const handleViewAsset = (assetUuid) => {
    console.log('View asset:', assetUuid);

    // Find the asset data from the current assets list
    const assetData = assets.find(asset => asset.assetUuid === assetUuid);

    setSelectedAssetUuid(assetUuid);
    setSelectedAssetData(assetData);
    setDetailsPanelOpen(true);
  };

  const handleCloseDetailsPanel = () => {
    setDetailsPanelOpen(false);
    setSelectedAssetUuid(null);
    setSelectedAssetData(null);
  };

  const handleViewVulnerabilities = (assetUuid) => {
    console.log('View vulnerabilities for asset:', assetUuid);
    // TODO: Navigate to vulnerabilities page with asset filter
  };

  const handleViewLifecycle = (assetUuid) => {
    console.log('View lifecycle for asset:', assetUuid);
    const assetData = assets.find(asset => asset.assetUuid === assetUuid);
    setSelectedAssetUuid(assetUuid);
    setSelectedAssetData(assetData);
    setLifecyclePanelOpen(true);
  };

  const handleCloseLifecyclePanel = () => {
    setLifecyclePanelOpen(false);
    setSelectedAssetUuid(null);
    setSelectedAssetData(null);
  };

  const handleViewCosts = (assetUuid) => {
    console.log('💰 View costs for asset:', assetUuid);
    const assetData = assets.find(asset => asset.assetUuid === assetUuid);
    console.log('📋 Asset data found:', assetData);
    setSelectedAssetUuid(assetUuid);
    setSelectedAssetData(assetData);
    setCostManagementPanelOpen(true);
    console.log('🎯 Cost Management Panel opened');
  };

  const handleCloseCostManagementPanel = () => {
    setCostManagementPanelOpen(false);
    setSelectedAssetUuid(null);
    setSelectedAssetData(null);
  };

  const handleManageTags = (assetUuid) => {
    console.log('🏷️ Manage tags for asset:', assetUuid);
    const assetData = assets.find(asset => asset.assetUuid === assetUuid);
    console.log('📋 Asset data found:', assetData);
    setSelectedAssetUuid(assetUuid);
    setSelectedAssetData(assetData);
    setTagsManagementPanelOpen(true);
    console.log('🎯 Tags Management Panel opened');
  };

  const handleCloseTagsManagementPanel = () => {
    setTagsManagementPanelOpen(false);
    setSelectedAssetUuid(null);
    setSelectedAssetData(null);
  };

  const handleViewOperationalCosts = (assetUuid) => {
    console.log('💡 View operational costs for asset:', assetUuid);
    const assetData = assets.find(asset => asset.assetUuid === assetUuid);
    console.log('📋 Asset data found:', assetData);
    setSelectedAssetUuid(assetUuid);
    setSelectedAssetData(assetData);
    setOperationalCostsPanelOpen(true);
  };

  const handleCloseOperationalCostsPanel = () => {
    setOperationalCostsPanelOpen(false);
    setSelectedAssetUuid(null);
    setSelectedAssetData(null);
  };

  const handleViewRiskMapping = (assetUuid) => {
    console.log('🎯 View risk mapping for asset:', assetUuid);
    const assetData = assets.find(asset => asset.assetUuid === assetUuid);
    console.log('📋 Asset data found:', assetData);
    setSelectedAssetUuid(assetUuid);
    setSelectedAssetData(assetData);
    setRiskMappingPanelOpen(true);
  };

  const handleCloseRiskMappingPanel = () => {
    setRiskMappingPanelOpen(false);
    setSelectedAssetUuid(null);
    setSelectedAssetData(null);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleAddAsset = () => {
    console.log('🆕 Opening Add Asset panel');
    setAddAssetPanelOpen(true);
  };

  const handleCloseAddAssetPanel = () => {
    setAddAssetPanelOpen(false);
  };

  const handleAssetAdded = (newAsset) => {
    console.log('✅ Asset added successfully:', newAsset);
    // Refresh the assets list to include the new asset
    fetchAssets();
  };

  const handleSelectedAssetsChange = (selectedRows) => {
    setSelectedAssets(selectedRows);
  };

  const handleGenerateDiagram = () => {
    if (selectedAssets.length === 0) {
      toast.warning('Please select assets to generate a diagram');
      return;
    }
    console.log('🎨 Opening Diagram Generation panel for assets:', selectedAssets.length);
    setDiagramGenerationPanelOpen(true);
  };

  const handleCloseDiagramGenerationPanel = () => {
    setDiagramGenerationPanelOpen(false);
  };

  const handleDiagramGenerated = (diagramData) => {
    console.log('✅ Diagram generated successfully:', diagramData);
    toast.success('Diagram generated successfully!');
    setDiagramGenerationPanelOpen(false);
  };

  // Effects
  useEffect(() => {
    fetchAssets();
  }, [currentPage, itemPerPage, filters]);

  // Debug logging before render
  console.log(`🎨 RENDER: About to render ${assets.length} assets`);
  console.log(`🎨 RENDER: Pagination:`, pagination);

  return (
    <React.Fragment>
      <Head title="Asset Inventory"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockHeadContent>
            <BlockTitle page>Asset Inventory</BlockTitle>
            <BlockDes className="text-soft">
              <p>
                Complete inventory management for all organizational assets including hardware,
                software, and digital resources with tracking and lifecycle management.
              </p>
            </BlockDes>
          </BlockHeadContent>
        </BlockHead>

        {loading ? (
          /* Single loading spinner */
          <Block>
            <div className="card card-bordered">
              <div className="card-inner text-center py-5">
                <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
                  <span className="sr-only">Loading assets...</span>
                </div>
                <div className="mt-3">
                  <p className="text-soft">Loading assets...</p>
                </div>
              </div>
            </div>
          </Block>
        ) : (
          <>
            {/* Asset Status Charts */}
            <AssetStatusCharts
              assets={assets}
              loading={false}
            />

            {/* Stats Cards */}
            <AssetStatsCards stats={stats} loading={false} />

            {/* Assets Data Table */}
            <Block>
              {/* Table Header with Add Asset Button */}
              <div className="nk-block-head nk-block-head-sm">
                <div className="nk-block-between">
                  <div className="nk-block-head-content">
                    <h6 className="nk-block-title">Assets Inventory</h6>
                    <div className="nk-block-des text-soft">
                      <p>Manage and track all organizational assets</p>
                    </div>
                  </div>
                  <div className="nk-block-head-content">
                    <div className="toggle-wrap nk-block-tools-toggle">
                      <div className="toggle-expand-content">
                        <ul className="nk-block-tools g-3">
                          <li>
                            <Button
                              color="info"
                              size="md"
                              onClick={handleGenerateDiagram}
                              className="btn-icon"
                              disabled={selectedAssets.length === 0}
                              title={selectedAssets.length === 0 ? "Select assets to generate diagrams" : `Generate diagram from ${selectedAssets.length} selected asset${selectedAssets.length !== 1 ? 's' : ''}`}
                            >
                              <Icon name="diagram-3"></Icon>
                              <span>Generate Diagram ({selectedAssets.length})</span>
                            </Button>
                          </li>
                          <li>
                            <Button
                              color="primary"
                              size="md"
                              onClick={handleAddAsset}
                              className="btn-icon"
                            >
                              <Icon name="plus"></Icon>
                              <span>Add Asset</span>
                            </Button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <AssetDataTable
                data={assets}
                columns={assetColumns}
                loading={false}
                onSelectedRowsChange={handleSelectedAssetsChange}
                clearSelectedRows={() => setSelectedAssets([])}
                className="nk-tb-list"
              />
            </Block>
          </>
        )}

        <ToastContainer />

        {/* Asset Details Slide-out Panel */}
        <AssetDetailsPanel
          isOpen={detailsPanelOpen}
          onClose={handleCloseDetailsPanel}
          assetUuid={selectedAssetUuid}
          assetData={selectedAssetData}
        />

        {/* Asset Lifecycle Slide-out Panel */}
        <AssetLifecyclePanel
          isOpen={lifecyclePanelOpen}
          onClose={handleCloseLifecyclePanel}
          assetUuid={selectedAssetUuid}
          assetData={selectedAssetData}
        />

        {/* Asset Cost Management Slide-out Panel */}
        <AssetCostManagementPanel
          isOpen={costManagementPanelOpen}
          onClose={handleCloseCostManagementPanel}
          assetUuid={selectedAssetUuid}
          assetData={selectedAssetData}
        />

        {/* Asset Tags Management Slide-out Panel */}
        <AssetTagsManagementPanel
          isOpen={tagsManagementPanelOpen}
          onClose={handleCloseTagsManagementPanel}
          assetData={selectedAssetData}
          onTagsUpdated={fetchAssets}
        />

        {/* Asset Operational Costs Slide-out Panel */}
        <AssetOperationalCostsPanel
          isOpen={operationalCostsPanelOpen}
          onClose={handleCloseOperationalCostsPanel}
          assetUuid={selectedAssetUuid}
          assetData={selectedAssetData}
        />

        {/* Asset Risk Mapping Slide-out Panel */}
        <AssetRiskMappingPanel
          isOpen={riskMappingPanelOpen}
          onClose={handleCloseRiskMappingPanel}
          assetUuid={selectedAssetUuid}
          assetData={selectedAssetData}
        />

        {/* Add Asset Slide-out Panel */}
        <AddAssetPanel
          isOpen={addAssetPanelOpen}
          onClose={handleCloseAddAssetPanel}
          onAssetAdded={handleAssetAdded}
        />

        {/* Diagram Generation Slide-out Panel */}
        <DiagramGenerationPanel
          isOpen={diagramGenerationPanelOpen}
          onClose={handleCloseDiagramGenerationPanel}
          selectedAssets={selectedAssets}
          onDiagramGenerated={handleDiagramGenerated}
        />
      </Content>
    </React.Fragment>
  );
};

export default AssetInventory;
