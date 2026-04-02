// import React, { useState } from 'react';
// import { useCart } from '../context/CartContext';
// import { FaShoppingCart, FaUser, FaPaw, FaTimes } from 'react-icons/fa';
// import { NavLink } from 'react-router-dom';
// import NotificationIcon from './NotificationIcon';
// import { useMessages } from '../context/MessageContext';
// import { useAuth } from '../context/AuthContext';

// const Navbar = ({ handleSignOut }) => {
//   const { user } = useAuth(); 
//   const { unreadCount } = useMessages();
//   const { cartItems } = useCart(
//   const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

//   const [isHovered, setIsHovered] = useState(false);
//   const [isProfileOpen, setIsProfileOpen] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//   const handleMouseEnter = () => setIsHovered(true);
//   const handleMouseLeave = () => setIsHovered(false);

//   const toggleMobileMenu = () => {
// <<<<<<< HEAD
//     setIsMobileMenuOpen(prev => !prev);
// =======
//     setIsMobileMenuOpen((prevState) => !prevState);
// >>>>>>> origin/bi
//     setIsProfileOpen(false);
//   };

//   const toggleProfile = () => setIsProfileOpen(prev => !prev);
//   const closeMobileMenu = () => {
//     setIsMobileMenuOpen(false);
//     setIsProfileOpen(false);
//   };

//   const activeStyle = "text-black font-bold";

//   return (
//     <>
//       <nav className="bg-[#F8F4ED] p-3 sm:p-4 lg:p-6 flex flex-wrap justify-between items-center relative shadow-md">
//         {/* Logo */}
//         <div className="flex items-center space-x-1 md:space-x-2">
//           <FaPaw className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#a07855]" />
//           <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#a07855]">HopeForPaws</span>
//         </div>

//         {/* Mobile Right Section */}
//         <div className="md:hidden flex items-center space-x-2 sm:space-x-3">
//           {user ? (
//             <div className="relative flex items-center space-x-2">
//               <span className="text-[#a07855] font-medium text-xs sm:text-sm hidden sm:block">{user.username}</span>
//               <NotificationIcon />
//               <NavLink to="/cart" className="relative">
//                 <FaShoppingCart className="text-xl sm:text-2xl hover:text-gray-400 cursor-pointer text-[#a07855]" />
//                 {cartCount > 0 && (
//                   <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
//                     {cartCount > 9 ? '9+' : cartCount}
//                   </span>
//                 )}
//               </NavLink>
//               <button onClick={toggleProfile} className="relative">
//                 <FaUser className="text-xl sm:text-2xl text-[#a07855]" />
//               </button>

//               {isProfileOpen && (
//                 <div className="absolute right-0 mt-2 top-full w-48 p-4 bg-white border border-gray-300 rounded-lg shadow-lg text-center z-50">
//                   <div className="flex justify-center mb-4">
//                     <div className="w-12 h-12 rounded-full bg-[#6b493d] text-white flex items-center justify-center text-xl font-bold">
//                       {user.username ? user.username[0].toUpperCase() : <FaUser />}
//                     </div>
//                   </div>
//                   <p className="text-lg font-semibold text-[#6b493d]">Hi, {user.username}!</p>
//                   <button
//                     className="mt-3 w-full py-2 text-sm font-semibold text-[#6b493d] border border-[#6b493d] rounded-lg hover:bg-[#f8f4ed] transition-colors"
//                     onClick={handleSignOut}
//                   >
//                     Sign Out
//                   </button>
//                 </div>
//               )}
//             </div>
//           ) : (
//             <NavLink to="/signin">
//               <FaUser className="text-xl sm:text-2xl hover:text-gray-400 cursor-pointer text-[#a07855]" />
//             </NavLink>
//           )}

//           {/* Mobile Menu Toggle */}
//           <button onClick={toggleMobileMenu} className="text-[#a07855] text-xl sm:text-2xl focus:outline-none ml-2">
//             {isMobileMenuOpen ? '✕' : '☰'}
//           </button>
//         </div>

