import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaEdit, FaLock, FaListAlt, FaHistory, FaSignOutAlt, FaBars, FaTimes, FaChevronLeft } from 'react-icons/fa';
import { MdPets  } from 'react-icons/md';
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
  const [currentView, setCurrentView] = useState('profile');
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
        userType: userData.userType,
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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

  const profileLinks = [
    { name: 'View Profile', view: 'profile', icon: <FaUserCircle /> },
    { name: 'Edit Profile', view: 'edit', icon: <FaEdit /> },
    { name: 'Security Settings', view: 'security', icon: <FaLock /> },
    { name: 'My Posts', path: '/my-posts', external: true, icon: <FaListAlt /> },
    { name: 'My Adoptions', path: '/my-adoptions', external: true, icon: < MdPets/> },
    { name: 'Adoption History', path: '/adoptionhistory', external: true, icon: <FaHistory /> },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const handleExternalNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
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
              <div className="w-20 h-20 rounded-full bg-[#6b493d] text-white flex items-center justify-center text-3xl font-bold mx-auto mb-3">
                {profile.name ? profile.name[0].toUpperCase() : <FaUserCircle />}
              </div>
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
                          className={`flex items-center w-full px-4 py-3 border-b border-gray-100 ${
                            currentView === link.view ? 'bg-[#6b493d] text-white' : 'text-[#6b493d] hover:bg-[#F8F4ED]'
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
                    onClick={() => setCurrentView(link.view)}
                    className={`flex items-center w-full p-3 border-b border-gray-100 text-left ${
                      currentView === link.view ? 'bg-[#6b493d] text-white' : 'text-[#6b493d] hover:bg-[#F8F4ED]'
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
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input 
                        type="tel" 
                        name="phone"
                        value={profile.phone}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input 
                        type="text" 
                        name="city"
                        value={profile.city}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">About Me</label>
                    <textarea 
                      name="about"
                      value={profile.about}
                      onChange={handleProfileChange}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Tell us a bit about yourself..."
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-between">
                    <button 
                      type="button"
                      onClick={() => setCurrentView('profile')}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-md"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="bg-[#6b493d] hover:bg-[#57392f] text-white font-medium py-2 px-6 rounded-md"
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
                
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-medium mb-4 text-[#6b493d]">Account Security</h3>
                  
                  <div className="bg-gray-50 p-4 rounded mb-4">
                    <div className="flex items-start">
                      <div className="mr-4 text-[#6b493d]">
                        <FaLock size={24} />
                      </div>
                      <div>
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-gray-600 text-sm mt-1">Add an extra layer of security to your account</p>
                        <button className="mt-2 bg-[#a07855] hover:bg-[#866446] text-white text-sm py-1 px-3 rounded">
                          Set Up
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="flex items-start">
                      <div className="mr-4 text-red-500">
                        <FaSignOutAlt size={24} />
                      </div>
                      <div>
                        <h4 className="font-medium">Sign Out All Devices</h4>
                        <p className="text-gray-600 text-sm mt-1">Log out from all devices where you're currently signed in</p>
                        <button className="mt-2 bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded">
                          Sign Out All
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;