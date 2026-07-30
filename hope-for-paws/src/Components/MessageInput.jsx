import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { Send } from 'lucide-react';

const MessageInput = ({ onSendMessage, placeholder = 'Type a message...', disabled = false, className }) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSend = !disabled && message.trim();

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex items-end gap-2 bg-[#f5efe6] rounded-full px-5 py-2.5 transition-all duration-200",
        isFocused ? "ring-2 ring-[#a07855]/30" : "ring-1 ring-[#e5d9c8]",
        disabled && "opacity-60",
        className
      )}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        className="flex-1 bg-transparent border-none outline-none resize-none py-2 font-body text-[#2c1810] placeholder:text-[#2c1810]/40 text-[15px] w-full min-w-0 max-h-32 overflow-y-auto leading-relaxed"
        placeholder={placeholder}
        value={message}
        onChange={e => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        aria-label="Type a message"
      />
      <button
        type="submit"
        disabled={!canSend}
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-200 shrink-0 h-10 w-10 mb-0.5",
          canSend ? "bg-[#a07855] shadow-md hover:shadow-lg hover:scale-105 active:scale-95" : "bg-[#a07855]/20 cursor-not-allowed"
        )}
        aria-label="Send message"
      >
        <Send size={17} className={canSend ? "text-white" : "text-[#2c1810]/30"} />
      </button>
    </form>
  );
};

export default MessageInput;