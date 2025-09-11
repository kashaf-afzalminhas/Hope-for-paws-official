import React, { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, ShieldCheckIcon, HeartIcon } from '@heroicons/react/24/outline';

const RabiesAwarenessModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkAndShowModal = () => {
      // Check if modal was dismissed in this session
      const sessionDismissedKey = 'rabies_modal_dismissed_session';
      const wasDismissedThisSession = sessionStorage.getItem(sessionDismissedKey);
      
      // Check if image popup was dismissed (image popup should show first)
      const imagePopupDismissed = sessionStorage.getItem('image_popup_dismissed_session');

      if (!wasDismissedThisSession && imagePopupDismissed) {
        // Show modal after a short delay, but only after image popup is dismissed
        const timer = setTimeout(() => {
          setIsOpen(true);
          setTimeout(() => setIsVisible(true), 100); // Animation delay
        }, 1500); // Show after 1.5 seconds after image popup is dismissed

        return timer;
      }
      return null;
    };

    // Check immediately
    const timer = checkAndShowModal();

    // Also listen for storage changes (when image popup is dismissed)
    const handleStorageChange = (e) => {
      if (e.key === 'image_popup_dismissed_session') {
        const newTimer = checkAndShowModal();
        return newTimer;
      }
      return null;
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check periodically in case storage event doesn't fire
    const intervalId = setInterval(() => {
      if (sessionStorage.getItem('image_popup_dismissed_session') && !sessionStorage.getItem('rabies_modal_dismissed_session')) {
        const newTimer = checkAndShowModal();
        if (newTimer) {
          clearInterval(intervalId);
        }
      }
    }, 500);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsOpen(false);
      // Mark as dismissed for this session only
      sessionStorage.setItem('rabies_modal_dismissed_session', 'true');
      
      // Clear any existing random popup dismissals to allow them to show
      // This ensures random popups can appear after the rabies modal is dismissed
      sessionStorage.removeItem('dismissed_message_0');
      sessionStorage.removeItem('dismissed_message_1');
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
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-2 sm:mx-4 max-h-[90vh] flex flex-col transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 sm:p-6 rounded-t-xl border-b border-red-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1 sm:p-2 bg-red-100 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-red-800">Rabies Awareness</h2>
                <p className="text-red-600 text-xs sm:text-sm">Protect yourself and your pets</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-white/50 flex-shrink-0"
              aria-label="Close modal"
            >
              <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {/* What is Rabies */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <HeartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
              What is Rabies?
            </h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Rabies is a deadly viral disease that affects the nervous system of mammals, including humans. 
              It's almost always fatal once symptoms appear, but it's 100% preventable with proper vaccination.
            </p>
          </div>

          {/* How it spreads */}
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
            <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-2 sm:mb-3 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
              How Rabies Spreads
            </h3>
            <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold flex-shrink-0">•</span>
                <span>Animal bites (dogs, cats, bats, raccoons, etc.)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold flex-shrink-0">•</span>
                <span>Scratches from infected animals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold flex-shrink-0">•</span>
                <span>Contact with infected saliva through open wounds</span>
              </li>
            </ul>
          </div>

          {/* Prevention */}
          <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
            <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-2 sm:mb-3 flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              Prevention Methods
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <h4 className="font-medium text-green-700 mb-1 sm:mb-2 text-sm sm:text-base">For Your Pets:</h4>
                <ul className="space-y-1 text-gray-700 text-xs sm:text-sm">
                  <li>• Keep vaccinations up to date</li>
                  <li>• Supervise outdoor activities</li>
                  <li>• Avoid contact with wild animals</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-700 mb-1 sm:mb-2 text-sm sm:text-base">For You:</h4>
                <ul className="space-y-1 text-gray-700 text-xs sm:text-sm">
                  <li>• Avoid stray or wild animals</li>
                  <li>• Don't approach unknown animals</li>
                  <li>• Report aggressive animals</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Immediate Steps */}
          <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border-l-4 border-yellow-400">
            <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-2 sm:mb-3">
              🚨 Immediate Steps After Exposure
            </h3>
            <div className="space-y-2 text-sm sm:text-base text-gray-700">
              <div className="flex items-start gap-2">
                <span className="bg-yellow-400 text-yellow-800 text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded flex-shrink-0">1</span>
                <span><strong>Wash the wound</strong> immediately with soap and water for 15 minutes</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-yellow-400 text-yellow-800 text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded flex-shrink-0">2</span>
                <span><strong>Seek medical attention</strong> immediately - don't wait for symptoms</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-yellow-400 text-yellow-800 text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded flex-shrink-0">3</span>
                <span><strong>Report to authorities</strong> if the animal is unknown or acting strangely</span>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-[#F8F4ED] p-3 sm:p-4 rounded-lg border border-[#a07855]/20">
            <p className="text-center text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">
              <strong>Remember:</strong> Rabies is preventable but deadly. When in doubt, seek medical help immediately.
            </p>
            <div className="text-center">
              <span className="text-[#a07855] font-semibold text-sm sm:text-base">Hope for Paws - Protecting Lives Together</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-xl border-t border-gray-200 flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
            <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              This is an awareness message
            </p>
            <button
              onClick={handleClose}
              className="bg-[#a07855] hover:bg-[#8a6a4d] text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RabiesAwarenessModal;
