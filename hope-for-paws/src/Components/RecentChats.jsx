import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { markConversationAsRead, debugToken } from '../Main/api';
import { format } from 'date-fns';
import { useMessages } from '../context/MessageContext';

const RecentChats = ({
  currentUserId,
  onSelectConversation,
  selectedConversationId,
  users = [],
  conversations = [],
  onBackToSidebar,
  getUserFromCache,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { markAsRead } = useMessages();

  const getInitials = (name) => {
    if (!name) return 'PF';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      if (date.toDateString() === now.toDateString()) return format(date, 'h:mm a');
      if (date.getFullYear() === now.getFullYear()) return format(date, 'MMM d');
      return format(date, 'MM/dd/yy');
    } catch {
      return '';
    }
  };

  const handleMarkAsRead = async (conversationId) => {
    try {
      debugToken();
      const result = await markConversationAsRead(conversationId);
      if (result?.data?.modifiedCount > 0) {
        setTimeout(() => window.dispatchEvent(new CustomEvent('refreshConversations')), 100);
      }
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getUserById = useCallback((userId) => {
    if (getUserFromCache) {
      const cachedUser = getUserFromCache(userId);
      if (cachedUser) return cachedUser;
    }
    const user = users.find(u => u._id === userId);
    if (user) return user;
    return { username: 'Pet Friend', _id: userId };
  }, [users, getUserFromCache]);

  // Filter and sort conversations by latest message timestamp (WhatsApp style)
  const filteredForDisplay = useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return [];
    
    let filtered = searchQuery
      ? conversations.filter(conv => {
          if (!conv || !conv.participants) return false;
          const otherUserId = conv.participants.find(id => id !== currentUserId);
          const otherUser = getUserById(otherUserId);
          return otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase());
        })
      : conversations;

    filtered = filtered.filter(conv => {
      if (!conv || !conv.lastMessage) return false;
      if (conv.lastMessage.text === "Start a conversation..." && conv.participants[0] !== currentUserId) {
        return false;
      }
      return true;
    });

    // Sort descending by most recent activity
    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.lastMessage?.createdAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.lastMessage?.createdAt || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });
  }, [conversations, currentUserId, searchQuery, getUserById]);

  useEffect(() => {
    if (!conversations) setIsLoading(true);
    else setIsLoading(false);
  }, [conversations]);

  const totalUnread = useMemo(() => {
    return (conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }, [conversations]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#301B12] text-white select-none">
      {/* Top Banner with Clean Greeting & Message Count */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐾</span>
            <h2 className="text-[#F5EAE2] font-semibold text-lg tracking-tight">
              Direct Messages
            </h2>
          </div>
          {totalUnread > 0 ? (
            <span className="text-[11px] font-bold bg-[#a07855] text-white px-2.5 py-0.5 rounded-full shadow-xs animate-pulse">
              {totalUnread} new
            </span>
          ) : conversations.length > 0 ? (
            <span className="text-[11px] font-medium bg-[#42281D] text-[#E2BD9E] px-2.5 py-0.5 rounded-full border border-[#5A382A]">
              {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}
            </span>
          ) : null}
        </div>
        <p className="text-[#E2BD9E]/80 font-normal text-xs leading-relaxed">
          Stay connected with pet lovers, adopters, and rescues in one place.
        </p>

        {/* Search Input */}
        <div className="relative mt-4">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xs" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#42281D] text-sm text-[#F5EAE2] placeholder-white/40 pl-10 pr-4 py-2.5 rounded-2xl border border-[#523326] focus:outline-hidden focus:border-[#BA8B60] transition-colors"
          />
        </div>
      </div>

      {/* Conversations List with Unread Count Badges & Timestamps */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0 bg-[#301B12]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-white/50 text-xs">
            Loading conversations...
          </div>
        ) : filteredForDisplay.length === 0 ? (
          <div className="text-center py-12 text-white/40 text-sm">
            No conversations found
          </div>
        ) : (
          filteredForDisplay.map((conversation) => {
            const otherUserId = conversation.participants.find(id => id !== currentUserId);
            const otherUser = getUserById(otherUserId);
            const isSelected = selectedConversationId === conversation._id;
            const unreadCount = conversation.unreadCount || 0;
            const lastMsg = conversation.lastMessage?.text || 'Start a conversation...';
            const timestamp = formatTimestamp(conversation.lastMessage?.createdAt || conversation.updatedAt);
            const initials = getInitials(otherUser.username);

            return (
              <button
                key={conversation._id}
                onClick={() => {
                  handleMarkAsRead(conversation._id);
                  markAsRead(conversation._id);
                  onSelectConversation({ ...conversation, user: otherUser });
                }}
                className={`w-full text-left p-3 rounded-2xl flex items-center gap-3.5 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#BA8B60] text-[#24130A] shadow-md font-medium translate-x-0.5'
                    : unreadCount > 0
                    ? 'bg-[#43271A] hover:bg-[#4E2E20] text-white shadow-xs border-l-4 border-[#a07855]'
                    : 'bg-[#3A2217]/50 hover:bg-[#452A1D] hover:translate-x-1 text-white shadow-xs'
                }`}
              >
                {/* User Avatar with Initials + Online Dot */}
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-sm tracking-wider border transition-all ${
                    isSelected 
                      ? 'bg-[#FDF6EE] text-[#301B12] border-[#8D5832] shadow-xs' 
                      : unreadCount > 0
                      ? 'bg-[#523021] text-[#FFF] border-[#BA8B60]'
                      : 'bg-[#4B2C1E] text-[#E2BD9E] border-[#5D3A29]'
                  }`}>
                    {initials}
                  </div>
                  {otherUser.status === 'online' && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#9CD373] rounded-full ring-2 ring-[#301B12]" />
                  )}
                </div>

                {/* Conversation Info + WhatsApp Unread Badge */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`text-sm truncate ${
                      isSelected 
                        ? 'font-bold text-[#24130A]' 
                        : unreadCount > 0 
                        ? 'font-extrabold text-white' 
                        : 'font-semibold text-[#F5EAE2]'
                    }`}>
                      {otherUser.username || 'Pet Friend'}
                    </span>
                    {timestamp && (
                      <span className={`text-[11px] shrink-0 ${
                        isSelected 
                          ? 'text-[#3D2315]' 
                          : unreadCount > 0 
                          ? 'text-[#E2BD9E] font-bold' 
                          : 'text-white/40'
                      }`}>
                        {timestamp}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs truncate ${
                      isSelected 
                        ? 'text-[#3D2315]' 
                        : unreadCount > 0 
                        ? 'text-white font-medium' 
                        : 'text-white/60'
                    }`}>
                      {lastMsg}
                    </p>
                    
                    {/* Unread Message Pill Badge */}
                    {unreadCount > 0 && !isSelected && (
                      <span className="shrink-0 min-w-5 h-5 px-1.5 bg-[#a07855] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentChats;