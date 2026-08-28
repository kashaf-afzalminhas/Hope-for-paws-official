const User = require('../models/User');
const TempUser = require('../models/TempUser');
const Seller = require('../models/Seller');
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
const LINK_CONFIRMATION_REQUIRED = process.env.REQUIRE_GOOGLE_LINK_CONFIRMATION === 'true';

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
  if (!normalizedEmail.endsWith('@gmail.com')) return res.status(400).json({ message: 'Please use a valid Gmail address.' });
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
      verificationCodeExpires: Date.now() + 2 * 60 * 1000, // 2 mins
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
      expiry: '2 minutes',
      preheader: `Your Hope for Paws verification code is ${otp}`,
    });
    await transporter.sendMail({ from: process.env.GMAIL_USER, to: email, subject: 'Hope for Paws: Verification Code', text: `Your OTP code is: ${otp}\nIt expires in 2 minutes.`, html });

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

      // Seller linking is not auto-upgraded here unless tempUser explicitly registered as seller.
      if (tempUser.userType === 'seller' && !user.isSeller) {
        user.isSeller = true;
        user.sellerStatus = 'pending';
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
const googleLogins = async (req, res) => {
  try {
    const { credential, confirmLinking } = req.body;
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const email = normalizeEmail(payload.email);
    const name = payload.name;
    const googleId = payload.sub;

    let user = await User.findOne({ email }).select('-password');

    if (user) {
      const alreadyLinked = hasProvider(user, 'google');

      if (!alreadyLinked && LINK_CONFIRMATION_REQUIRED && !confirmLinking) {
        return res.status(200).json({
          requiresLinkConfirmation: true,
          message: 'Google account matches an existing account. Please confirm linking.'
        });
      }

      if (!alreadyLinked) {
        linkAuthProvider(user, 'google', googleId);
      }
      if (!hasProvider(user, 'local') && user.password) {
        linkAuthProvider(user, 'local');
      }

      await user.save();

      const token = jwt.sign(
        { id: user._id, username: user.username, isVeterinarian: user.isVeterinarian, isSeller: user.isSeller },
        process.env.JWT_SECRET,
        { expiresIn: '5d' }
      );

      return res.status(200).json({ message: 'Sign in successful', token, user });
    }

    // If user doesn't exist, ask frontend to get UserType.
    return res.status(200).json({ needsUserType: true, email, username: name, googleId });

  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ message: "Error" });
  }
};

const completeGoogleRegistration = async (req, res) => {
  try {
    const { email, username, isVeterinarian, userType, googleId } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !username) return res.status(400).json({ message: 'Missing fields' });

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

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      if (!hasProvider(user, 'google')) {
        linkAuthProvider(user, 'google', googleId || null);
      }
      if (isSeller && !user.isSeller) {
        user.isSeller = true;
        user.sellerStatus = 'incomplete';
      }
      await user.save();
    } else {
      user = await User.create({
        username,
        email: normalizedEmail,
        password: null,
        isVeterinarian: isVet,
        isSeller,
        sellerStatus: isSeller ? 'incomplete' : undefined,
        phone: "",
        phoneVerified: false,
        authProviders: [{ provider: 'google', providerId: googleId || null }]
      });
    }

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
    tempUser.verificationCodeExpires = Date.now() + 2 * 60 * 1000;
    await tempUser.save();

    const html = buildVerificationEmail({
      code: newOtp,
      heading: 'New Verification Code',
      message: 'Here is your new verification code. The previous code has been invalidated.',
      expiry: '2 minutes',
      preheader: `Your new Hope for Paws verification code is ${newOtp}`,
    });
    await transporter.sendMail({ from: process.env.GMAIL_USER, to: email, subject: 'Hope for Paws: New OTP', text: `Your new OTP: ${newOtp}\nIt expires in 2 minutes.`, html });
    res.status(200).json({ message: 'New OTP sent.' });
  } catch (error) {
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
    const { id, username, email, phone, city, about, notificationPreferences } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Handle Name / Username update
    if (username && username.trim() !== '') {
      user.username = username.trim();
    }

    // Handle Email update
    if (email && normalizeEmail(email) !== user.email) {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail.endsWith('@gmail.com')) {
        return res.status(400).json({ message: 'Please use a valid Gmail address.' });
      }
      if (ADMIN_EMAILS.includes(normalizedEmail)) {
        return res.status(403).json({ message: 'Reserved email.' });
      }
      const emailExists = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already in use by another account' });
      }
      user.email = normalizedEmail;
    }

    // Existing Phone validation & update
    if (phone && phone !== user.phone) {
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
  const { email } = req.body;
  if (!email.endsWith('@gmail.com')) return res.status(400).json({ error: 'Invalid email.' });

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
    user.verificationCode = undefined;
    await user.save();
    res.status(200).json({ message: 'Password reset.' });
  } catch (error) { res.status(500).json({ error: 'Error' }); }
};

// Other Exports
const signOut = async (req, res) => res.status(200).json({ message: 'Signed out' });
const getUserById = async (req, res) => {
  const user = await User.findById(req.body.id).select("-password");
  res.json({ data: user });
};
const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json({ data: users });
};
const searchUsers = async (req, res) => {
  const { query } = req.body;
  const users = await User.find({
    $or: [{ username: { $regex: query, $options: 'i' } }, { email: { $regex: query, $options: 'i' } }]
  }).select("-password");
  res.json({ data: users });
};
const deleteLocalProfileImage = async (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return;
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  const fullPath = path.join(process.cwd(), cleanPath);

  try {
    await fs.unlink(fullPath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Error deleting profile image from disk:', err);
    }
  }
};
const uploadProfileImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file" });

  try {
    const existingUser = await User.findById(req.user.id);
    if (existingUser?.profileImage) {
      await deleteLocalProfileImage(existingUser.profileImage);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: `/uploads/profile-images/${req.file.filename}` },
      { new: true }
    );

    res.json({ success: true, data: { profileImage: user.profileImage } });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const removeProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.profileImage) {
      await deleteLocalProfileImage(user.profileImage);
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
    const user = await User.findById(req.params.id).select("username email profileImage phone city about isVeterinarian isSeller lastActive");
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
  const { id, currentPassword, newPassword } = req.body;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return res.status(400).json({ error: 'Incorrect password' });
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.status(200).json({ message: 'Changed' });
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
  getUserById,
  searchUsers,
  uploadProfileImage,
  removeProfileImage,
  getUserPublicProfile,
  changePassword,
  setPassword,
  addPhoneNumber,
  verifyResetCode: verifyResetCodeRoute,
  resendResetCode
};