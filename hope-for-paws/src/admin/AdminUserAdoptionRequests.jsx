import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminAPI } from './api';

const AdminUserAdoptionRequests = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchUserRequests();
  }, [userId]);

  const fetchUserRequests = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getUserAdoptionRequests(userId);
      setRequests(data);
      
      // Extract user info from the first request if available
      if (data.length > 0 && data[0].requester) {
        setUser(data[0].requester);
      }
    } catch (err) {
      setError('Failed to fetch user adoption requests');
      console.error('Error fetching user adoption requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this adoption request?')) {
      return;
    }

    try {
      setDeleting(requestId);
      await adminAPI.deleteAdoptionRequest(requestId);
      setRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (err) {
      setError('Failed to delete adoption request');
      console.error('Error deleting adoption request:', err);
    } finally {
      setDeleting(null);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b493d]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#6b493d]">
              Adoption Requests for {user?.username || 'User'}
            </h1>
            {user && (
              <p className="text-[#a07855] mt-1">{user.email}</p>
            )}
          </div>
          <button
            onClick={() => navigate('/admin-dashboard/manage-users')}
            className="bg-[#6b493d] text-white px-4 py-2 rounded-lg hover:bg-[#5a3d32] transition-colors"
          >
            Back to Users
          </button>
        </div>
        
        {requests.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No adoption requests found for this user.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#f3e7d8]">
              <thead className="bg-[#f8f4ed]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#6b493d] uppercase tracking-wider">
                    Pet Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#6b493d] uppercase tracking-wider">
                    Contact Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#6b493d] uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#6b493d] uppercase tracking-wider">
                    Pet History Image
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#6b493d] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#6b493d] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#6b493d] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#f3e7d8]">
                {requests.map((request) => (
                  <tr key={request._id} className="hover:bg-[#f8f4ed] transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-semibold text-[#4E3B31]">
                          {request.adId?.name || 'Unknown Pet'}
                        </div>
                        <div className="text-sm text-[#a07855]">
                          {request.adId?.petType || 'Unknown Type'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-semibold text-[#4E3B31]">{request.name}</div>
                        <div className="text-sm text-[#a07855]">{request.email}</div>
                        <div className="text-sm text-[#a07855]">{request.phone}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-[#4E3B31] max-w-xs truncate">
                        {request.message}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {request.petHistoryImage ? (
                        <button
                          onClick={() => setSelectedImage(request.petHistoryImage)}
                          className="w-16 h-16 rounded-lg overflow-hidden border-2 border-[#a07855] hover:border-[#6b493d] transition-colors"
                        >
                          <img
                            src={request.petHistoryImage}
                            alt="Pet History"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">No image</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-[#4E3B31]">
                        {formatDate(request.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleDeleteRequest(request._id)}
                        disabled={deleting === request._id}
                        className="bg-red-100 border border-red-300 text-red-700 px-3 py-1 rounded hover:bg-red-200 text-xs font-semibold disabled:opacity-50"
                      >
                        {deleting === request._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#6b493d]">Pet History Image</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <img
              src={selectedImage}
              alt="Pet History"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminUserAdoptionRequests; 