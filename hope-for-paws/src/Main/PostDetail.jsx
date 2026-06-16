import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, UserCircle, ArrowLeft, Trash2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Check user authentication state
  const userr = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/posts/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPost(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load post. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!userr) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/posts/${id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // After liking/unliking, refresh the post data
      await fetchPost();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!userr || !newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/comments/${id}`,
        { content: newComment },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // After adding comment, refresh the post data
      await fetchPost();
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.delete(
        `${API_BASE_URL}/comments/${commentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // After deleting comment, refresh the post data
      await fetchPost();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
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
      <div className="min-h-screen bg-[#f5f3ed] flex justify-center items-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/posts')}
            className="px-4 py-2 bg-[#6b493d] text-white rounded-lg hover:bg-[#5a3c32] transition-colors"
          >
            Back to Posts
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#f5f3ed] flex justify-center items-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Post not found</p>
          <button
            onClick={() => navigate('/posts')}
            className="px-4 py-2 bg-[#6b493d] text-white rounded-lg hover:bg-[#5a3c32] transition-colors"
          >
            Back to Posts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ed] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/posts')}
          className="flex items-center gap-2 text-[#6b493d] hover:text-[#5a3c32] transition-colors mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Posts
        </button>

        {/* Post Card */}
        <div className="bg-white rounded-xl shadow-md border border-[#c9a280]/10 overflow-hidden">
          {/* Post Header */}
          <div className="p-4 flex items-center gap-3 border-b border-[#f5f3ed]">
            <div className="h-12 w-12 bg-[#f5f3ed] rounded-full flex items-center justify-center flex-shrink-0">
              <UserCircle className="h-8 w-8 text-[#6b493d]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-[#4E3B31] font-playfair text-lg truncate">
                  {post.userId?.username || "Unknown User"}
                </h3>
                {post.userId?.isVeterinarian && (
                  <span className="px-2 py-0.5 bg-[#6b493d]/10 text-[#6b493d] text-xs rounded-full font-poppins">
                    Veterinarian
                  </span>
                )}
              </div>
              <p className="text-sm text-[#a07855] font-poppins">
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            </div>
          </div>

          {/* Post Image */}
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
          <div className="p-4">
            <p className="text-[#4E3B31] font-poppins text-base mb-4 leading-relaxed break-words">
              {post.caption}
            </p>

            {/* Engagement Section */}
            <div className="flex items-center justify-between pb-4 border-b border-[#f5f3ed]">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 transition-colors ${
                    userr && post.likes.includes(userr._id || userr.id)
                      ? "text-[#6b493d]"
                      : "text-[#a07855] hover:text-[#6b493d]"
                  }`}
                >
                  <Heart
                    className={`h-5 w-5 transition-transform hover:scale-110 ${
                      userr && post.likes.includes(userr._id || userr.id)
                        ? "fill-current"
                        : ""
                    }`}
                  />
                  <span className="font-medium text-sm">{post.likes.length}</span>
                </button>
                <div className="flex items-center gap-1.5 text-[#a07855]">
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-medium text-sm">{post.comments.length}</span>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-4">
              <h4 className="font-semibold text-[#6b493d] mb-3">Comments</h4>
              
              {/* Add Comment Form */}
              {userr && (
                <form onSubmit={handleComment} className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 border border-[#c9a280] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b493d] focus:border-transparent"
                      disabled={submittingComment}
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="px-4 py-2 bg-[#6b493d] text-white rounded-lg hover:bg-[#5a3c32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </form>
              )}

              {/* Comments List */}
              <div className="space-y-3">
                {post.comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                ) : (
                  post.comments.map((comment) => (
                    <div key={comment._id} className="flex items-start gap-3 p-3 bg-[#f5f3ed] rounded-lg">
                      <div className="h-8 w-8 bg-[#c9a280] rounded-full flex items-center justify-center flex-shrink-0">
                        <UserCircle className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-[#6b493d] text-sm">
                            {comment.userId?.username || "Unknown User"}
                          </span>
                          {comment.userId?.isVeterinarian && (
                            <span className="px-1.5 py-0.5 bg-[#6b493d]/10 text-[#6b493d] text-xs rounded-full">
                              Vet
                            </span>
                          )}
                        </div>
                        <p className="text-[#4E3B31] text-sm">{comment.content}</p>
                        <p className="text-xs text-[#a07855] mt-1">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {userr && (comment.userId?._id === userr._id || comment.userId?._id === userr.id) && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                          title="Delete comment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail; 