import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "@/components/Component";
import data from "../Data";

const FileManagerTabNavigation = () => {
  const location = useLocation();

  return (
    <div className="nk-block-head nk-block-head-sm">
      <div className="nk-block-between">
        <div className="nk-block-head-content">
          <h3 className="nk-block-title page-title">Documents and Artifacts</h3>
        </div>
      </div>
      <div className="nk-block-head-content">
        <ul className="nav nav-tabs nav-tabs-mb-icon nav-tabs-card">
          {data.navigation.map((item) => (
            <li className="nav-item" key={item.id}>
              <Link
                className={`nav-link ${
                  location.pathname === `/app-file-manager${item.link}` ? "active" : ""
                }`}
                to={`/app-file-manager${item.link}`}
              >
                <Icon name={item.icon}></Icon>
                <span>{item.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FileManagerTabNavigation;