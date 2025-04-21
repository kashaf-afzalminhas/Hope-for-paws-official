import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ImagePlus } from 'lucide-react';
import { API_BASE_URL } from '../config';

const CreatePost = () => {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setError('Authentication token is missing. Please log in.');
      console.log("Token not found in localStorage or sessionStorage");
    } else {
      console.log("Token found:", token);
    }
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (!image) {
        setError('Please select an image');
        setIsLoading(false);
        return;
    }

    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('image', image);

    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            setError('Authentication token is missing. Please log in.');
            setIsLoading(false);
            return;
        }

        await axios.post(`${API_BASE_URL}/posts`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`,
            },
        });
        navigate('/posts');
    } catch (err) {
        setError('Failed to create post. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-[#f5f3ed] rounded-xl shadow-lg p-8 font-poppins">
      <h2 className="text-3xl font-playfair font-bold text-center mb-8 text-[#6b493d]">
        Create New Post
      </h2>
      
      {error && (
        <div className="bg-[#6b493d] text-[#f5f3ed] px-4 py-3 rounded-lg mb-6 transition-all duration-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label htmlFor="caption" className="block text-lg font-medium text-[#6b493d] mb-3">
            Caption
          </label>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="mt-1 block w-full rounded-xl border-2 border-[#c9a280] shadow-sm focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d] bg-white p-4 transition-all duration-300"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-lg font-medium text-[#6b493d] mb-3">
            Image
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-[#6b493d] rounded-xl group hover:border-[#c9a280] transition-colors duration-300">
            {preview ? (
              <div className="space-y-3 text-center relative group">
                <div className="relative overflow-hidden rounded-lg">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="mx-auto h-64 w-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#6b493d]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setPreview('');
                  }}
                  className="text-sm text-[#f5f3ed] bg-[#6b493d] px-4 py-2 rounded-lg hover:bg-[#c9a280] transition-colors duration-300"
                >
                  Remove image
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <ImagePlus className="mx-auto h-12 w-12 text-[#6b493d] group-hover:text-[#c9a280] transition-colors duration-300" />
                <div className="flex text-sm">
                  <label
                    htmlFor="image-upload"
                    className="relative cursor-pointer bg-white rounded-xl font-medium text-[#6b493d] hover:text-[#c9a280] transition-colors duration-300"
                  >
                    <span>Upload a file</span>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                </div>
                <p className="text-xs text-[#6b493d]/80">PNG, JPG, GIF up to 10MB</p>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#6b493d] text-[#f5f3ed] py-3 px-6 rounded-xl hover:bg-[#c9a280] focus:outline-none focus:ring-2 focus:ring-[#6b493d] focus:ring-offset-2 transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f5f3ed]"></div>
            </div>
          ) : (
            'Create Post'
          )}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;