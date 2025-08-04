import React, { useState, useEffect } from 'react';
import {
  Button,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Row,
  Col,
  Spinner
} from 'reactstrap';
import { Icon } from '@/components/Component';
import SlideOutPanel from '@/components/partials/SlideOutPanel';
import { toast } from 'react-toastify';
import "../../assets/components/AssetSlideOutPanels.css";

const CategoryDetailsPanel = ({ isOpen, onClose, categoryData, onEdit, onAddSubcategory }) => {
  const [loading, setLoading] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    if (isOpen && categoryData) {
      fetchCategoryDetails();
    }
  }, [isOpen, categoryData]);

  const fetchCategoryDetails = async () => {
    try {
      setLoading(true);
      // TODO: Implement API calls to fetch subcategories and documents
      // For now, using mock data
      
      // Mock subcategories
      setSubcategories([
        { id: 1, name: 'Policies', documentCount: 12 },
        { id: 2, name: 'Procedures', documentCount: 8 },
        { id: 3, name: 'Guidelines', documentCount: 5 }
      ]);

      // Mock documents
      setDocuments([
        { id: 1, name: 'Security Policy Document.pdf', updatedAt: '2024-01-15' },
        { id: 2, name: 'Access Control Procedure.docx', updatedAt: '2024-01-12' },
        { id: 3, name: 'Incident Response Guide.pdf', updatedAt: '2024-01-10' }
      ]);

    } catch (error) {
      console.error('Error fetching category details:', error);
      toast.error('Failed to load category details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'secondary';
      case 'draft': return 'warning';
      default: return 'light';
    }
  };

  if (!categoryData) return null;

  return (
    <SlideOutPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Category Details"
      subtitle={categoryData.name}
      size="md"
    >
      <div className="asset-panel-container">
        {loading && (
          <div className="panel-loading">
            <Spinner color="primary" />
            <p className="panel-text-muted">Loading category details...</p>
          </div>
        )}

        {!loading && (
          <div>
            {/* Header with action buttons */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">
                <Icon name="folder" className="me-2"></Icon>
                Category Information
              </h5>
              <div className="d-flex gap-2">
                <Button
                  color="primary"
                  size="sm"
                  onClick={() => onEdit(categoryData)}
                >
                  <Icon name="edit" className="me-1"></Icon>
                  Edit
                </Button>
                <Button
                  color="secondary"
                  size="sm"
                  onClick={() => onAddSubcategory(categoryData)}
                >
                  <Icon name="folder-plus" className="me-1"></Icon>
                  Add Subcategory
                </Button>
              </div>
            </div>

            {/* Basic Information */}
            <Card className="panel-card mb-4">
              <CardHeader className="panel-card-header">
                <h6 className="mb-0">Basic Information</h6>
              </CardHeader>
              <CardBody className="panel-card-body">
                <div className="panel-data-section">
                  <Row className="mb-3">
                    <Col md={3}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        Name:
                      </span>
                    </Col>
                    <Col md={9}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>
                        {categoryData.name}
                      </span>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={3}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        Description:
                      </span>
                    </Col>
                    <Col md={9}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>
                        {categoryData.description || 'No description provided'}
                      </span>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={3}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        Parent Category:
                      </span>
                    </Col>
                    <Col md={9}>
                      {categoryData.parentName ? (
                        <Badge color="outline-info" className="panel-badge">
                          {categoryData.parentName}
                        </Badge>
                      ) : (
                        <span style={{ fontSize: '0.875rem', fontWeight: 'normal' }} className="panel-text-muted">
                          Root Category
                        </span>
                      )}
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={3}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        Status:
                      </span>
                    </Col>
                    <Col md={9}>
                      <Badge color={getStatusBadgeColor(categoryData.status)} className="panel-badge">
                        {categoryData.status || 'Active'}
                      </Badge>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={3}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        Document Count:
                      </span>
                    </Col>
                    <Col md={9}>
                      <Badge color="outline-primary" className="panel-badge">
                        {categoryData.documentCount || 0} documents
                      </Badge>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={3}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        Created:
                      </span>
                    </Col>
                    <Col md={9}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>
                        {formatDate(categoryData.createdAt)}
                      </span>
                    </Col>
                  </Row>

                  <Row className="mb-0">
                    <Col md={3}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        Last Updated:
                      </span>
                    </Col>
                    <Col md={9}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>
                        {formatDate(categoryData.updatedAt)}
                      </span>
                    </Col>
                  </Row>
                </div>
              </CardBody>
            </Card>

            {/* Subcategories */}
            <Card className="panel-card mb-4">
              <CardHeader className="panel-card-header d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Subcategories ({subcategories.length})</h6>
                <Button
                  color="primary"
                  size="sm"
                  onClick={() => onAddSubcategory(categoryData)}
                >
                  <Icon name="plus" className="me-1"></Icon>
                  Add
                </Button>
              </CardHeader>
              <CardBody className="panel-card-body">
                {subcategories.length > 0 ? (
                  <div className="panel-card-list">
                    {subcategories.map((subcategory) => (
                      <Card key={subcategory.id} className="panel-card mb-2">
                        <CardBody className="p-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1" style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                <Icon name="folder" className="me-2 text-primary"></Icon>
                                {subcategory.name}
                              </h6>
                              <small className="panel-text-muted">
                                {subcategory.documentCount} documents
                              </small>
                            </div>
                            <Icon name="chevron-right" className="text-soft"></Icon>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="panel-empty-state text-center py-4">
                    <Icon name="folder" className="text-soft mb-2" style={{ fontSize: '2rem' }}></Icon>
                    <p className="panel-text-muted mb-0">No subcategories found</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Recent Documents */}
            <Card className="panel-card">
              <CardHeader className="panel-card-header">
                <h6 className="mb-0">Recent Documents ({documents.length})</h6>
              </CardHeader>
              <CardBody className="panel-card-body">
                {documents.length > 0 ? (
                  <div className="panel-card-list">
                    {documents.map((document) => (
                      <Card key={document.id} className="panel-card mb-2">
                        <CardBody className="p-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1" style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                <Icon name="file-text" className="me-2 text-info"></Icon>
                                {document.name}
                              </h6>
                              <small className="panel-text-muted">
                                Updated {formatDate(document.updatedAt)}
                              </small>
                            </div>
                            <Icon name="chevron-right" className="text-soft"></Icon>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="panel-empty-state text-center py-4">
                    <Icon name="file" className="text-soft mb-2" style={{ fontSize: '2rem' }}></Icon>
                    <p className="panel-text-muted mb-0">No documents found in this category</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </SlideOutPanel>
  );
};

export default CategoryDetailsPanel;