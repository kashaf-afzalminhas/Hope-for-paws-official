const mongoose = require('mongoose');
const User = require('../models/User');
const TempUser = require('../models/TempUser');
const Seller = require('../models/Seller');
const { saveImage, deleteImage } = require('../services/imageStorage');
const { toLocationSnapshot } = require('../utils/pakistanLocations');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const transporter = require('../config/emailTransporter');
const { buildVerificationEmail } = require('../utils/emailTemplates');
const crypto = require('crypto');
const dotenv = require('dotenv');
const fs = require('fs/promises');
const path = require('path');
const { OAuth2Client } = require("google-auth-library");

dotenv.config();

const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;
const COUNTRY_PHONE_LENGTH_RULES = {
  '+92': { min: 10, max: 10, label: 'Pakistan' },
  '+1': { min: 10, max: 10, label: 'US/Canada' },
  '+44': { min: 10, max: 10, label: 'United Kingdom' },
  '+91': { min: 10, max: 10, label: 'India' }
};
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "495806156812-uqmc0tenm7i0ljnjdo3ick68d3v053sl.apps.googleusercontent.com";
// Ask before linking Google to an existing account (on by default; set REQUIRE_GOOGLE_LINK_CONFIRMATION=false to turn off)
const LINK_CONFIRMATION_REQUIRED = process.env.REQUIRE_GOOGLE_LINK_CONFIRMATION !== 'false';

const validateInternationalPhone = (phone) => {
  if (!E164_PHONE_REGEX.test(phone)) {
    return 'Please provide a valid international phone number';
  }

  const matchedCode = Object.keys(COUNTRY_PHONE_LENGTH_RULES)
    .sort((a, b) => b.length - a.length)
    .find((code) => phone.startsWith(code));

  if (!matchedCode) return null;

  const nationalNumber = phone.slice(matchedCode.length);
  const rule = COUNTRY_PHONE_LENGTH_RULES[matchedCode];

  if (nationalNumber.length < rule.min || nationalNumber.length > rule.max) {
    return rule.min === rule.max
      ? `${rule.label} numbers must be exactly ${rule.min} digits after ${matchedCode}`
      : `${rule.label} numbers must be ${rule.min}-${rule.max} digits after ${matchedCode}`;
  }

  return null;
};

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

// Any normal email address is accepted (not only Gmail)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isValidEmail = (email = '') => email.length <= 254 && EMAIL_PATTERN.test(email);

// How long sign-up and email-change codes stay valid
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_TTL_TEXT = '5 minutes';

const hasProvider = (user, provider) =>
  Array.isArray(user?.authProviders) &&
  user.authProviders.some((p) => p.provider === provider);

const linkAuthProvider = (user, provider, providerId = null) => {
  if (!Array.isArray(user.authProviders)) {
    user.authProviders = [];
  }

  const existing = user.authProviders.find((p) => p.provider === provider);
  if (existing) {
    if (providerId && existing.providerId !== providerId) {
      existing.providerId = providerId;
      existing.linkedAt = new Date();
    }
    return;
  }

  user.authProviders.push({
    provider,
    providerId: providerId || null,
    linkedAt: new Date()
  });
};

const ADMIN_EMAILS = [
  'kashafafzal909@gmail.com',
  'laibaanoor1616@gmail.com',
  'sahabnoor193@gmail.com'
];

