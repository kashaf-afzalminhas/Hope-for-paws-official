import React, { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { AUTH_BASE_URL } from '../config';

const MessageList = ({ messages, currentUser, chatUsers }) => {
  const scrollRef = useRef();
  const messagesEndRef = useRef();

  // Emit read receipts
  useEffect(() => {
    const socket = getSocket();
    messages.forEach((msg) => {
      if (!msg.readBy?.includes(currentUser._id)) {
        socket.emit('markMessageAsRead', { messageId: msg._id, userId: currentUser._id });
      }
    });
  }, [messages, currentUser]);

  // Auto-scroll with intersection observer for better performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ 
              behavior: 'smooth',
              block: 'nearest'
            });
          }, 50);
        }
      },
      { threshold: 0.1 }
    );

    if (messagesEndRef.current) {
      observer.observe(messagesEndRef.current);
    }

    return () => {
      if (messagesEndRef.current) {
        observer.unobserve(messagesEndRef.current);
      }
    };
  }, [messages]);

  const getSenderName = (senderId) => {
    const user = chatUsers.find(user => user._id === senderId);
    return user?.username || 'Unknown';
  };

  const getSenderProfileImage = (senderId) => {
    const user = chatUsers.find(user => user._id === senderId);
    return user?.profileImage ? `${AUTH_BASE_URL.replace('/auth', '')}${user.profileImage}` : null;
  };

  return (
    <div className="flex flex-col space-y-3 p-4 overflow-y-auto h-full bg-[#fff7f0]">
      {messages.map((msg, index) => {
        const isCurrentUser = String(msg.senderId) === String(currentUser._id);
        const showSenderName = !isCurrentUser && 
          (index === 0 || messages[index-1].senderId !== msg.senderId);

        return (
          <div
            key={`${msg._id}-${index}`}
            className={cn(
              "flex flex-col max-w-[80%]",
              isCurrentUser ? "ml-auto items-end" : "mr-auto items-start"
            )}
            ref={index === messages.length - 1 ? messagesEndRef : null}
          >
            {showSenderName && (
              <div className="flex items-center gap-2 mb-1">
                <Link 
                  to={`/profile/public/${msg.senderId}`}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  {getSenderProfileImage(msg.senderId) ? (
                    <img 
                      src={getSenderProfileImage(msg.senderId)} 
                      alt={getSenderName(msg.senderId)}
                      className="w-6 h-6 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-6 h-6 rounded-full bg-[#6b493d] flex items-center justify-center text-[#ffd8b8] text-xs font-bold ${getSenderProfileImage(msg.senderId) ? 'hidden' : ''}`}>
                    {getSenderName(msg.senderId).charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-[#2c1810]/80 font-heading">
                    {getSenderName(msg.senderId)}
                  </span>
                </Link>
              </div>
            )}
            
            <div className={cn(
              "rounded-2xl px-4 py-2",
              "whitespace-pre-wrap break-words",
              "shadow-sm",
              isCurrentUser 
                ? "bg-[#a07855] text-[#ffd8b8] rounded-br-none" 
                : "bg-white text-[#2c1810] rounded-bl-none border border-[#a07855]/20",
              "transition-colors duration-200"
            )}>
              <p className="font-body">{msg.text || msg.content}</p>
            </div>

            <div className={cn(
              "flex items-center mt-1 text-xs",
              isCurrentUser ? "text-[#2c1810]/60" : "text-[#2c1810]/60",
              "font-body"
            )}>
              {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
              {isCurrentUser && (
                <span className="ml-1">
                  {msg.readBy?.length > 1 ? (
                    <span className="text-[#a07855]">✓✓</span>
                  ) : (
                    <span className="text-[#2c1810]/40">✓</span>
                  )}
                </span>
              )}
            </div>
          </div>
        );
      })}
      <div ref={scrollRef} />
    </div>
  );
};

export default MessageList;