import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
// ✅ ADDED FaStore to imports
import { FaUserCircle, FaEdit, FaLock, FaListAlt, FaHistory, FaSignOutAlt, FaBars, FaTimes, FaChevronLeft, FaCamera, FaTrash, FaStore } from 'react-icons/fa';
import { MdPets } from 'react-icons/md';
import { NavLink, useNavigate } from 'react-router-dom';
import { AUTH_BASE_URL } from '../config';
import { API_BASE_URL } from '../config';
import { uploadProfileImage, getUserProfile, removeProfileImage, debugToken } from './api';
import { useAuth } from '../context/AuthContext';
import AdoptionRequestsModal from './AdoptionRequestsModal';

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
  });

  // Phone validation states
  const [phoneError, setPhoneError] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [countryCode, setCountryCode] = useState('+92');
  
  // Form input states (separate from profile state)
  const [formData, setFormData] = useState({
    phone: '',
    city: '',
    about: '',
    countryCode: '+92'
  });
  
  // Track original profile data to detect changes
  const [originalProfile, setOriginalProfile] = useState({
    phone: '',
    city: '',
    about: '',
    countryCode: '+92'
  });
  const [countryCodes] = useState([
    { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
    { code: '+1', name: 'United States', flag: '🇺🇸' },
    { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+86', name: 'China', flag: '🇨🇳' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+49', name: 'Germany', flag: '🇩🇪' },
    { code: '+81', name: 'Japan', flag: '🇯🇵' },
    { code: '+82', name: 'South Korea', flag: '🇰🇷' },
    { code: '+61', name: 'Australia', flag: '🇦🇺' },
    { code: '+55', name: 'Brazil', flag: '🇧🇷' },
    { code: '+52', name: 'Mexico', flag: '🇲🇽' },
    { code: '+39', name: 'Italy', flag: '🇮🇹' },
    { code: '+34', name: 'Spain', flag: '🇪🇸' },
    { code: '+7', name: 'Russia', flag: '🇷🇺' },
    { code: '+90', name: 'Turkey', flag: '🇹🇷' },
    { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+971', name: 'UAE', flag: '🇦🇪' },
    { code: '+974', name: 'Qatar', flag: '🇶🇦' },
    { code: '+965', name: 'Kuwait', flag: '🇰🇼' },
    { code: '+973', name: 'Bahrain', flag: '🇧🇭' },
    { code: '+968', name: 'Oman', flag: '🇴🇲' },
    { code: '+20', name: 'Egypt', flag: '🇪🇬' },
    { code: '+27', name: 'South Africa', flag: '🇿🇦' },
    { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
    { code: '+254', name: 'Kenya', flag: '🇰🇪' },
    { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
    { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
    { code: '+977', name: 'Nepal', flag: '🇳🇵' },
    { code: '+93', name: 'Afghanistan', flag: '🇦🇫' },
    { code: '+98', name: 'Iran', flag: '🇮🇷' },
    { code: '+964', name: 'Iraq', flag: '🇮🇶' },
    { code: '+962', name: 'Jordan', flag: '🇯🇴' },
    { code: '+961', name: 'Lebanon', flag: '🇱🇧' },
    { code: '+963', name: 'Syria', flag: '🇸🇾' },
    { code: '+972', name: 'Israel', flag: '🇮🇱' },
    { code: '+970', name: 'Palestine', flag: '🇵🇸' },
    { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
    { code: '+65', name: 'Singapore', flag: '🇸🇬' },
    { code: '+66', name: 'Thailand', flag: '🇹🇭' },
    { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
    { code: '+63', name: 'Philippines', flag: '🇵🇭' },
    { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
    { code: '+95', name: 'Myanmar', flag: '🇲🇲' },
    { code: '+855', name: 'Cambodia', flag: '🇰🇭' },
    { code: '+856', name: 'Laos', flag: '🇱🇦' },
    { code: '+673', name: 'Brunei', flag: '🇧🇳' },
    { code: '+670', name: 'East Timor', flag: '🇹🇱' },
    { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
    { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
    { code: '+977', name: 'Nepal', flag: '🇳🇵' },
    { code: '+93', name: 'Afghanistan', flag: '🇦🇫' },
    { code: '+98', name: 'Iran', flag: '🇮🇷' },
    { code: '+964', name: 'Iraq', flag: '🇮🇶' },
    { code: '+962', name: 'Jordan', flag: '🇯🇴' },
    { code: '+961', name: 'Lebanon', flag: '🇱🇧' },
    { code: '+963', name: 'Syria', flag: '🇸🇾' },
    { code: '+972', name: 'Israel', flag: '🇮🇱' },
    { code: '+970', name: 'Palestine', flag: '🇵🇸' },
    { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
    { code: '+65', name: 'Singapore', flag: '🇸🇬' },
    { code: '+66', name: 'Thailand', flag: '🇹🇭' },
    { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
    { code: '+63', name: 'Philippines', flag: '🇵🇭' },
    { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
    { code: '+95', name: 'Myanmar', flag: '🇲🇲' },
    { code: '+855', name: 'Cambodia', flag: '🇰🇭' },
    { code: '+856', name: 'Laos', flag: '🇱🇦' },
    { code: '+673', name: 'Brunei', flag: '🇧🇳' },
    { code: '+670', name: 'East Timor', flag: '🇹🇱' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState('profile');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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
    const userData = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
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
        const matchingCountry = countryCodes.find(country => userData.phone.startsWith(country.code));
        if (matchingCountry) {
          phoneCountryCode = matchingCountry.code;
          phoneNumber = userData.phone.substring(matchingCountry.code.length);
        } else {
          phoneNumber = userData.phone;
        }
      }

      setCountryCode(phoneCountryCode);
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
      });

      // Initialize form data with current profile data
      setFormData({
        phone: phoneNumber,
        city: userData.city || '',
        about: userData.about || '',
        countryCode: phoneCountryCode
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
        setProfile(prev => ({
          ...prev,
          profileImage: userData.profileImage || '',
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
    
    setCountryCode(newCountryCode);
    setPhoneTouched(true);
    setPhoneError(validatePhone(phoneValue, newCountryCode));
  };

  // Function to detect if there are changes
  const hasChanges = () => {
    return (
      formData.phone !== originalProfile.phone ||
      formData.city !== originalProfile.city ||
      formData.about !== originalProfile.about ||
      formData.countryCode !== originalProfile.countryCode
    );
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleCancelEdit = () => {
    // Reset form data to original profile data
    setFormData({
      phone: originalProfile.phone,
      city: originalProfile.city,
      about: originalProfile.about,
      countryCode: originalProfile.countryCode
    });
    setCountryCode(originalProfile.countryCode);
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
        
        // Update local storage
        const userData = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
        if (userData) {
          userData.profileImage = newImagePath;
          localStorage.setItem('user', JSON.stringify(userData));
          sessionStorage.setItem('user', JSON.stringify(userData));
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
        
        // Update local storage
        const userData = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
        if (userData) {
          userData.profileImage = '';
          localStorage.setItem('user', JSON.stringify(userData));
          sessionStorage.setItem('user', JSON.stringify(userData));
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
        body: JSON.stringify({ id, phone: fullPhone, city, about })
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
          const matchingCountry = countryCodes.find(country => updatedUser.phone.startsWith(country.code));
          if (matchingCountry) {
            phoneCountryCode = matchingCountry.code;
            phoneNumber = updatedUser.phone.substring(matchingCountry.code.length);
          } else {
            phoneNumber = updatedUser.phone;
          }
        }

        setCountryCode(phoneCountryCode);
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
        });
        
        // Update form data to match the saved profile
        setFormData({
          phone: phoneNumber,
          city: updatedUser.city || '',
          about: updatedUser.about || '',
          countryCode: phoneCountryCode
        });
        
        // Update original profile data to reflect the saved state
        setOriginalProfile({
          phone: phoneNumber,
          city: updatedUser.city || '',
          about: updatedUser.about || '',
          countryCode: phoneCountryCode
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
    { name: 'My Adoptions', view: 'myadoptions', icon: <MdPets /> },
    { name: 'Adoption History', view: 'adoptionhistory', icon: <FaHistory /> },
  ];

  // ✅ ADDED: Conditionally add Seller Dashboard
  if (user && user.isSeller) {
    profileLinks.push({
      name: 'Seller Dashboard',
      path: '/seller/dashboard',
      icon: <FaStore />,
      external: true // This tells the render loop to use navigate() instead of setView()
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
  const [posts, setPosts] = useState([]);
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
    const storedUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
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
    const userFromStorage = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
    setAdoptionsStoredUser(userFromStorage);
  }, [currentView]);
  useEffect(() => {
    if (currentView !== 'myadoptions') return;
    const effectiveUser = user || adoptionsStoredUser;
    if (!effectiveUser?.id) return;
    fetchUserAdoptions(effectiveUser.id);
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
      if (effectiveUser?.id) fetchUserAdoptions(effectiveUser.id);
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
  const handleRequestAction = async (postId, requestId, action) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await fetch(`${API_BASE_URL}/adoptions/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: action === 'accept' ? 'accepted' : 'rejected' })
      });
      alert(`Request ${action === 'accept' ? 'accepted' : 'rejected'} successfully`);
      const effectiveUser = user || adoptionsStoredUser;
      if (effectiveUser?.id) fetchUserAdoptions(effectiveUser.id);
    } catch (err) {
      alert(`Failed to ${action} request: ${err.message}`);
    }
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
      
      // Update local state immediately for better UX
      setAdoptions(prev => prev.map(post => 
        post._id === postId ? { ...post, status: newStatus } : post
      ));
      
      // Show success message
      addToast(`Status updated to ${newStatus} successfully!`);
      
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
    const userr = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
    if (!userr || !userr.id) return;
    fetchUserPosts(userr.id);
  }, [currentView]);
  const fetchUserPosts = async (userId) => {
    if (!userId) return;
    try {
      setPostsLoading(true);
      setPostsError("");
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
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
      
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
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
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const userr = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
      fetchUserPosts(userr.id);
    } catch {
      setPostsError("Failed to delete post. Please try again.");
    }
  };
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
      {/* Header */}
      <header className="bg-[#F8F4ED] text-[#a07855] p-4 shadow-md">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <NavLink to="/" className="flex items-center">
            <FaChevronLeft className="text-xl text-[#6b493d]" />
            <span className="ml-2 text-[#6b493d]">Back</span>
          </NavLink>
          <h1 className="text-lg font-bold text-[#6b493d]">My Profile</h1>
          <button 
            onClick={handleSignOut} 
            className="flex items-center text-[#a07855] hover:text-[#6b493d]"
          >
            <span className="mr-1 hidden md:inline">Sign Out</span>
            <FaSignOutAlt />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-4 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:space-x-6">
          {/* Sidebar */}
          <div className="md:w-1/4 mb-6">
            <div className="bg-[#F8F4ED] rounded-lg shadow p-4 text-center">
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
              
              <h3 className="font-bold text-lg text-[#6b493d]">{profile.name}</h3>
              <p className="text-[#a07855] text-sm truncate">{profile.email}</p>

              {/* Mobile menu toggle */}
              <div className="mt-4 md:hidden">
                <button
                  onClick={toggleMobileMenu}
                  className="w-full flex items-center justify-between bg-[#6b493d] hover:bg-[#57392f] text-white font-medium py-2 px-4 rounded-md"
                >
                  <span>{currentView === 'profile' ? 'View Profile' : currentView === 'edit' ? 'Edit Profile' : 'Security Settings'}</span>
                  {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>
                {mobileMenuOpen && (
                  <div className="absolute z-20 mt-2 w-64 bg-white rounded-md shadow-lg py-1 left-1/2 transform -translate-x-1/2">
                    {profileLinks.map((link, i) =>
                      link.external ? (
                        <button
                          key={i}
                          onClick={() => handleExternalNavigation(link.path)}
                          className="flex items-center w-full px-4 py-3 border-b border-gray-100 text-[#6b493d] hover:bg-[#F8F4ED]"
                        >
                          {link.icon}<span className="ml-2">{link.name}</span>
                        </button>
                      ) : (
                        <button
                          key={i}
                          onClick={() => handleViewChange(link.view)}
                          disabled={((!profile.phone || !user?.phoneVerified) || (phoneTouched && phoneError)) && link.view !== 'edit' && link.view !== 'profile'}
                          className={`flex items-center w-full px-4 py-3 border-b border-gray-100 ${
                            currentView === link.view ? 'bg-[#6b493d] text-white' : 
                            ((!profile.phone || !user?.phoneVerified) || (phoneTouched && phoneError)) && link.view !== 'edit' && link.view !== 'profile' ? 
                            'text-gray-400 cursor-not-allowed' : 'text-[#6b493d] hover:bg-[#F8F4ED]'
                          }`}
                        >
                          {link.icon}<span className="ml-2">{link.name}</span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop navigation */}
            <div className="mt-4 bg-white rounded-lg shadow hidden md:block">
              {profileLinks.map((link, i) =>
                link.external ? (
                  <NavLink key={i} to={link.path} className="flex items-center p-3 border-b border-gray-100 text-[#6b493d] hover:bg-[#F8F4ED]">
                    {link.icon}<span className="ml-2">{link.name}</span>
                  </NavLink>
                ) : (
                  <button
                    key={i}
                    onClick={() => handleViewChange(link.view)}
                    disabled={((!profile.phone || !user?.phoneVerified) || (phoneTouched && phoneError)) && link.view !== 'edit' && link.view !== 'profile'}
                    className={`flex items-center w-full p-3 border-b border-gray-100 text-left ${
                      currentView === link.view ? 'bg-[#6b493d] text-white' : 
                      ((!profile.phone || !user?.phoneVerified) || (phoneTouched && phoneError)) && link.view !== 'edit' && link.view !== 'profile' ? 
                      'text-gray-400 cursor-not-allowed' : 'text-[#6b493d] hover:bg-[#F8F4ED]'
                    }`}
                  >
                    {link.icon}<span className="ml-2">{link.name}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            {currentView === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-[#6b493d]">My Profile</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-[#6b493d]">Personal Information</h3>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="mb-3">
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">{profile.name}</p>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{profile.email}</p>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{profile.phone || 'Not provided'}</p>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm text-gray-500">City</p>
                        <p className="font-medium">{profile.city || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-[#6b493d]">About Me</h3>
                    <div className="bg-gray-50 p-4 rounded h-full">
                      <p>{profile.about || 'No information provided yet.'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2 text-[#6b493d]">Account Type</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="font-medium capitalize">{profile.userType || 'Standard User'}</p>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={() => setCurrentView('edit')}
                    className="bg-[#6b493d] hover:bg-[#57392f] text-white font-medium py-2 px-6 rounded-md"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}

            {currentView === 'edit' && (
              <div>
                <h2 className="text-2xl font-bold mb-6 text-[#6b493d]">Edit Profile</h2>
                {error && !(phoneTouched && phoneError) && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                
                {/* Warning message for users without phone (but not for phone validation errors) */}
                {(!profile.phone || !user?.phoneVerified) && !(phoneTouched && phoneError) && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium">
                          Phone Number Required
                        </h3>
                        <div className="mt-2 text-sm">
                          <p>You must add a phone number to access other features of the application.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSaveProfile}>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input 
                        type="text" 
                        disabled
                        value={profile.name}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input 
                        type="email" 
                        disabled
                        value={profile.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <div className="flex gap-2">
                        <select
                          value={formData.countryCode}
                          onChange={handleCountryCodeChange}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm min-w-[120px]"
                        >
                          {countryCodes.map((country, index) => (
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
                          className={`flex-1 px-3 py-2 border ${phoneTouched && phoneError ? 'border-red-500' : 'border-gray-300'} text-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b493d] focus:border-[#6b493d] sm:text-sm`}
                          placeholder="XXXXXXXXXX"
                        />
                      </div>
                      {phoneTouched && phoneError && (
                        <p className="text-xs text-red-600 mt-1">{phoneError}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input 
                        type="text" 
                        name="city"
                        value={formData.city}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">About Me</label>
                    <textarea 
                      name="about"
                      value={formData.about}
                      onChange={handleProfileChange}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Tell us a bit about yourself..."
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-between">
                    <button 
                      type="button"
                      onClick={handleCancelEdit}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-md"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={loading || !hasChanges() || (phoneTouched && phoneError)}
                      className={`font-medium py-2 px-6 rounded-md ${
                        loading || !hasChanges() || (phoneTouched && phoneError)
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : 'bg-[#6b493d] hover:bg-[#57392f] text-white'
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
                  <h3 className="text-lg font-medium mb-4 text-[#6b493d]">Change Password</h3>
                  <form onSubmit={handlePasswordUpdate}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input 
                        type="password" 
                        name="currentPassword"
                        value={passwords.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input 
                        type="password" 
                        name="newPassword"
                        value={passwords.newPassword}
                        onChange={handlePasswordChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input 
                        type="password" 
                        name="confirmPassword"
                        value={passwords.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <button 
                        type="submit"
                        disabled={loading}
                        className="bg-[#6b493d] hover:bg-[#57392f] text-white font-medium py-2 px-6 rounded-md"
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {currentView === 'adoptionhistory' && (
              <div>
                <h2 className="text-2xl font-bold text-[#4E3B31] mb-6">My Adoption History</h2>
                {adoptionHistoryLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B5A2B]"></div>
                  </div>
                ) : adoptionHistoryError && (!adoptionHistory || adoptionHistory.length === 0) ? (
                  <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                    <p className="font-semibold">Error</p>
                    <p>{adoptionHistoryError}</p>
                    {!adoptionHistoryEffectiveUser && (
                      <button 
                        onClick={() => navigate('/signin')}
                        className="mt-4 px-4 py-2 bg-[#8B5A2B] text-white rounded-md hover:bg-[#6B493D] transition-colors"
                      >
                        Log In
                      </button>
                    )}
                  </div>
                ) : adoptionHistory.length === 0 ? (
                  <div className="text-center py-10">
                    <h2 className="text-xl font-semibold text-gray-700">No Adoption History</h2>
                    <p className="text-gray-500 mt-2">You haven&apos;t made any adoption requests yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
                      <thead className="bg-[#8B5A2B] text-white">
                        <tr>
                          <th className="px-6 py-3 text-left">Pet</th>
                          <th className="px-6 py-3 text-left">Type</th>
                          <th className="px-6 py-3 text-left">Request Date</th>
                          <th className="px-6 py-3 text-left">Status</th>
                          <th className="px-6 py-3 text-left">Response Date</th>
                          <th className="px-6 py-3 text-left">Message</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {adoptionHistory.map((item) => (
                          <tr key={item._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <img 
                                  src={item.petImage} 
                                  alt={item.petName}
                                  className="h-10 w-10 rounded-full object-cover mr-3"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/40?text=Pet';
                                  }}
                                />
                                <span className="font-medium text-gray-900">{item.petName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-700">{item.petType}</td>
                            <td className="px-6 py-4 text-gray-700">{formatAdoptionDate(item.requestDate)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {item.responseDate ? formatAdoptionDate(item.responseDate) : '-'}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {item.message || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {currentView === 'myadoptions' && (
              <section className="min-h-screen  py-4">
                <div className="max-w-4xl mx-auto px-2 md:px-4">
                  <h3 className="text-3xl font-bold text-[#6b493d] mb-8 text-center" style={{ fontFamily: '"Playfair Display", serif' }}>
                    My Adoption Posts
                  </h3>
                  {adoptionsLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6b493d] border-t-transparent"></div>
                    </div>
                  ) : adoptionsError ? (
                    <div className="mt-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
                      <p className="font-semibold">Error loading adoption posts</p>
                      <p className="text-sm mt-2">{adoptionsError}</p>
                    </div>
                  ) : (!user && !adoptionsStoredUser) ? (
                    <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl text-center">
                      <p>Please log in to view your adoption posts.</p>
                    </div>
                  ) : adoptions.length === 0 ? (
                    <div className="bg-[#c9a280]/20 rounded-xl p-8 text-center border-2 border-dashed border-[#6b493d]/30">
                      <p className="text-xl text-[#6b493d]/80 italic">No adoption posts yet. Create your first adoption post!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {adoptions.map((post) => (
                        <div key={post._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-xl w-full mx-auto">
                          <div className="relative group">
                            <img 
                              src={adoptionImagePreviews[post._id] || post.imageUrl} 
                              alt={post.name} 
                                className="w-full h-56 object-contain bg-gray-100 rounded-t-2xl transition-transform duration-300 hover:scale-105" 
                              loading="lazy"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/400x300?text=Pet+Image';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#6b493d]/40 to-transparent rounded-t-2xl" />

                            {/* Only show edit overlay when editing this post */}
                            {editingAdoptionPost === post._id && (
                              <label className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-t-2xl">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="mt-2 text-white text-xs font-medium">Click to change image</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleAdoptionImageChange(e, post._id)}
                                  className="hidden"
                                />
                                {adoptionImagePreviews[post._id] && (
                                  <button
                                    type="button"
                                    onClick={() => removeNewAdoptionImage(post._id)}
                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors"
                                  >
                                    ×
                                  </button>
                                )}
                              </label>
                            )}
                          </div>
                          <div className="p-4">
                            {editingAdoptionPost === post._id ? (
                              <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-[#6b493d] mb-4 border-b border-[#6b493d]/20 pb-2">
                                  Edit Adoption Post: {post.name}
                                </h3>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Pet Name</label>
                                <input
                                  type="text"
                                  value={editAdoptionData.name}
                                  onChange={(e) => setEditAdoptionData({...editAdoptionData, name: e.target.value})}
                                  className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d] mb-2"
                                  placeholder="Pet Name"
                                />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                                <input
                                  type="text"
                                  value={editAdoptionData.age}
                                  onChange={(e) => setEditAdoptionData({...editAdoptionData, age: e.target.value})}
                                  className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d] mb-2"
                                  placeholder="Age"
                                />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Pet Type</label>
                                <input
                                  type="text"
                                  value={editAdoptionData.petType}
                                  onChange={(e) => setEditAdoptionData({...editAdoptionData, petType: e.target.value})}
                                  className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d] mb-2"
                                  placeholder="Pet Type"
                                />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Breed</label>
                                  <input
                                    type="text"
                                    value={editAdoptionData.breed}
                                    onChange={(e) => setEditAdoptionData({...editAdoptionData, breed: e.target.value})}
                                    className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d] mb-2"
                                    placeholder="Breed"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Vaccination Status</label>
                                  <select
                                    value={editAdoptionData.vaccinated}
                                    onChange={(e) => setEditAdoptionData({...editAdoptionData, vaccinated: e.target.value})}
                                    className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d] mb-2"
                                  >
                                    <option value="">Select vaccination status</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Neutered/Spayed Status</label>
                                  <select
                                    value={editAdoptionData.neuteredSpayed}
                                    onChange={(e) => setEditAdoptionData({...editAdoptionData, neuteredSpayed: e.target.value})}
                                    className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d] mb-2"
                                  >
                                    <option value="">Select neutering status</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                  value={editAdoptionData.description}
                                  onChange={(e) => setEditAdoptionData({...editAdoptionData, description: e.target.value})}
                                  className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d]"
                                    rows={2}
                                  placeholder="Description"
                                ></textarea>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                                <input
                                  type="text"
                                  value={editAdoptionData.location}
                                  onChange={(e) => setEditAdoptionData({...editAdoptionData, location: e.target.value})}
                                  className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d] mb-2"
                                  placeholder="Location"
                                />
                                </div>
                                <div className="flex justify-end space-x-3">
                                  <button 
                                    onClick={() => setEditingAdoptionPost(null)}
                                    className="p-2 hover:bg-[#6b493d]/10 rounded-full transition-colors"
                                    disabled={adoptionSavingStates[post._id]}
                                  >
                                    <span className="h-5 w-5 text-[#6b493d]">✕</span>
                                  </button>
                                  <button
                                    onClick={() => handleSaveEditAdoption(post._id)}
                                    disabled={!hasAdoptionChanges(post._id) || adoptionSavingStates[post._id]}
                                    className="px-4 py-2 bg-[#6b493d] text-white rounded-lg hover:bg-[#5a3d32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                    style={{ fontFamily: '"Poppins", sans-serif' }}
                                  >
                                    {adoptionSavingStates[post._id] ? (
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
                                <h2 className="text-xl font-bold text-[#6b493d] mb-2">{post.name}</h2>
                                <p className="text-[#6b493d] mb-1"><span className="font-semibold">Age:</span> {post.age} years</p>
                                <p className="text-[#6b493d] mb-1"><span className="font-semibold">Type:</span> {post.petType}</p>
                                {post.breed && (
                                  <p className="text-[#6b493d] mb-1"><span className="font-semibold">Breed:</span> {post.breed}</p>
                                )}
                                
                                {/* Health Status Badges - Only show if any health info exists */}
                                {(post.vaccinated || post.neuteredSpayed) && (
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    {post.vaccinated && (
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                        post.vaccinated === 'Yes' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                                      }`}>
                                        {post.vaccinated === 'Yes' ? '✓ Vaccinated' : '✗ Not Vaccinated'}
                                      </span>
                                    )}
                                    {post.neuteredSpayed && (
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                        post.neuteredSpayed === 'Yes' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-orange-100 text-orange-800 border border-orange-200'
                                      }`}>
                                        {post.neuteredSpayed === 'Yes' ? '✓ Neutered/Spayed' : '✗ Not Neutered/Spayed'}
                                      </span>
                                    )}
                                  </div>
                                )}
                                
                                <p className="text-[#6b493d] mb-4 italic">{post.description}</p>
                                <p className="text-sm text-gray-500 mb-4">
                                  Posted by: {post.userId?.username || 'Anonymous'}
                                </p>
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Status:</label>
                                  <select
                                    value={post.status}
                                    onChange={(e) => handleStatusChange(post._id, e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-md text-sm font-medium ${
                                      post.status === 'available' ? 'border-green-300 bg-green-50 text-green-700' : 
                                      post.status === 'pending' ? 'border-yellow-300 bg-yellow-50 text-yellow-700' : 
                                      'border-red-300 bg-red-50 text-red-700'
                                    }`}
                                  >
                                    <option value="available">Available</option>
                                    <option value="adopted">Adopted</option>
                                  </select>
                                </div>
                                <p className="text-[#6b493d] mb-1"><span className="font-semibold">Location:</span> {post.location || 'Location not specified'}</p>
                                {post.status === 'adopted' && (
                                  <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-md">
                                    <p className="text-green-700 font-medium">This pet has been adopted!</p>
                                  </div>
                                )}
                                <div className="flex justify-end space-x-3">
                                  <button
                                    onClick={() => handleEditAdoption(post)}
                                    className="p-2 hover:bg-[#6b493d]/10 rounded-full transition-colors"
                                  >
                                    <span className="h-5 w-5 text-[#6b493d]">✎</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAdoption(post._id)}
                                    className="p-2 hover:bg-[#6b493d]/10 rounded-full transition-colors"
                                  >
                                    <span className="h-5 w-5 text-[#6b493d]">🗑️</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          {/* Requests Summary */}
                          {post.requests && post.requests.length > 0 && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-700 font-medium">
                                    {post.requests.length} adoption request{post.requests.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleViewRequests(post)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                                >
                                  View Requests
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}
            {currentView === 'myposts' && (
              <section className="min-h-screen py-4">
                <div className="max-w-6xl mx-auto px-2 md:px-4">
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
                        <div key={post._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col w-full max-w-full">
                          <div className="relative group">
                            <img 
                              src={post.imageUrl} 
                              alt="Pet" 
                              className="w-full h-60 object-cover rounded-t-2xl transition-transform duration-300 hover:scale-105" 
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#6b493d]/40 to-transparent rounded-t-2xl" />
                          </div>
                          <div className="p-4 md:p-6 flex flex-col justify-between w-full max-w-full">
                            {editingPost === post._id ? (
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[#6b493d] mb-4 border-b border-[#6b493d]/20 pb-2">
                                  Edit Post Caption
                                </h3>
                                <textarea
                                  value={editCaption}
                                  onChange={(e) => setEditCaption(e.target.value)}
                                  className="w-full rounded-lg border-[#c9a280] focus:border-[#6b493d] focus:ring-[#6b493d] text-[#6b493d]"
                                  rows={3}
                                  style={{ fontFamily: '"Poppins", sans-serif' }}
                                />
                                <div className="flex justify-end space-x-3">
                                  <button 
                                    onClick={() => setEditingPost(null)}
                                    className="p-2 hover:bg-[#6b493d]/10 rounded-full transition-colors"
                                    disabled={postSavingStates[post._id]}
                                  >
                                    <span className="h-5 w-5 text-[#6b493d]">✕</span>
                                  </button>
                                  <button
                                    onClick={() => handleSaveEditPost(post._id)}
                                    disabled={postSavingStates[post._id]}
                                    className="px-4 py-2 bg-[#6b493d] text-white rounded-lg hover:bg-[#5a3d32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
                              <div className="flex flex-col justify-between">
                                <div>
                                  <p 
                                    className="text-[#6b493d] mb-4 italic text-lg leading-relaxed break-words"
                                    style={{ fontFamily: '"Poppins", sans-serif' }}
                                  >
                                    &quot;{post.caption}&quot;
                                  </p>
                                </div>
                                <div className="flex items-center justify-between mt-4 flex-wrap gap-y-2">
                                  <div className="flex items-center space-x-4 text-[#6b493d]/80">
                                    <div className="flex items-center space-x-1">
                                      <span>❤️</span>
                                      <span>{post.likes.length}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <span>💬</span>
                                      <span>{post.comments.length}</span>
                                    </div>
                                  </div>
                                  <div className="flex space-x-3">
                                    <button
                                      onClick={() => handleEditPost(post)}
                                      className="p-2 hover:bg-[#6b493d]/10 rounded-full transition-colors"
                                    >
                                      <span className="h-5 w-5 text-[#6b493d]">✎</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeletePost(post._id)}
                                      className="p-2 hover:bg-[#6b493d]/10 rounded-full transition-colors"
                                    >
                                      <span className="h-5 w-5 text-[#6b493d]">🗑️</span>
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => toggleComments(post._id)}
                                    className="text-[#6b493d] hover:underline ml-4 whitespace-nowrap"
                                  >
                                    {expandedComments[post._id] ? "Hide Comments" : "View Comments"}
                                  </button>
                                </div>
                                {expandedComments[post._id] && (
                                  <div className="mt-4 space-y-4 w-full max-w-full overflow-x-auto px-1 md:px-0">
                                    {post.comments.length > 0 ? (
                                      post.comments.map((comment) => (
                                        <div key={comment._id} className="bg-[#f5f3ed] p-3 md:p-4 rounded-lg w-full max-w-full break-words">
                                          <p className="text-[#6b493d] font-medium break-words">
                                            {comment.userId?.username || "Unknown User"}
                                          </p>
                                          <p className="text-[#6b493d]/80 break-words">{comment.content}</p>
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
                        </div>
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
            if (effectiveUser?.id) {
              fetchUserAdoptions(effectiveUser.id);
            }
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;