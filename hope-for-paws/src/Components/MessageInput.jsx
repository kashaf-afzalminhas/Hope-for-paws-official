import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Send } from 'lucide-react';

const MessageInput = ({
  onSendMessage,
  placeholder = 'Type a message...',
  disabled = false,
  className,
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  const formRef = useRef(null);

  // Auto-resize textarea when message changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      
      // Reset textarea height after submit
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Handle Enter key for submission without Shift
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn(
        "flex items-end gap-3 bg-white border border-[#e5d9c8] rounded-2xl px-4 py-3 shadow-sm",
        "focus-within:ring-2 focus-within:ring-[#a07855]/30 focus-within:border-[#a07855]/60 focus-within:shadow-md",
        "transition-all duration-200",
        disabled && "opacity-60",
        className
      )}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        className={cn(
          "flex-1 bg-transparent border-none outline-none resize-none py-2",
          "font-body text-[#2c1810] placeholder:text-[#2c1810]/50",
          "text-base w-full min-w-0 max-h-32 overflow-y-auto",
          "leading-relaxed scrollbar-thin scrollbar-thumb-[#a07855]/20 scrollbar-track-transparent",
          "focus:outline-none focus:ring-0"
        )}
        placeholder={placeholder}
        value={message}
        onChange={e => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Type a message"
      />

      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-200",
          "h-10 w-10 mb-0.5 flex-shrink-0",
          !disabled && message.trim()
            ? "bg-[#a07855] text-[#ffd8b8] hover:bg-[#8a6a4d] hover:scale-105 shadow-sm"
            : "bg-[#a07855]/20 text-[#2c1810]/40 cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-[#a07855]/50 active:scale-95"
        )}
        aria-label="Send message"
      >
        <Send
          size={18}
          className={!disabled && message.trim() ? "text-[#ffd8b8]" : "text-[#2c1810]/40"}
        />
      </button>
    </form>
  );
};

export default MessageInput;