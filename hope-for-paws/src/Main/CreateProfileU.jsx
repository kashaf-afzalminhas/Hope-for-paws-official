import VerifiedBadge from "../Components/VerifiedBadge";
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaUserCircle, FaEdit, FaLock, FaListAlt, FaHistory, FaSignOutAlt, FaBars, FaTimes, FaChevronLeft, FaCamera, FaTrash, FaStore, FaEye, FaEyeSlash, FaShoppingBag, FaHeart, FaComment, FaPen } from 'react-icons/fa';
import { Heart, MessageCircle, Pencil, Trash2, X } from 'lucide-react';
import { MdPets } from 'react-icons/md';
import { NavLink, useNavigate } from 'react-router-dom';
import { AUTH_BASE_URL } from '../config';
import { API_BASE_URL } from '../config';
import { uploadProfileImage, getUserProfile, removeProfileImage, debugToken } from './api';
import { useAuth } from '../context/AuthContext';
import AdoptionRequestsModal from './AdoptionRequestsModal';
import MyAdoptions from './MyAdoptions';
import AdoptionHistory from './AdoptionHistory';
import { getCurrentUserId } from '../lib/utils';
import SellerDashboard from './SellerDashboard';
import SellerOrders from '../marketplace/SellerOrders';
import MyOrdersPage from '../marketplace/BuyerOrders';
import { COUNTRY_CODES } from '../utils/constants';

