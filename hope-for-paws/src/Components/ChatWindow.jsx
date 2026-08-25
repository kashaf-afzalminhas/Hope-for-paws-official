import React, { useEffect, useState, useRef } from 'react';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';
import { getMessagesByConversation, sendMessage, getUserById, markConversationAsRead, deleteConversation, debugToken } from '../Main/api';
import { useMessages } from '../context/MessageContext';
import { getSocket, sendSocketMessage } from '../services/socket';
import { Link } from 'react-router-dom';
import { AUTH_BASE_URL } from '../config';
import { FaPaw } from 'react-icons/fa';

const ChatWindow = ({ conversationId, currentUser, otherUser, onBack, updateConversationLastMessage, addToast, setCurrentConversationId }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [userDetails, setUserDetails] = useState(otherUser);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { removeConversation } = useMessages();
  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const handleDeleteChat = async () => {
    try {
      setIsDeleting(true);
      await deleteConversation(conversationId);
      if (removeConversation) {
        removeConversation(conversationId);
      }

      // Triggers immediate sync across MessageContext and background tabs
      window.dispatchEvent(new CustomEvent('refreshConversations'));

      if (addToast) {
        addToast({
          title: 'Success',
          description: 'Chat deleted successfully'
        });
      }
      setShowDeleteModal(false);
      if (onBack) {
        onBack();
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
      if (addToast) {
        addToast({
          title: 'Error',
          description: 'Failed to delete chat',
          variant: 'destructive'
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await getMessagesByConversation(conversationId);
        const normalized = (response.data || []).map(msg => ({
          _id: msg._id || msg.id || Date.now().toString(),
          text: msg.text || msg.content || '',
          senderId: msg.senderId || msg.sender?.id || '',
          createdAt: msg.createdAt || new Date().toISOString()
        })).filter(msg => msg.text);
        setMessages(normalized);
      } catch (error) {
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };
    if (conversationId) fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    if (conversationId && setCurrentConversationId) {
      setCurrentConversationId(conversationId);
      markConversationAsRead(conversationId).catch(console.error);
    }
  }, [conversationId, setCurrentConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    socket.emit('joinConversation', conversationId);
    const handleNewMessage = (message) => {
      if (String(message.conversationId) === String(conversationId)) {
        setMessages(prev => {
          const alreadyExists = prev.some(
            m => m._id === message._id || 
            (m.text === message.text && String(m.senderId) === String(message.senderId) && Math.abs(new Date(m.createdAt) - new Date(message.createdAt || Date.now())) < 5000)
          );
          if (alreadyExists) {
            return prev.map(m => 
              (m.text === message.text && String(m.senderId) === String(message.senderId)) ? message : m
            );
          }
          return [...prev, message];
        });
      }
    };

    socket.on('newMessage', handleNewMessage);
    return () => {
      socket.emit('leaveConversation', conversationId);
      socket.off('newMessage', handleNewMessage);
    };
  }, [conversationId]);

  useEffect(() => {
    if (!otherUser.username) {
      getUserById(otherUser._id)
        .then(res => setUserDetails(res.data?.data || res.data || otherUser))
        .catch(() => setUserDetails(otherUser));
    } else {
      setUserDetails(otherUser);
    }
  }, [otherUser]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !conversationId) return;

    const senderId = currentUser?._id || currentUser?.id;
    const text = inputText.trim();
    setInputText('');

    // Safely extract the sender's user ID from props or storage
    const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    const senderId = currentUser?._id || currentUser?.id || storedUser?._id || storedUser?.id;

    if (!senderId) {
      console.error('No valid sender ID found to send message');
      if (addToast) {
        addToast({
          title: 'Error',
          description: 'Authentication session expired. Please re-login.',
          variant: 'destructive'
        });
      }
      return;
    }

    const tempId = Date.now().toString();
    const tempMessage = {
      _id: tempId,
      conversationId,
      senderId,
      text,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await sendMessage({ conversationId, senderId, text });
      const savedMsg = response?.data?.data || response?.data;
      if (savedMsg && savedMsg._id) {
        setMessages(prev => {
          const alreadyAddedBySocket = prev.some(m => m._id === savedMsg._id);
          if (alreadyAddedBySocket) {
            return prev.filter(m => m._id !== tempId);
          }
          return prev.map(msg => msg._id === tempId ? savedMsg : msg);
        });
      }
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      if (addToast) addToast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAECD8] min-h-0 relative">
      {/* Top Header */}
      <div className="flex-shrink-0 bg-[#301B12] px-5 py-3.5 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-3">
          {isMobile && onBack && (
            <button onClick={onBack} className="text-white/80 hover:text-white p-1 rounded-md" aria-label="Back">
              ←
            </button>
          )}

          <Link to={`/profile/public/${otherUser._id}`} className="relative shrink-0 flex items-center">
            {userDetails?.profileImage ? (
              <img
                src={`${AUTH_BASE_URL.replace('/auth', '')}${userDetails.profileImage}`}
                alt={userDetails.username || 'User'}
                className="w-10 h-10 rounded-full object-cover border border-[#BA8B60]"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-10 h-10 rounded-full bg-[#FDF6EE] border border-[#BA8B60] flex items-center justify-center text-lg ${userDetails?.profileImage ? 'hidden' : ''}`}>
              🐶
            </div>
          </Link>

          <div className="flex flex-col justify-center">
            <Link to={`/profile/public/${otherUser._id}`} className="text-white font-semibold text-base leading-tight hover:text-[#E2BD9E] transition-colors">
              {userDetails?.username || 'User'}
            </Link>
            <span className="text-xs text-[#D8BCA4] flex items-center gap-1.5 mt-0.5 font-normal">
              <span className={`w-2 h-2 rounded-full ${userDetails?.status === 'online' ? 'bg-[#9CD373]' : 'bg-[#A88876]'}`} />
              {userDetails?.status === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="p-2 text-white/70 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors active:scale-95 ml-auto"
          title="Delete Chat"
          aria-label="Delete Chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 min-h-0 smooth-scroll">
        {isLoading ? (
          <div className="flex justify-center items-center h-full text-[#4A2E1B]/70 text-sm">
            Loading messages...
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-1">
            {messages.map((message) => {
              if (!message.text || !message._id) return null;
              const isMe = message.senderId === (currentUser.id || currentUser._id);

              return (
                <ChatBubble
                  key={message._id}
                  message={message.text}
                  timestamp={message.createdAt}
                  isCurrentUser={isMe}
                  senderName={isMe ? (currentUser?.username || 'Sahab') : (userDetails?.username || 'User')}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-[#5C3C26]">
            <p className="font-semibold text-base">No messages yet</p>
            <p className="text-xs opacity-75 mt-1">Say hi to start the conversation!</p>
          </div>
        )}
        {isTyping && (
          <div className="mt-1 mb-2">
            <TypingIndicator username={otherUser.username} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Bar */}
      <div className="p-3.5 sm:p-4 bg-transparent">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message or set quick-emojis here."
            className="flex-1 bg-[#FFF9F2] text-[#2C1810] placeholder-[#8E7060]/70 px-5 py-3 rounded-full border border-[#E3CBB3] focus:outline-hidden focus:ring-2 focus:ring-[#BA8B60] text-sm shadow-xs"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="flex items-center gap-2 bg-[#BA8B60] hover:bg-[#A8794E] disabled:opacity-50 text-white font-medium px-5 py-3 rounded-full transition shadow-sm select-none cursor-pointer"
          >
            <span>Send</span>
            <FaPaw className="text-sm" />
          </button>
        </form>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-heading font-bold text-[#2c1810] mb-2">Delete Conversation?</h3>
            <p className="font-body text-sm text-gray-600 mb-6">
              This chat will be removed from your inbox. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteChat}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;