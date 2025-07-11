const axios = require('axios');

const BASE_URL = 'https://hope-for-paws-official-backend.vercel.app';

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to test endpoint with delay
const testEndpoint = async (name, url, options = {}) => {
  console.log(`Testing ${name}...`);
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      ...options
    });
    console.log(`✅ ${name} passed: ${response.status}`);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    console.log(`❌ ${name} failed: ${error.response?.status || 'Network Error'}`);
    if (error.response?.data) {
      console.log(`   Error data: ${JSON.stringify(error.response.data)}`);
    }
    return { success: false, error: error.message };
  }
};

const testDeployment = async () => {
  console.log('Testing backend deployment (with delays)...\n');

  // Test endpoints with 2-second delays between requests
  const tests = [
    { name: 'Root endpoint', url: `${BASE_URL}/` },
    { name: 'Health check', url: `${BASE_URL}/health` },
    { name: 'Socket health', url: `${BASE_URL}/socket-health` },
    { name: 'Notification test endpoint', url: `${BASE_URL}/api/notifications/test` },
    { name: 'API endpoint', url: `${BASE_URL}/api` },
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url);
    results.push({ ...test, ...result });
    
    // Wait 2 seconds between requests to avoid rate limiting
    if (test !== tests[tests.length - 1]) {
      console.log('Waiting 2 seconds before next test...\n');
      await wait(2000);
    }
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.success ? 'PASSED' : 'FAILED'}`);
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Backend is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the backend deployment.');
  }
};

testDeployment().catch(console.error); 