// Simple Toast component
const Toast = ({ toasts }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    {toasts.map((toast, idx) => (
      <div key={idx} className={`p-4 rounded-lg shadow-lg font-body ${toast.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{toast.message}</div>
    ))}
  </div>
);

Toast.propTypes = {
  toasts: PropTypes.arrayOf(
    PropTypes.shape({
      message: PropTypes.string.isRequired,
      type: PropTypes.string
    })
  ).isRequired
};

const DEFAULT_NOTIFICATION_PREFERENCES = {
  email: 'instant',
  inApp: true,
  push: false
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    about: '',
    userType: '',
    id: '',
    profileImage: '',
    notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES
  });

  // Phone validation states
  const [phoneError, setPhoneError] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  
  // Form input states (separate from profile state)
  const [formData, setFormData] = useState({
    phone: '',
    city: '',
    about: '',
    countryCode: '+92',
    notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES
  });
  
  // Track original profile data to detect changes
  const [originalProfile, setOriginalProfile] = useState({
    phone: '',
    city: '',
    about: '',
    countryCode: '+92',
    notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
  const totalComments = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [passwordTouched, setPasswordTouched] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [passwordError, setPasswordError] = useState('');

  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => {
    setToasts((prev) => [...prev, { message, type }]);
    setTimeout(() => setToasts((prev) => prev.slice(1)), 3500);
  };

  // Phone validation function
  const validatePhone = (phoneNumber, code) => {
    if (!phoneNumber) return 'Phone number is required';
    if (!/^\d+$/.test(phoneNumber)) return 'Phone number must contain digits only';

    const countryRules = {
      '+92': { min: 10, max: 10, label: 'Pakistan' },
      '+1': { min: 10, max: 10, label: 'US/Canada' },
      '+44': { min: 10, max: 10, label: 'United Kingdom' },
      '+91': { min: 10, max: 10, label: 'India' }
    };
    const rule = countryRules[code];
    if (rule && (phoneNumber.length < rule.min || phoneNumber.length > rule.max)) {
      if (rule.min === rule.max) {
        return `${rule.label} numbers must be exactly ${rule.min} digits after ${code}`;
      }
      return `${rule.label} numbers must be ${rule.min}-${rule.max} digits after ${code}`;
    }

    if (phoneNumber.length < 7 || phoneNumber.length > 15) return 'Phone number must be 7-15 digits';
    
    const fullPhone = code + phoneNumber;
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(fullPhone)) return 'Please enter a valid phone number';
    
    return '';
  };

  // Debug function to test token
  const testToken = async () => {
    try {
      console.log('Testing token transmission...');
      const response = await debugToken();
      console.log('Token test response:', response);
    } catch (error) {
      console.error('Token test error:', error);
      addToast('Token test failed', 'error');
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
    if (userData) {
      // Convert isVeterinarian to userType for display
      const getUserType = (user) => {
        if (user.userType) return user.userType;
        if (user.isSeller) return 'Seller';
        if (user.isVeterinarian) return 'Veterinarian';
        return 'Regular User';
      };

      // Parse existing phone number to extract country code and phone number
      let phoneNumber = '';
      let phoneCountryCode = '+92';
      
      if (userData.phone) {
        // Find matching country code
        const matchingCountry = COUNTRY_CODES.find(country => userData.phone.startsWith(country.code));
        if (matchingCountry) {
          phoneCountryCode = matchingCountry.code;
          phoneNumber = userData.phone.substring(matchingCountry.code.length);
        } else {
          phoneNumber = userData.phone;
        }
      }

      setProfile({
        id: userData.id || userData._id || '',
        name: userData.username,
        email: userData.email,
        phone: userData.phone, // Store the full phone number with country code for display
        city: userData.city || '',
        about: userData.about || '',
        userType: getUserType(userData),
        // userType: userData.userType,
        profileImage: userData.profileImage || '',
        notificationPreferences: userData.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES
      });

      // Initialize form data with current profile data
      setFormData({
        phone: phoneNumber,
        city: userData.city || '',
        about: userData.about || '',
        countryCode: phoneCountryCode,
        notificationPreferences: userData.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES
      });

      // Set original profile data for change detection
      setOriginalProfile({
        phone: phoneNumber,
        city: userData.city || '',
        about: userData.about || '',
        countryCode: phoneCountryCode
      });

      // If user doesn't have a phone number, redirect to edit view
      if (!userData.phone || !userData.phoneVerified) {
        setCurrentView('edit');
      }
      
      // Test token transmission
      testToken();
    } else {
      setError('No user data found. Please log in.');
      navigate('/signin');
    }
  }, [navigate]);

  // Fetch user profile data including profile image
  const fetchUserProfile = async () => {
    try {
      const response = await getUserProfile();
      if (response.data && response.data.data) {
        const userData = response.data.data;
        const notificationPreferences = userData.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES;

        setProfile(prev => ({
          ...prev,
          profileImage: userData.profileImage || '',
          isVerified: userData.sellerDetails?.isVerified || false,
          notificationPreferences
        }));

        setFormData(prev => ({
          ...prev,
          notificationPreferences
        }));

        setOriginalProfile(prev => ({
          ...prev,
          notificationPreferences
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNotificationPreferenceChange = (key, value) => {
    setFormData({
      ...formData,
      notificationPreferences: {
        ...formData.notificationPreferences,
        [key]: value
      }
    });
  };

  const handlePhoneChange = (e) => {
    let phoneValue = e.target.value;
    
    // Remove leading zero if country code is selected
    if (formData.countryCode && phoneValue.startsWith('0')) {
      phoneValue = phoneValue.substring(1);
    }
    
    setFormData({ ...formData, phone: phoneValue });
    setPhoneTouched(true);
    setPhoneError(validatePhone(phoneValue, formData.countryCode));
  };

  const handleCountryCodeChange = (e) => {
    const newCountryCode = e.target.value;
    let phoneValue = formData.phone;
    
    // Remove leading zero when country code changes
    if (newCountryCode && phoneValue.startsWith('0')) {
      phoneValue = phoneValue.substring(1);
      setFormData({ ...formData, phone: phoneValue, countryCode: newCountryCode });
    } else {
      setFormData({ ...formData, countryCode: newCountryCode });
    }
    
    setPhoneTouched(true);
    setPhoneError(validatePhone(phoneValue, newCountryCode));
  };

  // Function to detect if there are changes
  const hasChanges = () => {
    return (
      formData.phone !== originalProfile.phone ||
      formData.city !== originalProfile.city ||
      formData.about !== originalProfile.about ||
      formData.countryCode !== originalProfile.countryCode ||
      JSON.stringify(formData.notificationPreferences) !== JSON.stringify(originalProfile.notificationPreferences)
    );
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePasswordStrength = (value) => {
    if (!value) return 'Password is required';
    const errors = [];
    if (value.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(value)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(value)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(value)) errors.push('One number');
    if (!/[^A-Za-z0-9]/.test(value)) errors.push('One special character');
    return errors.length ? errors.join(', ') : '';
  };

  const passwordChecks = [
    { label: '8+ characters', valid: passwords.newPassword.length >= 8 },
    { label: 'Uppercase', valid: /[A-Z]/.test(passwords.newPassword) },
    { label: 'Lowercase', valid: /[a-z]/.test(passwords.newPassword) },
    { label: 'Number', valid: /[0-9]/.test(passwords.newPassword) },
    { label: 'Special', valid: /[^A-Za-z0-9]/.test(passwords.newPassword) }
  ];
  const unmetRequirements = passwordChecks.filter((check) => !check.valid);

  const handleCancelEdit = () => {
    // Reset form data to original profile data
    setFormData({
      phone: originalProfile.phone,
      city: originalProfile.city,
      about: originalProfile.about,
      countryCode: originalProfile.countryCode,
      notificationPreferences: originalProfile.notificationPreferences
    });
    setPhoneError('');
    setPhoneTouched(false);
    setCurrentView('profile');
  };

  // Handle profile image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      addToast('Please select a valid image file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      addToast('Image size should be less than 5MB', 'error');
      return;
    }

    setImageLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await uploadProfileImage(formData);
      
      if (response.data && response.data.success) {
        const newImagePath = response.data.data.profileImage;
        setProfile(prev => ({ ...prev, profileImage: newImagePath }));
        
        const userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
        if (userData) {
          userData.profileImage = newImagePath;
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        addToast('Profile image uploaded successfully!');
      } else {
        setError('Failed to upload image. Please try again.');
        addToast('Failed to upload image. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('An error occurred while uploading the image.');
      addToast('An error occurred while uploading the image.', 'error');
    } finally {
      setImageLoading(false);
    }
  };

  // Handle profile image removal
  const handleRemoveImage = async () => {
    if (!profile.profileImage) return;

    setImageLoading(true);
    setError('');

    try {
      const response = await removeProfileImage();
      
      if (response.data && response.data.success) {
        setProfile(prev => ({ ...prev, profileImage: '' }));
        
        const userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
        if (userData) {
          userData.profileImage = '';
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        addToast('Profile image removed successfully!');
      } else {
        setError('Failed to remove image. Please try again.');
        addToast('Failed to remove image. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error removing image:', error);
      setError('An error occurred while removing the image.');
      addToast('An error occurred while removing the image.', 'error');
    } finally {
      setImageLoading(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { id } = profile;
    const { city, about } = formData;
    const fullPhone = formData.countryCode + formData.phone;

    // Validate phone number
    const phoneValidationError = validatePhone(formData.phone, formData.countryCode);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      setPhoneTouched(true);
      setLoading(false);
      addToast(phoneValidationError, 'error');
      return;
    }

    if (!id) {
      setError('Please log in again to update profile');
      addToast('Please log in again to update profile', 'error');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${AUTH_BASE_URL}/update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          phone: fullPhone,
          city,
          about,
          notificationPreferences: formData.notificationPreferences
        })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        const updatedUser = data.user;
        
        // Update AuthContext with the new user data
        updateUser(updatedUser);
        
        // Convert isVeterinarian to userType for display
        const getUserType = (user) => {
          if (user.userType) return user.userType;
          if (user.isSeller) return 'Seller';
          if (user.isVeterinarian) return 'Veterinarian';
          return 'Regular User';
        };

        // Parse the updated phone number
        let phoneNumber = '';
        let phoneCountryCode = '+92';
        
        if (updatedUser.phone) {
          const matchingCountry = COUNTRY_CODES.find(country => updatedUser.phone.startsWith(country.code));
          if (matchingCountry) {
            phoneCountryCode = matchingCountry.code;
            phoneNumber = updatedUser.phone.substring(matchingCountry.code.length);
          } else {
            phoneNumber = updatedUser.phone;
          }
        }

        const resolvedUserId = updatedUser.id || updatedUser._id || id;

        setProfile({
          id: resolvedUserId,
          name: updatedUser.username,
          email: updatedUser.email,
          phone: updatedUser.phone, // Store the full phone number with country code for display
          city: updatedUser.city || '',
          about: updatedUser.about || '',
          userType: getUserType(updatedUser),
          // userType: updatedUser.userType,
          profileImage: profile.profileImage, // Keep the current profile image
          notificationPreferences: updatedUser.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES
        });
        
        // Update form data to match the saved profile
        setFormData({
          phone: phoneNumber,
          city: updatedUser.city || '',
          about: updatedUser.about || '',
          countryCode: phoneCountryCode,
          notificationPreferences: updatedUser.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES
        });
        
        // Update original profile data to reflect the saved state
        setOriginalProfile({
          phone: phoneNumber,
          city: updatedUser.city || '',
          about: updatedUser.about || '',
          countryCode: phoneCountryCode,
          notificationPreferences: updatedUser.notificationPreferences || DEFAULT_NOTIFICATION_PREFERENCES
        });
        
        // Clear phone validation errors
        setPhoneError('');
        setPhoneTouched(false);
        
        addToast('Profile updated successfully!');
        setCurrentView('profile');
      } else {
        // Handle specific phone number errors
        if (data.message && data.message.includes('already used')) {
          setPhoneError('This phone number is already used by another user');
          setPhoneTouched(true);
          // Only show toast for duplicate phone, not the general error
          addToast('This phone number is already used by another user', 'error');
        } else if (data.message && data.message.includes('valid international phone number')) {
          setPhoneError('Please enter a valid international phone number');
          setPhoneTouched(true);
          addToast('Please enter a valid international phone number', 'error');
        } else {
          // For other errors, show both error state and toast
          setError(data.message || 'Failed to update profile. Please try again.');
          addToast(data.message || 'Failed to update profile. Please try again.', 'error');
        }
      }
    } catch (error) {
      setLoading(false);
      console.error('Error:', error);
      setError('An error occurred while updating the profile.');
      addToast('An error occurred while updating the profile.', 'error');
    }
  };

  const handlePasswordUpdate = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { currentPassword, newPassword, confirmPassword } = passwords;
    const { id } = profile;

    if (!id) {
      setError('Please log in again to change your password');
      addToast('Please log in again to change your password', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      addToast('New passwords do not match', 'error');
      setLoading(false);
      return;
    }
    const strengthError = validatePasswordStrength(newPassword);
    setPasswordError(strengthError);
    if (strengthError) {
      setLoading(false);
      addToast(`Password must have: ${strengthError}`, 'error');
      return;
    }

    try {
      const response = await fetch(`${AUTH_BASE_URL}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, currentPassword, newPassword }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        addToast('Password changed successfully!');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setCurrentView('profile');
      } else {
        setError(data.error || 'Failed to change password. Please try again.');
        addToast(data.error || 'Failed to change password. Please try again.', 'error');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error:', error);
      setError('An error occurred while changing the password.');
      addToast('An error occurred while changing the password.', 'error');
    }
  };

  const hasProvider = (provider) =>
    Array.isArray(user?.authProviders) && user.authProviders.some((p) => p?.provider === provider);

  // Show "Set Password" only for Google-only accounts (no local provider linked yet).
  const shouldShowSetPassword = hasProvider('google') && !hasProvider('local');

  const handleSetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { newPassword, confirmPassword } = passwords;
    if (!newPassword || !confirmPassword) {
      setLoading(false);
      addToast('Please enter and confirm your new password', 'error');
      return;
    }
    const strengthError = validatePasswordStrength(newPassword);
    setPasswordError(strengthError);
    if (strengthError) {
      setLoading(false);
      addToast(`Password must have: ${strengthError}`, 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLoading(false);
      addToast('Passwords do not match', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setLoading(false);
        addToast('Authentication token missing. Please log in again.', 'error');
        return;
      }

      const response = await fetch(`${AUTH_BASE_URL}/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        // Update AuthContext + storage
        if (data.user) {
          updateUser(data.user);
        }
        addToast('Password set successfully! You can now sign in with email/password.');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setCurrentView('profile');
      } else {
        addToast(data.message || 'Failed to set password', 'error');
      }
    } catch (err) {
      setLoading(false);
      addToast(err.message || 'Failed to set password', 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/signout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        addToast('Signed out successfully!');
        navigate('/signin');
      } else {
        addToast('Failed to sign out. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      addToast('An error occurred while signing out.', 'error');
    }
  };

  // 1. Add new sidebar links for the three pages
  const profileLinks = [
    { name: 'View Profile', view: 'profile', icon: <FaUserCircle /> },
    { name: 'Edit Profile', view: 'edit', icon: <FaEdit /> },
    { name: 'Security Settings', view: 'security', icon: <FaLock /> },
    { name: 'My Posts', view: 'myposts', icon: <FaListAlt /> },
  ];

  // Conditionally add Order Management below My Posts for Sellers
  if (user?.isSeller || user?.role === 'seller') {
    profileLinks.push({
      name: 'Order Management',
      view: 'ordermanagement',
      icon: <FaShoppingBag />
    });
  }

  // Only show 'My Orders' if user is NOT a seller (i.e. Buyer/Vet)
  if (!user?.isSeller && user?.role !== 'seller') {
    profileLinks.push({
      name: 'My Orders',
      view: 'myorders',
      icon: <FaShoppingBag />
    });
  }

  profileLinks.push(
    { name: 'My Adoptions', view: 'myadoptions', icon: <MdPets /> },
    { name: 'Adoption History', view: 'adoptionhistory', icon: <FaHistory /> }
  );

  // Conditionally add Store Dashboard
  if (user?.isSeller || user?.role === 'seller') {
    profileLinks.push({
      name: 'Store Dashboard',
      view: 'sellerdashboard',
      icon: <FaStore />
    });
  }

  // 2. Add state for the three new pages
  // AdoptionHistory state
  const [adoptionHistory, setAdoptionHistory] = useState([]);
  const [adoptionHistoryLoading, setAdoptionHistoryLoading] = useState(false);
  const [adoptionHistoryError, setAdoptionHistoryError] = useState('');
  const [adoptionHistoryEffectiveUser, setAdoptionHistoryEffectiveUser] = useState(null);
  // MyAdoptions state
  const [adoptions, setAdoptions] = useState([]);
  const [editingAdoptionPost, setEditingAdoptionPost] = useState(null);
  const [editAdoptionData, setEditAdoptionData] = useState({ 
    name: '', 
    age: '', 
    petType: '', 
    breed: '', 
    vaccinated: '', 
    neuteredSpayed: '', 
    description: '', 
    location: '' 
  });
  const [adoptionsLoading, setAdoptionsLoading] = useState(false);
  const [adoptionsError, setAdoptionsError] = useState('');
  const [originalAdoptionData, setOriginalAdoptionData] = useState({});
  const [newAdoptionImages, setNewAdoptionImages] = useState({}); // Store images per post ID
  const [adoptionImagePreviews, setAdoptionImagePreviews] = useState({}); // Store previews per post ID
  const [adoptionsStoredUser, setAdoptionsStoredUser] = useState(null);
  const [adoptionSavingStates, setAdoptionSavingStates] = useState({}); // Track saving state per adoption post
  
  // MyPosts state
  const [editingPost, setEditingPost] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState("");
  const [expandedComments, setExpandedComments] = useState({});
  const [selectedPostForRequests, setSelectedPostForRequests] = useState(null);
  const [postSavingStates, setPostSavingStates] = useState({}); // Track saving state per post

  // 3. Add useEffects and functions for the three pages
  // AdoptionHistory logic
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (currentView !== 'adoptionhistory') return;
    // Check for user in localStorage/sessionStorage if not in context
    const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
    if (!user && storedUser) {
      setAdoptionHistoryEffectiveUser(storedUser);
    } else {
      setAdoptionHistoryEffectiveUser(user);
    }
  }, [user, currentView]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (currentView !== 'adoptionhistory') return;
    const effectiveUser = user || adoptionHistoryEffectiveUser;
    if (!effectiveUser) {
      setAdoptionHistoryLoading(false);
      setAdoptionHistoryError('Please log in to view your adoption history');
      return;
    }
    fetchAdoptionHistory();
  }, [user, adoptionHistoryEffectiveUser, currentView]);

  const fetchAdoptionHistory = async () => {
    try {
      setAdoptionHistoryLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('No token found. Please log in again.');
      const response = await fetch(`${API_BASE_URL}/adoptions/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {/* ignore error parsing error response */}
        throw new Error(errorMessage);
      }
      const data = await response.json();
      setAdoptionHistory(data);
      setAdoptionHistoryError('');
    } catch (err) {
      setAdoptionHistoryError(err.message || 'Failed to fetch adoption history');
    } finally {
      setAdoptionHistoryLoading(false);
    }
  };
  const formatAdoptionDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  // MyAdoptions logic
  useEffect(() => {
    if (currentView !== 'myadoptions') return;
    const userFromStorage = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
    setAdoptionsStoredUser(userFromStorage);
  }, [currentView]);
  useEffect(() => {
    if (currentView !== 'myadoptions') return;
    const effectiveUser = user || adoptionsStoredUser;
    const uid = getCurrentUserId(effectiveUser);
    if (!uid) return;
    fetchUserAdoptions(uid);
    // eslint-disable-next-line
  }, [user, adoptionsStoredUser, currentView]);
  const fetchUserAdoptions = async (userId) => {
    try {
      setAdoptionsLoading(true);
      setAdoptionsError('');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentication token missing');
      const response = await fetch(`${API_BASE_URL}/adoptions/user/${userId}?includeRequests=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load adoption posts');
      const data = await response.json();
      setAdoptions(data);
    } catch (err) {
      setAdoptionsError(err.message || 'Failed to load adoption posts');
    } finally {
      setAdoptionsLoading(false);
    }
  };
  const handleDeleteAdoption = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this adoption post?")) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await fetch(`${API_BASE_URL}/adoptions/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const effectiveUser = user || adoptionsStoredUser;
      const uid = getCurrentUserId(effectiveUser);
      if (uid) fetchUserAdoptions(uid);
    } catch (err) {
      setAdoptionsError(err.message || 'Failed to delete post');
    }
  };
  const handleEditAdoption = (post) => {
    setEditingAdoptionPost(post._id);
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
    setEditAdoptionData(postData);
    setOriginalAdoptionData(postData);
    // Clear any existing image data for this post
    setNewAdoptionImages(prev => ({ ...prev, [post._id]: null }));
    setAdoptionImagePreviews(prev => ({ ...prev, [post._id]: null }));
  };
  const handleSaveEditAdoption = async (postId) => {
    try {
      // Set saving state for this specific adoption post
      setAdoptionSavingStates(prev => ({ ...prev, [postId]: true }));
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      // If there's a new image, upload first
      if (newAdoptionImages[postId]) {
        const formData = new FormData();
        formData.append('image', newAdoptionImages[postId]);
        const imgRes = await fetch(`${API_BASE_URL}/adoptions/${postId}/image`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (!imgRes.ok) {
          const errData = await imgRes.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to update image');
        }
        
        // Get the updated image URL from the response
        const imgData = await imgRes.json();
        if (imgData.imageUrl) {
          // Update local state with new image URL
          setAdoptions(prev => prev.map(post => 
            post._id === postId ? { ...post, imageUrl: imgData.imageUrl } : post
          ));
        }
      }
      
      const response = await fetch(`${API_BASE_URL}/adoptions/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editAdoptionData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update adoption post');
      }
      
      // Update local state immediately for better UX
      setAdoptions(prev => prev.map(post => 
        post._id === postId ? { ...post, ...editAdoptionData } : post
      ));
      
      setEditingAdoptionPost(null);
      // Clear image data for this post
      setNewAdoptionImages(prev => ({ ...prev, [postId]: null }));
      setAdoptionImagePreviews(prev => ({ ...prev, [postId]: null }));
      
      // Show immediate success feedback
      addToast('Adoption post updated successfully!');
      
    } catch (err) {
      setAdoptionsError(err.message || 'Failed to update post');
      addToast(err.message || 'Failed to update post', 'error');
    } finally {
      // Clear saving state
      setAdoptionSavingStates(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Changes detection for Save button
  const hasAdoptionChanges = (postId) => {
    if (newAdoptionImages[postId]) return true;
    return Object.keys(editAdoptionData).some((key) => editAdoptionData[key] !== originalAdoptionData[key]);
  };

  const handleAdoptionImageChange = (e, postId) => {
    const file = e.target.files[0];
    if (file) {
      setNewAdoptionImages(prev => ({ ...prev, [postId]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdoptionImagePreviews(prev => ({ ...prev, [postId]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeNewAdoptionImage = (postId) => {
    setNewAdoptionImages(prev => ({ ...prev, [postId]: null }));
    setAdoptionImagePreviews(prev => ({ ...prev, [postId]: null }));
  };
  const handleRequestAction = async () => {
    const effectiveUser = user || adoptionsStoredUser;
    const uid = getCurrentUserId(effectiveUser);
    if (uid) fetchUserAdoptions(uid);
  };

  const handleStatusChange = async (postId, newStatus) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/adoptions/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const data = await response.json();
      const reopenedCount = data.reopenedRequests ?? 0;

      setAdoptions((prev) =>
        prev.map((post) => {
          if (post._id !== postId) return post;
          const next = {
            ...post,
            ...data,
            status: data.status ?? newStatus,
            vaccinated: data.vaccinated ?? post.vaccinated,
            neuteredSpayed: data.neuteredSpayed ?? post.neuteredSpayed,
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

      const effectiveUser = user || adoptionsStoredUser;
      const uid = getCurrentUserId(effectiveUser);
      if (uid) {
        await fetchUserAdoptions(uid);
      }

      let message = `Status updated to ${newStatus} successfully!`;
      if (reopenedCount > 0) {
        message += ` ${reopenedCount} previous request(s) restored to "Request sent" for review.`;
      }
      addToast(message);
    } catch (err) {
      console.error('Error updating status:', err);
      addToast(`Failed to update status: ${err.message}`, 'error');
    }
  };

  const handleViewRequests = (post) => {
    setSelectedPostForRequests(post);
  };

  const handleCloseRequestsModal = () => {
    setSelectedPostForRequests(null);
  };
  // MyPosts logic
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (currentView !== 'myposts') return;
    const userr = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
    const uid = getCurrentUserId(userr);
    if (!uid) return;
    fetchUserPosts(uid);
  }, [currentView]);
  const fetchUserPosts = async (userId) => {
    if (!userId) return;
    try {
      setPostsLoading(true);
      setPostsError("");
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error("Token is missing. Please log in again.");
      const response = await fetch(`${API_BASE_URL}/posts/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load posts. Please try again later.');
      const data = await response.json();
      setPosts(data);
    } catch {
      setPostsError("Failed to load posts. Please try again later.");
    } finally {
      setPostsLoading(false);
    }
  };
  const handleEditPost = (post) => {
    setEditingPost(post._id);
    setEditCaption(post.caption);
  };
  const handleSaveEditPost = async (postId) => {
    try {
      // Set saving state for this specific post
      setPostSavingStates(prev => ({ ...prev, [postId]: true }));
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caption: editCaption })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update post');
      }
      
      // Update local state immediately for better UX
      setPosts(prev => prev.map(post => 
        post._id === postId ? { ...post, caption: editCaption } : post
      ));
      
      setEditingPost(null);
      
      // Show immediate success feedback
      addToast('Post updated successfully!');
      
    } catch (err) {
      setPostsError("Failed to update post. Please try again.");
      addToast("Failed to update post. Please try again.", 'error');
    } finally {
      // Clear saving state
      setPostSavingStates(prev => ({ ...prev, [postId]: false }));
    }
  };
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const userr = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
      fetchUserPosts(userr.id);
    } catch {
      setPostsError("Failed to delete post. Please try again.");
    }
  };
