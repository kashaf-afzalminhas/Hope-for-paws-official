import React, { useEffect, useState, useMemo } from 'react';
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
  setConversations, // Make sure this prop is passed from parent
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  // De-duplicate conversations by sorted participants
  // const uniqueConversations = dedupeByParticipants(filteredConversations); // This line is now handled by useMemo

  // Filter: Only show empty conversations to the user who started them
  // const filteredForDisplay = uniqueConversations.filter((conv) => { // This line is now handled by useMemo
  //   if (
  //     conv.lastMessage &&
  //     conv.lastMessage.text === "Start a conversation..." &&
  //     conv.participants[0] !== currentUserId
  //   ) {
  //     return false;
  //   }
  //   return true;
  // });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f5f0e1]">
      {/* Search bar */}
      <div className="p-4 border-b border-[#a07855]/20 bg-[#f5f0e1]">
        <SearchBar
          onSearch={setSearchQuery}
          placeholder="Search conversations..."
          className="w-full bg-[#fff7f0] border border-[#a07855]/30 focus-within:border-[#a07855] focus-within:ring-2 focus-within:ring-[#a07855]/20"
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto bg-[#f5f0e1]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#a07855] border-t-transparent mb-4"></div>
            <p className="font-body text-[#2c1810]/70 text-center">Loading conversations...</p>
          </div>
        ) : filteredForDisplay.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-20 h-20 bg-[#a07855]/10 rounded-full flex items-center justify-center mb-6">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-10 w-10 text-[#a07855]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-heading text-xl text-[#2c1810] mb-2 font-semibold">No conversations found</h3>
            <p className="font-body text-[#2c1810]/60 max-w-sm">
              {searchQuery ? 'Try adjusting your search terms' : 'Start connecting with other users to begin chatting'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#a07855]/10">
            {filteredForDisplay.map((conversation) => {
              const otherUserId = conversation.participants.find(id => id !== currentUserId);
              const otherUser = users.find(u => u._id === otherUserId) || { username: 'Unknown', _id: otherUserId };

              console.log('Rendering conversation:', conversation._id, otherUser?.username);

              const timestamp = conversation.lastMessage?.createdAt
                ? formatTimestamp(conversation.lastMessage.createdAt)
                : formatTimestamp(conversation.updatedAt);

              return (
                <UserCard
                  key={conversation._id}
                  user={otherUser || { username: 'Unknown' }}
                  selected={selectedConversationId === conversation._id}
                  lastMessage={conversation.lastMessage?.text || 'Start a conversation...'}
                  timestamp={timestamp}
                  unreadCount={conversation.unreadCount}
                  onClick={() => {
                    console.log('Clicked conversation:', conversation._id, otherUser?.username);
                    onSelectConversation({ ...conversation, user: otherUser });
                  }}
                  className={cn(
                    "transition-all duration-200",
                    selectedConversationId === conversation._id 
                      ? "bg-[#a07855]/10 border-l-4 border-l-[#a07855]" 
                      : "hover:bg-[#a07855]/5"
                  )}
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