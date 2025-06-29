import React, { useEffect, useState } from 'react';
import { useAdoption } from '../context/AdoptionContext';
import { useAuth } from '../context/AuthContext';
import AdoptionRequestForm from './AdoptionRequestForm';
import { Link } from 'react-router-dom';

const AdoptionList = () => {
  const { allAdoptionPosts, loading, error, deleteAdoptionPost, requestAdoption, fetchAllAdoptionPosts } = useAdoption();
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [effectiveUser, setEffectiveUser] = useState(null);

  // Check for user in localStorage/sessionStorage if not in context
  useEffect(() => {
    if (!user) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
        console.log('Stored user found:', storedUser);
        if (storedUser) {
          setEffectiveUser(storedUser);
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    } else {
      setEffectiveUser(user);
    }
  }, [user]);

  useEffect(() => {
    // Only fetch if we don't already have data
    if (!allAdoptionPosts.length) {
      console.log('AdoptionList - Fetching all adoption posts');
      fetchAllAdoptionPosts();
    } else {
      console.log('AdoptionList - Already have adoption posts, skipping fetch');
    }
  }, []);

  // Debug logs
  console.log('Current user:', user);
  console.log('Effective user:', effectiveUser);
  console.log('All adoption posts:', allAdoptionPosts);

  // Ensure allAdoptionPosts is always an array
  const posts = Array.isArray(allAdoptionPosts) ? allAdoptionPosts : [];

  if (loading.all) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B5A2B]"></div>
    </div>
  );
  
  if (error.all) return (
    <div className="bg-red-100 text-red-700 p-4 rounded-lg shadow-md">
      {error.all}
    </div>
  );

  if (posts.length === 0) {
    return (
      <div className="text-center py-10 bg-[#e2d6cb] rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-[#6F4C3E]">No adoption posts available.</h2>
        <p className="text-[#8B5A2B] mt-2">Check back later for adorable pets looking for forever homes!</p>
      </div>
    );
  }

  const handleRequestClick = (post) => {
    if (!effectiveUser) {
      setShowLoginPrompt(true);
      return;
    }
    setSelectedPost(post);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#4E3B31] mb-8 text-center">Pets Looking for Forever Homes</h1>
      
      {showLoginPrompt && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-center">
          <p className="mb-2">You need to be logged in to request adoption.</p>
          <Link to="/login" className="text-[#6b493d] font-medium hover:underline">
            Log in to continue
          </Link>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => {
          // Debug log for each post
          console.log('Post:', post);
          console.log('Post status:', post.status);
          console.log('Post userId:', post.userId);
          console.log('Current user:', effectiveUser);
          
          const isOwner = effectiveUser && (effectiveUser._id === post.userId?._id || effectiveUser._id === post.userId);
          const canRequest = post.status === 'available';
          const hasPendingRequest = post.status === 'pending';
          const isAdopted = post.status === 'adopted';
          
          console.log('Is owner:', isOwner);
          console.log('Can request:', canRequest);
          console.log('Has pending request:', hasPendingRequest);
          console.log('Is adopted:', isAdopted);
          
          return (
            <div key={post._id} className="bg-white rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="relative h-64 overflow-hidden bg-gray-200">
                <img 
                  src={post.imageUrl} 
                  alt={post.name} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/400x300?text=Pet+Image';
                  }}
                />
                <div className="absolute top-2 right-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold 
                    ${post.status === 'available' ? 'bg-green-100 text-green-800' : 
                      post.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}`}>
                    {post.status}
                  </span>
                </div>
              </div>
              
              <div className="p-5 border-t border-[#e2d6cb]">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold text-[#4E3B31]">{post.name}</h2>
                  <div className="flex items-center">
                    <span className="text-sm text-[#8B5A2B]">{post.age} years</span>
                  </div>
                </div>
                
                <div className="mt-2">
                  <span className="inline-block bg-[#e2d6cb] text-[#6F4C3E] px-2 py-1 rounded-md text-sm font-medium">
                    {post.petType}
                  </span>
                </div>
                {/* Location display */}
                <div className="mt-1 text-sm text-[#8B5A2B]">
                  <span className="font-semibold">Location:</span> {post.location || 'Location not specified'}
                </div>
                
                <p className="mt-3 text-gray-600 line-clamp-3">{post.description}</p>
                
                <div className="mt-2 text-sm text-gray-500">
                  Posted by: {post.userId?.username || 'Anonymous'}
                </div>
                
                <div className="mt-5 flex flex-col gap-2">
                  {isOwner && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => deleteAdoptionPost(post._id)}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200"
                      >
                        Delete
                      </button>
                      <button 
                        onClick={() => {/* Open edit form */}}
                        className="flex-1 bg-[#e2d6cb] hover:bg-[#d6c7b8] text-[#6F4C3E] py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                  
                  {canRequest && !isOwner && (
                    <button 
                      onClick={() => handleRequestClick(post)}
                      className="w-full bg-[#8B5A2B] hover:bg-[#6F4C3E] text-white py-2 px-4 rounded-md font-medium transition-colors duration-200"
                    >
                      Request Adoption
                    </button>
                  )}
                  
                  {hasPendingRequest && !isOwner && (
                    <div className="text-center py-2 bg-yellow-50 text-yellow-700 rounded-md">
                      <p className="font-medium">Adoption request pending review</p>
                    </div>
                  )}
                  
                  {isAdopted && (
                    <div className="text-center py-2 bg-red-50 text-red-700 rounded-md">
                      <p className="font-medium">This pet has been adopted</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPost && (
        <AdoptionRequestForm
          postId={selectedPost._id}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
};

export default AdoptionList;
