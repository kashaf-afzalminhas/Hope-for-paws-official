import React from 'react';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AUTH_BASE_URL } from './config';
//import { DisclaimerBanner } from './Components/DisclaimerBanner';
import RandomPopups from './Components/RandomPopups';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));

  // Check for /admin-dashboard layout
  const isAdminDashboard = location.pathname.startsWith('/admin-dashboard') && user && user.isAdmin;

  // Hide footer for specific routes but keep navbar
  const hideFooter = location.pathname === '/chat' || location.pathname.startsWith('/chat/');
  
  // Check if we're on a chat route
  const isChatRoute = location.pathname === '/chat' || location.pathname.startsWith('/chat/');

  // Redirect admin to dashboard if not there
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
    // <div id="app-root" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
    //   <DisclaimerBanner />
    //   <Navbar handleSignOut={handleSignOut} />
    //   <div className="app-content" style={{ flex: 1 }}>
    //     <Outlet/>
    //   </div>
    //   <Footer/>
    // </div>
    <>
      {/* <DisclaimerBanner /> */}
        <div className="min-h-screen flex flex-col">
        <RandomPopups />
        <Navbar handleSignOut={handleSignOut} />
        <div className="flex-1">
        <Outlet />
        </div>
        {!hideFooter && <Footer />}
        </div>
    </>
  );
}

export default App;
