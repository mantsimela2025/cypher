import React from 'react';
import { Icon, Row, Col, PreviewCard } from '@/components/Component';
import { Badge } from 'reactstrap';

const DocumentAnalytics = () => {
  // Mock analytics data - replace with API calls
  const analyticsData = {
    totalDocuments: 156,
    totalSize: '2.4 GB',
    mostViewedDocuments: [
      { name: 'Project Requirements.pdf', views: 45, downloads: 12 },
      { name: 'System Architecture.docx', views: 32, downloads: 8 },
      { name: 'Security Policy.pdf', views: 28, downloads: 15 }
    ],
    recentActivity: [
      { action: 'view', document: 'Project Requirements.pdf', user: 'John Doe', timestamp: new Date() },
      { action: 'download', document: 'System Architecture.docx', user: 'Jane Smith', timestamp: new Date(Date.now() - 3600000) },
      { action: 'view', document: 'Security Policy.pdf', user: 'Bob Johnson', timestamp: new Date(Date.now() - 7200000) }
    ],
    fileTypes: [
      { type: 'PDF', count: 68, percentage: 43.6 },
      { type: 'DOCX', count: 42, percentage: 26.9 },
      { type: 'XLSX', count: 28, percentage: 17.9 },
      { type: 'PPTX', count: 18, percentage: 11.5 }
    ]
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'view': return 'eye';
      case 'download': return 'download';
      case 'upload': return 'upload';
      case 'share': return 'share-alt';
      default: return 'activity';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'view': return 'info';
      case 'download': return 'success';
      case 'upload': return 'primary';
      case 'share': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="mt-4">
      <div className="mb-4">
        <h5 className="mb-1">Document Analytics</h5>
        <p className="text-muted mb-0">Insights into document usage and activity</p>
      </div>

      {/* Overview Stats */}
      <Row className="g-gs mb-4">
        <Col sm="6" lg="3">
          <PreviewCard>
            <div className="card-inner">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <Icon name="folder" className="text-primary" style={{ fontSize: '2rem' }} />
                </div>
                <div>
                  <h4 className="mb-0">{analyticsData.totalDocuments}</h4>
                  <span className="text-muted">Total Documents</span>
                </div>
              </div>
            </div>
          </PreviewCard>
        </Col>
        <Col sm="6" lg="3">
          <PreviewCard>
            <div className="card-inner">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <Icon name="hard-drive" className="text-info" style={{ fontSize: '2rem' }} />
                </div>
                <div>
                  <h4 className="mb-0">{analyticsData.totalSize}</h4>
                  <span className="text-muted">Total Storage</span>
                </div>
              </div>
            </div>
          </PreviewCard>
        </Col>
        <Col sm="6" lg="3">
          <PreviewCard>
            <div className="card-inner">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <Icon name="eye" className="text-success" style={{ fontSize: '2rem' }} />
                </div>
                <div>
                  <h4 className="mb-0">1,247</h4>
                  <span className="text-muted">Total Views</span>
                </div>
              </div>
            </div>
          </PreviewCard>
        </Col>
        <Col sm="6" lg="3">
          <PreviewCard>
            <div className="card-inner">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <Icon name="download" className="text-warning" style={{ fontSize: '2rem' }} />
                </div>
                <div>
                  <h4 className="mb-0">342</h4>
                  <span className="text-muted">Total Downloads</span>
                </div>
              </div>
            </div>
          </PreviewCard>
        </Col>
      </Row>

      <Row className="g-gs">
        {/* Most Viewed Documents */}
        <Col lg="6">
          <PreviewCard>
            <div className="card-inner">
              <div className="card-title-group mb-3">
                <h6 className="title">Most Viewed Documents</h6>
              </div>
              <div className="space-y-3">
                {analyticsData.mostViewedDocuments.map((doc, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center">
                    <div className="flex-grow-1">
                      <div className="fw-medium" style={{ fontSize: '0.875rem' }}>
                        {doc.name}
                      </div>
                      <div className="text-muted small">
                        {doc.downloads} downloads
                      </div>
                    </div>
                    <div className="text-end">
                      <Badge color="light" className="badge-sm">
                        {doc.views} views
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PreviewCard>
        </Col>

        {/* File Types Distribution */}
        <Col lg="6">
          <PreviewCard>
            <div className="card-inner">
              <div className="card-title-group mb-3">
                <h6 className="title">File Types Distribution</h6>
              </div>
              <div className="space-y-3">
                {analyticsData.fileTypes.map((fileType, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <Badge color="light" className="me-2">
                        {fileType.type}
                      </Badge>
                      <span className="text-muted small">
                        {fileType.count} files
                      </span>
                    </div>
                    <div className="text-end">
                      <span className="fw-medium">{fileType.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PreviewCard>
        </Col>

        {/* Recent Activity */}
        <Col lg="12">
          <PreviewCard>
            <div className="card-inner">
              <div className="card-title-group mb-3">
                <h6 className="title">Recent Activity</h6>
              </div>
              <div className="space-y-3">
                {analyticsData.recentActivity.map((activity, index) => (
                  <div key={index} className="d-flex align-items-center">
                    <div className="me-3">
                      <Icon
                        name={getActionIcon(activity.action)}
                        className={`text-${getActionColor(activity.action)}`}
                        style={{ fontSize: '1.25rem' }}
                      />
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-medium" style={{ fontSize: '0.875rem' }}>
                        {activity.user} {activity.action}ed "{activity.document}"
                      </div>
                      <div className="text-muted small">
                        {formatTimeAgo(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PreviewCard>
        </Col>
      </Row>
    </div>
  );
};

export default DocumentAnalytics;
