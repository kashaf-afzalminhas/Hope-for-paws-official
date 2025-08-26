import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Pencil, Trash2, X, Eye } from "lucide-react";
import axios from 'axios';
import { API_BASE_URL } from '../config';
import AdoptionRequestsModal from './AdoptionRequestsModal';

const MyAdoptions = () => {
  const [adoptions, setAdoptions] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [editData, setEditData] = useState({
    name: '',
    age: '',
    petType: '',
    breed: '',
    vaccinated: '',
    neuteredSpayed: '',
    description: '',
    location: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedPostForRequests, setSelectedPostForRequests] = useState(null);
  const { user } = useAuth();
  const [storedUser, setStoredUser] = useState(null);
  const location = useLocation();

  // Get user from storage if context user is not available
  useEffect(() => {
    const userFromStorage = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
    setStoredUser(userFromStorage);
  }, []);

  // Check for success message from navigation state
  useEffect(() => {
    if (location.state?.showSuccess && location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the navigation state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
      
      // Auto-hide success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Fetch adoptions when user is available
  useEffect(() => {
    const effectiveUser = user || storedUser;
    if (!effectiveUser?.id) return;

    fetchUserAdoptions(effectiveUser.id);
  }, [user, storedUser]);

  const fetchUserAdoptions = async (userId) => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token missing');
      }

      // Always include requests in the fetch
      const response = await axios.get(
        `${API_BASE_URL}/adoptions/user/${userId}?includeRequests=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAdoptions(response.data);
    } catch (err) {
      console.error('Error fetching adoptions:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load adoption posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this adoption post?")) return;
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.delete(
        `${API_BASE_URL}/adoptions/${postId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh the list after deletion
      const effectiveUser = user || storedUser;
      if (effectiveUser?.id) {
        fetchUserAdoptions(effectiveUser.id);
      }
    } catch (err) {
      console.error('Error deleting adoption post:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete post');
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post._id);
    setEditData({
      name: post.name,
      age: post.age,
      petType: post.petType,
      breed: post.breed || '',
      vaccinated: post.vaccinated || '',
      neuteredSpayed: post.neuteredSpayed || '',
      description: post.description,
      location: post.location || ''
    });
  };

  const handleSaveEdit = async (postId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/adoptions/${postId}`,
        editData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEditingPost(null);
      
      // Refresh the list after update
      const effectiveUser = user || storedUser;
      if (effectiveUser?.id) {
        fetchUserAdoptions(effectiveUser.id);
      }
    } catch (err) {
      console.error('Error updating adoption post:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update post');
    }
  };

  const handleRequestAction = async (postId, requestId, action) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/adoptions/requests/${requestId}`,
        { status: action === 'accept' ? 'accepted' : 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`Request ${action === 'accept' ? 'accepted' : 'rejected'} successfully`);
      
      // Refresh the list after action
      const effectiveUser = user || storedUser;
      if (effectiveUser?.id) {
        fetchUserAdoptions(effectiveUser.id);
      }
    } catch (err) {
      console.error('Error handling adoption request:', err);
      alert(`Failed to ${action} request: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleStatusChange = async (postId, newStatus) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/adoptions/${postId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state immediately for better UX
      setAdoptions(prev => prev.map(post => 
        post._id === postId ? { ...post, status: newStatus } : post
      ));
      
      // Show success message
      setSuccessMessage(`Status updated to ${newStatus} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('Error updating status:', err);
      setError(`Failed to update status: ${err.response?.data?.message || err.message}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleViewRequests = (post) => {
    setSelectedPostForRequests(post);
  };

  const handleCloseRequestsModal = () => {
    setSelectedPostForRequests(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6b493d] border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
        <p className="font-semibold">Error loading adoption posts</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (!user && !storedUser) {
    return (
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl text-center">
        <p>Please log in to view your adoption posts.</p>
      </div>
    );
  }

  if (adoptions.length === 0) {
    return (
      <div className="bg-[#c9a280]/20 rounded-xl p-8 text-center border-2 border-dashed border-[#6b493d]/30">
        <p className="text-xl text-[#6b493d]/80 italic">No adoption posts yet. Create your first adoption post!</p>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-[#f5f3ed] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h3 className="text-3xl font-bold text-[#6b493d] mb-8 text-center" style={{ fontFamily: '"Playfair Display", serif' }}>
          My Adoption Posts
        </h3>

        {successMessage && (
          <div className="mt-4 mb-8 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-center">
            <p>{successMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {adoptions.map((post) => (
            <div key={post._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="relative group">
                <img 
                  src={post.imageUrl} 
                  alt={post.name} 
                  className="w-full h-60 object-contain rounded-t-2xl transition-transform duration-300 hover:scale-105 bg-gray-100" 
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/400x300?text=Pet+Image';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#6b493d]/40 to-transparent rounded-t-2xl" />
              </div>
              
              <div className="p-6">
                {editingPost === post._id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d] mb-2"
                      placeholder="Pet Name"
                    />
                    <input
                      type="text"
                      value={editData.age}
                      onChange={(e) => setEditData({...editData, age: e.target.value})}
                      className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d] mb-2"
                      placeholder="Age"
                    />
                    <input
                      type="text"
                      value={editData.petType}
                      onChange={(e) => setEditData({...editData, petType: e.target.value})}
                      className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d] mb-2"
                      placeholder="Pet Type"
                    />
                    <input
                      type="text"
                      value={editData.breed}
                      onChange={(e) => setEditData({...editData, breed: e.target.value})}
                      className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d] mb-2"
                      placeholder="Breed"
                    />
                    <select
                      value={editData.vaccinated}
                      onChange={(e) => setEditData({...editData, vaccinated: e.target.value})}
                      className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d] mb-2"
                    >
                      <option value="">Select vaccination status</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    <select
                      value={editData.neuteredSpayed}
                      onChange={(e) => setEditData({...editData, neuteredSpayed: e.target.value})}
                      className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d] mb-2"
                    >
                      <option value="">Select neutering status</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                      className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d]"
                      rows={3}
                      placeholder="Description"
                    />
                    <input
                      type="text"
                      value={editData.location}
                      onChange={(e) => setEditData({...editData, location: e.target.value})}
                      className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d] mb-2"
                      placeholder="Location"
                    />
                    <div className="flex justify-end space-x-3">
                      <button 
                        onClick={() => setEditingPost(null)}
                        className="p-2 hover:bg-[#6b493d]/10 rounded-full transition-colors"
                      >
                        <X className="h-5 w-5 text-[#6b493d]" />
                      </button>
                      <button
                        onClick={() => handleSaveEdit(post._id)}
                        className="px-4 py-2 bg-[#6b493d] text-white rounded-lg hover:bg-[#5a3d32] transition-colors"
                        style={{ fontFamily: '"Poppins", sans-serif' }}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-bold text-[#6b493d] mb-2">{post.name}</h2>
                    <p className="text-[#6b493d] mb-1"><span className="font-semibold">Age:</span> {post.age} years</p>
                    <p className="text-[#6b493d] mb-1"><span className="font-semibold">Type:</span> {post.petType}</p>
                    {post.breed && (
                      <p className="text-[#6b493d] mb-1"><span className="font-semibold">Breed:</span> {post.breed}</p>
                    )}
                    
                    {/* Health Status Badges - Only show if any health info exists */}
                    {(post.vaccinated || post.neuteredSpayed) && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.vaccinated && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            post.vaccinated === 'Yes' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {post.vaccinated === 'Yes' ? '✓ Vaccinated' : '✗ Not Vaccinated'}
                          </span>
                        )}
                        {post.neuteredSpayed && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            post.neuteredSpayed === 'Yes' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-orange-100 text-orange-800 border border-orange-200'
                          }`}>
                            {post.neuteredSpayed === 'Yes' ? '✓ Neutered/Spayed' : '✗ Not Neutered/Spayed'}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <p className="text-[#6b493d] mb-4 italic">{post.description}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Posted by: {post.userId?.username || 'Anonymous'}
                    </p>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status:</label>
                      <select
                        value={post.status}
                        onChange={(e) => handleStatusChange(post._id, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm font-medium ${
                          post.status === 'available' ? 'border-green-300 bg-green-50 text-green-700' : 
                          post.status === 'pending' ? 'border-yellow-300 bg-yellow-50 text-yellow-700' : 
                          'border-red-300 bg-red-50 text-red-700'
                        }`}
                      >
                        <option value="available">Available</option>
                        <option value="adopted">Adopted</option>
                      </select>
                    </div>
                    <p className="text-[#6b493d] mb-1"><span className="font-semibold">Location:</span> {post.location || 'Location not specified'}</p>
                    
                    {post.status === 'adopted' && (
                      <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-700 font-medium">This pet has been adopted!</p>
                      </div>
                    )}

                    {/* Requests Summary */}
                    {post.requests && post.requests.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-700 font-medium">
                              {post.requests.length} adoption request{post.requests.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <button
                            onClick={() => handleViewRequests(post)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          >
                            View Requests
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleEdit(post)}
                        className="p-2 hover:bg-[#6b493d]/10 rounded-full transition-colors"
                      >
                        <Pencil className="h-5 w-5 text-[#6b493d]" />
                      </button>
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="p-2 hover:bg-[#6b493d]/10 rounded-full transition-colors"
                      >
                        <Trash2 className="h-5 w-5 text-[#6b493d]" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Requests Modal */}
      {selectedPostForRequests && (
        <AdoptionRequestsModal
          post={selectedPostForRequests}
          requests={selectedPostForRequests.requests || []}
          onClose={handleCloseRequestsModal}
          onRequestAction={handleRequestAction}
          onRefresh={() => {
            const effectiveUser = user || storedUser;
            if (effectiveUser?.id) {
              fetchUserAdoptions(effectiveUser.id);
            }
          }}
        />
      )}
    </section>
  );
};

export default MyAdoptions;