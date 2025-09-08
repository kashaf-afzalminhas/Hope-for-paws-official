import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSocket } from '../services/socket';

const MessageContext = createContext(undefined);

const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

const MessageProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (message) => {
      console.log('📨 MessageContext received newMessage:', message);
      
      // Only increment unread count if not in the current conversation
      if (message.conversationId !== currentConversationId) {
        setUnreadCount(prev => prev + 1);
      }
      
      // Update conversations list
      updateConversationWithMessage(message);
    };

    const updateConversationWithMessage = (message) => {
      setConversations(prev => {
        const exists = prev.some(conv => conv._id === message.conversationId);
        if (exists) {
          return prev.map(conv =>
            conv._id === message.conversationId
              ? { 
                  ...conv, 
                  lastMessage: message, 
                  updatedAt: message.createdAt,
                  unreadCount: conv._id === currentConversationId ? 0 : (conv.unreadCount || 0) + 1
                }
              : conv
          ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } else {
          // Create new conversation if it doesn't exist
          const newConv = {
            _id: message.conversationId,
            participants: [message.senderId], // This will be updated when conversation is loaded
            lastMessage: message,
            updatedAt: message.createdAt,
            unreadCount: message.conversationId === currentConversationId ? 0 : 1
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
  }, [currentConversationId]);

  const markAsRead = (conversationId) => {
    console.log('Marking conversation as read:', conversationId);
    setCurrentConversationId(conversationId);
    
    // Reset unread count for this conversation
    setConversations(prev => 
      prev.map(conv => 
        conv._id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
    
    // Reset total unread count
    setUnreadCount(0);
  };

  const updateConversations = (newConversations) => {
    setConversations(newConversations);
  };

  const addConversation = (conversation) => {
    setConversations(prev => {
      const exists = prev.some(conv => conv._id === conversation._id);
      if (exists) {
        return prev.map(conv => 
          conv._id === conversation._id ? conversation : conv
        );
      } else {
        return [conversation, ...prev];
      }
    });
  };

  const value = {
    unreadCount,
    conversations,
    setConversations: updateConversations,
    addConversation,
    markAsRead,
    currentConversationId,
    setCurrentConversationId
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export { useMessages, MessageProvider };
