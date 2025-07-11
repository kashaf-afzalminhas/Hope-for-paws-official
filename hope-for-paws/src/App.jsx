// import React from 'react';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AUTH_BASE_URL } from './config';
import { DisclaimerBanner } from './Components/DisclaimerBanner';

import React from 'react';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
  // Show admin dashboard layout for all /admin-dashboard* routes
  const isAdminDashboard = location.pathname.startsWith('/admin-dashboard') && user && user.isAdmin;

  // Redirect admin to /admin-dashboard if not already there
  React.useEffect(() => {
    if (user && user.isAdmin && !location.pathname.startsWith('/admin-dashboard')) {
      navigate('/admin-dashboard', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const handleSignOut = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`${AUTH_BASE_URL}/signout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        // Clear all auth-related data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        window.location.href = '/signin';
      } else {
        const errorData = await response.json();
        console.error('Sign out error:', errorData);
        alert('Failed to sign out. Please try again.');
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      alert('An error occurred while signing out.');
    }
  };

  if (isAdminDashboard) {
    return <Outlet />;
  }

  return (
    <>
      <DisclaimerBanner />
      <Navbar handleSignOut={handleSignOut} />
      <Outlet/>
      <Footer/>
    </>
  );
}

export default App;