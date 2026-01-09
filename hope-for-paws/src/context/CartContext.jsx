/*// src/context/CartContext.jsx
import React, { createContext, useContext, useState } from 'react';

// Create the context
const CartContext = createContext();

// Provider component
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]); // default empty array

  // Add item to cart
  const addToCart = (item) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      } else {
        return [...prev, item];
      }
    });
  };

  // Update quantity
  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return; // prevent zero
    setCartItems(prev =>
      prev.map(item => item.id === id ? { ...item, quantity } : item)
    );
  };

  // Remove item
  const removeItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // Clear cart
  const clearCart = () => setCartItems([]);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

// Hook to use cart context
export const useCart = () => useContext(CartContext);

// context/CartContext.jsx
*/

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

import React, { createContext, useContext, useState } from 'react';

// Create Cart Context
const CartContext = createContext();

// Hook for easier access
export const useCart = () => useContext(CartContext);

// Provider component
export const CartProvider = ({ children }) => {
  // Default test products
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'Dog Food Pack',
      price: 25.99,
      quantity: 2,
      seller: 'Paws Store',
    },
    {
      id: 2,
      name: 'Cat Toy Set',
      price: 15.5,
      quantity: 1,
      seller: 'Kitty World',
    },
    {
      id: 3,
      name: 'Pet Bed',
      price: 45.0,
      quantity: 1,
      seller: 'Cozy Pets',
    },
  ]);

  // Update quantity of a product
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity: newQuantity } : item))
    );
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Add item to cart
  const addToCart = (product) => {
    const existing = cartItems.find(item => item.id === product.id);
    if (existing) {
      updateQuantity(product.id, existing.quantity + 1);
    } else {
      setCartItems(prev => [...prev, { ...product, quantity: 1 }]);
    }
  };

  return (
    <CartContext.Provider
      value={{ cartItems, updateQuantity, removeFromCart, clearCart, addToCart }}
    >
      {children}
    </CartContext.Provider>
  );
};
