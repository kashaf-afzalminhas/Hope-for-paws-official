// import { StrictMode } from 'react';
// import { createRoot } from 'react-dom/client';
// import { RouterProvider } from 'react-router-dom';
// import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
// import { AdoptionProvider } from './context/AdoptionContext'; // Import AdoptionProvider
// import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
// import App from './App.jsx';
// import './index.css';

// // Import all your routes
// import Postpages from './Main/Postnew.jsx';
// import Home from './Components/Home';
// import ContactUs from './Main/ContactUs';
// import SignIn from './Main/SignIn';
// import SignUp from './Main/SignUp';
// import Faq from './Components/Faq';
// import NGO from './Components/NGO';
// import Clinics from './Components/Clinics';
// import ForgotPassword from './Main/ForgotPass';
// import VerifyCode from './Main/VerifyCode';
// import Createprofile from './Main/CreateProfileU';
// import CreatePost from './Main/CreatePost';
// import MyPosts from './Main/MyPosts';
// import VerifyRegistration from './Main/VerifyRegistration';
// import AdoptionPage from './Main/AdoptionPage';
// import CreateAdoptionAdForm from './Main/AdoptionForm';
// import MyAdoptions from './Main/MyAdoptions';
// import AdoptionHistory from './Main/AdoptionHistory';
// import FullTeamPage from './Main/FullTeamPage'; // Import FullTeamPage component
// import ChatPage from './Main/Chat.jsx'; // <-- Add this import

// // Define your routes
// const router = createBrowserRouter(
//   createRoutesFromElements(
//     <Route path="/" element={<App />}>
//       <Route path="" element={<Home />} />
//       <Route path="/contactus" element={<ContactUs />} />
//       <Route path="/clinics" element={<Clinics />} />
//       <Route path="/posts" element={<Postpages />} />
//       <Route path="/ngo" element={<NGO />} />
//       <Route path="/faq" element={<Faq />} />
//       <Route path="/createpost" element={<CreatePost />} />
//       <Route path="/signin" element={<SignIn />} />
//       <Route path="/signup" element={<SignUp />} />
//       <Route path="/adoption" element={<AdoptionPage />} />
//       <Route path="/my-adoptions" element={<MyAdoptions />} />
//       <Route path="/create-adoption" element={<CreateAdoptionAdForm />} />
//       <Route path="/adoptionhistory" element={<AdoptionHistory/>} />
//       <Route path="/forgotpass" element={<ForgotPassword />} />
//       <Route path="/verify-code" element={<VerifyCode />} />
//       <Route path="/profile" element={<Createprofile />} />
//       <Route path="/my-posts" element={<MyPosts />} />
//       <Route path="/team" element={<FullTeamPage />} /> {/* Add this line */}
//       <Route path="/verify-registration" element={<VerifyRegistration />} />
//       <Route path="/chat" element={<ChatPage />} /> {/* Add this line for chat */}
//     </Route>
//   )
// );

// const AppWithProviders = () => (
//   <AuthProvider>
//     <AdoptionProvider>
//       <RouterProvider router={router} />
//     </AdoptionProvider>
//   </AuthProvider>
// );

// // Render the app
// createRoot(document.getElementById('root')).render(
//   <AppWithProviders />
// );

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import { AdoptionProvider } from './context/AdoptionContext'; // Import AdoptionProvider
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
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
import FullTeamPage from './Main/FullTeamPage';
import ChatPage from './Main/Chat.jsx';
import PublicProfilePage from './Main/PublicProfilePage';
import AdminDashboard from './Main/AdminDashboard';
import AdminManageUsers from './Main/AdminManageUsers';
import AdminDashboardLayout from './Main/AdminDashboardLayout';
import AdminAdoptions from './Main/AdminAdoptions';
import AdminUserAdoptions from './Main/AdminUserAdoptions';
import ResetPassword from './Main/ResetPassword';

const AdminDashboardRoutes = () => (
  <AdminDashboardLayout>
    <Route path="" element={<AdminDashboard />} />
    <Route path="users" element={<AdminManageUsers />} />
    <Route path="adoptions" element={<AdminAdoptions />} />
    <Route path="user-adoptions/:userId" element={<AdminUserAdoptions />} />
  </AdminDashboardLayout>
);

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
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/profile/public/:userId" element={<PublicProfilePage />} />
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