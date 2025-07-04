import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import { AdoptionProvider } from './context/AdoptionContext'; // Import AdoptionProvider
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
import AdoptionHistory from './Main/AdoptionHistory';
import FullTeamPage from './Main/FullTeamPage'; // Import FullTeamPage component
import AdminDashboard from './Main/AdminDashboard';
import AdminManageUsers from './Main/AdminManageUsers';
import { useEffect, useState } from 'react';
import { ADMIN_BASE_URL, AUTH_BASE_URL } from './config';
import AdminDashboardLayout from './Main/AdminDashboardLayout';
import ResetPassword from './Main/ResetPassword';
import AdminAdoptions from './Main/AdminAdoptions';
import AdminUserAdoptions from './Main/AdminUserAdoptions';

// Admin dashboard routes with shared layout and state
const AdminDashboardRoutes = () => {
  const [vets, setVets] = useState([]);
  const [users, setUsers] = useState([]);
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
    fetch(`${ADMIN_BASE_URL}/users`, {
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
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch users');
        setLoading(false);
      });
    // eslint-disable-next-line
  }, [navigate]);

  const fetchUserStats = async (userId) => {
    if (userStats[userId]) return; // Already fetched
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
    } catch {}
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
            admin={admin}
            onSignOut={handleSignOut}
          />
        } />
        <Route path="manage-users" element={
          <AdminManageUsers
            vets={vets}
            users={users}
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
      <Route path="/ngo" element={<NGO />} />
      <Route path="/faq" element={<Faq />} />
      <Route path="/createpost" element={<CreatePost />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/adoption" element={<AdoptionPage />} />
      <Route path="/my-adoptions" element={<MyAdoptions />} />
      <Route path="/create-adoption" element={<CreateAdoptionAdForm />} />
      <Route path="/adoptionhistory" element={<AdoptionHistory/>} />
      <Route path="/verify-code" element={<VerifyCode />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/profile" element={<Createprofile />} />
      <Route path="/my-posts" element={<MyPosts />} />
      <Route path="/team" element={<FullTeamPage />} />
      <Route path="/admin-dashboard/*" element={<AdminDashboardRoutes />} />
      <Route path="/verify-registration" element={<VerifyRegistration />} />
    </Route>
  )
);

const AppWithProviders = () => (
  <AuthProvider>
    <AdoptionProvider>
      <RouterProvider router={router} />
    </AdoptionProvider>
  </AuthProvider>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithProviders />
  </StrictMode>
);