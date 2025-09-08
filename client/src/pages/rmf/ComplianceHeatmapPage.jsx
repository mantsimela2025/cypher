/**
 * Compliance Heatmap Page
 * Dedicated page for detailed NIST 800-53 compliance visualization
 * with advanced filtering and analysis capabilities
 */

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
  Row,
  Col,
  Button,
  PreviewCard,
  RSelect,
} from "@/components/Component";
import { ComplianceHeatmap, RMFBreadcrumb, RMFNavigation } from "@/components/rmf";
import { rmfProjectsApi } from "@/utils/rmfApi";
import { log } from "@/utils/config";
import { toast } from "react-toastify";
import { Card, CardBody, Badge, Alert } from "reactstrap";

const ComplianceHeatmapPage = () => {
  const [loading, setLoading] = useState(true);
  const [complianceData, setComplianceData] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'project', 'comparison'
  const [timeRange, setTimeRange] = useState('current');
  const [filterLevel, setFilterLevel] = useState('all');

  // Load initial data
  useEffect(() => {
    loadComplianceData();
    loadProjects();
  }, [selectedProject, timeRange]);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      log.info('🌐 Loading compliance heatmap data...');

      // Mock comprehensive compliance data
      // In real implementation, this would come from API
      const mockComplianceData = {
        "AC": { implementationPercentage: 85, trend: 'improving', lastUpdated: '2024-01-15' },
        "AU": { implementationPercentage: 72, trend: 'stable', lastUpdated: '2024-01-14' },
        "AT": { implementationPercentage: 90, trend: 'improving', lastUpdated: '2024-01-13' },
        "CM": { implementationPercentage: 65, trend: 'declining', lastUpdated: '2024-01-12' },
        "CP": { implementationPercentage: 78, trend: 'stable', lastUpdated: '2024-01-11' },
        "IA": { implementationPercentage: 82, trend: 'improving', lastUpdated: '2024-01-10' },
        "IR": { implementationPercentage: 70, trend: 'stable', lastUpdated: '2024-01-09' },
        "MA": { implementationPercentage: 88, trend: 'improving', lastUpdated: '2024-01-08' },
        "MP": { implementationPercentage: 75, trend: 'stable', lastUpdated: '2024-01-07' },
        "PE": { implementationPercentage: 95, trend: 'stable', lastUpdated: '2024-01-06' },
        "PL": { implementationPercentage: 80, trend: 'improving', lastUpdated: '2024-01-05' },
        "PS": { implementationPercentage: 85, trend: 'stable', lastUpdated: '2024-01-04' },
        "RA": { implementationPercentage: 77, trend: 'improving', lastUpdated: '2024-01-03' },
        "CA": { implementationPercentage: 73, trend: 'stable', lastUpdated: '2024-01-02' },
        "SC": { implementationPercentage: 68, trend: 'declining', lastUpdated: '2024-01-01' },
        "SI": { implementationPercentage: 79, trend: 'improving', lastUpdated: '2023-12-31' }
      };

      setComplianceData(mockComplianceData);
      log.info('✅ Compliance data loaded successfully');
    } catch (error) {
      log.error('❌ Failed to load compliance data:', error.message);
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await rmfProjectsApi.getProjects({ limit: 50 });
      if (response.success && response.data) {
        const projectOptions = (response.data.data || response.data).map(project => ({
          value: project.id,
          label: project.title || project.name,
          data: project
        }));
        setProjects(projectOptions);
      }
    } catch (error) {
      log.error('❌ Failed to load projects:', error.message);
      // Continue with empty projects list
    }
  };

  // Filter options
  const timeRangeOptions = [
    { value: 'current', label: 'Current Status' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
    { value: '1year', label: 'Last Year' }
  ];

  const filterLevelOptions = [
    { value: 'all', label: 'All Control Families' },
    { value: 'high', label: 'High Implementation (≥75%)' },
    { value: 'medium', label: 'Medium Implementation (50-74%)' },
    { value: 'low', label: 'Low Implementation (<50%)' },
    { value: 'critical', label: 'Critical Families Only' }
  ];

  // Calculate summary statistics
  const calculateSummaryStats = () => {
    const families = Object.keys(complianceData);
    if (families.length === 0) return { average: 0, high: 0, medium: 0, low: 0 };

    const percentages = families.map(family => complianceData[family].implementationPercentage);
    const average = Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length);
    
    return {
      average,
      high: percentages.filter(p => p >= 75).length,
      medium: percentages.filter(p => p >= 50 && p < 75).length,
      low: percentages.filter(p => p < 50).length,
      total: families.length
    };
  };

  const stats = calculateSummaryStats();

  // Filter compliance data based on selected filters
  const getFilteredData = () => {
    if (filterLevel === 'all') return complianceData;
    
    const filtered = {};
    Object.entries(complianceData).forEach(([family, data]) => {
      const percentage = data.implementationPercentage;
      let include = false;
      
      switch (filterLevel) {
        case 'high':
          include = percentage >= 75;
          break;
        case 'medium':
          include = percentage >= 50 && percentage < 75;
          break;
        case 'low':
          include = percentage < 50;
          break;
        case 'critical':
          // Define critical families
          include = ['AC', 'AU', 'IA', 'SC', 'SI'].includes(family);
          break;
        default:
          include = true;
      }
      
      if (include) {
        filtered[family] = data;
      }
    });
    
    return filtered;
  };

  const filteredData = getFilteredData();

  return (
    <React.Fragment>
      <Head title="Compliance Heatmap - NIST 800-53"></Head>
      <Content>
        {/* Enhanced Navigation */}
        <RMFBreadcrumb showHome={true} />

        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>
                <Icon name="grid-alt" className="me-2"></Icon>
                NIST 800-53 Compliance Heatmap
              </BlockTitle>
              <BlockDes className="text-soft">
                <p>
                  Interactive visualization of security control implementation status across all NIST 800-53 control families.
                  Click on any control family for detailed analysis and drill-down capabilities.
                </p>
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <div className="toggle-wrap nk-block-tools-toggle">
                <div className="toggle-expand-content">
                  <ul className="nk-block-tools g-3">
                    <li>
                      <Button color="outline-light" className="btn-white">
                        <Icon name="download-cloud"></Icon>
                        <span>Export Report</span>
                      </Button>
                    </li>
                    <li>
                      <Button color="outline-light" className="btn-white">
                        <Icon name="reload"></Icon>
                        <span>Refresh Data</span>
                      </Button>
                    </li>
                  </ul>
                </div>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {loading ? (
          <Block>
            <div className="card card-bordered">
              <div className="card-inner text-center py-5">
                <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
                  <span className="sr-only">Loading compliance data...</span>
                </div>
                <div className="mt-3">
                  <p className="text-soft">Loading compliance heatmap...</p>
                </div>
              </div>
            </div>
          </Block>
        ) : (
          <>
            {/* Summary Statistics */}
            <Block>
              <Row className="g-gs">
                <Col xxl="3" md="6">
                  <PreviewCard>
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-2">
                        <div className="card-title">
                          <h6 className="title">Average Implementation</h6>
                        </div>
                        <div className="card-tools">
                          <Icon name="target" className="text-primary"></Icon>
                        </div>
                      </div>
                      <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                        <div className="nk-sale-data">
                          <span className="amount">{stats.average}%</span>
                        </div>
                        <div className="nk-sales-ck">
                          <small className="text-success">Overall</small>
                        </div>
                      </div>
                    </div>
                  </PreviewCard>
                </Col>
                <Col xxl="3" md="6">
                  <PreviewCard>
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-2">
                        <div className="card-title">
                          <h6 className="title">High Implementation</h6>
                        </div>
                        <div className="card-tools">
                          <Icon name="check-circle" className="text-success"></Icon>
                        </div>
                      </div>
                      <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                        <div className="nk-sale-data">
                          <span className="amount">{stats.high}/{stats.total}</span>
                        </div>
                        <div className="nk-sales-ck">
                          <small className="text-success">≥75%</small>
                        </div>
                      </div>
                    </div>
                  </PreviewCard>
                </Col>
                <Col xxl="3" md="6">
                  <PreviewCard>
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-2">
                        <div className="card-title">
                          <h6 className="title">Medium Implementation</h6>
                        </div>
                        <div className="card-tools">
                          <Icon name="alert-circle" className="text-warning"></Icon>
                        </div>
                      </div>
                      <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                        <div className="nk-sale-data">
                          <span className="amount">{stats.medium}/{stats.total}</span>
                        </div>
                        <div className="nk-sales-ck">
                          <small className="text-warning">50-74%</small>
                        </div>
                      </div>
                    </div>
                  </PreviewCard>
                </Col>
                <Col xxl="3" md="6">
                  <PreviewCard>
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-2">
                        <div className="card-title">
                          <h6 className="title">Needs Attention</h6>
                        </div>
                        <div className="card-tools">
                          <Icon name="alert-triangle" className="text-danger"></Icon>
                        </div>
                      </div>
                      <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                        <div className="nk-sale-data">
                          <span className="amount text-danger">{stats.low}/{stats.total}</span>
                        </div>
                        <div className="nk-sales-ck">
                          <small className="text-danger">&lt;50%</small>
                        </div>
                      </div>
                    </div>
                  </PreviewCard>
                </Col>
              </Row>
            </Block>

            {/* Filters */}
            <Block>
              <PreviewCard>
                <div className="card-inner">
                  <Row className="g-3 align-items-end">
                    <Col md="3">
                      <div className="form-group">
                        <label className="form-label">Project Filter</label>
                        <RSelect
                          options={[{ value: null, label: 'All Projects' }, ...projects]}
                          value={projects.find(p => p.value === selectedProject) || { value: null, label: 'All Projects' }}
                          onChange={(option) => setSelectedProject(option?.value)}
                          placeholder="Select project..."
                        />
                      </div>
                    </Col>
                    <Col md="3">
                      <div className="form-group">
                        <label className="form-label">Time Range</label>
                        <RSelect
                          options={timeRangeOptions}
                          value={timeRangeOptions.find(t => t.value === timeRange)}
                          onChange={(option) => setTimeRange(option?.value)}
                        />
                      </div>
                    </Col>
                    <Col md="3">
                      <div className="form-group">
                        <label className="form-label">Implementation Level</label>
                        <RSelect
                          options={filterLevelOptions}
                          value={filterLevelOptions.find(f => f.value === filterLevel)}
                          onChange={(option) => setFilterLevel(option?.value)}
                        />
                      </div>
                    </Col>
                    <Col md="3">
                      <div className="form-group">
                        <Button color="primary" className="w-100">
                          <Icon name="filter" className="me-1"></Icon>
                          Apply Filters
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </div>
              </PreviewCard>
            </Block>

            {/* Main Heatmap */}
            <Block>
              <PreviewCard className="card-bordered">
                <div className="card-inner">
                  {Object.keys(filteredData).length > 0 ? (
                    <ComplianceHeatmap 
                      data={filteredData}
                      interactive={true}
                      showLegend={true}
                      size="large"
                      onFamilyClick={(family, data) => {
                        log.info('🔍 Control family selected for detailed analysis:', family.code);
                        toast.info(`Viewing details for ${family.name} control family`);
                      }}
                    />
                  ) : (
                    <Alert color="info">
                      <Icon name="info" className="me-2"></Icon>
                      No control families match the selected filters. Try adjusting your filter criteria.
                    </Alert>
                  )}
                </div>
              </PreviewCard>
            </Block>

            {/* Trends and Insights */}
            <Block>
              <Row className="g-gs">
                <Col lg="6">
                  <PreviewCard className="h-100">
                    <div className="card-inner">
                      <div className="card-title-group mb-3">
                        <div className="card-title">
                          <h6 className="title">
                            <Icon name="trending-up" className="text-success me-2"></Icon>
                            Implementation Trends
                          </h6>
                        </div>
                      </div>
                      <div className="nk-tb-list">
                        {Object.entries(complianceData)
                          .filter(([_, data]) => data.trend === 'improving')
                          .slice(0, 5)
                          .map(([family, data]) => (
                            <div key={family} className="nk-tb-item">
                              <div className="nk-tb-col">
                                <div className="user-card">
                                  <div className="user-name">
                                    <span className="tb-lead">{family}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="nk-tb-col tb-col-end">
                                <Badge color="success" className="badge-dim">
                                  <Icon name="arrow-up" className="me-1"></Icon>
                                  Improving
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </PreviewCard>
                </Col>
                <Col lg="6">
                  <PreviewCard className="h-100">
                    <div className="card-inner">
                      <div className="card-title-group mb-3">
                        <div className="card-title">
                          <h6 className="title">
                            <Icon name="alert-triangle" className="text-warning me-2"></Icon>
                            Areas Needing Attention
                          </h6>
                        </div>
                      </div>
                      <div className="nk-tb-list">
                        {Object.entries(complianceData)
                          .filter(([_, data]) => data.implementationPercentage < 75)
                          .sort(([_, a], [__, b]) => a.implementationPercentage - b.implementationPercentage)
                          .slice(0, 5)
                          .map(([family, data]) => (
                            <div key={family} className="nk-tb-item">
                              <div className="nk-tb-col">
                                <div className="user-card">
                                  <div className="user-name">
                                    <span className="tb-lead">{family}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="nk-tb-col tb-col-end">
                                <Badge 
                                  color={data.implementationPercentage >= 50 ? 'warning' : 'danger'} 
                                  className="badge-dim"
                                >
                                  {data.implementationPercentage}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </PreviewCard>
                </Col>
              </Row>
            </Block>
          </>
        )}
      </Content>
    </React.Fragment>
  );
};

export default ComplianceHeatmapPage;
