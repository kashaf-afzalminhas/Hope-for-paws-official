import React from 'react';
import { cn } from '../lib/utils';

function formatMessageTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ChatBubble = ({ message, timestamp, isCurrentUser, senderName, className }) => (
  <div className={cn("flex mb-3.5", isCurrentUser ? "justify-end" : "justify-start", className)}>
    <div
      className={cn(
        "relative px-4 py-2.5 rounded-2xl max-w-[85%] sm:max-w-[62%] shadow-xs",
        "break-words whitespace-pre-line text-[14.5px] leading-relaxed transition-all",
        isCurrentUser
          ? "bg-[#D9A676] text-[#2C1810] rounded-br-sm border border-[#C89565]"
          : "bg-[#8E7060] text-white rounded-bl-sm border border-[#7D5F50]"
      )}
    >
      {/* Header with Sender Name and Timestamp like screenshot */}
      <div className={cn(
        "flex items-center gap-1.5 text-[11.5px] mb-1 font-medium select-none",
        isCurrentUser ? "text-[#3D1E0C] justify-start" : "text-[#F5EBE1] justify-start"
      )}>
        <span className="font-semibold">{senderName || (isCurrentUser ? 'Sahab' : 'User')}</span>
        <span>:</span>
        <span className="opacity-80 text-[10.5px]">{formatMessageTime(timestamp)}</span>
      </div>

      <p className="font-body font-normal text-[14px] leading-snug">{message}</p>
    </div>
  </div>
);

export default ChatBubble;