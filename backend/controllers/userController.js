const User = require('../models/User');
const TempUser = require('../models/TempUser');
const Seller = require('../models/Seller');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { OAuth2Client } = require("google-auth-library");

dotenv.config();

// Email Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const ADMIN_EMAILS = [
  'kashafafzal909@gmail.com',
  'laibaanoor1616@gmail.com',
  'sahabnoor193@gmail.com'
];

// ==========================================
// 1. SIGN UP (Step 1: Save to TempUser)
// ==========================================
const signUp = async (req, res) => {
  const { username, email, password, isVeterinarian, phone, userType, sellerName, cnic, location } = req.body;
  
  // 1. Basic Validation
  if (!username || !email || !password || !phone) {
    return res.status(400).json({ message: 'All fields (username, email, password, phone) are required' });
  }

  // 2. Validate User Type
  const finalUserType = userType === 'seller' ? 'seller' : 'user';

  // 3. Validate Seller Fields
  if (finalUserType === 'seller') {
    if (!sellerName || !cnic || !location) {
      return res.status(400).json({ message: 'Seller Name, CNIC, and Location are required for sellers.' });
    }
  }

  // 4. Validate Phone & Email
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone)) return res.status(400).json({ message: 'Invalid international phone number' });
  if (!email.toLowerCase().endsWith('@gmail.com')) return res.status(400).json({ message: 'Please use a valid Gmail address.' });
  if (ADMIN_EMAILS.includes(email.toLowerCase())) return res.status(403).json({ message: 'Reserved email.' });

  try {
    // 5. Check if User Exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // 6. Prepare Data (Hash Password, Generate OTP)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = crypto.randomBytes(3).toString('hex');

    // 7. Handle TempUser (Update if exists, else Create)
    let tempUser = await TempUser.findOne({ email });
    
    const tempUserData = {
      username,
      email,
      password: hashedPassword,
      isVeterinarian: isVeterinarian || false,
      phone,
      userType: finalUserType,
      verificationCode: otp,
      verificationCodeExpires: Date.now() + 2 * 60 * 1000, // 2 mins
      // Save Seller Info
      sellerName: finalUserType === 'seller' ? sellerName : undefined,
      cnic: finalUserType === 'seller' ? cnic : undefined,
      location: finalUserType === 'seller' ? location : undefined,
    };

    if (tempUser) {
      Object.assign(tempUser, tempUserData);
      await tempUser.save();
    } else {
      tempUser = new TempUser(tempUserData);
      await tempUser.save();
    }

    // 8. Send OTP Email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Hope for Paws: Verification Code',
      text: `Your OTP code is: ${otp}\nIt expires in 2 minutes.`,
    });

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

  try {
    const tempUser = await TempUser.findOne({ email });
    
    if (!tempUser) return res.status(404).json({ error: 'Registration session expired or invalid.' });
    if (tempUser.verificationCode !== otp) return res.status(400).json({ error: 'Invalid OTP.' });
    if (tempUser.verificationCodeExpires < Date.now()) return res.status(400).json({ error: 'OTP expired.' });

    // 1. Create User
    const newUser = new User({
      username: tempUser.username,
      email: tempUser.email,
      password: tempUser.password,
      isVeterinarian: tempUser.isVeterinarian,
      phone: tempUser.phone,
      phoneVerified: true,
      isSeller: tempUser.userType === 'seller',
      sellerStatus: tempUser.userType === 'seller' ? 'pending' : null,
      canBuy: tempUser.userType !== 'seller', // Sellers might be restricted from buying, or set true if allowed
    });

    await newUser.save();

    // 2. Create Seller Profile (If applicable)
    if (tempUser.userType === 'seller') {
      try {
        await Seller.create({
          userId: newUser._id,
          name: tempUser.sellerName,
          email: tempUser.email,
          cnic: tempUser.cnic,
          location: tempUser.location,
          status: 'pending'
        });
      } catch (err) {
        console.error("Failed to create Seller Profile:", err);
      }
    }

    // 3. Cleanup & Token
    await TempUser.deleteOne({ email });

    const token = jwt.sign(
      { 
        id: newUser._id, 
        username: newUser.username, 
        isVeterinarian: newUser.isVeterinarian,
        isSeller: newUser.isSeller 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Verified successfully.',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        isSeller: newUser.isSeller,
        sellerStatus: newUser.sellerStatus
      }
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
  
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

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

    res.status(200).json({
      message: 'Sign in successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        phone: user.phone,
        isSeller: user.isSeller || false,
        sellerStatus: user.sellerStatus || null,
        isAdmin: user.isAdmin,
      },
    });

  } catch (error) {
    console.error('SignIn Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ==========================================
// 4. GOOGLE AUTH (Updated for Seller)
// ==========================================
const googleLogins = async (req, res) => {
  try {
    const { credential } = req.body;
    const client = new OAuth2Client("495806156812-uqmc0tenm7i0ljnjdo3ick68d3v053sl.apps.googleusercontent.com");
    const ticket = await client.verifyIdToken({ 
      idToken: credential, 
      audience: "495806156812-uqmc0tenm7i0ljnjdo3ick68d3v053sl.apps.googleusercontent.com" 
    });
    const { email, name } = ticket.getPayload();

    let user = await User.findOne({ email });
    
    // If user doesn't exist, ask frontend to get UserType
    if (!user) {
      return res.status(200).json({ needsUserType: true, email, username: name });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, isVeterinarian: user.isVeterinarian, isSeller: user.isSeller },
      process.env.JWT_SECRET,
      { expiresIn: '5d' }
    );

    return res.status(200).json({ message: 'Sign in successful', token, user });

  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ message: "Error" });
  }
};

