import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { AUTH_BASE_URL } from '../config';
import Paws from '/Hopeforpaws.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${AUTH_BASE_URL}/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        if (data.token) {
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
    } catch (error) {
      setLoading(false);
      setError('An error occurred while signing in');
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
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-[#a07855] text-[#4E3B31] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b493d] focus:border-transparent text-sm transition-colors"
                    placeholder="Enter your password"
                  />
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
                <NavLink 
                  to='/forgotpass' 
                  className="text-sm text-[#6b493d] hover:text-[#a07855] transition-colors font-medium"
                >
                  Forgot Password?
                </NavLink>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-[#6b493d] hover:bg-[#5a3c32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6b493d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="text-sm text-[#4E3B31] text-center pt-4 border-t border-gray-100">
              Don't have an account?{' '}
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
