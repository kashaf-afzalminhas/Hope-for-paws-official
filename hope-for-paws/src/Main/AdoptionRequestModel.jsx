import React, { useState } from 'react';
import PropTypes from 'prop-types';

const AdoptionRequestModel = ({ petName, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [petHistoryImage, setPetHistoryImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Remove image required validation
    // Create FormData to send both form data and image
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('email', formData.email);
    submitData.append('phone', formData.phone);
    submitData.append('message', formData.message);
    if (petHistoryImage) {
      submitData.append('petHistoryImage', petHistoryImage);
    }
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-[#6b493d]">Adoption Request</h3>
            <p className="text-sm text-[#6b493d]">For: {petName}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#6b493d] mb-1">Your Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border border-[#c9a280] rounded focus:ring-[#6b493d] focus:border-[#6b493d]"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6b493d] mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-2 border border-[#c9a280] rounded focus:ring-[#6b493d] focus:border-[#6b493d]"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6b493d] mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full p-2 border border-[#c9a280] rounded focus:ring-[#6b493d] focus:border-[#6b493d]"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6b493d] mb-1">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              className="w-full p-2 border border-[#c9a280] rounded focus:ring-[#6b493d] focus:border-[#6b493d]"
              rows={3}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6b493d] mb-1">
              Pet History Proof (Image)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              (Optional) You may upload an image showing your previous experience with pets (max 5MB)
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-2 border border-[#c9a280] rounded focus:ring-[#6b493d] focus:border-[#6b493d] text-sm"
              // required removed
              disabled={loading}
            />
            {imagePreview && (
              <div className="mt-2">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-md border"
                />
              </div>
            )}
          </div>
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#6b493d] border border-[#6b493d] rounded hover:bg-[#6b493d]/10"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#6b493d] text-white rounded hover:bg-[#5a3d32] flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

AdoptionRequestModel.propTypes = {
  petName: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default AdoptionRequestModel;