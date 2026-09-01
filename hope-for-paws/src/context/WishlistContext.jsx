import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // Using standard auth context assumption
import { API_BASE_URL } from '../config';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      setUnviewedCount(0);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch wishlist');
      const data = await res.json();
      
      setWishlist(data.products || []);
      setUnviewedCount(data.unviewedCount || 0);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = async (productId) => {
    if (!user) return { success: false, message: 'Not logged in' };

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const isCurrentlyInWishlist = wishlist.some(p => (p._id || p.id || p) === productId);
    const previousWishlist = [...wishlist];
    const previousUnviewedCount = unviewedCount;
    
    // Optimistic Update
    setWishlist(prev => 
      isCurrentlyInWishlist 
        ? prev.filter(p => (p._id || p.id || p) !== productId) 
        : [...prev, productId] 
    );

    // Increment count optimistically if adding; let backend sync precise count on remove
    if (!isCurrentlyInWishlist) {
      setUnviewedCount(prev => prev + 1);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/wishlist/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });

      if (!res.ok) throw new Error('Failed to toggle wishlist');
      const data = await res.json();

      // Sync populated products and unviewed count directly from backend response
      if (data.products) {
        setWishlist(data.products);
      }
      if (typeof data.unviewedCount === 'number') {
        setUnviewedCount(data.unviewedCount);
      }

      return { success: true, message: data.message };
    } catch (err) {
      console.error(err);
      setWishlist(previousWishlist);
      setUnviewedCount(previousUnviewedCount);
      return { success: false, message: err.message };
    }
  };

  const isInWishlist = (productId) => wishlist.some(p => (p._id || p.id || p) === productId);

  const clearWishlist = async () => {
    if (!user) return { success: false, message: 'Not logged in' };

    const previousWishlist = [...wishlist];
    const previousUnviewedCount = unviewedCount;

    // Optimistic update
    setWishlist([]);
    setUnviewedCount(0);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/wishlist/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to clear wishlist');
      return { success: true, message: 'Wishlist cleared' };
    } catch (err) {
      console.error(err);
      setWishlist(previousWishlist);
      setUnviewedCount(previousUnviewedCount);
      return { success: false, message: err.message };
    }
  };

  const markAsViewed = useCallback(async () => {
    if (!user) return;
    setUnviewedCount(0); // Instantly reset count to 0 in UI

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await fetch(`${API_BASE_URL}/wishlist/view`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to mark wishlist as viewed:', err);
    }
  }, [user]);

  return (
    <WishlistContext.Provider value={{
      wishlist,
      unviewedCount,
      isLoading,
      error,
      toggleWishlist,
      isInWishlist,
      clearWishlist,
      fetchWishlist,
      markAsViewed
    }}>
      {children}
    </WishlistContext.Provider>
  );
};