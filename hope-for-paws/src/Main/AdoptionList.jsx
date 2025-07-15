import React, { useEffect, useState } from 'react';
import { useAdoption } from '../context/AdoptionContext';
import { useAuth } from '../context/AuthContext';
import AdoptionRequestForm from './AdoptionRequestForm';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { getCurrentUserId } from '../lib/utils';
import { getUserPublicProfile } from './api';
import { API_BASE_URL } from '../config';
import { getConversationBetweenUsers } from './api';

const AdoptionList = () => {
  const { allAdoptionPosts, loading, error, deleteAdoptionPost, requestAdoption, fetchAllAdoptionPosts } = useAdoption();
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [effectiveUser, setEffectiveUser] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [viewDetailsPost, setViewDetailsPost] = useState(null);
  const [userProfileImages, setUserProfileImages] = useState({});
  const [conversations, setConversations] = useState([]); // Add conversations state
  const navigate = useNavigate();

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

  // Fetch profile images for all unique userIds in posts
  useEffect(() => {
    const fetchProfileImages = async () => {
      const uniqueUserIds = Array.from(new Set(allAdoptionPosts.map(post => post.userId?._id).filter(Boolean)));
      const missingUserIds = uniqueUserIds.filter(id => !userProfileImages[id]);
      if (missingUserIds.length === 0) return;
      const newImages = {};
      for (const userId of missingUserIds) {
        try {
          const response = await getUserPublicProfile(userId);
          if (response.data && response.data.data && response.data.data.profileImage) {
            newImages[userId] = response.data.data.profileImage;
          }
        } catch (err) {
          // Ignore errors, fallback to initial
        }
      }
      if (Object.keys(newImages).length > 0) {
        setUserProfileImages(prev => ({ ...prev, ...newImages }));
      }
    };
    if (allAdoptionPosts.length > 0) {
      fetchProfileImages();
    }
    // eslint-disable-next-line
  }, [allAdoptionPosts]);

  // Fetch conversations for the current user (if not already done elsewhere)
  useEffect(() => {
    const fetchConversations = async () => {
      const currentUserId = getCurrentUserId(effectiveUser);
      if (!currentUserId) return;
      try {
        // This should be replaced with getUserConversations if available
        const response = await getConversationBetweenUsers(currentUserId, currentUserId); // Placeholder for getUserConversations
        if (Array.isArray(response?.data?.data)) {
          setConversations(response.data.data);
        }
      } catch (error) {
        // Ignore for now
      }
    };
    fetchConversations();
  }, [effectiveUser]);

  // Robust chat navigation handler (copied from Postnew.jsx)
  const handleStartConversation = async (postCreatorId, postCreatorUsername) => {
    const currentUserId = getCurrentUserId(effectiveUser);
    if (!effectiveUser) {
      navigate('/signin');
      return;
    }
    try {
      // First check if conversation exists in local state
      const existingConv = conversations.find(conv =>
        conv.participants && conv.participants.includes(currentUserId) &&
        conv.participants.includes(postCreatorId)
      );
      if (existingConv) {
        navigate('/chat', {
          state: {
            recipientId: postCreatorId,
            recipientUsername: postCreatorUsername,
            existingConversationId: existingConv._id
          }
        });
        return;
      }
      // If not found locally, check with backend
      const response = await getConversationBetweenUsers(currentUserId, postCreatorId);
      if (response.data) {
        navigate('/chat', {
          state: {
            recipientId: postCreatorId,
            recipientUsername: postCreatorUsername,
            existingConversationId: response.data._id
          }
        });
      } else {
        // No existing conversation - navigate with just user info
        navigate('/chat', {
          state: {
            recipientId: postCreatorId,
            recipientUsername: postCreatorUsername,
            isNewConversation: true
          }
        });
      }
    } catch (error) {
      console.error('Error checking conversation:', error);
      // Fallback - navigate with basic info
      navigate('/chat', {
        state: {
          recipientId: postCreatorId,
          recipientUsername: postCreatorUsername
        }
      });
    }
  };

  // Debug logs
  console.log('Current user:', user);
  console.log('Effective user:', effectiveUser);
  console.log('All adoption posts:', allAdoptionPosts);

  // Ensure allAdoptionPosts is always an array
  const posts = Array.isArray(allAdoptionPosts) ? allAdoptionPosts : [];

  const handleImageError = (postId) => {
    setImageErrors(prev => ({
      ...prev,
      [postId]: true
    }));
  };

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

  const ViewDetailsModal = ({ post, onClose }) => {
    if (!post) return null;

    const currentUserId = getCurrentUserId(effectiveUser);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#4E3B31]">Pet Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6">
            {/* Image */}
            <div className="relative mb-6">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-lg">
                {imageErrors[post._id] ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#e2d6cb] to-[#d6c7b8] text-[#6F4C3E]">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium">Pet Photo</p>
                      <p className="text-xs opacity-70">Image not available</p>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={post.imageUrl} 
                    alt={`${post.name} - ${post.petType} available for adoption`} 
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(post._id)}
                  />
                )}
              </div>
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold shadow-md backdrop-blur-sm
                  ${post.status === 'available' 
                    ? 'bg-green-100/90 text-green-800 border border-green-200' : 
                    post.status === 'pending' 
                      ? 'bg-yellow-100/90 text-yellow-800 border border-yellow-200' : 
                      'bg-red-100/90 text-red-800 border border-red-200'}`}>
                  {post.status.toUpperCase()}
                </span>
              </div>
            </div>
            
            {/* Pet Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-3xl font-bold text-[#4E3B31] mb-2">{post.name}</h3>
                <div className="flex items-center gap-4 mb-4">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-medium bg-[#e2d6cb] text-[#6F4C3E]">
                    {post.petType}
                  </span>
                  <span className="text-[#8B5A2B] font-medium text-lg">{post.age}  old</span>
                </div>
              </div>
              
              {/* Location */}
              <div className="flex items-center text-[#8B5A2B]">
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="text-base">{post.location || 'Location not specified'}</span>
              </div>
              
              {/* Description */}
              <div>
                <h4 className="text-lg font-semibold text-[#4E3B31] mb-3">About {post.name}</h4>
                <p className="text-gray-600 leading-relaxed text-base whitespace-pre-wrap">
                  {post.description}
                </p>
              </div>
              
              {/* Posted By */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    {post.userId?._id ? (
                      userProfileImages[post.userId._id] ? (
                        <img
                          src={`${API_BASE_URL.replace('/api', '')}${userProfileImages[post.userId._id]}`}
                          alt={post.userId?.username || 'User'}
                          className="w-7 h-7 rounded-full object-cover mr-2"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#F8F4ED] border-2 border-white shadow-md mr-2">
                          <span className="text-xs font-bold" style={{ color: '#6b493d' }}>
                            {(post.userId?.username || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )
                    ) : (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#F8F4ED] border-2 border-white shadow-md mr-2">
                        <span className="text-xs font-bold" style={{ color: '#6b493d' }}>
                          {(post.userId?.username || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span>Posted by {post.userId?._id ? (
                      <Link to={`/profile/public/${post.userId._id}`} className="font-medium text-[#6F4C3E] hover:underline">
                        {post.userId?.username || 'Anonymous'}
                      </Link>
                    ) : (
                      <span className="font-medium text-[#6F4C3E]">{post.userId?.username || 'Anonymous'}</span>
                    )}</span>
                  </div>
                  
                  {/* Chat Button */}
                  {effectiveUser && post.userId?._id !== currentUserId && (
                    <div className="relative group">
                      <button
                        onClick={() => handleStartConversation(
                          post.userId?._id,
                          post.userId?.username
                        )}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#6b493d]/10 hover:bg-[#6b493d]/20 text-[#6b493d] rounded-full transition-colors"
                        title={`Message ${post.userId?.username || 'this user'}`}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-xs font-medium">Chat</span>
                      </button>
                      <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 hidden group-hover:block bg-white shadow-lg rounded-lg p-2 text-sm whitespace-nowrap z-10">
                        Start private conversation
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => {
          // Debug log for each post
          console.log('Post:', post);
          console.log('Post status:', post.status);
          console.log('Post userId:', post.userId);
          console.log('Current user:', effectiveUser);
          
          const currentUserId = getCurrentUserId(effectiveUser);
          const isOwner = effectiveUser && (effectiveUser._id === post.userId?._id || effectiveUser._id === post.userId);
          const canRequest = post.status === 'available';
          const hasPendingRequest = post.status === 'pending';
          const isAdopted = post.status === 'adopted';
          
          console.log('Is owner:', isOwner);
          console.log('Can request:', canRequest);
          console.log('Has pending request:', hasPendingRequest);
          console.log('Is adopted:', isAdopted);
          
          return (
            <div key={post._id} className="bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-gray-100 flex flex-col h-full">
              {/* Professional Image Container */}
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0">
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-md backdrop-blur-sm
                    ${post.status === 'available' 
                      ? 'bg-green-100/90 text-green-800 border border-green-200' : 
                      post.status === 'pending' 
                        ? 'bg-yellow-100/90 text-yellow-800 border border-yellow-200' : 
                        'bg-red-100/90 text-red-800 border border-red-200'}`}>
                    {post.status.toUpperCase()}
                  </span>
                </div>
                
                {/* Image with proper aspect ratio */}
                <div className="aspect-[4/3] w-full overflow-hidden">
                  {imageErrors[post._id] ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#e2d6cb] to-[#d6c7b8] text-[#6F4C3E]">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium">Pet Photo</p>
                        <p className="text-xs opacity-70">Image not available</p>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={post.imageUrl} 
                      alt={`${post.name} - ${post.petType} available for adoption`} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                      onError={() => handleImageError(post._id)}
                    />
                  )}
                </div>
              </div>
              
              {/* Content Section - Flexible container */}
              <div className="p-6 flex flex-col flex-grow">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#4E3B31] mb-1">{post.name}</h2>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#e2d6cb] text-[#6F4C3E]">
                        {post.petType}
                      </span>
                      <span className="text-[#8B5A2B] font-medium">{post.age}  old</span>
                    </div>
                  </div>
                </div>
                
                {/* Location */}
                <div className="mb-4 flex items-center text-[#8B5A2B]">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{post.location || 'Location not specified'}</span>
                </div>
                
                {/* Description - Truncated */}
                <div className="mb-4 flex-grow">
                  <p className="text-gray-600 leading-relaxed line-clamp-3">
                    {post.description}
                  </p>
                  {post.description && post.description.length > 100 && (
                    <button 
                      onClick={() => setViewDetailsPost(post)}
                      className="text-[#8B5A2B] hover:text-[#6F4C3E] text-sm font-medium mt-2 transition-colors"
                    >
                      Read more...
                    </button>
                  )}
                </div>
                
                {/* Posted By */}
                <div className="mb-6 pb-4 border-b border-gray-100 mt-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      {post.userId?._id ? (
                        userProfileImages[post.userId._id] ? (
                          <img
                            src={`${API_BASE_URL.replace('/api', '')}${userProfileImages[post.userId._id]}`}
                            alt={post.userId?.username || 'User'}
                            className="w-5 h-5 rounded-full object-cover mr-2"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[#F8F4ED] border-2 border-white shadow-md mr-2">
                            <span className="text-xs font-bold" style={{ color: '#6b493d' }}>
                              {(post.userId?.username || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )
                      ) : (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[#F8F4ED] border-2 border-white shadow-md mr-2">
                          <span className="text-xs font-bold" style={{ color: '#6b493d' }}>
                            {(post.userId?.username || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span>Posted by {post.userId?._id ? (
                        <Link to={`/profile/public/${post.userId._id}`} className="font-medium text-[#6F4C3E] hover:underline">
                          {post.userId?.username || 'Anonymous'}
                        </Link>
                      ) : (
                        <span className="font-medium text-[#6F4C3E]">{post.userId?.username || 'Anonymous'}</span>
                      )}</span>
                    </div>
                    
                    {/* Chat Button */}
                    {effectiveUser && post.userId?._id !== currentUserId && (
                      <div className="relative group">
                        <button
                          onClick={() => handleStartConversation(
                            post.userId?._id,
                            post.userId?.username
                          )}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#6b493d]/10 hover:bg-[#6b493d]/20 text-[#6b493d] rounded-full transition-colors"
                          title={`Message ${post.userId?.username || 'this user'}`}
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-xs font-medium">Chat</span>
                        </button>
                        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 hidden group-hover:block bg-white shadow-lg rounded-lg p-2 text-sm whitespace-nowrap z-10">
                          Start private conversation
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Action Buttons - Fixed at bottom */}
                <div className="space-y-3 mt-auto">
                  {/* View Details Button - Always visible */}
                  <button 
                    onClick={() => setViewDetailsPost(post)}
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-200 hover:border-gray-300"
                  >
                    View Details
                  </button>
                  
                  {isOwner && (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => deleteAdoptionPost(post._id)}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 border border-red-200 hover:border-red-300"
                      >
                        Delete Post
                      </button>
                      <button 
                        onClick={() => {/* Open edit form */}}
                        className="flex-1 bg-[#e2d6cb] hover:bg-[#d6c7b8] text-[#6F4C3E] py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 border border-[#d6c7b8] hover:border-[#c9b8a9]"
                      >
                        Edit Post
                      </button>
                    </div>
                  )}
                  
                  {canRequest && !isOwner && (
                    <button 
                      onClick={() => handleRequestClick(post)}
                      className="w-full bg-gradient-to-r from-[#8B5A2B] to-[#6F4C3E] hover:from-[#6F4C3E] hover:to-[#5a3a2e] text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      Request Adoption
                    </button>
                  )}
                  
                  {hasPendingRequest && !isOwner && (
                    <div className="text-center py-3 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Adoption request pending review</span>
                      </div>
                    </div>
                  )}
                  
                  {isAdopted && (
                    <div className="text-center py-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">This pet has found a forever home!</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adoption Request Modal */}
      {selectedPost && (
        <AdoptionRequestForm
          postId={selectedPost._id}
          onClose={() => setSelectedPost(null)}
        />
      )}
      {/* View Details Modal */}
      {viewDetailsPost && (
        <ViewDetailsModal 
          post={viewDetailsPost}
          onClose={() => setViewDetailsPost(null)}
        />
      )}
    </div>
  );
};

export default AdoptionList;