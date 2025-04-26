// DisclaimerBanner.jsx
import { useState } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const DisclaimerBanner = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const messages = [
    "Aspirin/Paracetamol toxic to pets - keep out of reach",
    "Complete full antibiotic courses to prevent resistance",
    "Maintain vaccine boosters for optimal immunity"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Main Button */}
      <button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsHovered(!isHovered)}
        className="bg-white p-4 rounded-full shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 relative"
        aria-label="Safety advisories"
      >
        <div className="flex items-center">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
          </span>
        </div>
      </button>

      {/* Expanded Panel */}
      <div 
        className={`absolute bottom-full right-0 mb-4 w-64 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Safety Advisories</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <XMarkIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          <ul className="space-y-3 text-sm text-gray-700">
            {messages.map((message, index) => (
              <li 
                key={index}
                className="flex items-start space-x-2"
              >
                <span className="text-red-500">•</span>
                <span>{message}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              24/7 emergency support available
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};