// Test script to check backend connectivity
const API_BASE_URL = 'https://hope-for-paws-official-backend.vercel.app';

async function testBackend() {
  console.log('Testing backend connectivity...\n');

  const endpoints = [
    '/',
    '/health',
    '/api',
    '/api/cors-test',
    '/api/adoptions/test'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5173'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint}: Success`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Data:`, data);
      } else {
        console.log(`❌ ${endpoint}: Failed`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Status Text: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: Error`);
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  // Test CORS preflight
  console.log('Testing CORS preflight...');
  try {
    const preflightResponse = await fetch(`${API_BASE_URL}/api/adoptions`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });

    console.log(`CORS Preflight Status: ${preflightResponse.status}`);
    console.log(`CORS Headers:`, {
      'Access-Control-Allow-Origin': preflightResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': preflightResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': preflightResponse.headers.get('Access-Control-Allow-Headers')
    });
  } catch (error) {
    console.log(`CORS Preflight Error: ${error.message}`);
  }
}

testBackend(); 