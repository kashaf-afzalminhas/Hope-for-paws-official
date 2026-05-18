/**
 * Security & RBAC Test Script for Hope For Paws
 * Tests: Login/Token, Role-Based Access, Seller Approval Logic
 * Usage: node scripts/testSecurityRBAC.js
 */
const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');

const BASE = 'http://localhost:3000';
const results = [];
const PASS = '✅ PASS';
const FAIL = '❌ FAIL';
const WARN = '⚠️  WARN';

// ─── Test Credentials ───
const TEST_USERS = {
  regularUser: { email: 'testuser_rbac@gmail.com', password: 'Test1234!', username: 'TestUserRBAC' },
  vet: { email: 'testvet_rbac@gmail.com', password: 'Test1234!', username: 'TestVetRBAC' },
  sellerPending: { email: 'testsellerpending_rbac@gmail.com', password: 'Test1234!', username: 'TestSellerPending' },
  sellerVerified: { email: 'testsellerverified_rbac@gmail.com', password: 'Test1234!', username: 'TestSellerVerified' },
  admin: { email: 'kashafafzal909@gmail.com', password: 'Hope4PawsAdmin2024!' },
};

// ─── Helpers ───
function record(phase, test, status, detail = '') {
  results.push({ phase, test, status, detail });
  const icon = status === PASS ? PASS : status === FAIL ? FAIL : WARN;
  console.log(`  ${icon} [${phase}] ${test}${detail ? ' — ' + detail : ''}`);
}

async function api(method, path, data = null, token = null) {
  const headers = {};
  if (data !== null) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const config = { method, url: `${BASE}${path}`, headers, validateStatus: () => true };
    if (data !== null) config.data = data;
    const res = await axios(config);
    return { status: res.status, data: res.data };
  } catch (e) {
    return { status: 0, data: { error: e.message } };
  }
}

function decodeToken(token) {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  } catch { return null; }
}

// ─── Setup: Create Test Users Directly in DB ───
async function setupTestUsers() {
  console.log('\n🔧 Setting up test users in database...\n');
  await mongoose.connect(process.env.MONGO_URI);
  const hashed = await bcrypt.hash('Test1234!', 10);

  // Regular User
  await User.deleteOne({ email: TEST_USERS.regularUser.email });
  const u1 = await User.create({
    username: 'TestUserRBAC', email: TEST_USERS.regularUser.email, password: hashed,
    isVeterinarian: false, isSeller: false, isAdmin: false, phone: '+921234567891',
    phoneVerified: true, authProviders: [{ provider: 'local' }]
  });
  console.log(`  Created: Regular User (${u1.email})`);

  // Vet
  await User.deleteOne({ email: TEST_USERS.vet.email });
  const u2 = await User.create({
    username: 'TestVetRBAC', email: TEST_USERS.vet.email, password: hashed,
    isVeterinarian: true, isSeller: false, isAdmin: false, phone: '+921234567892',
    phoneVerified: true, authProviders: [{ provider: 'local' }]
  });
  console.log(`  Created: Veterinarian (${u2.email})`);

  // Seller (Pending)
  await Seller.deleteOne({ userId: (await User.findOne({ email: TEST_USERS.sellerPending.email }))?._id });
  await User.deleteOne({ email: TEST_USERS.sellerPending.email });
  const u3 = await User.create({
    username: 'TestSellerPending', email: TEST_USERS.sellerPending.email, password: hashed,
    isVeterinarian: false, isSeller: true, sellerStatus: 'pending', isAdmin: false,
    phone: '+921234567893', phoneVerified: true, canBuy: false,
    authProviders: [{ provider: 'local' }]
  });
  await Seller.create({ userId: u3._id, name: 'Pending Store', email: u3.email, cnic: '12345-1234567-1', location: 'Lahore', status: 'pending' });
  console.log(`  Created: Seller Pending (${u3.email})`);

  // Seller (Verified)
  await Seller.deleteOne({ userId: (await User.findOne({ email: TEST_USERS.sellerVerified.email }))?._id });
  await User.deleteOne({ email: TEST_USERS.sellerVerified.email });
  const u4 = await User.create({
    username: 'TestSellerVerified', email: TEST_USERS.sellerVerified.email, password: hashed,
    isVeterinarian: false, isSeller: true, sellerStatus: 'verified', isAdmin: false,
    phone: '+921234567894', phoneVerified: true, canBuy: true,
    authProviders: [{ provider: 'local' }]
  });
  await Seller.create({ userId: u4._id, name: 'Verified Store', email: u4.email, cnic: '12345-1234567-2', location: 'Karachi', status: 'verified' });
  console.log(`  Created: Seller Verified (${u4.email})`);

  // Admin — just ensure it exists
  let admin = await User.findOne({ email: TEST_USERS.admin.email });
  if (!admin) {
    admin = await User.create({
      username: 'kashafafzal909', email: TEST_USERS.admin.email,
      password: await bcrypt.hash(TEST_USERS.admin.password, 10),
      isAdmin: true, isVeterinarian: false, isSeller: false,
      authProviders: [{ provider: 'local' }]
    });
    console.log(`  Created: Admin (${admin.email})`);
  } else {
    admin.isAdmin = true;
    admin.password = await bcrypt.hash(TEST_USERS.admin.password, 10);
    await admin.save();
    console.log(`  Updated: Admin (${admin.email})`);
  }

  return { regularUser: u1, vet: u2, sellerPending: u3, sellerVerified: u4, admin };
}