//         {/* Desktop Navigation */}
//         <div className="hidden md:flex flex-1 items-center justify-between ml-4 lg:ml-8 xl:ml-12">
//           <ul className="flex flex-grow justify-center space-x-4 lg:space-x-6 xl:space-x-8 2xl:space-x-12 mx-4">
// <<<<<<< HEAD
//             {[
//               { to: "/", label: "Home" },
//               { to: "/clinics", label: "Clinics & Vets" },
//               { to: "/ngo", label: "NGO's" },
//               { to: "/adoption", label: "Adoption" },
//               { to: "/posts", label: "Posts" },
//               { to: "/contactus", label: "Contact Us" },
//               { to: "/faq", label: "FAQ's" },
//             ].map(link => (
//               <li key={link.to} className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
//                 <NavLink to={link.to} className={({ isActive }) => isActive ? activeStyle : ''}>
//                   {link.label}
//                 </NavLink>
//               </li>
//             ))}
// =======
//             <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
//               <NavLink to="/" className={({ isActive }) => isActive ? activeStyle : ''}>Home</NavLink>
//             </li>
//             <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
//               <NavLink to="/clinics" className={({ isActive }) => isActive ? activeStyle : ''}>Clinics & Vets</NavLink>
//             </li>
//             <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
//               <NavLink to="/ngo" className={({ isActive }) => isActive ? activeStyle : ''}>NGO's</NavLink>
//             </li>
//             <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
//               <NavLink to="/adoption" className={({ isActive }) => isActive ? activeStyle : ''}>Adoption</NavLink>
//             </li>
//             <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
//               <NavLink to="/posts" className={({ isActive }) => isActive ? activeStyle : ''}>Posts</NavLink>
//             </li>
//             <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
//               <NavLink to="/marketplace" className={({ isActive }) => isActive ? activeStyle : ''}>Product List </NavLink>
//             </li>
//             <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
//               <NavLink to="/contactus" className={({ isActive }) => isActive ? activeStyle : ''}>Contact Us</NavLink>
//             </li>
//             <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
//               <NavLink to="/faq" className={({ isActive }) => isActive ? activeStyle : ''}>FAQ's</NavLink>
//             </li>
            
//             {/* ✅ UPDATED: REMOVED SELLER DASHBOARD LINK FROM HERE */}

// >>>>>>> origin/bi
//             <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
//               <NavLink to="/chat" className={({ isActive }) => isActive ? activeStyle : ''}>
//                 <span className="relative">
//                   Inbox
//                   {unreadCount > 0 && (
//                     <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
//                       {unreadCount > 9 ? '9+' : unreadCount}
//                     </span>
//                   )}
//                 </span>
//               </NavLink>
//             </li>
//             <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
//               <NavLink to="/cart" className={({ isActive }) => isActive ? activeStyle : ''}>
//                 Cart {cartCount > 0 && `(${cartCount})`}
//               </NavLink>
//             </li>
//           </ul>

