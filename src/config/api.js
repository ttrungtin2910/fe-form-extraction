// API Configuration
const API_CONFIG = {
  // Base URL for all API calls - use environment variable if available
  BASE_URL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  // API Key for authentication - should be set via environment variable
  API_KEY: process.env.REACT_APP_API_KEY || "",
  
  // Image Management APIs
  IMAGES: {
    // Get all images
    GET_ALL: "/images/",
    // Get folders list
    FOLDERS: "/folders/",
    RENAME_FOLDER: "/folders/rename",
    // Delete specific image by name
    DELETE: (imageName) => `/images/${encodeURIComponent(imageName)}`,
    // Upload new image
    UPLOAD: "/upload-image/",
  },
  
  // Form Extraction APIs
  FORM_EXTRACTION: {
    // Extract form from image
    EXTRACT: "/ExtractForm",
    // Get form extract information
    GET_INFO: "/GetFormExtractInformation",
  },
  
  // Queue Management APIs
  QUEUE: {
    // Upload image to queue
    UPLOAD: "/queue/upload-image",
    // Extract form from image in queue
    EXTRACT: "/queue/extract-form",
    // Get task status by ID
    TASK_STATUS: (id) => `/tasks/${id}`,
  },
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Logger utility
const logger = {
  info: (message, data = null) => {
    console.log(`[API INFO] ${message}`, data ? data : '');
  },
  error: (message, error = null) => {
    console.error(`[API ERROR] ${message}`, error ? error : '');
  },
  success: (message, data = null) => {
    console.log(`[API SUCCESS] ${message}`, data ? data : '');
  },
  request: (method, url, data = null) => {
    console.log(`[API REQUEST] ${method} ${url}`, data ? data : '');
  },
  response: (status, data = null) => {
    console.log(`[API RESPONSE] Status: ${status}`, data ? data : '');
  }
};

// Helper function to make API calls with common configuration
export const apiCall = async (endpoint, options = {}) => {
  const url = buildApiUrl(endpoint);
  const method = options.method || 'GET';
  
  // Don't set default Content-Type for FormData
  const defaultHeaders = {};
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  
  // Add authentication header
  // Priority: User JWT token > API Key
  const userToken = localStorage.getItem('token');
  if (userToken) {
    defaultHeaders['Authorization'] = `Bearer ${userToken}`;
  } else if (API_CONFIG.API_KEY) {
    defaultHeaders['Authorization'] = `Bearer ${API_CONFIG.API_KEY}`;
  }
  
  const defaultOptions = {
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // Log request
  logger.request(method, url, options.body ? 'Request body present' : 'No body');
  if (options.body) {
    console.log(`[API] Request body type:`, typeof options.body);
    if (options.body instanceof FormData) {
      console.log(`[API] FormData entries:`, Array.from(options.body.entries()));
    } else {
      console.log(`[API] Request body:`, options.body);
    }
  }

  try {
    const startTime = Date.now();
    const response = await fetch(url, finalOptions);
    const endTime = Date.now();
    
    // Log response
    logger.response(response.status, `Response time: ${endTime - startTime}ms`);
    
    if (!response.ok) {
      let errorMessage = `API call failed: ${response.status} ${response.statusText}`;
      
      // Try to get detailed error from response
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage += ` - ${errorData.detail}`;
        }
      } catch (e) {
        // If we can't parse JSON, use the original message
      }
      
      logger.error(errorMessage);
      const error = new Error(errorMessage);
      error.status = response.status;
      error.statusText = response.statusText;
      throw error;
    }
    
    const data = await response.json();
    logger.success(`${method} ${endpoint} completed successfully`, data);
    return data;
  } catch (error) {
    logger.error(`API call failed for ${method} ${endpoint}`, error);
    throw error;
  }
};

