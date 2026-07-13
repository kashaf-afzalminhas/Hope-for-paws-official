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
                    flex items-center justify-center group
                    ${isOpen 
                      ? 'bg-brown-800 hover:bg-brown-700 rotate-0' 
                      : 'bg-brown-600 hover:bg-brown-700 hover:scale-110'
                    }`}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        {/* Pulse ring when closed */}
        {!isOpen && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-brown-400 opacity-20 animate-ping" />
        )}
        
        {/* Icon */}
        <svg
          className={`w-6 h-6 text-white transition-transform duration-300 ${
            isOpen ? 'rotate-90 scale-90' : 'group-hover:scale-110'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          )}
        </svg>
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
