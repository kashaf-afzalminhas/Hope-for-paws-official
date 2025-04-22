import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaEdit, FaLock, FaListAlt, FaHistory, FaSignOutAlt, FaBars, FaTimes, FaChevronLeft } from 'react-icons/fa';
import { MdAdoptionServices, MdPets } from 'react-icons/md';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AUTH_BASE_URL } from '../config';

const ProfilePage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    about: '',
    userType: '',
    id: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState('profile'); // 'profile', 'edit', 'security'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));

    if (userData) {
      setProfile({
        id: userData.id,
        name: userData.username,
        email: userData.email,
        phone: userData.phone || '',
        city: userData.city || '',
        about: userData.about || '',
        userType: userData.userType
      });
    } else {
      setError('No user data found. Please log in.');
      navigate('/signin');
    }
  }, [navigate]);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { id, phone, city, about } = profile;

    if (!id) {
      setError('Please log in again to update profile');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${AUTH_BASE_URL}/update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, phone, city, about })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        const updatedUser = data.user;

        // Store updated user data
        localStorage.setItem('user', JSON.stringify(updatedUser));
        sessionStorage.setItem('user', JSON.stringify(updatedUser));

        setProfile({
          id: updatedUser.id,
          name: updatedUser.username,
          email: updatedUser.email,
          phone: updatedUser.phone || '',
          city: updatedUser.city || '',
          about: updatedUser.about || '',
          userType: updatedUser.userType
        });

        alert('Profile updated successfully!');
        setCurrentView('profile');
      } else {
        setError(data.message || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error:', error);
      setError('An error occurred while updating the profile.');
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
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${AUTH_BASE_URL}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, currentPassword, newPassword }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        alert('Password changed successfully!');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setCurrentView('profile');
      } else {
        setError(data.error || 'Failed to change password. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error:', error);
      setError('An error occurred while changing the password.');
    }
  };

  const handleSignOut = async () => {
    try {
      const response = await fetch(`${AUTH_BASE_URL}/signout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        navigate('/signin');
      } else {
        alert('Failed to sign out. Please try again.');
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      alert('An error occurred while signing out.');
    }
  };

  // Navigation links with icons for the profile page
  const profileLinks = [
    { name: 'View Profile', view: 'profile', icon: <FaUserCircle className="text-lg md:mr-2" /> },
    { name: 'Edit Profile', view: 'edit', icon: <FaEdit className="text-lg md:mr-2" /> },
    { name: 'Security Settings', view: 'security', icon: <FaLock className="text-lg md:mr-2" /> },
    { name: 'My Posts', path: '/my-posts', external: true, icon: <FaListAlt className="text-lg md:mr-2" /> },
    { name: 'My Adoptions', path: '/my-adoptions', external: true, icon: <MdAdoptionServices className="text-lg md:mr-2" /> },
    { name: 'Adoption History', path: '/adoptionhistory', external: true, icon: <FaHistory className="text-lg md:mr-2" /> },
  ];

  // Main app navigation
  const mainNavigation = [
    { name: 'Home', path: '/' },
    { name: 'Clinics', path: '/clinics' },
    { name: "NGOs", path: '/ngo' },
    { name: 'Adoption', path: '/adoption' },
    { name: 'Posts', path: '/posts' },
  ];

  // Toggle mobile menu dropdown
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    setMobileMenuOpen(false); // Close the menu after selection
  };

  const handleExternalNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false); // Close the menu after navigation
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header/Navbar - Always visible */}
      <header className="bg-[#F8F4ED] text-[#a07855] p-4 shadow-md">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <NavLink to="/" className="flex items-center">
            <FaChevronLeft className="text-xl text-[#6b493d]" />
            <span className="ml-2 text-[#6b493d]">Back</span>
          </NavLink>
          
          <h1 className="text-lg font-bold text-[#6b493d]">My Profile</h1>
          
          <div className="flex items-center">
            <button 
              onClick={handleSignOut} 
              className="flex items-center text-[#a07855] hover:text-[#6b493d]"
            >
              <span className="mr-1 hidden md:inline">Sign Out</span>
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-20 md:pb-4 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:space-x-6">
          {/* Profile Card - Always visible on top */}
          <div className="md:w-1/4 mb-6">
            <div className="bg-[#F8F4ED] rounded-lg shadow p-4 text-center">
              <div className="w-20 h-20 rounded-full bg-[#6b493d] text-white flex items-center justify-center text-3xl font-bold mx-auto mb-3">
                {profile.name ? profile.name[0].toUpperCase() : <FaUserCircle />}
              </div>
              <h3 className="font-bold text-lg text-[#6b493d]">{profile.name}</h3>
              <p className="text-[#a07855] text-sm truncate">{profile.email}</p>
              
              {/* Mobile dropdown menu button */}
              <div className="mt-4 md:hidden">
                <button
                  onClick={toggleMobileMenu}
                  className="w-full flex items-center justify-between bg-[#6b493d] hover:bg-[#57392f] text-white font-medium py-2 px-4 rounded-md"
                >
                  <span>{currentView === 'profile' ? 'View Profile' : 
                         currentView === 'edit' ? 'Edit Profile' : 'Security Settings'}</span>
                  {mobileMenuOpen ? 
                    <FaTimes className="ml-2" /> : 
                    <FaBars className="ml-2" />
                  }
                </button>
                
                {/* Mobile dropdown menu */}
                {mobileMenuOpen && (
                  <div className="absolute z-20 mt-2 w-64 bg-white rounded-md shadow-lg py-1 left-1/2 transform -translate-x-1/2">
                    {profileLinks.map((link, index) => 
                      link.external ? (
                        <button 
                          key={index} 
                          onClick={() => handleExternalNavigation(link.path)}
                          className="flex items-center w-full text-left px-4 py-3 border-b border-gray-100 text-[#6b493d] hover:bg-[#F8F4ED]"
                        >
                          {link.icon}
                          <span className="ml-2">{link.name}</span>
                        </button>
                      ) : (
                        <button
                          key={index}
                          onClick={() => handleViewChange(link.view)}
                          className={`flex items-center w-full text-left px-4 py-3 border-b border-gray-100 ${
                            currentView === link.view 
                              ? 'bg-[#6b493d] text-white font-medium' 
                              : 'text-[#6b493d] hover:bg-[#F8F4ED]'
                          }`}
                        >
                          {link.icon}
                          <span className="ml-2">{link.name}</span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Desktop Navigation Menu - Hidden on mobile */}
            <div className="mt-4 bg-white rounded-lg shadow overflow-hidden hidden md:block">
              {profileLinks.map((link, index) => 
                link.external ? (
                  <NavLink 
                    key={index} 
                    to={link.path}
                    className="flex items-center p-3 border-b border-gray-100 text-[#6b493d] hover:bg-[#F8F4ED]"
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </NavLink>
                ) : (
                  <button
                    key={index}
                    onClick={() => setCurrentView(link.view)}
                    className={`flex items-center w-full p-3 border-b border-gray-100 text-left ${
                      currentView === link.view 
                        ? 'bg-[#6b493d] text-white font-medium' 
                        : 'text-[#6b493d] hover:bg-[#F8F4ED]'
                    }`}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            {currentView === 'security' ? (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <h2 className="text-xl font-bold mb-6 text-[#6b493d]">Change Password</h2>
                <div>
                  <label htmlFor="currentPassword" className="block font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwords.currentPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full p-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full p-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    className="mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full p-2"
                    required
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-[#6b493d] hover:bg-[#57392f] text-white font-medium py-2 px-4 rounded-md"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
                {error && <p className="text-red-500 mt-4">{error}</p>}
              </form>
            ) : currentView === 'edit' ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <h2 className="text-xl font-bold mb-6 text-[#6b493d]">Edit Profile</h2>
                <div>
                  <label htmlFor="name" className="block font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profile.name}
                    className="mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full p-2 bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profile.email}
                    className="mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full p-2 bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block font-medium text-gray-700">
                    Contact No
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    className="mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full p-2"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={profile.city}
                    onChange={handleProfileChange}
                    className="mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full p-2"
                    placeholder="Enter your city"
                  />
                </div>
                <div>
                  <label htmlFor="about" className="block font-medium text-gray-700">
                    About
                  </label>
                  <textarea
                    id="about"
                    name="about"
                    value={profile.about}
                    onChange={handleProfileChange}
                    className="mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full h-24 p-2"
                    placeholder="Tell us about yourself"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-[#6b493d] hover:bg-[#57392f] text-white font-medium py-2 px-4 rounded-md"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
                {error && <p className="text-red-500 mt-4">{error}</p>}
              </form>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-6 text-[#6b493d]">My Profile</h2>
                <div>
                  <label className="block font-medium text-gray-700">Name</label>
                  <p className="mt-1 border border-gray-300 rounded-md shadow-sm block w-full p-2 bg-gray-50">
                    {profile.name}
                  </p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Email</label>
                  <p className="mt-1 border border-gray-300 rounded-md shadow-sm block w-full p-2 bg-gray-50">
                    {profile.email}
                  </p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Contact No</label>
                  <p className="mt-1 border border-gray-300 rounded-md shadow-sm block w-full p-2 bg-gray-50">
                    {profile.phone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">City</label>
                  <p className="mt-1 border border-gray-300 rounded-md shadow-sm block w-full p-2 bg-gray-50">
                    {profile.city || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">About</label>
                  <p className="mt-1 border border-gray-300 rounded-md shadow-sm block w-full p-2 bg-gray-50 min-h-[6rem]">
                    {profile.about || 'No information provided'}
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => setCurrentView('edit')}
                    className="w-full bg-[#6b493d] hover:bg-[#57392f] text-white font-medium py-2 px-4 rounded-md"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 w-full bg-[#F8F4ED] shadow-lg z-10 md:hidden">
        <div className="flex justify-around items-center p-3">
          {mainNavigation.map((item, index) => (
            <NavLink 
              key={index} 
              to={item.path}
              className={({ isActive }) => 
                `flex flex-col items-center text-xs ${isActive ? 'text-[#6b493d] font-bold' : 'text-[#a07855]'}`
              }
            >
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      
      {/* Overlay when mobile menu is open */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-10"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default ProfilePage;