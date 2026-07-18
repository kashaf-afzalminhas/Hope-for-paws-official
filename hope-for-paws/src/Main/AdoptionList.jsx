import React, { useEffect, useState } from 'react';
import { useAdoption } from '../context/AdoptionContext';
import { useAuth } from '../context/AuthContext';
import AdoptionRequestForm from './AdoptionRequestForm';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserId } from '../lib/utils';
import { getUserPublicProfile } from './api';
import { API_BASE_URL } from '../config';
import { getConversationBetweenUsers } from './api';
import PropTypes from 'prop-types';
import AdoptionCard from '../components/adoption/AdoptionCard';
import AdoptionDetailsModal from '../components/adoption/AdoptionDetailsModal';
import {
  adoptionGridClass,
  adoptionBtnPrimary,
  adoptionBtnSecondary,
  adoptionBtnDanger,
  adoptionAlertInfo,
  getPosterProfileId,
} from '../components/adoption/adoptionTheme';
import { useRequireAuth } from '../Components/AuthGuard';

const AdoptionList = ({ filter = 'all' }) => {
  const { allAdoptionPosts, loading, error, deleteAdoptionPost, requestAdoption, fetchAllAdoptionPosts, checkUserRequest } = useAdoption();
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const [selectedPost, setSelectedPost] = useState(null);
  const [effectiveUser, setEffectiveUser] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [viewDetailsPost, setViewDetailsPost] = useState(null);
  const [userProfileImages, setUserProfileImages] = useState({});
  const [conversations, setConversations] = useState([]); // Add conversations state
  const [userRequests, setUserRequests] = useState({}); // Track user requests for each post
  const navigate = useNavigate();

  // Check for user in localStorage/sessionStorage if not in context
  useEffect(() => {
    if (!user) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
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
      fetchAllAdoptionPosts();
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

  const refreshUserRequestsForPosts = async (posts = allAdoptionPosts) => {
    if (!effectiveUser || !posts.length) return;
      const requests = {};
    for (const post of posts) {
        try {
          const requestInfo = await checkUserRequest(post._id);
          requests[post._id] = requestInfo;
      } catch (err) {
        console.error(`Error checking request for post ${post._id}:`, err);
        requests[post._id] = { hasRequest: false, requestStatus: null, requestId: null, postStatus: null };
      }
      }
      setUserRequests(requests);
    };
    
  useEffect(() => {
    refreshUserRequestsForPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUser, allAdoptionPosts]);

  useEffect(() => {
    const onFocus = () => {
      fetchAllAdoptionPosts({ forceRefresh: true });
      refreshUserRequestsForPosts();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUser]);

  // Robust chat navigation handler (copied from Postnew.jsx)
  const handleStartConversation = async (postCreatorId, postCreatorUsername, event) => {
    if (!requireAuth('start a conversation')) return;
    const currentUserId = getCurrentUserId(effectiveUser);
    
    try {
      // Show loading state or disable button temporarily
      const button = event?.target?.closest('button');
      if (button) {
        button.disabled = true;
        button.classList.add('opacity-50');
      }
      
      // First check if conversation exists in local state
      const existingConv = conversations.find(conv =>
        conv.participants && conv.participants.includes(currentUserId) &&
        conv.participants.includes(postCreatorId)
      );
      
      if (existingConv) {
        // Smooth navigation to existing conversation
        navigate(`/chat/${postCreatorId}`, { 
          state: { fromAdoption: true, postCreatorUsername }
        });
        return;
      }
      
      // If not found locally, check with backend
      const response = await getConversationBetweenUsers(currentUserId, postCreatorId);
      if (response.data) {
        navigate(`/chat/${postCreatorId}`, { 
          state: { fromAdoption: true, postCreatorUsername }
        });
      } else {
        // No existing conversation - navigate with just user info
        navigate(`/chat/${postCreatorId}`, { 
          state: { fromAdoption: true, postCreatorUsername }
        });
      }
    } catch (error) {
      console.error('Error checking conversation:', error);
      // Fallback - navigate with basic info
      navigate(`/chat/${postCreatorId}`, { 
        state: { fromAdoption: true, postCreatorUsername }
      });
    } finally {
      // Re-enable button if it was disabled
      if (button) {
        button.disabled = false;
        button.classList.remove('opacity-50');
      }
    }
  };

  // Ensure allAdoptionPosts is always an array
  let posts = Array.isArray(allAdoptionPosts) ? allAdoptionPosts : [];

  // Filtering logic
  if (filter === 'dog') {
    posts = posts.filter(post => post.petType && post.petType.toLowerCase() === 'dog');
  } else if (filter === 'cat') {
    posts = posts.filter(post => post.petType && post.petType.toLowerCase() === 'cat');
  } else if (filter === 'other') {
    posts = posts.filter(post => post.petType && !['dog', 'cat'].includes(post.petType.toLowerCase()));
  }

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
    if (!requireAuth('request adoption')) return;
    setSelectedPost(post);
  };

  const handleRequestFormClose = () => {
    setSelectedPost(null);
    refreshUserRequestsForPosts();
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#4E3B31] mb-8 text-center">Pets Looking for Forever Homes</h1>
      
      
      <div className={adoptionGridClass}>
        {posts.map((post) => {
          const currentUserId = getCurrentUserId(effectiveUser);
          const postOwnerId = getPosterProfileId(post);
          const isOwner = Boolean(currentUserId && postOwnerId && currentUserId === postOwnerId);
          const userRequestInfo = userRequests[post._id] || {
            hasRequest: false,
            requestStatus: null,
            postStatus: null,
          };
          const listingStatus = userRequestInfo.postStatus ?? post.status;
          const hasPendingRequest =
            userRequestInfo.hasRequest && userRequestInfo.requestStatus === 'pending';
          const hasAcceptedRequest =
            userRequestInfo.hasRequest && userRequestInfo.requestStatus === 'accepted';
          const avatarUrl =
            post.userId?._id && userProfileImages[post.userId._id]
              ? `${API_BASE_URL.replace('/api', '')}${userProfileImages[post.userId._id]}`
              : null;
          
          return (
            <AdoptionCard
              key={`${post._id}-${post.status}`}
              post={post}
              imageFailed={imageErrors[post._id]}
              onImageError={() => handleImageError(post._id)}
              poster={{
                profileId: postOwnerId,
                username: post.userId?.username,
                avatarUrl,
                onChat:
                  effectiveUser && postOwnerId !== currentUserId
                    ? (e) => handleStartConversation(post.userId?._id, post.userId?.username, e)
                    : undefined,
              }}
            >
                  {post.description && post.description.length > 100 && (
                    <button 
                  type="button"
                      onClick={() => setViewDetailsPost(post)}
                  className="text-left text-sm font-medium text-[#a07855] hover:underline"
                    >
                  Read more
                    </button>
                  )}
              <button type="button" onClick={() => setViewDetailsPost(post)} className={adoptionBtnSecondary}>
                View details
                  </button>
                  {isOwner && (
                <button type="button" onClick={() => deleteAdoptionPost(post._id)} className={adoptionBtnDanger}>
                  Delete post
                      </button>
              )}
              {!isOwner && listingStatus === 'available' && !userRequestInfo.hasRequest && (
                <button type="button" onClick={() => handleRequestClick(post)} className={adoptionBtnPrimary}>
                  Request adoption
                    </button>
                  )}
              {listingStatus === 'adopted' && !isOwner && (
                <div className={adoptionAlertInfo('neutral')}>This pet has been adopted</div>
              )}
              {hasPendingRequest && !isOwner && listingStatus === 'available' && (
                <div className={adoptionAlertInfo('warning')}>
                  Request sent — awaiting owner review. You can message the owner from the card above.
                </div>
              )}
              {hasAcceptedRequest && !isOwner && listingStatus !== 'available' && (
                <div className={adoptionAlertInfo('success')}>Adoption request accepted</div>
              )}
            </AdoptionCard>
          );
        })}
      </div>
      {/* Adoption Request Modal */}
      {selectedPost && (
        <AdoptionRequestForm
          key={selectedPost._id}
          postId={selectedPost._id}
          onClose={handleRequestFormClose}
        />
      )}
      {/* View Details Modal */}
      {viewDetailsPost && (
        <AdoptionDetailsModal
          post={viewDetailsPost}
          onClose={() => setViewDetailsPost(null)}
          imageFailed={imageErrors[viewDetailsPost._id]}
          onImageError={() => handleImageError(viewDetailsPost._id)}
          posterAvatarUrl={
            viewDetailsPost.userId?._id && userProfileImages[viewDetailsPost.userId._id]
              ? `${API_BASE_URL.replace('/api', '')}${userProfileImages[viewDetailsPost.userId._id]}`
              : null
          }
          canChat={
            Boolean(
              effectiveUser &&
                String(viewDetailsPost.userId?._id || '') !== String(getCurrentUserId(effectiveUser) || '')
            )
          }
          onChat={(e) =>
            handleStartConversation(viewDetailsPost.userId?._id, viewDetailsPost.userId?.username, e)
          }
        />
      )}
    </div>
  );
};

AdoptionList.propTypes = {
  filter: PropTypes.string,
};

export default AdoptionList;