import { io } from 'socket.io-client';
import { AUTH_BASE_URL } from '../config';

let socket = null;

// Initialize socket connection
export const initSocket = (userId) => {
  if (socket) {
    console.warn('Socket already initialized');
    return socket;
  }

  console.log('Initializing socket connection for user:', userId);
  
  // Get the base URL from the same config as the API
  const baseURL = AUTH_BASE_URL.replace('/auth', '');
  console.log('Socket connecting to:', baseURL);
  
  // Create socket with more robust configuration
  socket = io(baseURL, {
    transports: ['websocket', 'polling'], // Allow both websocket and polling
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5, // Limit reconnection attempts
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    withCredentials: true, // Important for CORS
    forceNew: true // Force new connection
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('Socket connected successfully');
    if (userId) {
      socket.emit('join', userId);
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    // Try to reconnect with polling if websocket fails
    if (socket.io.opts.transports[0] === 'websocket') {
      console.log('Falling back to polling transport');
      socket.io.opts.transports = ['polling', 'websocket'];
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
      // Server initiated disconnect, try to reconnect
      socket.connect();
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Add notification event handler
  socket.on('notification', (notification) => {
    console.log('Received notification:', notification);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    console.warn('Socket not initialized. Initializing with default configuration...');
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    console.log('Socket disconnected');
    socket = null;
  }
};

// Updated to match how it's called in ChatWindow
export const sendSocketMessage = (message) => {
  const currentSocket = getSocket();
  if (!currentSocket.connected) {
    console.warn('Socket not connected. Attempting to reconnect...');
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
  if (!currentSocket.connected) {
    console.warn('Socket not connected. Attempting to reconnect...');
    currentSocket.connect();
  }
  
  currentSocket.emit('sendMessage', {
    senderId,
    receiverId,
    text,
    conversationId,
  });
};

// Add a function to check socket connection status
export const isSocketConnected = () => {
  return socket && socket.connected;
};

export default {
  initSocket,
  getSocket,
  disconnectSocket,
  sendSocketMessage,
  sendSocketMessageLegacy,
  isSocketConnected
};
