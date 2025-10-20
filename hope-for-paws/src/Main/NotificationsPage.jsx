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

  return (
    <div className="min-h-screen bg-[#f5f3ed] py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-[#6b493d]" />
              <h1 className="text-2xl sm:text-3xl font-bold text-[#6b493d] text-center sm:text-left">Notifications</h1>
            </div>
            {(() => {
              const hasUnread = notifications.some(n => !n.read);
              const multiAction = hasUnread && notifications.length > 0;
              return (
                <div className={`${multiAction ? 'grid grid-cols-2 gap-2' : 'flex justify-center'} w-full sm:w-auto sm:flex sm:justify-end sm:gap-2`}>
              {hasUnread && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 text-[#6b493d] border border-[#6b493d]/30 bg-[#6b493d]/5 rounded-lg hover:bg-[#6b493d]/10 transition-colors text-sm sm:text-base"
                >
                  <Check className="h-4 w-4" />
                  <span className="truncate">Read All</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm sm:text-base"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="truncate">Delete</span>
                </button>
              )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 text-center">
              <Bell className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No notifications yet</h2>
              <p className="text-sm sm:text-base text-gray-500">You&apos;ll see notifications here when you receive likes, comments, or adoption requests.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id || notification.id}
                className={`bg-white rounded-xl shadow-md p-4 sm:p-6 transition-colors cursor-pointer hover:shadow-lg ${
                  !notification.read ? 'border-l-4 border-blue-500 bg-blue-50' : ''
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