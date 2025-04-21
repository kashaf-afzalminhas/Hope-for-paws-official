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
import ForgotPassword from './Main/ForgotPass';
import VerifyCode from './Main/VerifyCode';
import Createprofile from './Main/CreateProfileU';
import CreatePost from './Main/CreatePost';
import MyPosts from './Main/MyPosts';
import VerifyRegistration from './Main/VerifyRegistration';
import AdoptionPage from './Main/AdoptionPage';
import CreateAdoptionAdForm from './Main/AdoptionForm';
import MyAdoptions from './Main/MyAdoptions';
import AdoptionHistory from './Main/AdoptionHistory';

// Define your routes
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
      <Route path="/forgotpass" element={<ForgotPassword />} />
      <Route path="/verify-code" element={<VerifyCode />} />
      <Route path="/profile" element={<Createprofile />} />
      <Route path="/my-posts" element={<MyPosts />} />
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


// Render the app
// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     {/* Wrap your app in AuthProvider and AdoptionProvider */}
//     <AuthProvider>
//       <AdoptionProvider>
//         <RouterProvider router={router} />
//       </AdoptionProvider>
//     </AuthProvider>
//   </StrictMode>
// Render the app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithProviders />
  </StrictMode>
);