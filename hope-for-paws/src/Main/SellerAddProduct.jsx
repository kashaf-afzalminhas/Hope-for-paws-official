import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const SellerAddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  // BUG-009 FIX: In-page feedback states instead of alert()
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Pet Food', // Default value ensures category is never empty
    stock: '',
    imageFile: null
  });

  // Helper: Convert File to Base64 Text
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, imageFile: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      let imageBase64 = "https://placehold.co/600x400"; // Default placeholder

      // 1. Convert Image to Text String (Base64)
      if (formData.imageFile) {
        imageBase64 = await convertToBase64(formData.imageFile);
      }

      // 2. Create the JSON Object (Matches your Backend Controller)
      const productData = {
        title: formData.name, 
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        countInStock: Number(formData.stock),
        images: [imageBase64] 
      };

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create product');
      }

      setSuccessMsg('Product published successfully! Redirecting...');
      setTimeout(() => navigate('/seller/products'), 1500);

    } catch (error) {
      console.error("Error:", error);
      if (error.message.includes('entity too large') || error.message.includes('413')) {
        setErrorMsg('Image is too large. Please use an image under 1MB.');
      } else {
        setErrorMsg(error.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#a07855]">Add New Product</h1>
          <button 
            onClick={() => navigate('/seller/dashboard')}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            Cancel
          </button>
        </div>

        {/* BUG-009 FIX: Inline success/error messages */}
        {successMsg && (
          <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
            <div className="flex justify-center items-center w-full">
              <label className="flex flex-col justify-center items-center w-full h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-100 relative overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col justify-center items-center pt-5 pb-6">
                    <svg className="mb-3 w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">Click to upload image</p>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Name</label>
            <input 
              type="text" 
              name="name" 
              onChange={handleChange} 
              required 
              className="w-full p-3 border rounded-lg mt-1 focus:ring-[#a07855] focus:border-[#a07855]" 
              placeholder="e.g. Cat Food" 
            />
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <input 
                type="number" 
                name="price" 
                onChange={handleChange} 
                required 
                min="0"
                className="w-full p-3 border rounded-lg mt-1 focus:ring-[#a07855] focus:border-[#a07855]" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Stock</label>
              <input 
                type="number" 
                name="stock" 
                onChange={handleChange} 
                required 
                min="0"
                className="w-full p-3 border rounded-lg mt-1 focus:ring-[#a07855] focus:border-[#a07855]" 
              />
            </div>
          </div>

          {/* Category */}
          <div>
             <label className="block text-sm font-medium text-gray-700">Category</label>
             <select 
               name="category" 
               value={formData.category} // Controlled input to prevent empty category
               onChange={handleChange} 
               className="w-full p-3 border rounded-lg mt-1 focus:ring-[#a07855] focus:border-[#a07855]"
             >
               <option value="Pet Food">Pet Food</option>
               <option value="Accessories">Accessories</option>
               <option value="Medicine">Medicine</option>
               <option value="Toys">Toys</option>
             </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea 
              name="description" 
              onChange={handleChange} 
              required 
              rows="4" 
              className="w-full p-3 border rounded-lg mt-1 focus:ring-[#a07855] focus:border-[#a07855]"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-4 bg-[#a07855] text-white rounded-lg font-bold hover:bg-[#8d6e63] transition-colors"
          >
            {loading ? 'Publishing...' : 'Publish Product'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SellerAddProduct;