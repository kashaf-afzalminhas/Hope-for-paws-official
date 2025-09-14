import React, { useState } from 'react';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AUTH_BASE_URL } from './config';
//import { DisclaimerBanner } from './Components/DisclaimerBanner';
import RandomPopups from './Components/RandomPopups';
import RabiesAwarenessModal from './Components/RabiesAwarenessModal';
import ImagePopupModal from './Components/ImagePopupModal';
import PhoneVerificationModal from './Components/PhoneVerificationModal';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [justVerifiedPhone, setJustVerifiedPhone] = useState(false);

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

  // Check phone verification for authenticated users
  React.useEffect(() => {
    const checkPhoneVerification = () => {
      // Skip phone verification check for certain routes
      const skipRoutes = ['/signin', '/signup', '/verify-registration', '/verify-code', '/reset-password', '/contactus'];
      const isSkipRoute = skipRoutes.some(route => location.pathname === route);
      
      // Check if user just verified phone (prevent showing modal again immediately)
      const recentlyVerified = localStorage.getItem('phoneJustVerified');
      if (recentlyVerified) {
        localStorage.removeItem('phoneJustVerified');
        setJustVerifiedPhone(true);
        
        // Reset the flag after 3 seconds
        setTimeout(() => {
          setJustVerifiedPhone(false);
        }, 3000);
        return;
      }
      
      if (user && !isSkipRoute && !user.isAdmin && !justVerifiedPhone) {
        // Check if user needs phone verification
        if (!user.phone || !user.phoneVerified) {
          setShowPhoneVerification(true);
        }
      }
    };

    checkPhoneVerification();
  }, [user, location.pathname, justVerifiedPhone]);

  const handlePhoneVerified = async () => {
    try {
      // Set flag to prevent modal from showing again
      localStorage.setItem('phoneJustVerified', 'true');
      
      // Fetch updated user data from backend
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${AUTH_BASE_URL}/user/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const updatedUser = data.user;
        
        // Update localStorage with fresh user data
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setShowPhoneVerification(false);
        
        // Force a page reload to update the user state
        window.location.reload();
      } else {
        // Fallback: update localStorage and reload
        const updatedUser = { ...user, phoneVerified: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setShowPhoneVerification(false);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error fetching updated user data:', error);
      // Fallback: update localStorage and reload
      const updatedUser = { ...user, phoneVerified: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setShowPhoneVerification(false);
      window.location.reload();
    }
  };

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
        <ImagePopupModal />
        <RabiesAwarenessModal />
        <RandomPopups />
        <Navbar handleSignOut={handleSignOut} />
        <div className="flex-1">
        <Outlet />
        </div>
        {!hideFooter && <Footer />}
        </div>
        <PhoneVerificationModal
          isOpen={showPhoneVerification}
          onClose={() => setShowPhoneVerification(false)}
          onVerified={handlePhoneVerified}
          user={user}
          isExistingUser={user && !user.phone}
        />
    </>
  );
}

export default App;
