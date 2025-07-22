import React, { useState } from 'react';
import { API_BASE_URL } from '../config';
import PropTypes from 'prop-types';

function PostUploadForm({ onAddPost, onCancel }) {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      setImage(file);
    }
  };

  return (
    <div className="flex justify-center w-full mb-8">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white p-6 rounded-lg shadow-lg">
        <h3 className="font-bold mb-6 text-lg text-[#6b493d]">
          Create a New Post
        </h3>
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        <div className="mb-4">
          <label className="block text-[#6b493d] text-xs font-bold mb-2" htmlFor="post-caption">
            Caption
          </label>
          <textarea
            id="post-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded"
            placeholder="Write something about your post..."
          />
        </div>
        <div className="mb-4">
          <label className="block text-[#6b493d] text-xs font-bold mb-2" htmlFor="post-image">
            Upload Image
          </label>
          <input
            type="file"
            id="post-image"
            onChange={handleImageUpload}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-[#6b493d] focus:border-[#6b493d]"
            accept="image/*"
            name="image"
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#6b493d] text-white font-bold py-2 px-4 rounded hover:bg-[#573a2f] transition-colors mb-2 disabled:opacity-60"
        >
          {submitting ? 'Posting...' : 'Submit'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full bg-gray-200 text-[#6b493d] font-bold py-2 px-4 rounded hover:bg-gray-300 transition-colors"
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