//           {/* Desktop User Section */}
//           <div className="flex space-x-4 lg:space-x-6 items-center relative min-w-max">
//             {user ? (
//               <>
//                 <span className="text-[#a07855] font-medium hidden lg:inline-block">
//                   Welcome {user.username}
//                 </span>
//                 <NotificationIcon />
//                 <NavLink to="/cart" className="relative">
//                   <FaShoppingCart className="text-2xl hover:text-gray-400 cursor-pointer text-[#a07855]" />
//                   {cartCount > 0 && (
//                     <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
//                       {cartCount > 9 ? '9+' : cartCount}
//                     </span>
//                   )}
//                 </NavLink>
//                 <div
//                   className="relative"
//                   onMouseEnter={handleMouseEnter}
//                   onMouseLeave={handleMouseLeave}
//                 >
//                   <NavLink to="/profile">
//                     <FaUser className="text-2xl hover:text-gray-400 cursor-pointer text-[#a07855]" />
//                   </NavLink>
//                   {isHovered && (
//                     <div className="absolute right-0 mt-3 w-48 p-4 bg-white border border-gray-300 rounded-lg shadow-lg text-center z-50"
//                       onMouseEnter={handleMouseEnter}
//                       onMouseLeave={handleMouseLeave}>
//                       <div className="flex justify-center mb-4">
//                         <div className="w-12 h-12 rounded-full bg-[#6b493d] text-white flex items-center justify-center text-xl font-bold">
//                           {user.username ? user.username[0].toUpperCase() : <FaUser />}
//                         </div>
//                       </div>
//                       <p className="text-lg font-semibold text-[#6b493d]">Hi, {user.username}!</p>
//                       <button
//                         className="mt-3 w-full py-2 text-sm font-semibold text-[#6b493d] border border-[#6b493d] rounded-lg hover:bg-[#f8f4ed] transition-colors"
//                         onClick={handleSignOut}
//                       >
//                         Sign Out
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               </>
//             ) : (
//               <NavLink to="/signin">
//                 <FaUser className="text-2xl hover:text-gray-400 cursor-pointer text-[#a07855]" />
//               </NavLink>
//             )}
//           </div>
//         </div>
//       </nav>

//       {/* Mobile Side Panel */}
//       <div className={`fixed inset-0 z-50 md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
//         <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={closeMobileMenu} />
//         <div className={`absolute right-0 top-0 h-full w-72 sm:w-80 md:w-96 bg-[#F8F4ED] shadow-2xl transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
//           {/* Header */}
//           <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#a07855]">
//             <div className="flex items-center space-x-2">
//               <FaPaw className="text-xl sm:text-2xl text-[#a07855]" />
//               <span className="text-lg sm:text-xl font-bold text-[#a07855]">Menu</span>
//             </div>
//             <button onClick={closeMobileMenu} className="text-[#a07855] hover:text-[#6b493d] transition-colors p-2" aria-label="Close Menu">
//               <FaTimes className="text-xl sm:text-2xl" />
//             </button>
//           </div>

