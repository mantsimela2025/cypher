import React, { useEffect, useLayoutEffect, Fragment, useState } from "react";
import Icon from "@/components/icon/Icon";
import classNames from "classnames";
import { NavLink, Link, useLocation } from "react-router";
import { slideUp, slideDown, getParents } from "@/utils/Utils";
import { useThemeUpdate } from '@/layout/provider/Theme';

const Menu = ({ data }) => {

  const themeUpdate = useThemeUpdate();
  const location = useLocation();
  
  // State to manage collapsed sections
  const [collapsedSections, setCollapsedSections] = useState(() => {
    const saved = localStorage.getItem('menuCollapsedSections');
    if (saved) {
      return JSON.parse(saved);
    } else {
      // Default state: collapse all sections except 'Systems Management' and 'Asset Management'
      return {
        "Dashboards": true,
        "Systems Management": false,
        "Asset Management": false,
        "Vulnerability Mgmt": true,
        "Patch Management": true,
        "Scan Management": true,
        "Compliance Management": false,
        "Policy Management": true,
        "Document Management": true,
        "DASHBOARD & METRICS": true,
        "Admin Management": true
      };
    }
  });

  // Function to toggle section collapse
  const toggleSection = (heading) => {
    const newCollapsedSections = {
      ...collapsedSections,
      [heading]: !collapsedSections[heading]
    };
    setCollapsedSections(newCollapsedSections);
    localStorage.setItem('menuCollapsedSections', JSON.stringify(newCollapsedSections));
  };

  // Get icon for section based on heading
  const getSectionIcon = (heading) => {
    const iconMap = {
      "Dashboards": "dashboard",
      "Systems Management": "server",
      "Asset Management": "package",
      "Vulnerability Mgmt": "shield-exclamation",
      "Patch Management": "shield-check",
      "Scan Management": "scan",
      "Compliance Management": "shield-check",
      "Policy Management": "book",
      "Document Management": "file-docs",
      "DASHBOARD & METRICS": "dashboard-fill",
      "Admin Management": "users"
    };
    return iconMap[heading] || "grid-alt";
  };

  let currentLink = function(selector){
      let elm = document.querySelectorAll(selector);
      elm.forEach(function(item){
          var activeRouterLink = item.classList.contains('active');
          if (activeRouterLink) {
              let parents = getParents(item,`.sidebar-menu`, 'nk-menu-item');
              parents.forEach(parentElemets =>{
                  parentElemets.classList.add('active', 'current-page');
                  let subItem = parentElemets.querySelector(`.nk-menu-wrap`);
                  subItem !== null && (subItem.style.display = "block")
              })
              
          } else {
              item.parentElement.classList.remove('active', 'current-page');
          }
      })
  } 
  // dropdown toggle
  let dropdownToggle = function(elm){
      let parent = elm.parentElement;
      let nextelm = elm.nextElementSibling;
      let speed = nextelm.children.length > 5 ? 400 + nextelm.children.length * 10 : 400;
      if(!parent.classList.contains('active')){
          parent.classList.add('active');
          slideDown(nextelm,speed);
      }else{
          parent.classList.remove('active');
          slideUp(nextelm,speed);
      }
  }

  // dropdown close siblings
  let closeSiblings = function(elm){
      let parent = elm.parentElement;
      let siblings = parent.parentElement.children;
      Array.from(siblings).forEach(item => {
      if(item !== parent){
          item.classList.remove('active');
          if(item.classList.contains('has-sub')){
          let subitem = item.querySelectorAll(`.nk-menu-wrap`);
          subitem.forEach(child => {
              child.parentElement.classList.remove('active');
              slideUp(child,400);
          })
          }
      }
      });
  }

  let menuToggle = function(e){
      e.preventDefault();
      let item = e.target.closest(`.nk-menu-toggle`)
      dropdownToggle(item);
      closeSiblings(item);
  }

  let routeChange = function(e){
      let selector = document.querySelectorAll(".nk-menu-link")
      selector.forEach((item, index)=>{
          if(item.classList.contains('active')){
              closeSiblings(item);
              item.parentElement.classList.add("active");
          }else{
              item.parentElement.classList.remove("active");
              currentLink(`.nk-menu-link`);
          }
      })
  }
  
  useLayoutEffect(() =>{
      routeChange();
      themeUpdate.sidebarHide();
  },[location.pathname])

  useEffect(() =>{
      currentLink(`.nk-menu-link`);
      // eslint-disable-next-line
  },[null])

  // Group items by headings and flatten submenus
  const groupedData = [];
  let currentGroup = { heading: null, items: [] };
  
  data.forEach((item, index) => {
    if (item.heading) {
      if (currentGroup.items.length > 0) {
        groupedData.push(currentGroup);
      }
      currentGroup = { heading: item.heading, items: [] };
    } else {
      // If item has subMenu, add submenu items directly instead of the parent item
      if (item.subMenu && item.subMenu.length > 0) {
        currentGroup.items.push(...item.subMenu);
      } else {
        currentGroup.items.push(item);
      }
    }
  });
  
  if (currentGroup.items.length > 0 || currentGroup.heading) {
    groupedData.push(currentGroup);
  }

  return (
    <ul className="nk-menu nk-menu-md sidebar-menu">
      {groupedData.map((group, groupIndex) => (
        <Fragment key={groupIndex}>
          {group.heading && (
            <li className="nk-menu-heading">
              <div
                className={`nk-menu-heading-toggle ${!collapsedSections[group.heading] ? 'expanded' : ''}`}
                onClick={() => toggleSection(group.heading)}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '2px 0px'
                }}
              >
                <Icon name={getSectionIcon(group.heading)} />
                <h6 className="overline-title" style={{ margin: 0, flex: 1 }}>
                  {group.heading}
                </h6>
                <Icon
                  name={collapsedSections[group.heading] ? "chevron-right" : "chevron-down"}
                  style={{ fontSize: '16px' }}
                />
              </div>
            </li>
          )}
          {!collapsedSections[group.heading] && group.items.map((item, index) => (
            <li key={index} className="nk-menu-item nk-menu-sub-item">
                <NavLink to={item.link} className="nk-menu-link" target={item.newTab && '_blank'}>
                  <span className="nk-menu-text">{item.text}</span>
                  {item.badge && <span className="nk-menu-badge">{item.badge}</span>}
                </NavLink>
              </li>
          ))}
        </Fragment>
      ))}
    </ul>
  );
};

export default Menu;