const completeGoogleRegistration = async (req, res) => {
  try {
    const { email, username, isVeterinarian, userType, sellerName, cnic, location } = req.body;
    
    if (!email || !username) return res.status(400).json({ message: 'Missing fields' });
    
    const isSeller = userType === 'seller';
    
    if (isSeller) {
      if (!sellerName || !cnic || !location) return res.status(400).json({ message: 'Seller details required' });
    }
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User exists' });

    const randomPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user = await User.create({
      username,
      email,
      password: hashedPassword,
      isVeterinarian,
      isSeller, 
      phone: "", 
      phoneVerified: false, 
    });
    
    if (isSeller) {
      await Seller.create({
        userId: user._id,
        name: sellerName,
        email: email,
        cnic: cnic,
        location: location,
        status: 'pending'
      });
    }
    
    const token = jwt.sign(
      { id: user._id, username: user.username, isVeterinarian, isSeller },
      process.env.JWT_SECRET,
      { expiresIn: '5d' }
    );

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user
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

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Hope for Paws: New OTP',
      text: `Your new OTP: ${newOtp}`,
    });
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
    res.json({ user });
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
    const { id, phone, city, about } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (phone && phone !== user.phone) {
      const exists = await User.findOne({ phone, _id: { $ne: id } });
      if (exists) return res.status(400).json({ message: 'Phone taken' });
      user.phone = phone;
      user.phoneVerified = true;
    }
    user.city = city || user.city;
    user.about = about || user.about;
    await user.save();

    return res.status(200).json({ message: 'Updated', user });
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
      subject: 'Password Reset',
      text: `Code: ${code}`,
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
const uploadProfileImage = async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: "No file" });
    const user = await User.findByIdAndUpdate(req.user.id, { profileImage: `/uploads/profile-images/${req.file.filename}` }, { new: true });
    res.json({ success: true, data: { profileImage: user.profileImage } });
};
const removeProfileImage = async (req, res) => {
    await User.findByIdAndUpdate(req.user.id, { profileImage: "" });
    res.json({ success: true, message: "Removed" });
};
const getUserPublicProfile = async (req, res) => {
    const user = await User.findById(req.params.id).select("username email profileImage phone city about isVeterinarian");
    res.json({ success: true, data: user });
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
const addPhoneNumber = async (req, res) => {
    const { phone } = req.body;
    const user = await User.findById(req.user.id);
    user.phone = phone;
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
  addPhoneNumber,
  verifyResetCode: verifyResetCodeRoute,
  resendResetCode
};