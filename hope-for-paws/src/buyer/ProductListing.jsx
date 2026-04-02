import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { API_BASE_URL } from '../config';

const ProductListing = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        const currentUserId = getCurrentUserId();

        const filteredProducts = data.filter(product => {
          if (!product.sellerId || typeof product.sellerId !== 'object') return true;
          if (product.sellerId.userId === currentUserId) return false;
          return true;
        });

        setProducts(filteredProducts);
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
              image={product.images && product.images.length > 0 ? product.images[0] : "https://placehold.co/400"}
              name={product.title} 
              price={product.price}
              shopName={product.sellerId?.name || "Seller"} 
              
              // ✅ CHANGE: Sending the actual status text now
              sellerStatus={product.sellerId?.status || 'pending'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductListing;