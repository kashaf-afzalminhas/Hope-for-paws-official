import React, { useState, useEffect } from "react";
import axios from "axios";
import { Heart, MessageCircle, UserCircle, Trash2, PlusCircle, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from '../config';
import { getCurrentUserId } from '../lib/utils';
import { getUserPublicProfile } from './api';
import { getConversationBetweenUsers } from './api'; // <-- Make sure this is imported
 
const Postnew = () => {
  const [posts, setPosts] = useState([]);
  const [newComment, setNewComment] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { userd } = useAuth();
  const [expandedComments, setExpandedComments] = useState({});
  const navigate = useNavigate();
  const [userProfileImages, setUserProfileImages] = useState({});
  const [conversations, setConversations] = useState([]); // Add this if not already present
  const [replyInput, setReplyInput] = useState({}); // Add this line
  const [replyingTo, setReplyingTo] = useState(null); // commentId being replied to
  
  // Check user authentication state
  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));
  const currentUserId = getCurrentUserId(user);
    
  const toggleComments = (postId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };
  
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/posts`);
      setPosts(response.data);
      setError("");
    } catch (error) {
      setError("Failed to load posts. Please try again later.");
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, []);

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
        } catch (err) {
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
    if (!user) return; // Only allow likes if the user is logged in

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
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
    if (!user || !newComment[postId]) return; // Only allow comments if the user is logged in

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
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
        localStorage.getItem("token") || sessionStorage.getItem("token");
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

  const handleReply = async (postId, parentCommentId) => {
    if (!user || !replyInput[parentCommentId]) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/comments/${postId}/comments`,
        { content: replyInput[parentCommentId], parentCommentId },
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
  const handleStartConversation = async (postCreatorId, postCreatorUsername) => {
    if (!user) {
      navigate('/signin');
      return;
    }

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

  const renderComments = (comments, postId, parent = null) => {
    return comments
      .filter(comment => comment.parentCommentId === parent)
      .map(comment => (
        <div key={comment._id} className="flex flex-col">
          <div className="flex gap-2 sm:gap-3 bg-[#f5f3ed] rounded-lg p-2 sm:p-3">
            {/* Avatar and main comment content */}
            <div className="h-7 w-7 bg-[#6b493d] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium text-xs">
                {comment.userId?.username?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <h4 className="font-bold text-[#4E3B31] font-playfair text-xs sm:text-sm truncate">
                  {comment.userId?.username || "Unknown User"}
                </h4>
                {comment.userId?.isVeterinarian && (
                  <span className="px-1.5 py-0.5 bg-[#6b493d]/10 text-[#6b493d] text-xs rounded-full font-poppins">
                    Veterinarian
                  </span>
                )}
              </div>
              <p className="text-[#4E3B31] font-poppins text-xs sm:text-sm break-words">
                {comment.content}
              </p>
              <p className="text-xs text-[#a07855] mt-1 font-poppins">
                {new Date(comment.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }
                )}
              </p>
              {/* Reply button */}
              {user && (
                <button
                  className="text-xs text-[#a07855] hover:underline mt-1"
                  onClick={() => setReplyingTo(comment._id)}
                >
                  Reply
                </button>
              )}
              {/* Reply input */}
              {replyingTo === comment._id && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={replyInput[comment._id] || ""}
                    onChange={e =>
                      setReplyInput({ ...replyInput, [comment._id]: e.target.value })
                    }
                    placeholder="Write a reply..."
                    className="flex-1 bg-[#f5f3ed] rounded-full px-3 py-1 text-xs text-[#4E3B31] placeholder-[#a07855] focus:outline-none focus:ring-1 focus:ring-[#6b493d] font-poppins"
                    onKeyPress={e =>
                      e.key === "Enter" && handleReply(postId, comment._id)
                    }
                  />
                  <button
                    onClick={() => handleReply(postId, comment._id)}
                    className="px-2 py-1 bg-[#6b493d] text-white rounded-full hover:bg-[#5a3c32] transition-all font-poppins text-xs"
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
            {user && comment.userId?._id === user.id && (
              <button
                onClick={() => handleDeleteComment(comment._id, postId)}
                className="p-1.5 hover:bg-[#6b493d]/10 rounded-full transition-colors flex-shrink-0"
              >
                <Trash2 className="h-4 w-4 text-[#6b493d]" />
              </button>
            )}
          </div>
          {/* Render replies (one level deep) */}
          <div className="ml-8 mt-2">
            {renderComments(comments, postId, comment._id)}
          </div>
        </div>
      ));
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
          <h1 className="text-3xl sm:text-4xl font-bold text-[#4E3B31] text-center mb-3 sm:mb-5 font-playfair">
            Community Posts
          </h1>
          <p className="text-[#6b493d] text-center mb-4 sm:mb-6 font-poppins text-sm sm:text-base">
            Get your queries answered by our professional veterinarians
          </p>
          
          {/* Action Bar - Full width on mobile */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {user ? (
              <>
                <Link
                  to="/createpost"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6b493d] text-white rounded-full hover:bg-[#5a3c32] transition-all shadow-md font-poppins text-sm sm:text-base"
                >
                  <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Create Post</span>
                </Link>
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
        </div>

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
                          post.userId?._id,
                          post.userId?.username
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
                  <p className="text-[#4E3B31] font-poppins text-sm sm:text-base mb-4 leading-relaxed break-words">
                    {post.caption}
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
                    {user && (
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
                    )}

                    <div className="space-y-2 sm:space-y-3">
                      {renderComments(
                        expandedComments[post._id] ? post.comments : post.comments.slice(0, 2),
                        post._id,
                        null
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

