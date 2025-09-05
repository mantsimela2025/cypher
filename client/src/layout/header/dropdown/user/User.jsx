import React, { useState } from "react";
import { DropdownToggle, DropdownMenu, Dropdown } from "reactstrap";
import { Icon } from "@/components/Component";
import { LinkList, LinkItem } from "@/components/links/Links";
import UserAvatar from "@/components/user/UserAvatar";
import { useTheme, useThemeUpdate } from "@/layout/provider/Theme";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/utils/apiClient";
import { log } from "@/utils/config";

const User = () => {
  const theme = useTheme();
  const themeUpdate = useThemeUpdate();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    themeUpdate.sidebarHide();
    setOpen((prevState) => !prevState)
  };

  const handleSignOut = async () => {
    log.info('Starting logout process');

    try {
      // Get the refresh token for logout API call
      const refreshToken = localStorage.getItem('refreshToken');

      // Call logout API endpoint
      if (refreshToken) {
        log.api('Calling logout API');
        await apiClient.post('/auth/logout', { refreshToken });
        log.info('Logout API call successful');
      } else {
        log.warn('No refresh token found, skipping API call');
      }
    } catch (error) {
      log.error('Logout API call failed:', error.message);
      // Continue with logout even if API call fails
    } finally {
      log.info('Calling AuthContext logout');

      // Use AuthContext logout method to properly update state
      logout();

      log.info('Navigating to login page');
      // Redirect to login page
      navigate('/auth-login');
    }
  };

  return (
    <Dropdown isOpen={open} className="user-dropdown" toggle={toggle}>
      <DropdownToggle
        tag="a"
        href="#toggle"
        className="dropdown-toggle"
        onClick={(ev) => {
          ev.preventDefault();
        }}
      >
        <UserAvatar icon="user-alt" className="sm" />
      </DropdownToggle>
      <DropdownMenu end className="dropdown-menu-md dropdown-menu-s1">
        <div className="dropdown-inner user-card-wrap bg-lighter d-none d-md-block">
          <div className="user-card sm">
            <div className="user-avatar">
              <span>
                {user && user.firstName && user.lastName
                  ? user.firstName.charAt(0) + user.lastName.charAt(0)
                  : user && user.username
                    ? user.username.substring(0, 2).toUpperCase()
                    : user && user.email
                      ? user.email.substring(0, 2).toUpperCase()
                      : 'U'
                }
              </span>
            </div>
            <div className="user-info">
              <span className="lead-text">
                {user && user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user && user.username
                    ? user.username
                    : user && user.email
                      ? user.email.split('@')[0]
                      : 'User'
                }
              </span>
              <span className="sub-text">{user ? user.email : 'user@example.com'}</span>
            </div>
          </div>
        </div>
        <div className="dropdown-inner">
          <LinkList>
            <LinkItem link="/user-profile-regular" icon="user-alt" onClick={toggle}>
              View Profile
            </LinkItem>
            <LinkItem link="/user-profile-setting" icon="setting-alt" onClick={toggle}>
              Account Setting
            </LinkItem>
            <LinkItem link="/user-profile-activity" icon="activity-alt" onClick={toggle}>
              Login Activity
            </LinkItem>
            <li>
              <a className={`dark-switch ${theme.skin === 'dark' ? 'active' : ''}`} href="#" 
              onClick={(ev) => {
                ev.preventDefault();
                themeUpdate.skin(theme.skin === 'dark' ? 'light' : 'dark');
              }}>
                {theme.skin === 'dark' ? 
                  <><em className="icon ni ni-sun"></em><span>Light Mode</span></> 
                  : 
                  <><em className="icon ni ni-moon"></em><span>Dark Mode</span></>
                }
              </a>
            </li>
          </LinkList>
        </div>
        <div className="dropdown-inner">
          <LinkList>
            <li>
              <a
                href="#signout"
                className="link-item"
                onClick={(e) => {
                  e.preventDefault();
                  handleSignOut();
                }}
              >
                <Icon name="signout"></Icon>
                <span>Sign Out</span>
              </a>
            </li>
          </LinkList>
        </div>
      </DropdownMenu>
    </Dropdown>
  );
};

export default User;
