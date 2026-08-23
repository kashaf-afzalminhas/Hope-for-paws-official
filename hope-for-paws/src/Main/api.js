import axios from 'axios';
import { AUTH_BASE_URL, API_ROUTES_BASE_URL } from '../config';

const authApi = axios.create({
    baseURL: AUTH_BASE_URL,
    withCredentials: true,
});

const apiRoutes = axios.create({
    baseURL: API_ROUTES_BASE_URL,
    withCredentials: true,
});

// Add request interceptor to include auth token for apiRoutes
apiRoutes.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiRoutes.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

authApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// Conversations
export const getUserConversations = async (userId) => {
  try {
    const response = await apiRoutes.get(`/conversations/${userId}`);
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
  try {
    const response = await apiRoutes.get(`/conversations/find/${firstUserId}/${secondUserId}`);
    return response;
  } catch (error) {
    if (error.response?.status === 404) {
      // If conversation not found, return null instead of throwing error
      console.log('Conversation not found (404), returning null');
      return { data: null };
    }
    // Only log unexpected errors
    console.error('getConversationBetweenUsers error:', error);
    console.error('Error response:', error.response);
    console.error('Error request:', error.request);
    console.error('Error config:', error.config);
    throw error;
  }
};

export const createConversation = async (senderId, receiverId) => {
  try {
    const response = await apiRoutes.post('/conversations', { senderId, receiverId });
    return response;
  } catch (error) {
    console.error('Create conversation error:', error);
    console.error('Error response:', error.response);
    console.error('Error request:', error.request);
    console.error('Error config:', error.config);
    throw error;
  }
};

export const deleteConversation = async (conversationId) => {
  try {
    const response = await apiRoutes.delete(`/conversations/${conversationId}`);
    return response;
  } catch (error) {
    console.error('deleteConversation error:', error);
    console.error('Error response:', error.response);
    throw error;
  }
};

// Messages
export const getMessagesByConversation = async (conversationId) => {
  try {
    const response = await apiRoutes.get(`/messages/${conversationId}`);
    // Normalize the response data for debugging
    const normalized = (response.data || []).map(msg => ({
      _id: msg._id || msg.id || '',
      text: msg.text || msg.content || '',
      senderId: msg.senderId || msg.sender?.id || '',
      createdAt: msg.createdAt || msg.timestamp || '',
    }));
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

export const markConversationAsRead = async (conversationId) => {
  try {
    const response = await apiRoutes.patch(`/messages/conversations/${conversationId}/read`);
    return response;
  } catch (error) {
    console.error('API: markConversationAsRead error:', error);
    throw error;
  }
};

// Chats (Recent)
export const getRecentChats = () => 
  apiRoutes.get('/chats/recent');

// Get user by ID (matches your backend POST /auth/getUserById)
export const getUserById = (id) =>
  authApi.post('/getUserById', { id });

// Get all users (matches your backend POST /auth/getAllUsers)
export const getAllUsers = async () => {
  try {
    const response = await authApi.post('/getAllUsers', {});
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
  try {
    const response = await authApi.post('/upload-profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
  try {
    const response = await authApi.get('/profile');
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
  try {
    const response = await authApi.get(`/profile/${userId}`);
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
  try {
    const response = await authApi.delete('/remove-profile-image');
    return response;
  } catch (error) {
    console.error('removeProfileImage error:', error);
    console.error('Error response:', error.response);
    console.error('Error request:', error.request);
    console.error('Error config:', error.config);
    throw error;
  }
};

export const debugToken = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
  
  console.log('Debug Token Info:', {
    hasToken: !!token,
    user: user ? { id: user.id, _id: user._id, username: user.username } : 'No user',
    tokenLength: token?.length || 0
  });
  
  return { hasToken: !!token, user };
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