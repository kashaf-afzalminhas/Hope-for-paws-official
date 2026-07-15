import { createContext, useContext, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { API_BASE_URL, SOCKET_ENABLED } from '../config';
import axios from 'axios';
import { getSocket, initSocket, getSocketStatus } from '../services/socket';

const NotificationContext = createContext();
const POLL_INTERVAL_MS = 20000;

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  
  const initializationRef = useRef(false);
  const pollingRef = useRef(null);

  // Socket.IO on localhost only; production Lambda uses REST polling
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');

    if (!token || !user || initializationRef.current) {
      return undefined;
    }
    initializationRef.current = true;

    const checkBackendHealth = async () => {
      try {
        const healthUrl = API_BASE_URL.replace('/api', '') + '/health';
        await axios.get(healthUrl, { timeout: 5000 });
        return true;
      } catch (err) {
        console.log('Backend not available:', err.message);
        setError('Backend service not available');
        return false;
      }
    };

    const startPolling = () => {
      if (pollingRef.current) return;
      pollingRef.current = setInterval(() => {
        fetchUnreadCount();
        fetchNotifications(1, 20);
      }, POLL_INTERVAL_MS);
    };

    const initializeNotificationSystem = async () => {
      const backendAvailable = await checkBackendHealth();
      if (!backendAvailable) {
        setIsInitialized(true);
        return;
      }

      if (!SOCKET_ENABLED) {
        console.log('Socket.IO disabled — using REST polling for notifications');
        setSocketConnected(false);
        setIsInitialized(true);
        startPolling();
        return;
      }

      try {
        const existing = getSocket();
        const userId = user?.id || user?._id;
        const socketInstance = existing || initSocket(userId);

        if (!socketInstance) {
          setIsInitialized(true);
          startPolling();
          return;
        }

        const handleConnect = () => {
          setSocketConnected(true);
          setIsInitialized(true);
        };

        const handleDisconnect = () => {
          setSocketConnected(false);
          startPolling();
        };

        const handleNotification = (notification) => {
          setNotifications((prev) => [{ ...notification, read: false }, ...prev]);
          setUnreadCount((prev) => prev + 1);
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/hfplogo.png',
            });
          }
        };

        socketInstance.on('connect', handleConnect);
        socketInstance.on('disconnect', handleDisconnect);
        socketInstance.on('notification', handleNotification);

        setSocketConnected(getSocketStatus() === 'connected');
        setIsInitialized(true);
        startPolling();
      } catch (err) {
        console.error('Error establishing socket; falling back to polling:', err);
        setIsInitialized(true);
        startPolling();
      }
    };

    initializeNotificationSystem();

    return () => {
      initializationRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);


  // Fetch initial notifications only once after initialization
  useEffect(() => {
    if (isInitialized) {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        fetchNotifications();
        fetchUnreadCount();
      }
    }
  }, [isInitialized]);

  const fetchNotifications = async (page = 1, limit = 20) => {
    // Skip if rate limited
    if (rateLimited) {
      console.log('Skipping fetchNotifications due to rate limiting');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        console.log('No token found for fetching notifications');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/notifications?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      if (page === 1) {
        console.log('Fetched notifications:', response.data.notifications);
        setNotifications(response.data.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.data.notifications]);
      }
      
      setError(null);
      return response.data;
    } catch (err) {
      console.error('Error fetching notifications:', err);
      
      // Handle different error types
      if (err.response?.status === 404) {
        setError('Notification service not available');
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else if (err.response?.status === 429) {
        setRateLimited(true);
        setError('Too many requests. Please wait a moment.');
        // Reset rate limiting after 2 minutes
        setTimeout(() => {
          setRateLimited(false);
          setError(null);
        }, 120000);
      } else if (err.response?.status === 401) {
        setError('Authentication required');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch notifications');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    // Skip if rate limited
    if (rateLimited) {
      console.log('Skipping fetchUnreadCount due to rate limiting');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      setUnreadCount(response.data.count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
      
      // Handle rate limiting
      if (err.response?.status === 429) {
        setRateLimited(true);
        setTimeout(() => {
          setRateLimited(false);
        }, 120000);
      }
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const response = await axios.put(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {},
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );
      
      setNotifications(prev => 
        prev.map(notification => 
          (notification._id === notificationId || notification.id === notificationId)
            ? { ...notification, read: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return response.data;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      await axios.put(
        `${API_BASE_URL}/notifications/mark-all-read`,
        {},
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );
      
      // Only mark notifications that are currently in the list as read
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      await axios.delete(
        `${API_BASE_URL}/notifications/${notificationId}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );
      
      setNotifications(prev => 
        prev.filter(notification => notification._id !== notificationId && notification.id !== notificationId)
      );
      
      // Update unread count if notification was unread
      const notification = notifications.find(n => n._id === notificationId || n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      await axios.delete(
        `${API_BASE_URL}/notifications/delete-all`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );
      
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error deleting all notifications:', err);
      throw err;
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    socketConnected,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    requestNotificationPermission,
    setNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
}; 