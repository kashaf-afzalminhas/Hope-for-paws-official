import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import vetconnectImage from '../assets/vetconnect.png';

const ImagePopupModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if modal was dismissed in this session
    const sessionDismissedKey = 'image_popup_dismissed_session';
    const wasDismissedThisSession = sessionStorage.getItem(sessionDismissedKey);

    if (!wasDismissedThisSession) {
      // Show modal after a short delay (shorter than rabies modal to show first)
      const timer = setTimeout(() => {
        setIsOpen(true);
        setTimeout(() => setIsVisible(true), 100); // Animation delay
      }, 1000); // Show after 1 second

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsOpen(false);
      // Mark as dismissed for this session only
      sessionStorage.setItem('image_popup_dismissed_session', 'true');
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`relative transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Close button - floating on top of image */}
        <button
          onClick={handleClose}
          className="absolute -top-2 -right-2 z-10 p-2 bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-all duration-200 rounded-full shadow-lg border-2 border-gray-200"
          aria-label="Close modal"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* Image only */}
        <img 
          src={vetconnectImage} 
          alt="VetConnect Campaign" 
          className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
};

export default ImagePopupModal;
