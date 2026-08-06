import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../Components/ConfirmationModal';

const NotificationsPage = () => {
  const { 
    notifications, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    deleteAllNotifications,
    fetchNotifications,
    setNotifications // Added setNotifications to the context
  } = useNotifications();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  // Helper to fetch notifications with limit and update hasMore
  const fetchAndSetNotifications = async (page) => {
    try {
      // Always fetch 5 per page
      const response = await fetchNotifications(page, 5);
      if (response && response.notifications) {
        if (page === 1) {
          setNotifications(response.notifications); // Replace for page 1
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
        setHasMore(Array.isArray(response?.notifications) ? response.notifications.length === 5 : notifications.length % 5 === 0);
      }
    } catch {
      setHasMore(false);
    }
  };

  useEffect(() => {
    // On mount, fetch first page
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
    }
  };

  const handleNotificationClick = async (notification, event) => {
    // Prevent click if user clicked on action buttons
    if (event.target.closest('button')) {
      return;
    }

    if (!notification.read) {
      await markAsRead(notification._id || notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'post_like':
      case 'post_comment':
      case 'new_post_vet_notification':
        navigate(`/posts/${notification.data.postId}`);
        break;
      case 'adoption_request':
        navigate('/my-adoptions');
        break;
      case 'adoption_request_accepted':
      case 'adoption_request_rejected':
        navigate('/adoptionhistory');
        break;
      default:
        break;
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'post_like':
        return '❤️';
      case 'post_comment':
        return '💬';
      case 'adoption_request':
        return '🐾';
      case 'adoption_request_accepted':
        return '✅';
      case 'adoption_request_rejected':
        return '❌';
      case 'new_post_vet_notification':
        return '📝';
      default:
        return '🔔';
    }
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
    <div className="min-h-screen bg-[#f5f3ed] py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        <div className="mb-6 rounded-[28px] border border-[#e8dcc8] bg-gradient-to-br from-[#f8f4ed] via-[#fcf8f3] to-[#efe4d8] p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[#6b493d]/10 p-3 text-[#6b493d]">
                <Bell className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#6b493d]">Notifications</h1>
                <p className="mt-1 text-sm text-[#715645]">Stay on top of updates, requests, and important activity.</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#e8dcc8] bg-white/80 px-3 py-3 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-[#a07855]">Unread</p>
                <p className="mt-1 text-lg font-semibold text-[#4E3B31]">{unreadCount}</p>
              </div>
              <div className="rounded-2xl border border-[#e8dcc8] bg-white/80 px-3 py-3 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-[#a07855]">Total</p>
                <p className="mt-1 text-lg font-semibold text-[#4E3B31]">{notifications.length}</p>
              </div>
            </div>
          </div>

          {(() => {
            const hasUnread = notifications.some(n => !n.read);
            const multiAction = hasUnread && notifications.length > 0;
            return (
              <div className={`${multiAction ? 'mt-4 grid grid-cols-2 gap-2 sm:w-auto sm:grid-cols-2' : 'mt-4 flex justify-center'} w-full sm:flex sm:justify-end sm:gap-2`}>
                {hasUnread && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#6b493d]/30 bg-[#6b493d]/5 px-3 py-2 text-sm font-medium text-[#6b493d] transition hover:bg-[#6b493d]/10"
                  >
                    <Check className="h-4 w-4" />
                    <span className="truncate">Read All</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="truncate">Delete</span>
                  </button>
                )}
              </div>
            );
          })()}
        </div>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="rounded-[24px] border border-[#e8dcc8] bg-white p-8 text-center shadow-sm">
              <Bell className="mx-auto mb-4 h-12 w-12 text-gray-300 sm:h-16 sm:w-16" />
              <h2 className="mb-2 text-lg font-semibold text-[#6b493d] sm:text-xl">No notifications yet</h2>
              <p className="text-sm text-[#7a6554] sm:text-base">You&apos;ll see likes, comments, and adoption updates here as they arrive.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id || notification.id}
                className={`cursor-pointer rounded-[24px] border border-[#e8dcc8] bg-white p-4 shadow-sm transition hover:shadow-md sm:p-6 ${
                  !notification.read ? 'border-l-4 border-[#6b493d] bg-[#f8f4ed]' : ''
                }`}
                onClick={(event) => handleNotificationClick(notification, event)}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0 text-xl sm:text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-[#6b493d] text-base sm:text-lg break-words">
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-1 sm:gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="p-1 sm:p-2 text-blue-500 hover:text-blue-700 transition-colors rounded-md hover:bg-blue-50"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="p-1 sm:p-2 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-gray-100"
                          title="Delete notification"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 mt-2 leading-relaxed text-sm sm:text-base break-words">
                      {notification.message}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-3">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {hasMore && notifications.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-4 sm:px-6 py-3 bg-[#6b493d] text-white rounded-lg hover:bg-[#5a3c32] transition-colors disabled:opacity-50 text-sm sm:text-base"
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