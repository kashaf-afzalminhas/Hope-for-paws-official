const User = require('../models/User');
const TempUser = require('../models/TempUser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');
const {OAuth2Client} = require("google-auth-library");

dotenv.config();

console.log('GMAIL_USER:', process.env.GMAIL_USER);
console.log('GMAIL_PASS:', process.env.GMAIL_PASS);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});
console.log('GMAIL_USER:', process.env.GMAIL_USER);
console.log('GMAIL_PASS:', process.env.GMAIL_PASS);

const fetch = require('node-fetch'); // Use fetch to make API requests
const JWT_SECRET = process.env.JWT_SECRET || 'Xy7@lKh$2nGz8qW!rVtP9&jDfL^6O77';
// Replace with your chosen email verification service's API URL and key
const EMAIL_VERIFICATION_API_URL = 'https://www.zerobounce.net/members/API';
const API_KEY = '0cd5922afa754b08911d12fe8e8452ba'; // Replace with your API key

const signUp = async (req, res) => {
  const { username, email, password, isVeterinarian } = req.body;
  console.log('Received signup request:', { username, email, isVeterinarian });

  if (!username || !email || !password) {
    console.warn('Missing required fields');
    return res.status(400).json({ message: 'All fields (username, email, password) are required' });
  }

  if (!email.toLowerCase().endsWith('@gmail.com')) {
    console.warn('Invalid email domain:', email);
    return res.status(400).json({ message: 'Please use a valid Gmail address.' });
  }

  try {
    // Check if user is already verified (exists in User collection)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn('Verified user already exists:', { email });
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if there's an existing unverified user (in TempUser collection)
    const existingTempUser = await TempUser.findOne({ email });
    if (existingTempUser) {
      console.log('🔄 Updating existing unverified user:', { email, tempUserId: existingTempUser._id });
      // Update the existing temp user with new data instead of deleting
      existingTempUser.username = username;
      existingTempUser.password = await bcrypt.hash(password, 10);
      existingTempUser.isVeterinarian = isVeterinarian || false;
      
      const otp = crypto.randomBytes(3).toString('hex');
      existingTempUser.verificationCode = otp;
      existingTempUser.verificationCodeExpires = Date.now() + 2 * 60 * 1000;
      
      await existingTempUser.save();
      console.log('✅ Temporary user updated successfully:', { email, tempUserId: existingTempUser._id, newExpiry: existingTempUser.verificationCodeExpires });

      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Hope for Paws: Complete Your Registration – Email Verification Code',
        text: `Hello ${username || 'there'},\n\nThank you for registering with Hope for Paws!\n\nPlease use the following One-Time Password (OTP) to verify your email address and complete your registration:\n\nOTP Code: ${otp}\n\nThis code is valid for 2 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nHope for Paws Team`,
      });
      console.log('📧 OTP sent to email:', email);

      return res.status(201).json({ message: 'OTP code sent to your email. Please verify to complete registration.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('🔐 Password hashed successfully');

    const otp = crypto.randomBytes(3).toString('hex');
    console.log('🔢 Generated OTP:', otp);

    const tempUser = new TempUser({
      username,
      email,
      password: hashedPassword,
      isVeterinarian: isVeterinarian || false,
      verificationCode: otp,
      verificationCodeExpires: Date.now() + 2 * 60 * 1000,
    });

    await tempUser.save();
    console.log('✅ Temporary user created successfully:', { email, tempUserId: tempUser._id, expiry: tempUser.verificationCodeExpires });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Hope for Paws: Complete Your Registration – Email Verification Code',
      text: `Hello ${username || 'there'},\n\nThank you for registering with Hope for Paws!\n\nPlease use the following One-Time Password (OTP) to verify your email address and complete your registration:\n\nOTP Code: ${otp}\n\nThis code is valid for 2 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nHope for Paws Team`,
    });
    console.log('📧 OTP sent to email:', email);

    res.status(201).json({ message: 'OTP code sent to your email. Please verify to complete registration.' });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

const verifyRegistrationOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  try {
    console.log('🔍 Verification attempt for:', email);
    
    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) {
      console.log('❌ No TempUser found for verification:', email);
      return res.status(404).json({ error: 'User not found.' });
    }

    console.log('✅ Found TempUser for verification:', { email, tempUserId: tempUser._id, currentExpiry: tempUser.verificationCodeExpires });

    if (tempUser.verificationCode !== otp) {
      console.log('❌ Invalid OTP for verification:', { email, providedOTP: otp, storedOTP: tempUser.verificationCode });
      return res.status(400).json({ error: 'Invalid OTP code.' });
    }
    
    if (tempUser.verificationCodeExpires < Date.now()) {
      console.log('❌ OTP expired for verification:', { email, expiry: tempUser.verificationCodeExpires, currentTime: Date.now() });
      return res.status(400).json({ error: 'OTP code has expired.' });
    }

    console.log('✅ OTP validation successful, creating new user:', email);

    const newUser = new User({
      username: tempUser.username,
      email: tempUser.email,
      password: tempUser.password,
      isVeterinarian: tempUser.isVeterinarian,
    });

    await newUser.save();
    console.log('✅ New user created successfully:', { email, userId: newUser._id });

    await TempUser.deleteOne({ email });
    console.log('🗑️ Temporary user deleted after successful verification:', { email, tempUserId: tempUser._id });

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, isVeterinarian: newUser.isVeterinarian },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ Verification completed successfully:', email);

    res.status(200).json({
      message: 'Email verified successfully. You are now logged in.',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        isVeterinarian: newUser.isVeterinarian,
      },
    });
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
};

// Validate Token Function
const validateToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Forgot Password Controller
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email.endsWith('@gmail.com')) {
    return res.status(400).json({ error: 'Please use a valid Gmail address.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Email not found.' });
    }

    const verificationCode = crypto.randomBytes(3).toString('hex');
    user.verificationCode = verificationCode; // Save code in user model
    user.verificationCodeExpires = Date.now() + 15 * 60 * 1000; // Set expiration time to 15 minutes
    await user.save();

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Hope for Paws: Password Reset Verification Code',
      text: `Hello,\n\nWe received a request to reset your password for your Hope for Paws account.\n\nPlease use the following verification code to reset your password:\n\nVerification Code: ${verificationCode}\n\nThis code is valid for 15 minutes. If you did not request a password reset, please ignore this email.\n\nBest regards,\nHope for Paws Team`,
    });

    res.status(200).json({ message: 'Verification code sent to your email.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
};

// Verify Code Controller
const verifyCode = async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || user.verificationCode.trim() !== code.trim()) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // Check if the verification code has expired
    if (user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ error: 'Verification code has expired.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.verificationCode = undefined; // Clear the verification code
    user.verificationCodeExpires = undefined; // Clear expiration
    await user.save();

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'An error occurred while resetting your password.' });
  }
};

const signIn = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, username: user.username, isVeterinarian: user.isVeterinarian },
      process.env.JWT_SECRET,
      { expiresIn: '5d' }
    );

    res.status(200).json({
      message: 'Sign in successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        city: user.city,
        about: user.about,
        isVeterinarian: user.isVeterinarian,
      },
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ error: 'Server error during sign in' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { id, phone, city, about } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'User ID is required to update profile' });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    user.phone = phone || user.phone;
    user.city = city || user.city;
    user.about = about || user.about;

    await user.save();

    // ✅ Ensure all fields are returned
    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone || "",  // Explicitly include phone, city, about
        city: user.city || "",
        about: user.about || "",
        userType: user.userType
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  const { id, currentPassword, newPassword } = req.body;

  // Validate inputs
  if (!id || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Find the user by ID
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the current password matches the user's existing password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash the new password and update it in the database
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'An error occurred while changing the password' });
  }
};

const signOut = async (req, res) => {
  try {
    res.status(200).json({ message: 'User signed out successfully' });
  } catch (error) {
    console.error('Error during sign out:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const resendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  if (!email.toLowerCase().endsWith('@gmail.com')) {
    return res.status(400).json({ message: 'Please use a valid Gmail address.' });
  }

  try {
    console.log('🔄 Resend OTP request for:', email);
    
    // Check if there's an existing unverified user
    const existingTempUser = await TempUser.findOne({ email });
    if (!existingTempUser) {
      console.log('❌ No TempUser found for resend OTP:', email);
      return res.status(404).json({ message: 'No pending verification found for this email. Please register first.' });
    }

    console.log('✅ Found existing TempUser for resend:', { email, tempUserId: existingTempUser._id, currentExpiry: existingTempUser.verificationCodeExpires });

    // Check if user is already verified
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already verified, cannot resend OTP:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate new OTP
    const newOtp = crypto.randomBytes(3).toString('hex');
    console.log('🔢 Generated new OTP for resend:', newOtp);

    // Update the existing temp user with new OTP and expiration
    existingTempUser.verificationCode = newOtp;
    existingTempUser.verificationCodeExpires = Date.now() + 2 * 60 * 1000; // 2 minutes
    await existingTempUser.save();
    console.log('✅ TempUser updated with new OTP:', { email, tempUserId: existingTempUser._id, newExpiry: existingTempUser.verificationCodeExpires });

    // Validate email configuration
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.error('❌ Email configuration missing:', {
        GMAIL_USER: !!process.env.GMAIL_USER,
        GMAIL_PASS: !!process.env.GMAIL_PASS
      });
      return res.status(500).json({ message: 'Email service configuration error' });
    }

    // Send new OTP email with detailed error handling
    try {
      const mailResult = await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Hope for Paws: Your New Email Verification Code',
        text: `Hello ${existingTempUser.username || 'there'},\n\nAs requested, here is your new One-Time Password (OTP) to verify your email address:\n\nOTP Code: ${newOtp}\n\nThis code is valid for 2 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nHope for Paws Team`,
      });
      console.log('📧 Email sent successfully for resend:', mailResult);
      console.log('📧 New OTP sent to email:', email);
    } catch (emailError) {
      console.error('❌ Email sending failed for resend:', {
        error: emailError.message,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
        responseCode: emailError.responseCode
      });
      return res.status(500).json({ message: 'Failed to send email. Please try again later.' });
    }

    res.status(200).json({ message: 'New OTP code sent to your email. Please verify to complete registration.' });
  } catch (error) {
    console.error('❌ Resend OTP error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ message: 'Server error during resend OTP' });
  }
},

googleLogins = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "No credential provided" });
    }

    const CLIENT_ID = 'https://495806156812-uqmc0tenm7i0ljnjdo3ick68d3v053sl.apps.googleusercontent.com/';
    const client = new OAuth2Client(CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    if (!email) {
      return res.status(400).json({ message: "Google email not found" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Instead of creating user, return needsUserType
      return res.status(200).json({
        needsUserType: true,
        email,
        username: name
      });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, isVeterinarian: user.isVeterinarian },
      process.env.JWT_SECRET,
      { expiresIn: '5d' }
    );

    return res.status(200).json({
      message: 'Sign in successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        city: user.city,
        about: user.about,
        isVeterinarian: user.isVeterinarian,
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// New controller for completing Google registration
const completeGoogleRegistration = async (req, res) => {
  try {
    const { email, username, isVeterinarian } = req.body;
    if (!email || !username || typeof isVeterinarian !== 'boolean') {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    user = await User.create({
      username,
      email,
      password: hashedPassword,
      isVeterinarian,
    });
    const token = jwt.sign(
      { id: user._id, username: user.username, isVeterinarian: user.isVeterinarian },
      process.env.JWT_SECRET,
      { expiresIn: '5d' }
    );
    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        city: user.city,
        about: user.about,
        isVeterinarian: user.isVeterinarian,
      },
    });
  } catch (error) {
    console.error('Complete Google Registration Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  signUp,
  verifyRegistrationOTP,
  signIn,
  validateToken,
  forgotPassword,
  verifyCode,
  updateProfile,
  signOut,
  changePassword,
  resendOTP,
  googleLogins,
  completeGoogleRegistration,
};


