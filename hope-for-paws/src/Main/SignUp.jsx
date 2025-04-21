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
        body: JSON.stringify({
          username,
          email,
          password,
          isVeterinarian,
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        console.log('OTP sent successfully:', data);
        // Navigate to verification page with email
        navigate('/verify-registration', { 
          state: { email: data.email || email } 
        });
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error:', error);
      setError('An error occurred while signing up. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F4ED] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="flex flex-col items-center">
          <img className="h-24 w-auto mb-4" src={Paws} alt="Hope For Paws" />
          <h2 className="text-3xl font-bold text-[#4E3B31] text-center">Create your account</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="rounded-md space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#4E3B31]">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-[#a07855] placeholder-[#a07855] text-[#4E3B31] rounded-md focus:outline-none focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm"
                placeholder="Username"
              />
            </div>
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-[#4E3B31]">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-[#a07855] placeholder-[#a07855] text-[#4E3B31] rounded-md focus:outline-none focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#4E3B31]">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-[#a07855] placeholder-[#a07855] text-[#4E3B31] rounded-md focus:outline-none focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm"
                placeholder="Password"
              />
            </div>
            <div>
              <label htmlFor="isVeterinarian" className="block text-sm font-medium text-[#4E3B31]">I am registering as:</label>
              <select
                id="isVeterinarian"
                name="isVeterinarian"
                value={isVeterinarian}
                onChange={(e) => setIsVeterinarian(e.target.value === 'true')}
                className="mt-1 block w-full px-3 py-2 border border-[#a07855] text-[#4E3B31] rounded-md focus:outline-none focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm"
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#6b493d] hover:bg-[#5a3c32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6b493d] transition-colors"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>
        <p className="text-sm text-[#4E3B31] text-center">
          Already have an account?{' '}
          <NavLink to="/signin" className="font-medium text-[#6b493d] hover:text-[#a07855] transition-colors">
            Sign in
          </NavLink>
        </p>
      </div>
    </div>
  );
};

export default SignUp;