// ==========================================
// 1. SIGN UP (Step 1: Save to TempUser)
// ==========================================
const signUp = async (req, res) => {
  const { username, email, password, isVeterinarian, phone, userType } = req.body;
  const normalizedEmail = normalizeEmail(email);

  // 1. Basic Validation
  if (!username || !email || !password || !phone) {
    return res.status(400).json({ message: 'All fields (username, email, password, phone) are required' });
  }

  // 2. Validate User Type
  const finalUserType = userType === 'seller' ? 'seller' : 'user';

  // 3. (Removed) Seller Fields validation is now handled in the onboarding step.

  // 4. Validate Phone & Email
  const normalizedPhone = String(phone || '').trim();
  const phoneValidationError = validateInternationalPhone(normalizedPhone);
  if (phoneValidationError) {
    return res.status(400).json({ message: phoneValidationError });
  }
  if (!isValidEmail(normalizedEmail)) return res.status(400).json({ message: 'Please enter a valid email address.' });
  if (ADMIN_EMAILS.includes(normalizedEmail)) return res.status(403).json({ message: 'Reserved email.' });

  try {
    // 5. Check if User Exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    // If user exists and already has a password, block duplicate registrations.
    // If user exists but has no password (Google-first), allow linking by setting a password via OTP verification.
    if (existingUser && existingUser.password) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Keep phone uniqueness consistent across signup and profile updates.
    const existingPhoneInUsers = await User.findOne({
      phone: normalizedPhone,
      ...(existingUser ? { _id: { $ne: existingUser._id } } : {})
    });
    if (existingPhoneInUsers) {
      return res.status(400).json({ message: 'Phone number already used by another user' });
    }
    const existingPhoneInTempUsers = await TempUser.findOne({
      phone: normalizedPhone,
      email: { $ne: normalizedEmail }
    });
    if (existingPhoneInTempUsers) {
      return res.status(400).json({ message: 'Phone number already used by another user' });
    }

    // 6. Prepare Data (Hash Password, Generate OTP)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = crypto.randomBytes(3).toString('hex');

    // 7. Handle TempUser (Update if exists, else Create)
    let tempUser = await TempUser.findOne({ email: normalizedEmail });

    const tempUserData = {
      username,
      email: normalizedEmail,
      password: hashedPassword,
      isVeterinarian: isVeterinarian || false,
      phone: normalizedPhone,
      userType: finalUserType,
      existingUserId: existingUser ? existingUser._id : undefined,
      verificationCode: otp,
      verificationCodeExpires: Date.now() + OTP_TTL_MS,
      // Seller Info is collected post-registration
    };

    if (tempUser) {
      Object.assign(tempUser, tempUserData);
      await tempUser.save();
    } else {
      tempUser = new TempUser(tempUserData);
      await tempUser.save();
    }

    // 8. Send OTP Email
    const html = buildVerificationEmail({
      code: otp,
      heading: 'Verification Code',
      message: 'Use this code to verify your account and complete your registration.',
      expiry: OTP_TTL_TEXT,
      preheader: `Your Hope for Paws verification code is ${otp}`,
    });
    try {
      await transporter.sendMail({ from: process.env.GMAIL_USER, to: normalizedEmail, subject: 'Hope for Paws: Verification Code', text: `Your OTP code is: ${otp}\nIt expires in ${OTP_TTL_TEXT}.`, html });
    } catch (mailError) {
      console.error('SignUp Email Error:', mailError.code || '', mailError.message);
      return res.status(503).json({ message: 'We could not send the verification email right now. Please try again in a minute.' });
    }

    res.status(201).json({ message: 'OTP sent to your email.' });

  } catch (error) {
    console.error('SignUp Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ==========================================
// 2. VERIFY OTP (Step 2: Create Real User & Seller)
// ==========================================
const verifyRegistrationOTP = async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = normalizeEmail(email);

  try {
    const tempUser = await TempUser.findOne({ email: normalizedEmail });

    if (!tempUser) return res.status(404).json({ error: 'Registration session expired or invalid.' });
    if (tempUser.verificationCode !== otp) return res.status(400).json({ error: 'Invalid OTP.' });
    if (tempUser.verificationCodeExpires < Date.now()) return res.status(400).json({ error: 'OTP expired.' });

    // If a user already exists (Google-first), link by setting password + local provider.
    // Otherwise create a brand-new local user.
    let user = null;
    if (tempUser.existingUserId) {
      user = await User.findById(tempUser.existingUserId);
    }
    if (!user) {
      user = await User.findOne({ email: normalizedEmail });
    }

    if (user) {
      // Don't override an existing password.
      if (!user.password) {
        user.password = tempUser.password;
      }
      // Keep original username if already set; otherwise fill it.
      if (!user.username) {
        user.username = tempUser.username;
      }
      user.isVeterinarian = Boolean(user.isVeterinarian) || Boolean(tempUser.isVeterinarian);

      // Phone: only set if empty to avoid accidental overwrites; keep verification.
      if (!user.phone) {
        user.phone = tempUser.phone;
      }
      user.phoneVerified = true;

      // A seller must complete onboarding before the account becomes pending.
      if (tempUser.userType === 'seller') {
        user.isSeller = true;
        const sellerProfile = await Seller.exists({ userId: user._id });
        if (!sellerProfile) {
          user.sellerStatus = 'incomplete';
        }
      }

      linkAuthProvider(user, 'local');
      await user.save();
    } else {
      user = new User({
        username: tempUser.username,
        email: normalizeEmail(tempUser.email),
        password: tempUser.password,
        isVeterinarian: tempUser.isVeterinarian,
        phone: tempUser.phone,
        phoneVerified: true,
        isSeller: tempUser.userType === 'seller',
        sellerStatus: tempUser.userType === 'seller' ? 'incomplete' : null,
        canBuy: true, // All users can buy
        authProviders: [{ provider: 'local', providerId: null }]
      });

      await user.save();
    }

    // 2. (Removed) Seller Profile is created during post-registration onboarding

    // 3. Cleanup & Token
    await TempUser.deleteOne({ email: normalizedEmail });

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        isVeterinarian: user.isVeterinarian,
        isSeller: user.isSeller
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const userSafe = user.toObject();
    delete userSafe.password;
    const hasValidPhone = Boolean(userSafe.phone && !validateInternationalPhone(userSafe.phone));
    userSafe.phoneVerified = Boolean(userSafe.phoneVerified) && hasValidPhone;

    res.status(200).json({
      message: 'Verified successfully.',
      token,
      user: userSafe,
    });

  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
};

// ==========================================
// 3. SIGN IN
// ==========================================
const signIn = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    if (!user.password) return res.status(400).json({ error: 'This account does not support password sign in' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // Sellers without an onboarding profile still need to complete seller setup.
    if (user.isSeller && user.sellerStatus === 'pending') {
      const sellerProfile = await Seller.exists({ userId: user._id });
      if (!sellerProfile) {
        user.sellerStatus = 'incomplete';
        await user.save();
      }
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        isVeterinarian: user.isVeterinarian,
        isSeller: user.isSeller
      },
      process.env.JWT_SECRET,
      { expiresIn: '5d' }
    );

    const userSafe = user.toObject();
    delete userSafe.password;
    const hasValidPhone = Boolean(userSafe.phone && !validateInternationalPhone(userSafe.phone));
    userSafe.phoneVerified = Boolean(userSafe.phoneVerified) && hasValidPhone;

    res.status(200).json({
      message: 'Sign in successful',
      token,
      user: userSafe,
    });

  } catch (error) {
    console.error('SignIn Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==========================================~
// 4. GOOGLE AUTH (Updated for Seller)
// ==========================================
// One shared client (re-creating it per request throws away Google's cached certs)
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const GOOGLE_VERIFY_TIMEOUT_MS = 10000;
const isDev = process.env.NODE_ENV !== 'production';

// Rejects if the promise doesn't settle in time, so the request can never hang forever
const withTimeout = (promise, ms, label) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`${label} timed out after ${ms}ms`);
      err.code = 'ETIMEDOUT';
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const NETWORK_ERROR_RE = /ETIMEDOUT|ENOTFOUND|ECONNRESET|ECONNREFUSED|EAI_AGAIN|ENETUNREACH|socket hang up|network/i;

// Verifies a Google ID token and returns the trusted identity, or sends an error response and returns null
const verifyGoogleCredential = async (credential, res) => {
  if (!credential || typeof credential !== 'string') {
    res.status(400).json({ message: 'Missing Google credential' });
    return null;
  }
  let payload;
  try {
    const ticket = await withTimeout(
      googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID }),
      GOOGLE_VERIFY_TIMEOUT_MS,
      'Google token verification'
    );
    payload = ticket.getPayload();
  } catch (verifyErr) {
    console.error('[google-auth] token verification failed:', verifyErr.message);
    if (NETWORK_ERROR_RE.test(verifyErr.code || '') || NETWORK_ERROR_RE.test(verifyErr.message || '')) {
      res.status(503).json({
        message: "The server couldn't reach Google to verify your sign-in. Please try again.",
        ...(isDev && { detail: verifyErr.message })
      });
      return null;
    }
    res.status(401).json({
      message: 'Google sign-in could not be verified.',
      ...(isDev && { detail: verifyErr.message })
    });
    return null;
  }
  if (!payload?.email) {
    res.status(400).json({ message: 'Google account has no email address' });
    return null;
  }
  if (payload.email_verified !== true) {
    res.status(400).json({ message: 'Your Google email address is not verified' });
    return null;
  }
  const email = normalizeEmail(payload.email);
  return {
    email,
    name: payload.name || email.split('@')[0],
    googleId: payload.sub,
    picture: payload.picture || ''
  };
};

const googleLogins = async (req, res) => {
  const t0 = Date.now();
  const log = (msg) => console.log(`[google-login +${Date.now() - t0}ms] ${msg}`);

  try {
    const { credential, confirmLinking } = req.body || {};
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ message: 'Missing Google credential' });
    }

    // Fail fast if MongoDB isn't connected (otherwise Mongoose silently buffers the query)
    if (mongoose.connection.readyState !== 1) {
      log(`MongoDB not connected (readyState=${mongoose.connection.readyState})`);
      return res.status(503).json({ message: 'Database is not connected. Please try again shortly.' });
    }

    // 1) Verify the ID token with Google
    log('verifying Google ID token...');
    let payload;
    try {
      const ticket = await withTimeout(
        googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID }),
        GOOGLE_VERIFY_TIMEOUT_MS,
        'Google token verification'
      );
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error('[google-login] token verification failed:', verifyErr.message);
      if (NETWORK_ERROR_RE.test(verifyErr.code || '') || NETWORK_ERROR_RE.test(verifyErr.message || '')) {
        return res.status(503).json({
          message: "The server couldn't reach Google to verify your sign-in. Please try again.",
          ...(isDev && { detail: verifyErr.message })
        });
      }
      // Wrong audience (client ID mismatch), expired token, malformed token, etc.
      return res.status(401).json({
        message: 'Google sign-in could not be verified.',
        ...(isDev && { detail: verifyErr.message })
      });
    }
    log('token verified');

    if (!payload?.email) {
      return res.status(400).json({ message: 'Google account has no email address' });
    }
    if (payload.email_verified !== true) {
      return res.status(400).json({ message: 'Your Google email address is not verified' });
    }

    const email = normalizeEmail(payload.email);
    const name = payload.name || email.split('@')[0];
    const googleId = payload.sub;

    // 2) Look up the user (password is loaded so the "local" provider check below works;
    //    it is stripped before the user object is sent back)
    log('looking up user...');
    // Match by Google account ID first, then fall back to email for accounts not linked yet
    let user = await User.findOne({
      authProviders: { $elemMatch: { provider: 'google', providerId: googleId } }
    });
    if (!user) {
      user = await User.findOne({ email });
      const linkedGoogle = user?.authProviders?.find((p) => p.provider === 'google');
      if (linkedGoogle?.providerId && linkedGoogle.providerId !== googleId) {
        return res.status(409).json({ message: 'This email is already linked to a different Google account.' });
      }
    }

    if (user) {
      const alreadyLinked = hasProvider(user, 'google');

      if (!alreadyLinked && LINK_CONFIRMATION_REQUIRED && !confirmLinking) {
        return res.status(200).json({
          requiresLinkConfirmation: true,
          message: 'Google account matches an existing account. Please confirm linking.'
        });
      }

      // Links Google if new, and fills in the Google ID on older links that were saved without one
      linkAuthProvider(user, 'google', googleId);
      if (!hasProvider(user, 'local') && user.password) {
        linkAuthProvider(user, 'local');
      }

      if (user.isModified()) {
        log('saving linked providers...');
        await user.save();
      }

      const userSafe = user.toObject();
      delete userSafe.password;

      const token = jwt.sign(
        { id: userSafe._id, username: userSafe.username, isVeterinarian: userSafe.isVeterinarian, isSeller: userSafe.isSeller },
        process.env.JWT_SECRET,
        { expiresIn: '5d' }
      );

      log('sign in successful');
      return res.status(200).json({ message: 'Sign in successful', token, user: userSafe });
    }

    // 3) New user: ask the frontend for the account type
    log('new Google user, asking for account type');
    return res.status(200).json({ needsUserType: true, email, username: name, googleId, picture: payload.picture || '' });

  } catch (error) {
    console.error('Google Login Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        message: 'Google login failed on the server.',
        ...(isDev && { detail: error.message })
      });
    }
  }
};

