import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
// import { FaUserCircle, FaChevronLeft, FaMapMarkerAlt, FaHeart, FaComment } from 'react-icons/fa';
import { FaChevronLeft, FaMapMarkerAlt, FaHeart, FaComment, FaUser, FaCalendarAlt,FaPaw, FaNewspaper } from 'react-icons/fa';
import { getUserPublicProfile, getUserAdoptionAds, getUserPosts, getConversationBetweenUsers } from './api';
import { AUTH_BASE_URL } from '../config';
import { MessageSquare, User } from 'lucide-react';
import { useRequireAuth } from '../Components/AuthGuard';
import AdoptionCard from '../components/adoption/AdoptionCard';
import { adoptionGridClass } from '../components/adoption/adoptionTheme';

const PublicProfilePage = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requireAuth = useRequireAuth();
  const [activeTab, setActiveTab] = useState('ads'); // 'ads' or 'posts'
  const [adoptionAds, setAdoptionAds] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [imageFailed, setImageFailed] = useState(false);

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    if (userId) {
      fetchPublicProfile(userId);
      fetchUserAdoptionAds(userId);
      fetchUserPosts(userId);
    }
  }, [userId]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUserId) return;
      try {
        const response = await getConversationBetweenUsers(currentUserId, currentUserId);
        if (Array.isArray(response?.data?.data)) {
          setConversations(response.data.data);
        }
      } catch (error) {
        // Ignore for now
      }
    };
    fetchConversations();
  }, [currentUserId]);

  // Reset image error when user/profile image changes
  useEffect(() => {
    setImageFailed(false);
  }, [userId, profile?.profileImage]);

  const fetchPublicProfile = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUserPublicProfile(id);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to load profile');
      }
      
      const profileData = {
        ...response.data.data,
        username: response.data.data.username || 'Unknown User',
        about: response.data.data.about || '',
        city: response.data.data.city || '',
        profileImage: response.data.data.profileImage || '',
        lastActive: response.data.data.lastActive || null
      };
      
      setProfile(profileData);
    } catch (err) {
      console.error('Failed to fetch public profile:', err);
      setError('Failed to load profile. This user may not exist or the profile is private.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAdoptionAds = async (id) => {
    setLoadingAds(true);
    try {
      const response = await getUserAdoptionAds(id);
      setAdoptionAds(response.data || []);
    } catch (err) {
      setAdoptionAds([]);
    } finally {
      setLoadingAds(false);
    }
  };

  const fetchUserPosts = async (id) => {
    setLoadingPosts(true);
    try {
      const response = await getUserPosts(id);
      setUserPosts(response.data || []);
    } catch (err) {
      setUserPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleStartConversation = async (profileUserId, profileUserUsername) => {
    if (!requireAuth('start a conversation')) return;

    try {
      const existingConv = conversations.find(conv => 
        conv.participants.includes(currentUserId) && 
        conv.participants.includes(profileUserId)
      );

      if (existingConv) {
        navigate(`/chat/${profileUserId}`);
        return;
      }

      const response = await getConversationBetweenUsers(currentUserId, profileUserId);
      if (response.data) {
        navigate(`/chat/${profileUserId}`);
      } else {
        navigate(`/chat/${profileUserId}`);
      }
    } catch (error) {
      console.error('Error checking conversation:', error);
      navigate(`/chat/${profileUserId}`);
    }
  };

  const formatLastActive = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const lastActive = new Date(timestamp);
    const diffInHours = Math.floor((now - lastActive) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F4ED]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#6b493d]"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#F8F4ED] flex items-center justify-center px-4">
        <div className="bg-white shadow-xl rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center bg-[#6b493d]/20">
            <User className="h-12 w-12 text-[#6b493d]" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-[#6b493d]">Profile Not Found</h2>
          <p className="text-gray-600">{error || 'Could not load profile data'}</p>
          <NavLink 
            to="/" 
            className="mt-4 inline-block bg-[#6b493d] hover:bg-[#57392f] text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Go Home
          </NavLink>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#f8f4ea] pb-6">
  {/* Sticky Header */}
  <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-[#e5d9c8]">
    <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center p-2 rounded-xl hover:bg-[#f0e6d8] transition-colors"
      >
        <FaChevronLeft className="text-[#6b493d]" />
      </button>
      <h1 className="text-xl font-heading font-semibold text-[#2c1810] ml-2">Profile</h1>
      <div className="flex-1"></div>
      {currentUser && profile._id !== currentUserId && (
        <button
          onClick={() => handleStartConversation(profile._id, profile.username)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#a07855] text-[#ffd8b8] rounded-xl hover:bg-[#8a6a4d] transition-all shadow-md hover:shadow-lg"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Message</span>
        </button>
      )}
    </div>
  </header>

  {/* Profile Header */}
  <div className="max-w-4xl mx-auto px-4 pt-6 pb-4">
    <div className="flex flex-col items-center text-center mb-6 bg-white rounded-2xl p-6 shadow-sm border border-[#e5d9c8]">
      <div className="relative mb-5">
        {profile.profileImage && !imageFailed ? (
          <img
            src={
              profile.profileImage.startsWith('http')
                ? profile.profileImage
                : `${AUTH_BASE_URL.replace('/auth', '')}${profile.profileImage.startsWith('/') ? '' : '/'}${profile.profileImage}`
            }
            alt={profile.username}
            className="w-28 h-28 rounded-xl object-cover border-4 border-white shadow-lg"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="w-28 h-28 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#a07855] to-[#6b493d] shadow-lg">
            <span className="text-4xl font-bold text-[#ffd8b8]">
              {profile.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* <div className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow-md">
          <div className="bg-green-500 rounded-full w-3.5 h-3.5"></div>
        </div> */}
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-heading font-bold text-[#2c1810]">{profile.username}</h1>
        {profile.city && (
          <div className="flex items-center justify-center text-[#2c1810]/80 mt-2">
            <FaMapMarkerAlt className="mr-1.5 text-[#a07855]" />
            <span>{profile.city}</span>
          </div>
        )}
      </div>

      <div className="text-lg font-bold text-[#a07855] mb-3">{adoptionAds.length} Adoption Ads</div>

      <div className="text-[#2c1810]/80 bg-[#f8f4ea] rounded-xl py-3 px-5 max-w-md text-center font-body">
        {profile.about || "This user hasn't written a bio yet."}
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-5 text-sm text-[#2c1810]/70">
        {profile.joinedDate && (
          <div className="flex items-center bg-[#f5efe6] py-1.5 px-3 rounded-lg">
            <FaCalendarAlt className="mr-1.5 text-[#a07855]" />
            <span>Joined {formatJoinedDate(profile.joinedDate)}</span>
          </div>
        )}
        {profile.lastActive && (
          <div className="flex items-center bg-[#f5efe6] py-1.5 px-3 rounded-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5"></div>
            <span>Active {formatLastActive(profile.lastActive)}</span>
          </div>
        )}
      </div>
    </div>
  </div>

  {/* Tab Navigation */}
  <div className="sticky top-14 z-10 bg-white pt-3 pb-2 border-b border-[#e5d9c8] shadow-sm">
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex justify-around">
        <button
          className={`px-4 py-3 font-medium relative transition-colors ${activeTab === 'ads' ? 'text-[#a07855] font-semibold' : 'text-[#2c1810]/60 hover:text-[#2c1810]'}`}
          onClick={() => setActiveTab('ads')}
        >
          Adoption Ads
          {activeTab === 'ads' && (
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-[#a07855] rounded-full"></span>
          )}
        </button>
        <button
          className={`px-4 py-3 font-medium relative transition-colors ${activeTab === 'posts' ? 'text-[#a07855] font-semibold' : 'text-[#2c1810]/60 hover:text-[#2c1810]'}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts
          {activeTab === 'posts' && (
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-[#a07855] rounded-full"></span>
          )}
        </button>
      </div>
    </div>
  </div>

  {/* Tab Content */}
  <div className="max-w-4xl mx-auto px-4 pt-5">
    {/* Adoption Ads */}
    {activeTab === 'ads' && (
      loadingAds ? (
        <div className="flex flex-col items-center py-12">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-[#a07855] border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-[#a07855]/20 animate-ping"></div>
            </div>
          </div>
          <p className="text-[#2c1810]/80">Loading adoption ads...</p>
        </div>
      ) : adoptionAds.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto rounded-xl bg-gradient-to-br from-[#fff7f0] to-[#f0e6d8] flex items-center justify-center shadow-inner mb-5">
            <FaPaw className="h-12 w-12 text-[#a07855]" />
          </div>
          <h3 className="text-xl font-heading font-semibold text-[#2c1810] mb-2">No Adoption Ads</h3>
          <p className="text-[#2c1810]/80 max-w-md mx-auto">
            {profile.username} hasn't posted any pets for adoption yet
          </p>
        </div>
      ) : (
        <div className={`${adoptionGridClass} pb-8`}>
          {adoptionAds.map((ad) => (
            <AdoptionCard key={ad._id} post={ad} descriptionLines={2} poster={{ show: false }} />
          ))}
        </div>
      )
    )}

    {/* Posts */}
    {activeTab === 'posts' && (
      loadingPosts ? (
        <div className="flex flex-col items-center py-12">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-[#a07855] border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-[#a07855]/20 animate-ping"></div>
            </div>
          </div>
          <p className="text-[#2c1810]/80">Loading posts...</p>
        </div>
      ) : userPosts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto rounded-xl bg-gradient-to-br from-[#fff7f0] to-[#f0e6d8] flex items-center justify-center shadow-inner mb-5">
            <FaNewspaper className="h-12 w-12 text-[#a07855]" />
          </div>
          <h3 className="text-xl font-heading font-semibold text-[#2c1810] mb-2">No Posts Yet</h3>
          <p className="text-[#2c1810]/80 max-w-md mx-auto">
            {profile.username} hasn't shared any posts yet
          </p>
        </div>
      ) : (
        <div className="space-y-5 pb-8">
          {userPosts.map(post => (
            <div
              key={post._id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all border border-[#e5d9c8]"
            >
              {post.imageUrl && (
                <div className="w-full h-64 bg-gradient-to-br from-[#fff7f0] to-[#f0e6d8] flex items-center justify-center overflow-hidden">
                  <img
                    src={post.imageUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-heading font-bold text-[#2c1810]">
                    {post.caption || 'Pet Story'}
                  </h3>
                  <span className="text-sm text-[#2c1810]/70">
                    {new Date(post.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <p className="text-[#2c1810]/80 mb-5 font-body">{post.text}</p>

                <div className="flex items-center justify-between border-t border-[#e5d9c8] pt-4">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center text-sm text-[#2c1810]/80 hover:text-[#a07855]">
                      <FaHeart className="mr-1.5" />
                      {post.likes?.length || 0}
                    </button>
                    <button className="flex items-center text-sm text-[#2c1810]/80 hover:text-[#a07855]">
                      <FaComment className="mr-1.5" />
                      {post.comments?.length || 0}
                    </button>
                  </div>
                  {/* <button className="text-sm text-[#a07855] font-medium hover:text-[#8a6a4d]">
                    Read more
                  </button> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    )}
  </div>
</div>
  );
}
export default PublicProfilePage;
