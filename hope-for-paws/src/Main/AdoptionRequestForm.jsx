import React, { useState, useEffect } from 'react';
import { useAdoption } from '../context/AdoptionContext';
import { useAuth } from '../context/AuthContext';

const AdoptionRequestForm = ({ postId, onClose }) => {
  const { requestAdoption } = useAdoption();
  const { user } = useAuth();
  const [effectiveUser, setEffectiveUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for user in localStorage/sessionStorage if not in context
  useEffect(() => {
    if (!user) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
        console.log('AdoptionRequestForm - Stored user found:', storedUser);
        if (storedUser) {
          setEffectiveUser(storedUser);
          // Pre-fill form with user data if available
          setFormData(prev => ({
            ...prev,
            name: storedUser.name || '',
            email: storedUser.email || ''
          }));
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    } else {
      setEffectiveUser(user);
      // Pre-fill form with user data if available
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use effectiveUser instead of user
      if (!effectiveUser) {
        throw new Error('You must be logged in to request adoption');
      }

      // Validate all required fields
      if (!formData.name || !formData.email || !formData.phone || !formData.message) {
        throw new Error('All fields are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate phone number (basic validation)
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(formData.phone)) {
        throw new Error('Please enter a valid phone number');
      }

      console.log('Submitting adoption request with data:', formData);
      await requestAdoption(postId, formData);
      
      // Show success message
      alert('Adoption request submitted successfully! The pet owner will review your request.');
      
      // Close the form
      onClose();
    } catch (err) {
      console.error('Error submitting adoption request:', err);
      setError(err.message || 'Failed to submit adoption request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-[#6b493d] mb-4">Request Adoption</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6b493d] focus:ring-[#6b493d]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6b493d] focus:ring-[#6b493d]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6b493d] focus:ring-[#6b493d]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              name="message"
              required
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#6b493d] focus:ring-[#6b493d]"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#6b493d] text-white rounded-md hover:bg-[#5a3d32] disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdoptionRequestForm;