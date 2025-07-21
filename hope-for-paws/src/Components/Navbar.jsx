import React, { useState } from 'react';
import { FaUser, FaPaw } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import NotificationIcon from './NotificationIcon';  

const Navbar = ({ handleSignOut }) => {
  const user = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));

  const [isHovered, setIsHovered] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prevState) => !prevState);
    // Close profile dropdown when menu is toggled
    setIsProfileOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen((prevState) => !prevState);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  };

  // Active link style for both mobile and desktop
  const activeStyle = "text-black font-bold";

  return (
    <nav className="bg-[#F8F4ED] p-4 sm:p-6 flex flex-wrap justify-between items-center relative">
      {/* Logo Section - Reduced size on mobile */}
      <div className="flex items-center space-x-1 md:space-x-2">
        <FaPaw className="text-2xl md:text-3xl lg:text-4xl text-[#a07855]" />
        <span className="text-xl md:text-2xl lg:text-3xl font-bold text-[#a07855]">HopeForPaws</span>
      </div>

      {/* Mobile Header Right Section (Username + User Icon + Menu Toggle) */}
      <div className="md:hidden flex items-center space-x-3">
        {/* Username and User Profile Icon - Always visible */}
        {user ? (
          <div className="relative flex items-center">
            <span className="text-[#a07855] font-medium text-sm mr-2">
              {user.username}
            </span>
            <NotificationIcon />
            <button 
              onClick={toggleProfile}
              aria-label="Toggle Profile"
            >
              <NavLink to="/profile">
                  <FaUser className="text-2xl text-[#a07855]" />
                </NavLink>
            </button>

            {/* Profile Dropdown For Mobile */}
            {isProfileOpen && (
              <div
                className="absolute right-0 mt-3 top-full w-48 p-4 bg-white border border-gray-300 rounded-lg shadow-lg text-center z-50"
              >
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
            <FaUser className="text-xl hover:text-gray-400 cursor-pointer text-[#a07855]" />
          </NavLink>
        )}

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="text-[#a07855] text-2xl focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`md:hidden w-full ${isMobileMenuOpen ? 'block' : 'hidden'} mt-4 border-t border-[#a07855] pt-4`}>
        <ul className="flex flex-col space-y-4">
          <li className="hover:text-black text-[#a07855] font-bold">
            <NavLink 
              to="/" 
              onClick={closeMobileMenu} 
              className={({ isActive }) => 
                `block py-2 ${isActive ? activeStyle : ''}`
              }
            >
              Home
            </NavLink>
          </li>
          <li className="hover:text-black text-[#a07855] font-bold">
            <NavLink 
              to="/clinics" 
              onClick={closeMobileMenu} 
              className={({ isActive }) => 
                `block py-2 ${isActive ? activeStyle : ''}`
              }
            >
              Clinics & Vets
            </NavLink>
          </li>
          <li className="hover:text-black text-[#a07855] font-bold">
            <NavLink 
              to="/ngo" 
              onClick={closeMobileMenu} 
              className={({ isActive }) => 
                `block py-2 ${isActive ? activeStyle : ''}`
              }
            >
              NGO's
            </NavLink>
          </li>
          <li className="hover:text-black text-[#a07855] font-bold">
            <NavLink 
              to="/adoption" 
              onClick={closeMobileMenu} 
              className={({ isActive }) => 
                `block py-2 ${isActive ? activeStyle : ''}`
              }
            >
              Adoption
            </NavLink>
          </li>
          <li className="hover:text-black text-[#a07855] font-bold">
            <NavLink 
              to="/posts" 
              onClick={closeMobileMenu} 
              className={({ isActive }) => 
                `block py-2 ${isActive ? activeStyle : ''}`
              }
            >
              Posts
            </NavLink>
          </li>
          <li className="hover:text-black text-[#a07855] font-bold">
            <NavLink 
              to="/contactus" 
              onClick={closeMobileMenu} 
              className={({ isActive }) => 
                `block py-2 ${isActive ? activeStyle : ''}`
              }
            >
              Contact Us
            </NavLink>
          </li>
          <li className="hover:text-black text-[#a07855] font-bold">
            <NavLink 
              to="/faq" 
              onClick={closeMobileMenu} 
              className={({ isActive }) => 
                `block py-2 ${isActive ? activeStyle : ''}`
              }
            >
              FAQ's
            </NavLink>
          </li>
          <li className="hover:text-black text-[#a07855] font-bold">
            <NavLink 
              to="/chat" 
              onClick={closeMobileMenu} 
              className={({ isActive }) => 
                `block py-2 ${isActive ? activeStyle : ''}`
              }
            >
              Inbox
            </NavLink>
          </li>
        </ul>

        {/* Mobile Sign In (only show when not logged in) */}
        {!user && (
          <div className="mt-4 pt-4 border-t border-[#a07855]">
            <NavLink 
              to="/signin" 
              onClick={closeMobileMenu}
              className="block w-full py-2 text-center bg-[#a07855] text-white font-bold rounded-lg hover:bg-[#6b493d] transition-colors"
            >
              Sign In
            </NavLink>
          </div>
        )}
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex flex-1 items-center justify-between ml-4 lg:ml-8">
        <ul className="flex flex-grow justify-center space-x-4 lg:space-x-8 2xl:space-x-12 mx-4">
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
            <NavLink to="/contactus" className={({ isActive }) => isActive ? activeStyle : ''}>Contact Us</NavLink>
          </li>
          <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
            <NavLink to="/faq" className={({ isActive }) => isActive ? activeStyle : ''}>FAQ's</NavLink>
          </li>
          <li className="hover:text-black text-[#a07855] font-bold whitespace-nowrap">
            <NavLink to="/chat" className={({ isActive }) => isActive ? activeStyle : ''}>
              Inbox
            </NavLink>
          </li>
        </ul>

        {/* Desktop User Actions Section */}
        <div className="flex space-x-4 lg:space-x-6 items-center relative min-w-max">
          {user ? (
            <>
              <span className="text-[#a07855] font-medium hidden lg:inline-block">
                Welcome {user.username}
              </span>
              <NotificationIcon />
              <div
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <NavLink to="/profile">
                  <FaUser className="text-2xl hover:text-gray-400 cursor-pointer text-[#a07855]" />
                </NavLink>

                {isHovered && (
                  <div
                    className="absolute right-0 mt-3 w-48 p-4 bg-white border border-gray-300 rounded-lg shadow-lg text-center z-50"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
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
  );
};

export default Navbar;