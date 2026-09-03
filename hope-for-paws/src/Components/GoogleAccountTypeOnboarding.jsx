import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const GoogleAccountTypeOnboarding = ({ open, onClose, onSelect, googleUser }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownButtonRef = useRef(null);
  const dropdownMenuRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState(null);

  useEffect(() => {
    if (!open) {
      setIsDropdownOpen(false);
      setDropdownPosition(null);
      return undefined;
    }

    if (!isDropdownOpen) {
      setDropdownPosition(null);
      return undefined;
    }

    const updateDropdownPosition = () => {
      const button = dropdownButtonRef.current;
      if (!button) return;

      const buttonRect = button.getBoundingClientRect();
      const menuWidth = Math.min(320, window.innerWidth - 32);
      const horizontalMargin = 16;
      const left = Math.max(
        horizontalMargin,
        Math.min(buttonRect.left, window.innerWidth - menuWidth - horizontalMargin)
      );

      setDropdownPosition({
        top: buttonRect.bottom + 8,
        left,
        width: menuWidth
      });
    };

    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);

    const handlePointerDown = (event) => {
      if (
        !dropdownButtonRef.current?.contains(event.target) &&
        !dropdownMenuRef.current?.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsDropdownOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, isDropdownOpen]);

  if (!open || !googleUser) return null;

  const accountTypes = [
    { id: 'user', name: 'Pet Owner', description: 'Browse and adopt pets' },
    { id: 'seller', name: 'Seller', description: 'Sell pet products' },
    { id: 'veterinarian', name: 'Clinic', description: 'Provide veterinary services' }
  ];

  const selectedOption = accountTypes.find(type => type.id === selectedType);

  const handleContinue = () => {
    if (selectedType) {
      onSelect(selectedType);
    }
  };

  return createPortal(
    (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4" style={{ scrollbarWidth: 'none' }}>
      <style>{`
        .scrollable-card::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="scrollable-card bg-white rounded-lg shadow-xl w-full max-w-sm border border-[#e8dcc8] max-h-[80vh] overflow-y-auto flex flex-col relative" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Header Background Section */}
        <div className="bg-gradient-to-b from-[#F8F4ED] to-white p-6 border-b border-[#e0d5c8]">
          {/* Close Button */}
          <div className="flex justify-end mb-2">
            <button
              className="text-[#a07855] hover:text-[#6b493d] text-2xl font-light transition-colors"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Google Profile Section */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full mb-3 border-2 border-[#a07855] shadow-sm flex items-center justify-center bg-gradient-to-br from-[#a07855] to-[#6b493d] overflow-hidden">
              {!imageError && googleUser.picture ? (
                <img
                  src={googleUser.picture}
                  alt={googleUser.username}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <span className="text-white font-bold text-lg">
                  {googleUser.username?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-[#2c1810] text-center">
              Welcome, {googleUser.username}!
            </h2>
            <p className="text-xs text-[#a07855] text-center mt-1">
              {googleUser.email}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-[#2c1810] mb-1">Complete Your Account</h3>
          <p className="text-xs text-[#6b493d] mb-4">
            Choose how you'd like to use Hope for Paws.
          </p>

          {/* Dropdown */}
          <div className="relative mb-6">
            <button
              ref={dropdownButtonRef}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full px-4 py-2.5 border rounded-lg text-left text-sm font-medium text-[#2c1810] transition-all flex justify-between items-center ${
                isDropdownOpen
                  ? 'border-[#8b6644] bg-gradient-to-b from-[#f5f0eb] to-[#faf7f3] shadow-lg ring-2 ring-[#d4c5b9]'
                  : 'border-[#d4c5b9] bg-white hover:border-[#a07855] hover:shadow-sm'
              }`}
            >
              <span className="text-[#4E3B31]">
                {selectedOption ? selectedOption.name : 'Select account type'}
              </span>
              <svg
                className={`w-5 h-5 text-[#6b493d] transition-transform duration-200 flex-shrink-0 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu - Fixed positioning to escape card container */}
            {isDropdownOpen && dropdownPosition && (
              <div ref={dropdownMenuRef} className="fixed bg-gradient-to-b from-white to-[#faf7f3] border border-[#d4c5b9] rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto" style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width
              }}>
                <style>{`
                  [class*="dropdown"]::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                {accountTypes.map((type, index) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors flex justify-between items-start border-b border-[#e8dcc8] last:border-b-0 ${
                      selectedType === type.id
                        ? 'bg-gradient-to-r from-[#e8dcc8] to-[#f5f0eb] text-[#2c1810] border-l-4 border-l-[#8b6644]'
                        : 'text-[#4E3B31] hover:bg-[#f5f0eb]'
                    }`}
                  >
                    <div className="flex-grow">
                      <div className="font-semibold text-[#2c1810]">{type.name}</div>
                      <div className="text-xs text-[#a07855] mt-0.5">{type.description}</div>
                    </div>
                    {selectedType === type.id && (
                      <svg className="w-5 h-5 text-[#8b6644] flex-shrink-0 ml-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Button and Footer */}
        <div className="p-6 border-t border-[#e0d5c8]">
          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!selectedType}
            className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm text-white bg-gradient-to-b from-[#8b6644] to-[#6b493d] hover:from-[#7a5538] hover:to-[#5a3c32] disabled:from-[#b8a89a] disabled:to-[#a09080] disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6b493d]"
          >
            Continue
          </button>

          <p className="text-xs text-[#a07855] text-center mt-4">
            This choice helps us personalize your experience
          </p>
        </div>
      </div>
    </div>
    ),
    document.body
  );
};

GoogleAccountTypeOnboarding.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  googleUser: PropTypes.shape({
    username: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    picture: PropTypes.string,
    googleId: PropTypes.string
  })
};

export default GoogleAccountTypeOnboarding;
