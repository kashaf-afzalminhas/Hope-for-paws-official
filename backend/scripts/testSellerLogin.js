const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test configuration
const TEST_USER = {
  username: `test_seller_${Date.now()}`,
  email: `testseller${Date.now()}@gmail.com`,
  password: 'Test123!@#',
  phone: '+1234567890'
};

const TEST_SELLER = {
  name: 'Test Seller',
  email: TEST_USER.email,
  cnic: '12345-1234567-1',
  location: 'Lahore, Pakistan'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`TEST: ${testName}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(name, passed, details = '') {
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
    logSuccess(`${name} - PASSED`);
  } else {
    results.failed++;
    logError(`${name} - FAILED`);
    if (details) logError(`   Details: ${details}`);
  }
}

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = null) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test 1: Check server health
async function testServerHealth() {
  logTest('1. Server Health Check');
  
  const result = await apiRequest('GET', '/health');
  
  if (result.success && result.data.status === 'OK') {
    recordTest('Server Health Check', true);
    logInfo(`Server uptime: ${result.data.uptime}s`);
    return true;
  } else {
    recordTest('Server Health Check', false, result.error?.message || 'Server not responding');
    return false;
  }
}

// Test 2: Register a new user
let authToken = null;
let userId = null;

async function testUserRegistration() {
  logTest('2. User Registration');
  
  const result = await apiRequest('POST', '/auth/register', TEST_USER);
  
  if (result.success && result.data.message?.includes('OTP')) {
    recordTest('User Registration', true);
    logInfo(`User registered: ${TEST_USER.email}`);
    logInfo('Note: OTP verification skipped for testing (using direct DB setup)');
    return true;
  } else {
    // User might already exist, try to login instead
    if (result.error?.message?.includes('already exists')) {
      logInfo('User already exists, will test login instead');
      return true;
    }
    recordTest('User Registration', false, result.error?.message || 'Registration failed');
    return false;
  }
}

// Test 3: Direct user creation (bypass OTP for testing)
async function createTestUserDirectly() {
  logTest('3. Creating Test User (Direct DB)');
  
  const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');
  const User = require('../models/User');
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logInfo('Connected to MongoDB');
    
    // Check if user exists
    let user = await User.findOne({ email: TEST_USER.email });
    
    if (!user) {
      const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);
      user = await User.create({
        username: TEST_USER.username,
        email: TEST_USER.email,
        password: hashedPassword,
        phone: TEST_USER.phone,
        phoneVerified: true,
        isVeterinarian: false
      });
      logSuccess(`Created user: ${user.email}`);
    } else {
      logInfo(`User already exists: ${user.email}`);
      // Update password in case it changed
      const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);
      user.password = hashedPassword;
      await user.save();
    }
    
    userId = user._id.toString();
    await mongoose.disconnect();
    recordTest('Create Test User', true);
    return true;
  } catch (error) {
    recordTest('Create Test User', false, error.message);
    return false;
  }
}

// Test 4: Login as regular user (before seller application)
async function testRegularLogin() {
  logTest('4. Regular User Login (Before Seller Application)');
  
  const result = await apiRequest('POST', '/auth/signin', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  if (result.success && result.data.token) {
    authToken = result.data.token;
    recordTest('Regular User Login', true);
    
    // Verify seller fields are present
    const user = result.data.user;
    const hasSellerFields = 'isSeller' in user && 'sellerStatus' in user && 'canBuy' in user;
    recordTest('Login Response Has Seller Fields', hasSellerFields);
    
    // Verify user is NOT a seller yet
    const isNotSeller = user.isSeller === false;
    recordTest('User is NOT a seller yet', isNotSeller);
    
    logInfo(`Token received: ${authToken.substring(0, 20)}...`);
    logInfo(`isSeller: ${user.isSeller}`);
    logInfo(`sellerStatus: ${user.sellerStatus || 'null'}`);
    logInfo(`canBuy: ${user.canBuy}`);
    
    return true;
  } else {
    recordTest('Regular User Login', false, result.error?.message || 'Login failed');
    return false;
  }
}

// Test 5: Apply as seller
async function testApplyAsSeller() {
  logTest('5. Apply as Seller');
  
  if (!authToken) {
    recordTest('Apply as Seller', false, 'No auth token available');
    return false;
  }
  
  const result = await apiRequest('POST', '/api/sellers/apply', TEST_SELLER, authToken);
  
  if (result.success && result.data.seller) {
    recordTest('Apply as Seller', true);
    logInfo(`Seller application submitted`);
    logInfo(`Seller status: ${result.data.seller.status}`);
    return true;
  } else {
    if (result.error?.message?.includes('already exists')) {
      logInfo('Seller profile already exists (will continue testing)');
      recordTest('Apply as Seller', true, 'Already exists');
      return true;
    }
    recordTest('Apply as Seller', false, result.error?.message || 'Application failed');
    return false;
  }
}

// Test 6: Login as seller (after application)
async function testSellerLogin() {
  logTest('6. Seller Login (After Application)');
  
  const result = await apiRequest('POST', '/auth/signin', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  if (result.success && result.data.token) {
    authToken = result.data.token; // Update token
    recordTest('Seller Login', true);
    
    const user = result.data.user;
    
    // Verify seller fields
    const hasSellerFields = 'isSeller' in user && 'sellerStatus' in user && 'canBuy' in user;
    recordTest('Login Response Has Seller Fields', hasSellerFields);
    
    // Verify user IS a seller
    const isSeller = user.isSeller === true;
    recordTest('User is a seller', isSeller);
    
    // Verify seller status
    const hasValidStatus = ['pending', 'verified', 'suspended'].includes(user.sellerStatus);
    recordTest('Seller has valid status', hasValidStatus);
    
    // Verify canBuy is false for sellers
    const cannotBuy = user.canBuy === false;
    recordTest('Seller cannot buy (canBuy = false)', cannotBuy);
    
    logInfo(`Token: ${authToken.substring(0, 20)}...`);
    logInfo(`isSeller: ${user.isSeller}`);
    logInfo(`sellerStatus: ${user.sellerStatus}`);
    logInfo(`canBuy: ${user.canBuy}`);
    
    return true;
  } else {
    recordTest('Seller Login', false, result.error?.message || 'Login failed');
    return false;
  }
}

// Test 7: Get seller profile
async function testGetSellerProfile() {
  logTest('7. Get Seller Profile');
  
  if (!authToken) {
    recordTest('Get Seller Profile', false, 'No auth token available');
    return false;
  }
  
  const result = await apiRequest('GET', '/api/sellers/me', null, authToken);
  
  if (result.success && result.data.seller) {
    recordTest('Get Seller Profile', true);
    logInfo(`Seller name: ${result.data.seller.name}`);
    logInfo(`Seller status: ${result.data.seller.status}`);
    logInfo(`User sellerStatus: ${result.data.sellerStatus}`);
    logInfo(`User isSeller: ${result.data.isSeller}`);
    logInfo(`User canBuy: ${result.data.canBuy}`);
    return true;
  } else {
    recordTest('Get Seller Profile', false, result.error?.message || 'Failed to get profile');
    return false;
  }
}

// Test 8: Verify login response structure
async function testLoginResponseStructure() {
  logTest('8. Login Response Structure Validation');
  
  const result = await apiRequest('POST', '/auth/signin', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  if (result.success) {
    const user = result.data.user;
    const requiredFields = ['id', 'email', 'username', 'isSeller', 'sellerStatus', 'canBuy'];
    const missingFields = requiredFields.filter(field => !(field in user));
    
    if (missingFields.length === 0) {
      recordTest('Login Response Structure', true);
      logInfo('All required fields present in login response');
      return true;
    } else {
      recordTest('Login Response Structure', false, `Missing fields: ${missingFields.join(', ')}`);
      return false;
    }
  } else {
    recordTest('Login Response Structure', false, 'Login failed');
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('SELLER LOGIN TEST SUITE', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Base URL: ${BASE_URL}`, 'blue');
  log(`Test User: ${TEST_USER.email}`, 'blue');
  log('='.repeat(60) + '\n', 'cyan');
  
  try {
    // Run tests in sequence
    await testServerHealth();
    await testUserRegistration();
    await createTestUserDirectly();
    await testRegularLogin();
    await testApplyAsSeller();
    await testSellerLogin();
    await testGetSellerProfile();
    await testLoginResponseStructure();
    
    // Print summary
    log('\n' + '='.repeat(60), 'cyan');
    log('TEST SUMMARY', 'cyan');
    log('='.repeat(60), 'cyan');
    log(`Total Tests: ${results.tests.length}`, 'blue');
    log(`Passed: ${results.passed}`, 'green');
    log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    log('='.repeat(60), 'cyan');
    
    // Detailed results
    log('\nDetailed Results:', 'blue');
    results.tests.forEach((test, index) => {
      const status = test.passed ? '✅' : '❌';
      log(`${index + 1}. ${status} ${test.name}`, test.passed ? 'green' : 'red');
      if (test.details && !test.passed) {
        log(`   ${test.details}`, 'yellow');
      }
    });
    
    // Final verdict
    log('\n' + '='.repeat(60), 'cyan');
    if (results.failed === 0) {
      log('🎉 ALL TESTS PASSED!', 'green');
      log('Seller login functionality is working correctly.', 'green');
    } else {
      log('⚠️  SOME TESTS FAILED', 'yellow');
      log('Please review the failed tests above.', 'yellow');
    }
    log('='.repeat(60) + '\n', 'cyan');
    
    process.exit(results.failed === 0 ? 0 : 1);
  } catch (error) {
    logError(`Test suite error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
