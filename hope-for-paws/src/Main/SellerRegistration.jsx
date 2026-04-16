import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ Import AuthContext
import { applyAsSeller, updateLocalUserAsSeller } from '../services/sellerService';

const SellerRegistration = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth(); // ✅ Get User & Update function from Context
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cnic: '',
    location: ''
  });

  const [errors, setErrors] = useState({});

  // ✅ FIXED: Check Context instead of localStorage for Auto-Redirect
  useEffect(() => {
    if (user && user.isSeller) {
      // If already a seller, send straight to dashboard
      navigate('/seller/dashboard');
    }
  }, [user, navigate]);

  // ✅ FIXED: Pre-fill email from Context User
  useEffect(() => {
    if (user && user.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2 || formData.name.length > 100) {
      newErrors.name = 'Name must be 2-100 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }

    if (!formData.cnic.trim()) {
      newErrors.cnic = 'CNIC is required';
    } else if (!/^[0-9]{5}-[0-9]{7}-[0-9]$/.test(formData.cnic)) {
      newErrors.cnic = 'CNIC format should be 12345-1234567-1';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    } else if (formData.location.length < 2 || formData.location.length > 200) {
      newErrors.location = 'Location must be 2-200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCnicChange = (e) => {
    let value = e.target.value.replace(/[^0-9-]/g, '');
    
    // Auto-format CNIC as user types
    const digits = value.replace(/-/g, '');
    if (digits.length <= 5) {
      value = digits;
    } else if (digits.length <= 12) {
      value = `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else {
      value = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
    }

    setFormData(prev => ({ ...prev, cnic: value }));
    if (errors.cnic) {
      setErrors(prev => ({ ...prev, cnic: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      // 1. Send API Request
      const result = await applyAsSeller(formData);
      
      // BUG-008 FIX: updateLocalUserAsSeller returns the updated user object.
      // Use that same object to update the context — both updates are now in sync
      // with no gap between localStorage and React Context state.
      const updatedUser = updateLocalUserAsSeller('pending');

      // 2. Update Context from the same merged object (no race condition)
      if (updatedUser) {
        updateUser(updatedUser);
      }
      
      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/seller/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit seller application');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Your seller application has been submitted successfully. 
            Our team will review your application and update your status soon.
          </p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Become a Seller</h1>
          <p className="text-gray-600 mb-6">
            Register as a seller to list your pet products on Hope for Paws.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Business/Shop Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your business name"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* CNIC */}
            <div>
              <label htmlFor="cnic" className="block text-sm font-medium text-gray-700 mb-1">
                CNIC Number *
              </label>
              <input
                type="text"
                id="cnic"
                name="cnic"
                value={formData.cnic}
                onChange={handleCnicChange}
                placeholder="12345-1234567-1"
                maxLength={15}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
                  errors.cnic ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.cnic && <p className="mt-1 text-sm text-red-500">{errors.cnic}</p>}
              <p className="mt-1 text-xs text-gray-500">Format: 12345-1234567-1</p>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Application'
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 text-center">
            By registering as a seller, you agree to our terms and conditions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerRegistration;