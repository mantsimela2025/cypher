import React from "react";
import { LayoutDashboard, Users, Shield, FileText, Sliders, LogIn, UserCircle } from "lucide-react";

const cards = [
  {
    title: "Users",
    desc: "Manage user accounts, permissions, and access controls",
    count: 24,
    icon: <Users size={48} className="text-primary bg-white rounded-circle p-1 shadow-sm" />,
    link: "#",
    linkText: "Manage Users"
  },
  {
    title: "Roles",
    desc: "Configure role-based access control and permissions",
    count: 4,
    icon: <Shield size={48} className="text-primary bg-white rounded-circle p-1 shadow-sm" />,
    link: "#",
    linkText: "Manage Roles"
  },
  {
    title: "Audit Logs",
    desc: "Review system activity and security event logs",
    count: 1248,
    icon: <FileText size={48} className="text-primary bg-white rounded-circle p-1 shadow-sm" />,
    link: "#",
    linkText: "Manage Audit Logs"
  },
  {
    title: "System Settings",
    desc: "Configure global application settings and defaults",
    icon: <Sliders size={48} className="text-primary bg-white rounded-circle p-1 shadow-sm" />,
    link: "#",
    linkText: "Manage System Settings"
  },
  {
    title: "Authentication",
    desc: "Configure SSO, MFA, and other authentication settings",
    icon: <LogIn size={48} className="text-primary bg-white rounded-circle p-1 shadow-sm" />,
    link: "#",
    linkText: "Manage Authentication"
  },
  {
    title: "User Profile",
    desc: "Manage your personal account settings and preferences",
    icon: <UserCircle size={48} className="text-primary bg-white rounded-circle p-1 shadow-sm" />,
    link: "#",
    linkText: "Manage User Profile"
  }
];

const AdminDashboard = () => (
  <div className="container-fluid py-4">
    <h2 className="fw-bold mb-1">Admin Dashboard</h2>
    <div className="text-muted mb-4" style={{ fontSize: "1.1rem" }}>
      An overview of most important admin metrics
    </div>
    <div className="row g-4">
      {cards.map((card, idx) => (
        <div className="col-12 col-md-6 col-lg-4" key={idx}>
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body pb-2 position-relative">
              <div className="fw-bold mb-1 d-flex align-items-center" style={{ fontSize: "1.15rem" }}>
                {card.title}
                <span className="ms-auto">{card.icon}</span>
              </div>
              <div className="text-muted mb-2" style={{ minHeight: 44 }}>{card.desc}</div>
              {card.count !== undefined && (
                <div className="fw-bold display-6 mb-2" style={{ fontSize: 32 }}>{card.count}</div>
              )}
              <a href={card.link} className="fw-semibold text-decoration-none text-primary" style={{ fontSize: "1.05rem" }}>{card.linkText}</a>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default AdminDashboard;
