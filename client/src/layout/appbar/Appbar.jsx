import React from "react";
import SimpleBar from "simplebar-react";
import classNames from "classnames";
import { DropdownMenu, DropdownToggle, UncontrolledDropdown } from "reactstrap";
import { Link, useLocation } from "react-router";
import { UserAvatar, LinkList, LinkItem, Icon, TooltipComponent } from "@/components/Component";

import { useTheme } from '@/layout/provider/Theme';
import { useAuth } from '@/context/AuthContext';

const dashboardLinks = [
  {
    icon: "dashboard",
    text: "Default Dashboard",
    link: "/assets/analytics",
  },
  // {
  //   icon: "speed",
  //   text: "Sales Dashboard",
  //   link: "/sales",
  // },
  // {
  //   icon: "bitcoin-cash",
  //   text: "Crypto Dashboard",
  //   link: "/crypto",
  // },
  // {
  //   icon: "coins",
  //   text: "Invest Dashboard",
  //   link: "/invest",
  // },
]

const applicationLinks = [
  {
    text: "Messages",
    link: "/app-messages",
    icon: "chat",
  },
  {
    text: "NioChat",
    link: "/app-chat",
    icon: "chat-circle",
  },
  {
    text: "Mailbox",
    link: "/app-inbox",
    icon: "inbox",
  },
  {
    text: "Calendar",
    link: "/app-calender",
    icon: "calendar",
  },
  {
    text: "Kanban",
    link: "/app-kanban",
    icon: "template",
  },
  {
    text: "File Manager",
    link: "/app-file-manager",
    icon: "folder",
  },
]

const Appbar = () => {

  const location = useLocation();
  const theme = useTheme();
  const { user } = useAuth();

  // Helper function to get user initials
  const getUserInitials = (user) => {
    if (!user) return "U";

    if (user.firstName && user.lastName) {
      return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
    }

    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }

    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    return "U";
  };

  // Helper function to get display name
  const getDisplayName = (user) => {
    if (!user) return "User";

    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }

    if (user.username) {
      return user.username;
    }

    if (user.email) {
      return user.email.split('@')[0];
    }

    return "User";
  };

  // Helper function to get user email
  const getUserEmail = (user) => {
    return user?.email || "user@example.com";
  };

  const appSidebarClass = classNames({
    "nk-apps-sidebar": true,
    [`is-light`]: theme.appbar === "white",
    [`is-${theme.appbar}`]: theme.appbar !== "white" && theme.appbar !== "light",
  });

  return (
    <div className={appSidebarClass}>
      <div className="nk-apps-brand">
        <Link to="/" className="logo-link">
          <img className="logo-img" src="/logo.png" alt="logo" style={{ height: '50px', width: '200px', objectFit: 'contain' }} />
        </Link>
      </div>
      <div className="nk-sidebar-element">
        <div className="nk-sidebar-body">
          <SimpleBar className="nk-sidebar-content">
            <div className="nk-sidebar-menu">
              <ul className="nk-menu apps-menu">
                {/* Default Dashboard - Restored as requested */}
                {dashboardLinks.map((item, index) =>
                  <React.Fragment key={index}>
                    <TooltipComponent id={"dashboard" + index} text={item.text} direction="right" />
                    <li
                      className={`nk-menu-item ${
                        location.pathname === item.link ? "active current-page" : ""
                      }`}
                      id={"dashboard" + index}
                    >
                      <Link to={`${item.link}`} className="nk-menu-link">
                        <span className="nk-menu-icon">
                          <Icon name={item.icon}></Icon>
                        </span>
                      </Link>
                    </li>
                  </React.Fragment>
                )}
                {/* Application Links - Hidden as requested */}
                {/* {applicationLinks.map((item, index) =>
                  <React.Fragment key={index}>
                    <TooltipComponent id={"app" + index} text={item.text} direction="right" />
                    <li
                      className={`nk-menu-item ${
                        location.pathname === item.link ? "active current-page" : ""
                      }`}
                      id={"app" + index}
                    >
                      <Link to={`${item.link}`} className="nk-menu-link">
                        <span className="nk-menu-icon">
                          <Icon name={item.icon}></Icon>
                        </span>
                      </Link>
                    </li>
                  </React.Fragment>
                )} */}
                {/* Component Link - Hidden as requested */}
                {/* <TooltipComponent id={"componentTooltip"} text="Go to component" direction="right" />
                <li
                  className={`nk-menu-item ${
                    location.pathname === "/components" ? "active current-page" : ""
                  }`}
                  id="componentTooltip"
                >
                  <Link to={`/components`} className="nk-menu-link">
                    <span className="nk-menu-icon">
                      <Icon name="layers"></Icon>
                    </span>
                  </Link>
                </li> */}
              </ul>
            </div>
            <div className="nk-sidebar-footer">
              <ul className="nk-menu">
                {/* Settings Link - Restored as requested */}
                <TooltipComponent id={"settingsTooltip"} text="Settings" direction="right" />
                <li className="nk-menu-item" id="settingsTooltip">
                  <Link to={`/user-profile-setting`} className="nk-menu-link">
                    <span className="nk-menu-icon">
                      <Icon name="setting"></Icon>
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </SimpleBar>
          <UncontrolledDropdown className="nk-sidebar-profile nk-sidebar-profile-fixed" direction="end">
            <DropdownToggle
              tag="a"
              href="#toggle"
              className="dropdown-toggle"
              onClick={(ev) => {
                ev.preventDefault();
              }}
            >
              <UserAvatar text={getUserInitials(user)} theme="blue" />
            </DropdownToggle>
            <DropdownMenu end className="dropdown-menu-md ms-4">
              <div className="dropdown-inner user-card-wrap bg-lighter d-none d-md-block">
                <div className="user-card sm">
                  <UserAvatar text={getUserInitials(user)} theme="blue" />
                  <div className="user-info">
                    <span className="lead-text">{getDisplayName(user)}</span>
                    <span className="sub-text">{getUserEmail(user)}</span>
                  </div>
                </div>
              </div>
              <div className="dropdown-inner">
                <LinkList>
                  <LinkItem link="/user-profile-regular" icon="user-alt">
                    View Profile
                  </LinkItem>
                  <LinkItem link="/user-profile-setting" icon="setting-alt">
                    Account Setting
                  </LinkItem>
                  <LinkItem link="/user-profile-activity" icon="activity-alt">
                    Login Activity
                  </LinkItem>
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
                        // Clear authentication data
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('user');
                        // Redirect to login
                        window.location.href = '/auth-login';
                      }}
                    >
                      <Icon name="signout"></Icon>
                      <span>Sign Out</span>
                    </a>
                  </li>
                </LinkList>
              </div>
            </DropdownMenu>
          </UncontrolledDropdown>
        </div>
      </div>
    </div>
  );
};

export default Appbar;
