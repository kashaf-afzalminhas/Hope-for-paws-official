import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';
import { getUserConversations, markConversationAsRead, debugToken, deleteConversation } from '../Main/api';
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
  onConversationDeleted,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { markAsRead } = useMessages();

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

  
  const handleDeleteConversation = async (conversationId) => {
    try {
      await deleteConversation(conversationId);
      const updated = (conversations || []).filter(conv => conv._id !== conversationId);
      setConversations(updated);
      if (onConversationDeleted) onConversationDeleted(conversationId);
      if (addToast) {
        addToast({ title: 'Deleted', description: 'Conversation deleted successfully', variant: 'default' });
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      if (addToast) {
        addToast({ title: 'Error', description: 'Failed to delete conversation', variant: 'destructive' });
      }
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
    return { username: 'Unknown', _id: userId };
  }, [users, getUserFromCache]);

  const filteredForDisplay = useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return [];
    const filtered = searchQuery
      ? conversations.filter(conv => {
          if (!conv || !conv.participants) return false;
          const otherUserId = conv.participants.find(id => id !== currentUserId);
          const otherUser = getUserById(otherUserId);
          return otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase());
        })
      : conversations;
    return filtered.filter(conv => conv != null);
  }, [conversations, users, currentUserId, searchQuery, getUserById, selectedConversationId]);

  useEffect(() => {
    if (!conversations) setIsLoading(true);
    else setIsLoading(false);
  }, [conversations]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      if (date.toDateString() === now.toDateString()) return format(date, 'h:mm a');
      if (date.getFullYear() === now.getFullYear()) return format(date, 'MMM d');
      return format(date, 'MM/dd/yyyy');
    } catch {
      return '';
    }
  };

  const handleBackClick = () => {
    const isOnChatRoute = location.pathname.startsWith('/chat/');
    if (isMobile && onBackToSidebar) {
      if (isOnChatRoute) { navigate('/chat'); return; }
      navigate(-1);
    } else {
      navigate(-1);
    }
  };

  const unreadTotal = (conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#2c1810]">
      {/* Bold dark gradient header — mirrors marketplace hero */}
      <div className="relative flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#2c1810] via-[#3d2418] to-[#6b493d] px-5 pt-5 pb-6">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#a07855]/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-[#a07855]/15 blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-between mb-4">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBackClick(); }}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-90 backdrop-blur-sm"
            aria-label="Back"
          >
            <FaChevronLeft className="text-white text-xs" />
          </button>

          {unreadTotal > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-[#ffd8b8] text-[11px] font-bold px-3 py-1 rounded-full border border-white/10">
              {unreadTotal} unread
            </span>
          )}
        </div>

        <div className="relative flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-[#ffd8b8]/80 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            🐾 HopeForPaws Chat
          </span>
        </div>
        <h2 className="relative text-white font-heading font-extrabold text-3xl tracking-tight">
          Messages
        </h2>

        <div className="relative mt-4">
          <SearchBar onSearch={setSearchQuery} placeholder="Search conversations..." dark />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-4 min-h-0 bg-[#2c1810]">
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#a07855]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-heading text-xl text-[#2c1810] mb-3 font-bold">No conversations found</h3>
            <p className="font-body text-[#2c1810]/60 max-w-xs leading-relaxed">
              {searchQuery ? 'Try different search terms' : 'Start new conversations to begin chatting'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredForDisplay.map((conversation) => {
              const otherUserId = conversation.participants.find(id => id !== currentUserId);
              const otherUser = getUserById(otherUserId);
              const timestamp = conversation.lastMessage?.createdAt
                ? formatTimestamp(conversation.lastMessage.createdAt)
                : formatTimestamp(conversation.updatedAt);
              const unreadCount = conversation.unreadCount || 0;

              return (
                                <UserCard
                  key={conversation._id}
                  user={otherUser}
                  selected={selectedConversationId === conversation._id}
                  lastMessage={conversation.lastMessage?.text || 'Start a conversation...'}
                  timestamp={timestamp}
                  unreadCount={unreadCount}
                  onClick={() => {
                    handleMarkAsRead(conversation._id);
                    markAsRead(conversation._id);
                    onSelectConversation({ ...conversation, user: otherUser });
                  }}
                  onDelete={() => handleDeleteConversation(conversation._id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentChats;