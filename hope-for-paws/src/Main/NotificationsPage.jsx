import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Filter, Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { markNotificationRead, markAllNotificationsRead, deleteNotification } = useSocket();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, page, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/notifications?page=${page}&limit=20`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (page === 1) {
          setNotifications(data.notifications || []);
        } else {
          setNotifications(prev => [...prev, ...(data.notifications || [])]);
        }
        
        setHasMore(data.hasMore || false);
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        markNotificationRead(notificationId);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
        markAllNotificationsRead();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        deleteNotification(notificationId);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'POST_LIKE':
        return '❤️';
      case 'POST_COMMENT':
        return '💬';
      case 'ADOPTION_REQUEST':
        return '🐾';
      case 'ADOPTION_REQUEST_ACCEPTED':
        return '✅';
      case 'ADOPTION_REQUEST_REJECTED':
        return '❌';
      case 'NEW_POST_FOR_VETS':
        return '🏥';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'POST_LIKE':
        return 'text-red-500';
      case 'POST_COMMENT':
        return 'text-blue-500';
      case 'ADOPTION_REQUEST':
        return 'text-green-500';
      case 'ADOPTION_REQUEST_ACCEPTED':
        return 'text-green-600';
      case 'ADOPTION_REQUEST_REJECTED':
        return 'text-red-600';
      case 'NEW_POST_FOR_VETS':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.isRead) ||
      (filter === 'read' && notification.isRead);
    
    const matchesSearch = searchTerm === '' || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f3ed] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#6b493d] mb-4">Please log in to view notifications</p>
          <Link to="/signin" className="text-[#8B5A2B] hover:text-[#6F4C3E] font-medium">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ed]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-[#6b493d] hover:text-[#8B5A2B]">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-[#4E3B31]">Notifications</h1>
              <p className="text-[#8B5A2B]">
                {unreadCount} unread • {notifications.length} total
              </p>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-[#6b493d] text-white rounded-lg hover:bg-[#5a3c32] transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b493d] focus:border-transparent"
              />
            </div>
            
            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b493d] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All notifications</option>
                <option value="unread">Unread only</option>
                <option value="read">Read only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading && page === 1 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b493d] mx-auto"></div>
              <p className="mt-2 text-[#8B5A2B]">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
              {error}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#4E3B31] mb-2">No notifications</h3>
              <p className="text-[#8B5A2B]">
                {searchTerm || filter !== 'all' 
                  ? 'No notifications match your filters'
                  : 'You\'re all caught up!'
                }
              </p>
            </div>
          ) : (
            <>
              {filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg ${
                    !notification.isRead ? 'border-l-4 border-[#6b493d]' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`text-2xl flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-[#4E3B31]">
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 ml-4">
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="p-1 text-green-600 hover:text-green-700 transition-colors"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification._id)}
                            className="p-1 text-red-600 hover:text-red-700 transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-[#6b493d] mb-3 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-[#8B5A2B]">
                        <span>{formatTimeAgo(notification.createdAt)}</span>
                        {!notification.isRead && (
                          <span className="px-2 py-1 bg-[#6b493d] text-white text-xs rounded-full">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Load More */}
              {hasMore && !loading && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setPage(prev => prev + 1)}
                    className="px-6 py-2 bg-[#6b493d] text-white rounded-lg hover:bg-[#5a3c32] transition-colors"
                  >
                    Load More
                  </button>
                </div>
              )}
              
              {loading && page > 1 && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6b493d] mx-auto"></div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage; 