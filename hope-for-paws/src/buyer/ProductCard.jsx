import React from 'react';
import { Link } from 'react-router-dom';

// ✅ UPDATE: Accept 'sellerStatus' prop instead of 'isVerified'
const ProductCard = ({ id, image, name, price, shopName, sellerStatus }) => {
  
  // Helper to normalize status (handle 'approved' as 'verified')
  const status = sellerStatus?.toLowerCase();
  const isVerified = status === 'verified' || status === 'approved';

  return (
    <Link to={`/marketplace/product/${id}`} className="block h-full group">
      <div className="bg-white h-full border border-[#e5e0d8] rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col transform hover:-translate-y-1">
        
        {/* Image Section */}
        <div className="h-56 w-full bg-[#f8f5f2] relative overflow-hidden">
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300"></div>
        </div>

        {/* Content Section */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Title and Price */}
          <div className="flex justify-between items-start gap-2 mb-3">
            <h3 className="font-bold text-[#4a342e] text-lg leading-tight line-clamp-2 group-hover:text-[#a07855] transition-colors">
              {name}
            </h3>
            <span className="text-[#a07855] font-bold text-lg whitespace-nowrap">
              Rs. {price}
            </span>
          </div>

          {/* Seller Info */}
          <div className="mt-auto pt-4 border-t border-[#f0ebe0] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-[#a1887f] uppercase tracking-wide">Sold by</span>
              <span className="text-sm font-semibold text-[#5d4037] truncate max-w-[120px]">
                {shopName}
              </span>
            </div>

            {/* ✅ BADGE LOGIC: Show Green if Verified, Yellow if Pending */}
            {isVerified ? (
              <div className="flex items-center bg-green-50 border border-green-100 px-2 py-1 rounded-full shadow-sm" title="Verified Seller">
                <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-[10px] font-bold text-green-700 ml-1 uppercase">Verified</span>
              </div>
            ) : (
              <div className="flex items-center bg-yellow-50 border border-yellow-100 px-2 py-1 rounded-full shadow-sm" title="Pending Verification">
                <span className="text-[10px] font-bold text-yellow-700 uppercase">Pending</span>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;