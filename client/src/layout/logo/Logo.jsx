import React from "react";
import { Link } from "react-router-dom";

const Logo = () => {
  return (
    <Link to="/" className="logo-link">
      <img className="logo-img" src="/logo.png" alt="logo" style={{ height: '50px', width: '200px', objectFit: 'contain' }} />
    </Link>
  );
};

export default Logo;
