import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';

const AdminPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedPost, setExpandedPost] = useState(null);
  const [deletingComment, setDeletingComment] = useState(null);
  const navigate = useNavigate();

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/admin/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch posts');
      setPosts(await res.json());
    } catch (err) {
      setError(err.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setDeleting(postId);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete post');
      setPosts(posts.filter(a => a._id !== postId));
    } catch (err) {
      alert(err.message || 'Failed to delete post');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    setDeletingComment(commentId);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete comment');
      setPosts(posts => posts.map(post => post._id === postId ? { ...post, comments: post.comments.filter(c => c._id !== commentId) } : post));
    } catch (err) {
      alert(err.message || 'Failed to delete comment');
    } finally {
      setDeletingComment(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading posts...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-2xl font-bold mb-6 text-[#4E3B31]">All Posts</h2>
      {posts.length === 0 ? (
        <div className="text-center text-gray-500">No posts found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#f3e7d8]">
            <thead className="bg-[#f8f4ed]">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase">Image</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase">Caption</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase">User</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase">Created</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase">Comments</th>
                <th className="px-4 py-2 text-center text-xs font-bold text-[#6b493d] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#f3e7d8]">
              {posts.map(post => (
                <tr key={post._id}>
                  <td className="px-4 py-2">
                    <img
                      src={post.imageUrl}
                      alt={post.caption}
                      className="h-12 w-12 object-cover rounded cursor-pointer hover:shadow-lg"
                      onClick={() => setSelectedImage(post.imageUrl)}
                      onError={e => {e.target.onerror=null;e.target.src='https://via.placeholder.com/48x48?text=Post';}}
                    />
                  </td>
                  <td className="px-4 py-2 min-w-[300px] text-sm align-top">{post.caption}</td>
                  <td className="px-4 py-2">
                    {post.userId?.username}<br/>
                    <span className="text-xs text-gray-500">{post.userId?.email}</span>
                  </td>
                  <td className="px-4 py-2 text-xs">{new Date(post.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 flex items-center gap-2">
                    <span>{post.comments ? post.comments.length : 0}</span>
                    <button
                      className="ml-2 px-2 py-1 text-xs bg-[#e2d6cb] text-[#6b493d] rounded hover:bg-[#d6c7b8] border border-[#a07855]"
                      onClick={() => navigate(`/admin-dashboard/comments/post/${post._id}`)}
                      title="Show comments for this post"
                    >
                      Show
                    </button>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      className="bg-red-100 border border-red-300 text-red-700 px-3 py-1 rounded hover:bg-red-200 text-xs font-semibold"
                      onClick={() => handleDelete(post._id)}
                      disabled={deleting === post._id}
                    >
                      {deleting === post._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
          <div className="bg-white p-4 rounded shadow-lg max-w-2xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img src={selectedImage} alt="Large Post" className="max-h-[70vh] max-w-full rounded" />
            <button className="mt-4 px-4 py-2 bg-[#6b493d] text-white rounded hover:bg-[#4E3B31]" onClick={() => setSelectedImage(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPosts; 