// Specific API functions for common operations
export const api = {
  // Auth operations
  auth: {
    login: (username, password) => apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
    logout: () => apiCall('/auth/logout', { method: 'POST' }),
    getCurrentUser: () => apiCall('/auth/me'),
  },

  // Image operations
  images: {
    getAll: ({ page = 1, limit = 20, folderPath, sortField, sortOrder } = {}) => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (folderPath !== undefined && folderPath !== null) {
        params.append("folderPath", folderPath);
      }
      if (sortField) {
        params.append("sortField", sortField);
      }
      if (sortOrder) {
        params.append("sortOrder", sortOrder);
      }

      return apiCall(`${API_CONFIG.IMAGES.GET_ALL}?${params.toString()}`);
    },
    getByFolder: (folderPath, { page = 1, limit = 20, sortField, sortOrder } = {}) => {
      const params = new URLSearchParams({
        folderPath,
        page: String(page),
        limit: String(limit),
      });

      if (sortField) {
        params.append("sortField", sortField);
      }
      if (sortOrder) {
        params.append("sortOrder", sortOrder);
      }

      return apiCall(`${API_CONFIG.IMAGES.GET_ALL}?${params.toString()}`);
    },
    getFolders: (parent = null, includeCount = false) => {
      const params = new URLSearchParams();
      if (parent !== null) {
        params.append('parent', parent);
      }
      if (includeCount) {
        params.append('includeCount', 'true');
      }
      const queryString = params.toString();
      return apiCall(`${API_CONFIG.IMAGES.FOLDERS}${queryString ? '?' + queryString : ''}`);
    },
    createFolder: (folderPath) => apiCall(API_CONFIG.IMAGES.FOLDERS, {
      method: 'POST',
      body: JSON.stringify({ folderPath })
    }),
    delete: (imageName) => apiCall(API_CONFIG.IMAGES.DELETE(imageName), { method: 'DELETE' }),
    upload: (formData) => apiCall(API_CONFIG.IMAGES.UPLOAD, {
      method: 'POST',
      body: formData,
      // No headers - let browser set Content-Type for FormData
    }),
    fetchImages: (body = {}) => apiCall(API_CONFIG.IMAGES.GET_ALL, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    deleteFolder: (folderPath) => apiCall(`${API_CONFIG.IMAGES.FOLDERS}${encodeURIComponent(folderPath)}`, { method: 'DELETE' }),
    renameFolder: (oldPath, newPath) => apiCall(API_CONFIG.IMAGES.RENAME_FOLDER, {
      method: 'POST',
      body: JSON.stringify({ oldPath, newPath })
    }),
    getActivityLogs: (params = '') => apiCall(`/activity-logs${params}`),
    getMyActivityLogs: (params = '') => apiCall(`/activity-logs/my-activity${params}`),
    getActivitySummary: (params = '') => apiCall(`/activity-logs/summary${params}`),
    cleanupActivityLogs: (daysToKeep) => apiCall('/activity-logs/cleanup', {
      method: 'POST',
      body: JSON.stringify({ days_to_keep: daysToKeep }),
    }),
  },
  
  // Form extraction operations
  formExtraction: {
    extract: (data) => apiCall(API_CONFIG.FORM_EXTRACTION.EXTRACT, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getInfo: (data) => apiCall(API_CONFIG.FORM_EXTRACTION.GET_INFO, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  
  // Queue operations
  queue: {
    upload: (formData) => apiCall(API_CONFIG.QUEUE.UPLOAD, { method: 'POST', body: formData }),
    extract: (data) => apiCall(API_CONFIG.QUEUE.EXTRACT, { method: 'POST', body: JSON.stringify(data) }),
    taskStatus: (id) => apiCall(API_CONFIG.QUEUE.TASK_STATUS(id)),
  },
  
  // Statistics operations
  statistics: {
    getDashboard: ({ forceRefresh = false } = {}) => {
      const params = new URLSearchParams();
      if (forceRefresh) {
        params.append("forceRefresh", "true");
      }
      const suffix = params.toString();
      const endpoint = suffix ? `/statistics/dashboard?${suffix}` : "/statistics/dashboard";
      return apiCall(endpoint);
    },
    exportAll: () => apiCall('/statistics/export-all'),
  },
};

export default API_CONFIG;