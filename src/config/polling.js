/**
 * Polling Configuration
 * Centralized configuration for all polling intervals in the application
 */

export const POLLING_CONFIG = {
  // Default polling interval (5 seconds)
  DEFAULT_INTERVAL: 5000,
  
  // Upload tasks polling
  UPLOAD_INTERVAL: 5000,
  
  // Extract tasks polling  
  EXTRACT_INTERVAL: 5000,
  
  // Image analysis polling
  ANALYSIS_INTERVAL: 5000,
  
  // Task status polling
  TASK_STATUS_INTERVAL: 5000,
  
  // Maximum attempts (5 minutes with 5s intervals = 60 attempts)
  MAX_ATTEMPTS: 60,
  
  // Maximum attempts for upload (5 minutes)
  MAX_UPLOAD_ATTEMPTS: 60,
  
  // Maximum attempts for extract (5 minutes)
  MAX_EXTRACT_ATTEMPTS: 60,
  
  // Maximum attempts for analysis (5 minutes)
  MAX_ANALYSIS_ATTEMPTS: 60,
  
  // Quick polling for immediate feedback (1 second)
  QUICK_INTERVAL: 1000,
  
  // Quick polling max attempts (30 seconds)
  QUICK_MAX_ATTEMPTS: 30,
};

export default POLLING_CONFIG;
