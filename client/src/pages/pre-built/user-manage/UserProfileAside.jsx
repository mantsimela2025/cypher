import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Icon, UserAvatar } from "@/components/Component";
import { findUpper } from "@/utils/Utils";
import {  DropdownItem, UncontrolledDropdown, DropdownMenu, DropdownToggle } from "reactstrap";
import { useAuth } from "@/context/AuthContext";

const UserProfileAside = ({updateSm,sm, user: propUser}) => {
  const { user: contextUser } = useAuth();

  // Use prop user if provided, otherwise use context user
  const user = propUser || contextUser;

  // Helper functions to get user data
  const getFullName = (user) => {
    if (!user) return "User";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.username) return user.username;
    if (user.email) return user.email.split('@')[0];
    return "User";
  };

  const getUserEmail = (user) => {
    return user?.email || "user@example.com";
  };

  const [profileName, setProfileName] = useState(getFullName(user));

  // Update profile name when user changes
  useEffect(() => {
    if (user) {
      setProfileName(getFullName(user));
    }
  }, [user]);

  useEffect(() => {
    sm ? document.body.classList.add("toggle-shown") : document.body.classList.remove("toggle-shown");
  }, [sm])
  
  return (
    <div className="card-inner-group">
    <div className="card-inner">
        <div className="user-card">
        <UserAvatar text={findUpper(profileName)} theme="primary" />
        <div className="user-info">
            <span className="lead-text">{profileName}</span>
            <span className="sub-text">{getUserEmail(user)}</span>
        </div>
        <div className="user-action">
            <UncontrolledDropdown>
            <DropdownToggle tag="a" className="btn btn-icon btn-trigger me-n2">
                <Icon name="more-v"></Icon>
            </DropdownToggle>
            <DropdownMenu end>
                <ul className="link-list-opt no-bdr">
                <li>
                    <DropdownItem
                    tag="a"
                    href="#dropdownitem"
                    onClick={(ev) => {
                        ev.preventDefault();
                    }}
                    >
                    <Icon name="camera-fill"></Icon>
                    <span>Change Photo</span>
                    </DropdownItem>
                </li>
                <li>
                    <DropdownItem
                    tag="a"
                    href="#dropdownitem"
                    onClick={(ev) => {
                        ev.preventDefault();
                    }}
                    >
                    <Icon name="edit-fill"></Icon>
                    <span>Update Profile</span>
                    </DropdownItem>
                </li>
                </ul>
            </DropdownMenu>
            </UncontrolledDropdown>
        </div>
        </div>
    </div>
    <div className="card-inner p-0">
        <ul className="link-list-menu">
        <li onClick={() => updateSm(false)}>
            <NavLink
            to={`/user-profile-regular`}
            >
            <Icon name="user-fill-c"></Icon>
            <span>Personal Information</span>
            </NavLink>
        </li>
        <li onClick={() => updateSm(false)}>
            <NavLink
            to={`/user-profile-notification`}
            >
            <Icon name="bell-fill"></Icon>
            <span>Notification</span>
            </NavLink>
        </li>
        <li onClick={() => updateSm(false)}>
            <NavLink
            to={`/user-profile-activity`}
            >
            <Icon name="activity-round-fill"></Icon>
            <span>Account Activity</span>
            </NavLink>
        </li>
        <li onClick={() => updateSm(false)}>
            <NavLink
            to={`/user-profile-setting`}
            >
            <Icon name="lock-alt-fill"></Icon>
            <span>Security Setting</span>
            </NavLink>
        </li>
        </ul>
    </div>
    </div>
  );
};

export default UserProfileAside;
