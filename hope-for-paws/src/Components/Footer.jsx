// src/components/Footer.js
import React from 'react';
import { FaFacebookF, FaInstagram, FaEnvelope ,FaPaw} from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-[#F8F4ED] text-gray-700 py-6 mt-10 mb-10">
      <div className=" bg-[#F8F4ED] container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
        
        {/* Logo Section */}
        <div className="flex items-center space-x-2 bg-[#F8F4ED]">
          {/* <img src="/path/to/logo.png" alt="Hope For Paws Logo" className="w-8 h-8" />
          <h2 className="text-xl font-semibold text-gray-800">Hope For Paws</h2> */}
          <FaPaw className="text-4xl text-[#a07855]" />
          <span className="text-xl font-semibold text-gray-800" >HopeForPaws</span>
        </div>
        
        {/* Copyright Text */}
        <div className="text-center md:order-none order-2 text-gray-600 mt-4 md:mt-0">
          &copy; {new Date().getFullYear()} Hope For Paws. All rights reserved.
        </div>
        
        {/* Social Media Links */}
        <div className="flex space-x-4 mt-4 md:mt-0">
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-800">
            <FaFacebookF />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-800">
            <FaInstagram />
          </a>
          <a href="mailto:hopeforpaws24@gmail.com" className="text-gray-600 hover:text-gray-800">
            <FaEnvelope />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
