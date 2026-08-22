import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import RecentChats from '../Components/RecentChats';
import ChatWindow from '../Components/ChatWindow';
import { User, ConversationWithUser } from '../types/index';
import { getAllUsers, createConversation, getConversationBetweenUsers, getUserConversations } from '../Main/api';
//import { getSocket, initSocket } from '../services/socket';
import { getSocket, initSocket, setNotificationCallback, disconnectSocket } from '../services/socket';
import { getCurrentUserId } from '../lib/utils';
import { API_BASE_URL } from '../config';
import { useMessages } from '../context/MessageContext';

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message) => {
    setToasts((prevToasts) => [...prevToasts, message]);
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.slice(1));
    }, 3000);
  }, []);
  return { toasts, addToast };
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // Changed from 1024 to 768
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768; // Changed from 1024 to 768
      console.log('Chat useIsMobile - window width:', window.innerWidth, 'isMobile:', newIsMobile);
      setIsMobile(newIsMobile);
    };
    window.addEventListener('resize', handleResize);
    console.log('Chat initial isMobile:', isMobile, 'window width:', window.innerWidth);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

const ChatPage = () => {
  const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user")) || null;
  const isAuthenticated = !!user;
  const currentUserId = getCurrentUserId(user);
  
  // Early return if user data is invalid
  if (user && !currentUserId) {
    console.error('Invalid user data - missing ID:', user);
    return (
      <div className="flex items-center justify-center h-screen font-body bg-[#fff7f0]">
        <div className="text-center p-6 max-w-md">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 text-red-500 mx-auto mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-xl font-heading text-[#2c1810] mb-2">Invalid User Data</h3>
          <p className="font-body text-gray-600 mb-6">Your user data is incomplete. Please log in again.</p>
          <a 
            href="/signin" 
            className="px-6 py-2 bg-[#a07855] text-[#ffd8b8] rounded-full hover:bg-[#8a6a4d] transition-colors"
          >
            Sign In Again
          </a>
        </div>
      </div>
    );
  }
  const { recipientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Wrap useMessages in try-catch for better error handling
  let messageContext;
  try {
    messageContext = useMessages();
  } catch (error) {
    console.error('Error accessing MessageContext:', error);
    messageContext = {
      markAsRead: () => console.warn('MessageContext not available'),
      setCurrentConversationId: () => console.warn('MessageContext not available'),
      updateConversationUnreadCount: () => console.warn('MessageContext not available')
    };
  }
  
  const { markAsRead, setCurrentConversationId, updateConversations, conversations, refreshConversations } = messageContext;
  
  // Safety check for setCurrentConversationId
  const safeSetCurrentConversationId = setCurrentConversationId || (() => {
    console.warn('setCurrentConversationId is not available from context');
  });
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingUsersInProgress, setIsLoadingUsersInProgress] = useState(false);
  const [showChatMobile, setShowChatMobile] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const { toasts, addToast } = useToast();
  const isMobile = useIsMobile();
  const isMounted = useRef(true);
  const [lastHandledRecipientId, setLastHandledRecipientId] = useState(null);
  const [isSelectingConversation, setIsSelectingConversation] = useState(false);
  const [pendingConversationUserId, setPendingConversationUserId] = useState(null);
  const [conversationCache, setConversationCache] = useState(new Map());
  const [conversationLookup, setConversationLookup] = useState(new Map());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cameFromPage, setCameFromPage] = useState(null);
  const currentUserIdRef = useRef(currentUserId);
  const [userCache, setUserCache] = useState(new Map()); // Add user cache


  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);
 // Enhanced user caching functions
 const getUserFromCache = useCallback((userId) => {
  return userCache.get(userId) || null;
}, [userCache]);

