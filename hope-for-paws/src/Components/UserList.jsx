import React, { useEffect, useState } from 'react';
import UserCard from './UserCard';
import SearchBar from './SearchBar';
import { searchUsers } from '../Main/api';
import { cn } from '../lib/utils';

const UsersList = ({ currentUserId, onSelectUser, selectedUserId, users = [] }) => {
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize filtered users when users prop changes
  useEffect(() => {
    console.log('UserList received users:', users);
    console.log('Users length:', users.length);
    console.log('Current user ID:', currentUserId);
    
    if (Array.isArray(users) && users.length > 0) {
      // Filter out current user and add status
      const filteredUsersData = users
        .filter(user => user._id !== currentUserId)
        .map(user => ({
          ...user,
          status: Math.random() > 0.5 ? 'online' : 'offline',
          lastSeen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }));
      
      console.log('Filtered users data:', filteredUsersData);
      setFilteredUsers(filteredUsersData);
      setError(null);
    } else {
      console.log('No users available or users is not an array');
      setFilteredUsers([]);
      if (users.length === 0) {
        setError('No users available');
      }
    }
  }, [users, currentUserId]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query) {
      const usersArray = Array.isArray(users) ? users : [];
      const filteredArray = usersArray
        .filter(user => user._id !== currentUserId)
        .map(user => ({
          ...user,
          status: Math.random() > 0.5 ? 'online' : 'offline',
          lastSeen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }));
      setFilteredUsers(showOnlineOnly ? filteredArray.filter(user => user.status === 'online') : filteredArray);
      return;
    }

    try {
      // Use local search instead of API call
      const usersArray = Array.isArray(users) ? users : [];
      const searchResults = usersArray
        .filter(user => user._id !== currentUserId)
        .filter(user => 
          (user.username && user.username.toLowerCase().includes(query.toLowerCase())) ||
          (user.email && user.email.toLowerCase().includes(query.toLowerCase()))
        )
        .map(user => ({
          ...user,
          status: Math.random() > 0.5 ? 'online' : 'offline',
          lastSeen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }));

      if (showOnlineOnly) {
        setFilteredUsers(searchResults.filter(user => user.status === 'online'));
      } else {
        setFilteredUsers(searchResults);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      const filtered = (Array.isArray(users) ? users : []).filter(user =>
        user._id !== currentUserId &&
        (user.username && user.username.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredUsers(showOnlineOnly ? filtered.filter(user => user.status === 'online') : filtered);
    }
  };

  const toggleOnlineFilter = () => {
    const newValue = !showOnlineOnly;
    setShowOnlineOnly(newValue);
    const usersArray = Array.isArray(users) ? users : [];
    
    const baseFilteredUsers = usersArray
      .filter(user => user._id !== currentUserId)
      .map(user => ({
        ...user,
        status: Math.random() > 0.5 ? 'online' : 'offline',
        lastSeen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }));
    
    if (newValue) {
      setFilteredUsers(
        searchQuery 
          ? baseFilteredUsers.filter(user => 
              user.status === 'online' && 
              (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()))
            )
          : baseFilteredUsers.filter(user => user.status === 'online')
      );
    } else {
      setFilteredUsers(
        searchQuery 
          ? baseFilteredUsers.filter(user => 
              (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()))
            )
          : baseFilteredUsers
      );
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f8f4ea] rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-[#e5d9c8] bg-white rounded-t-lg">
        <h2 className="text-xl font-heading font-bold text-[#2c1810] mb-4">All Users</h2>
        
        {/* Search and filter */}
        <div className="flex flex-col space-y-3">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search by name or username..."
            className="w-full bg-white border border-[#e5d9c8] rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#a07855]/30 focus:border-[#a07855]/60 shadow-sm transition-all duration-200"
          />

          <div className="flex items-center">
            <button
              onClick={toggleOnlineFilter}
              className={cn(
                "flex items-center text-sm font-body transition-all duration-200",
                showOnlineOnly ? "text-[#a07855]" : "text-[#2c1810]/70 hover:text-[#2c1810]"
              )}
            >
              <span className={cn(
                "w-4 h-4 rounded mr-2 border-2 flex items-center justify-center transition-all duration-200",
                showOnlineOnly 
                  ? "bg-[#a07855] border-[#a07855] shadow-sm" 
                  : "bg-white border-[#e5d9c8] hover:border-[#a07855]/40"
              )}>
                {showOnlineOnly && (
                  <svg className="w-2 h-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
              Show online only
            </button>
          </div>
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto p-3 bg-[#f8f4ea]">
        {console.log('Render - isLoading:', isLoading, 'error:', error, 'filteredUsers:', filteredUsers, 'filteredUsers length:', filteredUsers.length)}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-[#a07855] border-t-transparent mb-4"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-[#a07855]/20 animate-ping"></div>
              </div>
            </div>
            <p className="font-body text-[#2c1810]/70">Loading users...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#fff7f0] to-[#f0e6d8] rounded-full flex items-center justify-center shadow-lg border-2 border-[#e5d9c8] mb-6">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-12 w-12 text-red-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="font-heading text-lg text-red-600 mb-2">Unable to load users</h3>
            <p className="font-body text-[#2c1810]/70 mb-6">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                setIsLoading(true);
                // Trigger a re-fetch
                const event = new Event('retry');
                window.dispatchEvent(event);
              }}
              className="px-6 py-3 bg-[#a07855] text-[#ffd8b8] rounded-xl hover:bg-[#8a6a4d] transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
            >
              Try again
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#fff7f0] to-[#f0e6d8] rounded-full flex items-center justify-center shadow-lg border-2 border-[#e5d9c8] mb-6">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-12 w-12 text-[#a07855]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-heading text-lg text-[#2c1810] mb-2">No users found</h3>
            <p className="font-body text-[#2c1810]/70 leading-relaxed">
              {searchQuery 
                ? 'Try a different search term' 
                : showOnlineOnly 
                  ? 'No online users available' 
                  : 'No users to display'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {(Array.isArray(filteredUsers) ? filteredUsers : []).map(user => (
              <UserCard
                key={user._id}
                user={user}
                selected={selectedUserId === user._id}
                onClick={() => onSelectUser?.(user)}
                timestamp={user.status === 'online' ? 'Online' : `Last seen ${formatLastSeen(user.lastSeen)}`}
                className={cn(
                  "transition-all duration-200",
                  selectedUserId === user._id 
                    ? "bg-[#f5efe6] border-l-4 border-l-[#a07855] shadow-md" 
                    : "hover:shadow-md"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format last seen time
function formatLastSeen(timestamp) {
  const now = new Date();
  const lastSeen = new Date(timestamp);
  const diffInHours = (now - lastSeen) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return 'recently';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    return `${Math.floor(diffInHours / 24)}d ago`;
  }
}

export default UsersList;
