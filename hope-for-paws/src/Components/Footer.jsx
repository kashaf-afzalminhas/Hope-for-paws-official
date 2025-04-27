// // src/components/Footer.js
// import React from 'react';
// import { FaFacebookF, FaInstagram, FaEnvelope, FaPaw, FaPhoneAlt } from 'react-icons/fa';
// const Footer = () => {
//   return (
//     <footer className="bg-[#F8F4ED] text-gray-700 border-t border-[#a0785533]">
//       <div className="container mx-auto px-6 py-8">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
//           {/* Logo & Description */}
//           <div className="space-y-4">
//             <div className="flex items-center space-x-3">
//               <FaPaw className="text-4xl text-[#a07855]" />
//               <span className="text-2xl font-bold text-gray-800">HopeForPaws</span>
//             </div>
//             <p className="text-sm text-gray-600 max-w-xs">
//               Committed to Animal Welfare & Community Education
//             </p>
//           </div>

//           {/* Contact Info */}
//           <div className="space-y-2">
//             <h3 className="text-lg font-semibold text-gray-800 mb-3">Get in Touch</h3>
//             <div className="flex items-center space-x-2 text-gray-600">
//               <FaEnvelope className="text-[#a07855]" />
//               <span>hopeforpaws24@gmail.com</span>
//             </div>
//             <div className="flex items-center space-x-2 text-gray-600">
//               <FaPhoneAlt className="text-[#a07855]" />
//               <span>+92 123 456789</span>
//             </div>
//           </div>

//           {/* Social Media */}
//           <div className="space-y-4">
//             <h3 className="text-lg font-semibold text-gray-800">Follow Us</h3>
//             <div className="flex space-x-4">
//               <a href="https://facebook.com" target="_blank" rel="noreferrer" 
//                  className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-300">
//                 <FaFacebookF className="text-xl text-gray-600 hover:text-[#a07855]" />
//               </a>
//               <a href="https://instagram.com" target="_blank" rel="noreferrer" 
//                  className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-300">
//                 <FaInstagram className="text-xl text-gray-600 hover:text-[#a07855]" />
//               </a>
//               <a href="mailto:hopeforpaws24@gmail.com" 
//                  className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-300">
//                 <FaEnvelope className="text-xl text-gray-600 hover:text-[#a07855]" />
//               </a>
//             </div>
//           </div>
//         </div>

//         {/* Copyright */}
//         <div className="border-t border-[#a0785533] mt-8 pt-6 text-center">
//           <p className="text-sm text-gray-600">
//             &copy; {new Date().getFullYear()} Hope For Paws. All rights reserved.
//             <span className="block mt-2 text-xs">Registered Non-Profit Organization</span>
//           </p>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;

// src/components/Footer.js
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