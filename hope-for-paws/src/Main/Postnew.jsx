import React, { useState, useEffect } from "react";
import axios from "axios";
import { Heart, MessageCircle, UserCircle, Trash2, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from '../config';

const Postnew = () => {
  const [posts, setPosts] = useState([]);
  const [newComment, setNewComment] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { userd } = useAuth();
  const [expandedComments, setExpandedComments] = useState({});
  // Check user authentication state
  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f3ed] flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#6b493d] border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f3ed] p-6">
        <div className="max-w-4xl mx-auto bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ed]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#4E3B31] text-center mb-6 font-playfair">
            Community Posts
          </h1>
          <p className="text-[#6b493d] text-center mb-8 font-poppins">
            Get your queries answered by our professional veterinarians
          </p>
          
          {/* Action Bar */}
          <div className="flex flex-wrap gap-4 justify-center items-center">
            {user ? (
              <>
                <Link
                  to="/createpost"
                  className="flex items-center gap-2 px-6 py-3 bg-[#6b493d] text-white rounded-full hover:bg-[#5a3c32] transition-all transform hover:scale-105 shadow-lg font-poppins"
                >
                  <PlusCircle className="h-5 w-5" />
                  <span>Create Post</span>
                </Link>
                <Link
                  to="/my-posts"
                  className="flex items-center gap-2 px-6 py-3 bg-white text-[#6b493d] rounded-full hover:bg-[#f8f4ed] transition-all border-2 border-[#6b493d] font-poppins"
                >
                  <UserCircle className="h-5 w-5" />
                  <span>My Posts</span>
                </Link>
              </>
            ) : (
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#6b493d] text-white rounded-full hover:bg-[#5a3c32] transition-all transform hover:scale-105 shadow-lg font-poppins"
              >
                Sign in to Post
              </Link>
            )}
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-8">
          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center border-2 border-[#c9a280]/20">
              <div className="max-w-md mx-auto">
                <p className="text-xl text-[#6b493d] font-playfair mb-4">
                  No posts yet
                </p>
                <p className="text-[#a07855] font-poppins">
                  Be the first to share your pet story!
                </p>
              </div>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post._id}
                className="bg-white rounded-2xl shadow-lg border border-[#c9a280]/10 overflow-hidden transform transition-all hover:shadow-xl"
              >
                {/* Post Header */}
                <div className="p-6 flex items-center gap-4 border-b border-[#f5f3ed]">
                  <div className="h-12 w-12 bg-[#f5f3ed] rounded-full flex items-center justify-center">
                    <UserCircle className="h-8 w-8 text-[#6b493d]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#4E3B31] font-playfair">
                        {post.userId?.username || "Unknown User"}
                      </h3>
                      {post.userId?.isVeterinarian && (
                        <span className="px-3 py-1 bg-[#6b493d]/10 text-[#6b493d] text-xs rounded-full font-poppins">
                          Veterinarian
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#a07855] font-poppins">
                      {new Date(post.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Post Image */}
                {post.imageUrl && (
                  <div className="relative aspect-video">
                    <img
                      src={post.imageUrl}
                      alt="Pet"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Post Content */}
                <div className="p-6">
                  <p className="text-[#4E3B31] font-poppins text-lg mb-6 leading-relaxed">
                    {post.caption}
                  </p>

                  {/* Engagement Section */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#f5f3ed]">
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => handleLike(post._id)}
                        className={`flex items-center gap-2 transition-colors ${
                          user && post.likes.includes(user._id)
                            ? "text-[#6b493d]"
                            : "text-[#a07855] hover:text-[#6b493d]"
                        }`}
                      >
                        <Heart
                          className={`h-6 w-6 transition-transform hover:scale-110 ${
                            user && post.likes.includes(user._id)
                              ? "fill-current"
                              : ""
                          }`}
                        />
                        <span className="font-medium">{post.likes.length}</span>
                      </button>
                      <button
                        onClick={() => toggleComments(post._id)}
                        className="flex items-center gap-2 text-[#a07855] hover:text-[#6b493d] transition-colors"
                      >
                        <MessageCircle className="h-6 w-6" />
                        <span className="font-medium">{post.comments.length}</span>
                      </button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="mt-6 space-y-6">
                    {user && (
                      <div className="flex gap-3">
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
                          className="flex-1 bg-[#f5f3ed] rounded-full px-6 py-3 text-[#4E3B31] placeholder-[#a07855] focus:outline-none focus:ring-2 focus:ring-[#6b493d] font-poppins"
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleComment(post._id)
                          }
                        />
                        <button
                          onClick={() => handleComment(post._id)}
                          className="px-6 py-3 bg-[#6b493d] text-white rounded-full hover:bg-[#5a3c32] transition-all transform hover:scale-105 font-poppins font-medium"
                        >
                          Post
                        </button>
                      </div>
                    )}

                    <div className="space-y-4">
                      {(expandedComments[post._id]
                        ? post.comments
                        : post.comments.slice(0, 2)
                      ).map((comment) => (
                        <div
                          key={comment._id}
                          className="flex gap-4 bg-[#f5f3ed] rounded-xl p-4"
                        >
                          <div className="h-8 w-8 bg-[#6b493d] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium">
                              {comment.userId?.username?.[0]?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-[#4E3B31] font-playfair">
                                {comment.userId?.username || "Unknown User"}
                              </h4>
                              {comment.userId?.isVeterinarian && (
                                <span className="px-2 py-0.5 bg-[#6b493d]/10 text-[#6b493d] text-xs rounded-full font-poppins">
                                  Veterinarian
                                </span>
                              )}
                            </div>
                            <p className="text-[#4E3B31] font-poppins">
                              {comment.content}
                            </p>
                            <p className="text-xs text-[#a07855] mt-2 font-poppins">
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
                          </div>
                          {user && comment.userId?._id === user.id && (
                            <button
                              onClick={() =>
                                handleDeleteComment(comment._id, post._id)
                              }
                              className="p-2 hover:bg-[#6b493d]/10 rounded-full transition-colors"
                            >
                              <Trash2 className="h-5 w-5 text-[#6b493d]" />
                            </button>
                          )}
                        </div>
                      ))}
                      {post.comments.length > 2 && (
                        <button
                          onClick={() => toggleComments(post._id)}
                          className="w-full text-center py-3 text-[#6b493d] hover:text-[#5a3c32] transition-colors font-poppins font-medium"
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