const completeGoogleRegistration = async (req, res) => {
  try {
    // SECURITY: identity comes only from a Google ID token verified here, never from client-supplied email/googleId
    const { credential, username: requestedUsername, isVeterinarian, userType } = req.body || {};
    const identity = await verifyGoogleCredential(credential, res);
    if (!identity) return;

    const normalizedEmail = identity.email;
    const googleId = identity.googleId;
    const profileImageUrl = identity.picture;
    const username = (typeof requestedUsername === 'string' && requestedUsername.trim()) || identity.name;

    if (ADMIN_EMAILS.includes(normalizedEmail)) {
      return res.status(403).json({ message: 'Reserved email.' });
    }

    let profileImage = '';
    if (typeof profileImageUrl === 'string' && profileImageUrl.trim()) {
      try {
        const imageUrl = new URL(profileImageUrl.trim());
        if (imageUrl.protocol === 'http:' || imageUrl.protocol === 'https:') {
          profileImage = profileImageUrl.trim();
        }
      } catch {
      }
    }

    const resolvedUserType =
      userType === 'seller' || userType === 'veterinarian' || userType === 'user'
        ? userType
        : (isVeterinarian === true || isVeterinarian === 'true')
          ? 'veterinarian'
          : (isVeterinarian === false || isVeterinarian === 'false')
            ? 'user'
            : 'user';
    const isSeller = resolvedUserType === 'seller';
    const isVet = resolvedUserType === 'veterinarian';

    // Seller details check moved to onboarding

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists. Please sign in with Google instead.' });
    }
    const user = await User.create({
      username,
      email: normalizedEmail,
      password: null,
      isVeterinarian: isVet,
      isSeller,
      sellerStatus: isSeller ? 'incomplete' : undefined,
      phone: "",
      phoneVerified: false,
      profileImage,
      authProviders: [{ provider: 'google', providerId: googleId || null }]
    });

    const userSafe = user.toObject();
    delete userSafe.password;

    const token = jwt.sign(
      { id: userSafe._id, username: userSafe.username, isVeterinarian: userSafe.isVeterinarian, isSeller: userSafe.isSeller },
      process.env.JWT_SECRET,
      { expiresIn: '5d' }
    );

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: userSafe
    });

  } catch (error) {
    console.error('Google Registration Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ==========================================
// 5. HELPER FUNCTIONS
// ==========================================

const resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) return res.status(404).json({ message: 'No pending registration.' });

    const newOtp = crypto.randomBytes(3).toString('hex');
    tempUser.verificationCode = newOtp;
    tempUser.verificationCodeExpires = Date.now() + OTP_TTL_MS;
    await tempUser.save();

    const html = buildVerificationEmail({
      code: newOtp,
      heading: 'New Verification Code',
      message: 'Here is your new verification code. The previous code has been invalidated.',
      expiry: OTP_TTL_TEXT,
      preheader: `Your new Hope for Paws verification code is ${newOtp}`,
    });
    try {
      await transporter.sendMail({ from: process.env.GMAIL_USER, to: tempUser.email, subject: 'Hope for Paws: New OTP', text: `Your new OTP: ${newOtp}\nIt expires in ${OTP_TTL_TEXT}.`, html });
    } catch (mailError) {
      console.error('Resend OTP Email Error:', mailError.code || '', mailError.message);
      return res.status(503).json({ message: 'We could not send the verification email right now. Please try again in a minute.' });
    }
    res.status(200).json({ message: 'New OTP sent.' });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const validateToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userData = user.toObject();
    const hasValidPhone = Boolean(userData.phone && !validateInternationalPhone(userData.phone));
    userData.phoneVerified = Boolean(userData.phoneVerified) && hasValidPhone;

    res.json({ user: userData });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    let userData = user.toObject();
    if (user.isSeller) {
      const seller = await Seller.findOne({ userId: user._id });
      if (seller) userData.sellerDetails = seller;
    }
    res.json({ success: true, data: userData });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

const updateProfile = async (req, res) => {
  try {
    // The profile being edited is always the logged-in user's; any id in the body is ignored
    const id = req.user.id;
    const { username, email, phone, city, location, about, notificationPreferences } = req.body || {};
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Handle Name / Username update
    if (username && username.trim() !== '') {
      user.username = username.trim();
    }

    // Handle Email update — direct email changes are no longer allowed.
    // Users must go through the OTP verification flow (send-email-change-otp → verify-email-change).
    if (email && normalizeEmail(email) !== user.email) {
      return res.status(400).json({
        message: 'Email changes require verification. Please use the email verification flow.',
        requiresVerification: true
      });
    }

    // Existing Phone validation & update
    if (phone && String(phone).trim() !== '' && phone !== user.phone) {
      const normalizedPhone = String(phone).trim();
      const phoneValidationError = validateInternationalPhone(normalizedPhone);
      if (phoneValidationError) {
        return res.status(400).json({ message: phoneValidationError });
      }
      const exists = await User.findOne({ phone: normalizedPhone, _id: { $ne: id } });
      if (exists) return res.status(400).json({ message: 'Phone number is already used by another user' });
      user.phone = normalizedPhone;
      user.phoneVerified = true;
    }

    user.city = city || user.city;

    if (location !== undefined) {
     const locationSnapshot = toLocationSnapshot(location);
    if (!locationSnapshot) {
    return res.status(400).json({
      message: 'Select a valid country, province, and city.'
    });
  }

  user.location = locationSnapshot;

  if (user.isSeller) {
    await Seller.findOneAndUpdate(
      { userId: user._id },
      { $set: { location: locationSnapshot } }
    );
  }
}
    user.about = about || user.about;

    if (notificationPreferences && typeof notificationPreferences === 'object') {
      const emailPref = notificationPreferences.email;
      if (emailPref && ['instant', 'daily_summary', 'disabled'].includes(emailPref)) {
        user.notificationPreferences = {
          ...user.notificationPreferences,
          email: emailPref,
        };
      }
      if (typeof notificationPreferences.inApp === 'boolean') {
        user.notificationPreferences = {
          ...user.notificationPreferences,
          inApp: notificationPreferences.inApp,
        };
      }
      if (typeof notificationPreferences.push === 'boolean') {
        user.notificationPreferences = {
          ...user.notificationPreferences,
          push: notificationPreferences.push,
        };
      }
    }

    await user.save();

    const userSafe = user.toObject();
    delete userSafe.password;

    return res.status(200).json({ message: 'Updated', user: userSafe });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Password Reset Flow
const forgotPassword = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email.' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Email not found.' });

    const code = crypto.randomBytes(3).toString('hex');
    user.verificationCode = code;
    user.verificationCodeExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Hope for Paws: Password Reset',
      text: `Your password reset code is: ${code}\nIt expires in 15 minutes.`,
      html: buildVerificationEmail({
        code: code,
        heading: 'Password Reset Code',
        message: 'You requested a password reset. Use the code below to set a new password.',
        expiry: '15 minutes',
        preheader: `Your Hope for Paws password reset code is ${code}`,
      }),
    });
    res.status(200).json({ message: 'Code sent.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
};

const verifyCode = async (req, res) => { /* Reuse logic if verifyRegistrationOTP isn't generic enough */
  const { email, code } = req.body; // For Password Reset Only
  try {
    const user = await User.findOne({ email });
    if (!user || user.verificationCode !== code || user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired code.' });
    }
    res.status(200).json({ message: 'Code verified.' });
  } catch (error) { res.status(500).json({ error: 'Error' }); }
};

const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.verificationCode !== code || user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ error: 'Invalid code.' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    linkAuthProvider(user, 'local');
    user.verificationCode = undefined;
    await user.save();
    res.status(200).json({ message: 'Password reset.' });
  } catch (error) { res.status(500).json({ error: 'Error' }); }
};

