import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { getNotificationLink, getNotificationCategoryInfo } from '../utils/notificationHelpers';

const NotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    deleteAllNotifications,
    requestNotificationPermission 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Check for notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      setShowPermissionRequest(true);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification, event) => {
    if (event && event.target.closest('button')) {
      return;
    }

    if (!notification.read) {
      markAsRead(notification._id || notification.id).catch((err) => {
        console.error('Error marking as read:', err);
      });
    }

    const targetLink = getNotificationLink(notification);
    setIsOpen(false);
    if (targetLink) {
      navigate(targetLink);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      try {
        await deleteAllNotifications();
      } catch (error) {
        console.error('Error deleting all notifications:', error);
      }
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setShowPermissionRequest(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#6b493d] hover:text-[#5a3c32] hover:bg-[#6b493d]/5 rounded-full transition-all duration-200"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[11px] font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center shadow-xs border-2 border-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Permission Request */}
      {showPermissionRequest && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-[#e8dcc8] p-4 z-50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 bg-[#6b493d]/10 rounded-xl text-[#6b493d]">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#6b493d] text-sm mb-1">Enable Notifications</h3>
              <p className="text-xs text-gray-600 mb-3">
                Get real-time updates on adoption requests, post comments, and messages.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleRequestPermission}
                  className="px-3 py-1.5 bg-[#6b493d] text-white text-xs font-semibold rounded-lg hover:bg-[#5a3c32] transition-colors"
                >
                  Enable
                </button>
                <button
                  onClick={() => setShowPermissionRequest(false)}
                  className="px-3 py-1.5 text-gray-600 text-xs font-medium hover:text-gray-800 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-[#e8dcc8] max-h-96 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#f0e6d8] bg-[#faf7f2]">
            <h3 className="font-bold text-[#6b493d] text-sm">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="p-1.5 text-gray-500 hover:text-[#6b493d] hover:bg-[#6b493d]/10 rounded-lg transition-colors"
                  title="Mark all as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const category = getNotificationCategoryInfo(notification.type);
                const isUnread = !notification.read;

                return (
                  <div
                    key={notification._id || notification.id}
                    className={`p-3.5 hover:bg-[#faf7f2] cursor-pointer transition-colors flex items-start gap-3 relative ${
                      isUnread ? 'bg-[#fcf9f4]' : 'bg-white'
                    }`}
                    onClick={(e) => handleNotificationClick(notification, e)}
                  >
                    {isUnread && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6b493d] rounded-r" />
                    )}

                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base border ${category.bgClass}`}>
                      {category.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className={`text-xs ${isUnread ? 'font-bold text-[#4E3B31]' : 'font-medium text-gray-800'}`}>
                          {notification.title}
                        </h4>
                        {isUnread && (
                          <div className="w-2 h-2 bg-[#6b493d] rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-[#f0e6d8] bg-[#faf7f2]">
              <button
                onClick={() => { setIsOpen(false); navigate('/notifications'); }}
                className="w-full text-center text-xs font-semibold text-[#6b493d] hover:text-[#5a3c32] transition-colors py-1.5 rounded-lg hover:bg-[#6b493d]/10"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;