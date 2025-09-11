import React, { useEffect, useState, useRef } from 'react';
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { getMessagesByConversation, sendMessage, getUserById, markConversationAsRead, debugToken } from '../Main/api';
import { getSocket, sendSocketMessage } from '../services/socket';
import { Link } from 'react-router-dom';
import { AUTH_BASE_URL } from '../config';
import { cn } from '../lib/utils';

// Helper functions with proper error handling
function formatMessageDate(timestamp) {
  if (!timestamp) return 'Unknown date';
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      // Use a simple time format without the date-fns library
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (date.getFullYear() === now.getFullYear()) {
      // Use a simple date format without the date-fns library
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' });
    }
  } catch (error) {
    console.error('Error formatting date:', error, timestamp);
    return 'Invalid date';
  }
}

function shouldShowDateSeparator(messages, currentIndex) {
  if (currentIndex === 0) return true;
  
  try {
    const currentDate = new Date(messages[currentIndex].createdAt);
    const prevDate = new Date(messages[currentIndex - 1].createdAt);
    
    if (isNaN(currentDate.getTime()) || isNaN(prevDate.getTime())) {
      return true;
    }
    
    return (
      currentDate.getDate() !== prevDate.getDate() ||
      currentDate.getMonth() !== prevDate.getMonth() ||
      currentDate.getFullYear() !== prevDate.getFullYear()
    );
  } catch (error) {
    console.error('Error checking date separator:', error);
    return true;
  }
}

const ChatWindow = ({ conversationId, currentUser, otherUser, onBack, updateConversationLastMessage, addToast }) => {
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
        
        // Normalize the response data with proper timestamp validation
        const normalizedMessages = (response.data || []).map(msg => {
          // Validate and ensure timestamp is valid
          let timestamp = msg.createdAt || msg.timestamp;
          if (!timestamp || isNaN(new Date(timestamp).getTime())) {
            console.warn('Invalid timestamp found, using current time:', timestamp);
            timestamp = new Date().toISOString();
          }
          
          return {
            _id: msg._id || msg.id || Date.now().toString(),
            text: msg.text || msg.content || '',
            senderId: msg.senderId || msg.sender?.id || '',
            createdAt: timestamp
          };
        }).filter(msg => msg.text); // Remove empty messages
        
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

  // Mark conversation as read when opened
  useEffect(() => {
    if (conversationId) {
      const markAsRead = async () => {
        try {
          // Debug token availability
          debugToken();
          
          const result = await markConversationAsRead(conversationId);
          
          // Update parent component to reset unread count
          if (updateConversationLastMessage) {
            updateConversationLastMessage(conversationId, { unreadCount: 0 });
          }
          
          // Refresh conversations to get updated unread counts from backend
          if (result?.data?.modifiedCount > 0) {
            // Wait a bit for the database to update
            setTimeout(() => {
              // Trigger a refresh of conversations
              window.dispatchEvent(new CustomEvent('refreshConversations'));
            }, 100);
          }
        } catch (error) {
          console.error("Error marking conversation as read:", error);
        }
      };
      
      markAsRead();
    }
  }, [conversationId, updateConversationLastMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (!socket || !conversationId) {
      return;
    }

    // Join the conversation room for real-time updates
    socket.emit('joinConversation', conversationId);

    // REMOVED: handleNewMessage socket event handler
    // MessageContext now handles all socket events centrally

    const handleMessageSent = (data) => {
      // You can add logic here to update message status if needed
    };

    // Listen only for messageSent event (no more newMessage here)
    socket.on('messageSent', handleMessageSent);

    return () => {
      socket.emit('leaveConversation', conversationId);
      socket.off('messageSent', handleMessageSent);
    };
  }, [conversationId, updateConversationLastMessage]);

  useEffect(() => {
    if (!otherUser.username) {
      getUserById(otherUser._id)
        .then(res => {
          // Some APIs return { data: { ...user } }
          if (res.data && res.data.data) {
            setUserDetails(res.data.data);
          } else if (res.data) {
            setUserDetails(res.data);
          } else {
            setUserDetails(otherUser);
          }
        })
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
      // Server will emit the message via socket, no need to emit here
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      // Show error toast
      if (addToast) {
        addToast({
          title: 'Error',
          description: 'Failed to send message. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f4ea] min-h-0 chat-container">
      {/* Header - Fixed height with improved styling */}
      <div className="flex-shrink-0 p-4 bg-white border-b border-[#e5d9c8] shadow-sm flex items-center gap-4 chat-header">
        {isMobile && onBack && (
          <button
            onClick={handleBackClick}
            className="p-2 rounded-xl hover:bg-[#f0e6d8] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#a07855]/30 no-select active:scale-95"
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
          className="relative shrink-0 flex-shrink-0 group"
        >
          {userDetails.profileImage ? (
            <img 
              src={`${AUTH_BASE_URL.replace('/auth', '')}${userDetails.profileImage}`}
              alt={userDetails.username || 'User'}
              className="w-12 h-12 rounded-xl object-cover border-2 border-[#e5d9c8] group-hover:border-[#a07855]/40 transition-colors duration-200"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-12 h-12 rounded-xl bg-gradient-to-br from-[#a07855] to-[#6b493d] flex items-center justify-center text-[#ffd8b8] text-xl font-bold border-2 border-[#e5d9c8] group-hover:border-[#a07855]/40 transition-colors duration-200 ${userDetails.profileImage ? 'hidden' : ''}`}
          >
            {(userDetails.username || 'U').charAt(0).toUpperCase()}
          </div>
          {userDetails.status === 'online' && (
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
          )}
        </Link>
        
        <div className="flex-1 min-w-0">
          <Link 
            to={`/profile/public/${otherUser._id}`}
            className="font-heading text-lg font-semibold text-[#2c1810] hover:text-[#a07855] transition-colors duration-200 block truncate"
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
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-1.5 shadow-sm"></span>
                <span className="text-[#2c1810]/80">Online now</span>
              </span>
            ) : (
              <span className="text-[#2c1810]/60">Offline</span>
            )}
          </p>
        </div>
      </div>

      {/* Messages area - Enhanced styling */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-[#f8f4ea] to-[#f5efe6] min-h-0 chat-messages-container smooth-scroll"
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
                    <div className="text-center my-6">
                      <span className="inline-block px-4 py-2 text-xs font-body text-[#2c1810]/80 bg-white rounded-xl border border-[#e5d9c8] shadow-sm backdrop-blur-sm">
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
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-[#fff7f0] to-[#f0e6d8] rounded-full flex items-center justify-center shadow-lg border-2 border-[#e5d9c8]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[#a07855]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2">
                <div className="w-10 h-10 rounded-full bg-[#a07855] flex items-center justify-center shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <h3 className="font-heading text-2xl font-semibold text-[#2c1810] mb-3">Start a Conversation</h3>
            <p className="font-body text-[#2c1810]/70 max-w-md mb-6 leading-relaxed">
              Send your first message to {userDetails.username || 'your contact'} to begin chatting
            </p>
          </div>
        )}
      </div>

      {/* Input area - Enhanced styling */}
      <div className="flex-shrink-0 p-4 bg-white border-t border-[#e5d9c8] chat-input shadow-sm">
        <MessageInput 
          onSendMessage={handleSendMessage} 
          className="bg-white border border-[#e5d9c8] rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-[#a07855]/30 focus-within:border-[#a07855]/60 focus-within:shadow-md"
          disabled={!conversationId}
        />
      </div>
    </div>
  );
};

export default ChatWindow;