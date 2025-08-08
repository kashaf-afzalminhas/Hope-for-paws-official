import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { AUTH_BASE_URL } from '../config';
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import Paws from '/Hopeforpaws.jpg';
import UserTypeModal from '../Components/UserTypeModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const navigate = useNavigate();

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 120 }
    }
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    const savedPassword = localStorage.getItem('savedPassword');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';

    if (savedRememberMe) {
      setEmail(savedEmail || '');
      setPassword(savedPassword || '');
      setRememberMe(true);
    }
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${AUTH_BASE_URL}/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          if (data.user && data.user.isAdmin) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/admin-dashboard');
            window.location.reload();
            return;
          }
          if (rememberMe) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('savedEmail', email);
            localStorage.setItem('savedPassword', password);
          } else {
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user));
          }
          navigate('/');
          window.location.reload();
        } else {
          setError('Login failed: No token received.');
        }
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch {
      setLoading(false);
      setError('An error occurred while signing in');
    }    
  };

  const googleLoginHandler = async (googleResponse) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${AUTH_BASE_URL}/login-google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: googleResponse.credential }),
      });
      const data = await response.json();
      setLoading(false);
      if (response.ok) {
        if (data.needsUserType) {
          setPendingGoogleUser({ email: data.email, username: data.username });
          setShowUserTypeModal(true);
          return;
        }
        if (data.user && data.user.isAdmin) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          navigate('/admin-dashboard');
          window.location.reload();
          return;
        }
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
        window.location.reload();
      } else {
        setError(data.message || "Google login failed");
      }
    } catch {
      setLoading(false);
      setError("An error occurred during Google login");
    }
  };

  const handleUserTypeSelect = async (isVeterinarian) => {
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
          isVeterinarian,
        }),
      });
      const data = await response.json();
      setLoading(false);
      setShowUserTypeModal(false);
      setPendingGoogleUser(null);
      if (response.ok) {
        if (data.user && data.user.isAdmin) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          navigate('/admin-dashboard');
          window.location.reload();
          return;
        }
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
        window.location.reload();
      } else {
        setError(data.message || "Google registration failed");
      }
    } catch {
      setLoading(false);
      setError("An error occurred during Google registration");
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    if (!email || !email.endsWith('@gmail.com')) {
      setError('Please enter a valid Gmail address to reset password.');
      return;
    }
    try {
      const response = await fetch(`${AUTH_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('resetEmail', email); // Store for next step
        navigate('/verify-code');
      } else {
        setError(data.error || 'Failed to send verification code.');
      }
    } catch {
      setError('An error occurred while sending the verification code.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F4ED] p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Image Section - Visible on both mobile and desktop */}
        <div className="w-full sm:h-72 md:w-1/2 h-64 md:h-auto bg-[#F8F4ED] relative">
          <img 
            src={Paws} 
            alt="Hope For Paws" 
            className="absolute h-72 inset-0 w-full md:h-full object-cover"
            style={{ objectFit: 'cover' }}
          />
        </div>

        {/* Form Section */}
        <div className="w-full md:w-1/2 p-8 mt-6">
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex flex-col items-center space-y-2">
              <h2 className="text-2xl font-bold text-[#4E3B31]">Welcome back</h2>
              <p className="text-sm text-[#6b493d] text-center">
                Sign in to continue your journey of helping animals
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email-address" className="block text-sm font-medium text-[#4E3B31] mb-1">Email address</label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-[#a07855] text-[#4E3B31] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b493d] focus:border-transparent text-sm transition-colors"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[#4E3B31] mb-1">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-[#a07855] text-[#4E3B31] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b493d] focus:border-transparent text-sm transition-colors"
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
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="h-4 w-4 rounded border-[#a07855] text-[#6b493d] focus:ring-[#6b493d]"
                  />
                  <label htmlFor="remember-me" className="ml-2 text-sm text-[#4E3B31]">Remember me</label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-[#6b493d] hover:text-[#a07855] transition-colors font-medium bg-transparent border-none p-0 m-0 cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-[#6b493d] hover:bg-[#5a3c32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6b493d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
            <motion.div variants={itemVariants} className="flex justify-center">
              <GoogleOAuthProvider clientId="495806156812-uqmc0tenm7i0ljnjdo3ick68d3v053sl.apps.googleusercontent.com">
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

            <p className="text-sm text-[#4E3B31] text-center pt-4 border-t border-gray-100">
              Don&apos;t have an account?{' '}
              <NavLink to="/signup" className="font-medium text-[#6b493d] hover:text-[#a07855] transition-colors">
                Sign up
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
