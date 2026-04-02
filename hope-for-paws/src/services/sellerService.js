import { API_BASE_URL } from '../config';

/**
 * Get the auth token from storage
 */
const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

/**
 * Common headers for API requests
 */
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

/**
 * Apply as a seller
 * @param {Object} sellerData - { name, email, cnic, location }
 */
export const applyAsSeller = async (sellerData) => {
  const response = await fetch(`${API_BASE_URL}/sellers/apply`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(sellerData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to apply as seller');
  }

  return data;
};

/**
 * Get current user's seller profile
 */
export const getMySellerProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/sellers/me`, {
    method: 'GET',
    headers: getHeaders()
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch seller profile');
  }

  return data;
};

/**
 * Check if current user is a seller
 */
export const checkSellerStatus = () => {
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  return {
    isSeller: user.isSeller || false,
    sellerStatus: user.sellerStatus || null,
    canBuy: user.canBuy !== false
  };
};

/**
 * Update local user data after becoming a seller
 */
export const updateLocalUserAsSeller = (sellerStatus = 'pending') => {
  const storageKey = localStorage.getItem('user') ? 'localStorage' : 'sessionStorage';
  const storage = storageKey === 'localStorage' ? localStorage : sessionStorage;
  
  const user = JSON.parse(storage.getItem('user') || '{}');
  user.isSeller = true;
  user.sellerStatus = sellerStatus;
  user.canBuy = false;
  
  storage.setItem('user', JSON.stringify(user));
  return user;
};
