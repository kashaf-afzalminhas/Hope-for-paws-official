import React, { useEffect, useState } from 'react';
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
  addToast,
}) => {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching conversations for user:', currentUserId);
        const response = await getUserConversations(currentUserId);
        console.log('Conversations response:', response);
        
        // Ensure response.data is an array
        const conversationsData = Array.isArray(response?.data?.data) ? response.data.data : [];
        console.log('Processed conversations data:', conversationsData);
        
        setConversations(conversationsData);
        setFilteredConversations(conversationsData);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        // Set empty array as fallback
        setConversations([]);
        setFilteredConversations([]);
        addToast && addToast({
          title: 'Error',
          description: 'Failed to fetch conversations',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUserId && users.length > 0) {
      fetchConversations();
    } else if (currentUserId && users.length === 0) {
      // If users array is empty, still try to fetch conversations
      fetchConversations();
    }
  }, [currentUserId, users]); // Removed addToast from dependencies

  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = (message) => {
      if (message.isReceiver || (message.isSender && message.senderId === currentUserId)) {
        setConversations((prev) =>
          (Array.isArray(prev) ? prev : []).map((conv) => {
            if (conv._id === message.conversationId) {
              const unreadCount =
                selectedConversationId === conv._id
                  ? 0
                  : message.isReceiver ? (conv.unreadCount || 0) + 1 : conv.unreadCount || 0;

              return {
                ...conv,
                lastMessage: message,
                unreadCount,
                updatedAt: message.createdAt,
              };
            }
            return conv;
          })
        );
      }
    };

    socket.on('getMessage', handleNewMessage);

    return () => {
      socket.off('getMessage', handleNewMessage);
    };
  }, [currentUserId, selectedConversationId]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = (Array.isArray(conversations) ? conversations : []).filter((conv) => {
        const otherUserId = conv.participants.find(id => id !== currentUserId);
        const otherUser = users.find(u => u._id === otherUserId);
        return otherUser && otherUser.username.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(Array.isArray(conversations) ? conversations : []);
    }
  }, [searchQuery, conversations, users, currentUserId]);

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
  }, [selectedConversationId]);

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

  // De-duplicate conversations by _id
  const uniqueConversations = [];
  const seenIds = new Set();
  for (const conv of filteredConversations) {
    if (!seenIds.has(conv._id)) {
      uniqueConversations.push(conv);
      seenIds.add(conv._id);
    }
  }

  // Filter: Only show empty conversations to the user who started them
  const filteredForDisplay = uniqueConversations.filter(conv => {
    // If the conversation only has the default message and the current user is not the creator, hide it
    if (
      conv.lastMessage &&
      conv.lastMessage.text === "Start a conversation..." &&
      conv.participants[0] !== currentUserId
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#fff7f0]">
      {/* Search bar */}
      <div className="p-4 border-b border-[#a07855]/20 bg-white">
        <SearchBar
          onSearch={setSearchQuery}
          placeholder="Search conversations..."
          className="w-full bg-[#fff7f0] border border-[#a07855]/30 focus-within:border-[#a07855] focus-within:ring-2 focus-within:ring-[#a07855]/20"
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
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
              const otherUser = users.find(u => u._id === otherUserId);

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
                  onClick={() => onSelectConversation({ ...conversation, user: otherUser })}
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