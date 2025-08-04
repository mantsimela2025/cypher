import React, { useState } from "react";
import { DropdownToggle, DropdownMenu, Dropdown } from "reactstrap";
import { Icon } from "@/components/Component";
import { LinkList, LinkItem } from "@/components/links/Links";
import UserAvatar from "@/components/user/UserAvatar";
import { useTheme, useThemeUpdate } from "@/layout/provider/Theme";
import { useNavigate } from "react-router-dom";

const User = () => {
  const theme = useTheme();
  const themeUpdate = useThemeUpdate();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Get user data from localStorage
  React.useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const toggle = () => {
    themeUpdate.sidebarHide();
    setOpen((prevState) => !prevState)
  };

  const handleSignOut = async () => {
    try {
      // Get the refresh token for logout API call
      const refreshToken = localStorage.getItem('refreshToken');

      // Call logout API endpoint
      if (refreshToken) {
        await fetch('http://localhost:3001/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear all authentication data from localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

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
              <span>{user ? user.firstName?.charAt(0) + user.lastName?.charAt(0) : 'AB'}</span>
            </div>
            <div className="user-info">
              <span className="lead-text">
                {user ? `${user.firstName} ${user.lastName}` : 'Abu Bin Ishtiyak'}
              </span>
              <span className="sub-text">{user ? user.email : 'info@softnio.com'}</span>
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