// ─── Cleanup ───
async function cleanupTestUsers() {
  console.log('\n🧹 Cleaning up test users...');
  for (const key of ['regularUser', 'vet', 'sellerPending', 'sellerVerified']) {
    const email = TEST_USERS[key].email;
    const user = await User.findOne({ email });
    if (user) {
      await Seller.deleteMany({ userId: user._id });
      await Product.deleteMany({ sellerId: { $in: (await Seller.find({ userId: user._id })).map(s => s._id) } });
      await User.deleteOne({ email });
    }
  }
  console.log('  Done.\n');
}

// ═══════════════════════════════════════════
// PHASE 1: LOGIN & TOKEN GENERATION
// ═══════════════════════════════════════════
async function phase1_loginAndTokens(tokens) {
  console.log('\n' + '═'.repeat(60));
  console.log('  PHASE 1: LOGIN & TOKEN GENERATION');
  console.log('═'.repeat(60));

  // 1.1 Regular User Login
  let res = await api('post', '/auth/signin', { email: TEST_USERS.regularUser.email, password: TEST_USERS.regularUser.password });
  if (res.status === 200 && res.data.token) {
    tokens.user = res.data.token;
    const d = decodeToken(tokens.user);
    const hasRole = d && d.id && d.isSeller === false && d.isVeterinarian === false;
    record('P1', '1.1 Regular User Login', hasRole ? PASS : FAIL,
      hasRole ? 'Token has correct role flags' : `Unexpected payload: ${JSON.stringify(d)}`);
    // Check no isAdmin in token
    if (d && d.isAdmin !== undefined) {
      record('P1', '1.1b isAdmin in JWT', WARN, 'isAdmin found in JWT — should be DB-only');
    } else {
      record('P1', '1.1b isAdmin NOT in JWT', PASS, 'Admin flag correctly absent from token');
    }
  } else {
    record('P1', '1.1 Regular User Login', FAIL, `Status ${res.status}: ${JSON.stringify(res.data)}`);
  }

  // 1.2 Vet Login
  res = await api('post', '/auth/signin', { email: TEST_USERS.vet.email, password: TEST_USERS.vet.password });
  if (res.status === 200 && res.data.token) {
    tokens.vet = res.data.token;
    const d = decodeToken(tokens.vet);
    record('P1', '1.2 Vet Login', d?.isVeterinarian === true ? PASS : FAIL,
      `isVeterinarian=${d?.isVeterinarian}`);
  } else {
    record('P1', '1.2 Vet Login', FAIL, `Status ${res.status}`);
  }

  // 1.3 Seller Pending Login
  res = await api('post', '/auth/signin', { email: TEST_USERS.sellerPending.email, password: TEST_USERS.sellerPending.password });
  if (res.status === 200 && res.data.token) {
    tokens.sellerPending = res.data.token;
    const d = decodeToken(tokens.sellerPending);
    const userObj = res.data.user;
    record('P1', '1.3 Seller Pending Login', d?.isSeller === true ? PASS : FAIL, `isSeller=${d?.isSeller}`);
    record('P1', '1.3b sellerStatus in response', userObj?.sellerStatus === 'pending' ? PASS : FAIL,
      `sellerStatus=${userObj?.sellerStatus}`);
  } else {
    record('P1', '1.3 Seller Pending Login', FAIL, `Status ${res.status}`);
  }

  // 1.4 Seller Verified Login
  res = await api('post', '/auth/signin', { email: TEST_USERS.sellerVerified.email, password: TEST_USERS.sellerVerified.password });
  if (res.status === 200 && res.data.token) {
    tokens.sellerVerified = res.data.token;
    const userObj = res.data.user;
    record('P1', '1.4 Seller Verified Login', userObj?.sellerStatus === 'verified' ? PASS : FAIL,
      `sellerStatus=${userObj?.sellerStatus}`);
  } else {
    record('P1', '1.4 Seller Verified Login', FAIL, `Status ${res.status}`);
  }

  // 1.5 Admin Login
  res = await api('post', '/auth/signin', { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password });
  if (res.status === 200 && res.data.token) {
    tokens.admin = res.data.token;
    const d = decodeToken(tokens.admin);
    const userObj = res.data.user;
    record('P1', '1.5 Admin Login', userObj?.isAdmin === true ? PASS : FAIL,
      `user.isAdmin=${userObj?.isAdmin}`);
    record('P1', '1.5b Admin isAdmin in JWT?', d?.isAdmin === undefined ? PASS : WARN,
      d?.isAdmin !== undefined ? 'isAdmin leaked into JWT' : 'Correctly absent');
  } else {
    record('P1', '1.5 Admin Login', FAIL, `Status ${res.status}: ${JSON.stringify(res.data)}`);
  }

  // 1.6 Token Expiry Check
  for (const [role, tok] of Object.entries(tokens)) {
    if (!tok) continue;
    const d = decodeToken(tok);
    if (d?.exp) {
      const daysUntilExpiry = (d.exp - d.iat) / 86400;
      record('P1', `1.6 Token Expiry (${role})`, Math.abs(daysUntilExpiry - 5) < 0.1 ? PASS : WARN,
        `Expires in ${daysUntilExpiry.toFixed(1)} days`);
    }
  }

  // 1.7 Invalid Credentials
  res = await api('post', '/auth/signin', { email: TEST_USERS.regularUser.email, password: 'WrongPassword!' });
  record('P1', '1.7 Invalid Credentials', res.status === 400 ? PASS : FAIL, `Status ${res.status}`);

  // 1.8 No Token
  res = await api('get', '/auth/user/validate');
  record('P1', '1.8 No Token → 401', res.status === 401 ? PASS : FAIL, `Status ${res.status}`);

  // 1.9 Tampered Token
  res = await api('get', '/auth/user/validate', null, 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImZha2UifQ.invalid');
  record('P1', '1.9 Tampered Token → 401', res.status === 401 ? PASS : FAIL, `Status ${res.status}`);

  // 1.10 Password not in response
  res = await api('post', '/auth/signin', { email: TEST_USERS.regularUser.email, password: TEST_USERS.regularUser.password });
  const hasPassword = res.data?.user?.password !== undefined;
  record('P1', '1.10 Password NOT in response', !hasPassword ? PASS : FAIL,
    hasPassword ? 'PASSWORD LEAKED IN RESPONSE!' : 'Correctly stripped');
}

// ═══════════════════════════════════════════
// PHASE 2: ROLE-BASED ACCESS CONTROL
// ═══════════════════════════════════════════
async function phase2_rbac(tokens) {
  console.log('\n' + '═'.repeat(60));
  console.log('  PHASE 2: ROLE-BASED ACCESS CONTROL');
  console.log('═'.repeat(60));

  // 2A: Admin Routes — User token should get 403
  const adminRoutes = [
    ['get', '/api/admin/users', '2.1'],
    ['get', '/api/admin/users-with-stats', '2.2'],
    ['get', '/api/admin/adoptions', '2.3'],
    ['get', '/api/admin/posts', '2.4'],
    ['get', '/api/admin/comments', '2.5'],
    ['get', '/api/admin/adoption-requests', '2.6'],
  ];

  for (const [method, route, num] of adminRoutes) {
    // User token → should be blocked
    let res = await api(method, route, null, tokens.user);
    record('P2', `${num} User→${route}`, res.status === 403 ? PASS : FAIL,
      `Expected 403, got ${res.status}`);

    // Admin token → should succeed
    res = await api(method, route, null, tokens.admin);
    record('P2', `${num}b Admin→${route}`, res.status === 200 ? PASS : FAIL,
      `Expected 200, got ${res.status}`);
  }

  // 2A-extra: No token at all on admin routes
  let res = await api('get', '/api/admin/users');
  record('P2', '2.7 No Token→/api/admin/users', res.status === 401 ? PASS : FAIL,
    `Expected 401, got ${res.status}`);

  // 2B: Seller-Admin Routes
  res = await api('get', '/api/sellers/admin/all', null, tokens.user);
  record('P2', '2.8 User→/api/sellers/admin/all', res.status === 403 ? PASS : FAIL,
    `Expected 403, got ${res.status}`);

  res = await api('get', '/api/sellers/admin/all', null, tokens.admin);
  record('P2', '2.8b Admin→/api/sellers/admin/all', res.status === 200 ? PASS : FAIL,
    `Expected 200, got ${res.status}`);

  // 2C: Seller-Only Routes
  // Regular user → create product → should fail
  res = await api('post', '/api/products', { title: 'Hack', price: 1, category: 'test' }, tokens.user);
  record('P2', '2.9 User→POST /api/products', res.status === 403 ? PASS : FAIL,
    `Expected 403, got ${res.status} — ${res.data?.message}`);

  // Regular user → list my products → should fail (no seller profile)
  res = await api('get', '/api/products/mine', null, tokens.user);
  record('P2', '2.10 User→GET /products/mine', res.status === 404 ? PASS : FAIL,
    `Expected 404, got ${res.status}`);

  // 2D: Cross-Role Escalation
  // Seller → admin routes
  res = await api('get', '/api/admin/users', null, tokens.sellerVerified);
  record('P2', '2.11 Seller→admin routes', res.status === 403 ? PASS : FAIL,
    `Expected 403, got ${res.status}`);

  // Vet → create product
  res = await api('post', '/api/products', { title: 'VetHack', price: 1, category: 'test' }, tokens.vet);
  record('P2', '2.12 Vet→POST /api/products', res.status === 403 ? PASS : FAIL,
    `Expected 403, got ${res.status}`);

  // User → seller profile (should 404, not 200)
  res = await api('get', '/api/sellers/me', null, tokens.user);
  record('P2', '2.13 User→GET /sellers/me', res.status === 404 ? PASS : FAIL,
    `Expected 404, got ${res.status}`);

  // Seller → seller admin route (should 403, not 200)
  res = await api('get', '/api/sellers/admin/all', null, tokens.sellerVerified);
  record('P2', '2.14 Seller→seller admin route', res.status === 403 ? PASS : FAIL,
    `Expected 403, got ${res.status}`);

  // Vet → admin routes
  res = await api('get', '/api/admin/users', null, tokens.vet);
  record('P2', '2.15 Vet→admin routes', res.status === 403 ? PASS : FAIL,
    `Expected 403, got ${res.status}`);
}

// ═══════════════════════════════════════════
// PHASE 3: SELLER APPROVAL LOGIC
// ═══════════════════════════════════════════
async function phase3_approvalLogic(tokens, dbUsers) {
  console.log('\n' + '═'.repeat(60));
  console.log('  PHASE 3: SELLER APPROVAL LOGIC');
  console.log('═'.repeat(60));

  // 3.1 Pending seller → create product → should be blocked
  let res = await api('post', '/api/products',
    { title: 'Pending Product', price: 100, category: 'Pet Food' }, tokens.sellerPending);
  record('P3', '3.1 Pending Seller→Create Product', res.status === 403 ? PASS : FAIL,
    `Expected 403, got ${res.status} — ${res.data?.message}`);

  // 3.2 Verified seller → create product → should succeed
  res = await api('post', '/api/products',
    { title: 'Test Product RBAC', price: 50, category: 'Pet Toys', description: 'Test' }, tokens.sellerVerified);
  const createdProductId = res.data?.product?._id;
  record('P3', '3.2 Verified Seller→Create Product', res.status === 201 ? PASS : FAIL,
    `Expected 201, got ${res.status}`);

  // 3.3 Pending seller → GET /sellers/me → should work (by design)
  res = await api('get', '/api/sellers/me', null, tokens.sellerPending);
  record('P3', '3.3 Pending Seller→GET /sellers/me', res.status === 200 ? PASS : FAIL,
    `Expected 200, got ${res.status} — status=${res.data?.seller?.status}`);

  // 3.4 Admin approves pending seller
  const pendingUserId = dbUsers.sellerPending._id.toString();
  res = await api('patch', `/api/sellers/status/${pendingUserId}`,
    { status: 'verified' }, tokens.admin);
  record('P3', '3.4 Admin→Verify Pending Seller', res.status === 200 ? PASS : FAIL,
    `Expected 200, got ${res.status} — ${res.data?.message}`);

  // 3.5 After verification, re-login and try creating product
  res = await api('post', '/auth/signin',
    { email: TEST_USERS.sellerPending.email, password: TEST_USERS.sellerPending.password });
  if (res.status === 200) {
    tokens.sellerPending = res.data.token; // refresh token
    record('P3', '3.5a Re-login after verify', PASS, `sellerStatus=${res.data.user?.sellerStatus}`);

    res = await api('post', '/api/products',
      { title: 'Now Verified Product', price: 75, category: 'Pet Food' }, tokens.sellerPending);
    record('P3', '3.5b Newly Verified→Create Product', res.status === 201 ? PASS : FAIL,
      `Expected 201, got ${res.status}`);
    // Cleanup this product
    if (res.data?.product?._id) {
      await api('delete', `/api/products/${res.data.product._id}`, null, tokens.sellerPending);
    }
  } else {
    record('P3', '3.5 Re-login after verify', FAIL, `Status ${res.status}`);
  }

  // 3.6 Admin suspends the verified seller
  const verifiedUserId = dbUsers.sellerVerified._id.toString();
  res = await api('patch', `/api/sellers/status/${verifiedUserId}`,
    { status: 'suspended', notes: 'Test suspension' }, tokens.admin);
  record('P3', '3.6 Admin→Suspend Seller', res.status === 200 ? PASS : FAIL,
    `Expected 200, got ${res.status}`);

  // 3.7 Suspended seller → create product → should be blocked
  // Need fresh token
  res = await api('post', '/auth/signin',
    { email: TEST_USERS.sellerVerified.email, password: TEST_USERS.sellerVerified.password });
  if (res.status === 200) {
    tokens.sellerVerified = res.data.token;
    res = await api('post', '/api/products',
      { title: 'Suspended Product', price: 10, category: 'Pet Food' }, tokens.sellerVerified);
    record('P3', '3.7 Suspended Seller→Create Product', res.status === 403 ? PASS : FAIL,
      `Expected 403, got ${res.status} — ${res.data?.message}`);
  }

  // 3.8 Verify products were hidden after suspension
  if (createdProductId) {
    const product = await Product.findById(createdProductId);
    record('P3', '3.8 Products hidden after suspension',
      product && product.isVisible === false ? PASS : FAIL,
      `isVisible=${product?.isVisible}, status=${product?.status}`);
  }

  // 3.9 Admin restores seller back to verified
  res = await api('patch', `/api/sellers/status/${verifiedUserId}`,
    { status: 'verified' }, tokens.admin);
  record('P3', '3.9 Admin→Restore Seller', res.status === 200 ? PASS : FAIL, 'Restored for cleanup');

  // 3.10 Non-admin tries to change seller status → should fail
  res = await api('patch', `/api/sellers/status/${pendingUserId}`,
    { status: 'verified' }, tokens.user);
  record('P3', '3.10 User→Change Seller Status', res.status === 403 ? PASS : FAIL,
    `Expected 403, got ${res.status}`);

  // Cleanup created product
  if (createdProductId) {
    await Product.deleteOne({ _id: createdProductId });
  }
}

// ═══════════════════════════════════════════
// REPORT
// ═══════════════════════════════════════════
function printReport() {
  console.log('\n' + '═'.repeat(60));
  console.log('  📊 FINAL SECURITY TEST REPORT');
  console.log('═'.repeat(60));

  const passed = results.filter(r => r.status === PASS).length;
  const failed = results.filter(r => r.status === FAIL).length;
  const warned = results.filter(r => r.status === WARN).length;
  const total = results.length;

  console.log(`\n  Total: ${total}  |  ${PASS}: ${passed}  |  ${FAIL}: ${failed}  |  ${WARN}: ${warned}\n`);

  if (failed > 0) {
    console.log('  ┌─────────────────────────────────────────────────────┐');
    console.log('  │              FAILED TESTS                          │');
    console.log('  └─────────────────────────────────────────────────────┘');
    results.filter(r => r.status === FAIL).forEach(r => {
      console.log(`  ${FAIL} [${r.phase}] ${r.test}`);
      console.log(`      Detail: ${r.detail}`);
    });
  }

  if (warned > 0) {
    console.log('\n  ┌─────────────────────────────────────────────────────┐');
    console.log('  │              WARNINGS                               │');
    console.log('  └─────────────────────────────────────────────────────┘');
    results.filter(r => r.status === WARN).forEach(r => {
      console.log(`  ${WARN} [${r.phase}] ${r.test}`);
      console.log(`      Detail: ${r.detail}`);
    });
  }

  console.log('\n  ┌─────────────────────────────────────────────────────┐');
  console.log('  │              BY PHASE                                │');
  console.log('  └─────────────────────────────────────────────────────┘');
  for (const phase of ['P1', 'P2', 'P3']) {
    const pr = results.filter(r => r.phase === phase);
    const pp = pr.filter(r => r.status === PASS).length;
    const pf = pr.filter(r => r.status === FAIL).length;
    const pw = pr.filter(r => r.status === WARN).length;
    const label = phase === 'P1' ? 'Login & Tokens' : phase === 'P2' ? 'RBAC' : 'Seller Approval';
    console.log(`  ${label}: ${pp}/${pr.length} passed${pf > 0 ? `, ${pf} FAILED` : ''}${pw > 0 ? `, ${pw} warnings` : ''}`);
  }

  console.log('\n' + '═'.repeat(60));
  if (failed === 0) {
    console.log('  🎉 ALL SECURITY TESTS PASSED!');
  } else {
    console.log(`  🚨 ${failed} SECURITY TEST(S) FAILED — SEE DETAILS ABOVE`);
  }
  console.log('═'.repeat(60) + '\n');
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════
async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  🔒 HOPE FOR PAWS — SECURITY & RBAC TEST SUITE');
  console.log('═'.repeat(60));

  const tokens = {};
  let dbUsers;

  try {
    // Setup
    dbUsers = await setupTestUsers();

    // Run Phases
    await phase1_loginAndTokens(tokens);
    await phase2_rbac(tokens);
    await phase3_approvalLogic(tokens, dbUsers);

    // Report
    printReport();

  } catch (err) {
    console.error('\n💥 FATAL ERROR:', err.message);
    console.error(err.stack);
  } finally {
    // Cleanup
    await cleanupTestUsers();
    await mongoose.disconnect();
    console.log('Database disconnected. Done.\n');
  }
}

main();
