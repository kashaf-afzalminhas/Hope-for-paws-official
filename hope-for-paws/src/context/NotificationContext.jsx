import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';
import axios from 'axios';

const NotificationContext = createContext();

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
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usePolling, setUsePolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  
  // Use refs to prevent multiple initializations
  const initializationRef = useRef(false);
  const pollingRef = useRef(null);

  // Detect environment
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isProduction = !isLocalhost;

  // Initialize socket connection with fallback to polling
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));

    if (token && user && !initializationRef.current) {
      initializationRef.current = true;
      
      // Ensure token is just the JWT, not 'Bearer ...'
      let socketToken = token;
      if (socketToken && socketToken.startsWith('Bearer ')) {
        socketToken = socketToken.replace('Bearer ', '');
      }
      console.log('Socket.IO token being sent:', socketToken); // Debug log
      // First check if backend is available
      const checkBackendHealth = async () => {
        try {
          // Fix the health endpoint URL - remove /api from the base URL
          const healthUrl = API_BASE_URL.replace('/api', '') + '/health';
          await axios.get(healthUrl, { timeout: 5000 });
          console.log('Backend is available, starting notification system');
          return true;
        } catch (error) {
          console.log('Backend not available:', error.message);
          setError('Backend service not available');
          return false;
        }
      };

      const initializeNotificationSystem = async () => {
        const backendAvailable = await checkBackendHealth();
        if (!backendAvailable) {
          setIsInitialized(true);
          return;
        }

        const connectSocket = () => {
          try {
            // Skip Socket.IO on production (Vercel) as it doesn't support WebSocket
            if (isProduction) {
              console.log('Production environment detected, using polling only');
              setUsePolling(true);
              startPolling();
              setIsInitialized(true);
              return null;
            }

            const newSocket = io(API_BASE_URL.replace('/api', ''), {
              auth: { token: socketToken },
              transports: ['polling', 'websocket'],
              forceNew: true,
              timeout: 10000,
              reconnection: true,
              reconnectionAttempts: 3,
              reconnectionDelay: 1000
            });

            newSocket.on('connect', () => {
              console.log('Socket connected successfully');
              setSocketConnected(true);
              setUsePolling(false);
              if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
              }
              setIsInitialized(true);
            });

            newSocket.on('disconnect', () => {
              console.log('Socket disconnected');
              setSocketConnected(false);
            });

            newSocket.on('notification', (notification) => {
              console.log('New notification received:', notification);
              setNotifications(prev => [{ ...notification, read: false }, ...prev]); // Always unread
              setUnreadCount(prev => prev + 1);
              
              // Show browser notification if permission is granted
              if (Notification.permission === 'granted') {
                new Notification(notification.title, {
                  body: notification.message,
                  icon: '/hfplogo.png'
                });
              }
            });

            newSocket.on('connect_error', (error) => {
              console.error('Socket connection error:', error);
              setSocketConnected(false);
              // Fallback to polling if socket fails
              if (!usePolling) {
                console.log('Falling back to polling due to socket connection error');
                setUsePolling(true);
                startPolling();
              }
              setIsInitialized(true);
            });

            newSocket.on('error', (error) => {
              console.error('Socket error:', error);
              setSocketConnected(false);
            });

            setSocket(newSocket);

            // Set a timeout to fallback to polling if socket doesn't connect
            setTimeout(() => {
              if (!socketConnected && !usePolling) {
                console.log('Socket connection timeout, falling back to polling');
                setUsePolling(true);
                startPolling();
              }
              setIsInitialized(true);
            }, 5000);

            return newSocket;
          } catch (error) {
            console.error('Error creating socket connection:', error);
            setUsePolling(true);
            startPolling();
            setIsInitialized(true);
            return null;
          }
        };

        const socketInstance = connectSocket();

        return () => {
          if (socketInstance) {
            socketInstance.close();
          }
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
        };
      };

      initializeNotificationSystem();
    }

    // Cleanup function
    return () => {
      if (socket) {
        socket.close();
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      initializationRef.current = false;
    };
  }, []);

  // Polling fallback for notifications
  const startPolling = () => {
    console.log('Starting polling fallback for notifications');
    
    // Clear any existing interval
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    const interval = setInterval(async () => {
      // Skip if rate limited
      if (rateLimited) {
        console.log('Skipping polling due to rate limiting');
        return;
      }

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          console.log('No token found, stopping polling');
          clearInterval(interval);
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/notifications?page=1&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        });
        
        const newNotifications = response.data.notifications;
        if (newNotifications.length > 0) {
          // Check for new notifications
          setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const trulyNew = newNotifications.filter(n => !existingIds.has(n.id));
            
            if (trulyNew.length > 0) {
              console.log('New notifications found via polling:', trulyNew.length);
              // Show browser notification for new ones
              trulyNew.forEach(notification => {
                if (Notification.permission === 'granted') {
                  new Notification(notification.title, {
                    body: notification.message,
                    icon: '/hfplogo.png'
                  });
                }
              });
              
              return [...trulyNew, ...prev];
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
        
        // Handle rate limiting specifically
        if (error.response?.status === 429) {
          console.log('Rate limited, stopping polling temporarily');
          setRateLimited(true);
          setError('Rate limited. Notifications will resume shortly.');
          // Restart polling after 2 minutes
          setTimeout(() => {
            if (!socketConnected) {
              setRateLimited(false);
              setError(null);
              startPolling();
            }
          }, 120000); // 2 minutes
          return;
        }
        
        // For other errors, don't stop polling but log them
        if (error.response?.status !== 404) {
          console.log('Non-critical polling error, continuing...');
        }
      }
    }, 120000); // Poll every 2 minutes instead of 60 seconds
    
    pollingRef.current = interval;
    setPollingInterval(interval);
  };

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

  const fetchNotifications = async (page = 1) => {
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

      const response = await axios.get(`${API_BASE_URL}/notifications?page=${page}`, {
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
    } catch (err) {
      console.error('Error fetching notifications:', err);
      
      // Handle different error types
      if (err.response?.status === 404) {
        setError('Notification service not available');
        // Stop polling if backend is not available
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setUsePolling(false);
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
    usePolling,
    socketConnected,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    requestNotificationPermission
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 