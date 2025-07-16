import axios from 'axios';
import { AUTH_BASE_URL, API_ROUTES_BASE_URL } from '../config';

console.log('API configuration:', { AUTH_BASE_URL, API_ROUTES_BASE_URL });

const authApi = axios.create({
    baseURL: AUTH_BASE_URL,
    withCredentials: true,
});

const apiRoutes = axios.create({
    baseURL: API_ROUTES_BASE_URL,
    withCredentials: true,
});

// Add request interceptor to include auth token
authApi.interceptors.request.use(
  (config) => {
    // Check both localStorage and sessionStorage for token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('API Request - Token found:', !!token);
    console.log('API Request - URL:', config.url);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request - Authorization header set');
    } else {
      console.log('API Request - No token found in storage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

console.log('Axios instances created:', {
    authApi: authApi.defaults.baseURL,
    apiRoutes: apiRoutes.defaults.baseURL
});

// Conversations
export const getUserConversations = async (userId) => {
  console.log('getUserConversations called with userId:', userId);
  console.log('Full URL will be:', `${API_ROUTES_BASE_URL}/conversations/${userId}`);
  
  try {
    console.log('Making GET request to getUserConversations...');
    const response = await apiRoutes.get(`/conversations/${userId}`);
    console.log('getUserConversations response:', response);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response;
  } catch (error) {
    console.error('getUserConversations error:', error);
    console.error('Error response:', error.response);
    console.error('Error request:', error.request);
    console.error('Error config:', error.config);
    
    // Return a safe fallback response
    return { data: [] };
  }
};

export const getConversationBetweenUsers = async (firstUserId, secondUserId) => {
  console.log('getConversationBetweenUsers called with:', { firstUserId, secondUserId });
  console.log('Full URL will be:', `${API_ROUTES_BASE_URL}/conversations/find/${firstUserId}/${secondUserId}`);
  
  try {
    console.log('Making GET request to getConversationBetweenUsers...');
    const response = await apiRoutes.get(`/conversations/find/${firstUserId}/${secondUserId}`);
    console.log('getConversationBetweenUsers response:', response);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response;
  } catch (error) {
    console.error('getConversationBetweenUsers error:', error);
    console.error('Error response:', error.response);
    console.error('Error request:', error.request);
    console.error('Error config:', error.config);
    
    if (error.response?.status === 404) {
      // If conversation not found, return null instead of throwing error
      console.log('Conversation not found (404), returning null');
      return { data: null };
    }
    throw error;
  }
};

export const createConversation = async (senderId, receiverId) => {
  console.log('createConversation called with:', { senderId, receiverId });
  console.log('Full URL will be:', `${API_ROUTES_BASE_URL}/conversations`);
  
  try {
    console.log('Making POST request to createConversation...');
    const response = await apiRoutes.post('/conversations', { senderId, receiverId });
    console.log('createConversation response:', response);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response;
  } catch (error) {
    console.error('Create conversation error:', error);
    console.error('Error response:', error.response);
    console.error('Error request:', error.request);
    console.error('Error config:', error.config);
    throw error;
  }
};

// Messages
export const getMessagesByConversation = async (conversationId) => {
  try {
    const response = await apiRoutes.get(`/messages/${conversationId}`);
    console.log('API Response:', response);
    // Normalize the response data for debugging
    const normalized = (response.data || []).map(msg => ({
      _id: msg._id || msg.id || '',
      text: msg.text || msg.content || '',
      senderId: msg.senderId || msg.sender?.id || '',
      createdAt: msg.createdAt || msg.timestamp || '',
    }));
    console.log('Normalized messages:', normalized);
    return { ...response, data: normalized };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { data: [] };
  }
};

export const sendMessage = (message) => 
  apiRoutes.post('/messages', message);

export const markMessageAsRead = (messageId) => 
  apiRoutes.patch(`/messages/${messageId}/read`);

// Chats (Recent)
export const getRecentChats = () => 
  apiRoutes.get('/chats/recent');

// Get user by ID (matches your backend POST /auth/getUserById)
export const getUserById = (id) =>
  authApi.post('/getUserById', { id });

// Get all users (matches your backend POST /auth/getAllUsers)
export const getAllUsers = async () => {
  console.log('getAllUsers called with AUTH_BASE_URL:', AUTH_BASE_URL);
  console.log('Full URL will be:', `${AUTH_BASE_URL}/getAllUsers`);
  
  try {
    console.log('Making POST request to getAllUsers...');
    const response = await authApi.post('/getAllUsers', {});
    console.log('getAllUsers response:', response);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    console.log('Response data type:', typeof response.data);
    console.log('Is response.data an array?', Array.isArray(response.data));
    console.log('Response data keys:', response.data ? Object.keys(response.data) : 'null/undefined');
    return response;
  } catch (error) {
    console.error('getAllUsers error:', error);
    console.error('Error response:', error.response);
    console.error('Error request:', error.request);
    console.error('Error config:', error.config);
    throw error;
  }
};

// Search users (you can implement this based on your backend)
export const searchUsers = (query) =>
  authApi.post('/searchUsers', { query });

// Profile Management APIs

// Upload profile image
export const uploadProfileImage = async (formData) => {
  console.log('uploadProfileImage called with formData:', formData);
  console.log('Full URL will be:', `${AUTH_BASE_URL}/upload-profile-image`);
  
  try {
    console.log('Making POST request to uploadProfileImage...');
    const response = await authApi.post('/upload-profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('uploadProfileImage response:', response);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response;
  } catch (error) {
    console.error('uploadProfileImage error:', error);
    console.error('Error response:', error.response);
    console.error('Error request:', error.request);
    console.error('Error config:', error.config);
    throw error;
  }
};

// Get authenticated user's own profile
export const getUserProfile = async () => {
  console.log('getUserProfile called');
  console.log('Full URL will be:', `${AUTH_BASE_URL}/profile`);
  
  try {
    console.log('Making GET request to getUserProfile...');
    const response = await authApi.get('/profile');
    console.log('getUserProfile response:', response);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response;
  } catch (error) {
    console.error('getUserProfile error:', error);
    console.error('Error response:', error.response);
    console.error('Error request:', error.request);
    console.error('Error config:', error.config);
    throw error;
  }
};

// Get public profile of any user by ID
export const getUserPublicProfile = async (userId) => {
  console.log('getUserPublicProfile called with userId:', userId);
  console.log('Full URL will be:', `${AUTH_BASE_URL}/profile/${userId}`);
  
  try {
    console.log('Making GET request to getUserPublicProfile...');
    const response = await authApi.get(`/profile/${userId}`);
    console.log('getUserPublicProfile response:', response);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response;
  } catch (error) {
    console.error('getUserPublicProfile error:', error);
    console.error('Error response:', error.response);
    console.error('Error request:', error.request);
    console.error('Error config:', error.config);
    throw error;
  }
};

// Remove profile image
export const removeProfileImage = async () => {
  console.log('removeProfileImage called');
  console.log('Full URL will be:', `${AUTH_BASE_URL}/remove-profile-image`);
  
  try {
    console.log('Making DELETE request to removeProfileImage...');
    const response = await authApi.delete('/remove-profile-image');
    console.log('removeProfileImage response:', response);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response;
  } catch (error) {
    console.error('removeProfileImage error:', error);
    console.error('Error response:', error.response);
    console.error('Error request:', error.request);
    console.error('Error config:', error.config);
    throw error;
  }
};

// Debug function to test token transmission
export const debugToken = async () => {
  console.log('debugToken called');
  console.log('Full URL will be:', `${AUTH_BASE_URL}/debug-token`);
  
  try {
    console.log('Making GET request to debugToken...');
    const response = await authApi.get('/debug-token');
    console.log('debugToken response:', response);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return response;
  } catch (error) {
    console.error('debugToken error:', error);
    console.error('Error response:', error.response);
    console.error('Error request:', error.request);
    console.error('Error config:', error.config);
    throw error;
  }
};

// Get adoption ads for a user (public)
export const getUserAdoptionAds = async (userId) => {
  try {
    const response = await apiRoutes.get(`/adoptions/user/${userId}`);
    return response;
  } catch (error) {
    console.error('getUserAdoptionAds error:', error);
    return { data: [] };
  }
};

// Get posts for a user (public)
export const getUserPosts = async (userId) => {
  try {
    const response = await apiRoutes.get(`/posts/user/${userId}`);
    return response;
  } catch (error) {
    console.error('getUserPosts error:', error);
    return { data: [] };
  }
};