// import React, { useState, useEffect } from 'react';
// import { useParams, NavLink, useNavigate } from 'react-router-dom';
// import { FaUserCircle, FaChevronLeft, FaMapMarkerAlt, FaCalendarAlt, FaHeart, FaComment } from 'react-icons/fa';
// import { getUserPublicProfile, getUserAdoptionAds, getUserPosts, getConversationBetweenUsers } from './api';
// import { AUTH_BASE_URL } from '../config';
// import { MessageSquare, User, Info } from 'lucide-react';

// const PublicProfilePage = () => {
//   const { userId } = useParams();
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();
//   const [toggleView, setToggleView] = useState('ads'); // 'ads' or 'posts'
//   const [adoptionAds, setAdoptionAds] = useState([]);
//   const [userPosts, setUserPosts] = useState([]);
//   const [loadingAds, setLoadingAds] = useState(true);
//   const [loadingPosts, setLoadingPosts] = useState(true);
//   const [conversations, setConversations] = useState([]);

//   // Get current user
//   const currentUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
//   const currentUserId = currentUser?._id || currentUser?.id;

//   useEffect(() => {
//     if (userId) {
//       fetchPublicProfile(userId);
//       fetchUserAdoptionAds(userId);
//       fetchUserPosts(userId);
//     }
//   }, [userId]);

//   // Fetch conversations for the current user
//   useEffect(() => {
//     const fetchConversations = async () => {
//       if (!currentUserId) return;
//       try {
//         const response = await getConversationBetweenUsers(currentUserId, currentUserId); // Placeholder, adjust if needed
//         if (Array.isArray(response?.data?.data)) {
//           setConversations(response.data.data);
//         }
//       } catch (error) {
//         // Ignore for now
//       }
//     };
//     fetchConversations();
//   }, [currentUserId]);

//   const fetchPublicProfile = async (id) => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await getUserPublicProfile(id);
      
//       if (!response.data.success) {
//         throw new Error(response.data.message || 'Failed to load profile');
//       }
      
//       // Structure the profile data
//       const profileData = {
//         ...response.data.data,
//         username: response.data.data.username || 'Unknown User',
//         about: response.data.data.about || '',
//         city: response.data.data.city || '',
//         profileImage: response.data.data.profileImage || '',
//         lastActive: response.data.data.lastActive || null
//       };
      
//       setProfile(profileData);
//     } catch (err) {
//       console.error('Failed to fetch public profile:', err);
//       setError('Failed to load profile. This user may not exist or the profile is private.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchUserAdoptionAds = async (id) => {
//     setLoadingAds(true);
//     try {
//       const response = await getUserAdoptionAds(id);
//       setAdoptionAds(response.data || []);
//     } catch (err) {
//       setAdoptionAds([]);
//     } finally {
//       setLoadingAds(false);
//     }
//   };

//   const fetchUserPosts = async (id) => {
//     setLoadingPosts(true);
//     try {
//       const response = await getUserPosts(id);
//       setUserPosts(response.data || []);
//     } catch (err) {
//       setUserPosts([]);
//     } finally {
//       setLoadingPosts(false);
//     }
//   };

//   // Enhanced navigation handler (copied from Postnew.jsx)
//   const handleStartConversation = async (profileUserId, profileUserUsername) => {
//     if (!currentUser) {
//       navigate('/signin');
//       return;
//     }

//     try {
//       // First check if conversation exists in local state
//       const existingConv = conversations.find(conv => 
//         conv.participants.includes(currentUserId) && 
//         conv.participants.includes(profileUserId)
//       );

//       if (existingConv) {
//         navigate(`/chat/${profileUserId}`);
//         return;
//       }

//       // If not found locally, check with backend
//       const response = await getConversationBetweenUsers(currentUserId, profileUserId);
//       if (response.data) {
//         navigate(`/chat/${profileUserId}`);
//       } else {
//         // No existing conversation - navigate with just user info
//         navigate(`/chat/${profileUserId}`);
//       }
//     } catch (error) {
//       console.error('Error checking conversation:', error);
//       // Fallback - navigate with basic info
//       navigate(`/chat/${profileUserId}`);
//     }
//   };

//   const formatLastActive = (timestamp) => {
//     if (!timestamp) return 'Never';
//     const date = new Date(timestamp);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-[#F8F4ED]">
//         <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#6b493d]"></div>
//       </div>
//     );
//   }

