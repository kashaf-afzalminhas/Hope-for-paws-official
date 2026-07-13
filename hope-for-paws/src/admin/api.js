import { API_BASE_URL } from '../config';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

// Request queue for batching
let requestQueue = [];
let isProcessingQueue = false;

// Rate limiting
const RATE_LIMIT_DELAY = 100; // 100ms between requests
let lastRequestTime = 0;

// Helper function to get token
const getToken = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token || token === 'null' || token === 'undefined') return null;
  return token;
};

// Helper function to check cache
const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

// Helper function to set cache
const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Rate limiting function
const rateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => 
      setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
};

// Process request queue
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const { url, options, resolve, reject } = requestQueue.shift();
    
    try {
      await rateLimit();
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        reject(new Error(errorData.message || `HTTP error! status: ${response.status}`));
      } else {
        const data = await response.json();
        resolve(data);
      }
    } catch (error) {
      reject(error);
    }
  }
  
  isProcessingQueue = false;
};

// Centralized fetch function with queue
const apiFetch = async (url, options = {}) => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ url, options, resolve, reject });
    processQueue();
  });
};

// API functions
export const adminAPI = {
  // Get all users with stats in a single request
  async getAllUsersWithStats() {
    const cacheKey = 'admin-users-with-stats';
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const token = getToken();
    if (!token) throw new Error('No authentication token');

    const response = await apiFetch(`${API_BASE_URL}/admin/users-with-stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setCachedData(cacheKey, response);
    return response;
  },

  // Get all adoptions
  async getAllAdoptions() {
    const cacheKey = 'admin-all-adoptions';
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const token = getToken();
    const response = await apiFetch(`${API_BASE_URL}/admin/adoptions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setCachedData(cacheKey, response);
    return response;
  },

  // Get all posts with comments
  async getAllPosts() {
    const cacheKey = 'admin-all-posts';
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const token = getToken();
    const response = await apiFetch(`${API_BASE_URL}/admin/posts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setCachedData(cacheKey, response);
    return response;
  },

  // Get all comments
  async getAllComments() {
    const cacheKey = 'admin-all-comments';
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const token = getToken();
    const response = await apiFetch(`${API_BASE_URL}/admin/comments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setCachedData(cacheKey, response);
    return response;
  },

  // Get all adoption requests
  async getAllAdoptionRequests() {
    const cacheKey = 'admin-all-adoption-requests';
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const token = getToken();
    const response = await apiFetch(`${API_BASE_URL}/admin/adoption-requests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setCachedData(cacheKey, response);
    return response;
  },

  // Get adoption requests for a specific user
  async getUserAdoptionRequests(userId) {
    const cacheKey = `admin-user-adoption-requests-${userId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const token = getToken();
    const response = await apiFetch(`${API_BASE_URL}/admin/adoption-requests/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    setCachedData(cacheKey, response);
    return response;
  },

  // Delete operations
  async deleteUser(userId) {
    const token = getToken();
    await apiFetch(`${API_BASE_URL}/admin/user/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    // Clear relevant caches
    cache.delete('admin-users-with-stats');
  },

  async deleteAdoption(adoptionId) {
    const token = getToken();
    await apiFetch(`${API_BASE_URL}/admin/adoptions/${adoptionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    cache.delete('admin-all-adoptions');
  },

  async deletePost(postId) {
    const token = getToken();
    await apiFetch(`${API_BASE_URL}/admin/posts/${postId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    cache.delete('admin-all-posts');
  },

  async deleteComment(commentId) {
    const token = getToken();
    await apiFetch(`${API_BASE_URL}/admin/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    cache.delete('admin-all-comments');
  },

  async deleteAdoptionRequest(requestId) {
    const token = getToken();
    await apiFetch(`${API_BASE_URL}/admin/adoption-requests/${requestId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    cache.delete('admin-all-adoption-requests');
  },

  // Clear all cache
  clearCache() {
    cache.clear();
  }
};

export default apiFetch;