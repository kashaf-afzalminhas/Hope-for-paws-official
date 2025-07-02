import PropTypes from 'prop-types';
import { useState } from 'react';
import { motion } from 'framer-motion';

const AdminManageUsers = ({ vets, users, userStats, fetchUserStats, handleDeleteUser, deleting, search, setSearch }) => {
  const filterUsers = (arr) => arr.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const [tab, setTab] = useState('vets');

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
      {/* User List */}
      {tab === 'vets' && (
        <>
          <h2 className="text-xl font-bold mb-4 text-[#6b493d]">Veterinarians</h2>
          <ul>
            {filterUsers(vets).map(vet => (
              <li key={vet._id} className="py-2 border-b border-[#f3e7d8] flex flex-col md:flex-row md:items-center md:gap-4 gap-2">
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                  <span className="font-semibold text-[#4E3B31]">{vet.username}</span>
                  <span className="text-[#a07855]">{vet.email}</span>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    className="bg-[#F8F4ED] border border-[#a07855] text-[#6b493d] px-3 py-1 rounded hover:bg-[#f3e7d8] text-xs font-semibold"
                    onClick={() => fetchUserStats(vet._id)}
                    disabled={!!userStats[vet._id]}
                  >
                    {userStats[vet._id] ? 'Stats Loaded' : 'View Stats'}
                  </button>
                  <button
                    className="bg-red-100 border border-red-300 text-red-700 px-3 py-1 rounded hover:bg-red-200 text-xs font-semibold"
                    onClick={() => handleDeleteUser(vet._id)}
                    disabled={deleting === vet._id}
                  >
                    {deleting === vet._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
                {userStats[vet._id] && (
                  <div className="mt-2 text-xs text-[#4E3B31] bg-[#f8f4ed] rounded p-2">
                    {userStats[vet._id].error ? (
                      <span className="text-red-500">{userStats[vet._id].error}</span>
                    ) : (
                      <>
                        <span className="mr-4">Posts: <b>{userStats[vet._id].posts}</b></span>
                        <span className="mr-4">Comments: <b>{userStats[vet._id].comments}</b></span>
                        <span className="mr-4">Adoptions: <b>{userStats[vet._id].adoptions}</b></span>
                        <span>Requests: <b>{userStats[vet._id].requests}</b></span>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
            {filterUsers(vets).length === 0 && <li className="text-gray-500">No veterinarians found.</li>}
          </ul>
        </>
      )}
      {tab === 'users' && (
        <>
          <h2 className="text-xl font-bold mb-4 text-[#a07855]">Regular Users</h2>
          <ul>
            {filterUsers(users).map(user => (
              <li key={user._id} className="py-2 border-b border-[#f3e7d8] flex flex-col md:flex-row md:items-center md:gap-4 gap-2">
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                  <span className="font-semibold text-[#4E3B31]">{user.username}</span>
                  <span className="text-[#a07855]">{user.email}</span>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    className="bg-[#F8F4ED] border border-[#a07855] text-[#6b493d] px-3 py-1 rounded hover:bg-[#f3e7d8] text-xs font-semibold"
                    onClick={() => fetchUserStats(user._id)}
                    disabled={!!userStats[user._id]}
                  >
                    {userStats[user._id] ? 'Stats Loaded' : 'View Stats'}
                  </button>
                  <button
                    className="bg-red-100 border border-red-300 text-red-700 px-3 py-1 rounded hover:bg-red-200 text-xs font-semibold"
                    onClick={() => handleDeleteUser(user._id)}
                    disabled={deleting === user._id}
                  >
                    {deleting === user._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
                {userStats[user._id] && (
                  <div className="mt-2 text-xs text-[#4E3B31] bg-[#f8f4ed] rounded p-2">
                    {userStats[user._id].error ? (
                      <span className="text-red-500">{userStats[user._id].error}</span>
                    ) : (
                      <>
                        <span className="mr-4">Posts: <b>{userStats[user._id].posts}</b></span>
                        <span className="mr-4">Comments: <b>{userStats[user._id].comments}</b></span>
                        <span className="mr-4">Adoptions: <b>{userStats[user._id].adoptions}</b></span>
                        <span>Requests: <b>{userStats[user._id].requests}</b></span>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
            {filterUsers(users).length === 0 && <li className="text-gray-500">No regular users found.</li>}
          </ul>
        </>
      )}
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