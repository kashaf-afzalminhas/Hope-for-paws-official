
import React from 'react';
import { FaLinkedin, FaInstagram, FaEnvelope, FaPaw } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-[#F8F4ED] text-gray-700 py-9">
      <div className="bg-[#F8F4ED] container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          <FaPaw className="text-4xl text-[#a07855]" />
          <span className="text-xl font-semibold text-gray-800">HopeForPaws</span>
        </div>
        
        {/* Copyright Text */}
        <div className="text-center md:order-none order-2 text-gray-600 mt-4 md:mt-0">
          &copy; {new Date().getFullYear()} Hope For Paws. All rights reserved.
        </div>
        
        {/* Social Media Links - Larger Icons */}
        <div className="flex space-x-4 mt-4 md:mt-0">
        <a href="https://www.linkedin.com/company/hope-for-paws-official/posts/?feedView=all" target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-800">
            <FaLinkedin className="text-2xl" />
          </a>
          <a href="https://www.instagram.com/hope.forpaws_/" target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-800">
            <FaInstagram className="text-2xl" />
          </a>
          <a href="mailto:hopeforpaws24@gmail.com" className="text-gray-600 hover:text-gray-800">
            <FaEnvelope className="text-2xl" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;