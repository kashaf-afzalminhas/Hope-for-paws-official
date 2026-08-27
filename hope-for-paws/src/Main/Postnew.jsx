import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import DOMPurify from "dompurify";
import { Heart, MessageCircle, UserCircle, Trash2, PlusCircle, MessageSquare, PawPrint } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../config';
import { getCurrentUserId } from '../lib/utils';
import { getUserPublicProfile } from './api';
import { getConversationBetweenUsers } from './api'; // <-- Make sure this is imported
import PostUploadForm from './PostUploadForm';
import PostCard from '../Components/posts/PostCard';
import PostViewToggle from '../Components/posts/PostViewToggle';
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
  const [viewMode, setViewMode] = useState('grid');
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

  const handleDeleteComment = async (postId, commentId) => {
  
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

  const handleCommentSubmit = async (postId, content, parentCommentId = null) => {
    if (!content) return;
    if (!requireAuth('comment on this post')) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const endpoint = parentCommentId 
        ? `${API_BASE_URL}/comments/${postId}/comments` 
        : `${API_BASE_URL}/comments/${postId}`;
        
      const response = await axios.post(
        endpoint,
        { content, parentCommentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts(
        posts.map((post) => {
          if (post._id === postId) {
            return {
              ...post,
              comments: [...(post.comments || []), response.data],
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // A selected image set replaces the post's current photos.
  const handleSaveEdit = async (postId, caption, imageFiles) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const formData = new FormData();
      formData.append('caption', caption);
      imageFiles.forEach((imageFile) => formData.append('images', imageFile));

      const response = await axios.put(
        `${API_BASE_URL}/posts/${postId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // Do NOT set Content-Type manually for FormData — axios/browser needs to
            // generate the multipart boundary itself, or the backend parser can fail
            // to read the file (and sometimes the text fields too).
          },
        }
      );

      // Use the server's returned post if provided, otherwise at least update the caption
      setPosts((previousPosts) => previousPosts.map((p) => (
        p._id === postId ? { ...p, ...(response.data || {}), caption } : p
      )));
    } catch (error) {
      console.error("Error updating post:", error);
      throw error; // let PostCard know the save failed so it keeps the form open
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(posts.filter((p) => p._id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-gradient flex flex-col justify-center items-center gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-clay border-t-transparent"></div>
        <p className="text-sm text-ink-soft font-body">Loading community posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-warm-gradient p-6 flex justify-center items-center">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-2xl p-6 text-center shadow-warm-sm">
          <p className="text-red-700 font-body">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,_#fbf8f3_0%,_#f5e8dc_52%,_#ead8c8_100%)] py-10 md:py-14 px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(221,176,122,0.2),_transparent_34%)]" />
      <div className="relative max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-[#8b5a3c] font-body">
            <PawPrint className="h-3.5 w-3.5" />
            Community Feed
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#4e3b31] mt-2 flex items-center justify-center gap-3">
            <span>Hope For Paws Feed</span>
            {isRefreshing && (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-clay border-t-transparent opacity-60"></div>
            )}
          </h1>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-sand" />
            <Heart className="h-3.5 w-3.5 text-like fill-current" />
            <span className="h-px w-10 bg-sand" />
          </div>
          <p className="text-ink-soft text-center mt-3 font-body text-sm sm:text-base max-w-xl mx-auto">
            Get your queries answered by our professional veterinarians & share warm pet moments with the community.
          </p>

          {/* Action Bar */}
          {!showPostForm && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-6">
              {user ? (
                <>
                  <button
                    onClick={() => setShowPostForm(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-clay text-cream rounded-full hover:bg-clay-deep transition-all shadow-warm-sm font-body text-sm font-semibold"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Create Post</span>
                  </button>
                  <Link
                    to="/my-posts"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-ink rounded-full hover:bg-sand-light transition-all border border-sand shadow-warm-sm font-body text-sm font-semibold"
                  >
                    <UserCircle className="h-4 w-4 text-clay" />
                    <span>My Posts</span>
                  </Link>
                </>
              ) : (
                <Link
                  to="/signin"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-clay text-cream rounded-full hover:bg-clay-deep transition-all shadow-warm-sm font-body text-sm font-semibold"
                >
                  Sign in to Post
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Post Upload Form Modal / Drawer */}
        {showPostForm && (
          <div className="mb-10 max-w-2xl mx-auto">
            <PostUploadForm
              onAddPost={handleAddPost}
              onCancel={() => setShowPostForm(false)}
            />
          </div>
        )}

        {/* Posts Feed Grid */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-sand max-w-xl mx-auto shadow-warm-sm">
            <PawPrint className="h-8 w-8 text-clay mx-auto mb-3" />
            <p className="text-xl text-ink/80 italic font-heading">
              No posts yet. Be the first to share a pet moment!
            </p>
          </div>
        ) : (
          <>
          <div className="flex justify-end mb-4"><PostViewToggle value={viewMode} onChange={setViewMode} /></div>
          {viewMode === 'grid' ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-start">
            {posts.map((post) => {
              const isOwner = currentUserId && (post.userId?._id === currentUserId || post.userId === currentUserId);
              const isLiked = Boolean(user && post.likes && post.likes.includes(currentUserId));

              return (
                <PostCard
                  key={post._id}
                  post={post}
                  isOwner={isOwner}
                  showAuthor={true}
                  isLiked={isLiked}
                  likeCount={post.likes ? post.likes.length : 0}
                  comments={post.comments || []}
                  onLike={() => handleLike(post._id)}
                  onCommentSubmit={handleCommentSubmit}
                  onDeleteComment={handleDeleteComment}
                  onEditSave={handleSaveEdit}
                  onDeletePost={handleDeletePost}
                  onAuthorClick={(authorId) => navigate(`/profile/public/${authorId}`)}
                  onCardClick={() => navigate(`/posts/${post._id}`)}
                />
              );
            })}
          </div> : <div className="mx-auto flex max-w-xl flex-col gap-5 pb-4">
            {posts.map((post) => <div key={post._id}><PostCard post={post} isOwner={currentUserId && (post.userId?._id === currentUserId || post.userId === currentUserId)} showAuthor likeCount={post.likes?.length || 0} comments={post.comments || []} onLike={() => handleLike(post._id)} onCommentSubmit={handleCommentSubmit} onDeleteComment={handleDeleteComment} onEditSave={handleSaveEdit} onDeletePost={handleDeletePost} onAuthorClick={(authorId) => navigate(`/profile/public/${authorId}`)} onCardClick={() => navigate(`/posts/${post._id}`)} /></div>)}
          </div>}
          </>
        )}
      </div>
    </div>
  );
};

export default Postnew;