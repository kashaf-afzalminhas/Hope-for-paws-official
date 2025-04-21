import React, { useState, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
//import Navbar from '../Components/Navbar'
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { isAuthenticated, user } = useAuth(); 
  
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
  const [isEditing, setIsEditing] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false); // New state to toggle security section

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));

    console.log('Fetched user data from localStorage:', userData); // Debugging

if (userData) {

  setProfile({
      id: userData.id,
      name: userData.username, // Ensure consistency with backend field names
      email: userData.email,
      phone: userData.phone ,
      city: userData.city ,
      about: userData.about ,
      userType: userData.userType
  });
} else {
  setError('No user data found. Please log in.');
}
}, [profile.id]);  // ✅ Re-run when profile.id changes
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        const response = await fetch('http://localhost:3000/auth/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, phone, city, about })
        });

        const data = await response.json();
        setLoading(false);

        if (response.ok) {
            const updatedUser = data.user;

            // ✅ Store updated user data in localStorage
            localStorage.setItem('user', JSON.stringify(updatedUser));
            sessionStorage.setItem('user', JSON.stringify(updatedUser));

            // ✅ Immediately update state with new profile data
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
            setIsEditing(false);
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
      const response = await fetch('http://localhost:3000/auth/change-password', {
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
        setShowSecurity(false);
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
      const response = await fetch('http://localhost:3000/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        window.location.href = '/signin';
      } else {
        const errorData = await response.json();
        alert('Failed to sign out. Please try again.');
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      alert('An error occurred while signing out.');
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const toggleSecurity = () => {
    setShowSecurity(!showSecurity);
  };

  return (
    <div className="flex h-screen">
    {/* Sidebar */}
    <div
      className={`bg-[#F8F4ED] text-[#a07855] p-6 w-64 fixed md:static h-full transform md:transform-none transition-transform duration-300 ${
        isMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 left-0 z-50 shadow-lg`}
    >
      {/* Close Button (Visible on Mobile) */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <FaUserCircle size={48} className="mr-4" />
          <li>
            <button
              onClick={() => setIsEditing(false)}
              className="text-xl font-bold hover:text-gray-500"
            >
              My Profile
            </button>
          </li>
        </div>
        <button
          onClick={() => setIsMenuOpen(false)}
          className="text-2xl text-[#6b493d] md:hidden focus:outline-none"
        >
          ✖
        </button>
      </div>
      <ul className="space-y-6 text-lg">
        <li>
          <button onClick={toggleEdit} className="hover:text-gray-500">
            {isEditing ? 'View Profile' : 'Edit Profile'}
          </button>
        </li>
        <li>
          <button onClick={toggleSecurity} className="hover:text-gray-500">
            {showSecurity ? 'Close Security' : 'Security Settings'}
          </button>
        </li>
       
      
        <li>
          <NavLink to="/my-posts" className="hover:text-gray-500">
            My Posts
          </NavLink>
        </li>
        <li>
          <NavLink to="/my-adoptions" className="hover:text-gray-500">
            My Adoptions
          </NavLink>
        </li>
        <li>
          <NavLink to="/adoptionhistory" className="hover:text-gray-500">
            Adoption History
          </NavLink>
        </li>
        <li>
          <button onClick={handleSignOut} className="hover:text-gray-500">
            Sign Out
          </button>
        </li>
      </ul>
    </div>

  {/* Main Content */}
  <div className="p-8 w-full md:w-3/4 ml-auto">
    {/* Mobile Toggle Button */}
    <button
      onClick={() => setIsMenuOpen(true)}
      className="md:hidden text-[#6b493d] text-3xl mb-4 focus:outline-none"
    >
      ☰
    </button>

    {showSecurity ? (
      <form onSubmit={handlePasswordUpdate} className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Change Password</h2>
        <div>
          <label
            htmlFor="currentPassword"
            className="block font-medium text-gray-700"
          >
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={passwords.currentPassword}
            onChange={handlePasswordChange}
            className="border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full"
          />
        </div>
        <div>
          <label
            htmlFor="newPassword"
            className="block font-medium text-gray-700"
          >
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={passwords.newPassword}
            onChange={handlePasswordChange}
            className="border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full"
          />
        </div>
        <div>
          <label
            htmlFor="confirmPassword"
            className="block font-medium text-gray-700"
          >
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={passwords.confirmPassword}
            onChange={handlePasswordChange}
            className="border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-[#6b493d] hover:bg-[#57392f] text-white font-medium py-2 px-4 rounded-md"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    ) : isEditing ? (
      <>
        <h2 className="text-xl md:text-2xl font-bold mb-6">Edit Profile</h2>
        <form className="space-y-4">
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
              className="border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full"
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
              className="border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full"
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
              className="border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full"
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
              className="border-gray-300 rounded-md shadow-sm focus:ring-[#6b493d] focus:border-[#6b493d] block w-full h-24"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveProfile}
              className="bg-[#6b493d] hover:bg-[#57392f] text-white font-medium py-2 px-4 rounded-md"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
          {error && <p className="text-red-500">{error}</p>}
        </form>
      </>
    ) : (
      <>
        <h2 className="text-xl md:text-2xl font-bold mb-6">My Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block font-medium text-gray-700">Name</label>
            <p className="border-gray-300 rounded-md shadow-sm block w-full p-2 bg-gray-100">
              {profile.name}
            </p>
          </div>
          <div>
            <label className="block font-medium text-gray-700">Email</label>
            <p className="border-gray-300 rounded-md shadow-sm block w-full p-2 bg-gray-100">
              {profile.email}
            </p>
          </div>
          <div>
            <label className="block font-medium text-gray-700">Contact No</label>
            <p className="border-gray-300 rounded-md shadow-sm block w-full p-2 bg-gray-100">
              {profile.phone}
            </p>
          </div>
          <div>
            <label className="block font-medium text-gray-700">City</label>
            <p className="border-gray-300 rounded-md shadow-sm block w-full p-2 bg-gray-100">
              {profile.city}
            </p>
          </div>
          <div>
            <label className="block font-medium text-gray-700">About</label>
            <p className="border-gray-300 rounded-md shadow-sm block w-full p-2 bg-gray-100">
              {profile.about}
            </p>
          </div>
        </div>
      </>
    )}
  </div>
</div>


  
          

  );
};

export default ProfilePage;
