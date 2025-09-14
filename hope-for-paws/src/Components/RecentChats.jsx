import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';
import { getUserConversations, markConversationAsRead, debugToken } from '../Main/api';
import UserCard from './UserCard';
import SearchBar from './SearchBar';
import { format } from 'date-fns';
import { getSocket } from '../services/socket';
import { cn } from '../lib/utils';
import { useSwipeable } from 'react-swipeable';
import { useMessages } from '../context/MessageContext';

const RecentChats = ({
  currentUserId,
  onSelectConversation,
  selectedConversationId,
  users,
  conversations,
  setConversations,
  onBackToSidebar,
  addToast,
  getUserFromCache,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [swipingId, setSwipingId] = useState(null);
  const { markAsRead, setCurrentConversationId } = useMessages();
  
  // Function to handle marking conversation as read
  const handleMarkAsRead = async (conversationId) => {
    try {
      debugToken();
      
      const result = await markConversationAsRead(conversationId);
      
      if (result?.data?.modifiedCount > 0) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('refreshConversations'));
        }, 100);
      }
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  const [audio] = useState(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
      audio.volume = 0.3;
      return audio;
    }
    return null;
  });

  // Socket event listeners for real-time updates - REMOVED
  // MessageContext now handles all socket events centrally
  
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      setIsMobile(newIsMobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enhanced user lookup function that uses cache
  const getUserById = useCallback((userId) => {
    if (getUserFromCache) {
      const cachedUser = getUserFromCache(userId);
      if (cachedUser) return cachedUser;
    }
    
    const user = users.find(u => u._id === userId);
    if (user) return user;
    
    return { username: 'Unknown', _id: userId };
  }, [users, getUserFromCache]);

  // Move deduplication logic to useEffect to avoid setState during render
  useEffect(() => {
    if (!conversations) return;
    
    // Ensure conversations is an array
    if (!Array.isArray(conversations)) {
      console.error('RecentChats: conversations is not an array:', conversations);
      return;
    }

    // Note: Deduplication is now handled by the parent component (Chat.jsx)
    // This effect only validates that conversations is an array
    console.log('RecentChats: conversations validated as array, length:', conversations.length);
  }, [conversations]);

  // Memoized filtering only (no deduplication)
  const filteredForDisplay = useMemo(() => {
    if (!conversations) return [];
    
    // Ensure conversations is an array
    if (!Array.isArray(conversations)) {
      console.error('RecentChats: conversations is not an array in filteredForDisplay:', conversations);
      return [];
    }

    const filtered = searchQuery
      ? conversations.filter(conv => {
          if (!conv || !conv.participants) return false;
          const otherUserId = conv.participants.find(id => id !== currentUserId);
          const otherUser = getUserById(otherUserId);
          return otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase());
        })
      : conversations;

    return filtered.filter(conv => {
      if (!conv || !conv.lastMessage) return false;
      if (conv.lastMessage.text === "Start a conversation..." && 
          conv.participants[0] !== currentUserId) {
        return false;
      }
      return true;
    });
  }, [conversations, users, currentUserId, searchQuery, getUserById]);

  useEffect(() => {
    // Ensure conversations is an array before setting loading state
    if (!conversations) {
      setIsLoading(true);
    } else if (Array.isArray(conversations)) {
      setIsLoading(false);
    } else {
      console.error('RecentChats: conversations is not an array in loading effect:', conversations);
      setIsLoading(false);
    }
  }, [conversations]);

  // Remove the effect that was calling setConversations - this should be handled by the parent
  // The unread count updates should be handled by MessageContext

  // Fixed formatTimestamp function
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();

      if (date.toDateString() === now.toDateString()) {
        return format(date, 'h:mm a');
      }

      if (date.getFullYear() === now.getFullYear()) {
        return format(date, 'MMM d');
      }

      return format(date, 'MM/dd/yyyy');
    } catch (error) {
      console.error("Error formatting timestamp:", error, timestamp);
      return '';
    }
  };

  const handleBackClick = () => {
    const isOnChatRoute = location.pathname.startsWith('/chat/');
    
    if (isMobile) {
      if (onBackToSidebar) {
        if (isOnChatRoute) {
          navigate('/chat');
          return;
        } else {
          navigate(-1);
        }
      } else {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f8f4ea]">
      {/* Header with search and back button */}
      <div className="flex-shrink-0 p-4 pb-3 bg-[#f8f4ea] flex items-center">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.target.style.backgroundColor = '#a07855';
            e.target.style.color = 'white';
            setTimeout(() => {
              e.target.style.backgroundColor = '';
              e.target.style.color = '';
            }, 200);
            handleBackClick();
          }}
          className="flex items-center p-2 rounded-xl hover:bg-[#f0e6d8] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#a07855]/30 active:bg-[#a07855] active:text-white active:scale-95"
          aria-label="Back"
        >
          <FaChevronLeft className="text-[#6b493d] text-lg" />
        </button>
        <div className="flex-1"></div>
      </div>

      {/* Header with search */}
      <div className="flex-shrink-0 p-4 pb-3 bg-[#f8f4ea]">
        <h2 className="text-[#2c1810] font-semibold text-xl mb-4 px-1">Messages</h2>
        <SearchBar
          onSearch={setSearchQuery}
          placeholder="Search conversations..."
          className="w-full bg-white border border-[#e5d9c8] rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#a07855]/30 focus:border-[#a07855]/60 shadow-sm transition-all duration-200"
        />
      </div>

      {/* Conversation list - Flexible height */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-[#a07855] border-t-transparent mb-4"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-[#a07855]/20 animate-ping"></div>
              </div>
            </div>
            <p className="font-body text-[#2c1810]/70 text-center">Loading conversations...</p>
          </div>
        ) : filteredForDisplay.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#fff7f0] to-[#f0e6d8] rounded-full flex items-center justify-center shadow-lg border-2 border-[#e5d9c8] mb-6">
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
            <h3 className="font-heading text-xl text-[#2c1810] mb-3 font-medium">No conversations found</h3>
            <p className="font-body text-[#2c1810]/60 max-w-xs leading-relaxed">
              {searchQuery ? 'Try different search terms' : 'Start new conversations to begin chatting'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredForDisplay.map((conversation) => {
              const otherUserId = conversation.participants.find(id => id !== currentUserId);
              const otherUser = getUserById(otherUserId);
              const timestamp = conversation.lastMessage?.createdAt
                ? formatTimestamp(conversation.lastMessage.createdAt)
                : formatTimestamp(conversation.updatedAt);

              const unreadCount = conversation.unreadCount || 0;

              return (
                <div 
                  key={conversation._id}
                  onClick={() => {
                    handleMarkAsRead(conversation._id);
                    markAsRead(conversation._id);
                    setCurrentConversationId(conversation._id);
                    onSelectConversation({ ...conversation, user: otherUser });
                  }}
                  className={cn(
                    "bg-white rounded-xl p-3 transition-all duration-200 cursor-pointer border border-transparent",
                    "hover:shadow-md hover:border-[#e5d9c8] active:scale-[0.98]",
                    selectedConversationId === conversation._id 
                      ? "bg-[#f5efe6] border-l-4 border-l-[#a07855] shadow-md" 
                      : unreadCount > 0 
                        ? "border-l-4 border-l-[#a07855]/60 bg-[#fff7f0] animate-message-pulse shadow-sm" 
                        : "shadow-sm"
                  )}
                >
                  <UserCard
                    user={otherUser}
                    selected={selectedConversationId === conversation._id}
                    lastMessage={conversation.lastMessage?.text || 'Start a conversation...'}
                    timestamp={timestamp}
                    unreadCount={unreadCount}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div> 
  );
};

export default RecentChats;