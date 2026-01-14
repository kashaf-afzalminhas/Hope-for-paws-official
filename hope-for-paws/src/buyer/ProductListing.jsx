import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { API_BASE_URL } from '../config'; // Make sure this path is correct for your folder structure

const ProductListing = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Real Products from Backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products`); // Public endpoint
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-[#fdfbf7]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a07855]"></div>
    </div>
  );

  return (
    <div className="bg-[#fdfbf7] min-h-screen p-8">
      <h1 className="text-4xl font-bold text-center text-[#a07855] mb-4">
          Product List
        </h1>

        {/* Subtitle */}
        <p className="text-[#8d6e63] text-lg max-w-2xl mx-auto text-center mb-10">
          Discover the best treats, toys, and supplies for your furry friends.
        </p>

      {products.length === 0 ? (
        <div className="text-center text-gray-500 text-xl mt-10">No products found. Check back later!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              id={product._id}
              // ✅ IMAGE FIX: Check if images array exists, take the first one
              image={product.images && product.images.length > 0 ? product.images[0] : "https://placehold.co/400"}
              // ✅ NAME FIX: Backend calls it 'title', Frontend Card calls it 'name'
              name={product.title} 
              price={product.price}
              // Note: We'll fix Shop Name later (backend needs to send seller name)
              shopName="Verified Seller" 
              isVerified={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductListing;