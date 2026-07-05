import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext'; // Using standard auth context assumption
import { API_BASE_URL } from '../config';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
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
    if (!user) {
      alert("Please log in to use the wishlist.");
      return { success: false, message: 'Not logged in' };
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // Check if in wishlist
    const isCurrentlyInWishlist = wishlist.some(p => (p._id || p.id || p) === productId);
    const previousWishlist = [...wishlist];
    
    // Optimistic Update
    setWishlist(prev => 
      isCurrentlyInWishlist 
        ? prev.filter(p => (p._id || p.id || p) !== productId) 
        : [...prev, productId] // Just add the ID for now, will fetch full object later
    );

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
      
      // We trigger a silent background fetch to ensure the wishlist is fully populated
      // This ensures if a user goes to the Wishlist page, they have the full objects.
      fetchWishlist();
      
      return { success: true, message: data.message };
      
    } catch (err) {
      console.error(err);
      // Revert optimistic update
      setWishlist(previousWishlist);
      return { success: false, message: err.message };
    }
  };

  const isInWishlist = (productId) => wishlist.some(p => (p._id || p.id || p) === productId);

  return (
    <WishlistContext.Provider value={{
      wishlist,
      isLoading,
      error,
      toggleWishlist,
      isInWishlist,
      fetchWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
