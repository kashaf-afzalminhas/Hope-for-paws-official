import React, { useState, useEffect } from 'react';
import { AUTH_BASE_URL } from '../config';
import PhoneNumberInput, { getFullPhoneNumber, parsePhoneNumber, validatePhone } from './PhoneNumberInput';

const PhoneVerificationModal = ({ isOpen, onClose, onVerified, user, isExistingUser = false }) => {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+92');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen && user?.phone) {
      const parsedPhone = parsePhoneNumber(user.phone);
      setCountryCode(parsedPhone.countryCode);
      setPhone(parsedPhone.phone);
    } else if (isOpen) {
      setPhone('');
      setCountryCode('+92');
    }
  }, [isOpen, user]);

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
        body: JSON.stringify({ phone: getFullPhoneNumber(phone, countryCode) }),
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
              ×
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
              <PhoneNumberInput
                phone={phone}
                countryCode={countryCode}
                required
                disabled={loading}
                touched={Boolean(error)}
                error={error}
                label={null}
                onChange={({ phone: nextPhone, countryCode: nextCountryCode, error: nextError }) => {
                  setPhone(nextPhone);
                  setCountryCode(nextCountryCode);
                  setError(nextError);
                }}
              />
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

