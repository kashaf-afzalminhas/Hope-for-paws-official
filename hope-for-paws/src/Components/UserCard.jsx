import React from 'react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { AUTH_BASE_URL } from '../config';

const UserCard = ({
  user,
  selected = false,
  onClick,
  lastMessage,
  timestamp,
  unreadCount = 0,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center p-3 gap-3 cursor-pointer rounded-xl transition-all duration-200',
        'bg-white border border-[#e5d9c8] hover:border-[#a07855]/40',
        selected 
          ? 'bg-[#f5efe6] border-l-4 border-l-[#a07855] shadow-md' 
          : 'hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <Link 
        to={`/profile/public/${user._id}`}
        className="relative shrink-0 group"
        onClick={(e) => e.stopPropagation()}
      >
        {user.profileImage ? (
          <img 
            src={`${AUTH_BASE_URL.replace('/auth', '')}${user.profileImage}`}
            alt={user.username || 'User'} 
            className="w-12 h-12 rounded-xl object-cover border-2 border-[#e5d9c8] group-hover:border-[#a07855]/40 transition-colors duration-200"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`w-12 h-12 rounded-xl bg-gradient-to-br from-[#a07855] to-[#6b493d] flex items-center justify-center text-[#ffd8b8] text-lg font-bold border-2 border-[#e5d9c8] group-hover:border-[#a07855]/40 transition-colors duration-200 ${user.profileImage ? 'hidden' : ''}`}
        >
          {(user.username || 'U').charAt(0).toUpperCase()}
        </div>
        {/* Online status indicator */}
        {user.status === 'online' && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
        )}
      </Link>
      
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex justify-between items-center gap-2">
          <h3 className={cn(
            "font-heading text-[#2c1810] font-medium truncate",
            selected && "font-semibold"
          )}>
            {user.username || 'Unknown User'}
          </h3>
          {timestamp && (
            <span className={cn(
              "text-xs font-body whitespace-nowrap",
              selected ? "text-[#a07855]" : "text-[#2c1810]/60"
            )}>
              {timestamp}
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-1.5 gap-2">
          <p className={cn(
            "text-sm font-body truncate text-[#2c1810]/80",
            selected && "text-[#2c1810]",
            unreadCount > 0 && "font-medium"
          )}>
            {lastMessage?.length > 35 ? `${lastMessage.substring(0, 35)}...` : lastMessage}
          </p>
          
          {unreadCount > 0 && (
            <span className={cn(
              "bg-[#a07855] text-[#ffd8b8] text-xs font-bold rounded-full",
              "min-w-[20px] h-[20px] flex items-center justify-center shrink-0",
              "transition-transform duration-200 hover:scale-110 shadow-sm",
              unreadCount > 9 ? "px-1" : ""
            )}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserCard;
