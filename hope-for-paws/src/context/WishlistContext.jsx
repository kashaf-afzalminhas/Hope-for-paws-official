import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  const fetchWishlist = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setWishlist([]);
      setUnviewedCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
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
      console.error('fetchWishlist error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchWishlist();
    }
  }, [fetchWishlist]);

  const toggleWishlist = async (productId) => {
    const token = getAuthToken();
    if (!token) return { success: false, message: 'Not logged in' };

    const isCurrentlyInWishlist = wishlist.some(p => (p._id || p.id || p) === productId);
    const previousWishlist = [...wishlist];
    const previousUnviewedCount = unviewedCount;

    // Optimistic Update
    setWishlist(prev =>
      isCurrentlyInWishlist
        ? prev.filter(p => (p._id || p.id || p) !== productId)
        : [...prev, productId]
    );

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

      // Fetch the full populated product objects from the server
      await fetchWishlist();

      if (typeof data.unviewedCount === 'number') {
        setUnviewedCount(data.unviewedCount);
      }

      return { success: true, message: data.message };
    } catch (err) {
      console.error('toggleWishlist error:', err);
      setWishlist(previousWishlist);
      setUnviewedCount(previousUnviewedCount);
      return { success: false, message: err.message };
    }
  };

  const isInWishlist = (productId) => wishlist.some(p => (p._id || p.id || p) === productId);

  const clearWishlist = async () => {
    const token = getAuthToken();
    if (!token) return { success: false, message: 'Not logged in' };

    const previousWishlist = [...wishlist];
    const previousUnviewedCount = unviewedCount;

    setWishlist([]);
    setUnviewedCount(0);

    try {
      const res = await fetch(`${API_BASE_URL}/wishlist/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to clear wishlist');
      return { success: true, message: 'Wishlist cleared' };
    } catch (err) {
      console.error('clearWishlist error:', err);
      setWishlist(previousWishlist);
      setUnviewedCount(previousUnviewedCount);
      return { success: false, message: err.message };
    }
  };

  const markAsViewed = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    setUnviewedCount(0);

    try {
      await fetch(`${API_BASE_URL}/wishlist/view`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to mark wishlist as viewed:', err);
    }
  }, []);

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