const handleDeleteComment = async (commentId, postId) => {// change here.
  if (!window.confirm("Are you sure you want to delete this comment?")) return;

  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    setPosts(prev => prev.map(post => {
      if (post._id === postId) {
        return {
          ...post,
          comments: post.comments.filter((c) => c._id !== commentId),
        };
      }
      return post;
    }));
  } catch (err) {
    addToast('Failed to delete comment.', 'error');
  }
}; // till here. 
  const toggleComments = (postId) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleViewChange = (view) => {
    // Block access to other pages if user doesn't have phone number OR if there's a phone validation error
    const hasPhoneError = phoneTouched && phoneError;
    const needsPhone = !profile.phone || !user?.phoneVerified;
    
    if ((needsPhone || hasPhoneError) && view !== 'edit' && view !== 'profile') {
      if (hasPhoneError) {
        addToast('Please fix the phone number error first', 'error');
      } else {
        addToast('Please add your phone number first to access this feature', 'error');
      }
      return;
    }
    
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const handleExternalNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Toast toasts={toasts} />

      {/* Main Content */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
          {/* Sidebar */}
          <div className="mb-2 w-full shrink-0 lg:mb-0 lg:w-64 xl:w-72">
            {/* Back Button */}
            <div className="mb-4">
              <NavLink 
                to="/" 
                className="inline-flex items-center gap-2 rounded-full border border-[#e8dcc8] bg-white px-4 py-2 text-sm font-semibold text-[#6b493d] shadow-sm transition hover:bg-[#f8f4ed] hover:text-[#57392f]"
              >
                <FaChevronLeft className="text-xs" />
                <span>Back to Home</span>
              </NavLink>
            </div>

            <div className="rounded-[24px] border border-[#e8dcc8] bg-gradient-to-br from-[#f8f4ed] via-[#fcf8f3] to-[#efe4d8] p-4 text-center shadow-sm">
              <div className="relative w-20 h-20 mx-auto mb-3">
                {profile.profileImage ? (
                  <img 
                    src={`${AUTH_BASE_URL.replace('/auth', '')}${profile.profileImage}`}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#6b493d]"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-20 h-20 rounded-full bg-[#6b493d] text-white flex items-center justify-center text-3xl font-bold ${profile.profileImage ? 'hidden' : ''}`}>
                  {profile.name ? profile.name[0].toUpperCase() : <FaUserCircle />}
                </div>
                
                {/* Image upload button */}
                <label className="absolute bottom-0 right-0 bg-[#6b493d] text-white rounded-full p-2 cursor-pointer hover:bg-[#57392f] transition-colors">
                  <FaCamera size={12} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={imageLoading}
                  />
                </label>
                
                {/* Remove image button */}
                {profile.profileImage && (
                  <button
                    onClick={handleRemoveImage}
                    disabled={imageLoading}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 cursor-pointer hover:bg-red-600 transition-colors"
                    title="Remove profile image"
                  >
                    <FaTrash size={10} />
                  </button>
                )}
              </div>
              
              {imageLoading && (
                <div className="text-sm text-[#a07855] mb-2">
                  {profile.profileImage ? 'Updating...' : 'Uploading...'}
                </div>
              )}
              
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="font-bold text-lg text-[#6b493d]">{profile.name}</h3>
                {profile.userType === 'Seller' && (
                  <VerifiedBadge isVerified={profile.isVerified} size="md" />
                )}
              </div>
              <p className="text-[#a07855] text-sm truncate">{profile.email}</p>

              {/* Mobile menu toggle */}
              <div className="mt-4 md:hidden">
                <button
                  onClick={toggleMobileMenu}
                  className="flex w-full items-center justify-between rounded-full bg-[#6b493d] px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-[#57392f]"
                >
                  <span>{currentView === 'profile' ? 'View Profile' : currentView === 'edit' ? 'Edit Profile' : 'Security Settings'}</span>
                  {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>
                {mobileMenuOpen && (
                  <div className="absolute left-1/2 z-20 mt-2 w-64 -translate-x-1/2 rounded-[20px] border border-[#e8dcc8] bg-white p-2 shadow-lg">
                    {profileLinks.map((link, i) =>
                      link.external ? (
                        <button
                          key={i}
                          onClick={() => handleExternalNavigation(link.path)}
                          className="flex w-full items-center rounded-2xl px-3 py-3 text-[#6b493d] transition hover:bg-[#f8f4ed]"
                        >
                          {link.icon}<span className="ml-2">{link.name}</span>
                        </button>
                      ) : (
                        <button
                          key={i}
                          onClick={() => handleViewChange(link.view)}
                          disabled={((!profile.phone || !user?.phoneVerified) || (phoneTouched && phoneError)) && link.view !== 'edit' && link.view !== 'profile'}
                          className={`flex w-full items-center rounded-2xl px-3 py-3 transition ${
                            currentView === link.view ? 'bg-[#6b493d] text-white shadow-sm' : 
                            ((!profile.phone || !user?.phoneVerified) || (phoneTouched && phoneError)) && link.view !== 'edit' && link.view !== 'profile' ? 
                            'cursor-not-allowed text-gray-400' : 'text-[#6b493d] hover:bg-[#f8f4ed]'
                          }`}
                        >
                          {link.icon}<span className="ml-2">{link.name}</span>
                        </button>
                      )
                    )}
                    <div className="my-1 border-t border-[#e8dcc8]/60" />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center rounded-2xl px-3 py-3 text-left text-red-600 hover:bg-red-50 font-medium transition"
                    >
                      <FaSignOutAlt /><span className="ml-2">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop navigation */}
            <div className="mt-4 hidden rounded-[24px] border border-[#e8dcc8] bg-[#fcfaf7] p-2 shadow-sm md:block">
              {profileLinks.map((link, i) =>
                link.external ? (
                  <NavLink key={i} to={link.path} className="flex items-center rounded-2xl px-3 py-3 text-[#6b493d] transition hover:bg-[#f8f4ed]">
                    {link.icon}<span className="ml-2">{link.name}</span>
                  </NavLink>
                ) : (
                  <button
                    key={i}
                    onClick={() => handleViewChange(link.view)}
                    disabled={((!profile.phone || !user?.phoneVerified) || (phoneTouched && phoneError)) && link.view !== 'edit' && link.view !== 'profile'}
                    className={`flex w-full items-center rounded-2xl px-3 py-3 text-left transition ${
                      currentView === link.view ? 'bg-[#6b493d] text-white shadow-sm' : 
                      ((!profile.phone || !user?.phoneVerified) || (phoneTouched && phoneError)) && link.view !== 'edit' && link.view !== 'profile' ? 
                      'cursor-not-allowed text-gray-400' : 'text-[#6b493d] hover:bg-[#f8f4ed]'
                    }`}
                  >
                    {link.icon}<span className="ml-2">{link.name}</span>
                  </button>
                )
              )}
              <div className="my-1.5 border-t border-[#e8dcc8]/60" />
              <button
                onClick={handleSignOut}
                className="flex w-full items-center rounded-2xl px-3 py-3 text-left text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition"
              >
                <FaSignOutAlt /><span className="ml-2">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className={`min-w-0 flex-1 ${currentView === 'ordermanagement' || currentView === 'sellerdashboard' ? 'rounded-xl border border-[#e8dcc8]/60 bg-white p-3 shadow-sm sm:p-4' : 'rounded-xl border border-[#e8dcc8]/60 bg-white p-5 shadow-sm sm:p-8 lg:p-10'}`}>
            {currentView === 'profile' && (
              <div className="space-y-6">
                <div className="rounded-[28px] border border-[#e8dcc8] bg-gradient-to-br from-[#f8f4ed] via-[#fdf9f5] to-[#f1e4d7] p-6 shadow-sm sm:p-8">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a07855]">Profile overview</p>
                      <h2 className="mt-2 text-2xl font-bold text-[#6b493d]">My Profile</h2>
                      <p className="mt-2 max-w-2xl text-sm text-[#715645]">A calm, trustworthy snapshot of your account for buyers, adopters, and fellow sellers.</p>
                    </div>
                    <button
                      onClick={() => setCurrentView('edit')}
                      className="inline-flex items-center justify-center rounded-full bg-[#6b493d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#57392f]"
                    >
                      Edit Profile
                    </button>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-[#e8dcc8] bg-white/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a07855]">Primary contact</p>
                      <p className="mt-2 text-sm font-semibold text-[#4E3B31]">{profile.phone || 'No phone added yet'}</p>
                    </div>
                    <div className="rounded-2xl border border-[#e8dcc8] bg-white/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a07855]">Account type</p>
                      <p className="mt-2 text-sm font-semibold text-[#4E3B31]">{profile.userType || 'Standard User'}</p>
                    </div>
                    <div className="rounded-2xl border border-[#e8dcc8] bg-white/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a07855]">Notifications</p>
                      <p className="mt-2 text-sm font-semibold text-[#4E3B31]">{profile.notificationPreferences?.inApp ? 'Active' : 'Muted'}</p>
                    </div>
                  </div>
                </div>

                {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[24px] border border-[#e8dcc8] bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[#6b493d]">Personal information</h3>
                        <p className="mt-1 text-sm text-[#7a6554]">Keep your profile helpful and easy to recognize.</p>
                      </div>
                      <span className="rounded-full bg-[#f8f4ed] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#a07855]">Contact</span>
                    </div>
                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl bg-[#fcfaf7] p-4">
                        <p className="text-sm text-[#8d7565]">Name</p>
                        <p className="mt-1 font-semibold text-[#4E3B31]">{profile.name}</p>
                      </div>
                      <div className="rounded-2xl bg-[#fcfaf7] p-4">
                        <p className="text-sm text-[#8d7565]">Email</p>
                        <p className="mt-1 font-semibold text-[#4E3B31]">{profile.email}</p>
                      </div>
                      <div className="rounded-2xl bg-[#fcfaf7] p-4">
                        <p className="text-sm text-[#8d7565]">Phone</p>
                        <p className="mt-1 font-semibold text-[#4E3B31]">{profile.phone || 'Not provided'}</p>
                      </div>
                      <div className="rounded-2xl bg-[#fcfaf7] p-4">
                        <p className="text-sm text-[#8d7565]">City</p>
                        <p className="mt-1 font-semibold text-[#4E3B31]">{profile.city || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[#e8dcc8] bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[#6b493d]">Notification preferences</h3>
                        <p className="mt-1 text-sm text-[#7a6554]">Choose how updates should reach you.</p>
                      </div>
                      <span className="rounded-full bg-[#f8f4ed] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#a07855]">Alerts</span>
                    </div>
                    <div className="mt-5 grid gap-3">
                      <div className="rounded-2xl border border-[#e8dcc8] bg-[#fcfaf7] p-4">
                        <p className="text-sm font-semibold text-[#4E3B31]">Email</p>
                        <p className="mt-1 text-sm text-[#7a6554]">{profile.notificationPreferences?.email === 'instant' ? 'Instant' : profile.notificationPreferences?.email === 'daily_summary' ? 'Daily summary' : 'Disabled'}</p>
                      </div>
                      <div className="rounded-2xl border border-[#e8dcc8] bg-[#fcfaf7] p-4">
                        <p className="text-sm font-semibold text-[#4E3B31]">In-app</p>
                        <p className="mt-1 text-sm text-[#7a6554]">{profile.notificationPreferences?.inApp ? 'Enabled' : 'Disabled'}</p>
                      </div>
                      <div className="rounded-2xl border border-[#e8dcc8] bg-[#fcfaf7] p-4">
                        <p className="text-sm font-semibold text-[#4E3B31]">Push</p>
                        <p className="mt-1 text-sm text-[#7a6554]">{profile.notificationPreferences?.push ? 'Enabled' : 'Disabled'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#e8dcc8] bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[#6b493d]">About me</h3>
                      <p className="mt-1 text-sm text-[#7a6554]">A short intro helps people connect with your profile.</p>
                    </div>
                    <span className="rounded-full bg-[#f8f4ed] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#a07855]">Story</span>
                  </div>
                  <div className="mt-4 rounded-2xl bg-[#fcfaf7] p-4 text-sm leading-7 text-[#5f473b]">
                    {profile.about || 'No information provided yet.'}
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#e8dcc8] bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[#6b493d]">Account type</h3>
                      <p className="mt-1 text-sm text-[#7a6554]">Your current role and verification status.</p>
                    </div>
                    {profile.userType === 'Seller' && (
                      profile.isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          Verified Seller
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                          Unverified Seller
                        </span>
                      )
                    )}
                  </div>
                  <div className="mt-4 rounded-2xl bg-[#fcfaf7] p-4 text-sm font-semibold text-[#4E3B31]">
                    {profile.userType || 'Standard User'}
                  </div>
                </div>
              </div>
            )}

            {currentView === 'edit' && (
              <div className="space-y-6">
                <div className="rounded-[28px] border border-[#e8dcc8] bg-gradient-to-br from-[#f8f4ed] via-[#fdf9f5] to-[#f1e4d7] p-6 shadow-sm sm:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a07855]">Edit account</p>
                      <h2 className="mt-2 text-2xl font-bold text-[#6b493d]">Personal details</h2>
                      <p className="mt-2 text-sm text-[#715645]">Keep your public profile polished and your alert preferences easy to manage.</p>
                    </div>
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#a07855]">Secure update</span>
                  </div>
                </div>

                {error && !(phoneTouched && phoneError) && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                
                {(!profile.phone || !user?.phoneVerified) && !(phoneTouched && phoneError) && (
                  <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">Phone number required</h3>
                        <p className="mt-1 text-sm">Add a phone number to unlock the rest of the experience.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="rounded-[24px] border border-[#e8dcc8] bg-white p-6 shadow-sm">
                    <div className="mb-5">
                      <h3 className="text-lg font-semibold text-[#6b493d]">Basic details</h3>
                      <p className="mt-1 text-sm text-[#7a6554]">These details help people recognize and contact you.</p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                        <input 
                          type="text" 
                          disabled
                          value={profile.name}
                          className="w-full rounded-2xl border border-gray-300 bg-gray-100 px-3 py-2.5"
                        />
                        <p className="mt-1 text-xs text-gray-500">Cannot be changed</p>
                      </div>
                      
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                        <input 
                          type="email" 
                          disabled
                          value={profile.email}
                          className="w-full rounded-2xl border border-gray-300 bg-gray-100 px-3 py-2.5"
                        />
                        <p className="mt-1 text-xs text-gray-500">Cannot be changed</p>
                      </div>
                      
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Phone number</label>
                        <div className="flex gap-2">
                          <select
                            value={formData.countryCode}
                            onChange={handleCountryCodeChange}
                            className="min-w-[120px] rounded-2xl border border-gray-300 px-3 py-2.5 text-gray-700 focus:border-[#6b493d] focus:outline-none focus:ring-1 focus:ring-[#6b493d] sm:text-sm"
                          >
                            {COUNTRY_CODES.map((country, index) => (
                              <option key={index} value={country.code}>
                                {country.flag} {country.code}
                              </option>
                            ))}
                          </select>
                          <input 
                            type="tel" 
                            name="phone"
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            onBlur={() => setPhoneTouched(true)}
                            className={`flex-1 rounded-2xl border px-3 py-2.5 text-gray-700 focus:border-[#6b493d] focus:outline-none focus:ring-1 focus:ring-[#6b493d] sm:text-sm ${phoneTouched && phoneError ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="XXXXXXXXXX"
                          />
                        </div>
                        {phoneTouched && phoneError && (
                          <p className="mt-1 text-xs text-red-600">{phoneError}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
                        <input 
                          type="text" 
                          name="city"
                          value={formData.city}
                          onChange={handleProfileChange}
                          className="w-full rounded-2xl border border-gray-300 px-3 py-2.5 focus:border-[#6b493d] focus:outline-none focus:ring-1 focus:ring-[#6b493d]"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-[24px] border border-[#e8dcc8] bg-white p-6 shadow-sm">
                    <div className="mb-5">
                      <h3 className="text-lg font-semibold text-[#6b493d]">About you</h3>
                      <p className="mt-1 text-sm text-[#7a6554]">A short introduction makes your profile feel warmer and more personal.</p>
                    </div>
                    <textarea 
                      name="about"
                      value={formData.about}
                      onChange={handleProfileChange}
                      rows="4"
                      className="w-full rounded-2xl border border-gray-300 px-3 py-2.5 focus:border-[#6b493d] focus:outline-none focus:ring-1 focus:ring-[#6b493d]"
                      placeholder="Tell us a bit about yourself..."
                    ></textarea>
                  </div>

                  <div className="rounded-[24px] border border-[#e8dcc8] bg-[#fcfaf7] p-6 shadow-sm">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-[#6b493d]">Notification preferences</h3>
                      <p className="mt-1 text-sm text-[#7a6554]">Choose how updates should reach you without overwhelming your inbox.</p>
                    </div>

                    <div className="grid gap-4">
                      <div>
                        <p className="mb-2 text-sm font-medium text-gray-700">Email notifications</p>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {[
                            { value: 'instant', label: 'Instant' },
                            { value: 'daily_summary', label: 'Daily summary' },
                            { value: 'disabled', label: 'Disabled' }
                          ].map(option => (
                            <button
                              type="button"
                              key={option.value}
                              onClick={() => handleNotificationPreferenceChange('email', option.value)}
                              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${formData.notificationPreferences.email === option.value ? 'border-[#6b493d] bg-[#6b493d]/10 text-[#1f2a3d]' : 'border-gray-200 bg-white text-gray-700 hover:border-[#6b493d]/70 hover:bg-[#f8f6f4]'}`}
                            >
                              <p className="font-semibold">{option.label}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                {option.value === 'instant' ? 'Send urgent updates immediately.' : option.value === 'daily_summary' ? 'Bundle routine alerts into one daily digest.' : 'Disable email alerts.'}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                          <input
                            type="checkbox"
                            checked={formData.notificationPreferences.inApp}
                            onChange={(e) => handleNotificationPreferenceChange('inApp', e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-[#6b493d] focus:ring-[#6b493d]"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">In-app notifications</p>
                            <p className="text-xs text-gray-500">Show alerts inside the app whenever activity happens.</p>
                          </div>
                        </label>

                        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                          <input
                            type="checkbox"
                            checked={formData.notificationPreferences.push}
                            onChange={(e) => handleNotificationPreferenceChange('push', e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-[#6b493d] focus:ring-[#6b493d]"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">Push notifications</p>
                            <p className="text-xs text-gray-500">Receive mobile push alerts where supported.</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button 
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={loading || !hasChanges() || (phoneTouched && phoneError)}
                      className={`rounded-full px-5 py-2.5 text-sm font-semibold ${
                        loading || !hasChanges() || (phoneTouched && phoneError)
                          ? 'cursor-not-allowed bg-gray-400 text-gray-200'
                          : 'bg-[#6b493d] text-white hover:bg-[#57392f]'
                      }`}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {currentView === 'security' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-[#6b493d]">Security Settings</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4 text-[#6b493d]">
                    {shouldShowSetPassword ? 'Set Password' : 'Change Password'}
                  </h3>
                  <form onSubmit={shouldShowSetPassword ? handleSetPassword : handlePasswordUpdate}>
                    <div className="mb-4">
                      {shouldShowSetPassword ? (
                        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded">
                          This account was created with Google. Set a password once to enable email/password sign-in.
                        </div>
                      ) : (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                          <div className="relative">
                            <input 
                              type={showPasswords.currentPassword ? 'text' : 'password'}
                              name="currentPassword"
                              value={passwords.currentPassword}
                              onChange={handlePasswordChange}
                              onBlur={() => setPasswordTouched((prev) => ({ ...prev, currentPassword: true }))}
                              required
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('currentPassword')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                              aria-label={showPasswords.currentPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPasswords.currentPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <div className="relative">
                        <input 
                          type={showPasswords.newPassword ? 'text' : 'password'}
                          name="newPassword"
                          value={passwords.newPassword}
                          onChange={(e) => {
                            handlePasswordChange(e);
                            if (passwordTouched.newPassword) {
                              setPasswordError(validatePasswordStrength(e.target.value));
                            }
                          }}
                          onBlur={() => {
                            setPasswordTouched((prev) => ({ ...prev, newPassword: true }));
                            setPasswordError(validatePasswordStrength(passwords.newPassword));
                          }}
                          required
                          className={`w-full px-3 py-2 pr-10 border rounded-md ${
                            passwordTouched.newPassword && passwordError ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('newPassword')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                          aria-label={showPasswords.newPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPasswords.newPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {passwords.newPassword && unmetRequirements.length === 0 && (
                        <div className="mt-2 flex items-center text-green-700 text-xs">
                          <span className="mr-1">✓</span>
                          Password meets all requirements
                        </div>
                      )}
                      {passwordTouched.newPassword && passwordError && (
                        <p className="text-xs text-red-600 mt-1">Password must have: {passwordError}</p>
                      )}
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <div className="relative">
                        <input 
                          type={showPasswords.confirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={passwords.confirmPassword}
                          onChange={handlePasswordChange}
                          onBlur={() => setPasswordTouched((prev) => ({ ...prev, confirmPassword: true }))}
                          required
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirmPassword')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                          aria-label={showPasswords.confirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPasswords.confirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {passwordTouched.confirmPassword && passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                        <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <button 
                        type="submit"
                        disabled={
                          loading ||
                          (passwordTouched.newPassword && !!passwordError) ||
                          (passwords.newPassword && passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword)
                        }
                        className="bg-[#6b493d] hover:bg-[#57392f] text-white font-medium py-2 px-6 rounded-md"
                      >
                        {loading ? 'Updating...' : (shouldShowSetPassword ? 'Set Password' : 'Update Password')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {currentView === 'adoptionhistory' && <AdoptionHistory />}
            {currentView === 'myadoptions' && <MyAdoptions embedded />}
            {currentView === 'myorders' && (
                <MyOrdersPage embedded />
            )}
            {currentView === 'myposts' && (
              <section className="min-h-screen py-4">
                <div className="w-full">
                  <h3 className="text-3xl font-bold text-[#6b493d] mb-8 text-center" style={{ fontFamily: '"Playfair Display", serif' }}>
                    My Shared Posts
                  </h3>

                  {postsLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6b493d] border-t-transparent"></div>
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="bg-[#c9a280]/20 rounded-xl p-8 text-center border-2 border-dashed border-[#6b493d]/30">
                      <p className="text-xl text-[#6b493d]/80 italic">No posts yet. Share your first pet moment!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                      {posts.map((post) => (
                        <article key={post._id} className="bg-white rounded-2xl shadow-[0_12px_30px_rgba(107,73,61,0.08)] border border-[#f1e7df] overflow-hidden">
                          <div className="relative">
                            <img
                              src={post.imageUrl}
                              alt="Pet"
                              className="w-full h-64 object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#6b493d]/25 via-transparent to-transparent" />
                          </div>

                          <div className="p-5 md:p-6">
                            {editingPost === post._id ? (
                              <div className="space-y-4">
                                <h4 className="text-lg font-semibold text-[#6b493d] border-b border-[#6b493d]/20 pb-2">
                                  Edit Post Caption
                                </h4>
                                <textarea
                                  value={editCaption}
                                  onChange={(e) => setEditCaption(e.target.value)}
                                  className="w-full rounded-lg border border-[#c9a280] bg-[#fdfaf7] text-[#4E3B31] focus:border-[#6b493d] focus:ring-2 focus:ring-[#6b493d]/20 resize-none"
                                  rows={4}
                                  style={{ fontFamily: '"Poppins", sans-serif' }}
                                />
                                <div className="flex justify-end gap-3">
                                  <button
                                    onClick={() => setEditingPost(null)}
                                    className="p-2 hover:bg-[#6b493d]/10 rounded-full transition-colors"
                                    disabled={postSavingStates[post._id]}
                                    aria-label="Cancel edit"
                                  >
                                    <X className="h-5 w-5 text-[#6b493d]" />
                                  </button>
                                  <button
                                    onClick={() => handleSaveEditPost(post._id)}
                                    disabled={postSavingStates[post._id]}
                                    className="px-4 py-2 bg-[#6b493d] text-white rounded-lg hover:bg-[#5a3d32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    style={{ fontFamily: '"Poppins", sans-serif' }}
                                  >
                                    {postSavingStates[post._id] ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        <span>Saving...</span>
                                      </>
                                    ) : (
                                      <span>Save Changes</span>
                                    )}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p
                                  className="text-[#4E3B31] mb-4 italic text-base md:text-lg leading-relaxed break-words"
                                  style={{ fontFamily: '"Poppins", sans-serif', whiteSpace: 'pre-wrap' }}
                                >
                                  &quot;{post.caption}&quot;
                                </p>

                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                  <div className="flex items-center space-x-4 text-[#6b493d]/80">
                                    <span className="inline-flex items-center gap-1.5">
                                      <Heart className="h-4 w-4 fill-current" />
                                      <span>{post.likes.length}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                      <MessageCircle className="h-4 w-4" />
                                      <span>{post.comments.length}</span>
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleEditPost(post)}
                                      className="p-2 hover:bg-[#6b493d]/10 rounded-full transition-colors"
                                      aria-label="Edit post"
                                    >
                                      <Pencil className="h-5 w-5 text-[#6b493d]" />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePost(post._id)}
                                      className="p-2 hover:bg-[#6b493d]/10 rounded-full transition-colors"
                                      aria-label="Delete post"
                                    >
                                      <Trash2 className="h-5 w-5 text-[#6b493d]" />
                                    </button>
                                  </div>
                                </div>

                                <button
                                  onClick={() => toggleComments(post._id)}
                                  className="mt-4 text-sm font-medium text-[#6b493d] hover:text-[#5a3d32] transition-colors"
                                >
                                  {expandedComments[post._id] ? "Hide Comments" : "View Comments"}
                                </button>

                                {expandedComments[post._id] && (
                                  <div className="mt-4 space-y-3">
                                    {post.comments.length > 0 ? (
                                      post.comments.map((comment) => (
                                        <div key={comment._id} className="bg-[#f5f3ed] p-3 rounded-lg flex justify-between items-start gap-2">
                                          <div>
                                            <p className="text-[#6b493d] font-medium break-words">
                                              {comment.userId?.username || "Unknown User"}
                                            </p>
                                            <p className="text-[#6b493d]/80 break-words">{comment.content}</p>
                                          </div>
                                          {user && (
                                            comment.userId?._id === user._id || comment.userId?._id === user.id ||
                                            post.userId?._id === user._id || post.userId?._id === user.id
                                          ) && (
                                            <button
                                              onClick={() => handleDeleteComment(comment._id, post._id)}
                                              className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                                              title="Delete comment"
                                              aria-label="Delete comment"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-[#6b493d]/80 italic">No comments yet. Be the first to comment!</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {postsError && (
                    <div className="mt-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
                      {postsError}
                    </div>
                  )}
                </div>
              </section>
            )}
            
            {currentView === 'sellerdashboard' && (
              <SellerDashboard onNavigateOrders={() => handleViewChange('ordermanagement')} />
            )}

            {currentView === 'ordermanagement' && (
              <SellerOrders embedded />
            )}
          </div>
        </div>
      </main>

      {/* Requests Modal */}
      {selectedPostForRequests && (
        <AdoptionRequestsModal
          post={selectedPostForRequests}
          requests={selectedPostForRequests.requests || []}
          onClose={handleCloseRequestsModal}
          onRequestAction={handleRequestAction}
          onRefresh={() => {
            const effectiveUser = user || adoptionsStoredUser;
            const uid = getCurrentUserId(effectiveUser);
            if (uid) fetchUserAdoptions(uid);
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;