import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Pencil, Trash2, X, Eye, Camera, FileText, CheckCircle2, Clock } from "lucide-react";
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAdoption } from '../context/AdoptionContext';

/** Stable empty array so the requests modal does not receive a new `[]` every render. */
const EMPTY_ADOPTION_REQUESTS = [];
import AdoptionRequestsModal from './AdoptionRequestsModal';
import { getCurrentUserId } from '../lib/utils';
import AdoptionCard from '../Components/adoption/AdoptionCard.jsx';
import { adoptionGridClass, adoptionCardShellClass } from '../Components/adoption/adoptionTheme.js';

const MyAdoptions = ({ embedded = false }) => {
  const [adoptions, setAdoptions] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [editData, setEditData] = useState({
    name: '',
    age: '',
    petType: '',
    breed: '',
    vaccinated: '',
    neuteredSpayed: '',
    description: '',
    location: ''
  });
  const [originalData, setOriginalData] = useState({});
  const [newImages, setNewImages] = useState({}); // Store images per post ID
  const [imagePreviews, setImagePreviews] = useState({}); // Store previews per post ID
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedPostForRequests, setSelectedPostForRequests] = useState(null);
  const [savingStates, setSavingStates] = useState({}); // Track saving state per post
  const { user } = useAuth();
  const { userStats, fetchUserStats } = useAdoption();
  const [storedUser, setStoredUser] = useState(null);
  const location = useLocation();

  // Get user from storage if context user is not available
  useEffect(() => {
    const userFromStorage = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
    setStoredUser(userFromStorage);
  }, []);

  // Check for success message from navigation state
  useEffect(() => {
    if (location.state?.showSuccess && location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the navigation state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
      
      // Auto-hide success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Fetch adoptions and user stats when user is available
  useEffect(() => {
    const effectiveUser = user || storedUser;
    const uid = getCurrentUserId(effectiveUser);
    if (!uid) {
      setLoading(false);
      return;
    }
    fetchUserAdoptions(uid);
    fetchUserStats();
  }, [user, storedUser]);

  const fetchUserAdoptions = async (userId) => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token missing');
      }

      // Always include requests in the fetch
      const response = await axios.get(
        `${API_BASE_URL}/adoptions/user/${userId}?includeRequests=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAdoptions(response.data);
      setSelectedPostForRequests((prev) => {
        if (!prev) return null;
        const updated = response.data.find((p) => String(p._id) === String(prev._id));
        return updated || prev;
      });
    } catch (err) {
      console.error('Error fetching adoptions:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load adoption posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this adoption post?")) return;
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.delete(
        `${API_BASE_URL}/adoptions/${postId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh the list and stats cards after deletion
      const effectiveUser = user || storedUser;
      const uid = getCurrentUserId(effectiveUser);
      if (uid) {
        fetchUserAdoptions(uid);
        fetchUserStats();
      }
    } catch (err) {
      console.error('Error deleting adoption post:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete post');
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post._id);
    const postData = {
      name: post.name,
      age: post.age,
      petType: post.petType,
      breed: post.breed || '',
      vaccinated: post.vaccinated || '',
      neuteredSpayed: post.neuteredSpayed || '',
      description: post.description,
      location: post.location || ''
    };
    setEditData(postData);
    setOriginalData(postData);
    // Clear any existing image data for this post
    setNewImages(prev => ({ ...prev, [post._id]: null }));
    setImagePreviews(prev => ({ ...prev, [post._id]: null }));
  };

  const handleSaveEdit = async (postId) => {
    try {
      // Set saving state for this specific post
      setSavingStates(prev => ({ ...prev, [postId]: true }));
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // If there's a new image, upload it first
      if (newImages[postId]) {
        const formData = new FormData();
        formData.append('image', newImages[postId]);
        await axios.put(
          `${API_BASE_URL}/adoptions/${postId}/image`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }
      
      await axios.put(
        `${API_BASE_URL}/adoptions/${postId}`,
        editData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEditingPost(null);
      // Clear image data for this post
      setNewImages(prev => ({ ...prev, [postId]: null }));
      setImagePreviews(prev => ({ ...prev, [postId]: null }));
      
      // Show immediate success feedback
      setSuccessMessage('Changes saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh the list after update
      const effectiveUser = user || storedUser;
      const uid = getCurrentUserId(effectiveUser);
      if (uid) {
        fetchUserAdoptions(uid);
      }
    } catch (err) {
      console.error('Error updating adoption post:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update post');
      setTimeout(() => setError(''), 5000);
    } finally {
      // Clear saving state
      setSavingStates(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Detect if there are changes for a specific post
  const hasChanges = (postId) => {
    if (newImages[postId]) return true;
    return Object.keys(editData).some((key) => editData[key] !== originalData[key]);
  };

  // Handle image change for a specific post
  const handleImageChange = (e, postId) => {
    const file = e.target.files[0];
    if (file) {
      setNewImages(prev => ({ ...prev, [postId]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => ({ ...prev, [postId]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRequestAction = async () => {
    const effectiveUser = user || storedUser;
    const uid = getCurrentUserId(effectiveUser);
    if (uid) {
      fetchUserAdoptions(uid);
      fetchUserStats();
    }
  };

  const handleStatusChange = async (postId, newStatus) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/adoptions/${postId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const reopenedCount = response.data?.reopenedRequests ?? 0;
      const serverPost = response.data;

      setAdoptions((prev) =>
        prev.map((post) => {
          if (post._id !== postId) return post;
          const next = {
            ...post,
            ...serverPost,
            status: serverPost?.status ?? newStatus,
            vaccinated: serverPost?.vaccinated ?? post.vaccinated,
            neuteredSpayed: serverPost?.neuteredSpayed ?? post.neuteredSpayed,
          };
          if (reopenedCount > 0 && Array.isArray(post.requests)) {
            next.requests = post.requests.map((req) =>
              req.status === 'accepted' || req.status === 'rejected'
                ? { ...req, status: 'pending' }
                : req
            );
          }
          return next;
        })
      );

      const effectiveUser = user || storedUser;
      const uid = getCurrentUserId(effectiveUser);
      if (uid) {
        await fetchUserAdoptions(uid);
        fetchUserStats();
      }

      let message = `Status updated to ${newStatus} successfully!`;
      if (reopenedCount > 0) {
        message += ` ${reopenedCount} previous request(s) restored to "Request sent" for review.`;
      }
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error updating status:', err);
      setError(`Failed to update status: ${err.response?.data?.message || err.message}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleViewRequests = (post) => {
    setSelectedPostForRequests(post);
  };

  const handleCloseRequestsModal = () => {
    setSelectedPostForRequests(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6b493d] border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
        <p className="font-semibold">Error loading adoption posts</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (!user && !storedUser) {
    return (
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl text-center">
        <p>Please log in to view your adoption posts.</p>
      </div>
    );
  }

  return (
    <section className={embedded ? 'w-full' : 'min-h-screen bg-[#f5f3ed] py-4 sm:py-6 px-3 sm:px-6 lg:px-8'}>
      <div className={embedded ? 'w-full' : 'mx-auto max-w-6xl w-full'}>
        
        {/* Modern Polished Stat Cards */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Total Posts */}
          <div className="relative overflow-hidden rounded-2xl border border-[#e8dcc8] bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8B5A2B]">My Total Posts</p>
                <h3 className="text-3xl font-extrabold text-[#4E3B31]">
                  {userStats?.totalPosts ?? 0}
                </h3>
                <p className="text-xs text-[#6F4C3E]/70">All created listings</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#faf6f0] text-[#6b493d] border border-[#e8dcc8]">
                <FileText className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#6b493d]/20" />
          </div>

          {/* Pets Adopted */}
          <div className="relative overflow-hidden rounded-2xl border border-[#e8dcc8] bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Pets Adopted</p>
                <h3 className="text-3xl font-extrabold text-[#4E3B31]">
                  {userStats?.adoptedCount ?? 0}
                </h3>
                <p className="text-xs text-emerald-600/80">Found forever homes</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
          </div>

          {/* Left for Adoption */}
          <div className="relative overflow-hidden rounded-2xl border border-[#e8dcc8] bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Left for Adoption</p>
                <h3 className="text-3xl font-extrabold text-[#4E3B31]">
                  {userStats?.pendingCount ?? 0}
                </h3>
                <p className="text-xs text-amber-600/80">Active & available</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
          </div>
        </div>

        {successMessage && (
          <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-3 text-center text-sm font-medium text-green-700">
            <p>{successMessage}</p>
          </div>
        )}

        {adoptions.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[#d8c0a7] bg-[#fcf7f1] p-8 text-center shadow-sm">
            <p className="text-xl font-semibold text-[#6b493d]">No adoption posts yet</p>
            <p className="mt-2 text-sm text-[#7a6554]">Create your first adoption listing to start helping pets find loving homes.</p>
          </div>
        ) : (
          <div className={adoptionGridClass}>
            {adoptions.map((post) =>
              editingPost === post._id ? (
                <article key={post._id} className={adoptionCardShellClass}>
                  <div className="relative">
                    <img
                      src={imagePreviews[post._id] || post.imageUrl}
                      alt={post.name}
                      className="aspect-[4/3] w-full object-contain bg-gradient-to-br from-[#faf6f0] to-[#efe4d8]"
                      loading="lazy"
                    />
                    <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center rounded-t-2xl bg-black/50 opacity-0 transition hover:opacity-100">
                      <Camera className="h-8 w-8 text-white" />
                      <span className="mt-2 text-xs font-medium text-white">Change photo</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, post._id)} className="hidden" />
                    </label>
                  </div>
                  <div className="space-y-3 p-5 sm:p-6">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[#4E3B31]">Pet name</label>
                      <input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full rounded-xl border border-[#e8dcc8] px-3 py-2 text-[#4E3B31] focus:border-[#a07855] focus:outline-none focus:ring-1 focus:ring-[#a07855]" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-[#4E3B31]">Age</label>
                        <input type="text" value={editData.age} onChange={(e) => setEditData({ ...editData, age: e.target.value })} className="w-full rounded-xl border border-[#e8dcc8] px-3 py-2" />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-[#4E3B31]">Pet type</label>
                        <select value={editData.petType} onChange={(e) => setEditData({ ...editData, petType: e.target.value })} className="w-full rounded-xl border border-[#e8dcc8] px-3 py-2 bg-white">
                          <option value="">Select</option>
                          <option value="Dog">Dog</option>
                          <option value="Cat">Cat</option>
                          <option value="Bird">Bird</option>
                          <option value="Rabbit">Rabbit</option>
                          <option value="Hamster">Hamster</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[#4E3B31]">Breed</label>
                      <input type="text" value={editData.breed} onChange={(e) => setEditData({ ...editData, breed: e.target.value })} className="w-full rounded-xl border border-[#e8dcc8] px-3 py-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-[#4E3B31]">Vaccinated</label>
                        <select value={editData.vaccinated} onChange={(e) => setEditData({ ...editData, vaccinated: e.target.value })} className="w-full rounded-xl border border-[#e8dcc8] px-3 py-2">
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-[#4E3B31]">Neutered / spayed</label>
                        <select value={editData.neuteredSpayed} onChange={(e) => setEditData({ ...editData, neuteredSpayed: e.target.value })} className="w-full rounded-xl border border-[#e8dcc8] px-3 py-2">
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[#4E3B31]">Description</label>
                      <textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows={3} className="w-full rounded-xl border border-[#e8dcc8] px-3 py-2" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[#4E3B31]">Location</label>
                      <input type="text" value={editData.location} onChange={(e) => setEditData({ ...editData, location: e.target.value })} className="w-full rounded-xl border border-[#e8dcc8] px-3 py-2" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setEditingPost(null)} className="rounded-full p-2 hover:bg-[#6b493d]/10" disabled={savingStates[post._id]}>
                        <X className="h-5 w-5 text-[#6b493d]" />
                      </button>
                      <button type="button" onClick={() => handleSaveEdit(post._id)} disabled={!hasChanges(post._id) || savingStates[post._id]} className="rounded-xl bg-[#6b493d] px-4 py-2 text-sm font-medium text-white hover:bg-[#5a3d32] disabled:opacity-50">
                        {savingStates[post._id] ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  </div>
                </article>
              ) : (
                <AdoptionCard
                  key={`${post._id}-${post.status}`}
                  post={post}
                  imageUrl={imagePreviews[post._id] || post.imageUrl}
                  poster={{ show: false }}
                  meta={
                    <>
                      <div className="mb-3">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#6F4C3E]/60">Listing status</label>
                        <select
                          value={post.status}
                          onChange={(e) => handleStatusChange(post._id, e.target.value)}
                          className="w-full rounded-xl border border-[#e8dcc8] bg-white px-3 py-2 text-sm font-medium text-[#4E3B31] focus:border-[#a07855] focus:outline-none"
                        >
                          <option value="available">Available</option>
                          <option value="adopted">Adopted</option>
                        </select>
                      </div>
                      {post.status === 'adopted' && (
                        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                          This pet has been adopted
                        </div>
                      )}
                      {post.requests && post.requests.length > 0 && (
                        <div className="mb-3 flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5">
                          <span className="flex items-center gap-2 text-sm font-medium text-sky-900">
                            <Eye className="h-4 w-4" />
                            {post.requests.length} request{post.requests.length !== 1 ? 's' : ''}
                          </span>
                          <button type="button" onClick={() => handleViewRequests(post)} className="text-sm font-semibold text-sky-700 hover:underline">
                            View all
                          </button>
                        </div>
                      )}
                    </>
                  }
                >
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => handleEdit(post)} className="rounded-full p-2.5 hover:bg-[#6b493d]/10" aria-label="Edit">
                      <Pencil className="h-5 w-5 text-[#6b493d]" />
                    </button>
                    <button type="button" onClick={() => handleDelete(post._id)} className="rounded-full p-2.5 hover:bg-rose-50" aria-label="Delete">
                      <Trash2 className="h-5 w-5 text-rose-700" />
                    </button>
                  </div>
                </AdoptionCard>
              )
            )}
          </div>
        )}
      </div>

      {/* Requests Modal */}
      {selectedPostForRequests && (
        <AdoptionRequestsModal
          post={selectedPostForRequests}
          requests={selectedPostForRequests.requests ?? EMPTY_ADOPTION_REQUESTS}
          onClose={handleCloseRequestsModal}
          onRequestAction={handleRequestAction}
          onRefresh={() => { const effectiveUser = user || storedUser; const uid = getCurrentUserId(effectiveUser); if (uid) fetchUserAdoptions(uid); }}
        />
      )}
    </section>
  );
};

MyAdoptions.propTypes = {
  embedded: PropTypes.bool,
};

export default MyAdoptions;