const addUserToCache = useCallback((user) => {
  if (user && user._id) {
    setUserCache(prev => new Map(prev).set(user._id, user));
  }
}, []);


  // Track where user came from
  useEffect(() => {
    // Check if we came from a specific page by looking at the location state
    const locationState = window.history.state?.usr;
    if (locationState?.fromAdoption) {
      setCameFromPage('/adoption');
      console.log('User came from adoption page');
    } else if (locationState?.fromPage) {
      setCameFromPage(locationState.fromPage);
      console.log('User came from:', locationState.fromPage);
    }
  }, []);

  // Enhanced mobile navigation state management
  useEffect(() => {
    if (!recipientId || !currentUserId) {
      // If no recipientId, show conversation list on mobile
      if (isMobile && showChatMobile) {
        console.log('No recipientId, switching to conversation list view');
        setShowChatMobile(false);
      }
      return;
    }

    // Prevent duplicate processing
    if (lastHandledRecipientId === recipientId) return;
    setLastHandledRecipientId(recipientId);

    const handleRecipientNavigation = async () => {
      if (!recipientId || recipientId === 'undefined' || recipientId === 'null') {
        return;
      }

      setIsTransitioning(true);
      try {
        const response = await getConversationBetweenUsers(currentUserId, recipientId);
        if (response.data?.data) {
          setSelectedConversation(response.data.data);
          const fullUserObj = users.find(u => u._id === recipientId) || { _id: recipientId };
          setSelectedUser(fullUserObj);
          if (isMobile) {
            // Smooth transition to chat view
            setTimeout(() => setShowChatMobile(true), 100);
          }
        } else {
          // Only create a conversation if recipientId is a valid user and not self
          if (recipientId !== currentUserId) {
            const createResponse = await createConversation(currentUserId, recipientId);
            if (createResponse.data?.data) {
              setSelectedConversation(createResponse.data.data);
              const fullUserObj = users.find(u => u._id === recipientId) || { _id: recipientId };
              setSelectedUser(fullUserObj);
              if (isMobile) {
                setTimeout(() => setShowChatMobile(true), 100);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error handling recipient navigation:', error);
        addToast({
          title: 'Error',
          description: 'Failed to start conversation',
          variant: 'destructive'
        });
      } finally {
        setIsTransitioning(false);
      }
    };

    handleRecipientNavigation();
  }, [recipientId, currentUserId, isMobile, users, lastHandledRecipientId, addToast]);

  // Handle URL changes for mobile view switching
  useEffect(() => {
    console.log('URL change detected - pathname:', location.pathname, 'recipientId:', recipientId);
    
    // If we're on /chat without a recipientId, show conversation list on mobile
    if (location.pathname === '/chat' && !recipientId && isMobile) {
      console.log('On /chat without recipientId, showing conversation list');
      setShowChatMobile(false);
      setSelectedConversation(null);
      setSelectedUser(null);
    }
    
    // If we're on /chat with a recipientId, show chat view on mobile
    if (location.pathname.startsWith('/chat/') && recipientId && isMobile) {
      console.log('On /chat with recipientId, showing chat view');
      setShowChatMobile(true);
    }
  }, [location.pathname, recipientId, isMobile]);

  // Debug logging (only when there's an error or loading state changes)
  useEffect(() => {
    if (error || isLoadingUsers) {
      console.log('ChatPage state:', {
        isAuthenticated,
        currentUserId,
        isLoadingUsers,
        error,
        hasUser: !!user,
        userHasId: !!(user?._id || user?.id)
      });
    }
  }, [error, isLoadingUsers, isAuthenticated, currentUserId, user]);

  // User validation is now handled with early return above

  // Initialize socket when user is authenticated
  useEffect(() => {
    if (currentUserId && isAuthenticated) {
      console.log('ðŸš€ Initializing socket for user:', currentUserId);
      
      // Request notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('🔔 Notification permission:', permission);
        });
      }
      
      // Test backend connectivity first
      const testBackendConnection = async () => {
        try {
          const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
          const data = await response.json();
          console.log('📩 Backend health check:', data);
        } catch (error) {
          console.error('⚠️ Backend connectivity test failed:', error);
          setError('Cannot connect to chat server');
        }
      };
      
      testBackendConnection();
      
      try {
        // Check if socket is already connected (now handled globally by MessageProvider)
        const existingSocket = getSocket();
        if (existingSocket && existingSocket.connected) {
          console.log('✅ Socket already connected, reusing existing connection');
        } else {
          console.log('ℹ️ Socket not connected yet, MessageProvider should handle initialization');
        }
        
        // Set up notification callback for real-time notifications
        setNotificationCallback((notification) => {
          console.log('🔔 Received notification:', notification);
          
          // Show toast notification
          addToast({
            title: notification.title,
            description: notification.body,
            variant: 'default'
          });
          
          // Show browser notification if permission is granted
          if (Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.body,
              icon: '/hfplogo.png'
            });
          }
        });
      } catch (error) {
        console.error('⚠️ Error initializing socket:', error);
        setError('Failed to initialize chat connection');
      }
    }

    // No cleanup needed - socket is managed globally by MessageProvider
    return () => {
      console.log('👋 Chat component unmounting...');
    };
  }, [currentUserId, isAuthenticated, addToast]);

  // Error boundary effect
  useEffect(() => {
    const handleError = (error) => {
      console.error('ChatPage error:', error);
      setError(error.message || 'An unexpected error occurred');
      setIsLoadingUsers(false);
    };

    const handleUnhandledRejection = (event) => {
      console.error('ChatPage unhandled rejection:', event.reason);
      setError(event.reason?.message || 'An unexpected error occurred');
      setIsLoadingUsers(false);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Add error recovery effect - only clear error if it's not a critical error
  useEffect(() => {
    if (error && error !== 'User data is incomplete. Please log in again.' && conversations && Array.isArray(conversations) && conversations.length > 0) {
      // If we have conversations but there's an error (not user data error), clear the error
      console.log('Clearing error because conversations are available');
      setError(null);
    }
  }, [error, conversations]);

  // Move loadUsers function outside useEffect so it can be accessed by error handlers
  const loadUsers = async () => {
    console.log('=== loadUsers function called ===');
    if (!currentUserId || isLoadingUsersInProgress) {
      console.log('Skipping loadUsers - no currentUserId or already loading');
      console.log('currentUserId:', currentUserId);
      console.log('isLoadingUsersInProgress:', isLoadingUsersInProgress);
      return;
    }
    
    console.log('Loading users for currentUserId:', currentUserId);
    console.log('API configuration:', { AUTH_BASE_URL: API_BASE_URL , API_ROUTES_BASE_URL: `${API_BASE_URL}` });
    
    setIsLoadingUsersInProgress(true);
    console.log('Set isLoadingUsersInProgress to true');
    
    try {
      console.log('About to call getAllUsers()');
      const response = await getAllUsers();
      console.log('getAllUsers() completed');
      console.log('Response object:', response);
      console.log('Response.data:', response.data);
      console.log('Response.data.data:', response.data?.data);
      console.log('Is response.data.data an array?', Array.isArray(response.data?.data));
      console.log('Response.data.data length:', response.data?.data?.length);
      
      console.log('Users loaded successfully:', response);
      console.log('Response data:', response.data);
      console.log('Response status:', response.status);
      console.log('Actual users array:', response.data?.data);
      console.log('Setting users to:', response.data?.data || []);

      // Validate response data
      if (!response.data || !Array.isArray(response.data.data)) {
        throw new Error('Invalid response format from getAllUsers API');
      }

      const usersData = response.data.data || [];
      setUsers(usersData);
      
      // Cache all users
      usersData.forEach(user => {
        if (user && user._id) {
          addUserToCache(user);
        }
      });

      console.log('Users set in state, clearing error');
      setError(null); // Clear any previous errors
    } catch (error) {
      console.log('Error in loadUsers:', error);
      console.error('Error loading users:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Handle rate limit errors specifically
      if (error.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
        addToast({
          title: 'Rate Limited',
          description: 'Too many requests. Please wait a moment and try again.',
          variant: 'destructive',
        });
      } else {
        setError(error.response?.data?.message || 'Failed to load users');
        addToast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to load users',
          variant: 'destructive',
        });
      }
      
      // Set empty array as fallback to prevent infinite loading
      setUsers([]);
    } finally {
      console.log('loadUsers finally block');
      console.log('Setting loading states to false');
      setIsLoadingUsers(false);
      setIsLoadingUsersInProgress(false);
    }
  };

  useEffect(() => {
    console.log('=== useEffect for loadUsers triggered ===');
    console.log('currentUserId:', currentUserId);
    console.log('user:', user);
    
    if (!currentUserId) {
      console.log('No currentUserId, setting loading to false');
      setIsLoadingUsers(false);
      if (user) {
        console.warn('User object exists but no ID found:', user);
        setError('User data is incomplete. Please log in again.');
      }
      return;
    }
    
    // Convert currentUserId to string and check if it's a valid format
    const currentUserIdStr = String(currentUserId);
    console.log('Current user ID as string:', currentUserIdStr);
    
    if (currentUserIdStr.length < 10) {
      console.error('CurrentUser ID seems too short:', currentUserIdStr);
      addToast({
        title: 'Error',
        description: 'Invalid user ID format. Please log in again.',
        variant: 'destructive',
      });
      return;
    }
    
    console.log('About to call loadUsers()');
    const timeoutId = setTimeout(() => {
      if (isMounted.current && isLoadingUsers) {
        console.warn('Loading timeout reached, setting loading to false');
        setIsLoadingUsers(false);
        setUsers([]);
      }
    }, 10000); // 10 second timeout
    
    loadUsers();
    
    return () => {
      console.log('useEffect cleanup - setting isMounted to false');
      isMounted.current = false;
      clearTimeout(timeoutId);
    };
  }, [currentUserId]); // Removed addToast from dependencies

  // Update last message in conversations
  const updateConversationLastMessage = (conversationId, message) => {
    console.log('ðŸ”„ Updating conversation last message:', { conversationId, message });
    
    // This function is now only used for optimistic updates when sending messages
    // The actual conversation updates are handled by MessageContext via socket events
    
    // Ensure we have valid data
    if (!conversationId || !message) {
      console.warn('updateConversationLastMessage: Invalid parameters:', { conversationId, message });
      return;
    }
  };

  // Handle socket messages - REMOVED
  // MessageContext now handles all socket events centrally
  
  const findExistingConversation = useCallback((otherUserId) => {
    if (!otherUserId || !Array.isArray(conversations)) {
      console.warn('findExistingConversation: Invalid parameters:', { otherUserId, conversations });
      return null;
    }
    
    const cacheKey = [currentUserIdRef.current, otherUserId].sort().join('-');
    if (conversationLookup.has(cacheKey)) {
      return conversationLookup.get(cacheKey);
    }
    const existing = conversations.find(conv => {
      const participants = conv.participants || [];
      return (
        participants.length === 2 &&
        participants.some(id => id.toString() === currentUserIdRef.current.toString()) &&
        participants.some(id => id.toString() === otherUserId.toString())
      );
    });
    if (existing) {
      setConversationLookup(prev => new Map(prev).set(cacheKey, existing));
      return existing;
    }
    return null;
  }, [conversations, conversationLookup]);

  const handleSelectUser = async (userObj) => {
    // Validate user object
    if (!userObj || !userObj._id) {
      console.error('handleSelectUser: Invalid user object:', userObj);
      addToast({
        title: 'Error',
        description: 'Invalid user data',
        variant: 'destructive'
      });
      return;
    }
    
    const otherUserId = getCurrentUserId(userObj);
    if (!otherUserId || otherUserId === currentUserIdRef.current) {
      addToast({
        title: 'Invalid User',
        description: 'Cannot start conversation with this user',
        variant: 'destructive'
      });
      return;
    }
    
    const existingConv = findExistingConversation(otherUserId);
    if (existingConv) {
      setSelectedConversation(existingConv);
      setSelectedUser(userObj);
      if (isMobile) {
        setIsTransitioning(true);
        setTimeout(() => {
          setShowChatMobile(true);
          setIsTransitioning(false);
        }, 150);
      }
      return;
    }
    
    setIsSelectingConversation(true);
    setPendingConversationUserId(otherUserId);
    
    try {
      const findResponse = await getConversationBetweenUsers(currentUserIdRef.current, otherUserId);
      if (findResponse.data) {
        const cacheKey = [currentUserIdRef.current, otherUserId].sort().join('-');
        setConversationLookup(prev => new Map(prev).set(cacheKey, findResponse.data));
        setSelectedConversation(findResponse.data);
        setSelectedUser(userObj);
        if (isMobile) {
          setIsTransitioning(true);
          setTimeout(() => {
            setShowChatMobile(true);
            setIsTransitioning(false);
          }, 150);
        }
        return;
      }
      
      const createResponse = await createConversation(currentUserIdRef.current, otherUserId);
      if (createResponse.data) {
        const cacheKey = [currentUserIdRef.current, otherUserId].sort().join('-');
        setConversationLookup(prev => new Map(prev).set(cacheKey, createResponse.data));
        setSelectedConversation(createResponse.data);
        setSelectedUser(userObj);
        if (isMobile) {
          setIsTransitioning(true);
          setTimeout(() => {
            setShowChatMobile(true);
            setIsTransitioning(false);
          }, 150);
        }
        
        // Update conversations list with the new conversation
        // Note: This is now handled by the MessageContext via socket events
        // No need to manually update here as it will be handled automatically
        console.log('Chat: New conversation created, will be handled by MessageContext');
      }
    } catch (error) {
      console.error('Conversation error:', error);
      addToast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to start conversation',
        variant: 'destructive'
      });
    } finally {
      setIsSelectingConversation(false);
      setPendingConversationUserId(null);
    }
  };

  // Debug users state changes
  useEffect(() => {
    console.log('Users state updated:', users);
    console.log('Users count:', users?.length);
    console.log('Users array details:', users.map(u => ({ id: u._id, username: u.username, email: u.email })));
  }, [users]);

  // Cleanup effect to reset isMounted when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Clear conversation state when navigating away from chat
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (setCurrentConversationId) {
        setCurrentConversationId(null);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && setCurrentConversationId) {
        setCurrentConversationId(null);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (setCurrentConversationId) {
        setCurrentConversationId(null);
      }
    };
  }, [setCurrentConversationId]);

  const handleSelectConversation = (conversationData) => {
    // Validate conversation data
    if (!conversationData || !conversationData._id) {
      console.error('handleSelectConversation: Invalid conversation data:', conversationData);
      addToast({
        title: 'Error',
        description: 'Invalid conversation data',
        variant: 'destructive'
      });
      return;
    }
    
    // Use the user attached by RecentChats, or look up if missing
    const otherUserId = conversationData.members
      ? conversationData.members.find(id => id !== currentUserId)
      : (conversationData.participants || []).find(id => id !== currentUserId);

    if (!otherUserId) {
      console.error('handleSelectConversation: Could not find other user ID:', conversationData);
      addToast({
        title: 'Error',
        description: 'Could not identify conversation participant',
        variant: 'destructive'
      });
      return;
    }

    // Try to get user from cache first, then from users array
    let fullUserObj = conversationData.user || getUserFromCache(otherUserId);
    if (!fullUserObj) {
      fullUserObj = users.find(u => u._id === otherUserId) || { username: 'Unknown', _id: otherUserId };
    }

    // On desktop, clear the URL param before setting the new conversation
    if (!isMobile && recipientId) {
      navigate('/chat');
    }

    console.log('Switching to conversation:', conversationData);
    console.log('With user:', fullUserObj);

    setSelectedConversation(conversationData);
    setSelectedUser(fullUserObj);
    
    // Mark messages as read when conversation is selected
    if (conversationData._id) {
      try {
        markAsRead(conversationData._id);
        safeSetCurrentConversationId(conversationData._id);
      } catch (error) {
        console.error('Error marking conversation as read:', error);
      }
    }
    
    if (isMobile) {
      setIsTransitioning(true);
      setTimeout(() => {
        setShowChatMobile(true);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handleBackToList = () => {
    setIsTransitioning(true);
    setShowChatMobile(false);
    
    // Clear the selected conversation and current conversation ID
    setSelectedConversation(null);
    setSelectedUser(null);
    if (setCurrentConversationId) {
      setCurrentConversationId(null);
    }
    
    // Clear URL parameter for mobile
    if (isMobile && recipientId) {
      navigate('/chat');
    }
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Update last message in conversations
 

  useEffect(() => {
    if (selectedConversation && Array.isArray(users) && users.length > 0) {
      const otherUserId = selectedConversation.members
        ? selectedConversation.members.find(id => id !== currentUserId)
        : (selectedConversation.participants || []).find(id => id !== currentUserId);

      if (!otherUserId) {
        console.warn('Could not find other user ID in selected conversation:', selectedConversation);
        return;
      }

      // Try to get user from cache first, then from users array
      let fullUserObj = getUserFromCache(otherUserId);
      if (!fullUserObj) {
        fullUserObj = users.find(u => u._id === otherUserId);
      }

      if (fullUserObj && (!selectedUser || selectedUser._id !== fullUserObj._id)) {
        setSelectedUser(fullUserObj);
      }
    }
  }, [users, selectedConversation, currentUserId, getUserFromCache, selectedUser]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUserId) return;
      
      try {
        await refreshConversations(currentUserId);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        addToast({
          title: 'Error',
          description: 'Failed to load conversations',
          variant: 'destructive'
        });
      }
    };
    
    fetchConversations();
  }, [currentUserId, refreshConversations, addToast]);

  // Add conversation deduplication and state management
  useEffect(() => {
    if (!conversations || !Array.isArray(conversations)) return;
    
    // Deduplicate conversations by ID and participants
    const dedupeById = (arr) => {
      const map = new Map();
      arr.forEach(item => item?._id && map.set(item._id, item));
      return Array.from(map.values());
    };

    const dedupeByParticipants = (arr) => {
      const map = new Map();
      arr.forEach(item => {
        if (item?.participants?.length === 2) {
          const key = item.participants
            .map(String)
            .sort()
            .join('-');
          if (!map.has(key)) {
            map.set(key, item);
          } else {
            const existing = map.get(key);
            if (new Date(item.updatedAt) > new Date(existing.updatedAt)) {
              map.set(key, item);
            }
          }
        }
      });
      return Array.from(map.values());
    };

    const dedupedById = dedupeById(conversations);
    const uniqueConvs = dedupeByParticipants(dedupedById);

    // Only update if we actually have deduplicated conversations
    if (uniqueConvs.length !== conversations.length) {
      console.log('Chat: Deduplicating conversations from', conversations.length, 'to', uniqueConvs.length);
      updateConversations(uniqueConvs);
    }
  }, [conversations, updateConversations]);

  // Handle conversation unread count updates when selected
  useEffect(() => {
    if (selectedConversation?._id && Array.isArray(conversations)) {
      // Update the unread count for the selected conversation
      const updatedConversations = conversations.map((conv) =>
        conv._id === selectedConversation._id
          ? { ...conv, unreadCount: 0 }
          : conv
      );
      
      // Only update if there are actual changes
      const hasChanges = updatedConversations.some((conv, index) => 
        conv.unreadCount !== conversations[index]?.unreadCount
      );
      
      if (hasChanges) {
        console.log('Chat: Updating unread counts for selected conversation');
        updateConversations(updatedConversations);
      }
    }
  }, [selectedConversation?._id, conversations, updateConversations]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen font-body bg-[#f8f4ea] pt-8 pb-8 px-4">
        <div className="text-center p-6 md:p-8 max-w-md w-full">
          {/* Chat icon with decorative elements */}
          <div className="relative mb-6 md:mb-8">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-[#fff7f0] rounded-full flex items-center justify-center shadow-lg border-2 border-[#e5d9c8] mx-auto">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-12 w-12 md:h-16 md:w-16 text-[#a07855]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            {/* Decorative dots */}
            <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#a07855] flex items-center justify-center">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#ffd8b8] rounded-full"></div>
            </div>
            <div className="absolute -bottom-1 -left-1 md:-bottom-2 md:-left-2 w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#8a6a4d] flex items-center justify-center">
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[#ffd8b8] rounded-full"></div>
            </div>
          </div>
          
          {/* Main content */}
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-[#2c1810] mb-3 md:mb-4">
            Welcome to Chat
          </h2>
          <p className="font-body text-[#2c1810]/80 mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
            Connect with other pet lovers and start meaningful conversations about adoption, care, and everything pets!
          </p>
          
          {/* Sign in button */}
          <div className="space-y-3 md:space-y-4">
            <a 
              href="/signin" 
              className="inline-flex items-center px-6 md:px-8 py-3 md:py-4 bg-[#a07855] hover:bg-[#8a6a4d] text-[#ffd8b8] rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-semibold text-sm md:text-base w-full md:w-auto justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Sign In to Start Chatting
            </a>
            
            {/* Additional options */}
            <div className="text-xs md:text-sm text-[#2c1810]/60">
              <p>Don't have an account? 
                <a href="/signup" className="text-[#a07855] hover:text-[#8a6a4d] font-semibold ml-1 transition-colors">
                  Sign up here
                </a>
              </p>
            </div>
          </div>
          
          {/* Feature highlights */}
          <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#fff7f0] rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3 border border-[#e5d9c8]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-[#a07855]" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-[#2c1810] mb-1 text-sm md:text-base">Real-time Chat</h3>
              <p className="text-xs md:text-sm text-[#2c1810]/70">Instant messaging with other pet lovers</p>
            </div>
            
            <div className="text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#fff7f0] rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3 border border-[#e5d9c8]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-[#a07855]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-[#2c1810] mb-1 text-sm md:text-base">Connect</h3>
              <p className="text-xs md:text-sm text-[#2c1810]/70">Build relationships with fellow pet enthusiasts</p>
            </div>
            
            <div className="text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#fff7f0] rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3 border border-[#e5d9c8]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-[#a07855]" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-heading font-semibold text-[#2c1810] mb-1 text-sm md:text-base">Safe & Secure</h3>
              <p className="text-xs md:text-sm text-[#2c1810]/70">Your conversations are private and protected</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingUsers) {
    return (
      <div className="flex items-center justify-center h-screen font-body bg-[#fff7f0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a07855] mx-auto mb-4"></div>
          <p className="text-[#2c1810]">Loading your messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen font-body bg-[#fff7f0]">
        <div className="text-center p-6 max-w-md">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 text-red-500 mx-auto mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-xl font-heading text-[#2c1810] mb-2">Error loading chat</h3>
          <p className="font-body text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setIsLoadingUsers(true);
              loadUsers();
            }}
            className="px-6 py-2 bg-[#a07855] text-[#ffd8b8] rounded-full hover:bg-[#8a6a4d] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

return (
  <div className="flex flex-col h-screen bg-[#f8f4ea] chat-container">
    {/* Toast notifications - updated design */}
    {toasts.length > 0 && (
      <div className="fixed top-4 right-4 z-50 space-y-3 w-full max-w-xs">
        {toasts.map((toast, index) => (
          <div 
            key={index}
            className={`p-4 rounded-xl shadow-lg transition-all duration-300 transform ${
              toast.variant === 'destructive' 
                ? 'bg-red-50 text-red-800 border border-red-200 shadow-red-100' 
                : 'bg-[#fff7f0] text-[#2c1810] border border-[#e5d9c8]'
            } flex items-start space-x-3 animate-fadeIn`}
          >
            <div className={`flex-shrink-0 mt-0.5 ${
              toast.variant === 'destructive' ? 'text-red-500' : 'text-[#a07855]'
            }`}>
              {toast.variant === 'destructive' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="font-semibold font-heading">{toast.title}</h3>
              <p className="text-sm mt-1">{toast.description}</p>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Main content area - Fixed height constraints */}
    <div className="flex flex-1 overflow-hidden h-full min-h-0">
      {/* Sidebar - Recent Chats */}
      <div className={`
        h-full w-full md:w-80 lg:w-96
        bg-[#f5efe6] shadow-sm md:shadow-none
        transform transition-all duration-300 ease-in-out
        ${isMobile && showChatMobile ? 'hidden md:flex' : 'flex'}
        ${isMobile ? 'relative' : 'relative'}
        ${isTransitioning ? 'opacity-50' : 'opacity-100'}
        ${isMobile && !showChatMobile ? 'animate-fadeIn' : ''}
        flex-shrink-0
      `}>
        <div className="flex flex-col w-full h-full">
          {/* Recent chats list */}
          <div className="flex-1 overflow-y-auto">
            <RecentChats
              currentUserId={currentUserId}
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversation?._id}
              users={users}
              conversations={conversations}
              setConversations={updateConversations}
              onBackToSidebar={handleBackToList}
              addToast={addToast}
              getUserFromCache={getUserFromCache}
            />
          </div>
        </div>
      </div>

      {/* Main Chat Area - Fixed height and flex constraints */}
      <div className={`
        flex-1 flex flex-col bg-[#fff7f0] h-full
        ${isMobile && !showChatMobile ? 'hidden' : 'flex'}
        transition-all duration-300 ease-in-out
        ${isTransitioning ? 'opacity-50' : 'opacity-100'}
        ${isMobile && showChatMobile ? 'animate-slideInRight' : ''}
        min-h-0
      `}>
        {isSelectingConversation || isTransitioning ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-[#2c1810]">
            <div className="relative">
              <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-[#a07855] border-t-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-[#a07855]/20 animate-ping"></div>
              </div>
            </div>
            <p className="mt-4 font-body">Loading conversation...</p>
          </div>
        ) : selectedConversation ? (
                     <ChatWindow
             key={selectedConversation?._id}
             conversationId={selectedConversation._id}
             currentUser={user}
             otherUser={selectedUser}
             onBack={handleBackToList}
             updateConversationLastMessage={updateConversationLastMessage}
             addToast={addToast}
             setCurrentConversationId={setCurrentConversationId}
           />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-[#f0e6d8] rounded-full flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 text-[#a07855]" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2">
                <div className="w-10 h-10 rounded-full bg-[#a07855] flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-heading font-bold text-[#2c1810] mb-3">
              Start a Conversation
            </h3>
            <p className="font-body text-[#2c1810]/80 max-w-md mb-8">
              Select a chat from your conversations or create a new one to begin messaging
            </p>
            {isMobile && (
              <button
                onClick={() => {
                  setIsTransitioning(true);
                  setShowChatMobile(false);
                  setTimeout(() => setIsTransitioning(false), 300);
                }}
                className="px-6 py-3 bg-[#a07855] hover:bg-[#8a6a4d] text-[#ffd8b8] rounded-xl transition-colors shadow-md hover:shadow-lg flex items-center mobile-transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                View Conversations
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);
}
export default ChatPage;