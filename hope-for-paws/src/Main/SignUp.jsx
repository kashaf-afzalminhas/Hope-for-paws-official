import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import Paws from '/Hopeforpaws.jpg';
import { AUTH_BASE_URL } from '../config';

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isVeterinarian, setIsVeterinarian] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${AUTH_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, isVeterinarian }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        navigate('/verify-registration', { state: { email: data.email || email } });
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      setLoading(false);
      setError('An error occurred while signing up. Please try again.');
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
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2 border border-[#a07855] text-[#4E3B31] rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-[#4E3B31] mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2 border border-[#a07855] text-[#4E3B31] rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="isVeterinarian" className="block text-sm font-medium text-[#4E3B31] mb-1">I am registering as:</label>
              <select
                id="isVeterinarian"
                name="isVeterinarian"
                value={isVeterinarian}
                onChange={(e) => setIsVeterinarian(e.target.value === 'true')}
                className="block w-full px-3 py-2 border border-[#a07855] text-[#4E3B31] rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm"
              >
                <option value="false">Regular User</option>
                <option value="true">Veterinarian</option>
              </select>
              {isVeterinarian && (
                <p className="mt-1 text-sm text-[#6b493d]">
                  Your status as a Veterinarian will be displayed next to your name in posts and comments.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#6b493d] hover:bg-[#5a3c32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6b493d]"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
          
          <p className="text-sm text-[#4E3B31] text-center mt-4">
            Already have an account?{' '}
            <NavLink to="/signin" className="font-medium text-[#6b493d] hover:text-[#a07855]">
              Sign in
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;