/**
 * RMF Route Guard Component
 * Provides route protection and navigation flow validation for RMF pages
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { rmfProjectsApi } from '@/utils/rmfApi';
import { log } from '@/utils/config';
import { toast } from 'react-toastify';
import { Alert, Button } from 'reactstrap';
import { Icon } from '@/components/Component';

const RMFRouteGuard = ({ 
  children, 
  requiresProject = false, 
  requiresStep = null,
  allowedRoles = [],
  redirectTo = '/rmf/dashboard'
}) => {
  const navigate = useNavigate();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    validateAccess();
  }, [params.projectId, requiresProject, requiresStep]);

  const validateAccess = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if project is required
      if (requiresProject && params.projectId) {
        log.info('🔐 RMF Route Guard - Validating project access:', params.projectId);
        
        const result = await rmfProjectsApi.getProjectById(params.projectId);
        if (result.success && result.data) {
          setProject(result.data);
          
          // Check step requirements
          if (requiresStep) {
            const hasRequiredStep = await validateStepAccess(result.data, requiresStep);
            if (!hasRequiredStep) {
              setError(`Step "${requiresStep}" is not available for this project.`);
              setAuthorized(false);
              return;
            }
          }
          
          setAuthorized(true);
        } else {
          setError('Project not found or access denied.');
          setAuthorized(false);
        }
      } else if (requiresProject && !params.projectId) {
        setError('Project ID is required for this page.');
        setAuthorized(false);
      } else {
        // No specific requirements, allow access
        setAuthorized(true);
      }

    } catch (error) {
      log.error('❌ RMF Route Guard - Access validation failed:', error.message);
      setError('Failed to validate access permissions.');
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const validateStepAccess = async (projectData, stepName) => {
    try {
      // Check if the step is valid for the project's current state
      const validSteps = ['setup', 'identify', 'categorize', 'select', 'implement', 'assess', 'authorize', 'monitor'];
      
      if (!validSteps.includes(stepName)) {
        return false;
      }

      // Check if prerequisites are met (simplified logic)
      const stepIndex = validSteps.indexOf(stepName);
      const currentStepIndex = validSteps.indexOf(projectData.currentStep || 'setup');
      
      // Allow access to current step and previous steps
      return stepIndex <= currentStepIndex + 1;

    } catch (error) {
      log.error('❌ Step validation failed:', error.message);
      return false;
    }
  };

  const handleRedirect = () => {
    navigate(redirectTo);
  };

  const handleRetry = () => {
    validateAccess();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Validating access...</span>
          </div>
          <p className="text-muted">Validating access permissions...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card card-bordered">
              <div className="card-inner text-center py-5">
                <div className="mb-4">
                  <Icon name="shield-off" className="text-danger" style={{ fontSize: '3rem' }}></Icon>
                </div>
                
                <h5 className="mb-3">Access Restricted</h5>
                
                <Alert color="danger" className="text-start">
                  <Icon name="alert-triangle" className="me-2"></Icon>
                  <strong>Access Denied:</strong> {error}
                </Alert>

                <div className="mt-4">
                  <p className="text-muted mb-4">
                    You don't have permission to access this page or the requested resource is not available.
                  </p>
                  
                  <div className="d-flex gap-2 justify-content-center">
                    <Button color="primary" onClick={handleRedirect}>
                      <Icon name="arrow-left" className="me-1"></Icon>
                      Go to Dashboard
                    </Button>
                    <Button color="outline-secondary" onClick={handleRetry}>
                      <Icon name="reload" className="me-1"></Icon>
                      Retry
                    </Button>
                  </div>
                </div>

                {/* Helpful Links */}
                <div className="mt-4 pt-4 border-top">
                  <h6 className="mb-3">Quick Actions</h6>
                  <div className="d-flex gap-2 justify-content-center">
                    <Button 
                      color="outline-light" 
                      size="sm"
                      onClick={() => navigate('/rmf/projects')}
                    >
                      <Icon name="folder" className="me-1"></Icon>
                      View Projects
                    </Button>
                    <Button 
                      color="outline-light" 
                      size="sm"
                      onClick={() => navigate('/rmf/projects/new')}
                    >
                      <Icon name="plus-circle" className="me-1"></Icon>
                      New Project
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Access granted, render children with project context
  return React.cloneElement(children, { 
    project,
    routeGuardValidated: true 
  });
};

export default RMFRouteGuard;
