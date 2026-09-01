import React, { createContext, useState, useContext } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config';

const AdoptionContext = createContext();

// Define the backend API URL
// const BACKEND_API_URL = API_BASE_URL;

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache = {
  allAdoptionPosts: {
    data: null,
    timestamp: 0
  },
  userAdoptionPosts: {
    data: null,
    timestamp: 0
  }
};

export const AdoptionProvider = ({ children }) => {
  const [allAdoptionPosts, setAllAdoptionPosts] = useState([]);
  const [userAdoptionPosts, setUserAdoptionPosts] = useState([]);
  const [postRequests, setPostRequests] = useState({});
  const [loading, setLoading] = useState({
    all: false,
    user: false,
    requests: false,
    action: false
  });
  const [error, setError] = useState({
    all: '',
    user: '',
    requests: ''
  });
  const { user } = useAuth();

  const [userStats, setUserStats] = useState({
  totalPosts: 0,
  adoptedCount: 0,
  pendingCount: 0,
});

const fetchUserStats = async () => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/adoptions/user-stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        setUserStats(result.data);
      }
    }
  } catch (err) {
    console.error('Error fetching user stats:', err);
  }
};
  
  // Helper function to get user ID consistently
  const getUserId = () => {
    // First try from context
    if (user?._id) return user._id;
    if (user?.id) return user.id;
    
    // Then try from storage
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
      if (storedUser?._id) return storedUser._id;
      if (storedUser?.id) return storedUser.id;
    } catch (e) {
      console.error('Error parsing stored user:', e);
    }
    
    return null;
  };

  // Helper function to check if cache is valid
  const isCacheValid = (cacheKey) => {
    const now = Date.now();
    return cache[cacheKey]?.data && (now - cache[cacheKey].timestamp < CACHE_DURATION);
  };

  const fetchAllAdoptionPosts = async (options = {}) => {
    const forceRefresh = options.forceRefresh === true;
    try {
      if (!forceRefresh && isCacheValid('allAdoptionPosts')) {
        console.log('Using cached all adoption posts');
        const userId = getUserId();
        let filteredData;
        
        if (userId) {
          filteredData = cache.allAdoptionPosts.data.filter(post => 
            String(post.userId?._id || post.userId) !== String(userId)
          );
        } else {
          filteredData = cache.allAdoptionPosts.data;
        }
        
        setAllAdoptionPosts(filteredData);
        return;
      }
      
      setLoading(prev => ({ ...prev, all: true }));
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Only include Authorization header if token exists
      const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/adoptions`, {
        method: 'GET',
        headers
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Received all adoption posts:", data);
      
      // Update cache
      cache.allAdoptionPosts = {
        data: data,
        timestamp: Date.now()
      };
      
      const userId = getUserId();
      let filteredData;
      
      if (userId) {
        filteredData = data.filter(post => 
          String(post.userId?._id || post.userId) !== String(userId)
        );
      } else {
        filteredData = data;
      }
      
      setAllAdoptionPosts(filteredData);
      setError(prev => ({ ...prev, all: '' }));
    } catch (error) {
      console.error('Fetch error:', error);
      setError(prev => ({ ...prev, all: error.message || 'Failed to fetch adoption posts' }));
    } finally {
      setLoading(prev => ({ ...prev, all: false }));
    }
  };

  const fetchUserAdoptions = async (userId) => {
    try {
      // Check cache first
      if (isCacheValid('userAdoptionPosts')) {
        console.log('Using cached user adoption posts');
        setUserAdoptionPosts(cache.userAdoptionPosts.data);
        return;
      }
      
      setLoading(prev => ({ ...prev, user: true }));
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Use the helper function to get the user ID
      const effectiveUserId = userId || getUserId();
      
      if (!effectiveUserId) {
        throw new Error('User ID not found');
      }
      
      console.log('Fetching adoptions for user:', effectiveUserId);
      
      const postsResponse = await fetch(`${API_BASE_URL}/adoptions/user/${effectiveUserId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!postsResponse.ok) {
        const errorData = await postsResponse.json();
        throw new Error(errorData.message || `HTTP error! status: ${postsResponse.status}`);
      }
      
      const postsData = await postsResponse.json();
      console.log('Received user adoption posts:', postsData);
      
      // Then fetch requests for each post
      const postsWithRequests = await Promise.all(
        postsData.map(async (post) => {
          try {
            const requestsResponse = await fetch(`${API_BASE_URL}/adoptions/${post._id}/requests`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (requestsResponse.ok) {
              const requestsData = await requestsResponse.json();
              console.log(`Requests for post ${post._id}:`, requestsData);
              return { ...post, requests: requestsData };
            } else {
              console.error(`Failed to fetch requests for post ${post._id}`);
              return { ...post, requests: [] };
            }
          } catch (error) {
            console.error(`Error fetching requests for post ${post._id}:`, error);
            return { ...post, requests: [] };
          }
        })
      );
      
      console.log('Posts with requests:', postsWithRequests);
      
      // Update cache
      cache.userAdoptionPosts = {
        data: postsWithRequests,
        timestamp: Date.now()
      };
      
      setUserAdoptionPosts(postsWithRequests);
      setError(prev => ({ ...prev, user: '' }));
    } catch (error) {
      console.error('Fetch error:', error);
      setError(prev => ({ ...prev, user: error.message || 'Failed to fetch user adoption posts' }));
    } finally {
      setLoading(prev => ({ ...prev, user: false }));
    }
  };

  const createAdoptionPost = async (postData) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token provided');
      }

      const response = await fetch(`${API_BASE_URL}/adoptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create adoption post');
      }

      const data = await response.json();
      console.log('Adoption post created:', data);

      // Update both states with the new post
      setAllAdoptionPosts(prev => [data, ...prev]);
      setUserAdoptionPosts(prev => [data, ...prev]);

      // AUTO-UPDATE STAT CARDS ON CREATE
      fetchUserStats();

      return data;
    } catch (error) {
      console.error('Error creating adoption post:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const updateAdoptionPost = async (postId, updatedData) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token provided');
      }

      const response = await fetch(`${API_BASE_URL}/adoptions/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update adoption post');
      }

      const data = await response.json();
      
      // Update both states
      setAllAdoptionPosts(prev => prev.map(post => 
        post._id === postId ? data : post
      ));
      setUserAdoptionPosts(prev => prev.map(post => 
        post._id === postId ? data : post
      ));
      
      // Clear cache to ensure fresh data on next fetch
      cache.userAdoptionPosts = { data: null, timestamp: 0 };
      cache.allAdoptionPosts = { data: null, timestamp: 0 };
      
      return data;
    } catch (error) {
      console.error('Error updating adoption post:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const deleteAdoptionPost = async (postId) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token provided');
      }

      const response = await fetch(`${API_BASE_URL}/adoptions/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete adoption post');
      }

      // Update both states
      setAllAdoptionPosts(prev => prev.filter(post => post._id !== postId));
      setUserAdoptionPosts(prev => prev.filter(post => post._id !== postId));

      // AUTO-UPDATE STAT CARDS ON DELETE
      fetchUserStats();
    } catch (error) {
      console.error('Error deleting adoption post:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const requestAdoption = async (postId, requestData) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token provided');
      }

      // Check if requestData is FormData (for image upload) or regular object
      const isFormData = requestData instanceof FormData;
      
      if (isFormData) {
        // Handle FormData (includes image)
        console.log('Sending adoption request with FormData:', { postId });
        
        const response = await fetch(`${API_BASE_URL}/adoptions/${postId}/request`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // Don't set Content-Type for FormData, let browser set it with boundary
          },
          body: requestData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to request adoption');
        }

        const data = await response.json();
        console.log('Adoption request response:', data);
        
        // Clear cache to ensure fresh data on next fetch
        cache.userAdoptionPosts = { data: null, timestamp: 0 };
        cache.allAdoptionPosts = { data: null, timestamp: 0 };

        return data;
      } else {
        // Handle regular JSON data (fallback for backward compatibility)
        const { name, email, phone, message } = requestData;
        
        if (!name || !email || !phone || !message) {
          throw new Error('All fields are required');
        }

        console.log('Sending adoption request:', { postId, requestData });

        const response = await fetch(`${API_BASE_URL}/adoptions/${postId}/request`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            email,
            phone,
            message
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to request adoption');
        }

        const data = await response.json();
        console.log('Adoption request response:', data);
        
        // Clear cache to ensure fresh data on next fetch
        cache.userAdoptionPosts = { data: null, timestamp: 0 };
        cache.allAdoptionPosts = { data: null, timestamp: 0 };

        return data;
      }
    } catch (error) {
      console.error('Error requesting adoption:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleAdoptionRequest = async (postId, requestId, action) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token provided');
      }

      console.log(`Handling adoption request: ${action} for post ${postId}, request ${requestId}`);

      const response = await fetch(`${API_BASE_URL}/adoptions/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: action === 'accept' ? 'accepted' : 'rejected' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} adoption request`);
      }

      const data = await response.json();
      console.log('Adoption request response:', data);

      // Update the post in both states
      const newStatus = action === 'accept' ? 'adopted' : 'available';
      
      // Update allAdoptionPosts
      setAllAdoptionPosts(prev => prev.map(post => 
        post._id === postId ? { ...post, status: newStatus } : post
      ));
      
      // Update userAdoptionPosts
      setUserAdoptionPosts(prev => prev.map(post => {
        if (post._id === postId) {
          // Update the post status
          const updatedPost = { ...post, status: newStatus };
          
          // Update the request status
          if (updatedPost.requests) {
            updatedPost.requests = updatedPost.requests.map(request => 
              request._id === requestId 
                ? { ...request, status: action === 'accept' ? 'accepted' : 'rejected' }
                : action === 'accept' 
                  ? { ...request, status: 'rejected' } // Reject all other requests if accepting one
                  : request
            );
          }
          
          return updatedPost;
        }
        return post;
      }));

      // Clear cache to ensure fresh data on next fetch
      cache.userAdoptionPosts = { data: null, timestamp: 0 };
      cache.allAdoptionPosts = { data: null, timestamp: 0 };

      return data;
    } catch (error) {
      console.error('Error handling adoption request:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  const checkUserRequest = async (postId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        return { hasRequest: false, requestStatus: null, requestId: null };
      }

      const response = await fetch(`${API_BASE_URL}/adoptions/${postId}/check-request`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Error checking user request:', response.status);
        return { hasRequest: false, requestStatus: null, requestId: null };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking user request:', error);
      return { hasRequest: false, requestStatus: null, requestId: null };
    }
  };

  const updateAdoptionStatus = async (postId, newStatus) => {
    try {
      setLoading(prev => ({ ...prev, action: true }));
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token provided');
      }

      const response = await fetch(`${API_BASE_URL}/adoptions/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update adoption status');
      }

      const data = await response.json();
      const reopenedCount = data.reopenedRequests ?? 0;

      const applyStatusUpdate = (post) => {
        if (post._id !== postId) return post;
        const next = {
          ...post,
          ...data,
          status: data.status ?? newStatus,
          vaccinated: data.vaccinated ?? post.vaccinated,
          neuteredSpayed: data.neuteredSpayed ?? post.neuteredSpayed,
        };
        if (reopenedCount > 0 && Array.isArray(post.requests)) {
          next.requests = post.requests.map((req) =>
            req.status === 'accepted' || req.status === 'rejected'
              ? { ...req, status: 'pending' }
              : req
          );
        }
        return next;
      };

      setAllAdoptionPosts((prev) => prev.map(applyStatusUpdate));
      setUserAdoptionPosts((prev) => prev.map(applyStatusUpdate));

      cache.userAdoptionPosts = { data: null, timestamp: 0 };
      cache.allAdoptionPosts = { data: null, timestamp: 0 };

      return data;
    } catch (error) {
      console.error('Error updating adoption status:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  return (
    <AdoptionContext.Provider
      value={{
        allAdoptionPosts,
        userAdoptionPosts,
        userStats,
        fetchUserStats,
        postRequests,
        loading,
        error,
        fetchAllAdoptionPosts,
        fetchUserAdoptions,
        createAdoptionPost,
        updateAdoptionPost,
        deleteAdoptionPost,
        requestAdoption,
        handleAdoptionRequest,
        checkUserRequest,
        updateAdoptionStatus
      }}
    >
      {children}
    </AdoptionContext.Provider>
  );
};

export const useAdoption = () => {
  const context = useContext(AdoptionContext);
  if (!context) {
    throw new Error('useAdoption must be used within an AdoptionProvider');
  }
  return context;
};