import { API_BASE_URL } from '../config';

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
 * Onboard as a seller
 * @param {FormData} formData - Contains storeName, address, contactInfo, paymentDetails, profileImage
 */
export const onboardSeller = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/sellers/onboard`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    body: formData
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
 * Update the current seller's store (storeName, address, location, optional profileImage / removeProfileImage)
 * @param {FormData} formData
 */
export const updateMySellerProfile = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/sellers/me`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update store');
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

export const updateLocalUserAsSeller = (sellerStatus = 'pending') => {
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  user.isSeller = true;
  user.sellerStatus = sellerStatus;
  // Save next to the login token ("remember me" -> localStorage, otherwise sessionStorage)
  const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
  storage.setItem('user', JSON.stringify(user));
  return user;
};
