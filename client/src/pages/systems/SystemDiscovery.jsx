import React, { useState, useEffect } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import {
  PreviewCard,
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  BackTo,
  Row,
  Col,
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableItem,
  Button,
  Icon,
  UserAvatar,
} from "@/components/Component";
import { Card, CardBody, Progress, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, Badge } from "reactstrap";

const SystemDiscovery = () => {
  const [loading, setLoading] = useState(false);

  // Mock data for discovered systems
  const discoveredSystems = [
    {
      id: 1,
      hostname: "WEB-SERVER-01",
      ipAddress: "192.168.1.10",
      os: "Windows Server 2019",
      status: "Active",
      lastSeen: "2 minutes ago",
      services: ["HTTP", "HTTPS", "RDP"],
      discoveryMethod: "Network Scan",
      confidence: 95
    },
    {
      id: 2,
      hostname: "DB-PRIMARY",
      ipAddress: "192.168.1.15",
      os: "Ubuntu 20.04 LTS",
      status: "Active",
      lastSeen: "5 minutes ago",
      services: ["SSH", "MySQL", "SNMP"],
      discoveryMethod: "Agent",
      confidence: 100
    },
    {
      id: 3,
      hostname: "MAIL-SERVER",
      ipAddress: "192.168.1.20",
      os: "CentOS 8",
      status: "Pending",
      lastSeen: "1 hour ago",
      services: ["SMTP", "IMAP", "SSH"],
      discoveryMethod: "Network Scan",
      confidence: 87
    },
    {
      id: 4,
      hostname: "FILE-SHARE-01",
      ipAddress: "192.168.1.25",
      os: "Windows Server 2016",
      status: "Inactive",
      lastSeen: "3 hours ago",
      services: ["SMB", "RDP"],
      discoveryMethod: "Network Scan",
      confidence: 78
    },
    {
      id: 5,
      hostname: "BACKUP-SERVER",
      ipAddress: "192.168.1.30",
      os: "Ubuntu 18.04 LTS",
      status: "Active",
      lastSeen: "10 minutes ago",
      services: ["SSH", "RSYNC", "SNMP"],
      discoveryMethod: "Agent",
      confidence: 100
    }
  ];

  // Discovery statistics
  const discoveryStats = {
    totalDiscovered: 127,
    activeNow: 98,
    pendingReview: 15,
    inactive: 14,
    newToday: 8,
    lastScanTime: "2 hours ago"
  };

  // Network segments
  const networkSegments = [
    { name: "DMZ", range: "192.168.1.0/24", systems: 25, status: "Scanned" },
    { name: "Internal LAN", range: "10.0.0.0/16", systems: 89, status: "Scanning" },
    { name: "Server Farm", range: "172.16.0.0/24", systems: 13, status: "Pending" },
    { name: "Guest Network", range: "192.168.100.0/24", systems: 0, status: "Not Scanned" }
  ];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'inactive': return 'danger';
      default: return 'secondary';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'success';
    if (confidence >= 70) return 'warning';
    return 'danger';
  };

  return (
    <>
      <Head title="System Discovery" />
      <Content>
        <BlockHead size="sm">
          <BlockHeadContent>
            <BlockTitle page>System Discovery</BlockTitle>
            <BlockDes className="text-soft">
              Discover and inventory systems across your network infrastructure
            </BlockDes>
          </BlockHeadContent>
        </BlockHead>

        {/* Discovery Statistics */}
        <Block>
          <Row className="g-gs">
            <Col md="2">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Total Discovered</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{discoveryStats.totalDiscovered}</span>
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </Col>
            <Col md="2">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Active Now</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount text-success">{discoveryStats.activeNow}</span>
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </Col>
            <Col md="2">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Pending Review</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount text-warning">{discoveryStats.pendingReview}</span>
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </Col>
            <Col md="2">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Inactive</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount text-danger">{discoveryStats.inactive}</span>
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </Col>
            <Col md="2">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">New Today</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount text-info">{discoveryStats.newToday}</span>
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </Col>
            <Col md="2">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Last Scan</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{discoveryStats.lastScanTime}</span>
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </Col>
          </Row>
        </Block>

        {/* Network Segments */}
        <Block>
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h4">Network Segments</BlockTitle>
              <p>Overview of network segments and discovery status</p>
            </BlockHeadContent>
          </BlockHead>
          <PreviewCard>
            <div className="card-inner">
              <DataTable className="card-stretch">
                <DataTableBody>
                  <DataTableHead className="nk-tb-head">
                    <DataTableRow>
                      <span className="sub-text">Segment Name</span>
                    </DataTableRow>
                    <DataTableRow size="mb">
                      <span className="sub-text">IP Range</span>
                    </DataTableRow>
                    <DataTableRow size="md">
                      <span className="sub-text">Systems Found</span>
                    </DataTableRow>
                    <DataTableRow>
                      <span className="sub-text">Status</span>
                    </DataTableRow>
                    <DataTableRow className="nk-tb-col-tools text-end">
                      <span className="sub-text">Actions</span>
                    </DataTableRow>
                  </DataTableHead>
                  {networkSegments.map((segment, idx) => (
                    <DataTableItem key={idx}>
                      <DataTableRow>
                        <span className="fw-medium">{segment.name}</span>
                      </DataTableRow>
                      <DataTableRow size="mb">
                        <span className="tb-amount">{segment.range}</span>
                      </DataTableRow>
                      <DataTableRow size="md">
                        <span className="tb-amount">{segment.systems}</span>
                      </DataTableRow>
                      <DataTableRow>
                        <Badge 
                          className="badge-dot" 
                          color={segment.status === 'Scanned' ? 'success' : segment.status === 'Scanning' ? 'warning' : 'secondary'}
                        >
                          {segment.status}
                        </Badge>
                      </DataTableRow>
                      <DataTableRow className="nk-tb-col-tools">
                        <ul className="nk-tb-actions gx-1">
                          <li>
                            <UncontrolledDropdown>
                              <DropdownToggle tag="a" className="text-soft dropdown-toggle btn btn-icon btn-trigger">
                                <Icon name="more-h"></Icon>
                              </DropdownToggle>
                              <DropdownMenu end>
                                <ul className="link-list-opt no-bdr">
                                  <li><DropdownItem tag="a" href="#scan"><Icon name="eye"></Icon><span>Scan Segment</span></DropdownItem></li>
                                  <li><DropdownItem tag="a" href="#view"><Icon name="activity"></Icon><span>View Details</span></DropdownItem></li>
                                </ul>
                              </DropdownMenu>
                            </UncontrolledDropdown>
                          </li>
                        </ul>
                      </DataTableRow>
                    </DataTableItem>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          </PreviewCard>
        </Block>

        {/* Discovered Systems */}
        <Block>
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h4">Discovered Systems</BlockTitle>
              <p>Recently discovered systems requiring review and classification</p>
            </BlockHeadContent>
          </BlockHead>
          <PreviewCard>
            <div className="card-inner">
              <DataTable className="card-stretch">
                <DataTableBody>
                  <DataTableHead className="nk-tb-head">
                    <DataTableRow>
                      <span className="sub-text">Hostname</span>
                    </DataTableRow>
                    <DataTableRow size="mb">
                      <span className="sub-text">IP Address</span>
                    </DataTableRow>
                    <DataTableRow size="md">
                      <span className="sub-text">Operating System</span>
                    </DataTableRow>
                    <DataTableRow>
                      <span className="sub-text">Status</span>
                    </DataTableRow>
                    <DataTableRow>
                      <span className="sub-text">Services</span>
                    </DataTableRow>
                    <DataTableRow>
                      <span className="sub-text">Confidence</span>
                    </DataTableRow>
                    <DataTableRow>
                      <span className="sub-text">Last Seen</span>
                    </DataTableRow>
                    <DataTableRow className="nk-tb-col-tools text-end">
                      <span className="sub-text">Actions</span>
                    </DataTableRow>
                  </DataTableHead>
                  {discoveredSystems.map((system) => (
                    <DataTableItem key={system.id}>
                      <DataTableRow>
                        <span className="fw-medium">{system.hostname}</span>
                      </DataTableRow>
                      <DataTableRow size="mb">
                        <span className="tb-amount">{system.ipAddress}</span>
                      </DataTableRow>
                      <DataTableRow size="md">
                        <span className="tb-amount">{system.os}</span>
                      </DataTableRow>
                      <DataTableRow>
                        <Badge
                          className="badge-dot"
                          color={getStatusColor(system.status)}
                        >
                          {system.status}
                        </Badge>
                      </DataTableRow>
                      <DataTableRow>
                        <span className="tb-amount">{system.services.join(", ")}</span>
                      </DataTableRow>
                      <DataTableRow>
                        <Badge
                          className="badge-dot"
                          color={getConfidenceColor(system.confidence)}
                        >
                          {system.confidence}%
                        </Badge>
                      </DataTableRow>
                      <DataTableRow>
                        <span className="tb-amount">{system.lastSeen}</span>
                      </DataTableRow>
                      <DataTableRow className="nk-tb-col-tools">
                        <ul className="nk-tb-actions gx-1">
                          <li>
                            <UncontrolledDropdown>
                              <DropdownToggle tag="a" className="text-soft dropdown-toggle btn btn-icon btn-trigger">
                                <Icon name="more-h"></Icon>
                              </DropdownToggle>
                              <DropdownMenu end>
                                <ul className="link-list-opt no-bdr">
                                  <li><DropdownItem tag="a" href="#approve"><Icon name="check"></Icon><span>Approve System</span></DropdownItem></li>
                                  <li><DropdownItem tag="a" href="#details"><Icon name="eye"></Icon><span>View Details</span></DropdownItem></li>
                                  <li><DropdownItem tag="a" href="#rescan"><Icon name="reload"></Icon><span>Rescan</span></DropdownItem></li>
                                  <li><DropdownItem tag="a" href="#ignore"><Icon name="cross"></Icon><span>Ignore</span></DropdownItem></li>
                                </ul>
                              </DropdownMenu>
                            </UncontrolledDropdown>
                          </li>
                        </ul>
                      </DataTableRow>
                    </DataTableItem>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          </PreviewCard>
        </Block>
      </Content>
    </>
  );
};

export default SystemDiscovery;
