import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdoptionProvider } from './context/AdoptionContext';
import { NotificationProvider } from './context/NotificationContext';
import { MessageProvider } from './context/MessageContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthGuardProvider } from './Components/AuthGuard';
import { createBrowserRouter, createRoutesFromElements, Route, useNavigate, Routes } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Import all your routes
import Postpages from './Main/Postnew.jsx';
import Home from './Components/Home';
import ContactUs from './Main/ContactUs';
import SignIn from './Main/SignIn';
import SignUp from './Main/SignUp';
import Faq from './Components/Faq';
import NGO from './Components/NGO';
import Clinics from './Components/Clinics';
import VerifyCode from './Main/VerifyCode';
import Createprofile from './Main/CreateProfileU';
import CreatePost from './Main/CreatePost';
import MyPosts from './Main/MyPosts';
import VerifyRegistration from './Main/VerifyRegistration';
import AdoptionPage from './Main/AdoptionPage';
import CreateAdoptionAdForm from './Main/AdoptionForm';
import MyAdoptions from './Main/MyAdoptions';
import AdoptionDetail from './Main/AdoptionDetail';
import AdoptionHistory from './Main/AdoptionHistory';
import FullTeamPage from './Main/FullTeamPage';
import AdminDashboard from './admin/AdminDashboard.jsx';
import AdminManageUsers from './admin/AdminManageUsers';
import { useEffect, useState } from 'react';
import { ADMIN_BASE_URL, AUTH_BASE_URL } from './config';
import AdminDashboardLayout from './admin/AdminDashboardLayout';
import ResetPassword from './Main/ResetPassword';
import AdminAdoptions from './admin/AdminAdoptions';
import AdminUserAdoptions from './admin/AdminUserAdoptions';
import NotificationsPage from './Main/NotificationsPage';
import PostDetail from './Main/PostDetail';
import AdminPosts from './admin/AdminPosts';
import AdminUserPosts from './admin/AdminUserPosts';
import AdminComments from './admin/AdminComments';
import AdminUserComments from './admin/AdminUserComments';
import AdminPostComments from './admin/AdminPostComments';
import AdminAdoptionRequests from './admin/AdminAdoptionRequests';
import AdminUserAdoptionRequests from './admin/AdminUserAdoptionRequests.jsx';
import ReportedItems from './admin/ReportedItems.jsx';
import SellerAnalyticsDashboard from './Components/SellerAnalyticsDashboard';

// ✅ MERGED IMPORTS (Both Seller and Buyer/Admin)

import Marketplace from './marketplace/Marketplace.jsx';
import ProductDetails from './marketplace/ProductDetails.jsx';
import Cart from './marketplace/Cart.jsx';
import Checkout from './marketplace/Checkout.jsx';
import Wishlist from './marketplace/Wishlist.jsx';
import BuyerOrders from './marketplace/BuyerOrders.jsx';
import SellerOrders from './marketplace/SellerOrders.jsx';
import ProtectedRoute from './Components/ProtectedRoute.jsx';
import AdminSellerRequests from './admin/AdminSellerRequests.jsx';
import AdminSellerDetail from './admin/AdminSellerDetail.jsx';
import ChatPage from './Main/Chat.jsx';
import PublicProfilePage from './Main/PublicProfilePage';
import SellerOnboarding from './Main/SellerOnboarding';
import SellerDashboard from './Main/SellerDashboard';


