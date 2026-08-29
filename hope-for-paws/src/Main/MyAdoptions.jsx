import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Pencil, Trash2, X, Eye, Camera, FileText, CheckCircle2, Clock, ArrowLeft, Upload, UserCircle } from "lucide-react";
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAdoption } from '../context/AdoptionContext';

/** Stable empty array so the requests modal does not receive a new `[]` every render. */
const EMPTY_ADOPTION_REQUESTS = [];
import AdoptionRequestsModal from './AdoptionRequestsModal';
import { getCurrentUserId } from '../lib/utils';
import AdoptionCard from '../Components/adoption/AdoptionCard.jsx';
import { adoptionGridClass, adoptionCardShellClass } from '../Components/adoption/adoptionTheme.js';

const getAdoptionImages = (post) => (
  post.imageUrls?.length ? post.imageUrls : post.imageUrl ? [post.imageUrl] : []
).filter(Boolean);

const AdoptionEditModal = ({ post, onClose, onSave, saving = false }) => {
  const [formData, setFormData] = useState({
    name: post.name || '', age: post.age || '', petType: post.petType || '', breed: post.breed || '',
    vaccinated: post.vaccinated || '', neuteredSpayed: post.neuteredSpayed || '',
    description: post.description || '', location: post.location || '',
  });
  const [existingImages, setExistingImages] = useState(getAdoptionImages(post));
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [imageError, setImageError] = useState('');
  const previewUrlsRef = useRef([]);

  useEffect(() => () => {
    previewUrlsRef.current.forEach((preview) => URL.revokeObjectURL(preview));
  }, []);

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validFiles = files.filter((file) => allowedTypes.includes(file.type) && file.size <= 5 * 1024 * 1024);
    if (validFiles.length !== files.length) setImageError('Use JPEG, PNG, or WebP images up to 5MB each.');
    else if (existingImages.length + newFiles.length + validFiles.length > 20) setImageError('You can have up to 20 photos.');
    else setImageError('');
    const filesToAdd = validFiles.slice(0, Math.max(0, 20 - existingImages.length - newFiles.length));
    const previewsToAdd = filesToAdd.map((file) => URL.createObjectURL(file));
    previewUrlsRef.current.push(...previewsToAdd);
    setNewFiles((previous) => [...previous, ...filesToAdd]);
    setNewPreviews((previous) => [...previous, ...previewsToAdd]);
    event.target.value = '';
  };

  const removeExistingImage = (index) => setExistingImages((images) => images.filter((_, imageIndex) => imageIndex !== index));
  const removeNewImage = (index) => {
    URL.revokeObjectURL(newPreviews[index]);
    previewUrlsRef.current = previewUrlsRef.current.filter((preview) => preview !== newPreviews[index]);
    setNewFiles((files) => files.filter((_, fileIndex) => fileIndex !== index));
    setNewPreviews((previews) => previews.filter((_, previewIndex) => previewIndex !== index));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (existingImages.length + newFiles.length === 0) {
      setImageError('Keep at least one photo for this adoption ad.');
      return;
    }
    const originalImages = getAdoptionImages(post);
    const indicesToRemove = originalImages.map((image, index) => (existingImages.includes(image) ? null : index)).filter((index) => index !== null);
    onSave(post._id, formData, newFiles, indicesToRemove);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#6B4A38]/40 px-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="box-border max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-sand bg-white p-6 shadow-warm-lg sm:p-7 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between border-b border-sand pb-3">
            <h4 className="text-base font-heading font-bold text-ink">Edit Adoption Ad</h4>
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg p-1.5 text-ink-soft hover:bg-sand-light" aria-label="Close"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-3">
            <div className="grid w-full grid-cols-2 gap-3 rounded-lg border border-[#bca18a] bg-white p-3 sm:grid-cols-3">
              {existingImages.map((image, index) => (
                <div key={`${image}-${index}`} className="group/edit-image relative aspect-square overflow-hidden rounded-lg border border-[#bca18a] bg-[#f7f4f0]">
                  <img src={image} alt={`Current photo ${index + 1}`} className="h-full w-full object-contain" />
                  <button type="button" onClick={() => removeExistingImage(index)} disabled={saving} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#4E3B31]/80 text-white opacity-0 transition-opacity group-hover/edit-image:opacity-100 focus:opacity-100" aria-label={`Remove photo ${index + 1}`}><X className="h-4 w-4" /></button>
                </div>
              ))}
              {newPreviews.map((preview, index) => (
                <div key={`${preview}-${index}`} className="group/edit-image relative aspect-square overflow-hidden rounded-lg border border-[#bca18a] bg-[#f7f4f0]">
                  <img src={preview} alt={`New photo ${index + 1}`} className="h-full w-full object-contain" />
                  <button type="button" onClick={() => removeNewImage(index)} disabled={saving} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#4E3B31]/80 text-white opacity-0 transition-opacity group-hover/edit-image:opacity-100 focus:opacity-100" aria-label={`Remove new photo ${index + 1}`}><X className="h-4 w-4" /></button>
                </div>
              ))}
              {existingImages.length + newPreviews.length === 0 && <div className="col-span-full flex min-h-32 items-center justify-center text-ink-soft/50"><UserCircle className="h-10 w-10 stroke-1" /></div>}
            </div>
            <label className="flex min-h-24 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#bca18a] bg-[#f7f4f0] px-4 py-4 text-sm font-body font-semibold text-[#6b493d] hover:bg-[#f3ede7]">
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImageChange} className="sr-only" disabled={saving} />
              <Upload className="h-4 w-4" /><span>Add more photos</span>
            </label>
            <div className="flex items-center justify-between gap-3 text-xs text-[#6b493d]"><span>{existingImages.length + newPreviews.length} photo{existingImages.length + newPreviews.length === 1 ? '' : 's'} in this ad</span>{newFiles.length > 0 && <span>{newFiles.length} new</span>}</div>
            <p className="text-xs text-[#bca18a]">Select one photo or several photos together. You can remove any photo before saving.</p>
            {imageError && <p className="text-xs font-medium text-red-600">{imageError}</p>}
          </div>
          {[
            ['name', 'Pet name'], ['age', 'Age'], ['breed', 'Breed'], ['location', 'Location'],
          ].map(([name, label]) => <div key={name}><label className="mb-1 block text-sm font-medium text-[#4E3B31]">{label}</label><input type="text" value={formData[name]} onChange={(event) => setFormData({ ...formData, [name]: event.target.value })} className="w-full rounded-xl border border-sand px-3 py-2 text-ink focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay" /></div>)}
          <div className="grid grid-cols-2 gap-3">
            {['petType', 'vaccinated', 'neuteredSpayed'].map((name) => <div key={name} className={name === 'petType' ? 'col-span-2' : ''}><label className="mb-1 block text-sm font-medium text-[#4E3B31]">{name === 'petType' ? 'Pet type' : name === 'neuteredSpayed' ? 'Neutered / spayed' : 'Vaccinated'}</label><select value={formData[name]} onChange={(event) => setFormData({ ...formData, [name]: event.target.value })} className="w-full rounded-xl border border-sand bg-white px-3 py-2"><option value="">Select</option>{(name === 'petType' ? ['Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Other'] : ['Yes', 'No']).map((option) => <option key={option} value={option}>{option}</option>)}</select></div>)}
          </div>
          <div><label className="mb-1 block text-sm font-medium text-[#4E3B31]">Description</label><textarea value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} rows={3} className="w-full rounded-xl border border-sand px-3 py-2" /></div>
          <div className="flex justify-end gap-2 border-t border-sand pt-3"><button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-sand px-3 py-1.5 text-xs text-ink-soft hover:bg-sand-light">Cancel</button><button type="submit" disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-clay px-4 py-1.5 text-xs font-medium text-cream hover:bg-clay-deep disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </form>
      </div>
    </div>,
    document.body
  );
};

