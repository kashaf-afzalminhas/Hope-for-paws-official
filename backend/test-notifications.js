const axios = require('axios');

const API_BASE_URL = 'https://hope-for-paws-official-backend.vercel.app';

async function testNotificationEndpoints() {
  console.log('Testing notification endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health endpoint working:', healthResponse.data);

    // Test socket health endpoint
    console.log('\n2. Testing socket health endpoint...');
    const socketHealthResponse = await axios.get(`${API_BASE_URL}/socket-health`);
    console.log('✅ Socket health endpoint working:', socketHealthResponse.data);

    // Test notification endpoint without auth (should return 401)
    console.log('\n3. Testing notification endpoint without auth...');
    try {
      await axios.get(`${API_BASE_URL}/api/notifications`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Notification endpoint properly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test unread count endpoint without auth (should return 401)
    console.log('\n4. Testing unread count endpoint without auth...');
    try {
      await axios.get(`${API_BASE_URL}/api/notifications/unread-count`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Unread count endpoint properly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    console.log('\n✅ All basic endpoint tests completed successfully!');
    console.log('\nNote: Socket.IO connections cannot be tested from this script as they require a real client connection.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testNotificationEndpoints(); 