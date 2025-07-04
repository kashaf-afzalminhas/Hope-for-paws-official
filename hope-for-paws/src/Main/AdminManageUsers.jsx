import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from './api';

const AdminManageUsers = ({ vets, users, userStats, fetchUserStats, handleDeleteUser, deleting, search, setSearch }) => {
  const navigate = useNavigate();
  const filterUsers = (arr) => arr.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const [tab, setTab] = useState('vets');
  const [loadingStats, setLoadingStats] = useState(false);

  // Always get the current users for the selected tab and search
  const currentUsers = tab === 'vets' ? filterUsers(vets) : filterUsers(users);

  // Load all user stats in bulk when component mounts or when users change
  useEffect(() => {
    const loadAllUserStats = async () => {
      // Only load if we don't have stats for any users
      const hasStats = Object.keys(userStats).length > 0;
      if (hasStats) return;

      setLoadingStats(true);
      try {
        const data = await adminAPI.getAllUsersWithStats();
        // Update the userStats through the parent component
        if (data.userStats) {
          Object.entries(data.userStats).forEach(([userId, stats]) => {
            fetchUserStats(userId, stats); // Pass the stats directly
          });
        }
      } catch (error) {
        console.error('Error loading user stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadAllUserStats();
  }, [vets.length, users.length]); // Only run when user counts change

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-xl shadow p-6"
    >
      {/* Tabs for Vets and Users */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${tab === 'vets' ? 'bg-[#6b493d] text-white' : 'bg-[#F8F4ED] text-[#6b493d] border border-[#a07855]'}`}
          onClick={() => setTab('vets')}
        >
          Veterinarians ({vets.length})
        </button>
        <button
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${tab === 'users' ? 'bg-[#a07855] text-white' : 'bg-[#F8F4ED] text-[#6b493d] border border-[#a07855]'}`}
          onClick={() => setTab('users')}
        >
          Regular Users ({users.length})
        </button>
      </div>
      {/* Search Bar */}
      <div className="mb-4 flex justify-end">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 border border-[#a07855] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b493d] text-[#4E3B31] w-72"
        />
      </div>
      {/* User Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#f3e7d8]">
          <thead className="bg-[#f8f4ed]">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase tracking-wider">Name</th>
              <th className="px-4 py-2 text-left text-xs font-bold text-[#6b493d] uppercase tracking-wider">Email</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-[#6b493d] uppercase tracking-wider">Posts</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-[#6b493d] uppercase tracking-wider">Comments</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-[#6b493d] uppercase tracking-wider">Adoptions</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-[#6b493d] uppercase tracking-wider">Requests</th>
              <th className="px-4 py-2 text-center text-xs font-bold text-[#6b493d] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#f3e7d8]">
            {currentUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 py-6">No users found.</td>
              </tr>
            )}
            {currentUsers.map(user => {
              const stats = userStats[user._id] && typeof userStats[user._id].posts !== 'undefined'
                ? userStats[user._id]
                : { posts: loadingStats ? '...' : 0, comments: loadingStats ? '...' : 0, adoptions: loadingStats ? '...' : 0, requests: loadingStats ? '...' : 0 };
              return (
                <tr key={user._id} className="hover:bg-[#f8f4ed] transition-colors">
                  <td className="px-4 py-2 font-semibold text-[#4E3B31]">{user.username}</td>
                  <td className="px-4 py-2 text-[#a07855]">{user.email}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {stats.posts}
                      <button
                        className="ml-2 px-2 py-1 text-xs bg-[#e2d6cb] text-[#6b493d] rounded hover:bg-[#d6c7b8] border border-[#a07855]"
                        onClick={() => navigate(`/admin-dashboard/posts/user/${user._id}`)}
                        title={`Show ${user.username}'s posts`}
                      >
                        Show
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {stats.comments}
                      <button
                        className="ml-2 px-2 py-1 text-xs bg-[#e2d6cb] text-[#6b493d] rounded hover:bg-[#d6c7b8] border border-[#a07855]"
                        onClick={() => navigate(`/admin-dashboard/comments/user/${user._id}`)}
                        title={`Show ${user.username}'s comments`}
                      >
                        Show
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {stats.adoptions}
                      <button
                        className="ml-2 px-2 py-1 text-xs bg-[#e2d6cb] text-[#6b493d] rounded hover:bg-[#d6c7b8] border border-[#a07855]"
                        onClick={() => navigate(`/admin-dashboard/adoptions/user/${user._id}`)}
                        title={`Show ${user.username}'s adoptions`}
                      >
                        Show
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">{stats.requests}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      className="bg-red-100 border border-red-300 text-red-700 px-3 py-1 rounded hover:bg-red-200 text-xs font-semibold"
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={deleting === user._id}
                    >
                      {deleting === user._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

AdminManageUsers.propTypes = {
  vets: PropTypes.array.isRequired,
  users: PropTypes.array.isRequired,
  userStats: PropTypes.object.isRequired,
  fetchUserStats: PropTypes.func.isRequired,
  handleDeleteUser: PropTypes.func.isRequired,
  deleting: PropTypes.string,
  search: PropTypes.string.isRequired,
  setSearch: PropTypes.func.isRequired,
};

export default AdminManageUsers; 