import React, { useState } from 'react';
import { API_BASE_URL } from '../config';
import PropTypes from 'prop-types';
import { useRequireAuth } from '../Components/AuthGuard';

function PostUploadForm({ onAddPost, onCancel }) {
  const requireAuth = useRequireAuth();
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requireAuth('create a post')) { setSubmitting(false); return; }
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const formData = new FormData();
      formData.append('caption', caption);
      if (image) {
        formData.append('image', image);
      }
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (response.ok) {
        const newPost = await response.json();
        if (onAddPost) onAddPost(newPost);
        if (onCancel) onCancel();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create post');
      }
    } catch {
      setError('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Only image files (PNG, JPG, GIF) are allowed.');
        e.target.value = ''; // Reset the input
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be under 5MB.');
        e.target.value = '';
        return;
      }
      setError('');
      setImage(file);
      // Create a preview URL for the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };



  return (
    <div className="flex justify-center w-full mb-8">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-[#f7f4f0] p-8 rounded-lg shadow-lg">
        {/* Heading styled like the adoption form */}
        <div className="rounded-tl-xl rounded-tr-xl bg-gradient-to-r from-[#8B5A2B] to-[#4E3B31] px-6 py-5 mb-4">
          <h3 className="font-bold text-xl text-white text-left m-0">
            Create a New Post
          </h3>
        </div>
        {error && <div className="mb-4 text-red-600 text-sm text-center">{error}</div>}
        <div className="mb-6">
          <label className="block text-[#6b493d] text-sm font-semibold mb-2" htmlFor="post-caption">
            Caption
          </label>
          <textarea
            id="post-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            required
            className="w-full px-4 py-3 border-2 border-[#bca18a] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bca18a] focus:border-[#bca18a] text-[#6b493d] bg-white resize-none"
            placeholder="Write something about your post..."
            rows={4}
          />
        </div>
        <div className="mb-8">
          <label className="block text-[#6b493d] text-sm font-semibold mb-2" htmlFor="post-image">
            Image
          </label>
                     <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#bca18a] rounded-lg p-6 bg-[#f7f4f0] relative hover:bg-[#f3ede7] transition-colors min-h-[200px]">
            <input
              type="file"
              id="post-image"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept="image/png,image/jpeg,image/jpg,image/gif"
              name="image"
              required
            />
                                      {imagePreview ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="relative mb-2 group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-48 object-contain rounded-lg border border-[#bca18a] cursor-pointer"
                      onClick={() => document.getElementById('post-image').click()}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setImage(null);
                        setImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors"
                    >
                      Ãƒâ€”
                    </button>
                  </div>
                  <span className="text-xs text-[#6b493d] font-medium">{image.name}</span>
                </div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#6b493d] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <span className="text-[#6b493d] font-semibold">Upload a file</span>
                <span className="text-xs text-[#bca18a] mt-1">PNG, JPG, GIF up to 5MB</span>
              </>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#6b493d] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#573a2f] transition-colors mb-3 disabled:opacity-60"
        >
          {submitting ? 'Posting...' : 'Create Post'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full bg-[#e5d6c6] text-[#6b493d] font-bold py-2 px-4 rounded-lg hover:bg-[#d6c2b0] transition-colors"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

PostUploadForm.propTypes = {
  onAddPost: PropTypes.func,
  onCancel: PropTypes.func,
};

export default PostUploadForm;