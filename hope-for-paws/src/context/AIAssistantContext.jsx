import React, { createContext, useState, useCallback, useRef, useContext } from 'react';
import { API_BASE_URL } from '../config';

const AIAssistantContext = createContext(null);

const PAGE_MAP = {
  '/': { page: 'Home', route: '/' },
  '/adoption': { page: 'Adoption', route: '/adoption' },
  '/create-adoption': { page: 'Create Adoption', route: '/create-adoption' },
  '/adoptionhistory': { page: 'Adoption History', route: '/adoptionhistory' },
  '/my-adoptions': { page: 'My Adoptions', route: '/my-adoptions' },
  '/posts': { page: 'Posts', route: '/posts' },
  '/createpost': { page: 'Create Post', route: '/createpost' },
  '/my-posts': { page: 'My Posts', route: '/my-posts' },
  '/marketplace': { page: 'Marketplace', route: '/marketplace' },
  '/cart': { page: 'Cart', route: '/cart' },
  '/wishlist': { page: 'Wishlist', route: '/wishlist' },
  '/checkout': { page: 'Checkout', route: '/checkout' },
  '/my-orders': { page: 'My Orders', route: '/my-orders' },
  '/seller/onboard': { page: 'Seller Onboarding', route: '/seller/onboard' },
  '/seller/dashboard': { page: 'Seller Dashboard', route: '/seller/dashboard' },
  '/seller/orders': { page: 'Seller Orders', route: '/seller/orders' },
  '/admin-dashboard': { page: 'Admin Dashboard', route: '/admin-dashboard' },
  '/chat': { page: 'Chat', route: '/chat' },
  '/notifications': { page: 'Notifications', route: '/notifications' },
  '/profile': { page: 'Profile', route: '/profile' },
  '/signin': { page: 'Sign In', route: '/signin' },
  '/signup': { page: 'Sign Up', route: '/signup' },
  '/faq': { page: 'FAQ', route: '/faq' },
  '/contactus': { page: 'Contact Us', route: '/contactus' },
  '/clinics': { page: 'Clinics', route: '/clinics' },
  '/ngo': { page: 'NGO', route: '/ngo' },
  '/team': { page: 'Team', route: '/team' },
};

const getPageContext = (pathname) => {
  if (PAGE_MAP[pathname]) return PAGE_MAP[pathname];

  if (pathname.startsWith('/product/')) return { page: 'Product Details', route: pathname, section: 'viewing a product' };
  if (pathname.startsWith('/posts/')) return { page: 'Post Details', route: pathname, section: 'viewing a post' };
  if (pathname.startsWith('/chat/')) return { page: 'Chat', route: pathname, section: 'messaging' };
  if (pathname.startsWith('/admin-dashboard/')) return { page: 'Admin Panel', route: pathname };
  if (pathname.startsWith('/profile/public/')) return { page: 'Public Profile', route: pathname };

  return { page: 'Unknown', route: pathname };
};

export const AIAssistantProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [userRole, setUserRole] = useState('guest');
  const conversationHistory = useRef([]);

  const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  const getHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/suggestions`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setUserRole(data.userRole || 'guest');
      }
    } catch (error) {
      console.error('Failed to load AI suggestions:', error);
    }
  }, [getHeaders]);

  const sendMessage = useCallback(async (message) => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Send prior turns only — current message is added separately by the API
    const previousHistory = conversationHistory.current.slice(-10);
    const pageCtx = getPageContext(window.location.pathname);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          message: message.trim(),
          conversationHistory: previousHistory,
          pageContext: pageCtx,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      const data = await res.json();

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      conversationHistory.current.push(
        { role: 'user', content: message.trim() },
        { role: 'assistant', content: data.response }
      );

      if (data.userRole) {
        setUserRole(data.userRole);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, getHeaders]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    conversationHistory.current = [];
  }, []);

  const toggleAssistant = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev && messages.length === 0) {
        loadSuggestions();
      }
      return !prev;
    });
  }, [messages.length, loadSuggestions]);

  const value = {
    isOpen,
    messages,
    isLoading,
    suggestions,
    userRole,
    sendMessage,
    clearMessages,
    toggleAssistant,
    loadSuggestions,
  };

  return (
    <AIAssistantContext.Provider value={value}>
      {children}
    </AIAssistantContext.Provider>
  );
};

export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  }
  return context;
};
