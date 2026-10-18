import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getSocket, initSocket } from '../services/socket';
import { useAuth } from './AuthContext';

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
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const refreshTimerRef = useRef(null);

  const getStoredUserId = () => {
    try {
      // A stored user without a token is a stale session; treat it as logged out
      if (!(localStorage.getItem('token') || sessionStorage.getItem('token'))) return null;
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      const storedUser = userStr ? JSON.parse(userStr) : null;
      return storedUser?.id || storedUser?._id || null;
    } catch (error) {
      console.warn('MessageProvider: Failed to parse stored user from storage', error);
      return null;
    }
  };

  const getCurrentUserId = () => user?.id || user?._id || getStoredUserId();

  // Initialize socket whenever authenticated user becomes available
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      // Logged out: clear chat state so the next user never sees the previous user's chats
      setConversations([]);
      setUnreadCount(0);
      setCurrentConversationId(null);
      return;
    }

    try {
      initSocket(currentUserId);
    } catch (e) {
      console.warn('MessageProvider: Failed to initialize socket:', e.message);
    }
  }, [user]);

  // Centralized socket event handler for new messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      const currentUserId = user?.id || user?._id;
      if (currentUserId) {
        console.log('MessageContext: Socket not ready yet, initializing socket for user:', currentUserId);
        try {
          initSocket(currentUserId);
        } catch (e) {
          console.warn('MessageContext: Failed to initialize socket inside listener effect:', e.message);
        }
      }
      return;
    }

    // Listeners can be attached before the socket connects; Socket.IO keeps them across reconnects
    if (!socketConnected && socket.connected) {
      setSocketConnected(true);
    }

    const handleNewMessage = (message) => {
      const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user")) || null;
      const currentUserId = user?.id || user?._id;
      
      const isChatRoute = typeof window !== 'undefined' && /^\/chat(\/|$)/.test(window.location.pathname);
      const isActiveConversation = currentConversationId !== null && String(message.conversationId) === String(currentConversationId);
      const isActiveVisibleConversation = isChatRoute && isActiveConversation && document.hasFocus();
      
      if (
        String(message.senderId) !== String(currentUserId) &&
        !isActiveVisibleConversation
      ) {
        setUnreadCount(prev => prev + 1);
      }
      
      // Debounced: a burst of messages triggers one list refresh
      if (currentUserId) {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(() => refreshConversations(currentUserId), 500);
      }
    };

    // Listen only for newMessage event (backend emits this consistently)
    socket.on('newMessage', handleNewMessage);

    // After a reconnect, reload the list so messages sent while offline show up
    const handleReconnect = () => {
      const id = getCurrentUserId();
      if (id) refreshConversations(id);
    };
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('connect', handleReconnect);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [currentConversationId, socketConnected, user]);

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
      
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    }
  }, []);

  useEffect(() => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    refreshConversations(currentUserId);
  }, [user, refreshConversations]);

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

  const removeConversation = useCallback((conversationId) => {
    setConversations(prev => {
      if (!Array.isArray(prev)) return [];
      const updated = prev.filter(c => String(c._id) !== String(conversationId));
      const totalUnread = updated.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
      return updated;
    });
    if (currentConversationId && String(currentConversationId) === String(conversationId)) {
      setCurrentConversationId(null);
    }
  }, [currentConversationId]);

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
    removeConversation,
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
    removeConversation,
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
