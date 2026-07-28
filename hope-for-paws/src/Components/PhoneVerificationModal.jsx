import React, { useState, useEffect } from 'react';
import { AUTH_BASE_URL } from '../config';

const PhoneVerificationModal = ({ isOpen, onClose, onVerified, user, isExistingUser = false }) => {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+92');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Country codes data
  const countryCodes = [
    { code: '+92', country: 'Pakistan', flag: 'Ã°Å¸â€¡ÂµÃ°Å¸â€¡Â°' },
    { code: '+1', country: 'United States', flag: 'Ã°Å¸â€¡ÂºÃ°Å¸â€¡Â¸' },
    { code: '+1', country: 'Canada', flag: 'Ã°Å¸â€¡Â¨Ã°Å¸â€¡Â¦' },
    { code: '+44', country: 'United Kingdom', flag: 'Ã°Å¸â€¡Â¬Ã°Å¸â€¡Â§' },
    { code: '+91', country: 'India', flag: 'Ã°Å¸â€¡Â®Ã°Å¸â€¡Â³' },
    { code: '+86', country: 'China', flag: 'Ã°Å¸â€¡Â¨Ã°Å¸â€¡Â³' },
    { code: '+81', country: 'Japan', flag: 'Ã°Å¸â€¡Â¯Ã°Å¸â€¡Âµ' },
    { code: '+82', country: 'South Korea', flag: 'Ã°Å¸â€¡Â°Ã°Å¸â€¡Â·' },
    { code: '+65', country: 'Singapore', flag: 'Ã°Å¸â€¡Â¸Ã°Å¸â€¡Â¬' },
    { code: '+60', country: 'Malaysia', flag: 'Ã°Å¸â€¡Â²Ã°Å¸â€¡Â¾' },
    { code: '+66', country: 'Thailand', flag: 'Ã°Å¸â€¡Â¹Ã°Å¸â€¡Â­' },
    { code: '+63', country: 'Philippines', flag: 'Ã°Å¸â€¡ÂµÃ°Å¸â€¡Â­' },
    { code: '+62', country: 'Indonesia', flag: 'Ã°Å¸â€¡Â®Ã°Å¸â€¡Â©' },
    { code: '+84', country: 'Vietnam', flag: 'Ã°Å¸â€¡Â»Ã°Å¸â€¡Â³' },
    { code: '+880', country: 'Bangladesh', flag: 'Ã°Å¸â€¡Â§Ã°Å¸â€¡Â©' },
    { code: '+94', country: 'Sri Lanka', flag: 'Ã°Å¸â€¡Â±Ã°Å¸â€¡Â°' },
    { code: '+977', country: 'Nepal', flag: 'Ã°Å¸â€¡Â³Ã°Å¸â€¡Âµ' },
    { code: '+975', country: 'Bhutan', flag: 'Ã°Å¸â€¡Â§Ã°Å¸â€¡Â¹' },
    { code: '+93', country: 'Afghanistan', flag: 'Ã°Å¸â€¡Â¦Ã°Å¸â€¡Â«' },
    { code: '+98', country: 'Iran', flag: 'Ã°Å¸â€¡Â®Ã°Å¸â€¡Â·' },
    { code: '+90', country: 'Turkey', flag: 'Ã°Å¸â€¡Â¹Ã°Å¸â€¡Â·' },
    { code: '+971', country: 'UAE', flag: 'Ã°Å¸â€¡Â¦Ã°Å¸â€¡Âª' },
    { code: '+966', country: 'Saudi Arabia', flag: 'Ã°Å¸â€¡Â¸Ã°Å¸â€¡Â¦' },
    { code: '+965', country: 'Kuwait', flag: 'Ã°Å¸â€¡Â°Ã°Å¸â€¡Â¼' },
    { code: '+974', country: 'Qatar', flag: 'Ã°Å¸â€¡Â¶Ã°Å¸â€¡Â¦' },
    { code: '+973', country: 'Bahrain', flag: 'Ã°Å¸â€¡Â§Ã°Å¸â€¡Â­' },
    { code: '+968', country: 'Oman', flag: 'Ã°Å¸â€¡Â´Ã°Å¸â€¡Â²' },
    { code: '+20', country: 'Egypt', flag: 'Ã°Å¸â€¡ÂªÃ°Å¸â€¡Â¬' },
    { code: '+27', country: 'South Africa', flag: 'Ã°Å¸â€¡Â¿Ã°Å¸â€¡Â¦' },
    { code: '+234', country: 'Nigeria', flag: 'Ã°Å¸â€¡Â³Ã°Å¸â€¡Â¬' },
    { code: '+254', country: 'Kenya', flag: 'Ã°Å¸â€¡Â°Ã°Å¸â€¡Âª' },
    { code: '+33', country: 'France', flag: 'Ã°Å¸â€¡Â«Ã°Å¸â€¡Â·' },
    { code: '+49', country: 'Germany', flag: 'Ã°Å¸â€¡Â©Ã°Å¸â€¡Âª' },
    { code: '+39', country: 'Italy', flag: 'Ã°Å¸â€¡Â®Ã°Å¸â€¡Â¹' },
    { code: '+34', country: 'Spain', flag: 'Ã°Å¸â€¡ÂªÃ°Å¸â€¡Â¸' },
    { code: '+31', country: 'Netherlands', flag: 'Ã°Å¸â€¡Â³Ã°Å¸â€¡Â±' },
    { code: '+32', country: 'Belgium', flag: 'Ã°Å¸â€¡Â§Ã°Å¸â€¡Âª' },
    { code: '+41', country: 'Switzerland', flag: 'Ã°Å¸â€¡Â¨Ã°Å¸â€¡Â­' },
    { code: '+43', country: 'Austria', flag: 'Ã°Å¸â€¡Â¦Ã°Å¸â€¡Â¹' },
    { code: '+46', country: 'Sweden', flag: 'Ã°Å¸â€¡Â¸Ã°Å¸â€¡Âª' },
    { code: '+47', country: 'Norway', flag: 'Ã°Å¸â€¡Â³Ã°Å¸â€¡Â´' },
    { code: '+45', country: 'Denmark', flag: 'Ã°Å¸â€¡Â©Ã°Å¸â€¡Â°' },
    { code: '+358', country: 'Finland', flag: 'Ã°Å¸â€¡Â«Ã°Å¸â€¡Â®' },
    { code: '+7', country: 'Russia', flag: 'Ã°Å¸â€¡Â·Ã°Å¸â€¡Âº' },
    { code: '+61', country: 'Australia', flag: 'Ã°Å¸â€¡Â¦Ã°Å¸â€¡Âº' },
    { code: '+64', country: 'New Zealand', flag: 'Ã°Å¸â€¡Â³Ã°Å¸â€¡Â¿' },
    { code: '+55', country: 'Brazil', flag: 'Ã°Å¸â€¡Â§Ã°Å¸â€¡Â·' },
    { code: '+54', country: 'Argentina', flag: 'Ã°Å¸â€¡Â¦Ã°Å¸â€¡Â·' },
    { code: '+56', country: 'Chile', flag: 'Ã°Å¸â€¡Â¨Ã°Å¸â€¡Â±' },
    { code: '+57', country: 'Colombia', flag: 'Ã°Å¸â€¡Â¨Ã°Å¸â€¡Â´' },
    { code: '+52', country: 'Mexico', flag: 'Ã°Å¸â€¡Â²Ã°Å¸â€¡Â½' },
  ];

  useEffect(() => {
    if (isOpen && user?.phone) {
      // Extract country code and phone number from existing phone
      const phoneStr = user.phone;
      const foundCountry = countryCodes.find(country => phoneStr.startsWith(country.code));
      if (foundCountry) {
        setCountryCode(foundCountry.code);
        setPhone(phoneStr.substring(foundCountry.code.length));
      } else {
        setPhone(phoneStr);
      }
    } else if (isOpen) {
      setPhone('');
      setCountryCode('+92');
    }
  }, [isOpen, user]);

  const validatePhone = (phoneNumber, code) => {
    if (!phoneNumber || !code) return 'Phone number is required';
    if (!/^\d+$/.test(phoneNumber)) return 'Phone number must contain digits only';

    const countryRules = {
      '+92': { min: 10, max: 10, label: 'Pakistan' },
      '+1': { min: 10, max: 10, label: 'US/Canada' },
      '+44': { min: 10, max: 10, label: 'United Kingdom' },
      '+91': { min: 10, max: 10, label: 'India' }
    };
    const rule = countryRules[code];
    if (rule && (phoneNumber.length < rule.min || phoneNumber.length > rule.max)) {
      if (rule.min === rule.max) {
        return `${rule.label} numbers must be exactly ${rule.min} digits after ${code}`;
      }
      return `${rule.label} numbers must be ${rule.min}-${rule.max} digits after ${code}`;
    }

    const fullPhone = code + phoneNumber;
    const phoneRegex = /^\+[1-9]\d{1,14}$/; // International phone number format
    if (!phoneRegex.test(fullPhone)) return 'Please enter a valid phone number';
    if (phoneNumber.length < 7 || phoneNumber.length > 15) return 'Phone number must be between 7-15 digits';
    return '';
  };

  const handleAddPhone = async (e) => {
    e.preventDefault();
    const phoneError = validatePhone(phone, countryCode);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${AUTH_BASE_URL}/add-phone-number`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone: countryCode + phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Phone number added successfully!');
        // Set flag to prevent modal from showing again
        localStorage.setItem('phoneJustVerified', 'true');
        setTimeout(() => {
          onVerified();
          onClose();
        }, 1500);
      } else {
        setError(data.message || 'Failed to add phone number');
      }
    } catch (error) {
      setError('An error occurred while adding phone number');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#4E3B31]">
            Add Phone Number
          </h2>
          {!isExistingUser && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              Ãƒâ€”
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">{message}</span>
          </div>
        )}

        <form onSubmit={handleAddPhone}>
          <div className="mb-4">
            <label htmlFor="phone" className="block text-sm font-medium text-[#4E3B31] mb-1">
              Phone Number
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => {
                  const newCountryCode = e.target.value;
                  let phoneValue = phone;
                  
                  // Remove leading zero when country code changes
                  if (newCountryCode && phoneValue.startsWith('0')) {
                    phoneValue = phoneValue.substring(1);
                    setPhone(phoneValue);
                  }
                  
                  setCountryCode(newCountryCode);
                }}
                className="px-3 py-2 border border-[#a07855] text-[#4E3B31] rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm min-w-[120px]"
              >
                {countryCodes.map((country, index) => (
                  <option key={index} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  let phoneValue = e.target.value;
                  
                  // Remove leading zero if country code is selected
                  if (countryCode && phoneValue.startsWith('0')) {
                    phoneValue = phoneValue.substring(1);
                  }
                  
                  setPhone(phoneValue);
                }}
                className="flex-1 px-3 py-2 border border-[#a07855] text-[#4E3B31] rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm"
                placeholder="XXXXXXXXXX"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Enter your phone number. No verification code required.
            </p>
          </div>

          <div className="flex gap-3">
            {!isExistingUser && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-[#a07855] text-[#4E3B31] rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6b493d]"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`${isExistingUser ? 'w-full' : 'flex-1'} px-4 py-2 bg-[#6b493d] text-white rounded-md hover:bg-[#5a3c32] focus:outline-none focus:ring-2 focus:ring-[#6b493d] disabled:opacity-50`}
            >
              {loading ? 'Adding...' : 'Add Phone Number'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhoneVerificationModal;

