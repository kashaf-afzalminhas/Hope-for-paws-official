import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaArrowLeft, FaPaw } from 'react-icons/fa';
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
      // Replace with your actual API base URL
      const API_BASE_URL = `${AUTH_BASE_URL}`;
      
      const response = await fetch(`${API_BASE_URL}/update-profile`, {
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

  // Navigation links for the profile page
  const profileLinks = [
    { name: 'View Profile', view: 'profile', icon: 'profile' },
    { name: 'Edit Profile', view: 'edit', icon: 'edit' },
    { name: 'Security Settings', view: 'security', icon: 'security' },
    { name: 'My Posts', path: '/my-posts', external: true },
    { name: 'My Adoptions', path: '/my-adoptions', external: true },
    { name: 'Adoption History', path: '/adoptionhistory', external: true },
  ];

  // Main app navigation
  const mainNavigation = [
    { name: 'Home', path: '/' },
    { name: 'Clinics & Vets', path: '/clinics' },
    { name: "NGO's", path: '/ngo' },
    { name: 'Adoption', path: '/adoption' },
    { name: 'Posts', path: '/posts' },
    { name: 'Contact Us', path: '/contactus' },
    { name: "FAQ's", path: '/faq' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header/Navbar - Always visible */}
      <header className="bg-[#F8F4ED] text-[#a07855] p-4 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <NavLink to="/" className="flex items-center">
              <FaPaw className="text-2xl text-[#a07855]" />
              <span className="text-xl font-bold ml-2">HopeForPaws</span>
            </NavLink>
          </div>
          <div className="text-lg font-bold">My Profile</div>
          <button onClick={handleSignOut} className="text-[#a07855]">
            Sign Out
          </button>
        </div>
      </header>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 w-full bg-[#F8F4ED] z-20 md:hidden">
        <div className="flex justify-around items-center p-3">
          {mainNavigation.slice(0, 5).map((item, index) => (
            <NavLink 
              key={index} 
              to={item.path}
              className={({ isActive }) => 
                `flex flex-col items-center text-xs text-[#a07855] ${isActive ? 'font-bold' : ''}`
              }
            >
              <span>{item.name.split(' ')[0]}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-20 md:pb-4">
        <div className="flex flex-col md:flex-row md:space-x-6 max-w-6xl mx-auto">
          {/* Profile Navigation Menu - Shown as tabs on mobile */}
          <div className="mb-6 md:mb-0 md:w-1/4">
            <div className="md:sticky md:top-20">
              {/* Profile Card */}
              <div className="p-4 bg-[#F8F4ED] rounded-lg shadow-md mb-4 text-center">
                <div className="w-20 h-20 rounded-full bg-[#6b493d] text-white flex items-center justify-center text-3xl font-bold mx-auto mb-3">
                  {profile.name ? profile.name[0].toUpperCase() : <FaUserCircle />}
                </div>
                <h3 className="font-bold text-lg text-[#6b493d]">{profile.name}</h3>
                <p className="text-[#a07855]">{profile.email}</p>
              </div>
              
              {/* Menu Options - Shown as horizontal tabs on mobile */}
              <div className="flex flex-row overflow-x-auto md:flex-col space-x-2 md:space-x-0 md:space-y-1 mb-4 pb-2">
                {profileLinks.map((link, index) => 
                  link.external ? (
                    <NavLink 
                      key={index} 
                      to={link.path}
                      className="whitespace-nowrap px-4 py-2 rounded-lg text-[#6b493d] hover:bg-[#F8F4ED] md:block text-center"
                    >
                      {link.name}
                    </NavLink>
                  ) : (
                    <button
                      key={index}
                      onClick={() => setCurrentView(link.view)}
                      className={`whitespace-nowrap px-4 py-2 rounded-lg md:block text-center ${
                        currentView === link.view 
                          ? 'bg-[#6b493d] text-white font-medium' 
                          : 'text-[#6b493d] hover:bg-[#F8F4ED]'
                      }`}
                    >
                      {link.name}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-lg shadow-md p-6">
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
                    className="mt-1 border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full p-2"
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
                    className="mt-1 border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full p-2"
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
                    className="mt-1 border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full p-2"
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
                    onChange={handleProfileChange}
                    className="mt-1 border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full p-2"
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
                    className="mt-1 border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full p-2"
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
                    className="mt-1 border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full p-2"
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
                    className="mt-1 border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full p-2"
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
                    className="mt-1 border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full h-24 p-2"
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
    </div>
  );
};

export default ProfilePage;