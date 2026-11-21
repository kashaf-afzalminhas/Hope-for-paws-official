import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminAPI } from './api';
import UserBadge from '../Components/UserBadge';

const AdminNgoVerification = () => {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const loadNgos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      adminAPI.clearCache();
      const data = await adminAPI.getAllUsersWithStats();
      setNgos(data.ngos || []);
    } catch (err) {
      setError(err.message || 'Failed to load NGO accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNgos();
  }, [loadNgos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ngos;
    return ngos.filter(
      (u) =>
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.city || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q)
    );
  }, [ngos, search]);

  const counts = useMemo(
    () => ({
      total: ngos.length,
      verified: ngos.filter((u) => u.ngoVerified).length,
      unverified: ngos.filter((u) => !u.ngoVerified).length,
    }),
    [ngos]
  );

  const handleVerification = async (userId, verified) => {
    setActionError('');
    setUpdatingId(userId);
    try {
      const result = await adminAPI.updateNgoVerification(userId, verified);
      const updated = result.user;
      setNgos((prev) =>
        prev.map((u) =>
          u._id === userId
            ? {
                ...u,
                ngoVerified: Boolean(updated?.ngoVerified),
                ngoVerifiedAt: updated?.ngoVerifiedAt ?? null,
                ngoVerifiedBy: updated?.ngoVerifiedBy ?? null,
              }
            : u
        )
      );
    } catch (err) {
      setActionError(err.message || 'Failed to update verification');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="p-6">Loading NGO accounts...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-4 md:p-8 bg-[#fdfbf7] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#4a342e]">NGO Verification</h1>
          <p className="text-sm md:text-base text-[#8d6e63] mt-1">
            Review NGO accounts and grant or revoke verified status.
          </p>
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <div className="flex-1 md:flex-none bg-white px-4 py-2 rounded-lg shadow-sm border border-[#e5e0d8] text-center">
            <span className="block text-xl font-bold text-[#4a342e]">{counts.total}</span>
            <span className="text-[10px] md:text-xs text-[#8d6e63] uppercase font-bold">Total</span>
          </div>
          <div className="flex-1 md:flex-none bg-white px-4 py-2 rounded-lg shadow-sm border border-[#e5e0d8] text-center">
            <span className="block text-xl font-bold text-green-700">{counts.verified}</span>
            <span className="text-[10px] md:text-xs text-[#8d6e63] uppercase font-bold">Verified</span>
          </div>
          <div className="flex-1 md:flex-none bg-white px-4 py-2 rounded-lg shadow-sm border border-[#e5e0d8] text-center">
            <span className="block text-xl font-bold text-amber-700">{counts.unverified}</span>
            <span className="text-[10px] md:text-xs text-[#8d6e63] uppercase font-bold">Unverified</span>
          </div>
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <input
          type="text"
          placeholder="Search by name, email, city, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-[#a07855] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b493d] text-[#4E3B31] w-full md:w-80"
        />
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-[#e5e0d8] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f8f5f0] border-b border-[#e5e0d8]">
            <tr>
              <th className="p-5 text-sm font-bold text-[#5d4037] uppercase tracking-wide">Organisation</th>
              <th className="p-5 text-sm font-bold text-[#5d4037] uppercase tracking-wide">Contact</th>
              <th className="p-5 text-sm font-bold text-[#5d4037] uppercase tracking-wide">Joined</th>
              <th className="p-5 text-sm font-bold text-[#5d4037] uppercase tracking-wide">Status</th>
              <th className="p-5 text-sm font-bold text-[#5d4037] uppercase tracking-wide text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0ebe0]">
            {filtered.map((ngo) => (
              <tr key={ngo._id} className="hover:bg-[#faf9f6] transition-colors">
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold shadow-sm">
                      {(ngo.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-[#4a342e]">{ngo.username}</p>
                        <UserBadge isNgo ngoVerified={Boolean(ngo.ngoVerified)} size="sm" />
                      </div>
                      <p className="text-xs text-[#8d6e63]">{ngo.city || 'City not set'}</p>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                  <p className="text-sm text-[#5d4037]">{ngo.email}</p>
                  <p className="text-xs text-[#8d6e63]">{ngo.phone || 'No phone'}</p>
                </td>
                <td className="p-5 text-gray-500 text-sm">
                  {ngo.createdAt ? new Date(ngo.createdAt).toLocaleDateString() : '—'}
                </td>
                <td className="p-5">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      ngo.ngoVerified
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}
                  >
                    {ngo.ngoVerified ? 'Verified' : 'Unverified'}
                  </span>
                  {ngo.ngoVerifiedAt && (
                    <p className="text-[10px] text-[#8d6e63] mt-1">
                      Since {new Date(ngo.ngoVerifiedAt).toLocaleDateString()}
                    </p>
                  )}
                </td>
                <td className="p-5 text-right">
                  {ngo.ngoVerified ? (
                    <button
                      type="button"
                      disabled={updatingId === ngo._id}
                      onClick={() => handleVerification(ngo._id, false)}
                      className="inline-block px-4 py-2 bg-white border border-red-300 text-red-700 font-bold text-sm rounded-lg hover:bg-red-50 transition-all shadow-sm disabled:opacity-50"
                    >
                      {updatingId === ngo._id ? 'Updating...' : 'Revoke'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={updatingId === ngo._id}
                      onClick={() => handleVerification(ngo._id, true)}
                      className="inline-block px-4 py-2 bg-emerald-700 text-white font-bold text-sm rounded-lg hover:bg-emerald-800 transition-all shadow-sm disabled:opacity-50"
                    >
                      {updatingId === ngo._id ? 'Updating...' : 'Verify'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {filtered.map((ngo) => (
          <div key={ngo._id} className="bg-white p-4 rounded-xl shadow-sm border border-[#e5e0d8]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold shadow-sm">
                  {(ngo.username || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-[#4a342e]">{ngo.username}</p>
                  <p className="text-xs text-[#8d6e63]">{ngo.email}</p>
                  <div className="mt-1">
                    <UserBadge isNgo ngoVerified={Boolean(ngo.ngoVerified)} size="sm" />
                  </div>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded text-[10px] font-bold border ${
                  ngo.ngoVerified
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                }`}
              >
                {ngo.ngoVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-[#5d4037] mb-4 bg-[#fdfbf7] p-3 rounded-lg">
              <div>
                <span className="block text-[10px] text-[#8d6e63] uppercase font-bold">City</span>
                {ngo.city || '—'}
              </div>
              <div>
                <span className="block text-[10px] text-[#8d6e63] uppercase font-bold">Joined</span>
                {ngo.createdAt ? new Date(ngo.createdAt).toLocaleDateString() : '—'}
              </div>
              <div className="col-span-2">
                <span className="block text-[10px] text-[#8d6e63] uppercase font-bold">Phone</span>
                {ngo.phone || '—'}
              </div>
            </div>
            {ngo.ngoVerified ? (
              <button
                type="button"
                disabled={updatingId === ngo._id}
                onClick={() => handleVerification(ngo._id, false)}
                className="block w-full text-center py-2 bg-white border border-red-300 text-red-700 font-bold text-sm rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {updatingId === ngo._id ? 'Updating...' : 'Revoke Verification'}
              </button>
            ) : (
              <button
                type="button"
                disabled={updatingId === ngo._id}
                onClick={() => handleVerification(ngo._id, true)}
                className="block w-full text-center py-2 bg-emerald-700 text-white font-bold text-sm rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50"
              >
                {updatingId === ngo._id ? 'Updating...' : 'Verify NGO'}
              </button>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-10 text-center text-[#8d6e63]">No NGO accounts found.</div>
      )}
    </div>
  );
};

export default AdminNgoVerification;
