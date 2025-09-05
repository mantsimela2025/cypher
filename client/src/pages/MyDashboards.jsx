import React, { useState, useEffect } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  Row,
  Col,
  Button,
  Icon,
} from "@/components/Component";
import {
  Card,
  Badge,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledDropdown,
} from "reactstrap";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/utils/apiClient";
import { log } from "@/utils/config";

const MyDashboards = () => {
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's dashboards
  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        log.api('Fetching user dashboards');
        const data = await apiClient.get('/dashboards/my-dashboards');
        setDashboards(data.data || []);
        log.info('User dashboards loaded:', data.data?.length || 0, 'dashboards');
      } catch (error) {
        log.error('Error fetching dashboards:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboards();
  }, []);

  // Handle dashboard deletion
  const handleDeleteDashboard = async (dashboardId) => {
    if (!window.confirm('Are you sure you want to delete this dashboard?')) {
      return;
    }

    try {
      log.api('Deleting dashboard:', dashboardId);
      await apiClient.delete(`/dashboards/${dashboardId}`);
      setDashboards(dashboards.filter(d => d.id !== dashboardId));
      log.info('Dashboard deleted successfully');
    } catch (error) {
      log.error('Error deleting dashboard:', error.message);
    }
  };

  // Handle dashboard editing
  const handleEditDashboard = (dashboardId) => {
    navigate(`/dashboard-creator?edit=${dashboardId}`);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get widget count from dashboard
  const getWidgetCount = (dashboard) => {
    if (dashboard.widgets && Array.isArray(dashboard.widgets)) {
      return dashboard.widgets.length;
    }
    return 0;
  };

  return (
    <React.Fragment>
      <Head title="My Dashboards" />
      <Content>
        <BlockHead size="sm">
          <BlockHeadContent>
            <div className="nk-block-head-between">
              <div className="nk-block-head-content">
                <BlockTitle page>My Dashboards</BlockTitle>
                <BlockDes className="text-soft">
                  Create and manage your custom analytics dashboards
                </BlockDes>
              </div>
              <div className="nk-block-head-content">
                <Button 
                  color="primary" 
                  size="md"
                  onClick={() => navigate('/dashboard-creator')}
                >
                  <Icon name="plus" />
                  <span>New Dashboard</span>
                </Button>
              </div>
            </div>
          </BlockHeadContent>
        </BlockHead>

        <Block>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : dashboards.length === 0 ? (
            <Card className="card-bordered">
              <div className="card-inner text-center py-5">
                <div className="nk-empty-state">
                  <div className="nk-empty-state-icon">
                    <Icon name="dashboard" className="text-primary" style={{ fontSize: '3rem' }} />
                  </div>
                  <div className="nk-empty-state-content">
                    <h5 className="nk-empty-state-title">No Dashboards Yet</h5>
                    <p className="nk-empty-state-text">
                      Get started by creating your first custom dashboard with drag-and-drop widgets.
                    </p>
                    <Button 
                      color="primary" 
                      size="lg"
                      onClick={() => navigate('/dashboard-creator')}
                    >
                      <Icon name="plus" />
                      <span>Create Your First Dashboard</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Row className="g-gs">
              {dashboards.map((dashboard) => (
                <Col key={dashboard.id} xxl="4" lg="6">
                  <Card className="card-bordered dashboard-card">
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-3">
                        <div className="card-title">
                          <h6 className="title">{dashboard.name}</h6>
                          {dashboard.description && (
                            <p className="text-soft">{dashboard.description}</p>
                          )}
                        </div>
                        <div className="card-tools">
                          <UncontrolledDropdown>
                            <DropdownToggle tag="a" className="dropdown-toggle btn btn-icon btn-trigger">
                              <Icon name="more-h" />
                            </DropdownToggle>
                            <DropdownMenu end>
                              <ul className="link-list-opt no-bdr">
                                <li>
                                  <DropdownItem
                                    tag="a"
                                    href="#"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                      handleEditDashboard(dashboard.id);
                                    }}
                                  >
                                    <Icon name="edit" />
                                    <span>Edit</span>
                                  </DropdownItem>
                                </li>
                                <li>
                                  <DropdownItem
                                    tag="a"
                                    href="#"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                      handleDeleteDashboard(dashboard.id);
                                    }}
                                  >
                                    <Icon name="trash" />
                                    <span>Delete</span>
                                  </DropdownItem>
                                </li>
                              </ul>
                            </DropdownMenu>
                          </UncontrolledDropdown>
                        </div>
                      </div>
                      
                      <div className="dashboard-stats">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-soft">
                            <Icon name="activity" className="me-1" />
                            {getWidgetCount(dashboard)} widgets
                          </span>
                          <span className={`badge badge-${dashboard.isPublished ? 'success' : 'warning'}`}>
                            {dashboard.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <div className="text-soft small">
                          Updated {formatDate(dashboard.updatedAt)}
                        </div>
                      </div>

                      <div className="dashboard-actions mt-3 pt-3 border-top">
                        <Button 
                          color="primary" 
                          size="sm" 
                          outline
                          onClick={() => handleEditDashboard(dashboard.id)}
                        >
                          <Icon name="edit" />
                          <span>Edit</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default MyDashboards;
