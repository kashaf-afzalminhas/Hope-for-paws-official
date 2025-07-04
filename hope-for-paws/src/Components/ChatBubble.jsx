import React from 'react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

const ChatBubble = ({
  message,
  timestamp,
  isCurrentUser,
  status = 'sent',
  className,
}) => {
  return (
    <div className={cn(
      "flex flex-col mb-4 max-w-[85%]",
      isCurrentUser ? "items-end ml-auto" : "items-start mr-auto",
      className
    )}>
      <div className={cn(
        "rounded-2xl px-4 py-3 text-sm md:text-base",
        "whitespace-pre-wrap break-words",
        isCurrentUser 
          ? "bg-[#6b493d] text-[#ffd8b8] rounded-br-none" 
          : "bg-[#a07855]/20 text-[#2c1810] rounded-bl-none",
        "transition-colors duration-200 shadow-sm"
      )}>
        <p className="font-body">{message}</p>
      </div>

      <div className={cn(
        "flex items-center mt-1 text-xs text-[#2c1810]/70",
        isCurrentUser ? "flex-row-reverse" : ""
      )}>
        <span className="font-body mx-1">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>

        {isCurrentUser && (
          <span className="mx-1">
            {status === 'read' ? (
              <span className="text-[#6b493d]">✓✓</span>
            ) : status === 'delivered' ? (
              <span className="text-[#a07855]/50">✓✓</span>
            ) : (
              <span className="text-[#a07855]/50">✓</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;

