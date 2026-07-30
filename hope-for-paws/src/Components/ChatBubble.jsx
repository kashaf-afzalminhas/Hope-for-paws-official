import React from 'react';
import { cn } from '../lib/utils';

function formatMessageTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ChatBubble = ({ message, timestamp, isCurrentUser, className }) => (
  <div className={cn("flex mb-1", isCurrentUser ? "justify-end" : "justify-start", className)}>
    <div
      className={cn(
        "relative px-5 py-3 rounded-full shadow-sm max-w-[78%] sm:max-w-[60%]",
        "break-words whitespace-pre-line text-[15px] leading-relaxed",
        isCurrentUser
          ? "bg-[#a07855] text-white rounded-br-md shadow-md"
          : "bg-white text-[#2c1810] rounded-bl-md ring-1 ring-[#e5d9c8]"
      )}
    >
      <p className="font-body">{message}</p>
      <div className={cn("text-[10.5px] mt-1", isCurrentUser ? "text-white/70 text-right" : "text-[#2c1810]/45 text-left")}>
        {formatMessageTime(timestamp)}
      </div>
    </div>
  </div>
);

export default ChatBubble;