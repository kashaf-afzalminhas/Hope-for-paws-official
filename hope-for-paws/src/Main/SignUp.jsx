import { useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import Paws from '/Hopeforpaws.jpg';
import { AUTH_BASE_URL, GOOGLE_CLIENT_ID } from '../config';
import { motion } from "framer-motion";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import UserTypeModal from '../Components/UserTypeModal';
import { COUNTRY_CODES } from '../utils/constants';

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+92');
  const [userType, setUserType] = useState('user'); // 'user', 'veterinarian', 'seller'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Country codes data
  const countryCodes = COUNTRY_CODES;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 120 }
    }
  };

  const performPostLoginRedirect = (userObj) => {
    const savedRedirect = (() => {
      try {
        const item = sessionStorage.getItem('redirectAfterAuth');
        return item ? JSON.parse(item) : null;
      } catch { return null; }
    })();

    const targetPath = location.state?.from || savedRedirect?.from || "/";
    const openCreate = location.state?.openCreate || savedRedirect?.openCreate || false;

    if (openCreate) {
      sessionStorage.setItem('openAdoptionCreate', 'true');
    }

    if (userObj.isSeller && userObj.sellerStatus === 'incomplete') {
      navigate('/seller/onboard');
    } else if (!userObj.phone || !userObj.phoneVerified) {
      navigate('/profile');
    } else {
      sessionStorage.removeItem('redirectAfterAuth');
      navigate(targetPath, { state: { openCreate } });
    }
    window.location.reload();
  };

  // Email validation
  const validateEmail = (value) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@gmail\.com$/;
    if (!emailRegex.test(value)) return 'Please enter a valid Gmail address';
    return '';
  };

  // Password validation
  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    const errors = [];
    if (value.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(value)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(value)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(value)) errors.push('One number');
    if (!/[^A-Za-z0-9]/.test(value)) errors.push('One special character');
    return errors.length ? errors.join(', ') : '';
  };

  // Phone validation
  const validatePhone = (phoneNumber, code) => {
    if (!phoneNumber || !code) return 'Phone number is required';
    if (!/^\d+$/.test(phoneNumber)) return 'Phone number must contain digits only';

    const countryRules = {
      '+92': { min: 10, max: 10, label: 'Pakistan' },
      '+1': { min: 10, max: 10, label: 'US/Canada' },
      '+44': { min: 10, max: 10, label: 'United Kingdom' },
      '+91': { min: 10, max: 10, label: 'India' }
    };
    const rule = countryRules[code];
    if (rule && (phoneNumber.length < rule.min || phoneNumber.length > rule.max)) {
      if (rule.min === rule.max) {
        return `${rule.label} numbers must be exactly ${rule.min} digits after ${code}`;
      }
      return `${rule.label} numbers must be ${rule.min}-${rule.max} digits after ${code}`;
    }

    const fullPhone = code + phoneNumber;
    const phoneRegex = /^\+[1-9]\d{1,14}$/; // International phone number format
    if (!phoneRegex.test(fullPhone)) return 'Please enter a valid phone number';
    if (phoneNumber.length < 7 || phoneNumber.length > 15) return 'Phone number must be between 7-15 digits';
    return '';
  };

  // Handlers for live validation
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailTouched(true);
    setEmailError(validateEmail(e.target.value));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordTouched(true);
    setPasswordError(validatePassword(e.target.value));
  };

  const handlePhoneChange = (e) => {
    let phoneValue = e.target.value;

    // Remove leading zero if country code is selected
    if (countryCode && phoneValue.startsWith('0')) {
      phoneValue = phoneValue.substring(1);
    }

    setPhone(phoneValue);
    setPhoneTouched(true);
    setPhoneError(validatePhone(phoneValue, countryCode));
  };

  const handleCountryCodeChange = (e) => {
    const newCountryCode = e.target.value;
    let phoneValue = phone;

    // Remove leading zero when country code changes
    if (newCountryCode && phoneValue.startsWith('0')) {
      phoneValue = phoneValue.substring(1);
      setPhone(phoneValue);
    }

    setCountryCode(newCountryCode);
    setPhoneTouched(true);
    setPhoneError(validatePhone(phoneValue, newCountryCode));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setEmailError(validateEmail(email));
    setPasswordError(validatePassword(password));
    setPhoneError(validatePhone(phone, countryCode));

    if (validateEmail(email) || validatePassword(password) || validatePhone(phone, countryCode)) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${AUTH_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          isVeterinarian: userType === 'veterinarian',
          userType: userType === 'seller' ? 'seller' : 'user',
          phone: countryCode + phone
        }),
      });
      const data = await response.json();
      setLoading(false);
      if (response.ok) {
        navigate('/verify-registration', {
          state: {
            email: data.email || email,
            from: location.state?.from,
            openCreate: location.state?.openCreate
          }
        });
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setLoading(false);
      setError('An error occurred while signing up. Please try again.');
    }
  };

  // Password requirements for dynamic inline validation
  const passwordChecks = [
    { label: '8+ characters', valid: password.length >= 8 },
    { label: 'Uppercase', valid: /[A-Z]/.test(password) },
    { label: 'Lowercase', valid: /[a-z]/.test(password) },
    { label: 'Number', valid: /[0-9]/.test(password) },
    { label: 'Special', valid: /[^A-Za-z0-9]/.test(password)},
  ];

  // Filter to show only unmet requirements
  const unmetRequirements = passwordChecks.filter(check => !check.valid);

  const googleLoginHandler = async (googleResponse) => {
    setLoading(true);
    setError("");
    try {
      let response = await fetch(`${AUTH_BASE_URL}/login-google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: googleResponse.credential }),
      });
      let data = await response.json();

      if (response.ok && data.requiresLinkConfirmation) {
        const shouldLink = window.confirm(
          "An account with this email already exists. Do you want to link your Google account to it?"
        );
        if (!shouldLink) {
          setLoading(false);
          setError("Google account linking was cancelled.");
          return;
        }

        response = await fetch(`${AUTH_BASE_URL}/login-google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credential: googleResponse.credential,
            confirmLinking: true
          }),
        });
        data = await response.json();
      }

      setLoading(false);
      if (response.ok) {
        if (data.needsUserType) {
          setPendingGoogleUser({ email: data.email, username: data.username, googleId: data.googleId });
          setShowUserTypeModal(true);
          return;
        }
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        performPostLoginRedirect(data.user);
      } else {
        setError(data.message || "Google registration failed");
      }
    } catch {
      setLoading(false);
      setError("An error occurred during Google registration");
    }
  };

  const handleUserTypeSelect = async (userTypeSelected) => {
    if (!pendingGoogleUser) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${AUTH_BASE_URL}/complete-google-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pendingGoogleUser.email,
          username: pendingGoogleUser.username,
          googleId: pendingGoogleUser.googleId,
          isVeterinarian: userTypeSelected === 'veterinarian',
          userType: userTypeSelected === 'seller' ? 'seller' : 'user'
        }),
      });
      const data = await response.json();
      setLoading(false);
      setShowUserTypeModal(false);
      setPendingGoogleUser(null);
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        performPostLoginRedirect(data.user);
      } else {
        setError(data.message || "Google registration failed");
      }
    } catch {
      setLoading(false);
      setError("An error occurred during Google registration");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F4ED] p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        {/* Logo Section with full-width beige background */}
        <div className="w-full h-72 bg-[#F8F4ED] py-6 mb-2 flex flex-col items-center">
          <img
            className="w-full h-72 max-w-sm:max-w-md object-cover"
            src={Paws}
            alt="Hope For Paws Logo"
          />
        </div>

        {/* Form Section */}
        <div className="p-6">
          <h2 className="text-xl font-extrabold text-black mb-6 mt-6 text-center">Create Your Account</h2>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-[#4E3B31] mb-1">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full px-3 py-2 border border-[#a07855] text-[#4E3B31] rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm"
                placeholder="Enter your username"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-[#4E3B31] mb-1">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={handleEmailChange}
                onBlur={() => setEmailTouched(true)}
                className={`block w-full px-3 py-2 border ${emailTouched && emailError ? 'border-red-500' : 'border-[#a07855]'} text-[#4E3B31] rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm`}
                placeholder="Enter your email"
              />
              {emailTouched && emailError && (
                <p className="text-xs text-red-600 mt-1">{emailError}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-[#4E3B31] mb-1">Phone Number</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={handleCountryCodeChange}
                  className="px-3 py-2 border border-[#a07855] text-[#4E3B31] rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm min-w-[120px]"
                >
                  {countryCodes.map((country, index) => (
                    <option key={index} value={country.code}>
                      {country.flag} {country.code}
                    </option>
                  ))}
                </select>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  onBlur={() => setPhoneTouched(true)}
                  className={`flex-1 px-3 py-2 border ${phoneTouched && phoneError ? 'border-red-500' : 'border-[#a07855]'} text-[#4E3B31] rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm`}
                  placeholder="XXXXXXXXXX"
                />
              </div>
              {phoneTouched && phoneError && (
                <p className="text-xs text-red-600 mt-1">{phoneError}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-[#4E3B31] mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => setPasswordTouched(true)}
                  className={`block w-full px-3 py-2 pr-10 border ${passwordTouched && passwordError ? 'border-red-500' : 'border-[#a07855]'} text-[#4E3B31] rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6b493d] hover:text-[#4E3B31] focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordTouched && passwordError && (
                <p className="text-xs text-red-600 mt-1">Password must have: {passwordError}</p>
              )}
              {/* Show completion message when all requirements are met */}
              {password && unmetRequirements.length === 0 && (
                <div className="mt-2 flex items-center text-green-600 text-xs">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Password meets all requirements
                </div>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="userType" className="block text-sm font-medium text-[#4E3B31] mb-1">I am registering as:</label>
              <select
                id="userType"
                name="userType"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="block w-full px-3 py-2 border border-[#a07855] text-[#4E3B31] rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm"
              >
                <option value="user">Regular User</option>
                <option value="veterinarian">Veterinarian</option>
                <option value="seller">Seller</option>
              </select>
              {userType === 'veterinarian' && (
                <p className="mt-1 text-sm text-[#6b493d]">
                  Your status as a Veterinarian will be displayed next to your name in posts and comments.
                </p>
              )}
              {userType === 'seller' && (
                <p className="mt-1 text-sm text-[#6b493d]">
                  As a seller, you can list pet products for sale. Your application will be reviewed by our team.
                </p>
              )}
            </div>

            {/* Seller Fields - Removed as they are now collected post-registration */}

            <button
              type="submit"
              disabled={loading || !!emailError || !!passwordError || !!phoneError}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#6b493d] hover:bg-[#5a3c32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6b493d] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <motion.div variants={itemVariants} className="flex justify-center mt-4">
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                  <GoogleLogin
                    onSuccess={(response) => googleLoginHandler(response)}
                    onError={(error) => console.log(error)}
                    theme="filled_blue"
                    shape="pill"
                    size="large"
                    text="continue_with"
                    width="300"
                    logo_alignment="left"
                    className="!rounded-xl !overflow-hidden hover:!shadow-md transition-shadow"
                  />
                </GoogleOAuthProvider>
              </motion.div>

          <UserTypeModal
            open={showUserTypeModal}
            onClose={() => setShowUserTypeModal(false)}
            onSelect={handleUserTypeSelect}
            username={pendingGoogleUser?.username}
          />

          <p className="text-sm text-[#4E3B31] text-center mt-4">
            Already have an account?{' '}
            <NavLink to="/signin" state={location.state} className="font-medium text-[#6b493d] hover:text-[#a07855]">
              Sign in
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
