import React, { useEffect, useState, useRef } from 'react';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';
import { getMessagesByConversation, sendMessage, getUserById, markConversationAsRead, deleteConversation } from '../Main/api';
import { useMessages } from '../context/MessageContext';
import { getSocket } from '../services/socket';
import { Link } from 'react-router-dom';
import { getProfileImageUrl, getInitials } from '../lib/utils';
import { FaPaw } from 'react-icons/fa';

const ChatWindow = ({ conversationId, currentUser, otherUser, onBack, updateConversationLastMessage, addToast, setCurrentConversationId }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [userDetails, setUserDetails] = useState(otherUser);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const avatarUrl = getProfileImageUrl(userDetails?.profileImage || otherUser?.profileImage);

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { removeConversation } = useMessages();
  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const handleDeleteChat = async () => {
    try {
      setIsDeleting(true);
      await deleteConversation(conversationId);
      if (removeConversation) {
        removeConversation(conversationId);
      }

      // Triggers immediate sync across MessageContext and background tabs
      window.dispatchEvent(new CustomEvent('refreshConversations'));

      if (addToast) {
        addToast({
          title: 'Success',
          description: 'Chat deleted successfully'
        });
      }
      setShowDeleteModal(false);
      if (onBack) {
        onBack();
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
      if (addToast) {
        addToast({
          title: 'Error',
          description: 'Failed to delete chat',
          variant: 'destructive'
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Loads the conversation history and merges it with anything already on screen
  // (messages that arrived live while loading, or optimistic messages still being sent)
  const fetchMessages = async ({ showSpinner = true } = {}) => {
    if (!conversationId) return;
    try {
      if (showSpinner) setIsLoading(true);
      const response = await getMessagesByConversation(conversationId);
      if (showSpinner) setHasOlder(Boolean(response.hasMore));
      const fetched = (response.data || []).map((msg, idx) => ({
        _id: String(msg._id || msg.id || `local-${idx}`),
        text: msg.text || msg.content || '',
        senderId: String(msg.senderId || msg.sender?.id || ''),
        createdAt: msg.createdAt || new Date().toISOString()
      })).filter(msg => msg.text);

      setMessages(prev => {
        const fetchedIds = new Set(fetched.map(m => m._id));
        const extras = prev.filter(m => !fetchedIds.has(m._id) && !String(m._id).startsWith('local-'));
        // Drop pending copies whose real message is now in the fetched list
        const stillPending = extras.filter(m => !(m.pending && fetched.some(f => f.senderId === m.senderId && f.text === m.text && new Date(f.createdAt) >= new Date(m.createdAt) - 60000)));
        return [...fetched, ...stillPending].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });
    } catch (error) {
      if (showSpinner) setMessages([]);
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // When the tab becomes visible again, mark messages that arrived in the background as read
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && conversationId) {
        markConversationAsRead(conversationId)
          .then(() => window.dispatchEvent(new CustomEvent('refreshConversations')))
          .catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [conversationId]);

  useEffect(() => {
    if (conversationId && setCurrentConversationId) {
      setCurrentConversationId(conversationId);
      markConversationAsRead(conversationId)
        .then(() => window.dispatchEvent(new CustomEvent('refreshConversations')))
        .catch(() => {});
    }
  }, [conversationId, setCurrentConversationId]);

  // Scroll to the newest message, except right after loading older messages at the top
  const skipNextScrollRef = useRef(false);
  useEffect(() => {
    if (skipNextScrollRef.current) {
      skipNextScrollRef.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Older messages are loaded on request (the chat opens with the latest 200)
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const loadOlderMessages = async () => {
    const oldest = messages.find(m => !m.pending);
    if (!oldest || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const response = await getMessagesByConversation(conversationId, { before: oldest.createdAt });
      const older = (response.data || []).map((msg, idx) => ({
        _id: String(msg._id || msg.id || `older-${idx}-${oldest._id}`),
        text: msg.text || msg.content || '',
        senderId: String(msg.senderId || msg.sender?.id || ''),
        createdAt: msg.createdAt || oldest.createdAt
      })).filter(msg => msg.text);
      setHasOlder(Boolean(response.hasMore));
      skipNextScrollRef.current = true;
      setMessages(prev => {
        const ids = new Set(prev.map(m => m._id));
        return [...older.filter(m => !ids.has(m._id)), ...prev];
      });
    } finally {
      setLoadingOlder(false);
    }
  };

  // Messages read while this chat is open are marked read on the server too (debounced)
  const markReadTimerRef = useRef(null);
  const scheduleMarkAsRead = () => {
    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    markReadTimerRef.current = setTimeout(() => {
      markConversationAsRead(conversationId)
        .then(() => window.dispatchEvent(new CustomEvent('refreshConversations')))
        .catch(() => {});
    }, 400);
  };
  useEffect(() => () => {
    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    const joinRoom = () => socket.emit('joinConversation', conversationId);
    joinRoom();

    // After a reconnect: rejoin the room and load anything sent while we were offline
    let hasConnectedBefore = socket.connected;
    const handleConnect = () => {
      joinRoom();
      if (hasConnectedBefore) {
        fetchMessages({ showSpinner: false });
        if (document.visibilityState === 'visible') scheduleMarkAsRead();
      }
      hasConnectedBefore = true;
    };

    const myId = String(currentUser?.id || currentUser?._id || '');

    const handleNewMessage = (raw) => {
      if (String(raw.conversationId) !== String(conversationId)) return;
      const message = {
        _id: String(raw._id),
        conversationId: String(raw.conversationId),
        senderId: String(raw.senderId),
        text: raw.text,
        createdAt: raw.createdAt || new Date().toISOString()
      };

      setMessages(prev => {
        // Already shown (e.g. the REST response for our own message arrived first)
        if (prev.some(m => m._id === message._id)) return prev;

        // Our own message echoed back: replace the first matching pending (optimistic) copy only
        const pendingIdx = prev.findIndex(
          m => m.pending && m.senderId === message.senderId && m.text === message.text
        );
        if (pendingIdx !== -1) {
          const next = [...prev];
          next[pendingIdx] = message;
          return next;
        }
        return [...prev, message];
      });

      if (message.senderId !== myId && document.visibilityState === 'visible') {
        scheduleMarkAsRead();
      }
    };

    // Typing indicator from the other participant
    let typingTimer = null;
    const handleTyping = (data) => {
      if (String(data?.conversationId) !== String(conversationId)) return;
      if (String(data?.userId) === myId) return;
      setIsTyping(!!data.isTyping);
      if (typingTimer) clearTimeout(typingTimer);
      if (data.isTyping) typingTimer = setTimeout(() => setIsTyping(false), 5000);
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('userTyping', handleTyping);
    // Re-join the room after a reconnect
    socket.on('connect', handleConnect);
    return () => {
      socket.emit('leaveConversation', conversationId);
      socket.off('newMessage', handleNewMessage);
      socket.off('userTyping', handleTyping);
      socket.off('connect', handleConnect);
      if (typingTimer) clearTimeout(typingTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    if (!otherUser.username) {
      getUserById(otherUser._id)
        .then(res => setUserDetails(res.data?.data || res.data || otherUser))
        .catch(() => setUserDetails(otherUser));
    } else {
      setUserDetails(otherUser);
    }
  }, [otherUser]);

  // Tell the other participant we're typing (throttled), and stop after 2s idle
  const typingStateRef = useRef({ active: false, stopTimer: null });
  const emitTyping = (isTypingNow) => {
    const socket = getSocket();
    if (!socket || !conversationId) return;
    socket.emit('userTyping', { conversationId, isTyping: isTypingNow });
  };
  const stopTyping = () => {
    const state = typingStateRef.current;
    if (state.stopTimer) clearTimeout(state.stopTimer);
    state.stopTimer = null;
    if (state.active) {
      state.active = false;
      emitTyping(false);
    }
  };
  const handleInputChange = (value) => {
    setInputText(value);
    const state = typingStateRef.current;
    if (!value.trim()) {
      stopTyping();
      return;
    }
    if (!state.active) {
      state.active = true;
      emitTyping(true);
    }
    if (state.stopTimer) clearTimeout(state.stopTimer);
    state.stopTimer = setTimeout(stopTyping, 2000);
  };
  useEffect(() => () => {
    const state = typingStateRef.current;
    if (state.stopTimer) clearTimeout(state.stopTimer);
    if (state.active) emitTyping(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !conversationId) return;
    stopTyping();

    const text = inputText.trim();
    setInputText('');

    // Safely extract the sender's user ID from props or storage
    const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    const senderId = currentUser?._id || currentUser?.id || storedUser?._id || storedUser?.id;

    if (!senderId) {
      console.error('No valid sender ID found to send message');
      if (addToast) {
        addToast({
          title: 'Error',
          description: 'Authentication session expired. Please re-login.',
          variant: 'destructive'
        });
      }
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tempMessage = {
      _id: tempId,
      conversationId,
      senderId: String(senderId),
      text,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await sendMessage({ conversationId, senderId, text });
      const saved = response?.data?.data || response?.data;
      if (saved && saved._id) {
        const savedMsg = {
          _id: String(saved._id),
          conversationId: String(saved.conversationId || conversationId),
          senderId: String(saved.senderId || senderId),
          text: saved.text || text,
          createdAt: saved.createdAt || tempMessage.createdAt
        };
        setMessages(prev => {
          const alreadyAddedBySocket = prev.some(m => m._id === savedMsg._id);
          if (alreadyAddedBySocket) {
            return prev.filter(m => m._id !== tempId);
          }
          return prev.map(msg => msg._id === tempId ? savedMsg : msg);
        });
      }
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      if (addToast) addToast({ title: 'Error', description: error?.response?.data?.message || 'Failed to send message', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAECD8] min-h-0 relative">
      {/* Top Header */}
      <div className="flex-shrink-0 bg-[#301B12] px-5 py-3.5 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-3">
          {isMobile && onBack && (
            <button onClick={onBack} className="text-white/80 hover:text-white p-1 rounded-md" aria-label="Back">
              ←
            </button>
          )}

          <Link to={`/profile/public/${otherUser._id}`} className="relative shrink-0 flex items-center">
            {avatarUrl && !avatarFailed ? (
              <img
                src={avatarUrl}
                alt={userDetails?.username || 'User'}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-[#BA8B60]"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#FDF6EE] border border-[#BA8B60] flex items-center justify-center text-sm font-bold text-[#301B12]">
                {getInitials(userDetails?.username || otherUser?.username)}
              </div>
            )}
          </Link>

          <div className="flex flex-col justify-center">
            <Link to={`/profile/public/${otherUser._id}`} className="text-white font-semibold text-base leading-tight hover:text-[#E2BD9E] transition-colors">
              {userDetails?.username || 'User'}
            </Link>
            <span className="text-xs text-[#D8BCA4] flex items-center gap-1.5 mt-0.5 font-normal">
              <span className={`w-2 h-2 rounded-full ${userDetails?.status === 'online' ? 'bg-[#9CD373]' : 'bg-[#A88876]'}`} />
              {userDetails?.status === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="p-2 text-white/70 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors active:scale-95 ml-auto"
          title="Delete Chat"
          aria-label="Delete Chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 min-h-0 smooth-scroll">
        {isLoading ? (
          <div className="flex justify-center items-center h-full text-[#4A2E1B]/70 text-sm">
            Loading messages...
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-1">
            {hasOlder && (
              <div className="flex justify-center mb-3">
                <button
                  type="button"
                  onClick={loadOlderMessages}
                  disabled={loadingOlder}
                  className="text-xs font-medium text-[#6b493d] bg-[#FFF9F2] border border-[#E3CBB3] rounded-full px-4 py-1.5 hover:bg-white disabled:opacity-60 cursor-pointer"
                >
                  {loadingOlder ? 'Loading…' : 'Load earlier messages'}
                </button>
              </div>
            )}
            {messages.map((message) => {
              if (!message.text || !message._id) return null;
              const isMe = String(message.senderId) === String(currentUser?.id || currentUser?._id);

              return (
                <ChatBubble
                  key={message._id}
                  message={message.text}
                  timestamp={message.createdAt}
                  isCurrentUser={isMe}
                  senderName={isMe ? (currentUser?.username || 'You') : (userDetails?.username || 'User')}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-[#5C3C26]">
            <p className="font-semibold text-base">No messages yet</p>
            <p className="text-xs opacity-75 mt-1">Say hi to start the conversation!</p>
          </div>
        )}
        {isTyping && (
          <div className="mt-1 mb-2">
            <TypingIndicator username={userDetails?.username || otherUser?.username} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Bar */}
      <div className="p-3.5 sm:p-4 bg-transparent">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Type your message or set quick-emojis here."
            className="flex-1 bg-[#FFF9F2] text-[#2C1810] placeholder-[#8E7060]/70 px-5 py-3 rounded-full border border-[#E3CBB3] focus:outline-hidden focus:ring-2 focus:ring-[#BA8B60] text-sm shadow-xs"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="flex items-center gap-2 bg-[#BA8B60] hover:bg-[#A8794E] disabled:opacity-50 text-white font-medium px-5 py-3 rounded-full transition shadow-sm select-none cursor-pointer"
          >
            <span>Send</span>
            <FaPaw className="text-sm" />
          </button>
        </form>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-heading font-bold text-[#2c1810] mb-2">Delete Conversation?</h3>
            <p className="font-body text-sm text-gray-600 mb-6">
              This chat will be removed from your inbox. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteChat}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;