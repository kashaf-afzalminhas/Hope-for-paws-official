import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const AdminPostComments = () => {
  const { postId } = useParams();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchComments = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/admin/comments/post/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch comments');
      setComments(await res.json());
    } catch (err) {
      setError(err.message || 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComments(); }, [postId]);

  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    setDeleting(commentId);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete comment');
      setComments(comments.filter(c => c._id !== commentId));
    } catch (err) {
      alert(err.message || 'Failed to delete comment');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading comments...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-2xl font-bold mb-6 text-[#4E3B31]">Post&apos;s Comments</h2>
      {comments.length === 0 ? (
        <div className="text-center text-gray-500">No comments found for this post.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#f3e7d8]">
            <thead className="bg-[#f8f4ed]">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase">Content</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase">User</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase">Post</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase">Created</th>
                <th className="px-4 py-2 text-center text-xs font-bold text-[#6b493d] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#f3e7d8]">
              {comments.map(comment => (
                <tr key={comment._id}>
                  <td className="px-4 py-2 min-w-[200px] text-sm align-top">{comment.content}</td>
                  <td className="px-4 py-2">
                    {comment.userId?.username}<br/>
                    <span className="text-xs text-gray-500">{comment.userId?.email}</span>
                  </td>
                  <td className="px-4 py-2">
                    {comment.postId?.caption}
                    {comment.postId?.imageUrl && (
                      <img
                        src={comment.postId.imageUrl}
                        alt="Post"
                        className="h-8 w-8 object-cover rounded mt-1"
                        onError={e => {e.target.onerror=null;e.target.src='https://via.placeholder.com/32x32?text=Post';}}
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs">{new Date(comment.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      className="bg-red-100 border border-red-300 text-red-700 px-3 py-1 rounded hover:bg-red-200 text-xs font-semibold"
                      onClick={() => handleDelete(comment._id)}
                      disabled={deleting === comment._id}
                    >
                      {deleting === comment._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPostComments; 