//           {/* Mobile Navigation Links */}
//           <div className="p-4 sm:p-6 overflow-y-auto h-full">
//             <ul className="space-y-2 sm:space-y-4">
// <<<<<<< HEAD
//               {[
//                 { to: "/", label: "Home" },
//                 { to: "/clinics", label: "Clinics & Vets" },
//                 { to: "/ngo", label: "NGO's" },
//                 { to: "/adoption", label: "Adoption" },
//                 { to: "/posts", label: "Posts" },
//                 { to: "/contactus", label: "Contact Us" },
//                 { to: "/faq", label: "FAQ's" },
//                 { to: "/chat", label: "Inbox", badge: unreadCount },
//                 { to: "/cart", label: `Cart${cartCount > 0 ? ` (${cartCount})` : ''}` },
//               ].map(link => (
//                 <li key={link.to}>
//                   <NavLink
//                     to={link.to}
//                     onClick={closeMobileMenu}
//                     className={({ isActive }) =>
//                       `block py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
//                         isActive
//                           ? 'bg-[#a07855] text-white shadow-md'
//                           : 'text-[#a07855] hover:bg-[#e8d5c0] hover:text-[#6b493d]'
//                       }`
//                     }
//                   >
//                     <span className="relative">
//                       {link.label}
//                       {link.badge && link.badge > 0 && (
//                         <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
//                           {link.badge > 9 ? '9+' : link.badge}
//                         </span>
//                       )}
//                     </span>
//                   </NavLink>
//                 </li>
//               ))}
// =======
//               <li>
//                 <NavLink 
//                   to="/" 
//                   onClick={closeMobileMenu} 
//                   className={({ isActive }) => 
//                     `block py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
//                       isActive 
//                         ? 'bg-[#a07855] text-white shadow-md' 
//                         : 'text-[#a07855] hover:bg-[#e8d5c0] hover:text-[#6b493d]'
//                     }`
//                   }
//                 >
//                   Home
//                 </NavLink>
//               </li>
//               <li>
//                 <NavLink 
//                   to="/clinics" 
//                   onClick={closeMobileMenu} 
//                   className={({ isActive }) => 
//                     `block py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
//                       isActive 
//                         ? 'bg-[#a07855] text-white shadow-md' 
//                         : 'text-[#a07855] hover:bg-[#e8d5c0] hover:text-[#6b493d]'
//                     }`
//                   }
//                 >
//                   Clinics & Vets
//                 </NavLink>
//               </li>
//               <li>
//                 <NavLink 
//                   to="/ngo" 
//                   onClick={closeMobileMenu} 
//                   className={({ isActive }) => 
//                     `block py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
//                       isActive 
//                         ? 'bg-[#a07855] text-white shadow-md' 
//                         : 'text-[#a07855] hover:bg-[#e8d5c0] hover:text-[#6b493d]'
//                     }`
//                   }
//                 >
//                   NGO's
//                 </NavLink>
//               </li>
//               <li>
//                 <NavLink 
//                   to="/adoption" 
//                   onClick={closeMobileMenu} 
//                   className={({ isActive }) => 
//                     `block py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
//                       isActive 
//                         ? 'bg-[#a07855] text-white shadow-md' 
//                         : 'text-[#a07855] hover:bg-[#e8d5c0] hover:text-[#6b493d]'
//                     }`
//                   }
//                 >
//                   Adoption
//                 </NavLink>
//               </li>
//               <li>
//                 <NavLink 
//                   to="/posts" 
//                   onClick={closeMobileMenu} 
//                   className={({ isActive }) => 
//                     `block py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
//                       isActive 
//                         ? 'bg-[#a07855] text-white shadow-md' 
//                         : 'text-[#a07855] hover:bg-[#e8d5c0] hover:text-[#6b493d]'
//                     }`
//                   }
//                 >
//                   Posts
//                 </NavLink>
//               </li>
//               <li>
//                 <NavLink 
//                   to="/contactus" 
//                   onClick={closeMobileMenu} 
//                   className={({ isActive }) => 
//                     `block py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
//                       isActive 
//                         ? 'bg-[#a07855] text-white shadow-md' 
//                         : 'text-[#a07855] hover:bg-[#e8d5c0] hover:text-[#6b493d]'
//                     }`
//                   }
//                 >
//                   Contact Us
//                 </NavLink>
//               </li>
//               <li>
//                 <NavLink 
//                   to="/faq" 
//                   onClick={closeMobileMenu} 
//                   className={({ isActive }) => 
//                     `block py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
//                       isActive 
//                         ? 'bg-[#a07855] text-white shadow-md' 
//                         : 'text-[#a07855] hover:bg-[#e8d5c0] hover:text-[#6b493d]'
//                     }`
//                   }
//                 >
//                   FAQ's
//                 </NavLink>
//               </li>
              
//               {/* ✅ REMOVED SELLER DASHBOARD LINK FROM MOBILE MENU TOO */}

//               <li>
//                 <NavLink 
//                   to="/chat" 
//                   onClick={closeMobileMenu} 
//                   className={({ isActive }) => 
//                     `block py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
//                       isActive 
//                         ? 'bg-[#a07855] text-white shadow-md' 
//                         : 'text-[#a07855] hover:bg-[#e8d5c0] hover:text-[#6b493d]'
//                     }`
//                   }
//                 >
//                   Inbox
//                 </NavLink>
//               </li>
// >>>>>>> origin/bi
//             </ul>

