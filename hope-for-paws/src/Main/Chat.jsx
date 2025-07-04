import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import RecentChats from '../Components/RecentChats';
import ChatWindow from '../Components/ChatWindow';
import { User, ConversationWithUser } from '../types/index';
import { getAllUsers, createConversation, getConversationBetweenUsers } from '../Main/api';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

const ChatPage = () => {
  const user = JSON.parse(localStorage.getItem("user")) || JSON.parse(sessionStorage.getItem("user"));
  const isAuthenticated = !!user;
  const currentUserId = getCurrentUserId(user);
  const location = useLocation();
  const recipientId = location.state?.recipientId;
  const recipientEmail = location.state?.recipientEmail;
  
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

  // Move handleSelectUser above the useEffect that uses it
  const handleSelectUser = async (userObj) => {
    console.log('handleSelectUser called with:', userObj);
    if (selectedUser && getCurrentUserId(selectedUser) === getCurrentUserId(userObj)) return;
    if (isSelectingConversation) {
      console.log('Already selecting conversation, skipping...');
      return;
    }
    setIsSelectingConversation(true);
    setSelectedUser(userObj);
    try {
      if (!currentUserId) {
        addToast({
          title: 'Error',
          description: 'User ID not found. Please log in again.',
          variant: 'destructive',
        });
        return;
      }
      const otherUserId = getCurrentUserId(userObj);
      console.log('Calling getConversationBetweenUsers with:', currentUserId, otherUserId);
      const response = await getConversationBetweenUsers(currentUserId, otherUserId);
      console.log('getConversationBetweenUsers response:', response);
      let conversation;
      const convData = response.data?.data;
      if (convData) {
        conversation = new ConversationWithUser(
          convData._id,
          convData.members,
          convData.createdAt,
          convData.updatedAt,
          convData.lastMessage,
          convData.unreadCount,
          userObj
        );
        console.log('Existing conversation found:', conversation);
      } else {
        try {
          const newConvResponse = await createConversation(currentUserId, otherUserId);
          const newConvData = newConvResponse.data?.data;
          if (!newConvData) {
            throw new Error('Failed to create conversation');
          }
          conversation = new ConversationWithUser(
            newConvData._id,
            newConvData.members,
            newConvData.createdAt,
            newConvData.updatedAt,
            newConvData.lastMessage,
            newConvData.unreadCount,
            userObj
          );
          console.log('New conversation created:', conversation);
        } catch (error) {
          // If error is duplicate key or conversation already exists, fetch it again
          const isDuplicate = error?.response?.data?.message?.toLowerCase().includes('duplicate') ||
                              error?.response?.data?.error?.toLowerCase().includes('duplicate');
          if (isDuplicate) {
            // Try to fetch the conversation again
            const retryResponse = await getConversationBetweenUsers(currentUserId, otherUserId);
            const retryData = retryResponse.data?.data;
            if (retryData) {
              conversation = new ConversationWithUser(
                retryData._id,
                retryData.members,
                retryData.createdAt,
                retryData.updatedAt,
                retryData.lastMessage,
                retryData.unreadCount,
                userObj
              );
              setSelectedConversation(conversation);
              // Find the other user in the users list (not the current user)
              const otherUserIdInConv = conversation.members.find(id => id !== currentUserId);
              let fullUserObj = users.find(u => getCurrentUserId(u) === String(otherUserIdInConv));
              if (!fullUserObj) {
                fullUserObj = userObj;
              }
              setSelectedUser(fullUserObj);
              if (isMobile) setShowChatMobile(true);
              setIsSelectingConversation(false);
              return;
            }
          }
          // Silently handle the error without showing toast
          console.error('Conversation creation failed:', error);
          setIsSelectingConversation(false);
          return;
        }
      }
      setSelectedConversation(conversation);
      // Find the other user in the users list (not the current user)
      const otherUserIdInConv = conversation.members.find(id => id !== currentUserId);
      let fullUserObj = users.find(u => getCurrentUserId(u) === String(otherUserIdInConv));
      if (!fullUserObj) {
        // fallback to userObj (temp user)
        fullUserObj = userObj;
        console.log('Using fallback userObj for selectedUser:', fullUserObj);
      } else {
        console.log('Found full user object for selectedUser:', fullUserObj);
      }
      setSelectedUser(fullUserObj);
      if (isMobile) setShowChatMobile(true);
      console.log('Set selectedConversation:', conversation);
      console.log('Set selectedUser:', fullUserObj);
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      // Silently handle the error without showing toast
    } finally {
      setIsSelectingConversation(false);
    }
  };

  // Only call getConversationBetweenUsers when recipientId or currentUserId changes
  useEffect(() => {
    // Prevent double execution for the same recipientId
    if (!recipientId || !currentUserId || !user) return;
    if (lastHandledRecipientId === recipientId) return; // Guard: already handled

    setLastHandledRecipientId(recipientId);

    // Only call handleSelectUser here for navigation-triggered chat
    // Ensure handleSelectUser is not redundantly called elsewhere for this recipient
    // This prevents duplicate conversations from being created
    // Create a temporary user object if not found in users array
    const createTempUser = () => {
      const tempUser = {
        _id: recipientId,
        email: recipientEmail,
        username: location.state?.recipientUsername || 'User',
        status: 'offline'
      };
      console.log('Using temporary user object:', tempUser);
      return tempUser;
    };

    let recipient = users.find(u => getCurrentUserId(u) === String(recipientId));
    if (!recipient && recipientEmail) {
      recipient = users.find(u => u.email === recipientEmail);
    }
    if (!recipient) {
      recipient = createTempUser();
    }
    console.log('Recipient for chat:', recipient);

    setIsSelectingConversation(true);
    handleSelectUser(recipient).finally(() => {
      setIsSelectingConversation(false);
      setShowChatMobile(true);
    });
  }, [recipientId, recipientEmail, currentUserId, user, users]);

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
    const otherUserId = conversationData.members
      ? conversationData.members.find(id => id !== currentUserId)
      : (conversationData.participants || []).find(id => id !== currentUserId);

    const fullUserObj = users.find(u => u._id === otherUserId) || conversationData.user || {};
    
    const conversation = new ConversationWithUser(
      conversationData._id,
      conversationData.members || conversationData.participants,
      conversationData.createdAt,
      conversationData.updatedAt,
      conversationData.lastMessage,
      conversationData.unreadCount,
      fullUserObj
    );
    
    setSelectedConversation(conversation);
    setSelectedUser(fullUserObj);
    if (isMobile) setShowChatMobile(true);
  };

  const handleBackToList = () => setShowChatMobile(false);

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
    <div className="flex h-screen bg-[#fff7f0]">
      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((toast, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg shadow-lg font-body ${
                toast.variant === 'destructive' 
                  ? 'bg-red-100 text-red-800 border-l-4 border-red-500' 
                  : 'bg-[#a07855] text-[#ffd8b8] border-l-4 border-[#6b493d]'
              }`}
            >
              <h3 className="font-bold font-heading">{toast.title}</h3>
              <p>{toast.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sidebar - Recent Chats */}
      <div className={`
        h-full w-full md:w-96 lg:w-80 border-r border-[#a07855]/30
        bg-[#fff7f0] shadow-sm
        ${isMobile && showChatMobile ? 'hidden' : 'flex flex-col'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-[#a07855]/30 bg-[#fff7f0]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-heading font-bold text-[#2c1810]">
              Messages
            </h2>
            {/* {isMobile && (
              <button
                onClick={() => setShowChatMobile(true)}
                className="p-2 rounded-full hover:bg-[#a07855]/10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-[#2c1810]"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )} */}
          </div>
        </div>

        {/* Recent chats list */}
        <div className="flex-1 overflow-y-auto">
          <RecentChats
            currentUserId={currentUserId}
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversation?._id}
            users={users}
            addToast={addToast}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`
        flex-1 flex flex-col bg-[#fff7f0]
        ${isMobile && !showChatMobile ? 'hidden' : 'flex'}
      `}>
        {isSelectingConversation ? (
          <div className="flex flex-col items-center justify-center h-full text-[#2c1810] p-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a07855] mx-auto mb-4"></div>
            <p>Loading conversation...</p>
          </div>
        ) : selectedConversation ? (
          <>
            {/* Chat window */}
            <ChatWindow
              conversationId={selectedConversation._id}
              currentUser={user}
              otherUser={selectedUser}
              onBack={handleBackToList}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#2c1810] p-6 text-center">
            <div className="w-24 h-24 bg-[#a07855]/10 rounded-full flex items-center justify-center mb-6">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-12 w-12 text-[#a07855]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-heading font-bold text-[#2c1810] mb-2">
              Select a conversation
            </h3>
            <p className="font-body text-[#2c1810]/80 max-w-md mb-6">
              Choose an existing chat from the sidebar or start a new conversation
            </p>
            {isMobile && (
              <button
                onClick={() => setShowChatMobile(false)}
                className="px-6 py-2 bg-[#a07855] text-[#ffd8b8] rounded-full hover:bg-[#8a6a4d] transition-colors"
              >
                View Conversations
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;