const axios = require('axios');

// Test CORS with different origins
const testOrigins = [
  'https://www.hopeforpaws.club',
  'http://localhost:5173',
  'http://localhost:3000'
];

const testCORS = async () => {
  console.log('🧪 Testing CORS Configuration...\n');
  
  for (const origin of testOrigins) {
    try {
      console.log(`Testing origin: ${origin}`);
      
      const response = await axios.get('https://hope-for-paws-official-backend.vercel.app/api/test-cors', {
        headers: {
          'Origin': origin,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Success for ${origin}`);
      console.log(`Response:`, response.data);
      console.log(`CORS Headers:`, {
        'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
        'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': response.headers['access-control-allow-headers']
      });
      
    } catch (error) {
      console.log(`❌ Failed for ${origin}`);
      console.log(`Error:`, error.response?.data || error.message);
    }
    
    console.log('---\n');
  }
  
  // Test preflight request
  try {
    console.log('Testing preflight request...');
    const preflightResponse = await axios.options('https://hope-for-paws-official-backend.vercel.app/api/test-cors', {
      headers: {
        'Origin': 'https://www.hopeforpaws.club',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('✅ Preflight request successful');
    console.log('Status:', preflightResponse.status);
    console.log('Headers:', preflightResponse.headers);
    
  } catch (error) {
    console.log('❌ Preflight request failed');
    console.log('Error:', error.response?.data || error.message);
  }
};

testCORS(); 