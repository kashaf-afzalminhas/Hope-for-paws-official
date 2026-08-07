import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X, Settings, AlertCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../Components/ConfirmationModal';
import { getNotificationLink, getNotificationCategoryInfo } from '../utils/notificationHelpers';

const NotificationsPage = () => {
  const { 
    notifications, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    deleteAllNotifications,
    fetchNotifications,
    setNotifications,
    inAppEnabled
  } = useNotifications();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  // Helper to fetch notifications with limit and update hasMore
  const fetchAndSetNotifications = async (page) => {
    try {
      const response = await fetchNotifications(page, 10);
      if (response && response.notifications) {
        if (page === 1) {
          setNotifications(response.notifications);
          setCurrentPage(1);
        } else {
          setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n._id));
            const uniqueNew = response.notifications.filter(n => !existingIds.has(n._id));
            return [...prev, ...uniqueNew];
          });
        }
      }
      if (response && response.pagination) {
        setHasMore(response.pagination.hasMore);
      } else if (response && typeof response.hasMore !== 'undefined') {
        setHasMore(response.hasMore);
      } else {
        setHasMore(Array.isArray(response?.notifications) ? response.notifications.length === 10 : notifications.length % 10 === 0);
      }
    } catch {
      setHasMore(false);
    }
  };

  useEffect(() => {
    fetchAndSetNotifications(1);
  }, []);

  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    await fetchAndSetNotifications(nextPage);
    setCurrentPage(nextPage);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteAll = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAll = async () => {
    try {
      await deleteAllNotifications();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleNotificationClick = (notification, event) => {
    // Prevent click if user clicked on action buttons
    if (event && event.target.closest('button')) {
      return;
    }

    if (!notification.read) {
      markAsRead(notification._id || notification.id).catch((err) => {
        console.error('Error marking notification as read:', err);
      });
    }

    const targetLink = getNotificationLink(notification);
    if (targetLink) {
      navigate(targetLink);
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

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f3ed] flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6b493d] border-t-transparent"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="min-h-screen bg-[#f5f3ed] py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full">

        {/* Header Card */}
        <div className="mb-6 rounded-[28px] border border-[#e8dcc8] bg-gradient-to-br from-[#f8f4ed] via-[#fcf8f3] to-[#efe4d8] p-5 shadow-xs sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[#6b493d]/10 p-3 text-[#6b493d]">
                <Bell className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#6b493d]">Notifications</h1>
                <p className="mt-1 text-sm text-[#715645]">Stay updated on requests, posts, and community activity.</p>
              </div>
            </div>
            <div className="grid gap-2 grid-cols-2">
              <div className="rounded-2xl border border-[#e8dcc8] bg-white/80 px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#a07855]">Unread</p>
                <p className="mt-0.5 text-lg font-bold text-[#4E3B31]">{unreadCount}</p>
              </div>
              <div className="rounded-2xl border border-[#e8dcc8] bg-white/80 px-4 py-3 text-center">
                <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#a07855]">Total</p>
                <p className="mt-0.5 text-lg font-bold text-[#4E3B31]">{notifications.length}</p>
              </div>
            </div>
          </div>

          {/* Muted preferences alert banner */}
          {!inAppEnabled && (
            <div className="mt-4 p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span>In-app notifications are currently muted in your profile settings.</span>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="font-semibold text-amber-900 hover:underline flex items-center gap-1 ml-2 flex-shrink-0"
              >
                <Settings className="h-3.5 w-3.5" />
                Profile Settings
              </button>
            </div>
          )}

          {/* Action buttons */}
          {notifications.length > 0 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#6b493d]/30 bg-[#6b493d]/5 px-4 py-2 text-xs font-semibold text-[#6b493d] transition hover:bg-[#6b493d]/15"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Mark All Read</span>
                </button>
              )}
              <button
                onClick={handleDeleteAll}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete All</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="rounded-[24px] border border-[#e8dcc8] bg-white p-8 sm:p-12 text-center shadow-xs">
              <div className="w-16 h-16 bg-[#f8f4ed] rounded-full flex items-center justify-center mx-auto mb-4 text-[#a07855]">
                <Bell className="h-8 w-8 opacity-60" />
              </div>
              <h2 className="mb-1 text-lg font-bold text-[#6b493d] sm:text-xl">No notifications yet</h2>
              <p className="text-sm text-[#7a6554]">You will see likes, comments, and adoption updates here as they arrive.</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const category = getNotificationCategoryInfo(notification.type);
              const isUnread = !notification.read;

              return (
                <div
                  key={notification._id || notification.id}
                  onClick={(e) => handleNotificationClick(notification, e)}
                  className={`cursor-pointer rounded-[20px] border border-[#e8dcc8] bg-white p-4 shadow-xs transition-all duration-200 hover:shadow-md relative group ${
                    isUnread ? 'border-l-4 border-l-[#6b493d] bg-[#fcf9f4]' : 'hover:bg-[#faf7f2]'
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl border ${category.bgClass}`}>
                      {category.icon}
                    </div>

                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-sm sm:text-base break-words ${isUnread ? 'font-bold text-[#4E3B31]' : 'font-medium text-gray-800'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium flex-shrink-0">
                          {category.label}
                        </span>
                      </div>

                      <p className="text-gray-600 mt-1 leading-relaxed text-xs sm:text-sm break-words">
                        {notification.message}
                      </p>

                      <p className="text-[11px] sm:text-xs text-gray-400 mt-2 font-medium">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>

                    {/* Quick Item Actions */}
                    <div className="absolute right-3 top-3 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-lg border border-gray-200 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUnread && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id || notification.id);
                          }}
                          className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id || notification.id);
                        }}
                        className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete notification"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Load More Button */}
        {hasMore && notifications.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-6 py-2.5 bg-[#6b493d] text-white rounded-xl hover:bg-[#5a3c32] transition-colors disabled:opacity-50 text-sm font-semibold shadow-xs"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
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
    </div>
  );
};

export default NotificationsPage;