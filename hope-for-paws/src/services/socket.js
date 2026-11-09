import { io } from 'socket.io-client';
import { AUTH_BASE_URL, SOCKETS_ENABLED } from '../config';

let socket = null;
let socketToken = null;
let socketUserId = null;
let notificationCallback = null;

const getStoredToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

export const isSocketsEnabled = () => SOCKETS_ENABLED;

// Initialize (or reuse) the single shared socket connection.
// No-ops in production Lambda (SOCKETS_ENABLED=false) — use REST polling instead.
export const initSocket = (userId) => {
  if (!SOCKETS_ENABLED) {
    return null;
  }

  const token = getStoredToken();

  if (!token) {
    throw new Error('Authentication token required for socket connection');
  }

  // Reuse the existing socket if it belongs to the same login session
  if (socket && socketToken === token) {
    if (!socket.connected && !socket.active) {
      socket.connect();
    }
    return socket;
  }

  // A different user/session logged in: keep the same socket object (so listeners registered
  // by MessageContext/NotificationContext stay attached) and reconnect it with the new token
  if (socket) {
    socketToken = token;
    socketUserId = userId || null;
    socket.auth = { token };
    socket.disconnect();
    socket.connect();
    return socket;
  }

  const baseURL = AUTH_BASE_URL.replace(/\/auth\/?$/, '');
  socketToken = token;
  socketUserId = userId || null;

  socket = io(baseURL, {
    // Prefer polling first so environments that block WebSockets still work
    transports: ['polling', 'websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
    withCredentials: true,
    auth: { token }
  });

  socket.on('connect', () => {
    if (socketUserId) socket.emit('join', socketUserId);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error?.message || error);
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      setTimeout(() => {
        if (socket && !socket.connected) socket.connect();
      }, 3000);
    }
  });

  socket.on('notification', (notification) => {
    if (notificationCallback) {
      notificationCallback(notification);
    }
  });

  return socket;
};

export const getSocket = () => (SOCKETS_ENABLED ? socket : null);

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
  socket = null;
  socketToken = null;
  socketUserId = null;
};

export const reinitializeSocket = (userId) => {
  disconnectSocket();
  return initSocket(userId);
};

export const setNotificationCallback = (callback) => {
  notificationCallback = callback;
};

export const sendSocketMessage = () => {
  console.warn('sendSocketMessage is deprecated; use sendMessage from Main/api instead');
};

export const sendSocketMessageLegacy = () => {
  console.warn('sendSocketMessageLegacy is deprecated; use sendMessage from Main/api instead');
};

export const isSocketConnected = () => !!(socket && socket.connected);

export const getSocketStatus = () => {
  if (!SOCKETS_ENABLED) return 'disabled';
  if (!socket) return 'disconnected';
  if (socket.connected) return 'connected';
  if (socket.active) return 'connecting';
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
  getSocketStatus,
  isSocketsEnabled,
};
