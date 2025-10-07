import React from 'react';
import { cn } from '../lib/utils';

function formatMessageTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ChatBubble = ({
  message,
  timestamp,
  isCurrentUser,
  status = 'sent',
  className,
}) => (
  <div className={cn(
    "flex mb-4",
    isCurrentUser ? "justify-end" : "justify-start",
    className
  )}>
    <div
      className={cn(
        "relative px-4 py-3 rounded-2xl shadow-sm",
        isCurrentUser
          ? "bg-gradient-to-br from-[#6b493d] to-[#5a3d32] text-[#ffd8b8] rounded-br-sm shadow-md"
          : "bg-white text-[#2c1810] rounded-bl-sm border border-[#e5d9c8]",
        "max-w-[85%] break-words whitespace-pre-line",
        "text-base transition-all duration-200",
        isCurrentUser ? "hover:shadow-lg" : "hover:shadow-md"
      )}
      style={{
        wordBreak: "break-word",
        overflowWrap: "break-word",
      }}
    >
      <p className="font-body leading-relaxed">{message}</p>
      
      <div className={cn(
        "flex items-center mt-2 text-xs",
        isCurrentUser 
          ? "text-[#ffd8b8]/90 justify-end" 
          : "text-[#2c1810]/70 justify-start"
      )}>
        <span className="font-medium">{formatMessageTime(timestamp)}</span>
      </div>
    </div>
  </div>
);

export default ChatBubble;