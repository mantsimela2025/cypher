import React, { createContext, useContext, useState, useEffect } from 'react';
import timeoutManager, { sessionUtils } from '@/utils/timeoutManager';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // First check if AUTH_BYPASS is enabled on the backend
        try {
          console.log('🔍 Checking AUTH_BYPASS status...');
          const bypassResponse = await fetch('http://localhost:3001/health', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          console.log('📡 Health endpoint response status:', bypassResponse.status);

          if (bypassResponse.ok) {
            const healthData = await bypassResponse.json();
            console.log('📊 Health data:', healthData);

            // Check if AUTH_BYPASS is enabled (indicated in health response)
            // Only bypass if explicitly enabled in backend, not just because it's development
            if (healthData.authBypass === true) {
              console.log('🔓 AUTH_BYPASS mode detected - skipping authentication');
              setIsAuthenticated(true);
              setUser({
                id: 1,
                email: 'dev@local',
                username: 'dev',
                role: 'admin',
                status: 'active',
                isBypass: true
              });
              setIsLoading(false);
              return;
            } else {
              console.log('🔐 AUTH_BYPASS is disabled - authentication required');
            }
          } else {
            console.warn('⚠️ Health endpoint returned status:', bypassResponse.status);
          }
        } catch (bypassError) {
          console.warn('⚠️ Could not check AUTH_BYPASS status:', bypassError);
          console.log('Proceeding with normal authentication flow');
        }

        // Clear any existing bypass auth data to force fresh login
        // This ensures no old bypass tokens remain in localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user.isBypass) {
              console.log('🧹 Clearing bypass authentication data');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              setIsAuthenticated(false);
              setUser(null);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.log('Error parsing user data, clearing auth state');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
            return;
          }
        }

        const token = localStorage.getItem('accessToken');
        const storedUserData = localStorage.getItem('user');

        if (token && storedUserData) {
          // Validate token with server
          try {
            console.log('🔍 Validating existing token...');
            const response = await fetch('http://localhost:3001/api/v1/auth/validate', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            console.log('📡 Token validation response status:', response.status);

            if (response.ok) {
              // Token is valid
              console.log('✅ Token is valid, user authenticated');
              setIsAuthenticated(true);
              setUser(JSON.parse(storedUserData));
            } else {
              // Token is invalid, clear storage
              console.log('❌ Token is invalid, clearing auth data');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              setIsAuthenticated(false);
              setUser(null);
            }
          } catch (error) {
            // Network error or server error, clear storage to be safe
            console.error('❌ Token validation failed:', error);
            console.log('🧹 Clearing auth data due to validation error');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (userData, tokens) => {
    try {
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);

      // Initialize timeout management after successful login
      sessionUtils.init();
      console.log('✅ Login successful, timeout management initialized');
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = () => {
    try {
      console.log('🔓 Logging out user...');

      // Destroy timeout management
      sessionUtils.destroy();

      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Update state
      setUser(null);
      setIsAuthenticated(false);

      console.log('✅ Logout successful - user state cleared');
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    // Session management utilities
    getSessionStatus: sessionUtils.getStatus,
    extendSession: sessionUtils.extend,
    forceLogout: sessionUtils.forceLogout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};