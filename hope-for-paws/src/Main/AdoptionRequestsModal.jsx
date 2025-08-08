import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const AdoptionRequestsModal = ({ post, requests, onClose, onRequestAction, onRefresh }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRequestAction = async (requestId, action) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/adoptions/requests/${requestId}`,
        { status: action === 'accept' ? 'accepted' : 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Call the parent's onRequestAction to update the UI
      await onRequestAction(post._id, requestId, action);

      // Refresh the data
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error handling adoption request:', err);
      alert(`Failed to ${action} request: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl mx-auto max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-start sm:items-center">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-[#4E3B31]">Adoption Requests</h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {post.name} - {post.petType} • {requests.length} request{requests.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2 ml-2 flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {requests.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">No Requests Yet</h3>
              <p className="text-gray-500 text-sm sm:text-base">No one has requested to adopt this pet yet.</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {requests.map((request) => (
                <div key={request._id} className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200">
                  {/* Request Header */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-[#4E3B31] break-words">{request.name}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-xs sm:text-sm text-gray-600">
                        <span className="break-all">{request.email}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{request.phone}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{formatDate(request.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(request.status)} self-start sm:self-auto`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>

                  {/* Message */}
                  <div className="mb-4">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Message:</h4>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{request.message}</p>
                  </div>

                  {/* Pet History Image */}
                  {request.petHistoryImage && (
                    <div className="mb-4">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Pet History Proof:</h4>
                      <div className="relative inline-block">
                        <img
                          src={request.petHistoryImage}
                          alt="Pet History Proof"
                          className="w-32 h-20 sm:w-48 sm:h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage(request.petHistoryImage)}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                          }}
                        />
                        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-black bg-opacity-50 text-white text-xs px-1 sm:px-2 py-1 rounded">
                          Click to enlarge
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {request.status === 'pending' && post.status === 'available' && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleRequestAction(request._id, 'accept')}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                      >
                        <Check className="w-4 h-4" />
                        {loading ? 'Processing...' : 'Accept Request'}
                      </button>
                      <button
                        onClick={() => handleRequestAction(request._id, 'reject')}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                      >
                        <X className="w-4 h-4" />
                        {loading ? 'Processing...' : 'Reject Request'}
                      </button>
                    </div>
                  )}

                  {/* Status Messages */}
                  {request.status === 'accepted' && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        <span className="text-green-700 font-medium text-sm sm:text-base">Request accepted</span>
                      </div>
                    </div>
                  )}

                  {request.status === 'rejected' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                        <span className="text-red-700 font-medium text-sm sm:text-base">Request rejected</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={selectedImage}
              alt="Pet History Proof"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors"
            >
              <X className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

AdoptionRequestsModal.propTypes = {
  post: PropTypes.object.isRequired,
  requests: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onRequestAction: PropTypes.func.isRequired,
  onRefresh: PropTypes.func
};

export default AdoptionRequestsModal; 