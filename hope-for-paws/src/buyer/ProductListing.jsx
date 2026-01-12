import React from 'react';
import ProductCard from './ProductCard';
// 👇 IMPORT the data instead of writing it inside the file
import { products } from './productsData'; 

const ProductListing = () => {
  return (
    <div className="bg-[#fdfbf7] min-h-screen p-8">
      <h1 className="text-4xl font-bold text-center text-[#a07855] mb-4">
          Product List
        </h1>

        {/* Subtitle */}
        <p className="text-[#8d6e63] text-lg max-w-2xlmx-auto text-center mb-10">
          Discover the best treats, toys, and supplies for your furry friends.
        </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id} // 👈 Ensure ID is passed here
            image={product.image}
            name={product.name}
            price={product.price}
            shopName={product.shopName}
            isVerified={product.isVerified}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductListing;