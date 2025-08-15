import React, { createContext, useContext, useState, useEffect } from 'react';

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
        // Clear any existing auth data to force fresh login after AUTH_BYPASS was disabled
        // This ensures no old bypass tokens remain in localStorage
        const authBypassDisabled = localStorage.getItem('authBypassDisabled');
        if (!authBypassDisabled) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.setItem('authBypassDisabled', 'true');
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

        const token = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');

        if (token && userData) {
          // Validate token with server
          try {
            const response = await fetch('http://localhost:3001/api/v1/auth/validate', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              // Token is valid
              setIsAuthenticated(true);
              setUser(JSON.parse(userData));
            } else {
              // Token is invalid, clear storage
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              setIsAuthenticated(false);
              setUser(null);
            }
          } catch (error) {
            // Network error or server error, clear storage to be safe
            console.error('Token validation failed:', error);
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
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = () => {
    try {
      console.log('🔓 Logging out user...');

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
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};