import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const AdminUserPosts = () => {
  const { userId } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedPost, setExpandedPost] = useState(null);
  const [deletingComment, setDeletingComment] = useState(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/admin/posts/user/${userId}`, {
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

  useEffect(() => { fetchPosts(); }, [userId]);

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
      <h2 className="text-2xl font-bold mb-6 text-[#4E3B31]">User&apos;s Posts</h2>
      {posts.length === 0 ? (
        <div className="text-center text-gray-500">No posts found for this user.</div>
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
                  <td className="px-4 py-2">
                    <button
                      className="text-xs text-[#6b493d] underline hover:text-[#a07855]"
                      onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}
                    >
                      {post.comments && post.comments.length > 0 ? `${post.comments.length} Comment(s)` : 'No Comments'}
                    </button>
                    {expandedPost === post._id && post.comments && (
                      <div className="mt-2 bg-[#f8f4ed] rounded p-2 max-h-48 overflow-y-auto">
                        {post.comments.length === 0 ? (
                          <div className="text-xs text-gray-500">No comments.</div>
                        ) : (
                          post.comments.map(comment => (
                            <div key={comment._id} className="flex items-start gap-2 border-b border-[#e2d6cb] py-1 last:border-b-0">
                              <div className="flex-1">
                                <div className="font-semibold text-xs text-[#4E3B31]">{comment.userId?.username || 'Unknown'}</div>
                                <div className="text-xs text-gray-700">{comment.content}</div>
                                <div className="text-[10px] text-gray-400">{new Date(comment.createdAt).toLocaleString()}</div>
                              </div>
                              <button
                                className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 border border-red-300"
                                onClick={() => handleDeleteComment(comment._id, post._id)}
                                disabled={deletingComment === comment._id}
                              >
                                {deletingComment === comment._id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
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

export default AdminUserPosts; 