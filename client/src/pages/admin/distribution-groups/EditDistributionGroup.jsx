import React, { useState, useEffect } from 'react';
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Block,
  BlockBetween,
  BlockDes,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  Icon,
  Button,
  Row,
  Col,
} from "@/components/Component";

const EditDistributionGroup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [group, setGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [validation, setValidation] = useState({});

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/v1/admin/distribution-groups/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setGroup(data.data);
        setFormData({
          name: data.data.name,
          description: data.data.description || ''
        });
      } else {
        throw new Error(data.error || 'Failed to fetch group');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validation[name]) {
      setValidation(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Group name is required';
    } else if (formData.name.length < 3) {
      errors.name = 'Group name must be at least 3 characters';
    } else if (formData.name.length > 100) {
      errors.name = 'Group name must be less than 100 characters';
    }
    
    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }
    
    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await fetch(`/api/admin/distribution-groups/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Navigate back to groups list
        navigate('/admin/distribution-groups');
      } else {
        throw new Error(data.error || 'Failed to update group');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <React.Fragment>
        <Head title="Admin - Edit Distribution Group"></Head>
        <Content>
          <div className="d-flex justify-content-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </Content>
      </React.Fragment>
    );
  }

  if (!group) {
    return (
      <React.Fragment>
        <Head title="Admin - Edit Distribution Group"></Head>
        <Content>
          <Block>
            <div className="alert alert-danger">
              <Icon name="alert-triangle"></Icon>
              <span className="ms-2">Distribution group not found.</span>
            </div>
            <Link to="/admin/distribution-groups" className="btn btn-outline-light">
              <Icon name="arrow-left"></Icon>
              <span>Back to Groups</span>
            </Link>
          </Block>
        </Content>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Head title="Admin - Edit Distribution Group"></Head>
      <Content>
        {/* Header */}
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <div className="d-flex align-items-center">
                <Link 
                  to="/admin/distribution-groups" 
                  className="btn btn-outline-light btn-sm me-3"
                >
                  <Icon name="arrow-left"></Icon>
                </Link>
                <div>
                  <BlockTitle tag="h3" page>
                    Edit Distribution Group
                  </BlockTitle>
                  <BlockDes className="text-soft">
                    <p>Update group information</p>
                  </BlockDes>
                </div>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {/* Error Alert */}
        {error && (
          <Block>
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <Icon name="alert-triangle"></Icon>
              <span className="ms-2">{error}</span>
              <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
          </Block>
        )}

        {/* Form */}
        <Block>
          <Row className="justify-content-center">
            <Col xl="8" lg="10">
              <div className="card card-stretch">
                <div className="card-inner">
                  <form onSubmit={handleSubmit}>
                    <Row className="gy-4">
                      <Col md="12">
                        <div className="form-group">
                          <label className="form-label" htmlFor="name">
                            Group Name <span className="text-danger">*</span>
                          </label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              className={`form-control ${validation.name ? 'is-invalid' : ''}`}
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="Enter group name..."
                              maxLength={100}
                              required
                            />
                            {validation.name && (
                              <div className="invalid-feedback">
                                {validation.name}
                              </div>
                            )}
                          </div>
                          <div className="form-note">
                            Enter a descriptive name for the distribution group (3-100 characters)
                          </div>
                        </div>
                      </Col>

                      <Col md="12">
                        <div className="form-group">
                          <label className="form-label" htmlFor="description">
                            Description
                          </label>
                          <div className="form-control-wrap">
                            <textarea
                              className={`form-control ${validation.description ? 'is-invalid' : ''}`}
                              id="description"
                              name="description"
                              rows="4"
                              value={formData.description}
                              onChange={handleInputChange}
                              placeholder="Enter group description..."
                              maxLength={500}
                            />
                            {validation.description && (
                              <div className="invalid-feedback">
                                {validation.description}
                              </div>
                            )}
                          </div>
                          <div className="form-note">
                            Optional description of the group's purpose (max 500 characters)
                          </div>
                        </div>
                      </Col>
                    </Row>

                    <div className="form-group pt-4">
                      <div className="d-flex justify-content-between">
                        <div className="text-muted">
                          <small>
                            Created: {new Date(group.createdAt).toLocaleString()}<br/>
                            Last Updated: {new Date(group.updatedAt).toLocaleString()}
                          </small>
                        </div>
                        
                        <div className="d-flex gap-2">
                          <Link 
                            to="/admin/distribution-groups" 
                            className="btn btn-outline-light"
                          >
                            Cancel
                          </Link>
                          <Button 
                            type="submit" 
                            color="primary"
                            disabled={submitting}
                          >
                            {submitting ? (
                              <>
                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                                Updating...
                              </>
                            ) : (
                              <>
                                <Icon name="check"></Icon>
                                <span>Update Group</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </Col>
          </Row>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default EditDistributionGroup;