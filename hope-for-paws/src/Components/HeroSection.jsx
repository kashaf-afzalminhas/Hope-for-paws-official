// // src/components/HeroSection.jsx
// import React from 'react';
// import CatImage from '../assets/DOG1.png';

// const HeroSection = () => {
//   return (
//     <section className="bg-[#c9a280] w-full relative overflow-hidden">
//       <div className="container mx-auto px-4 pt-16 md:pt-20">
//         <div className="flex flex-col md:flex-row items-center justify-between">
//           <div className="w-full md:w-1/2 text-left pb-12 md:pb-16 md:pl-6 lg:pl-16 xl:pl-24 z-10">
//             <h1 
//               className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4"
//               style={{ fontFamily: '"Playfair Display", serif' }}
//             >
//               <span className="text-black">Adopt.</span> 
//               <span className="text-[#6b493d] italic"> Don't Shop.</span>
//             </h1>
//             <p 
//               className="text-xl sm:text-2xl font-bold text-[#a07855]"
//               style={{ fontFamily: '"Poppins", sans-serif' }}
//             >
//               Find your new best friend today.
//             </p>
//           </div>
          
//           <div className="w-full md:w-1/2 mt-8 md:mt-0 flex justify-center md:justify-end z-10">
//             <img 
//               src={CatImage} 
//               alt="Adopt a Dog" 
//               className="w-2/3 md:w-3/4 lg:w-2/3 xl:w-1/2 object-contain"
//             />
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default HeroSection;

// import React, { useEffect, useState } from 'react';
// import { motion } from 'framer-motion';
// import { FaPaw, FaHeart, FaSearch } from 'react-icons/fa';
// import CatImage from '../assets/DOG1.png';

// const HeroSection = () => {
//   const [isMobile, setIsMobile] = useState(false);

//   useEffect(() => {
//     const checkMobile = () => setIsMobile(window.innerWidth < 768);
//     checkMobile();
//     window.addEventListener('resize', checkMobile);
//     return () => window.removeEventListener('resize', checkMobile);
//   }, []);

//   return (
//     <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#c9a280] to-[#d6b899]">
//       {/* Floating paws background */}
//       <div className="absolute inset-0 overflow-hidden opacity-20">
//         {[...Array(12)].map((_, i) => (
//           <motion.div
//             key={i}
//             className="absolute text-[#6b493d]"
//             initial={{ 
//               y: Math.random() * 100,
//               x: Math.random() * 100,
//               rotate: Math.random() * 360,
//               scale: 0.8
//             }}
//             animate={{
//               y: [null, (Math.random() - 0.5) * 40],
//               x: [null, (Math.random() - 0.5) * 40],
//               rotate: [0, Math.random() * 180],
//             }}
//             transition={{
//               duration: 8 + Math.random() * 4,
//               repeat: Infinity,
//               delay: i * 0.7,
//               ease: "easeInOut"
//             }}
//             style={{
//               top: `${Math.random() * 100}%`,
//               left: `${Math.random() * 100}%`,
//             }}
//           >
//             <FaPaw className="text-lg md:text-xl" />
//           </motion.div>
//         ))}
//       </div>

//       {/* Main content */}
//       <div className="container relative mx-auto px-4 py-8 md:py-12">
//         <div className="flex flex-col md:flex-row items-center">
//           {/* Text content - now with equal width to image on mobile */}
//           <motion.div 
//             className="w-full md:w-1/2 text-center md:text-left mb-6 md:mb-0 md:pr-6 lg:pr-10 z-10"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.7 }}
//           >
//             <motion.h1 
//               className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
//               style={{ fontFamily: '"Playfair Display", serif' }}
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               transition={{ delay: 0.2, duration: 0.6 }}
//             >
//               <span className="text-black block">Adopt.</span> 
//               <span className="text-[#6b493d] italic block">Don't Shop.</span>
//             </motion.h1>
            
//             <motion.p 
//               className="text-xl sm:text-2xl font-medium text-[#5a3c32] mb-6"
//               style={{ fontFamily: '"Poppins", sans-serif' }}
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               transition={{ delay: 0.4, duration: 0.6 }}
//             >
//               Find your new best friend today.
//             </motion.p>
            
//             <motion.div
//               className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.6, duration: 0.6 }}
//             >
//               <button className="bg-[#6b493d] text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-[#5a3c32] transition-all duration-300 flex items-center justify-center">
//                 <FaSearch className="mr-2" />
//                 Find a Pet
//               </button>
//               <button className="bg-white text-[#6b493d] px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-gray-100 transition-all duration-300 flex items-center justify-center border border-[#6b493d]">
//                 <FaHeart className="mr-2" />
//                 How to Adopt
//               </button>
//             </motion.div>
//           </motion.div>
          
//           {/* Image content - now properly contained within the brown background */}
//           <motion.div 
//             className="w-full md:w-1/2 flex justify-center relative"
//             initial={{ opacity: 0, scale: 0.9 }}
//             animate={{ opacity: 1, scale: 1 }}
//             transition={{ delay: 0.3, duration: 0.7 }}
//           >
//             {/* Decorative elements */}
//             <div className="absolute -top-4 -right-4 w-40 h-40 bg-[#a07855] opacity-20 rounded-full blur-xl"></div>
//             <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#6b493d] opacity-10 rounded-full blur-lg"></div>
            
