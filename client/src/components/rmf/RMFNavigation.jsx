/**
 * RMF Navigation Component
 * Provides consistent navigation controls and quick actions for RMF pages
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, ButtonGroup, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { Icon } from '@/components/Component';

const RMFNavigation = ({ 
  currentPage = 'dashboard',
  projectId = null,
  showQuickActions = true,
  showViewToggle = false,
  viewMode = 'table',
  onViewModeChange = null,
  customActions = []
}) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Navigation items
  const navItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      link: '/rmf/dashboard',
      icon: 'dashboard',
      description: 'Overview and metrics'
    },
    {
      key: 'projects',
      label: 'Projects',
      link: '/rmf/projects',
      icon: 'folder',
      description: 'Manage RMF projects'
    },
    {
      key: 'compliance',
      label: 'Compliance',
      link: '/rmf/compliance',
      icon: 'grid-alt',
      description: 'NIST 800-53 heatmap'
    }
  ];

  // Quick actions
  const quickActions = [
    {
      key: 'new-project',
      label: 'New Project',
      link: '/rmf/projects/new',
      icon: 'plus-circle',
      color: 'primary'
    },
    {
      key: 'wizard-demo',
      label: 'Wizard Demo',
      link: '/rmf/wizard-demo',
      icon: 'cpu',
      color: 'info'
    }
  ];

  const handleQuickAction = (action) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.link) {
      navigate(action.link);
    }
  };

  return (
    <div className="rmf-navigation">
      <div className="d-flex justify-content-between align-items-center">
        {/* Main Navigation */}
        <div className="rmf-nav-items">
          <ButtonGroup>
            {navItems.map((item) => (
              <Button
                key={item.key}
                color={currentPage === item.key ? 'primary' : 'outline-light'}
                className={`btn-white ${currentPage === item.key ? 'active' : ''}`}
                tag={Link}
                to={item.link}
                title={item.description}
              >
                <Icon name={item.icon} className="me-1"></Icon>
                <span className="d-none d-sm-inline">{item.label}</span>
              </Button>
            ))}
          </ButtonGroup>
        </div>

        {/* Right Side Controls */}
        <div className="d-flex align-items-center gap-2">
          {/* View Toggle */}
          {showViewToggle && onViewModeChange && (
            <ButtonGroup>
              <Button
                color={viewMode === 'table' ? 'primary' : 'outline-light'}
                className="btn-white"
                size="sm"
                onClick={() => onViewModeChange('table')}
                title="Table View"
              >
                <Icon name="list"></Icon>
              </Button>
              <Button
                color={viewMode === 'card' ? 'primary' : 'outline-light'}
                className="btn-white"
                size="sm"
                onClick={() => onViewModeChange('card')}
                title="Card View"
              >
                <Icon name="grid-alt"></Icon>
              </Button>
            </ButtonGroup>
          )}

          {/* Custom Actions */}
          {customActions.map((action, index) => (
            <Button
              key={index}
              color={action.color || 'outline-light'}
              className="btn-white"
              size="sm"
              onClick={() => handleQuickAction(action)}
              title={action.description}
            >
              <Icon name={action.icon}></Icon>
              <span className="d-none d-md-inline ms-1">{action.label}</span>
            </Button>
          ))}

          {/* Quick Actions Dropdown */}
          {showQuickActions && (
            <Dropdown isOpen={dropdownOpen} toggle={() => setDropdownOpen(!dropdownOpen)}>
              <DropdownToggle color="primary" size="sm" caret>
                <Icon name="plus"></Icon>
                <span className="d-none d-sm-inline ms-1">Quick Actions</span>
              </DropdownToggle>
              <DropdownMenu end>
                <div className="dropdown-header">
                  <Icon name="zap" className="me-1"></Icon>
                  Quick Actions
                </div>
                {quickActions.map((action) => (
                  <DropdownItem
                    key={action.key}
                    tag={Link}
                    to={action.link}
                    className="d-flex align-items-center"
                  >
                    <Icon name={action.icon} className="me-2"></Icon>
                    <div>
                      <div className="fw-bold">{action.label}</div>
                      <small className="text-muted">Create new RMF project</small>
                    </div>
                  </DropdownItem>
                ))}
                
                {projectId && (
                  <>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-header">
                      <Icon name="folder" className="me-1"></Icon>
                      Current Project
                    </div>
                    <DropdownItem
                      tag={Link}
                      to={`/rmf/wizard/${projectId}`}
                      className="d-flex align-items-center"
                    >
                      <Icon name="cpu" className="me-2"></Icon>
                      <div>
                        <div className="fw-bold">Continue Wizard</div>
                        <small className="text-muted">Resume RMF process</small>
                      </div>
                    </DropdownItem>
                  </>
                )}
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default RMFNavigation;
