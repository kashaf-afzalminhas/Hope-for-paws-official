import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { products } from './productsData'; // Importing your dummy data

const ProductDetail = () => {
  // 1. Get the product ID from the URL
  const { id } = useParams();
  
  // 2. Find the specific product
  const product = products.find((p) => p.id === parseInt(id));

  if (!product) {
    return <div className="p-10 text-center text-[#a07855]">Product not found</div>;
  }

  return (
    <div className="bg-[#fdfbf7] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto mb-6">
        {/* 👇 UPDATED: Says "Back to Product List" now */}
        <Link to="/marketplace" className="text-[#a07855] hover:text-[#4a342e] font-medium transition-colors">
          &larr; Back to Product List
        </Link>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-[#e5e0d8]">
        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* LEFT: Image */}
          <div className="h-96 md:h-[500px] bg-[#f8f5f0] flex items-center justify-center p-8 border-r border-[#f0ebe0]">
            <img 
              src={product.image} 
              alt={product.name} 
              className="max-h-full max-w-full object-contain rounded-lg shadow-sm" 
            />
          </div>

          {/* RIGHT: Details */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            
            <span className="text-[#a07855] font-semibold tracking-wide uppercase text-sm mb-2">
              Pet Supplies
            </span>
            <h1 className="text-4xl font-bold text-[#4a342e] mb-4">
              {product.name}
            </h1>

            <p className="text-3xl font-extrabold text-[#a07855] mb-6">
              ${product.price}
            </p>

            <p className="text-[#5d4037] text-lg leading-relaxed mb-8">
              This is a premium quality item for your beloved pet. It is durable, 
              safe, and designed to provide the best comfort and fun. 
              (Description placeholder).
            </p>

            {/* Seller Info */}
            <div className="bg-[#fdfbf7] p-4 rounded-xl border border-[#e5e0d8] mb-8">
              <p className="text-sm text-[#8d6e63] mb-1">Sold by:</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-[#4a342e]">{product.shopName}</span>
                
                {product.isVerified ? (
                  <span className="flex items-center text-green-700 bg-green-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    ✅ Verified Seller
                  </span>
                ) : (
                  <span className="text-red-500 bg-red-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-red-100">
                    ⚠️ Seller not verified yet
                  </span>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <button className="flex-1 bg-[#a07855] text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-[#8d6e63] transition-colors shadow-md">
                Buy Now
              </button>
              <button className="flex-1 bg-transparent border-2 border-[#a07855] text-[#a07855] py-4 px-6 rounded-xl font-bold text-lg hover:bg-[#fdfbf7] transition-colors">
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