//             {/* Mobile User Section */}
//             <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#a07855]">
//               {user ? (
//                 <div className="space-y-3 sm:space-y-4">
//                   <NavLink to="/profile" onClick={closeMobileMenu}>
//                     <div className="flex items-center space-x-3 p-3 sm:p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
//                       <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#6b493d] text-white flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0">
//                         {user.username ? user.username[0].toUpperCase() : <FaUser />}
//                       </div>
//                       <div className="min-w-0 flex-1">
//                         <p className="font-semibold text-[#6b493d] text-sm sm:text-base truncate">Hi, {user.username}!</p>
//                         <p className="text-xs sm:text-sm text-gray-600">Welcome back</p>
//                       </div>
//                     </div>
//                   </NavLink>
//                   <button
//                     onClick={() => { handleSignOut(); closeMobileMenu(); }}
//                     className="w-full py-2 sm:py-3 px-3 sm:px-4 bg-[#a07855] text-white font-semibold rounded-lg hover:bg-[#6b493d] transition-colors shadow-md text-sm sm:text-base"
//                   >
//                     Sign Out
//                   </button>
//                 </div>
//               ) : (
//                 <NavLink
//                   to="/signin"
//                   onClick={closeMobileMenu}
//                   className="block w-full py-2 sm:py-3 px-3 sm:px-4 bg-[#a07855] text-white font-semibold rounded-lg hover:bg-[#6b493d] transition-colors text-center shadow-md text-sm sm:text-base"
//                 >
//                   Sign In
//                 </NavLink>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Navbar;

