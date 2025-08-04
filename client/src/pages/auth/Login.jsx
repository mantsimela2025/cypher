import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Head from "@/layout/head/Head";
import { useForm } from "react-hook-form";
import "./Login.css";
import backgroundImage from "@/assets/images/grayTechyBkgrd.jpg";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [passState, setPassState] = useState(false);
  const [errorVal, setError] = useState("");
  const [activeTab, setActiveTab] = useState("login"); // "login" or "request"
  const [passwordAuth, setPasswordAuth] = useState(true);
  const navigate = useNavigate();

  // Check if user is already logged in
  React.useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // User is already logged in, redirect to dashboard
      navigate('/');
    }
  }, [navigate]);

  const onFormSubmit = async (formData) => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch('http://localhost:3001/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store the access token and user data
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        
        // Navigate to dashboard
        navigate('/');
      } else {
        setError(data.message || "Login failed");
      }
    } catch (error) {
      console.error('Login error:', error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <div className="login-page-wrapper">
      <Head title="RAS Dashboard - Login" />
      <div className="login-container">
        {/* Left side - Login Form */}
        <div className="login-form-side">
          <div className="login-form-container">
            <div className={`login-card ${activeTab === 'request' ? 'request-active' : ''}`}>
              {activeTab === 'login' ? (
                <>
                  <h2 className="login-title">Request System Access</h2>
                  <p className="login-subtitle">Submit a request for access to the Cyber Security as a Service (CSaaS)</p>
                </>
              ) : (
                <>
                  <h2 className="login-title">Request System Access</h2>
                  <p className="login-subtitle">Submit a request for access to the Cyber Security as a Service (CSaaS)</p>
                </>
              )}

            {/* Tab Toggle Buttons */}
            <div className="auth-tabs">
              <div className="tab-buttons">
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                  onClick={() => setActiveTab('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'request' ? 'active' : ''}`}
                  onClick={() => setActiveTab('request')}
                >
                  Request Access
                </button>
              </div>
            </div>

            {/* Password Authentication Toggle */}
            <div className="auth-toggle">
              <div className="toggle-wrapper">
                <span className="toggle-icon">🔑</span>
                <span className="toggle-label">Password Authentication</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={passwordAuth}
                    onChange={(e) => setPasswordAuth(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
              
              {/* Login Form */}
              {activeTab === 'login' && (
                <form className="login-form" onSubmit={handleSubmit(onFormSubmit)}>
                  {errorVal && (
                    <div className="error-message">
                      <i className="error-icon">⚠</i>
                      {errorVal}
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Username</label>
                    <input
                      type="email"
                      id="email"
                      {...register('email', { required: "Email is required" })}
                      defaultValue="admin@rasdash.com"
                      placeholder="Enter your username"
                      className="form-input"
                    />
                    {errors.email && <span className="field-error">{errors.email.message}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="password" className="form-label">Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={passState ? "text" : "password"}
                        id="password"
                        {...register('password', { required: "Password is required" })}
                        defaultValue="Admin123!"
                        placeholder="Enter your password"
                        className="form-input"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setPassState(!passState)}
                      >
                        {passState ? "👁" : "👁‍🗨"}
                      </button>
                    </div>
                    {errors.password && <span className="field-error">{errors.password.message}</span>}
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input type="checkbox" className="checkbox-input" />
                      <span className="checkbox-text">I agree to the security notice</span>
                    </label>
                    <p className="checkbox-subtext">You must agree to the security notice to proceed</p>
                  </div>

                  <button type="submit" className="login-button" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="loading-spinner">⟳</span>
                        Signing In...
                      </>
                    ) : (
                      "Login with Password"
                    )}
                  </button>
                </form>
              )}

              {/* Request Access Form */}
              {activeTab === 'request' && (
                <div className="request-form">

                  <div className="form-row">
                    <div className="form-group half-width">
                      <label htmlFor="firstName" className="form-label">First Name</label>
                      <input
                        type="text"
                        id="firstName"
                        placeholder="First name"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group half-width">
                      <label htmlFor="lastName" className="form-label">Last Name</label>
                      <input
                        type="text"
                        id="lastName"
                        placeholder="Last name"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="requestEmail" className="form-label">Email Address</label>
                    <input
                      type="email"
                      id="requestEmail"
                      placeholder="Enter your email address"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="reason" className="form-label">Reason For Request</label>
                    <textarea
                      id="reason"
                      placeholder="Please explain why you need access to this system"
                      className="form-textarea"
                      rows="4"
                    />
                  </div>

                  <div className="info-box">
                    <div className="info-icon">ℹ️</div>
                    <div className="info-content">
                      <h4>Access Request Information</h4>
                      <p>Your request will be reviewed by system administrators. If approved, you will receive an email with login credentials and further instructions.</p>
                    </div>
                  </div>

                  <button type="button" className="login-button" style={{marginTop: '6px'}}>
                    Send Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Background Image with Security Text */}
        <div
          className="login-background-side"
          style={{
            backgroundImage: `url(${backgroundImage}), linear-gradient(135deg, #6b7280 0%, #4b5563 100%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="background-overlay">
            <div className="brand-header">
              <img src="/logo.png" alt="RAS Dashboard" className="brand-logo-img" />
            </div>

            <div className="security-content">
              <h2 className="security-main-title">Cyber Security as a Service (CSaaS)</h2>

              <div className="security-notice">
                <h3 className="security-title">Security Notice:</h3>
                <div className="security-text">
                  <p>You are accessing a U.S. Government (USG) Information System (IS) that is provided for USG-authorized use only. By using this IS (which includes any device attached to this IS), you consent to the following conditions:</p>

                  <ul>
                    <li>The USG routinely intercepts and monitors communications on this IS for purposes including, but not limited to, penetration testing, COMSEC monitoring, network operations and defense, personnel misconduct (PM), law enforcement (LE), and counterintelligence (CI) investigations.</li>
                    <li>At any time, the USG may inspect and seize data stored on this IS.</li>
                    <li>Communications using, or data stored on, this IS are not private, are subject to routine monitoring, interception, and search, and may be disclosed or used for any USG-authorized purpose.</li>
                    <li>This IS includes security measures (e.g., authentication and access controls) to protect USG interests—not for your personal benefit or privacy.</li>
                    <li>Notwithstanding the above, using this IS does not constitute consent to PM, LE, or CI investigative searching or monitoring of the content of privileged communications, or work product, related to personal representation or services by attorneys, psychotherapists, or clergy, and their assistants. Such communications and work product are private and confidential. See User Agreement for details.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
