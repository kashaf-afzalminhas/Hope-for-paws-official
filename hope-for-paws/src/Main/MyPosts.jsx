import React, { useState, useEffect } from "react";
import axios from "axios";
import DOMPurify from "dompurify";
import { useAuth } from "../context/AuthContext";
import { Pencil, Trash2, X } from "lucide-react";
import { API_BASE_URL } from '../config';
import { getCurrentUserId } from '../lib/utils';

const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [savingStates, setSavingStates] = useState({}); // Track saving state per post
  const { user } = useAuth();
  const [expandedComments, setExpandedComments] = useState({});
  // Check user authentication state
  const userr = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
  const userId = getCurrentUserId(userr);

  useEffect(() => {
    if (!userId) return;
  
    setLoading(true);
    fetchUserPosts();
  }, []); // Run only once when the component mounts
  
  const fetchUserPosts = async () => {
    if (!userId) {
      console.log("User ID is missing");
      return; // Prevent unnecessary calls
    }
  
    try {
      setLoading(true);
      setError(""); // Reset error before making a request
  
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Token is missing. Please log in again.");
      }
  
      const response = await axios.get(
        `${API_BASE_URL}/posts/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setPosts(response.data);
  
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("Failed to load posts. Please try again later.");
    } finally {
      setLoading(false); // Ensure loading is set to false
    }
  };

 

  const handleEdit = (post) => {
    setEditingPost(post._id);
    setEditCaption(post.caption);
  };

  const handleSaveEdit = async (postId) => {
    try {
      // Set saving state for this specific post
      setSavingStates(prev => ({ ...prev, [postId]: true }));
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/posts/${postId}`,
        { caption: editCaption },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEditingPost(null);
      
      // Show immediate success feedback
      setSuccessMessage('Post updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      fetchUserPosts();
    } catch (error) {
      console.error("Error updating post:", error);
      setError("Failed to update post. Please try again.");
      setTimeout(() => setError(''), 5000);
    } finally {
      // Clear saving state
      setSavingStates(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUserPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      setError("Failed to delete post. Please try again.");
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  return (
    <section className="min-h-screen bg-[#f5f3ed] py-12">
      <div className="max-w-6xl mx-auto px-4">
       

        {/* Posts Section */}
        <h3 className="text-3xl font-bold text-[#6b493d] mb-8 text-center" style={{ fontFamily: '"Playfair Display", serif' }}>
          My Shared Posts
        </h3>

        {successMessage && (
          <div className="mt-4 mb-8 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-center">
            <p>{successMessage}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6b493d] border-t-transparent"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-[#c9a280]/20 rounded-xl p-8 text-center border-2 border-dashed border-[#6b493d]/30">
            <p className="text-xl text-[#6b493d]/80 italic">No posts yet. Share your first pet moment!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <div key={post._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="relative group">
                  <img 
                    src={post.imageUrl} 
                    alt="Pet" 
                    className="w-full h-60 object-cover rounded-t-2xl transition-transform duration-300 hover:scale-105" 
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#6b493d]/40 to-transparent rounded-t-2xl" />
                </div>
                
                <div className="p-6">
                  {editingPost === post._id ? (
                    <div className="space-y-4">
                      <textarea
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d]"
                        rows={3}
                        style={{ fontFamily: '"Poppins", sans-serif' }}
                      />
                      <div className="flex justify-end space-x-3">
                        <button 
                          onClick={() => setEditingPost(null)}
                          className="p-2 hover:bg-[#6b493d]/10 rounded-full transition-colors"
                          disabled={savingStates[post._id]}
                        >
                          <X className="h-5 w-5 text-[#6b493d]" />
                        </button>
                        <button
                          onClick={() => handleSaveEdit(post._id)}
                          disabled={savingStates[post._id]}
                          className="px-4 py-2 bg-[#6b493d] text-white rounded-lg hover:bg-[#5a3d32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          style={{ fontFamily: '"Poppins", sans-serif' }}
                        >
                          {savingStates[post._id] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              <span>Saving...</span>
                            </>
                          ) : (
                            <span>Save Changes</span>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p 
                        className="text-[#6b493d] mb-4 italic text-lg leading-relaxed"
                        style={{ fontFamily: '"Poppins", sans-serif', whiteSpace: 'pre-wrap' }}
                      >
                        "{DOMPurify.sanitize(post.caption, { ALLOWED_TAGS: [] })}"
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4 text-[#6b493d]/80">
                          <div className="flex items-center space-x-1">
                            <span>ÃƒÂ¢Ã‚ÂÃ‚Â¤ÃƒÂ¯Ã‚Â¸Ã‚Â</span>
                            <span>{post.likes.length}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¬</span>
                            <span>{post.comments.length}</span>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEdit(post)}
                            className="p-2 hover:bg-[#6b493d]/10 rounded-full transition-colors"
                          >
                            <Pencil className="h-5 w-5 text-[#6b493d]" />
                          </button>
                          <button
                            onClick={() => handleDelete(post._id)}
                            className="p-2 hover:bg-[#6b493d]/10 rounded-full transition-colors"
                          >
                            <Trash2 className="h-5 w-5 text-[#6b493d]" />
                          </button>
                        </div>
                        <button
                          onClick={() => toggleComments(post._id)}
                          className="text-[#6b493d] hover:underline"
                        >
                          {expandedComments[post._id] ? "Hide Comments" : "View Comments"}
                        </button>
                      </div>

                      {expandedComments[post._id] && (
                        <div className="mt-4 space-y-4">
                          {post.comments.length > 0 ? (
                            post.comments.map((comment) => (
                              <div key={comment._id} className="bg-[#f5f3ed] p-4 rounded-lg">
                                <p className="text-[#6b493d] font-medium">
                                  {comment.userId?.username || "Unknown User"}
                                </p>
                                <p className="text-[#6b493d]/80">{comment.content}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-[#6b493d]/80 italic">No comments yet. Be the first to comment!</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
            {error}
          </div>
        )}
      </div>
    </section>
  );
  
};

export default MyPosts;