import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

const NotificationToast = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(), 300); // Wait for animation to complete
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  if (!notification) return null;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg transition-all duration-300 transform",
        "bg-white border border-[#e5d9c8] text-[#2c1810]",
        "flex items-start space-x-3 max-w-sm",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <div className="flex-shrink-0 mt-0.5 text-[#a07855]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold font-heading text-sm">{notification.title}</h3>
        <p className="text-xs mt-1 text-[#2c1810]/80 line-clamp-2">{notification.body}</p>
      </div>
      
      <button
        onClick={handleClose}
        className="flex-shrink-0 mt-0.5 text-[#2c1810]/60 hover:text-[#2c1810] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default NotificationToast;
