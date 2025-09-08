
import React from 'react';
import { FaLinkedin, FaInstagram, FaEnvelope, FaPaw } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-[#F8F4ED] to-[#e2d6cb] text-gray-700 py-3 md:py-4 border-t border-[#c9a280]/20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
          
          {/* Logo Section - Enhanced with better styling */}
          <div className="flex items-center space-x-3 group">
            <div className="relative">
              <FaPaw className="text-xl md:text-2xl text-[#6b493d] group-hover:text-[#a07855] transition-colors duration-300" />
              <div className="absolute inset-0 bg-[#a07855]/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></div>
            </div>
            <span className="text-base md:text-lg font-bold text-[#4E3B31] group-hover:text-[#6b493d] transition-colors duration-300">
              HopeForPaws
            </span>
          </div>
          
          {/* Copyright Text - Enhanced typography */}
          <div className="text-center md:order-none order-2 text-[#6b493d]/80 text-xs md:text-sm font-medium">
            &copy; {new Date().getFullYear()} Hope For Paws. All rights reserved.
          </div>
          
          {/* Social Media Links - Enhanced with hover effects and better spacing */}
          <div className="flex space-x-3 md:space-x-4 mt-1 md:mt-0">
            <a 
              href="https://www.linkedin.com/company/hope-for-paws-official/posts/?feedView=all" 
              target="_blank" 
              rel="noreferrer" 
              className="group relative p-1.5 rounded-lg bg-white/50 hover:bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110"
            >
              <FaLinkedin className="text-base md:text-lg text-[#6b493d] group-hover:text-[#a07855] transition-colors duration-300" />
              <div className="absolute inset-0 bg-[#a07855]/5 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
            </a>
            
            <a 
              href="https://www.instagram.com/hope.forpaws_/" 
              target="_blank" 
              rel="noreferrer" 
              className="group relative p-1.5 rounded-lg bg-white/50 hover:bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110"
            >
              <FaInstagram className="text-base md:text-lg text-[#6b493d] group-hover:text-[#a07855] transition-colors duration-300" />
              <div className="absolute inset-0 bg-[#a07855]/5 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
            </a>
            
            <a 
              href="mailto:hopeforpaws24@gmail.com" 
              className="group relative p-1.5 rounded-lg bg-white/50 hover:bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110"
            >
              <FaEnvelope className="text-base md:text-lg text-[#6b493d] group-hover:text-[#a07855] transition-colors duration-300" />
              <div className="absolute inset-0 bg-[#a07855]/5 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300"></div>
            </a>
          </div>
        </div>
        
        {/* Additional Info Section - New addition for better footer content */}
        <div className="mt-4 md:mt-5 pt-2 md:pt-3 border-t border-[#c9a280]/20 text-center">
          <p className="text-xs text-[#6b493d]/60 font-medium">
            Making a difference in animal welfare, one paw at a time 🐾
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;