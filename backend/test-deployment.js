const axios = require('axios');

const BASE_URL = 'https://hope-for-paws-official-backend.vercel.app';

async function testDeployment() {
  console.log('Testing backend deployment...\n');

  const endpoints = [
    { path: '/', name: 'Root endpoint' },
    { path: '/health', name: 'Health check' },
    { path: '/socket-health', name: 'Socket health' },
    { path: '/api/notifications/test', name: 'Notification test endpoint' },
    { path: '/api', name: 'API endpoint' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const response = await axios.get(`${BASE_URL}${endpoint.path}`, {
        timeout: 10000
      });
      console.log(`✅ ${endpoint.name} working (${response.status})`);
      if (response.data) {
        console.log(`   Response:`, JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} failed:`, error.response?.status || error.message);
      if (error.response?.data) {
        console.log(`   Error data:`, JSON.stringify(error.response.data, null, 2));
      }
    }
    console.log('');
  }

  // Test notification endpoint without auth (should return 401)
  try {
    console.log('Testing notification endpoint without auth...');
    const response = await axios.get(`${BASE_URL}/api/notifications`, {
      timeout: 10000
    });
    console.log('❌ Notification endpoint should require auth but returned:', response.status);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Notification endpoint properly requires authentication');
    } else {
      console.log('❌ Unexpected error:', error.response?.status, error.message);
    }
  }
}

testDeployment(); 