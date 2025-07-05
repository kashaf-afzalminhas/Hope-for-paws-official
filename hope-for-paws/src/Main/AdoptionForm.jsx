import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const AdoptionForm = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [petType, setPetType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user, isAuthenticated, loading } = useAuth();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    // Check authentication status
    if (!isAuthenticated || !user) {
      setError('You must be logged in to create an adoption post.');
      setIsSubmitting(false);
      return;
    }

    // Get the JWT token from localStorage or sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing. Please log in again.');
      setIsSubmitting(false);
      return;
    }

    console.log('Submitting form with token:', token.substring(0, 10) + '...');
    console.log('Current user:', user);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('age', age);
    formData.append('petType', petType);
    formData.append('description', description);
    formData.append('location', location);
    formData.append('image', image);

    // Debug: Log what's being sent
    console.log('Form data being sent:');
    console.log('name:', name);
    console.log('age:', age);
    console.log('petType:', petType);
    console.log('description:', description);
    console.log('location:', location);
    console.log('image:', image ? image.name : 'No image');

    // Debug: Check FormData contents
    for (let [key, value] of formData.entries()) {
      console.log('FormData entry:', key, value);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/adoptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create adoption post');
      }

      const data = await response.json();
      console.log('Adoption post created:', data);

      // Reset form fields
      setName('');
      setAge('');
      setPetType('');
      setDescription('');
      setLocation('');
      setImage(null);
      setImagePreview(null);
      setError('');
      setSuccess(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B5A2B]"></div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-center">
        <p className="mb-2">You need to be logged in to create an adoption post.</p>
        <p className="text-sm mb-4">Please log in and try again.</p>
        
        {/* Debug information */}
        <div className="text-xs text-gray-600 mt-4 p-2 bg-gray-100 rounded">
          <p><strong>Debug Info:</strong></p>
          <p>isAuthenticated: {isAuthenticated ? 'true' : 'false'}</p>
          <p>user: {user ? 'present' : 'null'}</p>
          <p>localStorage token: {localStorage.getItem('token') ? 'present' : 'missing'}</p>
          <p>sessionStorage token: {sessionStorage.getItem('token') ? 'present' : 'missing'}</p>
          <p>localStorage user: {localStorage.getItem('user') ? 'present' : 'missing'}</p>
          <p>sessionStorage user: {sessionStorage.getItem('user') ? 'present' : 'missing'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg">
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          Your adoption post has been created successfully!
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4E3B31]">
              Pet Name
            </label>
            <input
              type="text"
              placeholder="e.g., Buddy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4E3B31]">
              Age (years)
            </label>
            <input
              type="text"
              placeholder="e.g., 2.5"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#4E3B31]">
            Location
          </label>
          <input
            type="text"
            placeholder="e.g., Lahore, Pakistan"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#4E3B31]">
            Pet Type
          </label>
          <select
            value={petType}
            onChange={(e) => setPetType(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent bg-white"
          >
            <option value="">Select pet type</option>
            <option value="Dog">Dog</option>
            <option value="Cat">Cat</option>
            <option value="Bird">Bird</option>
            <option value="Rabbit">Rabbit</option>
            <option value="Hamster">Hamster</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#4E3B31]">
            Description
          </label>
          <textarea
            placeholder="Tell us about your pet's personality, habits, and needs..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent resize-y"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#4E3B31]">
            Pet Photo
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              {imagePreview ? (
                <div className="w-full h-full flex items-center justify-center">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-full max-w-full object-contain rounded-lg" 
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 2MB)</p>
                </div>
              )}
              <input 
                type="file" 
                className="hidden"
                onChange={handleImageChange}
                accept="image/*"
                required={!image}
              />
            </label>
          </div>
        </div>
        
        <div className="pt-4">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-[#8B5A2B] hover:bg-[#6F4C3E] text-white font-medium rounded-md shadow-sm transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B5A2B] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Post...
              </span>
            ) : (
              "Create Adoption Post"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdoptionForm;