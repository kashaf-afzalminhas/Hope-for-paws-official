import { io } from 'socket.io-client';
import { AUTH_BASE_URL } from '../config';

let socket = null;
let notificationCallback = null;
let connectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 2; // Reduced from 3 to 2
let isConnecting = false;
let connectionTimeout = null;
let reconnectTimeout = null;

// Initialize socket connection
export const initSocket = (userId) => {
  // Prevent multiple socket initializations
  if (socket && socket.connected) {
    console.log('✅ Socket already connected, reusing existing connection');
    return socket;
  }
  
  if (isConnecting) {
    console.log('⏳ Socket connection already in progress, waiting...');
    return socket;
  }

  // Clean up any existing socket
  if (socket) {
    console.log('🧹 Cleaning up existing socket connection');
    socket.disconnect();
    socket = null;
  }

  // Clear any existing timeouts
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }
  
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  console.log('🚀 Initializing socket connection for user:', userId);
  isConnecting = true;
  
  // Get the base URL from the same config as the API
  const baseURL = AUTH_BASE_URL.replace('/auth', '');
  console.log('🌐 Socket connecting to:', baseURL);
  
  // Get the authentication token
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  console.log('🔑 Socket token found:', !!token);
  
  if (!token) {
    console.error('❌ No authentication token found for socket connection');
    isConnecting = false;
    throw new Error('Authentication token required for socket connection');
  }
  
  // Create socket with authentication token
  socket = io(baseURL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
    reconnectionDelay: 2000, // Increased from 1000 to 2000
    reconnectionDelayMax: 10000, // Increased from 5000 to 10000
    timeout: 15000, // Reduced from 20000 to 15000
    withCredentials: true,
    forceNew: false, // Prevent multiple connections
    auth: {
      token: token
    }
  });

  // Set connection timeout
  connectionTimeout = setTimeout(() => {
    if (socket && !socket.connected) {
      console.error('⏰ Socket connection timeout');
      isConnecting = false;
      socket.disconnect();
      socket = null;
    }
  }, 15000);

  // Connection event handlers
  socket.on('connect', () => {
    console.log('✅ Socket connected successfully');
    isConnecting = false;
    connectionAttempts = 0;
    
    // Clear connection timeout
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
    
    if (userId) {
      socket.emit('join', userId);
      console.log('📤 Emitted join event for user:', userId);
    }
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error);
    isConnecting = false;
    
    // Clear connection timeout
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
    
    // Try to reconnect with polling if websocket fails
    if (socket.io.opts.transports[0] === 'websocket') {
      console.log('🔄 Falling back to polling transport');
      socket.io.opts.transports = ['polling', 'websocket'];
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('🔴 Socket disconnected:', reason);
    isConnecting = false;
    
    // Clear connection timeout
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
    
    if (reason === 'io server disconnect') {
      // Server initiated disconnect, don't auto-reconnect
      console.log('🔄 Server disconnected, not attempting to reconnect');
      socket = null;
    }
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
    isConnecting = false;
    
    // Clear connection timeout
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
  });

  // Add notification event handler
  socket.on('notification', (notification) => {
    console.log('📢 Received notification:', notification);
    if (notificationCallback) {
      notificationCallback(notification);
    }
  });

  // Enhanced message notification handlers
  socket.on('newMessage', (message) => {
    console.log('💬 Received new message via socket:', message);
    // This will be handled by MessageContext component
  });

  socket.on('messageSent', (data) => {
    console.log('✅ Message sent confirmation:', data);
  });

  // Add reconnection event handlers with limits
  socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
    isConnecting = false;
    connectionAttempts = 0;
    
    if (userId) {
      socket.emit('join', userId);
    }
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('🔄 Socket reconnection attempt:', attemptNumber);
    connectionAttempts = attemptNumber;
    
    if (attemptNumber >= MAX_RECONNECTION_ATTEMPTS) {
      console.error('❌ Max reconnection attempts reached, stopping reconnection');
      socket.disconnect();
      socket = null;
      isConnecting = false;
    }
  });

  socket.on('reconnect_error', (error) => {
    console.error('❌ Socket reconnection error:', error);
    isConnecting = false;
  });

  socket.on('reconnect_failed', () => {
    console.error('❌ Socket reconnection failed');
    isConnecting = false;
    socket = null;
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    console.warn('⚠️ Socket not initialized. Call initSocket first.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('🔌 Disconnecting socket...');
    socket.disconnect();
    socket = null;
    isConnecting = false;
    connectionAttempts = 0;
    
    // Clear timeouts
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  }
};

export const reinitializeSocket = (userId) => {
  console.log('🔄 Reinitializing socket for user:', userId);
  disconnectSocket();
  
  // Add delay to prevent rapid reconnections
  reconnectTimeout = setTimeout(() => {
    return initSocket(userId);
  }, 1000);
};

// Set notification callback for handling notifications
export const setNotificationCallback = (callback) => {
  notificationCallback = callback;
};

// Updated to match how it's called in ChatWindow
export const sendSocketMessage = (message) => {
  const currentSocket = getSocket();
  if (!currentSocket) {
    console.warn('⚠️ Socket not available - no authentication token');
    return;
  }
  
  if (!currentSocket.connected) {
    console.warn('⚠️ Socket not connected. Attempting to reconnect...');
    currentSocket.connect();
  }
  
  // Emit the message with the conversation ID for proper routing
  currentSocket.emit('sendMessage', {
    conversationId: message.conversationId,
    senderId: message.senderId,
    text: message.text,
    timestamp: message.createdAt
  });
};

// Legacy function for backward compatibility
export const sendSocketMessageLegacy = (senderId, receiverId, text, conversationId) => {
  const currentSocket = getSocket();
  if (!currentSocket) {
    console.warn('⚠️ Socket not available');
    return;
  }
  
  currentSocket.emit('sendMessage', {
    senderId,
    receiverId,
    text,
    conversationId
  });
};

// Add a function to check socket connection status
export const isSocketConnected = () => {
  return socket && socket.connected;
};

// Add function to get connection status
export const getSocketStatus = () => {
  if (!socket) return 'disconnected';
  if (socket.connected) return 'connected';
  if (isConnecting) return 'connecting';
  return 'disconnected';
};

export default {
  initSocket,
  getSocket,
  disconnectSocket,
  reinitializeSocket,
  sendSocketMessage,
  sendSocketMessageLegacy,
  isSocketConnected,
  setNotificationCallback,
  getSocketStatus
};