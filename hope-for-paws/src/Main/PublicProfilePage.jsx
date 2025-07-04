import React, { useState, useEffect } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaChevronLeft, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import { getUserPublicProfile } from './api';
import { AUTH_BASE_URL } from '../config';
import { MessageSquare, User, Info } from 'lucide-react';

const PublicProfilePage = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
  const currentUserId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    if (userId) {
      fetchPublicProfile(userId);
    }
  }, [userId]);

  const fetchPublicProfile = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUserPublicProfile(id);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to load profile');
      }
      
      // Structure the profile data
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

  const handleStartConversation = (profileUserId, profileUserUsername) => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    navigate('/chat', {
      state: {
        recipientId: profileUserId,
        recipientUsername: profileUserUsername
      }
    });
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
    <div className="min-h-screen bg-[#F8F4ED] pb-12">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-[#6b493d] hover:text-[#57392f] transition-colors"
          >
            <FaChevronLeft className="mr-1" />
            <span>Back</span>
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mb-8">
          {profile.profileImage ? (
            <img
              src={`${AUTH_BASE_URL.replace('/auth', '')}${profile.profileImage}`}
              alt={profile.username}
              className="w-24 h-24 rounded-full object-cover mb-4"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-24 h-24 rounded-full flex items-center justify-center bg-[#6b493d]/10 mb-4 ${profile.profileImage ? 'hidden' : ''}`}
          >
            <span className="text-2xl font-bold text-[#6b493d]">
              {profile.username.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <h1 className="text-2xl font-bold text-[#6b493d]">{profile.username}</h1>
          
          {currentUser && profile._id !== currentUserId && (
            <button
              onClick={() => handleStartConversation(profile._id, profile.username)}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#6b493d] text-white rounded-md hover:bg-[#57392f] transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Message</span>
            </button>
          )}
        </div>

        {/* About Section */}
        {profile.about && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#6b493d] mb-4">About</h2>
            <p className="text-gray-700 leading-relaxed">{profile.about}</p>
          </div>
        )}

        {/* Details Section */}
        <div>
          <h2 className="text-xl font-semibold text-[#6b493d] mb-4">Details</h2>
          <div className="space-y-4">
            {profile.city && (
              <div className="flex items-start">
                <FaMapMarkerAlt className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-[#a07855]" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Location</h3>
                  <p className="text-gray-800">{profile.city}</p>
                </div>
              </div>
            )}
            
            {profile.lastActive && (
              <div className="flex items-start">
                <FaCalendarAlt className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-[#a07855]" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Active</h3>
                  <p className="text-gray-800">
                    {new Date(profile.lastActive).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;