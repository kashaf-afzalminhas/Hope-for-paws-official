import React, { useEffect, useRef } from 'react';
import { useAIAssistant } from '../../hooks/useAIAssistant';
import AIChatWindow from './AIChatWindow';

const AIAssistant = () => {
  const { isOpen, toggleAssistant } = useAIAssistant();
  const widgetRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        // Don't close if clicking the toggle button
        if (event.target.closest('[data-ai-toggle]')) return;
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        data-ai-toggle
        onClick={toggleAssistant}
        className={`fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full 
                    shadow-lg hover:shadow-xl transition-all duration-300 ease-out
                    flex items-center justify-center group overflow-hidden
                    ${isOpen 
                      ? 'bg-brown-800 hover:bg-brown-700 rounded-full' 
                      : 'bg-transparent hover:scale-110 rounded-2xl shadow-lg'
                    }`}
        aria-label={isOpen ? 'Close Hopeforpaws Assistant' : 'Open Hopeforpaws Assistant'}
      >
        {!isOpen && (
          <span className="absolute inline-flex h-full w-full rounded-2xl bg-[#a07855] opacity-20 animate-ping" />
        )}

        {isOpen ? (
          <svg
            className="w-6 h-6 text-white transition-transform duration-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <img
            src="/hfplogo-512.png"
            alt=""
            className="w-full h-full rounded-2xl object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </button>

      {/* Chat Window */}
      <div
        ref={widgetRef}
        className={`fixed bottom-24 right-6 z-[9998] w-[380px] max-w-[calc(100vw-3rem)]
                    bg-white rounded-2xl shadow-2xl border border-brown-100
                    transition-all duration-300 ease-out origin-bottom-right
                    ${isOpen 
                      ? 'opacity-100 scale-100 translate-y-0' 
                      : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
                    }`}
        style={{ height: 'min(520px, calc(100vh - 8rem))' }}
      >
        <AIChatWindow />
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[9997] md:hidden backdrop-blur-sm"
          onClick={toggleAssistant}
        />
      )}
    </>
  );
};

export default AIAssistant;
