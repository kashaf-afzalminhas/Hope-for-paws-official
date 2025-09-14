import React, { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { AUTH_BASE_URL } from '../config';
import { markMessageAsRead } from '../Main/api';

const MessageList = ({ messages, currentUser, chatUsers }) => {
  const scrollRef = useRef();
  const messagesEndRef = useRef();

  // Mark messages as read when viewed
  useEffect(() => {
    const markMessagesAsRead = async () => {
      for (const msg of messages) {
        if (!msg.readBy?.includes(currentUser._id)) {
          try {
            await markMessageAsRead(msg._id);
          } catch (error) {
            console.error('Error marking message as read:', error);
          }
        }
      }
    };

    if (messages.length > 0) {
      markMessagesAsRead();
    }
  }, [messages, currentUser._id]);

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
    <div className="flex flex-col space-y-4 p-4 overflow-y-auto h-full bg-gradient-to-b from-[#f8f4ea] to-[#f5efe6]">
      {messages.map((msg, index) => {
        const isCurrentUser = String(msg.senderId) === String(currentUser._id);
        const showSenderName = !isCurrentUser && 
          (index === 0 || messages[index-1].senderId !== msg.senderId);

        return (
          <div
            key={`${msg._id}-${index}`}
            className={cn(
              "flex flex-col max-w-[85%]",
              isCurrentUser ? "ml-auto items-end" : "mr-auto items-start"
            )}
            ref={index === messages.length - 1 ? messagesEndRef : null}
          >
            {showSenderName && (
              <div className="flex items-center gap-2 mb-2">
                <Link 
                  to={`/profile/public/${msg.senderId}`}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
                >
                  {getSenderProfileImage(msg.senderId) ? (
                    <img 
                      src={getSenderProfileImage(msg.senderId)} 
                      alt={getSenderName(msg.senderId)}
                      className="w-6 h-6 rounded-full object-cover border border-[#e5d9c8] group-hover:border-[#a07855]/40 transition-colors"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br from-[#a07855] to-[#6b493d] flex items-center justify-center text-[#ffd8b8] text-xs font-bold border border-[#e5d9c8] group-hover:border-[#a07855]/40 transition-colors ${getSenderProfileImage(msg.senderId) ? 'hidden' : ''}`}>
                    {getSenderName(msg.senderId).charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-[#2c1810]/80 font-heading">
                    {getSenderName(msg.senderId)}
                  </span>
                </Link>
              </div>
            )}
            
            <div className={cn(
              "rounded-2xl px-4 py-3 shadow-sm",
              "whitespace-pre-wrap break-words",
              "transition-all duration-200",
              isCurrentUser 
                ? "bg-gradient-to-br from-[#6b493d] to-[#5a3d32] text-[#ffd8b8] rounded-br-sm shadow-md hover:shadow-lg" 
                : "bg-white text-[#2c1810] rounded-bl-sm border border-[#e5d9c8] hover:shadow-md",
            )}>
              <p className="font-body leading-relaxed">{msg.text || msg.content}</p>
            </div>

            <div className={cn(
              "flex items-center mt-2 text-xs font-medium",
              isCurrentUser ? "text-[#ffd8b8]/90" : "text-[#2c1810]/70",
              "font-body"
            )}>
              {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
              {isCurrentUser && (
                <span className="ml-2">
                  {msg.readBy?.length > 1 ? (
                    <span className="text-[#ffd8b8] font-bold">✓✓</span>
                  ) : (
                    <span className="text-[#ffd8b8]/70">✓</span>
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