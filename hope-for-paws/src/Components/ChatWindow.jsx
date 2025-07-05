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
    <div className="flex flex-col h-full bg-[#f5f0e1]">
      {/* Header */}
      <div className="p-4 border-b border-[#a07855]/20 flex items-center gap-3">
        {isMobile && onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-[#a07855]/10 transition-colors"
            aria-label="Back to conversations"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-[#2c1810]" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        
        <Link 
          to={`/profile/public/${otherUser._id}`}
          className="relative shrink-0"
        >
          {userDetails.profileImage ? (
            <img 
              src={`${AUTH_BASE_URL.replace('/auth', '')}${userDetails.profileImage}`}
              alt={userDetails.username || 'User'}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-10 h-10 rounded-full bg-[#6b493d] flex items-center justify-center text-[#ffd8b8] font-bold ${userDetails.profileImage ? 'hidden' : ''}`}
          >
            {(userDetails.username || 'U').charAt(0).toUpperCase()}
          </div>
          {userDetails.status === 'online' && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#fff7f0]"></div>
          )}
        </Link>
        
        <div className="flex-1 min-w-0">
          <Link 
            to={`/profile/public/${otherUser._id}`}
            className="font-heading text-lg font-semibold text-[#2c1810] hover:underline block truncate"
          >
            {userDetails.username || 'User'}
          </Link>
          <p className="font-body text-sm text-[#2c1810]/80">
            {isTyping ? 'typing...' : userDetails.status === 'online' ? 'online' : ''}
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#fff7f0] flex flex-col space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-pulse font-body text-[#2c1810]/50">
              Loading messages...
            </div>
          </div>
        ) : messages.length > 0 ? (
          <>
            {messages.map((message, index) => {
              if (!message.text || !message._id) return null;
              
              const showDateSeparator = shouldShowDateSeparator(messages, index);
              return (
                <React.Fragment key={message._id}>
                  {showDateSeparator && (
                    <div className="text-center my-2">
                      <span className="inline-block px-3 py-1 text-xs font-body text-[#2c1810]/70 bg-[#a07855]/10 rounded-full">
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
              <TypingIndicator username={otherUser.username} />
            )}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex flex-col justify-center items-center h-full text-center p-6">
            <div className="w-16 h-16 bg-[#a07855]/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#a07855]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-heading text-lg text-[#2c1810] mb-1">No messages yet</h3>
            <p className="font-body text-[#2c1810]/70 max-w-md">
              Start the conversation with {userDetails.username || 'your contact'}
            </p>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-[#a07855]/20 bg-[#fff7f0]">
        <MessageInput 
          onSendMessage={handleSendMessage} 
          className="bg-white border border-[#a07855]/30 focus-within:border-[#a07855]"
          disabled={!conversationId}
        />
      </div>
    </div>
  );
};

export default ChatWindow;