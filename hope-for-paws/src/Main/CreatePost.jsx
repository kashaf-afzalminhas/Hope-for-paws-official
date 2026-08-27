import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useRequireAuth } from '../Components/AuthGuard';
import { ImagePlus } from 'lucide-react';
import { API_BASE_URL } from '../config';

const CreatePost = () => {
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [previews, setPreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter((file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
    if (validFiles.length !== selectedFiles.length) setError('Only images under 5MB are allowed.');
    const newFiles = validFiles.filter((file) => !images.some((image) => image.name === file.name && image.size === file.size));
    if (images.length + newFiles.length > 5) {
      setError('You can only upload a maximum of 5 images/videos.');
      return;
    }
    setImages((previous) => [...previous, ...newFiles]);
    setPreviews((previous) => [...previous, ...newFiles.map((file) => URL.createObjectURL(file))]);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requireAuth('create a post')) return;
    setIsLoading(true);
    if (images.length === 0) {
      setError('Please select at least one image');
        setIsLoading(false);
        return;
    }

    const formData = new FormData();
    formData.append('caption', caption);
    images.forEach((image) => formData.append('images', image));

    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        await axios.post(`${API_BASE_URL}/posts`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`,
            },
        });
        navigate('/posts');
    } catch {
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
            Images (up to 5)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-[#6b493d] rounded-xl group hover:border-[#c9a280] transition-colors duration-300">
            {images.length > 0 ? (
              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
                {previews.map((imagePreview, index) => (
                  <div key={imagePreview} className="relative aspect-square overflow-hidden rounded-lg">
                    <img src={imagePreview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => { URL.revokeObjectURL(previews[index]); setImages((previous) => previous.filter((_, itemIndex) => itemIndex !== index)); setPreviews((previous) => previous.filter((_, itemIndex) => itemIndex !== index)); }} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">x</button>
                  </div>
                ))}
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
                <p className="text-xs text-[#6b493d]/80">PNG, JPG, GIF up to 5MB</p>
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