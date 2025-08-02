import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import RecentChats from '../Components/RecentChats';
import ChatWindow from '../Components/ChatWindow';
import { User, ConversationWithUser } from '../types/index';
import { getAllUsers, createConversation, getConversationBetweenUsers, getUserConversations } from '../Main/api';
import { getSocket, initSocket } from '../services/socket';
import { getCurrentUserId } from '../lib/utils';

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
  const user = JSON.parse(localStorage.getItem("user")) || JSON.parse(sessionStorage.getItem("user"));
  const isAuthenticated = !!user;
  const currentUserId = getCurrentUserId(user);
  const { recipientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
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
  const [conversations, setConversations] = useState([]);
  const [conversationCache, setConversationCache] = useState(new Map());
  const [conversationLookup, setConversationLookup] = useState(new Map());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cameFromPage, setCameFromPage] = useState(null);
  const currentUserIdRef = useRef(currentUserId);
  
  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);

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
          // Create new conversation
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

  // Debug logging
  console.log('ChatPage render:', {
    isAuthenticated,
    currentUserId,
    isLoadingUsers,
    usersCount: users.length,
    user: user ? { id: user.id, _id: user._id, username: user.username } : null,
    error,
    userObjectKeys: user ? Object.keys(user) : null,
    finalUserId: user?.id || user?._id,
    userObjectFull: user
  });

  // Check if user object has required fields
  useEffect(() => {
    if (user && !user.id) {
      console.error('User object missing id field:', user);
      console.log('Available fields in user object:', Object.keys(user));
      setError('User data is incomplete. Please log in again.');
    }
  }, [user]);

  // Initialize socket when user is authenticated
  useEffect(() => {
    if (currentUserId && isAuthenticated) {
      console.log('Initializing socket for user:', currentUserId);
      
      // Test backend connectivity first
      const testBackendConnection = async () => {
        try {
          const baseURL = import.meta.env.VITE_API_URL || 'https://hope-for-paws-official-backend.vercel.app/api';
          const response = await fetch(`${baseURL.replace('/api', '')}/health`);
          const data = await response.json();
          console.log('Backend health check:', data);
        } catch (error) {
          console.error('Backend connectivity test failed:', error);
          setError('Cannot connect to chat server');
        }
      };
      
      testBackendConnection();
      
      try {
        const socket = initSocket(currentUserId);
        console.log('Socket initialized:', socket);
      } catch (error) {
        console.error('Error initializing socket:', error);
        setError('Failed to initialize chat connection');
      }
    }
  }, [currentUserId, isAuthenticated]);

  // Error boundary effect
  useEffect(() => {
    const handleError = (error) => {
      console.error('ChatPage error:', error);
      setError(error.message);
      setIsLoadingUsers(false);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => handleError(event.reason));

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

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
    console.log('API configuration:', { AUTH_BASE_URL: import.meta.env.VITE_API_URL || 'https://hope-for-paws-official-backend.vercel.app', API_ROUTES_BASE_URL: `${(import.meta.env.VITE_API_URL || 'https://hope-for-paws-official-backend.vercel.app').replace('/api', '')}/api` });
    
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
      setUsers(response.data?.data || []);
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

  // Handle socket messages
  useEffect(() => {
    if (!currentUserId) return;
    const socket = getSocket();
    if (!socket) return;
    const handleNewMessage = (message) => {
      if (message.isReceiver || (message.isSender && message.senderId === currentUserId)) {
        if (selectedConversation?._id === message.conversationId) {
          setSelectedConversation(prev => ({
            ...prev,
            lastMessage: message,
            updatedAt: message.createdAt
          }));
        }
      }
    };
    socket.on('getMessage', handleNewMessage);
    return () => {
      socket.off('getMessage', handleNewMessage);
    };
  }, [currentUserId, selectedConversation]);

  const findExistingConversation = useCallback((otherUserId) => {
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
        setConversations(prev => [createResponse.data, ...prev]);
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

  const handleSelectConversation = (conversationData) => {
    // Use the user attached by RecentChats, or look up if missing
    const otherUserId = conversationData.members
      ? conversationData.members.find(id => id !== currentUserId)
      : (conversationData.participants || []).find(id => id !== currentUserId);

    const fullUserObj = conversationData.user
      || users.find(u => u._id === otherUserId)
      || { username: 'Unknown', _id: otherUserId };

    // On desktop, clear the URL param before setting the new conversation
    if (!isMobile && recipientId) {
      navigate('/chat');
    }

    console.log('Switching to conversation:', conversationData);
    console.log('With user:', fullUserObj);

    setSelectedConversation(conversationData);
    setSelectedUser(fullUserObj);
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
    // Clear URL parameter for mobile
    if (isMobile && recipientId) {
      navigate('/chat');
    }
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Update last message in conversations
  const updateConversationLastMessage = (conversationId, message) => {
    setConversations(prev => {
      const exists = prev.some(conv => conv._id === conversationId);
      let updated = [];
      if (exists) {
        updated = prev.map(conv =>
          conv._id === conversationId
            ? { ...conv, lastMessage: message, updatedAt: message.createdAt }
            : conv
        );
      } else {
        // Try to get the other userId from selectedUser or message
        let otherUserId = null;
        if (selectedUser && selectedUser._id) {
          otherUserId = selectedUser._id;
        } else if (message && message.senderId && message.senderId !== currentUserId) {
          otherUserId = message.senderId;
        }
        // Minimal conversation object
        const newConv = {
          _id: conversationId,
          members: [currentUserId, otherUserId].filter(Boolean),
          participants: [currentUserId, otherUserId].filter(Boolean),
          lastMessage: message,
          updatedAt: message.createdAt,
        };
        updated = [newConv, ...prev];
      }
      // Sort by updatedAt descending
      return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  };

  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUserId) return;
      try {
        const response = await getUserConversations(currentUserId);
        const conversationsData = Array.isArray(response?.data?.data) ? response.data.data : [];
        setConversations(conversationsData);
      } catch (error) {
        setConversations([]);
        // Optionally show a toast or error
      }
    };
    fetchConversations();
  }, [currentUserId]);

  useEffect(() => {
    if (selectedConversation && users.length > 0) {
      const otherUserId = selectedConversation.members
        ? selectedConversation.members.find(id => id !== currentUserId)
        : (selectedConversation.participants || []).find(id => id !== currentUserId);

      const fullUserObj = users.find(u => u._id === otherUserId);
      if (fullUserObj && (!selectedUser || selectedUser._id !== fullUserObj._id)) {
        setSelectedUser(fullUserObj);
      }
    }
  }, [users, selectedConversation, currentUserId]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-screen font-body text-primary">
        <div className="text-center">
          <p className="text-red-500 mb-4">You need to sign in to access chat</p>
          <a href="/signin" className="text-primary hover:underline">Sign In</a>
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
  <div className="flex flex-col h-full bg-[#f8f4ea]">
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

    {/* Main content area - Adjusted for navbar on mobile */}
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar - Recent Chats */}
      <div className={`
        h-full w-full md:w-80 lg:w-96
        bg-[#f8f4ea] shadow-sm md:shadow-none
        transform transition-all duration-300 ease-in-out
        ${isMobile && showChatMobile ? 'hidden md:flex' : 'flex'}
        ${isMobile ? 'relative' : 'relative'}
        ${isTransitioning ? 'opacity-50' : 'opacity-100'}
        ${isMobile && !showChatMobile ? 'animate-fadeIn' : ''}
      `}>
        <div className="flex flex-col w-full h-full">
          {/* Recent chats list */}
          <div className="flex-1 overflow-y-auto">
            <RecentChats
              currentUserId={currentUserId}
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversation?._id}
              users={users}
              addToast={addToast}
              conversations={conversations}
              setConversations={setConversations}
              onBackToSidebar={() => {
                console.log('Chat onBackToSidebar called');
                console.log('Current showChatMobile:', showChatMobile);
                console.log('Came from page:', cameFromPage);
                
                // If we're already showing the conversation list, navigate back
                if (!showChatMobile) {
                  console.log('Already on conversation list, navigating back');
                  
                  // Navigate back to the page we came from
                  if (cameFromPage) {
                    console.log('Navigating back to:', cameFromPage);
                    navigate(cameFromPage);
                  } else {
                    console.log('No cameFromPage, using navigate(-1)');
                    navigate(-1);
                  }
                  return;
                }
                
                setIsTransitioning(true);
                setShowChatMobile(false);
                setTimeout(() => {
                  setIsTransitioning(false);
                  console.log('Transition completed');
                }, 300);
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`
        flex-1 flex flex-col bg-[#fff7f0]
        ${isMobile && !showChatMobile ? 'hidden' : 'flex'}
        transition-all duration-300 ease-in-out
        ${isTransitioning ? 'opacity-50' : 'opacity-100'}
        ${isMobile && showChatMobile ? 'animate-slideInRight' : ''}
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