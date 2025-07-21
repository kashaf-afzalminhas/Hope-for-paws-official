import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

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
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      try {
        await deleteAllNotifications();
      } catch (error) {
        console.error('Error deleting all notifications:', error);
      }
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
    <div className="min-h-screen bg-[#f5f3ed] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-[#6b493d]" />
              <h1 className="text-3xl font-bold text-[#6b493d]">Notifications</h1>
            </div>
            <div className="flex gap-2">
              {notifications.some(n => !n.read) && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-[#6b493d] text-white rounded-lg hover:bg-[#5a3c32] transition-colors"
                >
                  <Check className="h-4 w-4" />
                  Mark All Read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">No notifications yet</h2>
              <p className="text-gray-500">You&apos;ll see notifications here when you receive likes, comments, or adoption requests.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id || notification.id}
                className={`bg-white rounded-xl shadow-md p-6 transition-colors cursor-pointer hover:shadow-lg ${
                  !notification.read ? 'border-l-4 border-blue-500 bg-blue-50' : ''
                }`}
                onClick={(event) => handleNotificationClick(notification, event)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-[#6b493d] text-lg">
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete notification"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 mt-2 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-sm text-gray-500 mt-3">
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
              className="px-6 py-3 bg-[#6b493d] text-white rounded-lg hover:bg-[#5a3c32] transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage; 