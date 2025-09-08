/**
 * RMF Breadcrumb Component
 * Provides contextual navigation breadcrumbs for RMF pages
 * with dynamic path generation and project context
 */

import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from 'reactstrap';
import { Icon } from '@/components/Component';

const RMFBreadcrumb = ({ 
  projectName = null, 
  currentStep = null, 
  customItems = [], 
  showHome = true,
  className = ''
}) => {
  const location = useLocation();
  const params = useParams();
  
  // Define RMF route mappings
  const routeMap = {
    '/rmf': { label: 'Dashboard', icon: 'dashboard' },
    '/rmf/dashboard': { label: 'Dashboard', icon: 'dashboard' },
    '/rmf/projects': { label: 'Projects', icon: 'folder' },
    '/rmf/projects/new': { label: 'New Project', icon: 'plus-circle' },
    '/rmf/compliance': { label: 'Compliance Heatmap', icon: 'grid-alt' },
    '/rmf/compliance/heatmap': { label: 'Compliance Heatmap', icon: 'grid-alt' },
    '/rmf/wizard-demo': { label: 'Wizard Demo', icon: 'cpu' }
  };

  // RMF step mappings
  const stepMap = {
    'setup': { label: 'Project Setup', icon: 'setting' },
    'identify': { label: 'System Identification', icon: 'grid' },
    'categorize': { label: 'Categorize', icon: 'layers' },
    'select': { label: 'Select Controls', icon: 'shield-check' },
    'implement': { label: 'Implementation Plan', icon: 'clipboard' },
    'assess': { label: 'Assessment Plan', icon: 'check-circle' },
    'authorize': { label: 'Authorization', icon: 'award' },
    'monitor': { label: 'Continuous Monitoring', icon: 'activity' }
  };

  // Generate breadcrumb items based on current path
  const generateBreadcrumbItems = () => {
    const items = [];
    
    // Add home if requested
    if (showHome) {
      items.push({
        label: 'Home',
        link: '/',
        icon: 'home',
        active: false
      });
    }

    // Add RMF root
    items.push({
      label: 'Risk Management Framework',
      link: '/rmf',
      icon: 'shield-check',
      active: location.pathname === '/rmf'
    });

    // Handle specific routes
    const path = location.pathname;
    
    if (path.startsWith('/rmf/projects') && params.projectId) {
      // Project-specific breadcrumbs
      items.push({
        label: 'Projects',
        link: '/rmf/projects',
        icon: 'folder',
        active: false
      });

      if (projectName) {
        items.push({
          label: projectName,
          link: `/rmf/projects/${params.projectId}`,
          icon: 'file-text',
          active: !currentStep
        });
      }

      // Add wizard step if present
      if (path.includes('/wizard/') && currentStep) {
        items.push({
          label: 'RMF Wizard',
          link: `/rmf/wizard/${params.projectId}`,
          icon: 'cpu',
          active: false
        });

        const stepInfo = stepMap[currentStep];
        if (stepInfo) {
          items.push({
            label: stepInfo.label,
            link: null,
            icon: stepInfo.icon,
            active: true
          });
        }
      }

      // Handle individual step routes
      if (path.includes('/step/')) {
        const stepName = path.split('/step/')[1];
        const stepInfo = stepMap[stepName];
        if (stepInfo) {
          items.push({
            label: stepInfo.label,
            link: null,
            icon: stepInfo.icon,
            active: true
          });
        }
      }

    } else if (routeMap[path]) {
      // Standard route mapping
      const routeInfo = routeMap[path];
      items.push({
        label: routeInfo.label,
        link: null,
        icon: routeInfo.icon,
        active: true
      });
    }

    // Add custom items
    customItems.forEach(item => {
      items.push({
        label: item.label,
        link: item.link || null,
        icon: item.icon || 'arrow-right',
        active: item.active || false
      });
    });

    return items;
  };

  const breadcrumbItems = generateBreadcrumbItems();

  if (breadcrumbItems.length <= 1) {
    return null; // Don't show breadcrumb if only one item
  }

  return (
    <div className={`rmf-breadcrumb mb-3 ${className}`}>
      <Breadcrumb className="breadcrumb-arrow">
        {breadcrumbItems.map((item, index) => (
          <BreadcrumbItem key={index} active={item.active}>
            {item.link && !item.active ? (
              <Link to={item.link} className="d-flex align-items-center">
                {item.icon && (
                  <Icon name={item.icon} className="me-1" style={{ fontSize: '0.875rem' }}></Icon>
                )}
                <span>{item.label}</span>
              </Link>
            ) : (
              <div className="d-flex align-items-center">
                {item.icon && (
                  <Icon name={item.icon} className="me-1" style={{ fontSize: '0.875rem' }}></Icon>
                )}
                <span>{item.label}</span>
              </div>
            )}
          </BreadcrumbItem>
        ))}
      </Breadcrumb>
    </div>
  );
};

export default RMFBreadcrumb;
