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
    "flex mb-1 animate-[fadeInUp_0.25s_ease-out]",
    isCurrentUser ? "justify-end" : "justify-start",
    className
  )}>
    <div
      className={cn(
        "relative px-4 py-2.5 rounded-[20px] shadow-sm max-w-[78%] sm:max-w-[65%]",
        "break-words whitespace-pre-line text-[15px] leading-relaxed",
        "transition-shadow duration-200",
        isCurrentUser
          ? "bg-gradient-to-br from-[#7a5641] to-[#5a3d32] text-[#ffe4c4] rounded-br-md shadow-[0_2px_10px_rgba(90,61,50,0.25)] hover:shadow-[0_4px_16px_rgba(90,61,50,0.32)]"
          : "bg-white text-[#2c1810] rounded-bl-md ring-1 ring-[#e5d9c8] hover:shadow-md"
      )}
    >
      <p className="font-body">{message}</p>

      <div className={cn(
        "flex items-center mt-1 text-[10.5px] gap-1",
        isCurrentUser ? "text-[#ffe4c4]/75 justify-end" : "text-[#2c1810]/45 justify-start"
      )}>
        <span className="font-medium">{formatMessageTime(timestamp)}</span>
      </div>
    </div>
  </div>
);

export default ChatBubble;