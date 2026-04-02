import PropTypes from 'prop-types';
import { useState } from 'react';

const UserTypeModal = ({ open, onClose, onSelect, username }) => {
  const [showSellerFields, setShowSellerFields] = useState(false);
  const [sellerData, setSellerData] = useState({
    businessName: '',
    cnic: '',
    location: ''
  });
  const [sellerErrors, setSellerErrors] = useState({});

  if (!open) return null;

  const handleSellerChange = (field, value) => {
    if (field === 'cnic') {
      // Auto-format CNIC
      let formatted = value.replace(/[^0-9-]/g, '');
      const digits = formatted.replace(/-/g, '');
      if (digits.length <= 5) {
        formatted = digits;
      } else if (digits.length <= 12) {
        formatted = `${digits.slice(0, 5)}-${digits.slice(5)}`;
      } else {
        formatted = `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
      }
      value = formatted;
    }
    setSellerData(prev => ({ ...prev, [field]: value }));
    if (sellerErrors[field]) {
      setSellerErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateSellerFields = () => {
    const errors = {};
    if (!sellerData.businessName.trim()) {
      errors.businessName = 'Business name is required';
    }
    if (!sellerData.cnic.trim()) {
      errors.cnic = 'CNIC is required';
    } else if (!/^[0-9]{5}-[0-9]{7}-[0-9]$/.test(sellerData.cnic)) {
      errors.cnic = 'CNIC format should be 12345-1234567-1';
    }
    if (!sellerData.location.trim()) {
      errors.location = 'Location is required';
    }
    setSellerErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSellerSubmit = () => {
    if (validateSellerFields()) {
      onSelect('seller', sellerData);
    }
  };

  const handleBack = () => {
    setShowSellerFields(false);
    setSellerData({ businessName: '', cnic: '', location: '' });
    setSellerErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        
        {!showSellerFields ? (
          <>
            <h2 className="text-xl font-bold mb-4 text-center">Welcome, {username || 'User'}!</h2>
            <p className="mb-6 text-center">How would you like to register?</p>
            <div className="flex flex-col gap-3">
              <button
                className="w-full py-3 px-4 rounded-lg bg-[#6b493d] text-white font-semibold hover:bg-[#4E3B31] transition"
                onClick={() => onSelect('user')}
              >
                🐾 Regular User
              </button>
              <button
                className="w-full py-3 px-4 rounded-lg bg-[#a07855] text-white font-semibold hover:bg-[#6b493d] transition"
                onClick={() => onSelect('veterinarian')}
              >
                🩺 Veterinarian
              </button>
              <button
                className="w-full py-3 px-4 rounded-lg bg-[#5a8f5a] text-white font-semibold hover:bg-[#4a7a4a] transition"
                onClick={() => setShowSellerFields(true)}
              >
                🏪 Seller
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              className="absolute top-2 left-2 text-gray-400 hover:text-gray-600"
              onClick={handleBack}
              aria-label="Back"
            >
              ← Back
            </button>
            <h2 className="text-xl font-bold mb-4 text-center mt-4">Seller Information</h2>
            <p className="mb-4 text-center text-sm text-gray-600">
              Please provide your business details to register as a seller.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business/Shop Name *</label>
                <input
                  type="text"
                  value={sellerData.businessName}
                  onChange={(e) => handleSellerChange('businessName', e.target.value)}
                  className={`w-full px-3 py-2 border ${sellerErrors.businessName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6b493d]`}
                  placeholder="Enter business name"
                />
                {sellerErrors.businessName && (
                  <p className="text-xs text-red-600 mt-1">{sellerErrors.businessName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNIC Number *</label>
                <input
                  type="text"
                  value={sellerData.cnic}
                  onChange={(e) => handleSellerChange('cnic', e.target.value)}
                  maxLength={15}
                  className={`w-full px-3 py-2 border ${sellerErrors.cnic ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6b493d]`}
                  placeholder="12345-1234567-1"
                />
                {sellerErrors.cnic ? (
                  <p className="text-xs text-red-600 mt-1">{sellerErrors.cnic}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Format: 12345-1234567-1</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  type="text"
                  value={sellerData.location}
                  onChange={(e) => handleSellerChange('location', e.target.value)}
                  className={`w-full px-3 py-2 border ${sellerErrors.location ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6b493d]`}
                  placeholder="City, Country"
                />
                {sellerErrors.location && (
                  <p className="text-xs text-red-600 mt-1">{sellerErrors.location}</p>
                )}
              </div>

              <button
                className="w-full py-3 px-4 rounded-lg bg-[#5a8f5a] text-white font-semibold hover:bg-[#4a7a4a] transition mt-2"
                onClick={handleSellerSubmit}
              >
                Register as Seller
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

UserTypeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  username: PropTypes.string,
};

export default UserTypeModal; 