import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { FaShoppingCart, FaUser, FaPaw, FaTimes } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import NotificationIcon from './NotificationIcon';
import { useMessages } from '../context/MessageContext';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ handleSignOut }) => {
  const { user } = useAuth(); 
  const { unreadCount } = useMessages();
  const { cartItems } = useCart();
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const [isHovered, setIsHovered] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prevState) => !prevState);
    setIsProfileOpen(false);
  };

  const toggleProfile = () => setIsProfileOpen(prev => !prev);
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  };

  const activeStyle = "text-black font-bold";

  return (
    <>
      <nav className="bg-[#F8F4ED] p-3 sm:p-4 lg:p-6 flex flex-wrap justify-between items-center relative shadow-md">
        {/* Logo */}
        <div className="flex items-center space-x-1 md:space-x-2">
          <FaPaw className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#a07855]" />
          <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#a07855]">HopeForPaws</span>
        </div>

        {/* Mobile Right Section */}
        <div className="md:hidden flex items-center space-x-2 sm:space-x-3">
          {user ? (
            <div className="relative flex items-center space-x-2">
              <span className="text-[#a07855] font-medium text-xs sm:text-sm hidden sm:block">{user.username}</span>
              <NotificationIcon />
              <NavLink to="/cart" className="relative">
                <FaShoppingCart className="text-xl sm:text-2xl hover:text-gray-400 cursor-pointer text-[#a07855]" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </NavLink>
              <button onClick={toggleProfile} className="relative">
                <FaUser className="text-xl sm:text-2xl text-[#a07855]" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 top-full w-48 p-4 bg-white border border-gray-300 rounded-lg shadow-lg text-center z-50">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#6b493d] text-white flex items-center justify-center text-xl font-bold">
                      {user.username ? user.username[0].toUpperCase() : <FaUser />}
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-[#6b493d]">Hi, {user.username}!</p>
                  <button
                    className="mt-3 w-full py-2 text-sm font-semibold text-[#6b493d] border border-[#6b493d] rounded-lg hover:bg-[#f8f4ed] transition-colors"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <NavLink to="/signin">
              <FaUser className="text-xl sm:text-2xl hover:text-gray-400 cursor-pointer text-[#a07855]" />
            </NavLink>
          )}

          {/* Mobile Menu Toggle */}
          <button onClick={toggleMobileMenu} className="text-[#a07855] text-xl sm:text-2xl focus:outline-none ml-2">
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 items-center justify-between ml-4 lg:ml-8 xl:ml-12">
          <ul className="flex flex-grow justify-center space-x-4 lg:space-x-6 xl:space-x-8 2xl:space-x-12 mx-4">
            <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
              <NavLink to="/" className={({ isActive }) => isActive ? activeStyle : ''}>Home</NavLink>
            </li>
            <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
              <NavLink to="/clinics" className={({ isActive }) => isActive ? activeStyle : ''}>Clinics & Vets</NavLink>
            </li>
            <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
              <NavLink to="/ngo" className={({ isActive }) => isActive ? activeStyle : ''}>NGO's</NavLink>
            </li>
            <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
              <NavLink to="/adoption" className={({ isActive }) => isActive ? activeStyle : ''}>Adoption</NavLink>
            </li>
            <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
              <NavLink to="/posts" className={({ isActive }) => isActive ? activeStyle : ''}>Posts</NavLink>
            </li>
            <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
              <NavLink to="/marketplace" className={({ isActive }) => isActive ? activeStyle : ''}>Product List </NavLink>
            </li>
            <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
              <NavLink to="/contactus" className={({ isActive }) => isActive ? activeStyle : ''}>Contact Us</NavLink>
            </li>
            <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
              <NavLink to="/faq" className={({ isActive }) => isActive ? activeStyle : ''}>FAQ's</NavLink>
            </li>
            
            {/* ✅ UPDATED: REMOVED SELLER DASHBOARD LINK FROM HERE */}

            <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
              <NavLink to="/chat" className={({ isActive }) => isActive ? activeStyle : ''}>
                <span className="relative">
                  Inbox
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
              </NavLink>
            </li>
            <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
              <NavLink to="/cart" className={({ isActive }) => isActive ? activeStyle : ''}>
                Cart {cartCount > 0 && `(${cartCount})`}
              </NavLink>
            </li>
          </ul>

          {/* Desktop User Section */}
          <div className="flex space-x-4 lg:space-x-6 items-center relative min-w-max">
            {user ? (
              <>
                <span className="text-[#a07855] font-medium hidden lg:inline-block">
                  Welcome {user.username}
                </span>
                <NotificationIcon />
                <NavLink to="/cart" className="relative">
                  <FaShoppingCart className="text-2xl hover:text-gray-400 cursor-pointer text-[#a07855]" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </NavLink>
                <div
                  className="relative"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <NavLink to="/profile">
                    <FaUser className="text-2xl hover:text-gray-400 cursor-pointer text-[#a07855]" />
                  </NavLink>
                  {isHovered && (
                    <div className="absolute right-0 mt-3 w-48 p-4 bg-white border border-gray-300 rounded-lg shadow-lg text-center z-50"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}>
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-[#6b493d] text-white flex items-center justify-center text-xl font-bold">
                          {user.username ? user.username[0].toUpperCase() : <FaUser />}
                        </div>
                      </div>
                      <p className="text-lg font-semibold text-[#6b493d]">Hi, {user.username}!</p>
                      <button
                        className="mt-3 w-full py-2 text-sm font-semibold text-[#6b493d] border border-[#6b493d] rounded-lg hover:bg-[#f8f4ed] transition-colors"
                        onClick={handleSignOut}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <NavLink to="/signin">
                <FaUser className="text-2xl hover:text-gray-400 cursor-pointer text-[#a07855]" />
              </NavLink>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Side Panel */}
      <div className={`fixed inset-0 z-50 md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={closeMobileMenu} />
        <div className={`absolute right-0 top-0 h-full w-72 sm:w-80 md:w-96 bg-[#F8F4ED] shadow-2xl transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#a07855]">
            <div className="flex items-center space-x-2">
              <FaPaw className="text-xl sm:text-2xl text-[#a07855]" />
              <span className="text-lg sm:text-xl font-bold text-[#a07855]">Menu</span>
            </div>
            <button onClick={closeMobileMenu} className="text-[#a07855] hover:text-[#6b493d] transition-colors p-2" aria-label="Close Menu">
              <FaTimes className="text-xl sm:text-2xl" />
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <div className="p-4 sm:p-6 overflow-y-auto h-full">
            <ul className="space-y-2 sm:space-y-4">
              <li>
                <NavLink 
                  to="/" 
                  onClick={closeMobileMenu} 
                  className={({ isActive }) => 
                    `block py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
                      isActive 
                        ? 'bg-[#a07855] text-white shadow-md' 
                        : 'text-[#a07855] hover:bg-[#e8d5c0] hover:text-[#6b493d]'
                    }`
                  }
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/clinics" 
                  onClick={closeMobileMenu} 
                  className={({ isActive }) => 
                    `block py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
                      isActive 
                        ? 'bg-[#a07855] text-white shadow-md' 
                        : 'text-[#a07855] hover:bg-[#e8d5c0] hover:text-[#6b493d]'
                    }`
                  }
                >
                  Clinics & Vets
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/ngo" 
                  onClick={closeMobileMenu} 
                  className={({ isActive }) => 
                    `block py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
                      isActive 
                        ? 'bg-[#a07855] text-white shadow-md' 
                        : 'text-[#a07855] hover:bg-[#e8d5c0] hover:text-[#6b493d]'
                    }`
                  }
                >
                  NGO's
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/adoption" 
                  onClick={closeMobileMenu} 
                  className={({ isActive }) => 
                    `block py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
                      isActive 
                        ? 'bg-[#a07855] text-white shadow-md' 
                        : 'text-[#a07855] hover:bg-[#e8d5c0] hover:text-[#6b493d]'
                    }`
                  }
                >
                  Adoption
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/posts" 
                  onClick={closeMobileMenu} 
                  className={({ isActive }) => 
                    `block py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
                      isActive 
                        ? 'bg-[#a07855] text-white shadow-md' 
                        : 'text-[#a07855] hover:bg-[#e8d5c0] hover:text-[#6b493d]'
                    }`
                  }
                >
                  Posts
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/contactus" 
                  onClick={closeMobileMenu} 
                  className={({ isActive }) => 
                    `block py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
                      isActive 
                        ? 'bg-[#a07855] text-white shadow-md' 
                        : 'text-[#a07855] hover:bg-[#e8d5c0] hover:text-[#6b493d]'
                    }`
                  }
                >
                  Contact Us
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/faq" 
                  onClick={closeMobileMenu} 
                  className={({ isActive }) => 
                    `block py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
                      isActive 
                        ? 'bg-[#a07855] text-white shadow-md' 
                        : 'text-[#a07855] hover:bg-[#e8d5c0] hover:text-[#6b493d]'
                    }`
                  }
                >
                  FAQ's
                </NavLink>
              </li>
              
              {/* ✅ REMOVED SELLER DASHBOARD LINK FROM MOBILE MENU TOO */}

              <li>
                <NavLink 
                  to="/chat" 
                  onClick={closeMobileMenu} 
                  className={({ isActive }) => 
                    `block py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base ${
                      isActive 
                        ? 'bg-[#a07855] text-white shadow-md' 
                        : 'text-[#a07855] hover:bg-[#e8d5c0] hover:text-[#6b493d]'
                    }`
                  }
                >
                  Inbox
                </NavLink>
              </li>
            </ul>

            {/* Mobile User Section */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#a07855]">
              {user ? (
                <div className="space-y-3 sm:space-y-4">
                  <NavLink to="/profile" onClick={closeMobileMenu}>
                    <div className="flex items-center space-x-3 p-3 sm:p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#6b493d] text-white flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0">
                        {user.username ? user.username[0].toUpperCase() : <FaUser />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#6b493d] text-sm sm:text-base truncate">Hi, {user.username}!</p>
                        <p className="text-xs sm:text-sm text-gray-600">Welcome back</p>
                      </div>
                    </div>
                  </NavLink>
                  <button
                    onClick={() => { handleSignOut(); closeMobileMenu(); }}
                    className="w-full py-2 sm:py-3 px-3 sm:px-4 bg-[#a07855] text-white font-semibold rounded-lg hover:bg-[#6b493d] transition-colors shadow-md text-sm sm:text-base"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/signin"
                  onClick={closeMobileMenu}
                  className="block w-full py-2 sm:py-3 px-3 sm:px-4 bg-[#a07855] text-white font-semibold rounded-lg hover:bg-[#6b493d] transition-colors text-center shadow-md text-sm sm:text-base"
                >
                  Sign In
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;