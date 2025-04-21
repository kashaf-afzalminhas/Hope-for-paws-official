import React, { createContext, useState, useContext } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config';

const AdoptionContext = createContext();

// Define the backend API URL
const BACKEND_API_URL = API_BASE_URL;

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
  
  // Helper function to get user ID consistently
  const getUserId = () => {
    // First try from context
    if (user?._id) return user._id;
    if (user?.id) return user.id;
    
    // Then try from storage
    try {
      const storedUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
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

  const fetchAllAdoptionPosts = async () => {
    try {
      // Check cache first
      if (isCacheValid('allAdoptionPosts')) {
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
      
      // Add AbortController to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Increase timeout to 30s
  
      try {
        const response = await fetch(`${API_BASE_URL}/adoptions`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
    
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
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
        
        // Only update state if the data has changed
        if (JSON.stringify(allAdoptionPosts) !== JSON.stringify(filteredData)) {
          setAllAdoptionPosts(filteredData);
        } else {
          console.log("Adoption posts data hasn't changed, skipping state update");
        }
        
        setError(prev => ({ ...prev, all: '' }));
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('Request was aborted due to timeout');
          setError(prev => ({ ...prev, all: 'Request timed out. Please try again.' }));
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError(prev => ({ ...prev, all: error.message || 'Failed to fetch adoption posts' }));
    } finally {
      setLoading(prev => ({ ...prev, all: false }));
    }
  };

  // const fetchUserAdoptions = async (userId) => {
  //   try {
  //     // Check cache first
  //     if (isCacheValid('userAdoptionPosts')) {
  //       console.log('Using cached user adoption posts');
  //       setUserAdoptionPosts(cache.userAdoptionPosts.data);
  //       return;
  //     }
      
  //     setLoading(prev => ({ ...prev, user: true }));
  //     const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
  //     // Use the helper function to get the user ID
  //     const effectiveUserId = userId || getUserId();
      
  //     if (!effectiveUserId) {
  //       console.error('No user ID available for fetching adoptions');
  //       setError(prev => ({ ...prev, user: 'User ID not found' }));
  //       return;
  //     }
      
  //     console.log('Fetching adoptions for user:', effectiveUserId);
      
  //     // First fetch the adoption posts with requests included
  //     const response = await fetch(`${API_BASE_URL}/api/adoptions/user/${effectiveUserId}?includeRequests=true`, {
  //       method: 'GET',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });
      
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }
      
  //     const postsData = await response.json();
  //     console.log('Received user adoption posts with requests:', postsData);
      
  //     // Update cache
  //     cache.userAdoptionPosts = {
  //       data: postsData,
  //       timestamp: Date.now()
  //     };
      
  //     // Only update state if the data has changed
  //     if (JSON.stringify(userAdoptionPosts) !== JSON.stringify(postsData)) {
  //       setUserAdoptionPosts(postsData);
  //     } else {
  //       console.log("User adoption posts data hasn't changed, skipping state update");
  //     }
      
  //     setError(prev => ({ ...prev, user: '' }));
  //   } catch (error) {
  //     console.error('Fetch error:', error);
  //     setError(prev => ({ ...prev, user: error.message || 'Failed to fetch user adoption posts' }));
  //   } finally {
  //     setLoading(prev => ({ ...prev, user: false }));
  //   }
  // };

  const fetchUserAdoptions = async (userId) => {
    try {
      setLoading(prev => ({ ...prev, user: true }));
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/adoptions/user/${userId}?includeRequests=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setUserAdoptionPosts(data);
      setError(prev => ({ ...prev, user: '' }));
    } catch (error) {
      console.error('Fetch error:', error);
      setError(prev => ({ ...prev, user: error.message }));
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

      // Ensure all required fields are present
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
      
      // Update the post in both states to show it's pending
      setAllAdoptionPosts(prev => prev.map(post => 
        post._id === postId ? { ...post, status: 'pending' } : post
      ));
      
      setUserAdoptionPosts(prev => prev.map(post => 
        post._id === postId ? { ...post, status: 'pending' } : post
      ));

      return data;
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

      const response = await fetch(`${API_BASE_URL }/adoptions/requests/${requestId}`, {
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

  return (
    <AdoptionContext.Provider
      value={{
        allAdoptionPosts,
        userAdoptionPosts,
        postRequests,
        loading,
        error,
        fetchAllAdoptionPosts,
        fetchUserAdoptions,
        createAdoptionPost,
        updateAdoptionPost,
        deleteAdoptionPost,
        requestAdoption,
        handleAdoptionRequest
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