import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

const messages = [
  {
    headline: "Important reminder",
    content: "Complete full antibiotic courses to prevent resistance."
  },
  {
    headline: "Did you know?",
    content: "Aspirin/Paracetamol is toxic to pets — keep out of reach."
  }
];

const positions = ['bottom-left', 'top-right'];

const getPopupStyle = (position) => {
  switch (position) {
    case 'bottom-left':
      return 'left-6 bottom-6 animate-fade-in-up';
    case 'top-right':
      return 'right-6 top-6 animate-fade-in-down';
    default:
      return '';
  }
};

const RandomPopups = () => {
  const [visiblePopups, setVisiblePopups] = useState([]);
  const [currentPopupIndex, setCurrentPopupIndex] = useState(0);
  const location = useLocation();

  useEffect(() => {
    console.log('RandomPopups mounted on', location.pathname);
    const timeouts = [];

    const checkAndShowPopups = () => {
      // Show random popups independently (removed dependency on rabies popups)
      // Check if first popup was already dismissed in this session
      const firstPopupDismissed = sessionStorage.getItem('dismissed_message_0');
      console.log(`First popup dismissed?`, firstPopupDismissed);
      
      if (!firstPopupDismissed) {
        // Show first popup after a random delay
        const delay = Math.random() * 10000 + 3000; // 3s to 13s delay
        const firstPopup = messages[0];
        
        const timeout = setTimeout(() => {
          console.log('Showing first popup:', firstPopup);
          setVisiblePopups([{ ...firstPopup, index: 0 }]);
        }, delay);
        return timeout;
      }
      return null;
    };

    // Check immediately
    const timer = checkAndShowPopups();
    if (timer) timeouts.push(timer);

    // No longer need storage listeners since we removed rabies popup dependencies

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [location.pathname]);

  const handleClose = (index) => {
    console.log('Popup dismissed:', index);
    sessionStorage.setItem(`dismissed_message_${index}`, 'true');
    
    // Remove current popup
    setVisiblePopups((prev) => prev.filter((item) => item.index !== index));
    
    // Check if there's a next popup to show
    const nextIndex = index + 1;
    if (nextIndex < messages.length) {
      const nextDismissed = sessionStorage.getItem(`dismissed_message_${nextIndex}`);
      if (!nextDismissed) {
        // Show next popup after a short delay
        setTimeout(() => {
          const nextPopup = messages[nextIndex];
          console.log('Showing next popup:', nextPopup);
          setVisiblePopups([{ ...nextPopup, index: nextIndex }]);
        }, 500); // 500ms delay between popups
      }
    }
  };

  // Don't render in messages/chat route
  if (location.pathname === '/chat') {
    console.log('RandomPopups not rendered on /chat');
    return null;
  }

  return (
    <>
      {visiblePopups.map(({ headline, content, index }) => {
        const positionClass = getPopupStyle(positions[index % positions.length]);
        return (
          <div
            key={index}
            className={`fixed z-50 p-4 bg-white shadow-lg border border-gray-200 rounded-lg w-80 ${positionClass}`}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 text-sm mb-1">{headline}</h3>
                <p className="text-sm text-gray-600">{content}</p>
              </div>
              <button 
                onClick={() => handleClose(index)} 
                className="text-gray-400 hover:text-gray-500 transition-colors"
                aria-label="Dismiss message"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default RandomPopups;