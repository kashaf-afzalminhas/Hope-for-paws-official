import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Trash2, Wifi, WifiOff, Settings, AlertCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import { getNotificationLink, getNotificationCategoryInfo } from '../utils/notificationHelpers';

const NotificationIcon = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    deleteAllNotifications,
    socketConnected,
    inAppEnabled,
    error 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleClick = () => {
    // If already on notifications page, close dropdown and navigate to /notifications
    if (location.pathname === '/notifications') {
      setIsOpen(false);
      navigate('/notifications');
      return;
    }
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification, event) => {
    // Prevent triggering navigation if clicked on action buttons inside item
    if (event && event.target.closest('button')) {
      return;
    }

    // Mark as read non-blockingly
    if (!notification.read) {
      markAsRead(notification._id || notification.id).catch((err) => {
        console.error('Failed to mark notification as read:', err);
      });
    }

    // Resolve target route safely
    const targetLink = getNotificationLink(notification);
    console.log('Notification clicked:', notification.type, 'Target link:', targetLink);

    setIsOpen(false);

    if (targetLink) {
      navigate(targetLink);
    }
  };

  const handleMarkItemAsRead = (e, notificationId) => {
    e.stopPropagation();
    markAsRead(notificationId).catch((err) => {
      console.error('Error marking item as read:', err);
    });
  };

  const handleDeleteItem = (e, notificationId) => {
    e.stopPropagation();
    deleteNotification(notificationId).catch((err) => {
      console.error('Error deleting notification:', err);
    });
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDeleteAll = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAll = async () => {
    try {
      await deleteAllNotifications();
    } catch (err) {
      console.error('Error deleting all notifications:', err);
    } finally {
      setShowDeleteConfirm(false);
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

  const getConnectionStatus = () => {
    if (socketConnected) return { icon: <Wifi className="h-3 w-3" />, text: 'Live', color: 'text-emerald-600 bg-emerald-50' };
    return { icon: <WifiOff className="h-3 w-3" />, text: 'Offline', color: 'text-gray-400 bg-gray-100' };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleClick}
        className="relative p-2 text-[#6b493d] hover:text-[#5a3c32] hover:bg-[#6b493d]/5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6b493d]/20"
        title={`${unreadCount} unread notifications (${connectionStatus.text})`}
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[11px] font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center shadow-sm border-2 border-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-12 w-[calc(100vw-1rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#e8dcc8] z-[100] max-w-[calc(100vw-1rem)] overflow-hidden transition-all duration-200 ease-out">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#f0e6d8] bg-gradient-to-r from-[#faf7f2] to-white">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#6b493d] text-base">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-[#6b493d]/10 text-[#6b493d] rounded-full">
                  {unreadCount} new
                </span>
              )}
              <div className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${connectionStatus.color}`}>
                {connectionStatus.icon}
                <span>{connectionStatus.text}</span>
              </div>
            </div>

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
                  className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete all notifications"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Preferences Muted Alert Banner */}
          {!inAppEnabled && (
            <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span>In-app notifications are muted in your preferences.</span>
              </div>
              <button
                onClick={() => { setIsOpen(false); navigate('/profile'); }}
                className="font-semibold text-amber-900 hover:underline flex items-center gap-1 ml-2 flex-shrink-0"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </button>
            </div>
          )}

          {/* Connection Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border-b border-red-200 text-xs text-red-600 flex items-center justify-between">
              <span>{error}</span>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-[65vh] sm:max-h-80 overflow-y-auto divide-y divide-gray-100/80">
            {notifications.length === 0 ? (
              <div className="py-10 px-6 text-center">
                <div className="w-14 h-14 bg-[#f8f4ed] rounded-full flex items-center justify-center mx-auto mb-3 text-[#a07855]">
                  <Bell className="h-7 w-7 opacity-60" />
                </div>
                <h4 className="font-semibold text-[#6b493d] text-sm">All caught up!</h4>
                <p className="text-xs text-gray-500 mt-1">No new notifications at the moment.</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const category = getNotificationCategoryInfo(notification.type);
                const isUnread = !notification.read;

                return (
                  <div
                    key={notification._id || notification.id}
                    onClick={(e) => handleNotificationClick(notification, e)}
                    className={`p-3.5 sm:p-4 hover:bg-[#faf7f2] cursor-pointer transition-all duration-150 relative group flex items-start gap-3 ${
                      isUnread ? 'bg-[#fcf9f4]' : 'bg-white'
                    }`}
                  >
                    {/* Left unread accent line */}
                    {isUnread && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6b493d] rounded-r" />
                    )}

                    {/* Category Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg border shadow-xs ${category.bgClass}`}>
                      {category.icon}
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className={`text-sm break-words ${isUnread ? 'font-bold text-[#4E3B31]' : 'font-medium text-gray-800'}`}>
                          {notification.title}
                        </h4>
                        {isUnread && (
                          <span className="w-2 h-2 bg-[#6b493d] rounded-full flex-shrink-0 mt-1.5 ml-1" />
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-1 leading-snug line-clamp-2 break-words">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] text-gray-400 font-medium">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-500 font-medium">
                          {category.label}
                        </span>
                      </div>
                    </div>

                    {/* Quick Item Actions (visible on hover / touch) */}
                    <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-lg shadow-xs border border-gray-200">
                      {isUnread && (
                        <button
                          onClick={(e) => handleMarkItemAsRead(e, notification._id || notification.id)}
                          className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteItem(e, notification._id || notification.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
                className="w-full text-center text-xs font-semibold text-[#6b493d] hover:text-[#5a3c32] transition-colors py-2 rounded-xl hover:bg-[#6b493d]/10 flex items-center justify-center gap-1.5"
              >
                <span>View all notifications</span>
                <span>&rarr;</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteAll}
        title="Delete All Notifications"
        message="Are you sure you want to delete all notifications? This action cannot be undone."
        confirmText="Delete All"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default NotificationIcon;