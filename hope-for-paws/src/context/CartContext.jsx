import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';

const CartContext = createContext(null);

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Helper: get auth header Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : null;
};

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Helper: normalize cart response Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const normalizeCart = (cart) => {
  if (!cart || !cart.items) return [];
  return cart.items
    .filter((item) => item.productId) // guard against nulls
    .map((item) => {
      const p = item.productId;
      const image =
        p.images && p.images.length > 0
          ? p.images[0].startsWith('http')
            ? p.images[0]
            : `http://localhost:3000${p.images[0]}`
          : "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&q=80";
      const discountPercentage = p.discountPercentage || 0;
      const discountedPrice =
        p.price - (p.price * discountPercentage) / 100;

      return {
        _id: item._id,
        productId: p._id,
        title: p.title,
        price: discountedPrice,
        originalPrice: discountPercentage > 0 ? p.price : null,
        image,
        seller: p.sellerId?.name || 'Unknown Seller',
        category: p.category,
        brand: p.brand,
        weight: p.weight,
        stock: p.countInStock,
        quantity: item.quantity,
      };
    });
};

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Provider Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const updateTimeouts = useRef({});

  // Ã¢â€â‚¬Ã¢â€â‚¬ Derived values Ã¢â€â‚¬Ã¢â€â‚¬
  const cartTotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const cartQuantity = items.reduce((sum, it) => sum + it.quantity, 0);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Fetch cart from backend Ã¢â€â‚¬Ã¢â€â‚¬
  const fetchCart = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/cart`, { headers });
      if (!res.ok) throw new Error('Failed to fetch cart');
      const data = await res.json();
      setItems(normalizeCart(data));
    } catch (err) {
      console.error('fetchCart:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Add to cart Ã¢â€â‚¬Ã¢â€â‚¬
  const addToCart = useCallback(async (productId, quantity = 1) => {
    const headers = getAuthHeaders();
    if (!headers) return { success: false, message: 'Please sign in to add items to cart' };

    try {
      const res = await fetch(`${API_BASE_URL}/cart/add`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId, quantity }),
      });

      const data = await res.json();
      if (!res.ok) return { success: false, message: data.message };

      setItems(normalizeCart(data));
      return { success: true };
    } catch (err) {
      console.error('addToCart:', err);
      return { success: false, message: 'Network error' };
    }
  }, []);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Update quantity Ã¢â€â‚¬Ã¢â€â‚¬
  const updateQuantity = useCallback((productId, quantity) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((it) => (it.productId === productId ? { ...it, quantity } : it))
    );

    if (updateTimeouts.current[productId]) {
      clearTimeout(updateTimeouts.current[productId]);
    }

    updateTimeouts.current[productId] = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/cart/update`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ productId, quantity }),
        });

        if (!res.ok) {
          console.warn('Failed to sync quantity update to server');
        }
      } catch (err) {
        console.error('updateQuantity:', err);
      }
    }, 500);
  }, []);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Remove from cart Ã¢â€â‚¬Ã¢â€â‚¬
  const removeFromCart = useCallback(async (productId) => {
    const headers = getAuthHeaders();
    if (!headers) return;

    // Optimistic removal
    setItems((prev) => prev.filter((it) => it.productId !== productId));

    try {
      const res = await fetch(`${API_BASE_URL}/cart/remove/${productId}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        await fetchCart();
        return;
      }

      const data = await res.json();
      setItems(normalizeCart(data));
    } catch (err) {
      console.error('removeFromCart:', err);
      await fetchCart();
    }
  }, [fetchCart]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Clear entire cart Ã¢â€â‚¬Ã¢â€â‚¬
  const clearCart = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    setItems([]);

    try {
      const res = await fetch(`${API_BASE_URL}/cart/clear`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error('clearCart:', err);
      await fetchCart();
    }
  }, [fetchCart]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Check if a product is in cart Ã¢â€â‚¬Ã¢â€â‚¬
  const isInCart = useCallback(
    (productId) => items.some((it) => it.productId === productId),
    [items]
  );

  // Ã¢â€â‚¬Ã¢â€â‚¬ Auto-fetch cart on mount if logged in Ã¢â€â‚¬Ã¢â€â‚¬
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      fetchCart();
    }
  }, [fetchCart]);

  return (
    <CartContext.Provider
      value={{
        items,
        cartTotal,
        cartQuantity,
        isLoading,
        error,
        fetchCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
