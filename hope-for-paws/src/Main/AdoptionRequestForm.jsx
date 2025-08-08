import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
  const [petHistoryImage, setPetHistoryImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setPetHistoryImage(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPetHistoryImage(null);
    setImagePreview(null);
    // Reset the file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
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

      // Remove image required validation
      // Validate all required fields
      if (!formData.name || !formData.email || !formData.phone || !formData.message) {
        throw new Error('All fields are required');
      }
      // Remove image required check
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
      
      // Create FormData to send both form data and image
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('message', formData.message);
      if (petHistoryImage) {
        submitData.append('petHistoryImage', petHistoryImage);
      }
      
      await requestAdoption(postId, submitData);
      
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
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#6b493d]">Request Adoption</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6b493d] focus:border-[#6b493d]"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6b493d] focus:border-[#6b493d]"
              placeholder="Enter your email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6b493d] focus:border-[#6b493d]"
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              name="message"
              required
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6b493d] focus:border-[#6b493d]"
              placeholder="Tell us about your experience with pets and why you want to adopt..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pet History Proof (Image)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              (Optional) You may upload an image showing your previous experience with pets (max 5MB)
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#6b493d] file:text-white hover:file:bg-[#5a3d32] cursor-pointer"
            />
            
            {imagePreview && (
              <div className="mt-3 relative inline-block">
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-32 h-32 object-cover rounded-md border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-colors"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#6b493d] text-white rounded-md hover:bg-[#5a3d32] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

AdoptionRequestForm.propTypes = {
  postId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AdoptionRequestForm;