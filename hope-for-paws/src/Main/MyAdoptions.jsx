import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Pencil, Trash2, X, Check, X as XIcon } from "lucide-react";
import axios from 'axios';
import { API_BASE_URL } from '../config';

const MyAdoptions = () => {
  const [adoptions, setAdoptions] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [editData, setEditData] = useState({
    name: '',
    age: '',
    petType: '',
    description: '',
    location: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [storedUser, setStoredUser] = useState(null);

  // Get user from storage if context user is not available
  useEffect(() => {
    const userFromStorage = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
    setStoredUser(userFromStorage);
  }, []);

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {adoptions.map((post) => (
            <div key={post._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="relative group">
                <img 
                  src={post.imageUrl} 
                  alt={post.name} 
                  className="w-full h-60 object-cover rounded-t-2xl transition-transform duration-300 hover:scale-105" 
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
                    <p className="text-[#6b493d] mb-4 italic">{post.description}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Posted by: {post.userId?.username || 'Anonymous'}
                    </p>
                    <p className={`text-sm font-medium mb-4 ${
                      post.status === 'available' ? 'text-green-600' : 
                      post.status === 'pending' ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      Status: {post.status}
                    </p>
                    <p className="text-[#6b493d] mb-1"><span className="font-semibold">Location:</span> {post.location || 'Location not specified'}</p>
                    
                    {post.status === 'adopted' && (
                      <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-green-700 font-medium">This pet has been adopted!</p>
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

              {post.requests && post.requests.length > 0 && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-semibold text-[#6b493d] mb-3">Adoption Requests ({post.requests.length})</h4>
                  <div className="space-y-3">
                    {post.requests.map((request) => (
                      <div key={request._id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{request.name}</p>
                            <p className="text-sm text-gray-600">{request.email}</p>
                            <p className="text-sm text-gray-600">{request.phone}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-700">{request.message}</p>
                        
                        {/* Display Pet History Image */}
                        {request.petHistoryImage && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-gray-600 mb-2">Pet History Proof:</p>
                            <div className="relative">
                              <img 
                                src={request.petHistoryImage} 
                                alt="Pet History Proof" 
                                className="w-full h-32 object-cover rounded-md border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => {
                                  // Open image in a modal or new tab
                                  window.open(request.petHistoryImage, '_blank');
                                }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                                }}
                              />
                              <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                Click to enlarge
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {request.status === 'pending' && post.status === 'available' && (
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => handleRequestAction(post._id, request._id, 'accept')}
                              className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleRequestAction(post._id, request._id, 'reject')}
                              className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                            >
                              <XIcon className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MyAdoptions;