import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useRequireAuth } from '../Components/AuthGuard';
import PostCard from '../Components/posts/PostCard';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check user authentication state
  const userr = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
  const requireAuth = useRequireAuth();

  // `silent` lets us refresh the post data after like/comment/delete
  // actions without flashing the full-page spinner every time.
  const fetchPost = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/posts/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setPost(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching post:', error);
      if (!silent) setError('Failed to load post. Please try again later.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleLike = async () => {
    if (!requireAuth('like posts')) return;

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
      await fetchPost(true);
    } catch (error) {
      console.error('Error liking post:', error);
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
      await fetchPost(true);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleUserProfileClick = (userIdToVisit) => {
    if (!userIdToVisit) return;
    if (!requireAuth('view user profiles')) return;
    navigate(`/profile/public/${userIdToVisit}`);
  };

  const handlePostComment = async (postId, content) => {
    if (!content.trim() || !requireAuth('comment on posts')) return;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    await axios.post(`${API_BASE_URL}/comments/${postId}`, { content }, { headers: { Authorization: `Bearer ${token}` } });
    await fetchPost(true);
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
    <div className="min-h-screen bg-[#f5f3ed] px-3 py-4 sm:px-6 lg:px-8 sm:py-6">
      <div className="mx-auto w-full max-w-4xl">
        <button onClick={() => navigate('/posts')} className="mb-6 flex items-center gap-2 text-clay hover:text-clay-deep">
          <ArrowLeft className="h-5 w-5" />
          Back to Posts
        </button>
        <PostCard
          post={post}
          showAuthor
          showImageGallery
          isLiked={Boolean(userr && post.likes?.includes(userr._id || userr.id))}
          likeCount={post.likes?.length || 0}
          comments={post.comments || []}
          onLike={handleLike}
          onCommentSubmit={handlePostComment}
          onDeleteComment={(postId, commentId) => handleDeleteComment(commentId)}
          onAuthorClick={handleUserProfileClick}
        />
      </div>
    </div>
  );

};
export default PostDetail;