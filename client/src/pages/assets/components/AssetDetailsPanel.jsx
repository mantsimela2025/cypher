import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Badge,
  Spinner
} from "reactstrap";
import { Icon, UserAvatar } from "@/components/Component";
import { assetsApi } from "@/utils/assetsApi";
import SlideOutPanel from "@/components/partials/SlideOutPanel";
import "./AssetDetailsPanel.css";

const AssetDetailsPanel = ({ isOpen, onClose, assetUuid, assetData }) => {
  const [assetDetails, setAssetDetails] = useState(null);
  const [networkData, setNetworkData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Set asset details from passed data and fetch additional details when panel opens
  useEffect(() => {
    if (isOpen && assetUuid) {
      setAssetDetails(assetData);
      fetchAssetDetails();
    }
  }, [isOpen, assetUuid, assetData]);

  const fetchAssetDetails = async () => {
    setLoading(true);
    try {
      // Get basic asset info from the assets list (we'll need to pass this from parent)
      // For now, let's fetch network data
      const networkResponse = await assetsApi.getAssetNetwork(assetUuid);
      setNetworkData(networkResponse.data || []);
      
      // TODO: Add more detailed asset API calls here
      // const detailsResponse = await assetsApi.getAssetDetails(assetUuid);
      // setAssetDetails(detailsResponse.data);
      
    } catch (error) {
      console.error('Error fetching asset details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCriticalityBadgeColor = (criticality) => {
    switch (criticality) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const findUpper = (string) => {
    if (!string) return 'NA';
    const matches = string.match(/[A-Z]/g);
    return matches ? matches.join("").slice(0, 2) : string.slice(0, 2).toUpperCase();
  };

  const panelTitle = (
    <>
      <Icon name="package" className="me-2"></Icon>
      Asset Details / <strong className="text-primary small">{assetDetails?.hostname || 'Loading...'}</strong> / <span className="text-muted small" style={{ fontFamily: 'monospace' }}>{assetUuid}</span>
    </>
  );

  return (
    <SlideOutPanel
      isOpen={isOpen}
      onClose={onClose}
      title={panelTitle}
      width="1200px"
    >
        {loading ? (
          <div className="text-center p-4">
            <Spinner color="primary" />
            <p className="mt-2">Loading asset details...</p>
          </div>
        ) : (
          <div className="card-aside-wrap" id="asset-detail-block">
            <div className="card-content">
              {/* Navigation Tabs - matching user details style */}
              <ul className="nav nav-tabs nav-tabs-mb-icon nav-tabs-card">
                <li className="nav-item">
                  <a
                    className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
                    href="#overview"
                    onClick={(ev) => {
                      ev.preventDefault();
                      setActiveTab("overview");
                    }}
                  >
                    <Icon name="dashboard"></Icon>
                    <span>Overview</span>
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className={`nav-link ${activeTab === "network" ? "active" : ""}`}
                    href="#network"
                    onClick={(ev) => {
                      ev.preventDefault();
                      setActiveTab("network");
                    }}
                  >
                    <Icon name="globe"></Icon>
                    <span>Network</span>
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className={`nav-link ${activeTab === "vulnerabilities" ? "active" : ""}`}
                    href="#vulnerabilities"
                    onClick={(ev) => {
                      ev.preventDefault();
                      setActiveTab("vulnerabilities");
                    }}
                  >
                    <Icon name="shield-alert"></Icon>
                    <span>Vulnerabilities</span>
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className={`nav-link ${activeTab === "activity" ? "active" : ""}`}
                    href="#activity"
                    onClick={(ev) => {
                      ev.preventDefault();
                      setActiveTab("activity");
                    }}
                  >
                    <Icon name="activity"></Icon>
                    <span>Activity</span>
                  </a>
                </li>
              </ul>

              {/* Tab Content - matching user details card-inner style */}
              <div className="card-inner">
                {activeTab === "overview" && (
                  <div>
                    <div className="nk-block">
                      <div className="nk-block-head">
                        <h5 className="title">Asset Information</h5>
                        <p>Basic information and configuration details for this asset.</p>
                      </div>
                      <div className="profile-ud-list">
                        <div className="profile-ud-item">
                          <div className="profile-ud wider">
                            <span className="profile-ud-label">Hostname</span>
                            <span className="profile-ud-value">{assetDetails?.hostname || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="profile-ud-item">
                          <div className="profile-ud wider">
                            <span className="profile-ud-label">Criticality Rating</span>
                            <span className="profile-ud-value">
                              <Badge color={getCriticalityBadgeColor(assetDetails?.criticalityRating)} className="text-uppercase">
                                {assetDetails?.criticalityRating || 'Unknown'}
                              </Badge>
                            </span>
                          </div>
                        </div>
                        <div className="profile-ud-item">
                          <div className="profile-ud wider">
                            <span className="profile-ud-label">Source</span>
                            <span className="profile-ud-value text-capitalize">{assetDetails?.source || 'tenable'}</span>
                          </div>
                        </div>
                        <div className="profile-ud-item">
                          <div className="profile-ud wider">
                            <span className="profile-ud-label">Agent Status</span>
                            <span className="profile-ud-value">
                              <Badge color={assetDetails?.hasAgent ? 'success' : 'warning'}>
                                <Icon name={assetDetails?.hasAgent ? 'shield-check' : 'shield-off'} className="me-1"></Icon>
                                {assetDetails?.hasAgent ? 'Installed' : 'Not Installed'}
                              </Badge>
                            </span>
                          </div>
                        </div>
                        <div className="profile-ud-item">
                          <div className="profile-ud wider">
                            <span className="profile-ud-label">Last Seen</span>
                            <span className="profile-ud-value">{formatDate(assetDetails?.lastSeen)}</span>
                          </div>
                        </div>
                        <div className="profile-ud-item">
                          <div className="profile-ud wider">
                            <span className="profile-ud-label">First Discovered</span>
                            <span className="profile-ud-value">{formatDate(assetDetails?.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="nk-block">
                      <div className="nk-block-head">
                        <h5 className="title">Risk Assessment</h5>
                        <p>Security metrics and risk scoring for this asset.</p>
                      </div>
                      <div className="profile-ud-list">
                        <div className="profile-ud-item">
                          <div className="profile-ud wider">
                            <span className="profile-ud-label">AES Score</span>
                            <span className="profile-ud-value">
                              <span className="text-primary">
                                {assetDetails?.aesScore || 'N/A'}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="profile-ud-item">
                          <div className="profile-ud wider">
                            <span className="profile-ud-label">ACR Score</span>
                            <span className="profile-ud-value">
                              <span className="text-info">
                                {assetDetails?.acrScore || 'N/A'}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="profile-ud-item">
                          <div className="profile-ud wider">
                            <span className="profile-ud-label">Exposure Level</span>
                            <span className="profile-ud-value">{assetDetails?.exposure || 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="profile-ud-item">
                          <div className="profile-ud wider">
                            <span className="profile-ud-label">Operating System</span>
                            <span className="profile-ud-value">{assetDetails?.operatingSystem || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "network" && (
                  <div>
                    <div className="nk-block">
                      <div className="nk-block-head">
                        <h5 className="title">Network Configuration</h5>
                        <p>Network interfaces and connectivity information for this asset.</p>
                      </div>
                      {networkData.length > 0 ? (
                        <div className="profile-ud-list">
                          {networkData.map((network, index) => (
                            <div key={index} className="profile-ud-item">
                              <div className="profile-ud-item">
                                <div className="profile-ud wider">
                                  <span className="profile-ud-label">Interface {index + 1}</span>
                                  <span className="profile-ud-value">
                                    {network.isPrimary && (
                                      <Badge color="primary" className="me-2">Primary</Badge>
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="profile-ud-item">
                                <div className="profile-ud wider">
                                  <span className="profile-ud-label">IPv4 Address</span>
                                  <span className="profile-ud-value" style={{ fontFamily: 'monospace' }}>
                                    {network.ipv4Address || 'N/A'}
                                  </span>
                                </div>
                              </div>
                              <div className="profile-ud-item">
                                <div className="profile-ud wider">
                                  <span className="profile-ud-label">FQDN</span>
                                  <span className="profile-ud-value" style={{ fontFamily: 'monospace' }}>
                                    {network.fqdn || 'N/A'}
                                  </span>
                                </div>
                              </div>
                              <div className="profile-ud-item">
                                <div className="profile-ud wider">
                                  <span className="profile-ud-label">MAC Address</span>
                                  <span className="profile-ud-value" style={{ fontFamily: 'monospace' }}>
                                    {network.macAddress || 'N/A'}
                                  </span>
                                </div>
                              </div>
                              {index < networkData.length - 1 && <hr className="my-3" />}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <Icon name="globe" className="text-soft" style={{ fontSize: '3rem' }}></Icon>
                          <p className="text-soft mt-2">No network information available for this asset</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "vulnerabilities" && (
                  <div>
                    <div className="nk-block">
                      <div className="nk-block-head">
                        <h5 className="title">Vulnerability Assessment</h5>
                        <p>Security vulnerabilities and findings for this asset.</p>
                      </div>
                      <div className="text-center py-5">
                        <Icon name="shield-alert" className="text-soft" style={{ fontSize: '3rem' }}></Icon>
                        <p className="text-soft mt-2">Vulnerability data will be implemented in a future update</p>
                        <small className="text-muted">This will show CVEs, CVSS scores, and remediation recommendations</small>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "activity" && (
                  <div>
                    <div className="nk-block">
                      <div className="nk-block-head">
                        <h5 className="title">Asset Activity</h5>
                        <p>Recent activity and changes for this asset.</p>
                      </div>
                      <div className="text-center py-5">
                        <Icon name="activity" className="text-soft" style={{ fontSize: '3rem' }}></Icon>
                        <p className="text-soft mt-2">Activity tracking will be implemented in a future update</p>
                        <small className="text-muted">This will show scan history, configuration changes, and events</small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - matching user details style */}
            <div className="card-aside card-aside-right user-aside">
              <div className="card-inner-group">
                <div className="card-inner">
                  <div className="user-card user-card-s2">
                    <UserAvatar
                      className="lg"
                      theme="primary"
                      text={findUpper(assetDetails?.hostname || 'Asset')}
                    />
                    <div className="user-info">
                      <Badge
                        className="ucap"
                        pill
                        color={getCriticalityBadgeColor(assetDetails?.criticalityRating)}
                      >
                        {assetDetails?.criticalityRating || 'Unknown'}
                      </Badge>
                      <h5>{assetDetails?.hostname || 'Loading...'}</h5>
                      <span className="sub-text">{assetDetails?.source || 'tenable'}</span>
                    </div>
                  </div>
                </div>

                <div className="card-inner card-inner-sm">
                  <ul className="btn-toolbar justify-center gx-1">
                    <li>
                      <button
                        className="btn btn-trigger btn-icon"
                        title="Scan Asset"
                        onClick={() => console.log('Scan asset:', assetUuid)}
                      >
                        <Icon name="scan"></Icon>
                      </button>
                    </li>
                    <li>
                      <button
                        className="btn btn-trigger btn-icon"
                        title="View Vulnerabilities"
                        onClick={() => setActiveTab("vulnerabilities")}
                      >
                        <Icon name="shield-alert"></Icon>
                      </button>
                    </li>
                    <li>
                      <button
                        className="btn btn-trigger btn-icon"
                        title="Network Details"
                        onClick={() => setActiveTab("network")}
                      >
                        <Icon name="globe"></Icon>
                      </button>
                    </li>
                    <li>
                      <button
                        className="btn btn-trigger btn-icon"
                        title="Asset Settings"
                        onClick={() => console.log('Asset settings:', assetUuid)}
                      >
                        <Icon name="setting"></Icon>
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="card-inner">
                  <div className="row text-center">
                    <div className="col-4">
                      <div className="profile-stats">
                        <span className="amount">{assetDetails?.aesScore || '0'}</span>
                        <span className="sub-text">AES Score</span>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="profile-stats">
                        <span className="amount">{assetDetails?.acrScore || '0'}</span>
                        <span className="sub-text">ACR Score</span>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="profile-stats">
                        <span className="amount">
                          {assetDetails?.hasAgent ? (
                            <Icon name="check" className="text-success"></Icon>
                          ) : (
                            <Icon name="cross" className="text-danger"></Icon>
                          )}
                        </span>
                        <span className="sub-text">Agent</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-inner">
                  <h6 className="overline-title mb-2">Additional Info</h6>
                  <div className="row g-3">
                    <div className="col-6">
                      <span className="sub-text">Last Seen</span>
                      <span className="caption-text">{formatDate(assetDetails?.lastSeen)}</span>
                    </div>
                    <div className="col-6">
                      <span className="sub-text">First Seen</span>
                      <span className="caption-text">{formatDate(assetDetails?.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </SlideOutPanel>
  );
};

export default AssetDetailsPanel;