//             {/* Image container with custom shape */}
//             <div className="relative w-4/5 max-w-md">
//               <motion.div 
//                 className="absolute inset-0 bg-[#6b493d] rounded-2xl rotate-3"
//                 initial={{ rotate: 3, opacity: 0.1 }}
//                 animate={{ rotate: [3, -1, 3] }}
//                 transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
//               ></motion.div>
              
//               <motion.img 
//                 src={CatImage} 
//                 alt="Happy dog for adoption" 
//                 className="relative z-10 w-full h-auto object-contain rounded-2xl shadow-2xl"
//                 whileHover={{ 
//                   scale: 1.02,
//                   transition: { duration: 0.3 }
//                 }}
//               />
//             </div>
//           </motion.div>
//         </div>

//         {/* Stats bar - simplified and more integrated */}
//         <motion.div 
//           className="grid grid-cols-3 gap-2 md:gap-4 mt-8 md:mt-12 max-w-2xl mx-auto bg-white/30 backdrop-blur-sm rounded-2xl p-4 shadow-sm"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.8, duration: 0.6 }}
//         >
//           {[
//             { number: "500+", label: "Pets Adopted" },
//             { number: "200+", label: "Volunteers" },
//             { number: "50+", label: "Partner NGOs" }
//           ].map((stat, index) => (
//             <div key={index} className="text-center">
//               <p className="text-2xl md:text-3xl font-bold text-[#6b493d]">{stat.number}</p>
//               <p className="text-xs md:text-sm text-[#5a3c32]">{stat.label}</p>
//             </div>
//           ))}
//         </motion.div>
//       </div>

//       {/* Bottom wave divider */}
//       <div className="w-full overflow-hidden">
//         <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 md:h-16 text-white fill-current">
//           <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="shape-fill"></path>
//           <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="shape-fill"></path>
//           <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="shape-fill"></path>
//         </svg>
//       </div>
//     </section>
//   );
// };

// export default HeroSection;

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaPaw, FaSearch, FaHeart } from 'react-icons/fa';
import CatImage from '../assets/DOG1.png';

const HeroSection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#c9a280] to-[#d6b899] pb-10 md:pb-12">
      {/* Floating paws background */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-[#6b493d]"
            initial={{ 
              y: Math.random() * 100,
              x: Math.random() * 100,
              rotate: Math.random() * 360,
              scale: 0.8
            }}
            animate={{
              y: [null, (Math.random() - 0.5) * 40],
              x: [null, (Math.random() - 0.5) * 40],
              rotate: [0, Math.random() * 180],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.7,
              ease: "easeInOut"
            }}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          >
            <FaPaw className="text-lg md:text-xl" />
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="container relative mx-auto px-4 pt-8 md:pt-12">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Text content */}
          <motion.div 
            className="w-full md:w-1/2 text-center md:text-left mb-8 md:mb-0 md:pr-6 lg:pr-10 z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
              style={{ fontFamily: '"Playfair Display", serif' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <span className="text-black block">Adopt.</span> 
              <span className="text-[#6b493d] italic block">Don't Shop.</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl sm:text-2xl font-medium text-[#5a3c32] mb-8"
              style={{ fontFamily: '"Poppins", sans-serif' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Find your new best friend today.
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <button className="bg-[#6b493d] text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:bg-[#5a3c32] transition-all duration-300 flex items-center justify-center">
                <FaSearch className="mr-2" />
                Find a Pet
              </button>
              <button className="bg-white/90 text-[#6b493d] px-8 py-3 rounded-full font-semibold shadow-lg hover:bg-white transition-all duration-300 flex items-center justify-center border border-[#6b493d]/30">
                <FaHeart className="mr-2" />
                How to Adopt
              </button>
            </motion.div>
          </motion.div>
          
          {/* Image content */}
          <motion.div 
            className="w-full md:w-1/2 flex justify-center relative mt-6 md:mt-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-[#a07855] opacity-20 rounded-full blur-xl"></div>
            <div className="absolute bottom-4 left-4 w-24 h-24 bg-[#6b493d] opacity-15 rounded-full blur-lg"></div>
            
            {/* Image container */}
            <div className="relative w-4/5 max-w-md">
              <motion.div 
                className="absolute -inset-4 bg-[#6b493d] rounded-2xl rotate-3 opacity-10"
                initial={{ rotate: 3 }}
                animate={{ rotate: [3, -1, 3] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              
              <motion.img 
                src={CatImage} 
                alt="Happy dog for adoption" 
                className="relative z-10 w-full h-auto object-contain rounded-2xl shadow-xl"
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Simple curved divider */}
      <div className="absolute bottom-0 left-0 w-full h-12 bg-white rounded-t-[50%]"></div>
    </section>
  );
};

export default HeroSection;