//   if (error || !profile) {
//     return (
//       <div className="min-h-screen bg-[#F8F4ED] flex items-center justify-center px-4">
//         <div className="bg-white shadow-xl rounded-lg p-8 max-w-md w-full text-center">
//           <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center bg-[#6b493d]/20">
//             <User className="h-12 w-12 text-[#6b493d]" />
//           </div>
//           <h2 className="text-2xl font-bold mb-4 text-[#6b493d]">Profile Not Found</h2>
//           <p className="text-gray-600">{error || 'Could not load profile data'}</p>
//           <NavLink 
//             to="/" 
//             className="mt-4 inline-block bg-[#6b493d] hover:bg-[#57392f] text-white font-medium py-2 px-6 rounded-md transition-colors"
//           >
//             Go Home
//           </NavLink>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#F8F4ED] pb-12">
//       {/* Simple Header */}
//       <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
//         <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
//           <button 
//             onClick={() => navigate(-1)} 
//             className="flex items-center text-[#6b493d] hover:text-[#57392f] transition-colors"
//           >
//             <FaChevronLeft className="mr-1" />
//             <span>Back</span>
//           </button>
//         </div>
//       </header>

//       <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
//         {/* Profile Header */}
//         <div className="flex flex-col items-center text-center mb-8">
//           {profile.profileImage ? (
//             <img
//               src={`${AUTH_BASE_URL.replace('/auth', '')}${profile.profileImage}`}
//               alt={profile.username}
//               className="w-24 h-24 rounded-full object-cover mb-4"
//               onError={(e) => {
//                 e.target.style.display = 'none';
//                 e.target.nextSibling.style.display = 'flex';
//               }}
//             />
//           ) : null}
//           <div 
//             className={`w-24 h-24 rounded-full flex items-center justify-center bg-[#6b493d]/10 mb-4 ${profile.profileImage ? 'hidden' : ''}`}
//           >
//             <span className="text-2xl font-bold text-[#6b493d]">
//               {profile.username.charAt(0).toUpperCase()}
//             </span>
//           </div>
//           <h1 className="text-2xl font-bold text-[#6b493d]">{profile.username}</h1>
//           {profile.city && (
//             <div className="flex items-center justify-center text-gray-600 text-sm mt-1">
//               <FaMapMarkerAlt className="mr-1" />
//               <span>{profile.city}</span>
//             </div>
//           )}
//           {profile.about && (
//             <div className="mt-2 text-gray-700 text-base max-w-md">{profile.about}</div>
//           )}
//           {profile.lastActive && (
//             <div className="text-gray-500 text-xs mt-1">
//               Last active: {formatLastActive(profile.lastActive)}
//             </div>
//           )}
//           {currentUser && profile._id !== currentUserId && (
//             <button
//               onClick={() => handleStartConversation(profile._id, profile.username)}
//               className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#6b493d] text-white rounded-md hover:bg-[#57392f] transition-all"
//             >
//               <MessageSquare className="h-4 w-4" />
//               <span>Message</span>
//             </button>
//           )}
//         </div>

//         {/* About Section */}
//         {profile.about && (
//           <div className="mb-8">
//             <h2 className="text-xl font-semibold text-[#6b493d] mb-4">About</h2>
//             <p className="text-gray-700 leading-relaxed">{profile.about}</p>
//           </div>
//         )}

//         {/* Details Section */}
//         <div>
//           <h2 className="text-xl font-semibold text-[#6b493d] mb-4">Details</h2>
//           <div className="space-y-4">
//             {profile.city && (
//               <div className="flex items-start">
//                 <FaMapMarkerAlt className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-[#a07855]" />
//                 <div>
//                   <h3 className="text-sm font-medium text-gray-500">Location</h3>
//                   <p className="text-gray-800">{profile.city}</p>
//                 </div>
//               </div>
//             )}
            
//             {profile.lastActive && (
//               <div className="flex items-start">
//                 <FaCalendarAlt className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-[#a07855]" />
//                 <div>
//                   <h3 className="text-sm font-medium text-gray-500">Last Active</h3>
//                   <p className="text-gray-800">
//                     {new Date(profile.lastActive).toLocaleDateString('en-US', {
//                       year: 'numeric',
//                       month: 'long',
//                       day: 'numeric'
//                     })}
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//       {/* Toggle View Section */}
//       <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-8">
//         <div className="flex justify-center mb-6">
//           <button
//             className={`px-4 py-2 rounded-l-md border border-[#6b493d] font-medium transition-colors ${toggleView === 'ads' ? 'bg-[#6b493d] text-white' : 'bg-white text-[#6b493d]'}`}
//             onClick={() => setToggleView('ads')}
//           >
//             Adoption Ads
//           </button>
//           <button
//             className={`px-4 py-2 rounded-r-md border border-l-0 border-[#6b493d] font-medium transition-colors ${toggleView === 'posts' ? 'bg-[#6b493d] text-white' : 'bg-white text-[#6b493d]'}`}
//             onClick={() => setToggleView('posts')}
//           >
//             Posts
//           </button>
//         </div>
//         {/* Content Section */}
//         {toggleView === 'ads' ? (
//           loadingAds ? (
//             <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-[#6b493d]"></div></div>
//           ) : adoptionAds.length === 0 ? (
//             <div className="text-center text-gray-500 py-8">No adoption ads found.</div>
//           ) : (
//             <div className="grid gap-6">
//               {adoptionAds.map(ad => (
//                 <div key={ad._id} className="bg-white rounded-lg shadow-sm p-4">
//                   <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-md mb-2">
//                     {ad.imageUrl && (
//                       <img
//                         src={ad.imageUrl}
//                         alt={ad.name}
//                         className="max-h-44 max-w-full object-contain"
//                       />
//                     )}
//                   </div>
//                   <h3 className="text-lg font-semibold text-[#6b493d] mb-1">{ad.name}</h3>
//                   <div className="text-xs text-gray-500 mb-2 flex items-center">
//                     <FaMapMarkerAlt className="mr-1" />
//                     {ad.location || 'Location not specified'}
//                   </div>
//                   <div className="flex items-center text-xs text-gray-500 space-x-4 mb-3">
//                     <span className="flex items-center">
//                       <FaHeart className="mr-1 text-[#a07855]" />
//                       {ad.likes?.length || 0} likes
//                     </span>
//                     <span className="flex items-center">
//                       <FaComment className="mr-1 text-[#a07855]" />
//                       {ad.comments?.length || 0} comments
//                     </span>
//                   </div>
//                   <p className="text-sm text-gray-700 line-clamp-2">{ad.description}</p>
//                 </div>
//               ))}
//             </div>
//           )
//         ) : (
//           loadingPosts ? (
//             <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-[#6b493d]"></div></div>
//           ) : userPosts.length === 0 ? (
//             <div className="text-center text-gray-500 py-8">No posts found.</div>
//           ) : (
//             <div className="grid gap-6">
//               {userPosts.map(post => (
//                 <div key={post._id} className="bg-white rounded-lg shadow-sm p-4">
//                   <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-md mb-2">
//                     {post.imageUrl && (
//                       <img
//                         src={post.imageUrl}
//                         alt={post.caption}
//                         className="max-h-44 max-w-full object-contain"
//                       />
//                     )}
//                   </div>
//                   <h3 className="text-lg font-semibold text-[#6b493d] mb-1">{post.caption || 'Untitled Post'}</h3>
//                   <div className="text-xs text-gray-500 mb-2">
//                     {new Date(post.createdAt).toLocaleDateString('en-US', {
//                       month: 'short',
//                       day: 'numeric',
//                       year: 'numeric'
//                     })}
//                   </div>
//                   <div className="flex items-center text-xs text-gray-500 space-x-4 mb-3">
//                     <span className="flex items-center">
//                       <FaHeart className="mr-1 text-[#a07855]" />
//                       {post.likes?.length || 0} likes
//                     </span>
//                     <span className="flex items-center">
//                       <FaComment className="mr-1 text-[#a07855]" />
//                       {post.comments?.length || 0} comments
//                     </span>
//                   </div>
//                   <p className="text-sm text-gray-700">{post.text}</p>
//                 </div>
//               ))}
//             </div>
//           )
//         )}
//       </div>
//     </div>
//   );
// };

// export default PublicProfilePage;

import React, { useState, useEffect } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaChevronLeft, FaMapMarkerAlt, FaHeart, FaComment } from 'react-icons/fa';
import { getUserPublicProfile, getUserAdoptionAds, getUserPosts, getConversationBetweenUsers } from './api';
import { AUTH_BASE_URL } from '../config';
import { MessageSquare, User } from 'lucide-react';

const PublicProfilePage = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ads'); // 'ads' or 'posts'
  const [adoptionAds, setAdoptionAds] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [conversations, setConversations] = useState([]);

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
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
    if (!currentUser) {
      navigate('/signin');
      return;
    }

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
    <div className="min-h-screen bg-[#F8F4ED]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-[#6b493d] hover:text-[#57392f] transition-colors"
          >
            <FaChevronLeft className="mr-1" />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Profile Header */}
        <div className="flex items-start pt-6 pb-4">
          {profile.profileImage ? (
            <img
              src={`${AUTH_BASE_URL.replace('/auth', '')}${profile.profileImage}`}
              alt={profile.username}
              className="w-16 h-16 rounded-full object-cover mr-4"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-16 h-16 rounded-full flex items-center justify-center bg-[#6b493d]/10 mr-4 ${profile.profileImage ? 'hidden' : ''}`}
          >
            <span className="text-xl font-bold text-[#6b493d]">
              {profile.username.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#6b493d]">{profile.username}</h1>
            {profile.city && (
              <div className="flex items-center text-gray-600 text-sm">
                <FaMapMarkerAlt className="mr-1" />
                <span>{profile.city}</span>
              </div>
            )}
          </div>
          
          {currentUser && profile._id !== currentUserId && (
            <button
              onClick={() => handleStartConversation(profile._id, profile.username)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#6b493d] text-white rounded-md hover:bg-[#57392f] transition-all text-sm"
            >
              <MessageSquare className="h-3 w-3" />
              <span>Message</span>
            </button>
          )}
        </div>

        {/* About Section */}
        {profile.about && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-1">About</h2>
            <p className="text-gray-700 text-sm">{profile.about}</p>
            {profile.lastActive && (
              <p className="text-gray-500 text-xs mt-1">
                Last active: {formatLastActive(profile.lastActive)}
              </p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mt-4">
          <button
            className={`px-4 py-2 text-sm font-medium relative ${activeTab === 'ads' ? 'text-[#6b493d]' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('ads')}
          >
            Adoption Ads
            {activeTab === 'ads' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6b493d]"></span>
            )}
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium relative ${activeTab === 'posts' ? 'text-[#6b493d]' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
            {activeTab === 'posts' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6b493d]"></span>
            )}
          </button>
        </div>

        {/* Tab Content with Animation */}
        <div className="relative overflow-hidden">
          <div 
            className={`transition-all duration-300 ease-in-out ${activeTab === 'ads' ? 'opacity-100 translate-x-0' : 'opacity-0 absolute translate-x-full'}`}
          >
            {loadingAds ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-[#6b493d]"></div>
              </div>
            ) : adoptionAds.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No adoption ads found.</div>
            ) : (
              <div className="grid gap-4 py-4">
                {adoptionAds.map(ad => (
                  <div key={ad._id} className="bg-white rounded-lg shadow-sm p-4 flex flex-col items-center">
                    <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-md mb-2">
                      {ad.imageUrl && (
                        <img
                          src={ad.imageUrl}
                          alt={ad.name}
                          className="max-h-44 max-w-full object-contain"
                        />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-[#6b493d] mb-1 text-center">{ad.name}</h3>
                    <div className="text-xs text-gray-500 mb-2 flex items-center justify-center">
                      <FaMapMarkerAlt className="mr-1" />
                      {ad.location || 'Location not specified'}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2 text-center">{ad.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div 
            className={`transition-all duration-300 ease-in-out ${activeTab === 'posts' ? 'opacity-100 translate-x-0' : 'opacity-0 absolute translate-x-full'}`}
          >
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-[#6b493d]"></div>
              </div>
            ) : userPosts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No posts found.</div>
            ) : (
              <div className="grid gap-4 py-4">
                {userPosts.map(post => (
                  <div key={post._id} className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="text-lg font-semibold text-[#6b493d] mb-1">{post.caption || 'Untitled Post'}</h3>
                    <div className="text-xs text-gray-500 mb-2">
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 space-x-4 mb-3">
                      <span className="flex items-center">
                        <FaHeart className="mr-1 text-[#a07855]" />
                        {post.likes?.length || 0} likes
                      </span>
                      <span className="flex items-center">
                        <FaComment className="mr-1 text-[#a07855]" />
                        {post.comments?.length || 0} comments
                      </span>
                    </div>
                    {post.imageUrl && (
                      <img 
                        src={post.imageUrl} 
                        alt={post.caption} 
                        className="w-full h-48 object-cover rounded-md mb-2"
                      />
                    )}
                    <p className="text-sm text-gray-700">{post.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;