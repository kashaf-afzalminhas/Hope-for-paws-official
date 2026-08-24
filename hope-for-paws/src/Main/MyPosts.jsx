import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Heart, PawPrint } from "lucide-react";
import { API_BASE_URL } from '../config';
import { getCurrentUserId } from '../lib/utils';
import PostCard from "../Components/posts/PostCard"; // adjust to actual path
import PostViewToggle from "../Components/posts/PostViewToggle";


const MyPosts = ({ embedded = false }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "slide"
  const { user } = useAuth();

  const userr = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
  const userId = getCurrentUserId(userr);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    fetchUserPosts();
  }, []);

  const fetchUserPosts = async () => {
    if (!userId) {
      console.log("User ID is missing");
      return;
    }

    try {
      setLoading(true);
      setError("");

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
      setLoading(false);
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

      setSuccessMessage('Post updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setPosts((previousPosts) => previousPosts.map((post) => (
        post._id === postId ? { ...post, ...(response.data || {}), caption } : post
      )));
    } catch (error) {
      console.error("Error updating post:", error);
      setError("Failed to update post. Please try again.");
      setTimeout(() => setError(''), 5000);
      throw error; // let PostCard know the save failed so it keeps the form open
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

  return (
    <section className={embedded ? "relative overflow-hidden rounded-[28px] border border-[#b88b68] bg-[radial-gradient(circle_at_top_right,_rgba(155,107,69,0.16),_transparent_38%),linear-gradient(135deg,_#fbf8f3_0%,_#f5e8dc_52%,_#dfc3aa_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-6" : "relative min-h-screen overflow-hidden bg-cream py-10 md:py-14"}>
      {!embedded && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(160,120,85,0.16),_transparent_70%)]" />
      )}
      {embedded && <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.42)_48%,transparent_100%)]" />}
      <div className={embedded ? "relative w-full" : "relative max-w-6xl mx-auto px-4"}>

        {/* Header */}
        <div className={embedded ? "text-left mb-8" : "text-center mb-10"}>
          <span className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-[#6b493d] font-body">
            <PawPrint className="h-3.5 w-3.5" />
            Your Gallery
          </span>
          <h3 className="text-2xl md:text-3xl font-bold text-[#4E3B31] mt-2 font-heading">
            My Shared Posts
          </h3>
          {!embedded && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-[#9b6b45]" />
              <Heart className="h-3.5 w-3.5 text-[#6b493d] fill-current" />
              <span className="h-px w-10 bg-[#9b6b45]" />
            </div>
          )}
        </div>

        {!loading && posts.length > 0 && (
          <div className="flex items-center justify-end mb-4">
            <PostViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        )}

        {successMessage && (
          <div className="mb-8 max-w-md mx-auto p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-center shadow-warm-sm font-body">
            <p>{successMessage}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-clay border-t-transparent"></div>
            <p className="text-sm text-ink/60 font-body">
              Loading your posts...
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-sand max-w-xl mx-auto shadow-warm-md">
            <PawPrint className="h-8 w-8 text-clay mx-auto mb-3" />
            <p className="text-xl text-ink/80 italic font-heading">
              No posts yet. Share your first pet moment!
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                isOwner={true}
                likeCount={post.likes?.length || 0}
                comments={post.comments || []}
                onEditSave={handleSaveEdit}
                onDeletePost={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="mx-auto flex max-w-xl flex-col gap-5 pb-4">
            {posts.map((post) => (
              <div key={post._id}>
                <PostCard post={post} isOwner={true} likeCount={post.likes?.length || 0} comments={post.comments || []} onEditSave={handleSaveEdit} onDeletePost={handleDelete} />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center max-w-md mx-auto shadow-sm font-body">
            {error}
          </div>
        )}
      </div>
    </section>
  );
};

export default MyPosts;