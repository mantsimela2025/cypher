import React, { createContext, useContext, useState, useEffect } from 'react';
import timeoutManager, { sessionUtils } from '@/utils/timeoutManager';
import { apiClient } from '@/utils/apiClient';
import { API_CONFIG, log } from '@/utils/config';

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
        // TEMPORARILY DISABLED: Health check causing session expired loops
        // TODO: Re-enable once backend is properly configured
        /*
        // First check if AUTH_BYPASS is enabled on the backend
        try {
          log.info('🔍 Checking AUTH_BYPASS status...');
          const healthData = await apiClient.get('/health');

          log.info('📊 Health data:', healthData);

          // Check if AUTH_BYPASS is enabled (indicated in health response)
          // Only bypass if explicitly enabled in backend, not just because it's development
          if (healthData && healthData.authBypass === true) {
            log.info('🔓 AUTH_BYPASS mode detected - skipping authentication');
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
              log.info('🔐 AUTH_BYPASS is disabled - authentication required');
            }
        } catch (bypassError) {
          log.warn('⚠️ Could not check AUTH_BYPASS status:', bypassError.message);
          log.info('Proceeding with normal authentication flow');
          // If health endpoint fails, we'll continue with normal auth flow
        }
        */

        log.info('🔐 Skipping health check - proceeding with normal authentication flow');

        // Clear any existing bypass auth data to force fresh login
        // This ensures no old bypass tokens remain in localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user.isBypass) {
              log.info('🧹 Clearing bypass authentication data');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              setIsAuthenticated(false);
              setUser(null);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            log.error('Error parsing user data, clearing auth state');
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
          // TEMPORARILY DISABLED: Token validation causing session expired loops
          // TODO: Re-enable once backend is properly configured and accessible
          /*
          // Validate token with server
          try {
            log.info('🔍 Validating existing token...');
            const validationData = await apiClient.get('/auth/validate');

            // Token is valid
            log.info('✅ Token is valid, user authenticated');
            setIsAuthenticated(true);
            setUser(JSON.parse(storedUserData));
          } catch (error) {
            // Token is invalid or network error, clear storage to be safe
            log.error('❌ Token validation failed:', error.message);
            log.info('🧹 Clearing auth data due to validation error');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setIsAuthenticated(false);
            setUser(null);
          }
          */

          // For now, clear any existing tokens to force fresh login
          log.info('🧹 Clearing existing auth data to force fresh login');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        log.error('Error checking auth status:', error.message);
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
      log.info('✅ Login successful, timeout management initialized');
    } catch (error) {
      log.error('Error during login:', error.message);
    }
  };

  const logout = () => {
    try {
      log.info('🔓 Logging out user...');

      // Destroy timeout management
      sessionUtils.destroy();

      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Update state
      setUser(null);
      setIsAuthenticated(false);

      log.info('✅ Logout successful - user state cleared');
    } catch (error) {
      log.error('❌ Error during logout:', error.message);
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