// Admin dashboard routes with shared layout and state
const AdminDashboardRoutes = () => {
  const [vets, setVets] = useState([]);
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!admin || !admin.isAdmin) {
      navigate('/');
      return;
    }
    // Use the new bulk API endpoint
    fetch(`${ADMIN_BASE_URL}/users-with-stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          navigate('/signin');
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        setVets(data.veterinarians || []);
        setUsers(data.regularUsers || []);
        setSellers(data.sellers || []);
        // Set all user stats at once
        if (data.userStats) {
          setUserStats(data.userStats);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch users');
        setLoading(false);
      });
    // eslint-disable-next-line
  }, [navigate]);

  const fetchUserStats = async (userId, preFetchedStats = null) => {
    // If stats are already loaded, don't fetch again
    if (userStats[userId] && !preFetchedStats) return;

    // If pre-fetched stats are provided, use them
    if (preFetchedStats) {
      setUserStats(prev => ({ ...prev, [userId]: preFetchedStats }));
      return;
    }

    // Fallback to individual API call if needed
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`${ADMIN_BASE_URL}/user-stats/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/signin');
        return;
      }
      const data = await res.json();
      setUserStats(prev => ({ ...prev, [userId]: data }));
    } catch {
      setUserStats(prev => ({ ...prev, [userId]: { error: 'Failed to fetch stats' } }));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user and all their data?')) return;
    setDeleting(userId);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`${ADMIN_BASE_URL}/user/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/signin');
        return;
      }
      setVets(vets => vets.filter(u => u._id !== userId));
      setUsers(users => users.filter(u => u._id !== userId));
      setDeleting(null);
    } catch {
      setDeleting(null);
      alert('Failed to delete user');
    }
  };

  const handleSignOut = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await fetch(`${AUTH_BASE_URL}/signout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
    } catch (error) {
      console.error('Error during signout:', error);
    }
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    window.location.href = '/signin';
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <AdminDashboardLayout admin={admin} onSignOut={handleSignOut}>
      <Routes>
        <Route path="" element={
          <AdminDashboard
            vets={vets}
            users={users}
            sellers={sellers}
            admin={admin}
            onSignOut={handleSignOut}
          />
        } />
        <Route path="manage-users" element={
          <AdminManageUsers
            vets={vets}
            users={users}
            sellers={sellers}
            userStats={userStats}
            fetchUserStats={fetchUserStats}
            handleDeleteUser={handleDeleteUser}
            deleting={deleting}
            search={search}
            setSearch={setSearch}
          />
        } />
        <Route path="adoptions" element={<AdminAdoptions />} />
        <Route path="adoptions/user/:userId" element={<AdminUserAdoptions />} />
        <Route path="adoption-requests" element={<AdminAdoptionRequests />} />
        <Route path="adoption-requests/user/:userId" element={<AdminUserAdoptionRequests />} />
        <Route path="posts" element={<AdminPosts />} />
        <Route path="posts/user/:userId" element={<AdminUserPosts />} />
        <Route path="comments" element={<AdminComments />} />
        <Route path="comments/user/:userId" element={<AdminUserComments />} />
        <Route path="comments/post/:postId" element={<AdminPostComments />} />
        <Route path="seller-requests" element={<AdminSellerRequests />} />
        <Route path="seller-request/:id" element={<AdminSellerDetail />} />
        <Route path="reported-items" element={<ReportedItems />} />
      </Routes>
    </AdminDashboardLayout>
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route path="" element={<Home />} />
      <Route path="/contactus" element={<ContactUs />} />
      <Route path="/clinics" element={<Clinics />} />
      <Route path="/posts" element={<Postpages />} />
      <Route path="/posts/:id" element={<PostDetail />} />
      <Route path="/ngo" element={<NGO />} />
      <Route path="/faq" element={<Faq />} />
      <Route path="/createpost" element={<CreatePost />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/adoption" element={<AdoptionPage />} />
      <Route path="/adoption/:id" element={<AdoptionDetail />} />
      <Route path="/my-adoptions" element={<MyAdoptions />} />
      <Route path="/create-adoption" element={<CreateAdoptionAdForm />} />
      <Route path="/adoptionhistory" element={<AdoptionHistory />} />
      <Route path="/verify-code" element={<VerifyCode />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/profile" element={<Createprofile />} />
      <Route path="/my-posts" element={<MyPosts />} />
      <Route path="/team" element={<FullTeamPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/admin-dashboard/*" element={<AdminDashboardRoutes />} />
      <Route path="/verify-registration" element={<VerifyRegistration />} />
      <Route path="chat/:recipientId?" element={<ChatPage />} />
      <Route path="/profile/public/:userId" element={<PublicProfilePage />} />
      
      {/* ✅ Seller Routes (from bi branch) */}
      <Route path="/seller/onboard" element={<SellerOnboarding />} />
      <Route path="/seller/dashboard" element={<ProtectedRoute allowedRoles={['seller']}><SellerDashboard /></ProtectedRoute>} />
      <Route path="/seller/orders" element={<ProtectedRoute allowedRoles={['seller']}><SellerOrders/></ProtectedRoute>} />
      <Route path="/seller/analytics" element={<ProtectedRoute allowedRoles={['seller']}><SellerAnalyticsDashboard /></ProtectedRoute>} />
      {/* Deprecated Seller Routes removed */}

      {/* ✅ Marketplace Routes — browse public, actions require auth */}
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/product/:id" element={<ProductDetails />} />
      <Route path="/cart" element={<ProtectedRoute allowedRoles={['buyer', 'vet']}><Cart /></ProtectedRoute>} />
      <Route path="/wishlist" element={<ProtectedRoute allowedRoles={['buyer', 'vet']}><Wishlist /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute allowedRoles={['buyer', 'vet']}><Checkout /></ProtectedRoute>} />
      <Route path="/my-orders" element={<ProtectedRoute allowedRoles={['buyer', 'vet']}><BuyerOrders /></ProtectedRoute>} />
    </Route>
  )
);

const AppWithProviders = () => (
  <AuthProvider>
    <WishlistProvider>
      <CartProvider>
        <AdoptionProvider>
          <NotificationProvider>
            <MessageProvider>
              <AuthGuardProvider>
                <RouterProvider router={router} />
              </AuthGuardProvider>
            </MessageProvider>
          </NotificationProvider>
        </AdoptionProvider>
      </CartProvider>
    </WishlistProvider>
  </AuthProvider>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithProviders />
  </StrictMode>
);