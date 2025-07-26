import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

const messages = [
  {
    headline: "Did you know?",
    content: "Aspirin/Paracetamol is toxic to pets — keep out of reach."
  },
  {
    headline: "Important reminder",
    content: "Complete full antibiotic courses to prevent resistance."
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
  const location = useLocation();

  useEffect(() => {
    console.log('RandomPopups mounted on', location.pathname);
    const timeouts = [];

    messages.forEach((message, index) => {
      const dismissed = sessionStorage.getItem(`dismissed_message_${index}`);
      console.log(`Popup ${index} dismissed?`, dismissed);
      if (!dismissed) {
        const timeout = setTimeout(() => {
          console.log('Showing popup:', message);
          setVisiblePopups((prev) => [...prev, { ...message, index }]);
        }, Math.random() * 15000 + 5000); // 5s to 20s delay
        timeouts.push(timeout);
      }
    });

    return () => timeouts.forEach(timeout => clearTimeout(timeout));
  }, [location.pathname]);

  const handleClose = (index) => {
    console.log('Popup dismissed:', index);
    sessionStorage.setItem(`dismissed_message_${index}`, 'true');
    setVisiblePopups((prev) => prev.filter((item) => item.index !== index));
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