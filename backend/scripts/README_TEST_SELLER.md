# Seller Login Test Scripts

## Overview
These scripts test the complete seller login flow to verify that sellers can login and that the login response includes seller information.

## Available Test Scripts

### 1. API-Only Test (Recommended) - `testSellerLoginAPI.js`
Tests seller login using only API endpoints. Requires an existing user account.

### 2. Full Test - `testSellerLogin.js`
Tests seller login with direct database access. Creates test user automatically.

## Prerequisites
1. Backend server must be running on `http://localhost:3000`
2. All dependencies installed (`npm install`)

## How to Run

### Option A: API-Only Test (Recommended)
**Requires:** An existing user account with known credentials

```bash
cd backend
npm run test:seller:api <email> [password]
```

**Example:**
```bash
npm run test:seller:api seller@gmail.com Test123!@#
```

**Or set environment variables in `.env`:**
```
TEST_SELLER_EMAIL=seller@gmail.com
TEST_SELLER_PASSWORD=Test123!@#
```

Then run:
```bash
npm run test:seller:api
```

### Option B: Full Test (Requires MongoDB Access)
**Requires:** Direct MongoDB connection (may fail if IP not whitelisted)

```bash
cd backend
npm run test:seller
```

**Or direct execution:**
```bash
node scripts/testSellerLogin.js
```

## What the Test Does

The test script performs the following checks:

1. **Server Health Check** - Verifies the backend server is running
2. **User Registration** - Attempts to register a test user
3. **Create Test User** - Creates a test user directly in the database (bypasses OTP)
4. **Regular User Login** - Tests login before seller application
   - Verifies login works
   - Verifies seller fields are present in response
   - Verifies user is NOT a seller yet
5. **Apply as Seller** - Submits seller application
6. **Seller Login** - Tests login after seller application
   - Verifies login works
   - Verifies `isSeller: true`
   - Verifies `sellerStatus` is present and valid
   - Verifies `canBuy: false` for sellers
7. **Get Seller Profile** - Tests fetching seller profile endpoint
8. **Login Response Structure** - Validates all required fields are present

## Test Output

The script provides colored output:
- ✅ Green: Passed tests
- ❌ Red: Failed tests
- ℹ️ Blue: Information messages
- ⚠️ Yellow: Warnings

## Expected Results

All tests should pass if:
- Backend server is running
- MongoDB is connected
- Seller login functionality is working correctly

## Test User Details

The script creates a test user with:
- Email: `testseller[timestamp]@gmail.com`
- Password: `Test123!@#`
- Phone: `+1234567890`

## Customization

You can customize the test by modifying variables in `testSellerLogin.js`:
- `BASE_URL`: Change the API base URL
- `TEST_USER`: Modify test user credentials
- `TEST_SELLER`: Modify seller application data

## Troubleshooting

### Server not responding
- Make sure backend is running: `npm start`
- Check if port 3000 is available

### MongoDB connection error
- Verify `.env` file has correct `MONGO_URI`
- Check MongoDB is running and accessible

### Tests failing
- Check server logs for errors
- Verify database connection
- Ensure all required models are loaded correctly

## Cleanup

The test user created by this script will remain in the database. To clean up:
1. Manually delete the test user from MongoDB
2. Or use a separate cleanup script
