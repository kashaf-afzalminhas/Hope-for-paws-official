import React, { useState, useEffect } from 'react';
import { useAdoption } from '../context/AdoptionContext';
import { useAuth } from '../context/AuthContext';
import { Pencil, Trash2, X, Check, X as XIcon } from "lucide-react";

const MyAdoptions = () => {
  const { userAdoptionPosts, loading, error, fetchUserAdoptions, deleteAdoptionPost, updateAdoptionPost, handleAdoptionRequest } = useAdoption();
  const { user } = useAuth();
  const [editingPost, setEditingPost] = useState(null);
  const [editData, setEditData] = useState({
    name: '',
    age: '',
    petType: '',
    description: ''
  });
  const [loadingState, setLoading] = useState({ action: false });

  // Check user authentication state directly from storage
  const storedUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
  console.log("MyAdoptions - Stored user:", storedUser);

  useEffect(() => {
    // Use stored user if context user is not available
    const effectiveUser = user || storedUser;
    console.log("MyAdoptions - Effective user:", effectiveUser);
    
    if (effectiveUser?._id || effectiveUser?.id) {
      const userId = effectiveUser._id || effectiveUser.id;
      
      // Only fetch if we don't already have data or if the user has changed
      if (!userAdoptionPosts.length) {
        console.log('MyAdoptions - Fetching adoptions for user:', userId);
        fetchUserAdoptions(userId).catch(error => {
          console.error('MyAdoptions - Error fetching adoptions:', error);
        });
      } else {
        console.log('MyAdoptions - Already have adoption posts, skipping fetch');
      }
    } else {
      console.log('MyAdoptions - No user ID available');
    }
  }, [user, storedUser]);

  // Debug render
  console.log('MyAdoptions - Current state:', {
    loading: loading.user,
    error: error.user,
    postsCount: userAdoptionPosts?.length,
    user: user?._id || user?.id,
    storedUser: storedUser?._id || storedUser?.id,
    posts: userAdoptionPosts
  });

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this adoption post?")) return;
    try {
      await deleteAdoptionPost(postId);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post._id);
    setEditData({
      name: post.name,
      age: post.age,
      petType: post.petType,
      description: post.description
    });
  };

  const handleSaveEdit = async (postId) => {
    try {
      await updateAdoptionPost(postId, editData);
      setEditingPost(null);
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleRequestAction = async (postId, requestId, action) => {
    try {
      console.log(`Handling ${action} request for post ${postId}, request ${requestId}`);
      
      // Show loading state
      setLoading(prev => ({ ...prev, action: true }));
      
      await handleAdoptionRequest(postId, requestId, action);
      
      // Show success message
      const message = action === 'accept' 
        ? 'Adoption request accepted successfully' 
        : 'Adoption request rejected';
      
      // You could add a toast notification here if you have one
      alert(message);
      
      // Refresh the posts to ensure we have the latest data
      const userId = user?._id || user?.id || storedUser?._id || storedUser?.id;
      if (userId) {
        fetchUserAdoptions(userId);
      }
    } catch (error) {
      console.error('Error handling adoption request:', error);
      alert(`Failed to ${action} request: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  if (loading.user) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6b493d] border-t-transparent"></div>
    </div>
  );

  if (error.user) return (
    <div className="mt-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
      <p className="font-semibold">Error loading adoption posts</p>
      <p className="text-sm mt-2">{error.user}</p>
    </div>
  );

  // Check if user is logged in using both context and storage
  const isLoggedIn = user || storedUser;
  
  if (!isLoggedIn) {
    return (
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl text-center">
        <p>Please log in to view your adoption posts.</p>
      </div>
    );
  }

  if (!userAdoptionPosts || userAdoptionPosts.length === 0) {
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
          {userAdoptionPosts.map((post) => (
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

              {/* Add adoption requests section */}
              {post.requests && post.requests.length > 0 ? (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="text-lg font-semibold text-[#6b493d] mb-3">Adoption Requests ({post.requests.length})</h4>
                  <div className="space-y-3">
                    {post.requests.map((request) => (
                      <div key={request._id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
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
                        {request.status === 'accepted' && (
                          <p className="mt-2 text-sm text-green-600 font-medium">
                            This request has been accepted. The pet is now adopted.
                          </p>
                        )}
                        {request.status === 'rejected' && (
                          <p className="mt-2 text-sm text-red-600 font-medium">
                            This request has been rejected.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500 italic">No adoption requests yet</p>
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