AdoptionEditModal.propTypes = { post: PropTypes.object.isRequired, onClose: PropTypes.func.isRequired, onSave: PropTypes.func.isRequired, saving: PropTypes.bool };

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
  const { user, loading: authLoading } = useAuth();
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
    if (authLoading) return;
    const effectiveUser = user || storedUser;
    const uid = getCurrentUserId(effectiveUser);
    if (!uid) {
      setLoading(false);
      return;
    }
    if (location.state?.createdPost) {
      setAdoptions((previousAdoptions) => [
        location.state.createdPost,
        ...previousAdoptions.filter((post) => post._id !== location.state.createdPost._id),
      ]);
    }
    fetchUserAdoptions(uid);
    fetchUserStats();
  }, [authLoading, user, storedUser, location.state?.createdPost]);

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

      if (!Array.isArray(response.data)) {
        throw new Error('Invalid adoption posts response');
      }
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
    setNewImages(prev => ({ ...prev, [post._id]: [] }));
    setImagePreviews(prev => ({ ...prev, [post._id]: [] }));
  };

  const handleSaveEdit = async (postId, updatedData, selectedImages = [], indicesToRemove = []) => {
    try {
      // Set saving state for this specific post
      setSavingStates(prev => ({ ...prev, [postId]: true }));
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // If there's a new image, upload it first
      if (selectedImages.length > 0 || indicesToRemove.length > 0) {
        const formData = new FormData();
        selectedImages.forEach((image) => formData.append('images', image));
        formData.append('indicesToRemove', JSON.stringify(indicesToRemove));
        const imageResponse = await axios.put(
          `${API_BASE_URL}/adoptions/${postId}/image`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        if (Array.isArray(imageResponse.data?.imageUrls)) {
          setAdoptions((previousAdoptions) => previousAdoptions.map((post) => (
            post._id === postId
              ? { ...post, imageUrls: imageResponse.data.imageUrls, imageUrl: imageResponse.data.imageUrls[0] }
              : post
          )));
        }
      }
      
      await axios.put(
        `${API_BASE_URL}/adoptions/${postId}`,
        updatedData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEditingPost(null);
      // Clear image data for this post
      setNewImages(prev => ({ ...prev, [postId]: [] }));
      setImagePreviews(prev => ({ ...prev, [postId]: [] }));
      
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
    if (newImages[postId]?.length > 0) return true;
    return Object.keys(editData).some((key) => editData[key] !== originalData[key]);
  };

  // Handle image change for a specific post
  const handleImageChange = (e, postId) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setNewImages(prev => ({ ...prev, [postId]: files }));
    Promise.all(files.map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    }))).then((previews) => {
      setImagePreviews(prev => ({ ...prev, [postId]: previews }));
    });
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

  if (error && adoptions.length === 0) {
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
        {!embedded && (
          <button type="button" onClick={() => window.history.back()} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#6b493d] transition hover:text-[#4E3B31]">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </button>
        )}
        
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
                null
              ) : (
                <AdoptionCard
                  key={`${post._id}-${post.status}`}
                  post={post}
                  imageUrl={imagePreviews[post._id]?.[0] || post.imageUrls?.[0] || post.imageUrl}
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

      {editingPost && adoptions.some((post) => post._id === editingPost) && (
        <AdoptionEditModal
          post={adoptions.find((post) => post._id === editingPost)}
          onClose={() => setEditingPost(null)}
          onSave={handleSaveEdit}
          saving={savingStates[editingPost]}
        />
      )}

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