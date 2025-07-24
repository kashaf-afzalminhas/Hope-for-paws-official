import React, { useEffect, useState, useRef } from 'react';
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { getMessagesByConversation, sendMessage, getUserById } from '../Main/api';
import { getSocket, sendSocketMessage } from '../services/socket';
import { Link } from 'react-router-dom';
import { AUTH_BASE_URL } from '../config';
import { cn } from '../lib/utils';
//import Avatar from './Avatar';

// Helper functions (place these outside the component)
function formatMessageDate(dateString) {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }
}

function shouldShowDateSeparator(messages, currentIndex) {
  if (currentIndex === 0) return true;
  const currentDate = new Date(messages[currentIndex].createdAt);
  const prevDate = new Date(messages[currentIndex - 1].createdAt);
  return (
    currentDate.getDate() !== prevDate.getDate() ||
    currentDate.getMonth() !== prevDate.getMonth() ||
    currentDate.getFullYear() !== prevDate.getFullYear()
  );
}

const ChatWindow = ({ conversationId, currentUser, otherUser, onBack, updateConversationLastMessage }) => {
  console.log('ChatWindow props:', { conversationId, currentUser, otherUser, onBack });
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [userDetails, setUserDetails] = useState(otherUser);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const messagesContainerRef = useRef(null);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await getMessagesByConversation(conversationId);
        // Normalize the response data
        const normalizedMessages = (response.data || []).map(msg => ({
          _id: msg._id || msg.id || Date.now().toString(),
          text: msg.text || msg.content || '',
          senderId: msg.senderId || msg.sender?.id || '',
          createdAt: msg.createdAt || msg.timestamp || new Date().toISOString()
        })).filter(msg => msg.text); // Remove empty messages
        setMessages(normalizedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const handleNewMessage = (message) => {
      console.log('Socket received message:', message);
      if (message.conversationId === conversationId) {
        setMessages(prev => {
          // Filter out duplicates
          const exists = prev.some(m => m._id === message._id);
          if (exists) return prev;
          // Normalize socket message
          const normalizedMsg = {
            _id: message._id || Date.now().toString(),
            text: message.text || message.content || '',
            senderId: message.senderId || message.sender?.id || '',
            createdAt: message.createdAt || message.timestamp || new Date().toISOString(),
          };
          if (!normalizedMsg.text) {
            console.warn('Socket message skipped (no text):', message);
            return prev;
          }
          return [...prev, normalizedMsg];
        });
        setIsTyping(false);
      }
    };

    const handleTyping = (data) => {
      if (data.userId === otherUser._id && data.conversationId === conversationId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    socket.on('getMessage', handleNewMessage);
    socket.on('userTyping', handleTyping);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('getMessage', handleNewMessage);
        socketRef.current.off('userTyping', handleTyping);
      }
    };
  }, [conversationId, otherUser._id]);

  useEffect(() => {
    if (!otherUser.username) {
      getUserById(otherUser._id)
        .then(res => setUserDetails(res.data))
        .catch(() => setUserDetails(otherUser));
    } else {
      setUserDetails(otherUser);
    }
  }, [otherUser]);

  const handleSendMessage = async (text) => {
    if (!text.trim() || !conversationId) return;

    const senderId = currentUser.id || currentUser._id;
    const tempId = Date.now().toString();
    const newMessage = {
      _id: tempId,
      conversationId,
      senderId,
      text,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setMessages(prev => [...prev, newMessage]);
    console.log('Optimistic message added:', newMessage);

    try {
      const response = await sendMessage({
        conversationId,
        senderId,
        text
      });
      // Replace temp message with normalized server response
      const serverMsg = {
        _id: response.data._id || response.data.id || tempId,
        text: response.data.text || response.data.content || text,
        senderId: response.data.senderId || response.data.sender?.id || senderId,
        createdAt: response.data.createdAt || response.data.timestamp || new Date().toISOString(),
      };
      setMessages(prev => prev.map(msg => msg._id === tempId ? serverMsg : msg));
      // Emit socket event with normalized structure
      sendSocketMessage(serverMsg);
      console.log('Server message after send:', serverMsg);
      // Update recent chats list immediately
      if (updateConversationLastMessage) {
        updateConversationLastMessage(conversationId, serverMsg);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Rollback optimistic update
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
    }
  };

  console.log('Messages state:', messages);

  return (
    
  <div className="flex flex-col h-full bg-[#f8f4ea]">
    {/* Header - Sticky top */}
    <div className="sticky top-0 z-10 p-4 bg-white border-b border-[#e5d9c8] shadow-sm flex items-center gap-4">
      {isMobile && onBack && (
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-[#f0e6d8] transition-colors focus:outline-none focus:ring-1 focus:ring-[#a07855]"
          aria-label="Back to conversations"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 text-[#2c1810]" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      
      <Link 
        to={`/profile/public/${otherUser._id}`}
        className="relative shrink-0 flex-shrink-0"
      >
        {userDetails.profileImage ? (
          <img 
            src={`${AUTH_BASE_URL.replace('/auth', '')}${userDetails.profileImage}`}
            alt={userDetails.username || 'User'}
            className="w-12 h-12 rounded-xl object-cover border border-[#a07855]/10"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`w-12 h-12 rounded-xl bg-gradient-to-br from-[#a07855] to-[#6b493d] flex items-center justify-center text-[#ffd8b8] text-xl font-bold ${userDetails.profileImage ? 'hidden' : ''}`}
        >
          {(userDetails.username || 'U').charAt(0).toUpperCase()}
        </div>
        {userDetails.status === 'online' && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </Link>
      
      <div className="flex-1 min-w-0">
        <Link 
          to={`/profile/public/${otherUser._id}`}
          className="font-heading text-lg font-semibold text-[#2c1810] hover:underline block truncate"
        >
          {userDetails.username || 'User'}
        </Link>
        <p className="font-body text-sm text-[#2c1810]/80 mt-1 flex items-center">
          {isTyping ? (
            <span className="flex items-center text-[#a07855] font-medium">
              <span className="flex mr-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a07855] animate-bounce mx-0.5"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#a07855] animate-bounce mx-0.5 animation-delay-150"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#a07855] animate-bounce mx-0.5 animation-delay-300"></span>
              </span>
              typing...
            </span>
          ) : userDetails.status === 'online' ? (
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-1.5"></span>
              <span className="text-[#2c1810]/80">Online now</span>
            </span>
          ) : (
            <span className="text-[#2c1810]/60">Offline</span>
          )}
        </p>
      </div>
    </div>

    {/* Messages area */}
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-[#f8f4ea] to-[#f5efe6] flex flex-col"
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-[#a07855] border-t-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-[#a07855]/20 animate-ping"></div>
              </div>
            </div>
            <div className="mt-4 font-body text-[#2c1810]/70">
              Loading messages...
            </div>
          </div>
        </div>
      ) : messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((message, index) => {
            if (!message.text || !message._id) return null;
            
            const showDateSeparator = shouldShowDateSeparator(messages, index);
            return (
              <React.Fragment key={message._id}>
                {showDateSeparator && (
                  <div className="text-center my-4">
                    <span className="inline-block px-4 py-1.5 text-xs font-body text-[#2c1810]/80 bg-white rounded-xl border border-[#e5d9c8] shadow-sm">
                      {formatMessageDate(message.createdAt)}
                    </span>
                  </div>
                )}
                <ChatBubble
                  message={message.text}
                  timestamp={message.createdAt}
                  isCurrentUser={message.senderId === (currentUser.id || currentUser._id)}
                  status="read"
                />
              </React.Fragment>
            );
          })}
          {isTyping && (
            <div className="mt-1 mb-6">
              <TypingIndicator username={otherUser.username} />
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center h-full text-center p-6">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-[#fff7f0] to-[#f0e6d8] rounded-xl flex items-center justify-center shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#a07855]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="absolute -bottom-2 -right-2">
              <div className="w-8 h-8 rounded-full bg-[#a07855] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <h3 className="font-heading text-xl font-semibold text-[#2c1810] mb-2">Start a Conversation</h3>
          <p className="font-body text-[#2c1810]/70 max-w-md mb-6">
            Send your first message to {userDetails.username || 'your contact'}
          </p>
        </div>
      )}
    </div>

    {/* Input area - Sticky bottom */}
    <div className="sticky bottom-0 p-4 bg-white border-t border-[#e5d9c8] z-10">
      <MessageInput 
        onSendMessage={handleSendMessage} 
        className="bg-white border border-[#e5d9c8] rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-[#a07855]/30 focus-within:border-[#a07855]/60"
        disabled={!conversationId}
      />
    </div>
  </div>
);
};

export default ChatWindow;