import React from 'react';
//import Avatar from './Avatar';
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
        'flex items-center p-4 gap-3 cursor-pointer border-b border-[#a07855]/10',
        'transition-all duration-200',
        selected ? 'bg-[#a07855]/10' : 'hover:bg-[#a07855]/5',
        className
      )}
      onClick={onClick}
    >
      <Link 
        to={`/profile/public/${user._id}`}
        className="relative shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {user.profileImage ? (
          <img 
            src={`${AUTH_BASE_URL.replace('/auth', '')}${user.profileImage}`}
            alt={user.username || 'User'} 
            className="w-12 h-12 rounded-full object-cover border border-[#a07855]/20"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`w-12 h-12 rounded-full bg-[#6b493d] flex items-center justify-center text-[#ffd8b8] font-bold border border-[#a07855]/20 ${user.profileImage ? 'hidden' : ''}`}
        >
          {(user.username || 'U').charAt(0).toUpperCase()}
        </div>
        {/* Online status indicator */}
        {user.status === 'online' && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#fff7f0]"></div>
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
              "text-xs font-body",
              selected ? "text-[#a07855]" : "text-[#2c1810]/60"
            )}>
              {timestamp}
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-1">
          <p className={cn(
            "text-sm font-body truncate",
            selected ? "text-[#2c1810]" : "text-[#2c1810]/70",
            unreadCount > 0 && "font-medium"
          )}>
            {lastMessage?.length > 35 ? `${lastMessage.substring(0, 35)}...` : lastMessage}
          </p>
          
          {unreadCount > 0 && (
            <span className={cn(
              "bg-[#a07855] text-[#ffd8b8] text-xs font-bold rounded-full",
              "w-5 h-5 flex items-center justify-center shrink-0 ml-2",
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
