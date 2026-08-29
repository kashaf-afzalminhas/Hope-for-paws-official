import { useState } from 'react';
import { API_BASE_URL } from '../config';
import PropTypes from 'prop-types';
import { useRequireAuth } from '../Components/AuthGuard';
import { ImagePlus, Trash2, Upload, X } from 'lucide-react';

function PostUploadForm({ onAddPost, onCancel }) {
  const requireAuth = useRequireAuth();
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requireAuth('create a post')) { setSubmitting(false); return; }
    if (images.length === 0) {
      setError('Please select at least one image');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const formData = new FormData();
      formData.append('caption', caption);
      images.forEach((image) => formData.append('images', image));
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
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter((file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
    const newFiles = validFiles.filter((file) => !images.some((image) => image.name === file.name && image.size === file.size));
    const duplicateCount = validFiles.length - newFiles.length;
    if (images.length + newFiles.length > 10) {
      setError(`You can upload up to 10 photos. You have ${images.length} selected.`);
      e.target.value = '';
      return;
    }
    if (validFiles.length !== selectedFiles.length) {
      setError('Some files were skipped. Choose image files under 5MB.');
    } else if (duplicateCount > 0) {
      setError('Duplicate photos were skipped.');
    } else {
      setError('');
    }
    setImages((previous) => [...previous, ...newFiles]);
    setImagePreviews((previous) => [...previous, ...newFiles.map((file) => URL.createObjectURL(file))]);
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
    setImagePreviews((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
    setError('');
  };

  const handleRemoveAllImages = () => {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setImages([]);
    setImagePreviews([]);
    setError('');
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
            Photos (up to 10)
          </label>
            <div className="space-y-3">
              {images.length > 0 && (
                <div className="grid w-full grid-cols-2 gap-3 rounded-lg border border-[#bca18a] bg-white p-3 sm:grid-cols-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={preview} className="group relative aspect-square overflow-hidden rounded-lg border border-[#bca18a] bg-[#f7f4f0]">
                      <img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#4E3B31]/85 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex min-h-24 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#bca18a] bg-[#f7f4f0] px-4 py-4 text-sm font-semibold text-[#6b493d] transition-colors hover:bg-[#f3ede7]">
            <input
              type="file"
              id="post-image"
              onChange={handleImageUpload}
              className="sr-only"
              accept="image/png,image/jpeg,image/jpg,image/gif"
              name="images"
              multiple
            />
                <Upload className="h-5 w-5" />
                <span>{images.length > 0 ? 'Add more photos' : 'Choose photos'}</span>
              </label>
              <div className="flex items-center justify-between gap-3 text-xs text-[#6b493d]">
                <span>{images.length}/10 photos selected</span>
                {images.length > 0 && (
                  <button type="button" onClick={handleRemoveAllImages} className="inline-flex items-center gap-1 text-red-600 hover:text-red-700">
                    <Trash2 className="h-3.5 w-3.5" /> Remove all
                  </button>
                )}
              </div>
              <p className="flex items-center gap-1 text-xs text-[#bca18a]"><ImagePlus className="h-3.5 w-3.5" /> Add photos one at a time or select several together. Up to 5MB each.</p>
            </div>
        </div>
        <button
          type="submit"
          disabled={submitting || images.length === 0}
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