/**
 * Comprehensive Timeout Management Utility
 * Handles JWT token expiration, cache timeouts, and session management
 */

import { apiClient } from './apiClient';
import { cacheUtils } from './apiCache';
import { toast } from 'react-toastify';

class TimeoutManager {
  constructor() {
    this.tokenCheckInterval = null;
    this.cacheCleanupInterval = null;
    this.sessionWarningShown = false;
    this.isInitialized = false;
  }

  /**
   * Initialize timeout management
   */
  init() {
    if (this.isInitialized) return;
    
    console.log('🕐 Initializing timeout management...');
    
    // Check token expiration every minute
    this.tokenCheckInterval = setInterval(() => {
      this.checkTokenExpiration();
    }, 60 * 1000); // 1 minute
    
    // Clean up expired cache every 5 minutes
    this.cacheCleanupInterval = setInterval(() => {
      cacheUtils.cleanup();
    }, 5 * 60 * 1000); // 5 minutes
    
    // Listen for user activity to reset session warnings
    this.setupActivityListeners();
    
    this.isInitialized = true;
    console.log('✅ Timeout management initialized');
  }

  /**
   * Clean up intervals
   */
  destroy() {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }
    
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
    }
    
    this.removeActivityListeners();
    this.isInitialized = false;
    console.log('🧹 Timeout management destroyed');
  }

  /**
   * Check if JWT token is about to expire
   */
  checkTokenExpiration() {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;
      
      // Warn user 2 minutes before expiration
      if (timeUntilExpiration <= 2 * 60 * 1000 && timeUntilExpiration > 0) {
        this.showSessionWarning(Math.floor(timeUntilExpiration / 1000));
      }
      
      // Token expired
      if (timeUntilExpiration <= 0) {
        console.log('🔄 Token expired, attempting refresh...');
        this.handleTokenExpiration();
      }
    } catch (error) {
      console.error('❌ Error checking token expiration:', error);
    }
  }

  /**
   * Handle token expiration
   */
  async handleTokenExpiration() {
    try {
      // Try to refresh token using the apiClient's built-in mechanism
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        this.forceLogout('Session expired');
        return;
      }

      // The apiClient will handle token refresh automatically on next request
      // We just need to clear any stale cached data
      cacheUtils.clear();
      this.sessionWarningShown = false;
      
      console.log('🔄 Token refresh will be handled on next API request');
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      this.forceLogout('Session expired. Please log in again.');
    }
  }

  /**
   * Show session warning to user
   */
  showSessionWarning(secondsRemaining) {
    if (this.sessionWarningShown) return;
    
    this.sessionWarningShown = true;
    
    toast.warning(
      `Your session will expire in ${Math.floor(secondsRemaining / 60)} minutes. ` +
      'Please save your work and refresh the page to extend your session.',
      {
        position: 'top-center',
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  }

  /**
   * Force logout and redirect
   */
  forceLogout(message = 'Session expired') {
    console.log('🔓 Forcing logout:', message);
    
    // Clear all storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Clear all cached data
    cacheUtils.clear();
    
    // Show message to user
    toast.error(message, {
      position: 'top-center',
      autoClose: 5000,
    });
    
    // Redirect to login
    setTimeout(() => {
      window.location.href = '/auth-login';
    }, 1000);
  }

  /**
   * Setup activity listeners to detect user interaction
   */
  setupActivityListeners() {
    const resetWarning = () => {
      this.sessionWarningShown = false;
    };

    // Reset warning on user activity
    document.addEventListener('click', resetWarning);
    document.addEventListener('keypress', resetWarning);
    document.addEventListener('scroll', resetWarning);
    document.addEventListener('mousemove', resetWarning);
    
    this.activityListeners = [
      { event: 'click', handler: resetWarning },
      { event: 'keypress', handler: resetWarning },
      { event: 'scroll', handler: resetWarning },
      { event: 'mousemove', handler: resetWarning },
    ];
  }

  /**
   * Remove activity listeners
   */
  removeActivityListeners() {
    if (this.activityListeners) {
      this.activityListeners.forEach(({ event, handler }) => {
        document.removeEventListener(event, handler);
      });
      this.activityListeners = null;
    }
  }

  /**
   * Get session status
   */
  getSessionStatus() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return { valid: false, timeRemaining: 0 };
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeRemaining = Math.max(0, expirationTime - currentTime);
      
      return {
        valid: timeRemaining > 0,
        timeRemaining: Math.floor(timeRemaining / 1000),
        expiresAt: new Date(expirationTime).toISOString(),
      };
    } catch (error) {
      console.error('❌ Error getting session status:', error);
      return { valid: false, timeRemaining: 0 };
    }
  }

  /**
   * Extend session by making a lightweight API call
   */
  async extendSession() {
    try {
      console.log('🔄 Extending session...');
      
      // Make a lightweight API call to trigger token refresh if needed
      await apiClient.get('/auth/validate');
      
      this.sessionWarningShown = false;
      
      toast.success('Session extended successfully', {
        position: 'top-right',
        autoClose: 3000,
      });
      
      console.log('✅ Session extended');
      return true;
    } catch (error) {
      console.error('❌ Failed to extend session:', error);
      return false;
    }
  }
}

// Global timeout manager instance
const timeoutManager = new TimeoutManager();

export default timeoutManager;

// Export utilities for direct use
export const sessionUtils = {
  init: () => timeoutManager.init(),
  destroy: () => timeoutManager.destroy(),
  getStatus: () => timeoutManager.getSessionStatus(),
  extend: () => timeoutManager.extendSession(),
  forceLogout: (message) => timeoutManager.forceLogout(message),
};
