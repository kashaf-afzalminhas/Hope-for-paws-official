import { io } from 'socket.io-client';
import { AUTH_BASE_URL } from '../config';

let socket = null;
let socketToken = null;
let socketUserId = null;
let notificationCallback = null;

const getStoredToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

// Initialize (or reuse) the single shared socket connection.
// The same socket object is kept across network drops: Socket.IO reconnects it automatically,
// so listeners registered by components stay attached.
export const initSocket = (userId) => {
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
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true, // retries forever with backoff
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
    withCredentials: true,
    auth: { token }
  });

  socket.on('connect', () => {
    // The server also joins the personal room automatically; this keeps older servers working
    if (socketUserId) socket.emit('join', socketUserId);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error?.message || error);
    // Fall back to polling if websocket is blocked
    if (socket?.io?.opts?.transports?.[0] === 'websocket') {
      socket.io.opts.transports = ['polling', 'websocket'];
    }
  });

  socket.on('disconnect', (reason) => {
    // When the server closes the connection, Socket.IO does not retry by itself
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

export const getSocket = () => socket;

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

// Set notification callback for handling notifications (pass null to clear)
export const setNotificationCallback = (callback) => {
  notificationCallback = callback;
};

// Deprecated: messages are sent through the REST API (POST /api/messages).
// The server has no 'sendMessage' socket handler, so these do nothing useful.
export const sendSocketMessage = () => {
  console.warn('sendSocketMessage is deprecated; use sendMessage from Main/api instead');
};

export const sendSocketMessageLegacy = () => {
  console.warn('sendSocketMessageLegacy is deprecated; use sendMessage from Main/api instead');
};

export const isSocketConnected = () => !!(socket && socket.connected);

export const getSocketStatus = () => {
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
  getSocketStatus
};
