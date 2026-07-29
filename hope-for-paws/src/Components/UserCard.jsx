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
        'flex items-center p-3 gap-3 cursor-pointer rounded-2xl transition-all duration-200 group',
        selected
          ? 'bg-gradient-to-r from-[#f0e6d8] to-[#f5efe6] shadow-md ring-1 ring-[#a07855]/30'
          : unreadCount > 0
            ? 'bg-white shadow-sm ring-1 ring-[#a07855]/15 hover:shadow-md hover:-translate-y-0.5'
            : 'bg-white shadow-sm ring-1 ring-[#e5d9c8]/60 hover:shadow-md hover:-translate-y-0.5',
        "active:scale-[0.98]",
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
            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-sm group-hover:ring-[#a07855]/30 transition-all duration-200"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-[#a07855] to-[#6b493d] flex items-center justify-center text-[#ffd8b8] text-lg font-bold ring-2 ring-white shadow-sm group-hover:ring-[#a07855]/30 transition-all duration-200 ${user.profileImage ? 'hidden' : ''}`}
        >
          {(user.username || 'U').charAt(0).toUpperCase()}
        </div>
        {user.status === 'online' && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm">
            <div className="absolute inset-0.5 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex justify-between items-center gap-2">
          <h3 className={cn(
            "font-heading text-[#2c1810] truncate",
            selected || unreadCount > 0 ? "font-semibold" : "font-medium"
          )}>
            {user.username || 'Unknown User'}
          </h3>
          {timestamp && (
            <span className={cn(
              "text-[11px] font-body whitespace-nowrap shrink-0",
              selected ? "text-[#a07855] font-medium" : "text-[#2c1810]/45"
            )}>
              {timestamp}
            </span>
          )}
        </div>

        <div className="flex justify-between items-center mt-1 gap-2">
          <p className={cn(
            "text-[13px] font-body truncate",
            unreadCount > 0 ? "text-[#2c1810] font-medium" : "text-[#2c1810]/55"
          )}>
            {lastMessage?.length > 32 ? `${lastMessage.substring(0, 32)}...` : lastMessage}
          </p>

          {unreadCount > 0 && (
            <span className={cn(
              "bg-gradient-to-br from-[#a07855] to-[#8a6a4d] text-[#ffd8b8] text-[10px] font-bold rounded-full",
              "min-w-[19px] h-[19px] flex items-center justify-center shrink-0 shadow-sm",
              unreadCount > 9 ? "px-1.5" : ""
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