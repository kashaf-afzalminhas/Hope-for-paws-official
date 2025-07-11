import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { debugNotificationSystem, testRateLimiting } from '../utils/debugNotifications';

const NotificationTest = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    usePolling, 
    socketConnected,
    fetchNotifications,
    fetchUnreadCount 
  } = useNotifications();

  const handleDebug = async () => {
    console.log('Starting debug...');
    await debugNotificationSystem();
  };

  const handleTestRateLimiting = async () => {
    console.log('Testing rate limiting...');
    await testRateLimiting();
  };

  const handleRefresh = () => {
    fetchNotifications();
    fetchUnreadCount();
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg m-4">
      <h3 className="text-lg font-bold mb-4">Notification System Test</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold mb-2">Status</h4>
          <div className="space-y-1 text-sm">
            <div>Loading: {loading ? 'Yes' : 'No'}</div>
            <div>Error: {error || 'None'}</div>
            <div>Using Polling: {usePolling ? 'Yes' : 'No'}</div>
            <div>Socket Connected: {socketConnected ? 'Yes' : 'No'}</div>
            <div>Unread Count: {unreadCount}</div>
            <div>Total Notifications: {notifications.length}</div>
          </div>
        </div>

        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold mb-2">Actions</h4>
          <div className="space-y-2">
            <button 
              onClick={handleDebug}
              className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Debug System
            </button>
            <button 
              onClick={handleTestRateLimiting}
              className="w-full bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
            >
              Test Rate Limiting
            </button>
            <button 
              onClick={handleRefresh}
              className="w-full bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
            >
              Refresh Notifications
            </button>
          </div>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold mb-2">Recent Notifications</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {notifications.slice(0, 5).map((notification, index) => (
              <div key={notification.id || index} className="text-sm border-b pb-2">
                <div className="font-medium">{notification.title}</div>
                <div className="text-gray-600">{notification.message}</div>
                <div className="text-xs text-gray-400">
                  {new Date(notification.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationTest; 