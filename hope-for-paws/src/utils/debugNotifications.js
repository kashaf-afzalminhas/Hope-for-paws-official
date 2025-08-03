import axios from 'axios';
import { API_BASE_URL } from '../config';

export const debugNotificationSystem = async () => {
  console.log('=== Notification System Debug ===');
  
  // Check environment
  console.log('Environment:', {
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    hostname: window.location.hostname,
    API_BASE_URL
  });

  // Check authentication
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
  console.log('Authentication:', {
    hasToken: !!token,
    hasUser: !!user,
    user: user ? { id: user.id, username: user.username } : null
  });

  // Test backend health
  try {
    const healthUrl = API_BASE_URL.replace('/api', '') + '/health';
    console.log('Testing health endpoint:', healthUrl);
    const healthResponse = await axios.get(healthUrl, { timeout: 5000 });
    console.log('Health check success:', healthResponse.data);
  } catch (error) {
    console.error('Health check failed:', error.message);
  }

  // Test notification endpoint (if authenticated)
  if (token) {
    try {
      console.log('Testing notification endpoint...');
      const response = await axios.get(`${API_BASE_URL}/notifications?page=1&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      console.log('Notification endpoint success:', {
        count: response.data.notifications?.length || 0,
        hasNotifications: response.data.notifications?.length > 0
      });
    } catch (error) {
      console.error('Notification endpoint failed:', {
        status: error.response?.status,
        message: error.message
      });
    }
  } else {
    console.log('Skipping notification endpoint test - no token');
  }

  console.log('=== Debug Complete ===');
};

// Function to test rate limiting
export const testRateLimiting = async () => {
  console.log('=== Rate Limiting Test ===');
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    console.log('No token available for rate limiting test');
    return;
  }

  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      axios.get(`${API_BASE_URL}/notifications?page=1&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      }).catch(error => ({ error: true, status: error.response?.status, message: error.message }))
    );
  }

  const results = await Promise.all(promises);
  const successCount = results.filter(r => !r.error).length;
  const rateLimitedCount = results.filter(r => r.error && r.status === 429).length;
  const otherErrors = results.filter(r => r.error && r.status !== 429).length;

  console.log('Rate limiting test results:', {
    total: results.length,
    success: successCount,
    rateLimited: rateLimitedCount,
    otherErrors
  });
};

// Function to clear notification cache
export const clearNotificationCache = () => {
  console.log('Clearing notification cache...');
  // This would clear any cached notifications if you implement caching
  console.log('Cache cleared');
};

// Auto-run debug if this file is imported directly
if (typeof window !== 'undefined') {
  window.debugNotificationSystem = debugNotificationSystem;
} 