import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AUTH_BASE_URL } from '../config';
import Paws from '/Hopeforpaws.jpg';

const VerifyRegistration = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill email if passed from the SignUp page
  React.useEffect(() => {
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${AUTH_BASE_URL}/verify-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store the token and user data
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        setMessage('Email verified successfully! Redirecting to sign in...');
        setTimeout(() => navigate('/signin'), 2000);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (error) {
      setError('An error occurred while verifying the OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F4ED] p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Image Section - Visible on both mobile and desktop */}
        <div className="w-full md:w-1/2 h-48 md:h-auto bg-[#F8F4ED] relative">
          <img 
            src={Paws} 
            alt="Hope For Paws" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Form Section */}
        <div className="w-full md:w-1/2 p-8">
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex flex-col items-center space-y-2">
              <h2 className="text-2xl font-bold text-[#4E3B31]">Verify Your Email</h2>
              <p className="text-sm text-[#6b493d] text-center">
                Please enter the verification code sent to your email
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              {message && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm" role="alert">
                  <span className="block sm:inline">{message}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#4E3B31] mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-[#a07855] text-[#4E3B31] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b493d] focus:border-transparent text-sm transition-colors"
                    required
                    disabled={location.state?.email}
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-[#4E3B31] mb-1">Verification Code</label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-3 py-2 border border-[#a07855] text-[#4E3B31] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b493d] focus:border-transparent text-sm transition-colors"
                    required
                    placeholder="Enter verification code"
                  />
                  <p className="mt-2 text-xs text-[#6b493d]">
                    Please check your email inbox for the verification code
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-[#6b493d] hover:bg-[#5a3c32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6b493d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyRegistration;