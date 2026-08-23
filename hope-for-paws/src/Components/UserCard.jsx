import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { AUTH_BASE_URL } from '../config';
import { Trash2 } from 'lucide-react';

const UserCard = ({ user, selected = false, onClick, lastMessage, timestamp, unreadCount = 0, className, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirmDelete = (e) => {
    e.stopPropagation();
    setShowConfirm(false);
    if (onDelete) onDelete();
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <div
      className={cn(
        'relative flex items-center p-3 gap-3 cursor-pointer rounded-xl transition-all duration-200 group',
        selected
          ? 'bg-[#a07855]/25 border-l-4 border-[#ffd8b8]'
          : 'hover:bg-white/5 border-l-4 border-transparent',
        "active:scale-[0.98]",
        className
      )}
      onClick={onClick}
    >
      <Link to={`/profile/public/${user._id}`} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
        {user.profileImage ? (
          <img
            src={`${AUTH_BASE_URL.replace('/auth', '')}${user.profileImage}`}
            alt={user.username || 'User'}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10 shadow-sm"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        <div className={cn(
          "w-12 h-12 rounded-full bg-gradient-to-br from-[#a07855] to-[#6b493d] flex items-center justify-center text-white text-lg font-bold ring-2 ring-white/10 shadow-sm",
          user.profileImage ? 'hidden' : ''
        )}>
          {(user.username || 'U').charAt(0).toUpperCase()}
        </div>
        {user.status === 'online' && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#2c1810]"></div>
        )}
      </Link>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex justify-between items-center gap-2">
          <h3 className={cn("font-heading truncate", selected ? "text-white font-bold" : "text-white/90 font-semibold")}>
            {user.username || 'Unknown User'}
          </h3>
          {timestamp && (
            <span className="text-[11px] font-body whitespace-nowrap shrink-0 text-white/40">
              {timestamp}
            </span>
          )}
        </div>

        <div className="flex justify-between items-center mt-0.5 gap-2">
          <p className={cn("text-[13px] font-body truncate", unreadCount > 0 ? "text-white/85 font-medium" : "text-white/50")}>
            {lastMessage?.length > 30 ? `${lastMessage.substring(0, 30)}...` : lastMessage}
          </p>
          {unreadCount > 0 && (
            <span className="bg-[#a07855] text-white text-[10px] font-bold rounded-full min-w-[19px] h-[19px] flex items-center justify-center shrink-0 px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </div>

      {onDelete && (
        <button
          onClick={handleDeleteClick}
          className="shrink-0 p-2 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg hover:bg-white/5"
          title="Delete conversation"
          aria-label="Delete conversation"
        >
          <Trash2 size={16} />
        </button>
      )}

      {showConfirm && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-between gap-2 px-4 rounded-xl bg-[#2c1810] border border-red-400/40"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[13px] text-white/90 font-body">Delete this chat?</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleConfirmDelete}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              Delete
            </button>
            <button
              onClick={handleCancelDelete}
              className="px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCard;