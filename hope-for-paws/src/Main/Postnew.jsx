import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import DOMPurify from "dompurify";
import { Heart, MessageCircle, UserCircle, Trash2, PlusCircle, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../config';
import { getCurrentUserId } from '../lib/utils';
import { getUserPublicProfile } from './api';
import { getConversationBetweenUsers } from './api'; // <-- Make sure this is imported
import PostUploadForm from './PostUploadForm';
import { useRequireAuth } from '../Components/AuthGuard';
 
const Postnew = () => {
  const [posts, setPosts] = useState([]);
  const [newComment, setNewComment] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // const { userd } = useAuth();
  const [expandedComments, setExpandedComments] = useState({});
  const navigate = useNavigate();
  const [userProfileImages, setUserProfileImages] = useState({});
  const [conversations, setConversations] = useState([]); // Add this if not already present
  const [showPostForm, setShowPostForm] = useState(false);
  const [replyInput, setReplyInput] = useState({}); // Add this line
  const [replyingTo, setReplyingTo] = useState(null); // stores root commentId being replied to
  const intervalRef = useRef(null); // Ref to track the interval
  const [isRefreshing, setIsRefreshing] = useState(false); // For subtle background refresh indicator
  const requireAuth = useRequireAuth();
  
  // Check user authentication state
  const user =
    JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user")) ||
    null;
  const currentUserId = getCurrentUserId(user);
    
  const toggleComments = (postId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };
  
  const fetchPosts = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/posts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPosts(response.data);
      setError("");
    } catch {
      setError("Failed to load posts. Please try again later.");
      // console.error("Error fetching posts:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchPosts(true); // Show loading for initial load
    
    // Helper to start/stop the polling interval
    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (!showPostForm) {
        intervalRef.current = setInterval(() => fetchPosts(false), 30000);
      }
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Pause polling when tab is hidden, resume when visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchPosts(false); // Refresh immediately on return
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup function
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [showPostForm]);

  // Fetch profile images for all unique userIds in posts
  useEffect(() => {
    const fetchProfileImages = async () => {
      const uniqueUserIds = Array.from(new Set(posts.map(post => post.userId?._id).filter(Boolean)));
      const missingUserIds = uniqueUserIds.filter(id => !userProfileImages[id]);
      if (missingUserIds.length === 0) return;
      const newImages = {};
      for (const userId of missingUserIds) {
        try {
          const response = await getUserPublicProfile(userId);
          if (response.data && response.data.data && response.data.data.profileImage) {
            newImages[userId] = response.data.data.profileImage;
          }
        } catch {
          // Ignore errors, fallback to initial
        }
      }
      if (Object.keys(newImages).length > 0) {
        setUserProfileImages(prev => ({ ...prev, ...newImages }));
      }
    };
    if (posts.length > 0) {
      fetchProfileImages();
    }
    // eslint-disable-next-line
  }, [posts]);

  // Fetch conversations for the current user (if not already done elsewhere)
  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUserId) return;
      try {
        const response = await getConversationBetweenUsers(currentUserId, currentUserId); // This is just a placeholder, replace with your actual getUserConversations
        if (Array.isArray(response?.data?.data)) {
          setConversations(response.data.data);
        }
      } catch (error) {
        // Ignore for now
      }
    };
    fetchConversations();
  }, [currentUserId]);

  
  const handleLike = async (postId) => {
    if (!requireAuth('like posts')) return;

    try {
      const token =
        localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/posts/${postId}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPosts(
        posts.map((post) =>
          post._id === postId ? { ...post, likes: response.data.likes } : post
        )
      );
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = async (postId) => {
    if (!newComment[postId] || !requireAuth('comment on posts')) return;

    try {
      const token =
        localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/comments/${postId}`,
        { content: newComment[postId] },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPosts(
        posts.map((post) => {
          if (post._id === postId) {
            return {
              ...post,
              comments: [...post.comments, response.data],
            };
          }
          return post;
        })
      );

      setNewComment({ ...newComment, [postId]: "" });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
  
    try {
      const token =
        localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Update the posts state to remove the deleted comment
      setPosts(
        posts.map((post) => {
          if (post._id === postId) {
            return {
              ...post,
              comments: post.comments.filter((comment) => comment._id !== commentId),
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  // Helper to open reply input with root comment ID and optional @username mention (Instagram model)
  const initiateReply = (rootCommentId, replyToUsername = null) => {
    setReplyingTo(rootCommentId);
    if (replyToUsername) {
      setReplyInput(prev => ({
        ...prev,
        [rootCommentId]: `@${replyToUsername} `
      }));
    } else {
      setReplyInput(prev => ({
        ...prev,
        [rootCommentId]: ""
      }));
    }
  };

  const handleReply = async (postId, parentCommentId) => {
    if (!replyInput[parentCommentId] || !requireAuth('reply to comments')) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/comments/${postId}/comments`,
        { content: replyInput[parentCommentId].trim(), parentCommentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update comments in posts state
      setPosts(posts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: [...post.comments, response.data],
          };
        }
        return post;
      }));
      setReplyInput({ ...replyInput, [parentCommentId]: "" });
      setReplyingTo(null);
    } catch (error) {
      console.error("Error posting reply:", error);
    }
  };

  // Enhanced navigation handler
  const handleStartConversation = async (postCreatorId) => {
    if (!requireAuth('start a conversation')) return;

    try {
      // First check if conversation exists in local state
      const existingConv = conversations.find(conv => 
        conv.participants.includes(currentUserId) && 
        conv.participants.includes(postCreatorId)
      );

      if (existingConv) {
        navigate(`/chat/${postCreatorId}`);
        return;
      }

      // If not found locally, check with backend
      const response = await getConversationBetweenUsers(currentUserId, postCreatorId);
      if (response.data) {
        navigate(`/chat/${postCreatorId}`);
      } else {
        // No existing conversation - navigate with just user info
        navigate(`/chat/${postCreatorId}`);
      }
    } catch (error) {
      console.error('Error checking conversation:', error);
      // Fallback - navigate with basic info
      navigate(`/chat/${postCreatorId}`);
    }
  };

  // Add new post to the top of the list and redirect to My Posts
  const handleAddPost = (newPost) => {
    setPosts((prevPosts) => [
      {
        ...newPost,
        comments: newPost.comments || [],
        likes: newPost.likes || [],
      },
      ...prevPosts,
    ]);
    setShowPostForm(false);
    navigate('/my-posts');
  };

  // 2-Level Flat Instagram-style comment thread rendering
  const renderComments = (comments, postId) => {
    // 1. Filter out all top-level root comments
    const rootComments = comments.filter(comment => !comment.parentCommentId);

    return rootComments.map(rootComment => {
      // 2. Find all replies linked to this root comment
      const replies = comments.filter(
        c => String(c.parentCommentId) === String(rootComment._id)
      );

      return (
        <div key={rootComment._id} className="flex flex-col mb-2">
          {/* Main Top-Level Comment */}
          <div className="flex gap-2 sm:gap-3 bg-[#f5f3ed] rounded-lg p-2 sm:p-3">
            {/* Avatar and main comment content */}
            <div className="h-7 w-7 bg-[#6b493d] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium text-xs">
                {rootComment.userId?.username?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <Link
                  to={rootComment.userId?._id ? `/profile/public/${rootComment.userId._id}` : '#'}
                  className="font-bold text-[#4E3B31] font-playfair text-xs sm:text-sm truncate hover:underline"
                >
                  {rootComment.userId?.username || "Unknown User"}
                </Link>
                {rootComment.userId?.isVeterinarian && (
                  <span className="px-1.5 py-0.5 bg-[#6b493d]/10 text-[#6b493d] text-xs rounded-full font-poppins">
                    Veterinarian
                  </span>
                )}
              </div>
              <p className="text-[#4E3B31] font-poppins text-xs sm:text-sm break-words">
                {rootComment.content}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-[#a07855] font-poppins">
                  {new Date(rootComment.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    }
                  )}
                </span>
                {/* Reply button */}
                {user && (
                  <button
                    className="text-xs text-[#6b493d] font-semibold hover:underline"
                    onClick={() => initiateReply(rootComment._id)}
                  >
                    Reply
                  </button>
                )}
              </div>
            </div>
            {user && (
              rootComment.userId?._id === user.id || rootComment.userId?._id === user._id ||
              posts.find(p => p._id === postId)?.userId?._id === user.id ||
              posts.find(p => p._id === postId)?.userId?._id === user._id
            ) && (
              <button
                onClick={() => handleDeleteComment(rootComment._id, postId)}
                className="p-1.5 hover:bg-[#6b493d]/10 rounded-full transition-colors flex-shrink-0"
              >
                <Trash2 className="h-4 w-4 text-[#6b493d]" />
              </button>
            )}
          </div>

          {/* All replies flatly indented under root comment */}
          {replies.length > 0 && (
            <div className="ml-6 sm:ml-8 mt-2 space-y-2 border-l-2 border-[#c9a280]/40 pl-3">
              {replies.map((reply) => (
                <div key={reply._id} className="flex gap-2 bg-[#f5f3ed]/80 rounded-lg p-2">
                  <div className="h-6 w-6 bg-[#a07855] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium text-[10px]">
                      {reply.userId?.username?.[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <Link
                        to={reply.userId?._id ? `/profile/public/${reply.userId._id}` : '#'}
                        className="font-bold text-[#4E3B31] font-playfair text-xs truncate hover:underline"
                      >
                        {reply.userId?.username || "Unknown User"}
                      </Link>
                      {reply.userId?.isVeterinarian && (
                        <span className="px-1 py-0.2 bg-[#6b493d]/10 text-[#6b493d] text-[10px] rounded-full font-poppins">
                          Vet
                        </span>
                      )}
                    </div>
                    <p className="text-[#4E3B31] font-poppins text-xs break-words">
                      {reply.content}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-[#a07855] font-poppins">
                        {new Date(reply.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      {/* Reply button on child reply prepends @username */}
                      {user && (
                        <button
                          className="text-[11px] text-[#6b493d] font-semibold hover:underline"
                          onClick={() => initiateReply(rootComment._id, reply.userId?.username)}
                        >
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                  {user && (
                    reply.userId?._id === user.id || reply.userId?._id === user._id ||
                    posts.find(p => p._id === postId)?.userId?._id === user.id ||
                    posts.find(p => p._id === postId)?.userId?._id === user._id
                  ) && (
                    <button
                      onClick={() => handleDeleteComment(reply._id, postId)}
                      className="p-1 hover:bg-[#6b493d]/10 rounded-full transition-colors flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-[#6b493d]" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reply input form */}
          {replyingTo === rootComment._id && (
            <div className="ml-6 sm:ml-8 mt-2 flex gap-2">
              <input
                type="text"
                autoFocus
                value={replyInput[rootComment._id] || ""}
                onChange={e =>
                  setReplyInput({ ...replyInput, [rootComment._id]: e.target.value })
                }
                placeholder="Write a reply..."
                className="flex-1 bg-[#f5f3ed] rounded-full px-3 py-1.5 text-xs text-[#4E3B31] placeholder-[#a07855] border border-[#c9a280]/40 focus:outline-none focus:ring-1 focus:ring-[#6b493d] font-poppins"
                onKeyPress={e =>
                  e.key === "Enter" && handleReply(postId, rootComment._id)
                }
              />
              <button
                onClick={() => handleReply(postId, rootComment._id)}
                className="px-3 py-1 bg-[#6b493d] text-white rounded-full hover:bg-[#5a3c32] transition-all font-poppins text-xs"
              >
                Reply
              </button>
              <button
                onClick={() => setReplyingTo(null)}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f3ed] flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6b493d] border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f3ed] p-4">
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ed]">
      <div className="max-w-md mx-auto px-3 py-4 sm:px-4 sm:py-6 md:max-w-2xl lg:max-w-4xl">
         {/* Header Section - More compact on mobile */}
         <div className="mb-6 sm:mb-10">
           <div className="flex items-center justify-center gap-3 mb-3 sm:mb-5">
             <h1 className="text-3xl sm:text-4xl font-bold text-[#4E3B31] font-playfair">
               Community Posts
             </h1>
             {isRefreshing && (
               <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#6b493d] border-t-transparent opacity-60"></div>
             )}
           </div>
           <p className="text-[#6b493d] text-center mb-4 sm:mb-6 font-poppins text-sm sm:text-base">
             Get your queries answered by our professional veterinarians
           </p>
          
          {/* Action Bar - Full width on mobile */}
          {!showPostForm && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              {user ? (
                <>
                  <button
                    onClick={() => setShowPostForm(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6b493d] text-white rounded-full hover:bg-[#5a3c32] transition-all shadow-md font-poppins text-sm sm:text-base"
                  >
                    <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Create Post</span>
                  </button>
                  <Link
                    to="/my-posts"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-[#6b493d] rounded-full hover:bg-[#f8f4ed] transition-all border border-[#6b493d] font-poppins text-sm sm:text-base"
                  >
                    <UserCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>My Posts</span>
                  </Link>
                </>
              ) : (
                <Link
                  to="/signin"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6b493d] text-white rounded-full hover:bg-[#5a3c32] transition-all shadow-md font-poppins text-sm sm:text-base"
                >
                  Sign in to Post
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Post Upload Form at the top */}
        {showPostForm && (
          <PostUploadForm
            onAddPost={handleAddPost}
            onCancel={() => setShowPostForm(false)}
          />
        )}

        {/* Posts Feed */}
        <div className="space-y-4 sm:space-y-6">
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 text-center border border-[#c9a280]/20">
              <div className="max-w-md mx-auto">
                <p className="text-lg sm:text-xl text-[#6b493d] font-playfair mb-2 sm:mb-3">
                  No posts yet
                </p>
                <p className="text-[#a07855] font-poppins text-sm">
                  Be the first to share your pet story!
                </p>
              </div>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post._id}
                className="bg-white rounded-xl shadow-md border border-[#c9a280]/10 overflow-hidden transform transition-all"
              >
                {/* Post Header */}
                <div className="p-3 sm:p-4 flex items-center gap-3 border-b border-[#f5f3ed]">
                  <Link to={post.userId?._id ? `/profile/public/${post.userId._id}` : '#'} className="h-10 w-10 bg-[#f5f3ed] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {userProfileImages[post.userId?._id] ? (
                      <img
                        src={`${API_BASE_URL.replace('/api', '')}${userProfileImages[post.userId._id]}`}
                        alt={post.userId?.username || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F8F4ED] border-2 border-white shadow-md">
                        <span className="text-base font-bold" style={{ color: '#6b493d' }}>
                          {(post.userId?.username || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link to={post.userId?._id ? `/profile/public/${post.userId._id}` : '#'} className="font-bold text-[#4E3B31] font-playfair text-sm sm:text-base truncate hover:underline">
                        {post.userId?.username || "Unknown User"}
                      </Link>
                      {post.userId?.isVeterinarian && (
                        <span className="px-2 py-0.5 bg-[#6b493d]/10 text-[#6b493d] text-xs rounded-full font-poppins">
                          Veterinarian
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#a07855] font-poppins">
                      {new Date(post.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {/* Enhanced Chat Button - top right, tooltip to the left */}
                  {user && post.userId?._id !== currentUserId && (
                    <div className="relative group ml-2 flex items-center">
                      <button
                        onClick={() => handleStartConversation(
                          post.userId?._id
                        )}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#6b493d]/10 hover:bg-[#6b493d]/20 text-[#6b493d] rounded-full transition-colors"
                        title={`Message ${post.userId?.username || 'this user'}`}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-xs font-medium hidden sm:inline">Chat</span>
                      </button>
                      <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 hidden group-hover:block bg-white shadow-lg rounded-lg p-2 text-sm whitespace-nowrap z-10">
                        Start private conversation
                      </div>
                    </div>
                  )}
                </div>

                {/* Post Image - Fixed aspect ratio & better containment */}
                {post.imageUrl && (
                  <div className="relative w-full aspect-square sm:aspect-video">
                    <img
                      src={post.imageUrl}
                      alt="Post content"
                      className="w-full h-full object-contain bg-black/5"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Post Content */}
                <div className="p-3 sm:p-4">
                  <p className="text-[#4E3B31] font-poppins text-sm sm:text-base mb-4 leading-relaxed break-words" style={{ whiteSpace: 'pre-wrap' }}>
                    {DOMPurify.sanitize(post.caption, { ALLOWED_TAGS: [] })}
                  </p>

                  {/* Engagement Section */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#f5f3ed]">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post._id)}
                        className={`flex items-center gap-1.5 transition-colors ${
                          user && post.likes.includes(currentUserId)
                            ? "text-red-600"
                            : "text-[#a07855] hover:text-[#6b493d]"
                        }`}
                      >
                        <Heart
                          className={`h-5 w-5 transition-transform hover:scale-110 ${
                            user && post.likes.includes(currentUserId)
                              ? "fill-current text-red-600"
                              : ""
                          }`}
                        />
                        <span className="font-medium text-sm">{post.likes.length}</span>
                      </button>
                      <button
                        onClick={() => toggleComments(post._id)}
                        className="flex items-center gap-1.5 text-[#a07855] hover:text-[#6b493d] transition-colors"
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span className="font-medium text-sm">{post.comments.length}</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Section - Better spacing for mobile */}
                  <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment[post._id] || ""}
                        onChange={(e) =>
                          setNewComment({
                            ...newComment,
                            [post._id]: e.target.value,
                          })
                        }
                        placeholder="Write a comment..."
                        className="flex-1 bg-[#f5f3ed] rounded-full px-4 py-2 text-[#4E3B31] text-sm placeholder-[#a07855] focus:outline-none focus:ring-1 focus:ring-[#6b493d] font-poppins"
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleComment(post._id)
                        }
                      />
                      <button
                        onClick={() => handleComment(post._id)}
                        className="px-3 py-2 bg-[#6b493d] text-white rounded-full hover:bg-[#5a3c32] transition-all font-poppins font-medium text-sm"
                      >
                        Post
                      </button>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      {renderComments(
                        expandedComments[post._id] ? post.comments : post.comments.slice(0, 2),
                        post._id
                      )}
                      {post.comments.length > 2 && (
                        <button
                          onClick={() => toggleComments(post._id)}
                          className="w-full text-center py-2 text-[#6b493d] hover:text-[#5a3c32] transition-colors font-poppins font-medium text-xs sm:text-sm"
                        >
                          {expandedComments[post._id]
                            ? "Show Less"
                            : `View ${post.comments.length - 2} More Comments`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Postnew;

