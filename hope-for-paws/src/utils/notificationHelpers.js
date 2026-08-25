/**
 * Utility functions for resolving notification links, icons, and categories.
 */

/**
 * Extract target route path from notification data safely without throwing errors.
 * Handles all notification types and fallback links.
 * 
 * @param {Object} notification 
 * @returns {string|null} Target URL path or null if no navigation target
 */
export const getNotificationLink = (notification) => {
  if (!notification) return null;
  const data = notification.data || {};
  const type = notification.type;

  switch (type) {
    case 'post_like':
    case 'post_comment':
    case 'new_post_vet_notification':
      if (data.postId) return `/posts/${data.postId}`;
      if (data.post) return `/posts/${data.post}`;
      return '/posts';

    case 'out_of_stock':
      if (data.productId) return `/seller/dashboard?productId=${data.productId}`;
      return null;

    case 'system':
      if (data.productId) return `/seller/dashboard?productId=${data.productId}`;
      if (data.link) return data.link;
      if (data.url) return data.url;
      if (data.path) return data.path;
      return null;

    case 'adoption_request':
      return '/my-adoptions';

    case 'adoption_request_accepted':
    case 'adoption_request_rejected':
      return '/adoptionhistory';

    case 'chat_message': {
      const senderId = notification.sender?._id || notification.sender || data.senderId;
      if (senderId) return `/chat/${senderId}`;
      return '/chat';
    }

    case 'new_order':
      if (data.orderId) return `/seller/orders`;
      return '/seller/orders';

    case 'order_status_update':
    case 'payment_confirmed':
    case 'refund_request':
      if (data.orderStatus === 'Delivered') return `/my-orders?status=delivered`;
      if (data.orderStatus === 'Cancelled') return `/my-orders?status=cancelled`;
      if (data.orderId) return `/my-orders`;
      return '/my-orders';

    default:
      if (data.link) return data.link;
      if (data.url) return data.url;
      if (data.path) return data.path;
      return null;
  }
};

/**
 * Get category icon emoji and styling metadata for notification types.
 * 
 * @param {string} type 
 * @returns {Object} { icon, bgClass, textClass, label }
 */
export const getNotificationCategoryInfo = (type) => {
  switch (type) {
    case 'post_like':
      return { icon: '❤️', bgClass: 'bg-rose-50 border-rose-200', textClass: 'text-rose-600', label: 'Like' };
    case 'post_comment':
      return { icon: '💬', bgClass: 'bg-blue-50 border-blue-200', textClass: 'text-blue-600', label: 'Comment' };
    case 'new_post_vet_notification':
      return { icon: '🩺', bgClass: 'bg-emerald-50 border-emerald-200', textClass: 'text-emerald-600', label: 'Vet Alert' };
    case 'adoption_request':
      return { icon: '🐾', bgClass: 'bg-amber-50 border-amber-200', textClass: 'text-amber-700', label: 'Adoption' };
    case 'adoption_request_accepted':
      return { icon: '🎉', bgClass: 'bg-green-50 border-green-200', textClass: 'text-green-600', label: 'Accepted' };
    case 'adoption_request_rejected':
      return { icon: 'ℹ️', bgClass: 'bg-gray-100 border-gray-200', textClass: 'text-gray-600', label: 'Update' };
    case 'chat_message':
      return { icon: '💬', bgClass: 'bg-indigo-50 border-indigo-200', textClass: 'text-indigo-600', label: 'Message' };
    case 'new_order':
    case 'order_status_update':
    case 'payment_confirmed':
    case 'refund_request':
      return { icon: '📦', bgClass: 'bg-purple-50 border-purple-200', textClass: 'text-purple-600', label: 'Order' };
    case 'out_of_stock':
      return { icon: '⚠️', bgClass: 'bg-amber-50 border-amber-200', textClass: 'text-amber-700', label: 'Stock alert' };
    default:
      return { icon: '🔔', bgClass: 'bg-amber-50 border-amber-200', textClass: 'text-[#6b493d]', label: 'Alert' };
  }
};
