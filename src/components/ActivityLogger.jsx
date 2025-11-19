/**
 * Activity Logger Component
 * Tracks user activities and sends them to backend
 */
import React, { createContext, useContext, useCallback } from 'react';

const ActivityLoggerContext = createContext();

export const useActivityLogger = () => {
  const context = useContext(ActivityLoggerContext);
  if (!context) {
    throw new Error('useActivityLogger must be used within ActivityLoggerProvider');
  }
  return context;
};

export const ActivityLoggerProvider = ({ children }) => {
  const logActivity = useCallback(async (activityData) => {
    try {
      // Add timestamp and user info
      const logData = {
        ...activityData,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Send to backend (if needed for additional tracking)
      // Note: Most activities are already logged by middleware
      console.log('Activity logged:', logData);
      
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }, []);

  const logPageView = useCallback((pageName) => {
    logActivity({
      type: 'page_view',
      description: `Viewed page: ${pageName}`,
      metadata: {
        page: pageName,
        referrer: document.referrer,
      }
    });
  }, [logActivity]);

  const logUserAction = useCallback((action, details = {}) => {
    logActivity({
      type: 'user_action',
      description: `User action: ${action}`,
      metadata: {
        action,
        ...details
      }
    });
  }, [logActivity]);

  const logError = useCallback((error, context = {}) => {
    logActivity({
      type: 'error',
      description: `Error occurred: ${error.message || error}`,
      metadata: {
        error: error.toString(),
        stack: error.stack,
        ...context
      }
    });
  }, [logActivity]);

  const value = {
    logActivity,
    logPageView,
    logUserAction,
    logError,
  };

  return (
    <ActivityLoggerContext.Provider value={value}>
      {children}
    </ActivityLoggerContext.Provider>
  );
};
