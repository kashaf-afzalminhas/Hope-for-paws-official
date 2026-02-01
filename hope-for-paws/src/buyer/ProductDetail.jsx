import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch Real Product Data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        if (!response.ok) throw new Error('Product not found');
        
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-[#fdfbf7]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a07855]"></div>
    </div>
  );

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfbf7] text-[#a07855]">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <Link to="/marketplace" className="underline hover:text-[#4a342e]">Back to List</Link>
      </div>
    );
  }

  // Helper variables for clean JSX
  const status = product.sellerId?.status?.toLowerCase();
  const isVerified = status === 'verified' || status === 'approved';
  const displayImage = (product.images && product.images.length > 0) 
    ? product.images[0] 
    : (product.image || "https://placehold.co/600x400");

  return (
    <div className="bg-[#fdfbf7] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto mb-6">
        <Link to="/marketplace" className="text-[#a07855] hover:text-[#4a342e] font-medium transition-colors">
          &larr; Back to Product List
        </Link>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-[#e5e0d8]">
        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* LEFT: Image */}
          <div className="h-96 md:h-[600px] bg-[#f8f5f0] flex items-center justify-center p-8 border-r border-[#f0ebe0]">
            <img 
              src={displayImage} 
              alt={product.title} 
              className="max-h-full max-w-full object-contain rounded-lg shadow-sm" 
            />
          </div>

          {/* RIGHT: Details */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            
            <span className="text-[#a07855] font-semibold tracking-wide uppercase text-sm mb-2">
              {product.category || "Pet Supplies"}
            </span>
            <h1 className="text-4xl font-bold text-[#4a342e] mb-4">
              {product.title}
            </h1>

            <p className="text-3xl font-extrabold text-[#a07855] mb-6">
              Rs. {product.price}
            </p>

            <p className="text-[#5d4037] text-lg leading-relaxed mb-8">
              {product.description || "No description provided for this product."}
            </p>

            {/* Seller Info */}
            <div className="bg-[#fdfbf7] p-5 rounded-xl border border-[#e5e0d8] mb-8 shadow-sm">
              <p className="text-xs text-[#8d6e63] uppercase tracking-wide mb-2">Sold by</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-[#4a342e]">
                  {product.sellerId?.name || "Verified Seller"}
                </span>
                
                {isVerified ? (
                  <div className="flex items-center bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                    <span className="text-green-600 mr-1">✅</span>
                    <span className="text-xs font-bold text-green-800 uppercase tracking-wide">Verified Seller</span>
                  </div>
                ) : (
                  <div className="flex items-center bg-yellow-50 border border-yellow-200 px-3 py-1 rounded-full">
                     <span className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Pending Verification</span>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <button 
                className={`flex-1 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-md transition-colors 
                  ${product.countInStock > 0 ? 'bg-[#a07855] hover:bg-[#8d6e63]' : 'bg-gray-400 cursor-not-allowed'}`}
                disabled={product.countInStock === 0}
              >
                {product.countInStock > 0 ? 'Buy Now' : 'Out of Stock'}
              </button>
              
              <button 
                 className="flex-1 bg-transparent border-2 border-[#a07855] text-[#a07855] py-4 px-6 rounded-xl font-bold text-lg hover:bg-[#fdfbf7] transition-colors"
                 disabled={product.countInStock === 0}
              >
                Add to Cart
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;