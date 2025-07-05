import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    // Create socket connection - use local server in development
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
      (import.meta.env.DEV ? 'http://localhost:3000' : API_BASE_URL.replace('/api', ''));
    
    console.log('🔗 Connecting to Socket.IO at:', socketUrl);
    
    const newSocket = io(socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      console.log('🔗 Socket ID:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      console.log('🔄 Trying polling fallback...');
      setIsConnected(false);
      
      // Try polling as fallback
      if (newSocket.io.opts.transports.includes('websocket')) {
        newSocket.io.opts.transports = ['polling'];
        newSocket.connect();
      }
    });

    // Handle incoming notifications
    newSocket.on('notification', (notification) => {
      console.log('🔔 New notification received:', notification);
      console.log('📱 Notification title:', notification.title);
      console.log('📱 Notification message:', notification.message);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permission is granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/hfplogo.png',
          badge: '/hfplogo.png'
        });
        console.log('📱 Browser notification shown');
      } else {
        console.log('⚠️  Browser notification permission not granted');
      }
    });

    // Handle notification updates
    newSocket.on('notificationUpdated', ({ notificationId, isRead }) => {
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead }
            : notif
        )
      );
      if (isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    });

    // Handle all notifications marked as read
    newSocket.on('allNotificationsRead', () => {
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    });

    // Handle notification deletion
    newSocket.on('notificationDeleted', ({ notificationId }) => {
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
    });

    // Handle socket errors
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const markNotificationRead = (notificationId) => {
    if (socket) {
      socket.emit('markNotificationRead', notificationId);
    }
  };

  const markAllNotificationsRead = () => {
    if (socket) {
      socket.emit('markAllNotificationsRead');
    }
  };

  const deleteNotification = (notificationId) => {
    if (socket) {
      socket.emit('deleteNotification', notificationId);
    }
  };

  const value = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 