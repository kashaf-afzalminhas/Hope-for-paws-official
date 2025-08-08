import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Add useLocation import
import { FaChevronLeft } from 'react-icons/fa';
import { getUserConversations } from '../Main/api';
import UserCard from './UserCard';
import SearchBar from './SearchBar';
import { format } from 'date-fns';
import { getSocket } from '../services/socket';
import { cn } from '../lib/utils';

const RecentChats = ({
  currentUserId,
  onSelectConversation,
  selectedConversationId,
  users,
  conversations,
  setConversations,
  onBackToSidebar, // <-- Add this prop
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation(); // Add location hook
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // Changed from 1024 to 768

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768; // Changed from 1024 to 768
      console.log('RecentChats resize - window width:', window.innerWidth, 'isMobile:', newIsMobile);
      setIsMobile(newIsMobile);
    };
    window.addEventListener('resize', handleResize);
    console.log('RecentChats initial isMobile:', isMobile, 'window width:', window.innerWidth);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Memoized deduplication and filtering
  const { filteredForDisplay, uniqueConversations } = useMemo(() => {
    // First deduplicate by ID
    const dedupeById = (arr) => {
      const map = new Map();
      arr.forEach(item => item?._id && map.set(item._id, item));
      return Array.from(map.values());
    };

    // Then deduplicate by participants
    const dedupeByParticipants = (arr) => {
      const map = new Map();
      arr.forEach(item => {
        if (item?.participants?.length === 2) {
          const key = item.participants
            .map(String)
            .sort()
            .join('-');
          if (!map.has(key)) {
            map.set(key, item);
          } else {
            // Keep the most recent conversation if duplicates exist
            const existing = map.get(key);
            if (new Date(item.updatedAt) > new Date(existing.updatedAt)) {
              map.set(key, item);
            }
          }
        }
      });
      return Array.from(map.values());
    };

    // Process conversations
    const dedupedById = dedupeById(conversations || []);
    const uniqueConvs = dedupeByParticipants(dedupedById);

    // Update parent state if duplicates were found
    if (uniqueConvs.length !== conversations?.length) {
      setTimeout(() => setConversations(uniqueConvs), 0);
    }

    // Apply search filter
    const filtered = searchQuery
      ? uniqueConvs.filter(conv => {
          const otherUserId = conv.participants.find(id => id !== currentUserId);
          const otherUser = users.find(u => u._id === otherUserId);
          return otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase());
        })
      : uniqueConvs;

    // Filter out empty conversations not started by current user
    const filteredForDisplay = filtered.filter(conv => {
      if (conv.lastMessage?.text === "Start a conversation..." && 
          conv.participants[0] !== currentUserId) {
        return false;
      }
      return true;
    });

    return { filteredForDisplay, uniqueConversations: uniqueConvs };
  }, [conversations, users, currentUserId, searchQuery, setConversations]);

  useEffect(() => {
    setIsLoading(!conversations);
  }, [conversations]);

  useEffect(() => {
    if (selectedConversationId) {
      setConversations((prev) =>
        (Array.isArray(prev) ? prev : []).map((conv) =>
          conv._id === selectedConversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    }
  }, [selectedConversationId, setConversations]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a');
    }

    if (date.getFullYear() === now.getFullYear()) {
      return format(date, 'MMM d');
    }

    return format(date, 'MM/dd/yyyy');
  };

  const handleBackClick = () => {
    console.log('RecentChats handleBackClick called');
    console.log('isMobile:', isMobile);
    console.log('onBackToSidebar:', onBackToSidebar);
    console.log('location.pathname:', location.pathname);
    
    // Check if we're on a chat route with a recipientId
    const isOnChatRoute = location.pathname.startsWith('/chat/');
    console.log('isOnChatRoute:', isOnChatRoute);
    
    if (isMobile) {
      if (onBackToSidebar) {
        console.log('Calling onBackToSidebar');
        // If we're in a chat conversation, go back to conversation list
        if (isOnChatRoute) {
          console.log('Navigating to /chat');
          navigate('/chat');
          return; // Don't call onBackToSidebar when navigating to conversation list
        } else {
          // If we're already on the conversation list, go back to previous page
          console.log('Already on conversation list, navigating to previous page');
          navigate(-1);
        }
      } else {
        console.log('No onBackToSidebar function, using navigate(-1)');
        navigate(-1);
      }
    } else {
      // On desktop, use browser history
      console.log('Desktop navigation, using navigate(-1)');
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f8f4ea]">
      {/* Header with search and back button */}
      <div className="flex-shrink-0 p-4 pb-3 bg-[#f8f4ea] flex items-center">
        <button
          onClick={(e) => {
            console.log('Back button clicked!');
            e.preventDefault();
            e.stopPropagation();
            // Add visual feedback
            e.target.style.backgroundColor = '#a07855';
            e.target.style.color = 'white';
            setTimeout(() => {
              e.target.style.backgroundColor = '';
              e.target.style.color = '';
            }, 200);
            handleBackClick();
          }}
          className="flex items-center p-2 rounded-xl hover:bg-[#f0e6d8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#a07855]/30 active:bg-[#a07855] active:text-white"
          aria-label="Back"
        >
          <FaChevronLeft className="text-[#6b493d] text-lg" />
        </button>
        <div className="flex-1"></div>
      </div>

      {/* Header with search */}
      <div className="flex-shrink-0 p-4 pb-3 bg-[#f8f4ea]">
        <h2 className="text-[#2c1810] font-semibold text-xl mb-3 px-1">Messages</h2>
        <SearchBar
          onSearch={setSearchQuery}
          placeholder="Search conversations..."
          className="w-full bg-white border border-[#e5d9c8] rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[#a07855]/30 shadow-sm"
        />
      </div>

      {/* Conversation list - Flexible height */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-[#a07855] border-t-transparent mb-4"></div>
            <p className="font-body text-[#2c1810]/70 text-center">Loading conversations...</p>
          </div>
        ) : filteredForDisplay.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-24 h-24 bg-[#f0e6d8] rounded-full flex items-center justify-center mb-5">
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
            <h3 className="font-heading text-xl text-[#2c1810] mb-2 font-medium">No conversations found</h3>
            <p className="font-body text-[#2c1810]/60 max-w-xs">
              {searchQuery ? 'Try different search terms' : 'Start new conversations to begin chatting'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredForDisplay.map((conversation) => {
              const otherUserId = conversation.participants.find(id => id !== currentUserId);
              const otherUser = users.find(u => u._id === otherUserId) || { username: 'Unknown', _id: otherUserId };

              const timestamp = conversation.lastMessage?.createdAt
                ? formatTimestamp(conversation.lastMessage.createdAt)
                : formatTimestamp(conversation.updatedAt);

              return (
                <div 
                  key={conversation._id}
                  onClick={() => onSelectConversation({ ...conversation, user: otherUser })}
                  className={cn(
                    "bg-white rounded-xl p-3 transition-all duration-200 cursor-pointer border border-transparent",
                    "hover:shadow-md hover:border-[#e5d9c8] active:scale-[0.99]",
                    selectedConversationId === conversation._id 
                      ? "bg-[#f5efe6] border-l-4 border-l-[#a07855] shadow-sm" 
                      : ""
                  )}
                >
                  <UserCard
                    user={otherUser || { username: 'Unknown' }}
                    selected={selectedConversationId === conversation._id}
                    lastMessage={conversation.lastMessage?.text || 'Start a conversation...'}
                    timestamp={timestamp}
                    unreadCount={conversation.unreadCount}
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