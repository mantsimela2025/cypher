import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Badge } from 'reactstrap';
import { Icon } from '@/components/Component';

/**
 * Session Status Component
 * Shows current session status and provides session management controls
 */
const SessionStatus = ({ showExtendButton = true, showTimeRemaining = true }) => {
  const { getSessionStatus, extendSession, isAuthenticated } = useAuth();
  const [sessionStatus, setSessionStatus] = useState({ valid: false, timeRemaining: 0 });
  const [extending, setExtending] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Update session status every 30 seconds
    const updateStatus = () => {
      const status = getSessionStatus();
      setSessionStatus(status);
    };

    updateStatus(); // Initial update
    const interval = setInterval(updateStatus, 30 * 1000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, getSessionStatus]);

  const handleExtendSession = async () => {
    setExtending(true);
    try {
      await extendSession();
      // Status will be updated by the interval
    } catch (error) {
      console.error('Failed to extend session:', error);
    } finally {
      setExtending(false);
    }
  };

  const formatTimeRemaining = (seconds) => {
    if (seconds <= 0) return '0m';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const getStatusColor = () => {
    if (!sessionStatus.valid) return 'danger';
    if (sessionStatus.timeRemaining <= 2 * 60) return 'warning'; // Less than 2 minutes
    if (sessionStatus.timeRemaining <= 5 * 60) return 'info'; // Less than 5 minutes
    return 'success';
  };

  const getStatusText = () => {
    if (!sessionStatus.valid) return 'Expired';
    if (sessionStatus.timeRemaining <= 2 * 60) return 'Expiring Soon';
    return 'Active';
  };

  if (!isAuthenticated) return null;

  return (
    <div className="d-flex align-items-center gap-2">
      {/* Session Status Badge */}
      <Badge color={getStatusColor()} className="d-flex align-items-center gap-1">
        <Icon name="clock" size="sm" />
        <span>{getStatusText()}</span>
      </Badge>

      {/* Time Remaining */}
      {showTimeRemaining && sessionStatus.valid && (
        <small className="text-muted">
          {formatTimeRemaining(sessionStatus.timeRemaining)} left
        </small>
      )}

      {/* Extend Session Button */}
      {showExtendButton && sessionStatus.valid && sessionStatus.timeRemaining <= 5 * 60 && (
        <Button
          color="primary"
          size="sm"
          onClick={handleExtendSession}
          disabled={extending}
          className="d-flex align-items-center gap-1"
        >
          {extending ? (
            <>
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span>Extending...</span>
            </>
          ) : (
            <>
              <Icon name="refresh-cw" size="sm" />
              <span>Extend</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default SessionStatus;
