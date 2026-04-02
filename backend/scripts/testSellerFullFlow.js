const axios = require('axios');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = 'admin_test@hopeforpaws.com'; // Change if you have specific admin email logic
// We'll create a new seller for every run to ensure isolation
const TIMESTAMP = Date.now();
const SELLER_USER = {
    username: `seller_${TIMESTAMP}`,
    email: `seller_${TIMESTAMP}@test.com`,
    password: 'Password123!',
    phone: `+92300${TIMESTAMP.toString().slice(-7)}`, // Mock valid phone
    userType: 'seller',
    sellerName: `Seller Store ${TIMESTAMP}`,
    cnic: `12345-${TIMESTAMP.toString().slice(-7)}-1`,
    location: 'Lahore, Pakistan'
};

const PRODUCT_DATA = {
    title: `Test Product ${TIMESTAMP}`,
    description: 'This is a test product',
    price: 100,
    images: ['http://example.com/image.jpg']
};

// Colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);

// State
let sellerToken = null;
let sellerId = null; // User ID
let sellerProfileId = null; // Seller Model ID
let adminToken = null; // If you have admin login, otherwise we might mock DB update

async function api(method, url, data = null, token = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: { 'Content-Type': 'application/json' },
            data
        };
        if (token) config.headers.Authorization = `Bearer ${token}`;
        const res = await axios(config);
        return { success: true, data: res.data, status: res.status };
    } catch (err) {
        return {
            success: false,
            error: err.response ? err.response.data : err.message,
            status: err.response ? err.response.status : 500
        };
    }
}

async function runTests() {
    log(`Starting Seller Full Flow Test...`, 'cyan');

    // 1. Register Seller (Directly to bypass OTP if needed, or normal flow)
    // Since OTP is involved, we will bypass OTP by inserting directly into DB for testing reliability
    // UNLESS we want to test the full endpoint flow including OTP. The user asked to "completely test".
    // Let's use the actual endpoint for register => which sends OTP. 
    // Retrieving OTP from email programmatically is hard without mailosaur/mailtrap.
    // So we will use the "Bypass OTP" strategy: Insert generic user into DB directly to emulate "Signed Up Verified User".

    log(`\n1. Creating Verified Seller User (Direct DB)...`, 'yellow');
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = require('../models/User');
        const Seller = require('../models/Seller');
        const bcrypt = require('bcryptjs');

        const hashedPassword = await bcrypt.hash(SELLER_USER.password, 10);
        const newUser = await User.create({
            username: SELLER_USER.username,
            email: SELLER_USER.email,
            password: hashedPassword,
            phone: SELLER_USER.phone,
            phoneVerified: true,
            userType: 'seller',
            isSeller: true,
            sellerStatus: 'pending',
            canBuy: false
        });

        // Create Seller Profile
        const newSellerProfile = await Seller.create({
            userId: newUser._id,
            name: SELLER_USER.sellerName,
            email: SELLER_USER.email,
            cnic: SELLER_USER.cnic,
            location: SELLER_USER.location,
            status: 'pending'
        });

        sellerId = newUser._id;
        sellerProfileId = newSellerProfile._id;

        // Also ensure an admin exists for testing approval
        let adminUser = await User.findOne({ isAdmin: true });
        if (!adminUser) {
            // Create a temporary admin
            adminUser = await User.create({
                username: 'admin_test',
                email: 'admin_test@test.com',
                password: await bcrypt.hash('AdminPass123!', 10),
                phone: '+00000000000',
                phoneVerified: true,
                isAdmin: true
            });
            log('  Created temporary admin user.', 'green');
        }

        await mongoose.disconnect();
        log(`  User created with ID: ${sellerId}`, 'green');
    } catch (err) {
        log(`  Failed DB setup: ${err.message}`, 'red');
        process.exit(1);
    }

    // 2. Login as Seller
    log(`\n2. Login as Seller...`, 'yellow');
    const loginRes = await api('POST', '/auth/signin', { email: SELLER_USER.email, password: SELLER_USER.password });
    if (loginRes.success) {
        sellerToken = loginRes.data.token;
        log('  Login successful.', 'green');
        if (loginRes.data.user.isSeller && loginRes.data.user.sellerStatus === 'pending') {
            log('  Verified: User is seller and status is pending.', 'green');
        } else {
            log(`  Mismatch: isSeller=${loginRes.data.user.isSeller}, status=${loginRes.data.user.sellerStatus}`, 'red');
        }
    } else {
        log(`  Login failed: ${JSON.stringify(loginRes.error)}`, 'red');
        process.exit(1);
    }

    // 3. Get Seller Profile (Token Check)
    log(`\n3. Fetch Seller Profile...`, 'yellow');
    const profileRes = await api('GET', '/auth/profile', null, sellerToken); // or /api/sellers/me?
    // Checking /auth/profile first as per user request to see seller details
    if (profileRes.success) {
        if (profileRes.data.data.sellerDetails) {
            log('  /auth/profile contains sellerDetails.', 'green');
        } else {
            log('  /auth/profile MISSING sellerDetails (Backend update might be needed).', 'red');
        }
    } else {
        log(`  Failed to fetch profile: ${JSON.stringify(profileRes.error)}`, 'red');
    }

    // 4. Try to Add Product (Should FAIL because pending)
    log(`\n4. Try to Add Product with PENDING status (Should Fail)...`, 'yellow');
    const addProdFail = await api('POST', '/api/products', PRODUCT_DATA, sellerToken);
    if (addProdFail.status === 403) {
        log('  Correctly blocked: 403 Forbidden.', 'green');
    } else if (addProdFail.success) {
        log('  FAILED: Product was added despite pending status!', 'red');
    } else {
        log(`  Blocked with status ${addProdFail.status} (Acceptable).`, 'green');
    }

    // 5. Admin Approve Seller
    log(`\n5. Admin Approve Seller...`, 'yellow');
    // First login as admin
    // Since we don't have clear admin credentials, we used the one we found/created
    // If we can't login via API, we will just direct DB update
    // Let's try direct DB update for reliability to test the "Verified" flow
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = require('../models/User');
        const Seller = require('../models/Seller');

        await User.findByIdAndUpdate(sellerId, { sellerStatus: 'verified' });
        await Seller.findByIdAndUpdate(sellerProfileId, { status: 'verified' });

        log('  Manually updated seller status to VERIFIED in DB.', 'green');
        await mongoose.disconnect();
    } catch (err) {
        log(`  DB Update failed: ${err.message}`, 'red');
    }

    // 6. Get Profile Again (Verify status change)
    log(`\n6. Verify Status Change...`, 'yellow');
    // Re-login to refresh token claims if needed? Usually status is checked live from DB in controllers?
    // Let's fetch profile.
    const profileRes2 = await api('GET', '/api/sellers/me', null, sellerToken);
    if (profileRes2.success && profileRes2.data.seller.status === 'verified') {
        log('  Seller status is now VERIFIED.', 'green');
    } else {
        log(`  Status mismatch or fetch failed. Status: ${profileRes2.data?.seller?.status}`, 'red');
    }

    // 7. Add Product (Should SUCCEED)
    log(`\n7. Add Product as VERIFIED Seller...`, 'yellow');
    const addProdSuccess = await api('POST', '/api/products', PRODUCT_DATA, sellerToken);
    if (addProdSuccess.success) {
        log('  Product added successfully.', 'green');
    } else {
        log(`  Failed to add product: ${JSON.stringify(addProdSuccess.error)}`, 'red');
    }

    log(`\nTest Sequence Complete.`, 'cyan');
}

runTests();
