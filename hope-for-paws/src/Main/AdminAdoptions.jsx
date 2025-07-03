import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

const AdminAdoptions = () => {
  const [adoptions, setAdoptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const fetchAdoptions = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/admin/adoptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch adoptions');
      setAdoptions(await res.json());
    } catch (err) {
      setError(err.message || 'Failed to fetch adoptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdoptions(); }, []);

  const handleDelete = async (adoptionId) => {
    if (!window.confirm('Are you sure you want to delete this adoption post?')) return;
    setDeleting(adoptionId);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/admin/adoptions/${adoptionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete adoption');
      setAdoptions(adoptions.filter(a => a._id !== adoptionId));
    } catch (err) {
      alert(err.message || 'Failed to delete adoption');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading adoptions...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-2xl font-bold mb-6 text-[#4E3B31]">All Adoptions</h2>
      {adoptions.length === 0 ? (
        <div className="text-center text-gray-500">No adoptions found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#f3e7d8]">
            <thead className="bg-[#f8f4ed]">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase">Pet</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase">Age</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase">Description</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase">Image</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase">User</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase">Created</th>
                <th className="px-4 py-2 text-center text-xs font-bold text-[#6b493d] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#f3e7d8]">
              {adoptions.map(adoption => (
                <tr key={adoption._id}>
                  <td className="px-4 py-2 font-semibold text-[#4E3B31]">{adoption.name}</td>
                  <td className="px-4 py-2">{adoption.petType}</td>
                  <td className="px-4 py-2">{adoption.age}</td>
                  <td className="px-4 py-2">{adoption.description}</td>
                  <td className="px-4 py-2 capitalize">{adoption.status}</td>
                  <td className="px-4 py-2">
                    <img src={adoption.imageUrl} alt={adoption.name} className="h-12 w-12 object-cover rounded" onError={e => {e.target.onerror=null;e.target.src='https://via.placeholder.com/48x48?text=Pet';}} />
                  </td>
                  <td className="px-4 py-2">
                    {adoption.userId?.username}<br/>
                    <span className="text-xs text-gray-500">{adoption.userId?.email}</span>
                  </td>
                  <td className="px-4 py-2 text-xs">{new Date(adoption.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      className="bg-red-100 border border-red-300 text-red-700 px-3 py-1 rounded hover:bg-red-200 text-xs font-semibold"
                      onClick={() => handleDelete(adoption._id)}
                      disabled={deleting === adoption._id}
                    >
                      {deleting === adoption._id ? 'Deleting...' : 'Delete'}
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

export default AdminAdoptions; 