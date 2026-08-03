import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getSocket, initSocket } from '../services/socket';

const MessageContext = createContext(undefined);

const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    console.error('useMessages must be used within a MessageProvider');
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

const MessageProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Initialize socket globally when MessageProvider mounts
  useEffect(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const currentUserId = user?.id || user?._id;
    
    if (currentUserId) {
      console.log('MessageProvider: Initializing global socket for user:', currentUserId);
      try {
        const socket = initSocket(currentUserId);
        console.log('MessageProvider: Global socket initialized:', !!socket);
      } catch (e) {
        console.warn('MessageProvider: Failed to initialize socket:', e.message);
      }
    } else {
      console.log('MessageProvider: No user ID found, cannot initialize global socket');
    }
    
    // Cleanup on unmount
    return () => {
      console.log('ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â¡ MessageProvider: Cleaning up global socket');
    };
  }, []); // Run only once on mount

  // Centralized socket event handler for new messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      return;
    }

    if (!socket.connected) {
      const handleConnect = () => {
        socket.off('connect', handleConnect); // Remove listener to prevent duplicates
        setSocketConnected(true); // Trigger effect re-run
      };
      socket.on('connect', handleConnect);
      return;
    }

    // Update socket connected state
    if (!socketConnected) {
      setSocketConnected(true);
    }

    const handleNewMessage = (message) => {
      console.log('ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â¨ MessageContext: Received newMessage:', message);
      console.log('ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â¨ MessageContext: currentConversationId:', currentConversationId);
      
      // Get current user ID from localStorage/sessionStorage
      const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user")) || null;
      const currentUserId = user?.id || user?._id;
      
      console.log('ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â¨ MessageContext: currentUserId:', currentUserId, 'message.senderId:', message.senderId);
      
      // Only increment unread count if not in the current conversation and not user's own message
      // When currentConversationId is null (outside chat), we should increment for all messages from others
      if (message.senderId !== currentUserId && (currentConversationId === null || String(message.conversationId) !== String(currentConversationId))) {
        console.log('ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â¨ MessageContext: Incrementing unread count');
        setUnreadCount(prev => prev + 1);
      } else {
        console.log('ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â¨ MessageContext: Not incrementing unread count (own message or in current conversation)');
      }
      
      // Update conversations list with the new message
      setConversations(prev => {
        const existingConvIndex = prev.findIndex(conv => String(conv._id) === String(message.conversationId));
        
        if (existingConvIndex !== -1) {
          // Update existing conversation
          const updatedConversations = [...prev];
          updatedConversations[existingConvIndex] = {
            ...updatedConversations[existingConvIndex],
            lastMessage: {
              text: message.text,
              createdAt: message.createdAt,
              senderId: message.senderId
            },
            updatedAt: message.createdAt,
            unreadCount: (() => {
              // Don't increment unread count if it's the current user's own message
              if (message.senderId === currentUserId) {
                return updatedConversations[existingConvIndex].unreadCount || 0;
              }
              
              // Only mark as read if user is:
              // 1. Actually viewing this EXACT conversation
              // 2. The current window/tab has focus (user is actively using this window)
              if (currentConversationId !== null && String(message.conversationId) === String(currentConversationId) && document.hasFocus()) {
                return 0;
              }
              
              // Otherwise increment unread count for messages from other users in other conversations
              return (updatedConversations[existingConvIndex].unreadCount || 0) + 1;
            })()
          };
          
          // Sort by updatedAt descending (most recent first)
          return updatedConversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } else {
          // Create new conversation if it doesn't exist
          const newConv = {
            _id: message.conversationId,
            participants: [message.senderId], // This will be updated when conversation is loaded
            lastMessage: {
              text: message.text,
              createdAt: message.createdAt,
              senderId: message.senderId
            },
            updatedAt: message.createdAt,
            unreadCount: (() => {
              // Don't increment unread count if it's the current user's own message
              if (message.senderId === currentUserId) {
                return 0;
              }
              // Only mark as read if user is actually viewing this conversation AND window has focus
              if (currentConversationId !== null && String(message.conversationId) === String(currentConversationId) && document.hasFocus()) {
                return 0;
              }
              // Otherwise set unread count to 1 for new conversation
              return 1;
            })()
          };
          
          return [newConv, ...prev].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }
      });
    };

    // Listen only for newMessage event (backend emits this consistently)
    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [currentConversationId, socketConnected]);

  const refreshConversations = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      const { getUserConversations } = await import('../Main/api');
      const response = await getUserConversations(userId);
      const conversationsData = Array.isArray(response?.data?.data) ? response.data.data : [];
      
      // Filter out conversations with "Start a conversation..." as last message
      const filteredConversations = conversationsData.filter(conv => {
        if (!conv.lastMessage) return false;
        if (typeof conv.lastMessage === 'string') return false;
        if (conv.lastMessage.text === "Start a conversation...") return false;
        return true;
      });
      
      setConversations(filteredConversations);
      
      // Calculate total unread count
      const totalUnread = filteredConversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
      
      console.log('MessageContext: Refreshed conversations:', filteredConversations.length);
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    }
  }, []);

  // Listen for refresh conversations event
  useEffect(() => {
    const handleRefreshConversations = () => {
      // Get current user ID from storage
      const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
      const userId = user?.id || user?._id;
      if (userId) {
        refreshConversations(userId);
      }
    };

    window.addEventListener('refreshConversations', handleRefreshConversations);
    return () => {
      window.removeEventListener('refreshConversations', handleRefreshConversations);
    };
  }, [refreshConversations]);

  const markAsRead = useCallback((conversationId) => {
    setCurrentConversationId(conversationId);
    
    // Reset unread count for this conversation
    setConversations(prev => 
      prev.map(conv => 
        String(conv._id) === String(conversationId) 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
    
    // Recalculate total unread count
    setConversations(prev => {
      const totalUnread = prev.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
      return prev;
    });
  }, []);

  const updateConversations = useCallback((newConversations) => {
    console.log('MessageContext: updateConversations called with:', {
      type: typeof newConversations,
      isArray: Array.isArray(newConversations),
      value: newConversations
    });
    
    // Ensure newConversations is always an array
    if (!Array.isArray(newConversations)) {
      console.error('MessageContext: updateConversations received non-array:', newConversations);
      return;
    }
    
    // Filter out conversations with "Start a conversation..." as last message
    const filteredConversations = newConversations.filter(conv => {
      if (!conv || typeof conv !== 'object') return false;
      if (!conv.lastMessage) return false;
      if (typeof conv.lastMessage === 'string') return false;
      if (conv.lastMessage.text === "Start a conversation...") return false;
      return true;
    });
    
    console.log('MessageContext: Filtered conversations from', newConversations.length, 'to', filteredConversations.length);
    
    setConversations(filteredConversations);
    
    // Calculate total unread count
    const totalUnread = filteredConversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
    setUnreadCount(totalUnread);
    
    console.log('MessageContext: Updated conversations state, total unread:', totalUnread);
  }, []);

  const addConversation = useCallback((conversation) => {
    if (!conversation || !conversation._id) {
      console.error('MessageContext: addConversation received invalid conversation:', conversation);
      return;
    }
    
    setConversations(prev => {
      if (!Array.isArray(prev)) {
        console.error('MessageContext: conversations state is not an array:', prev);
        return [conversation];
      }
      
      const exists = prev.some(conv => conv._id === conversation._id);
      if (exists) {
        return prev.map(conv => 
          conv._id === conversation._id ? conversation : conv
        );
      } else {
        return [conversation, ...prev];
      }
    });
  }, []);

  const updateConversationUnreadCount = useCallback((conversationId, unreadCount) => {
    if (!conversationId) {
      console.error('MessageContext: updateConversationUnreadCount received invalid conversationId:', conversationId);
      return;
    }
    
    setConversations(prev => {
      if (!Array.isArray(prev)) {
        console.error('MessageContext: conversations state is not an array in updateConversationUnreadCount:', prev);
        return [];
      }
      
      return prev.map(conv => 
        String(conv._id) === String(conversationId) 
          ? { ...conv, unreadCount }
          : conv
      );
    });
  }, []);

  const getTotalUnreadCount = useCallback(() => {
    if (!Array.isArray(conversations)) {
      console.error('MessageContext: conversations is not an array in getTotalUnreadCount:', conversations);
      return 0;
    }
    return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
  }, [conversations]);

  const contextValue = useMemo(() => ({
    unreadCount,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    markAsRead,
    updateConversations,
    addConversation,
    updateConversationUnreadCount,
    getTotalUnreadCount,
    refreshConversations
  }), [
    unreadCount,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    markAsRead,
    updateConversations,
    addConversation,
    updateConversationUnreadCount,
    getTotalUnreadCount,
    refreshConversations
  ]);

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
};

export { useMessages, MessageProvider };