// Other Exports
const signOut = async (req, res) => res.status(200).json({ message: 'Signed out' });
// Only public profile fields are returned by the user lookup endpoints (never email, phone or verification codes)
const PUBLIC_USER_FIELDS = 'username profileImage status lastActive isVeterinarian isSeller sellerStatus city about createdAt';

const getUserById = async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const user = await User.findById(id).select(PUBLIC_USER_FIELDS);
    res.json({ data: user });
  } catch (error) {
    console.error('getUserById error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select(PUBLIC_USER_FIELDS);
    res.json({ data: users });
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};
// Several users at once (public fields only), e.g. the people someone chats with
const getUsersByIds = async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const validIds = [...new Set(ids.map(String))]
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .slice(0, 200);
    if (validIds.length === 0) return res.json({ data: [] });
    const users = await User.find({ _id: { $in: validIds } }).select(PUBLIC_USER_FIELDS);
    res.json({ data: users });
  } catch (error) {
    console.error('getUsersByIds error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};
const searchUsers = async (req, res) => {
  try {
    const query = typeof req.body?.query === 'string' ? req.body.query.trim().slice(0, 100) : '';
    if (!query) return res.json({ data: [] });
    const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find({ username: { $regex: safe, $options: 'i' } })
      .select(PUBLIC_USER_FIELDS)
      .limit(50)
      .lean();
    res.json({ data: users });
  } catch (error) {
    console.error('searchUsers error:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
};
// Deletes a user's old profile picture (Cloudinary or local), unless the same image is still the store photo
const deleteLocalProfileImage = async (imagePath, userId) => {
  if (!imagePath || typeof imagePath !== 'string') return;
  try {
    const usedBySeller = userId ? await Seller.exists({ userId, profileImage: imagePath }) : null;
    if (!usedBySeller) await deleteImage(imagePath);
  } catch (err) {
    console.error('Error deleting old profile image:', err.message);
  }
};
const uploadProfileImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file" });

  try {
    const existingUser = await User.findById(req.user.id);
    if (!existingUser) return res.status(404).json({ success: false, message: "User not found" });

    const newImage = await saveImage(req.file, 'profile-images');
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: newImage },
      { new: true }
    );

    // Remove the previous picture only after the new one is saved
    if (existingUser.profileImage && existingUser.profileImage !== newImage) {
      await deleteLocalProfileImage(existingUser.profileImage, req.user.id);
    }

    res.json({ success: true, data: { profileImage: user.profileImage } });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    if (error.status === 400) return res.status(400).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const removeProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.profileImage) {
      await deleteLocalProfileImage(user.profileImage, user._id);
    }

    user.profileImage = "";
    await user.save();

    res.json({ success: true, message: "Removed" });
  } catch (error) {
    console.error('Error removing profile image:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const getUserPublicProfile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    // Public endpoint: never return email or phone
    const user = await User.findById(req.params.id).select("username profileImage city about isVeterinarian isSeller lastActive");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const seller = await Seller.findOne({ userId: req.params.id }).select("isVerified status storeName _id");
    
    res.json({ 
      success: true, 
      data: {
        ...user.toObject(),
        sellerVerified: seller?.isVerified || false,
        sellerStatus: seller?.status || null,
        storeName: seller?.storeName || null,
        sellerId: seller?._id || null
      } 
    });
  } catch (err) {
    console.error('Error fetching public profile:', err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const changePassword = async (req, res) => {
  try {
    // Always the logged-in user's password; any id in the body is ignored
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.password) {
      return res.status(400).json({ error: 'This account has no password yet. Use "Set Password" instead.' });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect password' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: 'Changed' });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// For Google-first accounts: set a password once (JWT required).
// If the account already has a password, use changePassword instead.
const setPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'newPassword is required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.password) {
      return res.status(400).json({ message: 'Password already set. Use changePassword.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    linkAuthProvider(user, 'local');
    await user.save();

    const userSafe = user.toObject();
    delete userSafe.password;
    return res.status(200).json({ message: 'Password set successfully', user: userSafe });
  } catch (error) {
    console.error('SetPassword Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
const addPhoneNumber = async (req, res) => {
  const normalizedPhone = String(req.body.phone || '').trim();
  const phoneValidationError = validateInternationalPhone(normalizedPhone);
  if (phoneValidationError) {
    return res.status(400).json({ message: phoneValidationError });
  }
  const existingPhone = await User.findOne({ phone: normalizedPhone, _id: { $ne: req.user.id } });
  if (existingPhone) {
    return res.status(400).json({ message: 'Phone number is already used by another user' });
  }
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.phone = normalizedPhone;
  user.phoneVerified = true;
  await user.save();
  res.status(200).json({ message: 'Phone added', user });
};

// ==========================================
// EMAIL CHANGE VERIFICATION
// ==========================================
const sendEmailChangeOTP = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({ message: 'New email is required' });
    }

    const normalizedNewEmail = normalizeEmail(newEmail);

    if (!isValidEmail(normalizedNewEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    // Check reserved emails
    if (ADMIN_EMAILS.includes(normalizedNewEmail)) {
      return res.status(403).json({ message: 'Reserved email.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't send OTP if email hasn't actually changed
    if (normalizedNewEmail === user.email) {
      return res.status(400).json({ message: 'New email is the same as your current email.' });
    }

    // Check if email is already in use by another account
    const emailExists = await User.findOne({ email: normalizedNewEmail, _id: { $ne: userId } });
    if (emailExists) {
      return res.status(400).json({ message: 'Email is already in use by another account' });
    }

    // Generate OTP
    const otp = crypto.randomBytes(3).toString('hex');

    // Store pending email info on the user document
    user.pendingEmail = normalizedNewEmail;
    user.pendingEmailOTP = otp;
    user.pendingEmailOTPExpires = Date.now() + OTP_TTL_MS;
    await user.save();

    // Send verification email to the NEW email address
    const html = buildVerificationEmail({
      code: otp,
      heading: 'Email Change Verification',
      message: 'You requested to change your email address on Hope for Paws. Use this code to verify your new email.',
      expiry: OTP_TTL_TEXT,
      preheader: `Your Hope for Paws email verification code is ${otp}`,
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: normalizedNewEmail,
      subject: 'Hope for Paws: Email Change Verification',
      text: `Your verification code is: ${otp}\nIt expires in ${OTP_TTL_TEXT}.`,
      html
    });

    res.status(200).json({ message: 'Verification code sent to your new email address.' });

  } catch (error) {
    console.error('SendEmailChangeOTP Error:', error);
    res.status(500).json({ message: 'Server error while sending verification code' });
  }
};

const verifyEmailChange = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'Verification code is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify pending email change exists
    if (!user.pendingEmail || !user.pendingEmailOTP) {
      return res.status(400).json({ message: 'No pending email change found. Please request a new verification code.' });
    }

    // Check OTP
    if (user.pendingEmailOTP !== otp) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    // Check expiry
    if (user.pendingEmailOTPExpires < Date.now()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Check email isn't taken (race condition guard)
    const emailExists = await User.findOne({ email: user.pendingEmail, _id: { $ne: userId } });
    if (emailExists) {
      // Clear pending fields
      user.pendingEmail = null;
      user.pendingEmailOTP = null;
      user.pendingEmailOTPExpires = null;
      await user.save();
      return res.status(400).json({ message: 'Email is already in use by another account.' });
    }

    // Update the email
    user.email = user.pendingEmail;

    // Clear pending fields
    user.pendingEmail = null;
    user.pendingEmailOTP = null;
    user.pendingEmailOTPExpires = null;
    await user.save();

    const userSafe = user.toObject();
    delete userSafe.password;

    res.status(200).json({ message: 'Email updated successfully.', user: userSafe });

  } catch (error) {
    console.error('VerifyEmailChange Error:', error);
    res.status(500).json({ message: 'Server error during email verification' });
  }
};
const verifyResetCodeRoute = async (req, res) => { verifyCode(req, res); }; // Wrapper if needed
const resendResetCode = async (req, res) => { forgotPassword(req, res); }; // Wrapper

module.exports = {
  signUp,
  verifyRegistrationOTP,
  signIn,
  validateToken,
  forgotPassword,
  verifyCode,
  resetPassword,
  resendOTP,
  googleLogins,
  completeGoogleRegistration,
  getUserProfile,
  updateProfile,
  signOut,
  getAllUsers,
  getUsersByIds,
  getUserById,
  searchUsers,
  uploadProfileImage,
  removeProfileImage,
  getUserPublicProfile,
  changePassword,
  setPassword,
  addPhoneNumber,
  sendEmailChangeOTP,
  verifyEmailChange,
  verifyResetCode: verifyResetCodeRoute,
  resendResetCode
};