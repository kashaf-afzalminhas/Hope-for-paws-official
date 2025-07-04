import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Send } from 'lucide-react';

const MessageInput = ({
  onSendMessage,
  placeholder = 'Type a message...',
  disabled = false,
  className,
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={cn(
        "flex items-center gap-2 bg-white border border-[#a07855]/30 rounded-full p-1 pl-4",
        "focus-within:ring-2 focus-within:ring-[#a07855]/20 focus-within:border-[#a07855]",
        "transition-all duration-200",
        disabled && "opacity-60",
        className
      )}
    >
      <input
        type="text"
        className={cn(
          "flex-1 bg-transparent border-none outline-none",
          "font-body text-[#2c1810] placeholder-[#2c1810]/50",
          "text-sm md:text-base",
          "w-full min-w-0" // ensures proper flex behavior
        )}
        placeholder={placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled}
      />

      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className={cn(
          "p-2 rounded-full transition-colors duration-200",
          "flex items-center justify-center",
          "h-10 w-10", // fixed size for better touch targets
          message.trim() && !disabled
            ? "bg-[#a07855] text-[#ffd8b8] hover:bg-[#a07855]/90"
            : "bg-[#a07855]/20 text-[#2c1810]/40 cursor-not-allowed"
        )}
        aria-label="Send message"
      >
        <Send 
          size={18} 
          className={message.trim() && !disabled ? "text-[#ffd8b8]" : "text-[#2c1810]/40"} 
        />
      </button>
    </form>
  );
};

export default MessageInput;