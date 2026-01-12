import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ id, image, name, price, shopName, isVerified }) => {
  return (
    <Link to={`/marketplace/product/${id}`} className="block h-full group">
      <div className="bg-white h-full border border-[#e5e0d8] rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col">
        <div className="h-48 w-full bg-[#fdfbf7] relative">
          <img src={image} alt={name} className="w-full h-full object-cover"/>
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-[#4a342e] text-lg truncate w-2/3 group-hover:text-[#a07855] transition-colors">{name}</h3>
            <span className="text-[#a07855] font-extrabold text-lg">${price}</span>
          </div>
          <p className="text-sm text-[#8d6e63] mb-4">
            Sold by: <span className="font-medium text-[#5d4037] ml-1">{shopName}</span>
          </p>
          <div className="mt-auto pt-3 border-t border-[#f0ebe0]">
            {isVerified ? (
              <div className="flex items-center space-x-1 text-green-700 bg-green-50 px-2 py-1 rounded-md w-fit">
                <span>✅</span><span className="text-xs font-bold uppercase">Verified Seller</span>
              </div>
            ) : (
              <p className="text-xs text-[#a1887f] italic">Seller not verified yet</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard; // 👈 THIS IS THE LINE THAT FIXES THE ERROR
