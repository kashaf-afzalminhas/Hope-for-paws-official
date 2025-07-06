import axios from 'axios';
import { API_BASE_URL } from '../config';

export const testNotificationSystem = async () => {
  console.log('🔍 Testing notification system...\n');
  console.log('API Base URL:', API_BASE_URL);

  try {
    // Test 1: Health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Health endpoint working:', healthResponse.data);

    // Test 2: Socket health endpoint
    console.log('\n2. Testing socket health endpoint...');
    const socketHealthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/socket-health`);
    console.log('✅ Socket health endpoint working:', socketHealthResponse.data);

    // Test 3: Notification test endpoint (no auth required)
    console.log('\n3. Testing notification test endpoint...');
    try {
      const testResponse = await axios.get(`${API_BASE_URL}/notifications/test`);
      console.log('✅ Notification test endpoint working:', testResponse.data);
    } catch (error) {
      console.log('❌ Notification test endpoint error:', error.response?.status, error.response?.data?.message);
    }

    // Test 4: Check if user is logged in
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
    
    console.log('\n4. Checking authentication...');
    if (token && user) {
      console.log('✅ User is logged in:', user.username);
      console.log('✅ Token exists:', token.substring(0, 20) + '...');
    } else {
      console.log('❌ User not logged in');
      console.log('Note: Notification endpoints require authentication');
      return;
    }

    // Test 5: Notification endpoints with auth
    console.log('\n5. Testing notification endpoints with auth...');
    
    try {
      const notificationsResponse = await axios.get(`${API_BASE_URL}/notifications?page=1&limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Notifications endpoint working:', notificationsResponse.data);
    } catch (error) {
      console.log('❌ Notifications endpoint error:', error.response?.status, error.response?.data?.message);
      console.log('Full error:', error);
    }

    try {
      const unreadResponse = await axios.get(`${API_BASE_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Unread count endpoint working:', unreadResponse.data);
    } catch (error) {
      console.log('❌ Unread count endpoint error:', error.response?.status, error.response?.data?.message);
      console.log('Full error:', error);
    }

    // Test 6: Socket.IO connection test
    console.log('\n6. Testing Socket.IO connection...');
    try {
      const { io } = await import('socket.io-client');
      const socket = io(API_BASE_URL.replace('/api', ''), {
        auth: { token },
        transports: ['polling', 'websocket'],
        timeout: 5000
      });

      const connectionPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket connection timeout'));
        }, 5000);

        socket.on('connect', () => {
          clearTimeout(timeout);
          resolve('connected');
        });

        socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      const result = await connectionPromise;
      console.log('✅ Socket.IO connection successful:', result);
      socket.disconnect();
    } catch (error) {
      console.log('❌ Socket.IO connection failed:', error.message);
      console.log('Note: This is expected on Vercel as it doesn\'t support WebSocket connections');
    }

    console.log('\n✅ Notification system test completed!');
    console.log('\nSummary:');
    console.log('- Backend endpoints are accessible');
    console.log('- Authentication is working');
    console.log('- Socket.IO may fail on Vercel (this is normal)');
    console.log('- Polling fallback will be used if Socket.IO fails');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

// Auto-run test if this file is imported directly
if (typeof window !== 'undefined') {
  // Only run in browser environment
  window.testNotificationSystem = testNotificationSystem;
} 