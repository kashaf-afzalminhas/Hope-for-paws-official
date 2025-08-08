import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger' // 'danger', 'warning', 'info'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
          confirmButton: 'bg-red-500 hover:bg-red-600 text-white',
          cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
          confirmButton: 'bg-yellow-500 hover:bg-yellow-600 text-white',
          cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        };
      default:
        return {
          icon: <AlertTriangle className="h-6 w-6 text-[#6b493d]" />,
          confirmButton: 'bg-[#6b493d] hover:bg-[#5a3c32] text-white',
          cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        };
    }
  };

  const styles = getTypeStyles();

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            {styles.icon}
            <h3 className="text-base sm:text-lg font-semibold text-[#6b493d] break-words">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base break-words">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className={`flex-1 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${styles.cancelButton}`}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${styles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 