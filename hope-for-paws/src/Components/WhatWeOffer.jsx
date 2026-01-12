import React from 'react';
import DogImage from '../assets/DOG-WWO.png'; // Make sure to replace this with your actual image path
import { FaPaw, FaBone, FaBath, FaUserNurse, FaHouseUser, FaSyringe } from 'react-icons/fa';

const WhatWeOffer = () => {
  return (
    <section className="py-16 bg-[#c9a280]">
      <div className="text-center mb-6">
        <h2 className="text-3xl md:text-4xl font-bold text-[#6b493d]">What We Offer</h2>
        <p className="text-md md:text-lg text-gray-600 mt-2">WHERE LOVE AND CARE UNITE!</p>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col items-center text-center space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FaPaw className="text-2xl text-[#6b493d]" />
            <p className="text-[#6b493d] font-semibold">Animal Training</p>
          </div>
          <div className="flex items-center gap-2">
            <FaBath className="text-2xl text-[#6b493d]" />
            <p className="text-[#6b493d] font-semibold">Pet Grooming</p>
          </div>
          <div className="flex items-center gap-2">
            <FaHouseUser className="text-2xl text-[#6b493d]" />
            <p className="text-[#6b493d] font-semibold">Animal Rescue</p>
          </div>
        </div>

        {/* Dog Image */}
        <img src={DogImage} alt="Happy Dog" className="w-40 h-40 rounded-full shadow-lg object-cover" />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FaBone className="text-2xl text-[#6b493d]" />
            <p className="text-[#6b493d] font-semibold">Pet Supplies</p>
          </div>
          <div className="flex items-center gap-2">
            <FaUserNurse className="text-2xl text-[#6b493d]" />
            <p className="text-[#6b493d] font-semibold">Pet Vet</p>
          </div>
          <div className="flex items-center gap-2">
            <FaSyringe className="text-2xl text-[#6b493d]" />
            <p className="text-[#6b493d] font-semibold">Animal Adoption</p>
          </div>
        </div>
      </div>

      {/* Desktop Layout (Remains Same) */}
      <div className="hidden md:flex justify-center items-center relative">
        <img src={DogImage} alt="Happy Dog" className="w-80 h-80 rounded-full shadow-lg object-cover z-10" />
        <div className="absolute top-0 left-1/4 transform -translate-x-1/2 flex flex-col items-center space-y-4">
          <FaPaw className="text-4xl text-[#6b493d]" />
          <p className="text-[#6b493d] font-semibold">Animal Training</p>
        </div>
        <div className="absolute top-0 right-1/4 transform translate-x-1/2 flex flex-col items-center space-y-4">
          <FaBone className="text-4xl text-[#6b493d]" />
          <p className="text-[#6b493d] font-semibold">Pet Supplies</p>
        </div>
        <div className="absolute bottom-0 left-1/4 transform -translate-x-1/2 flex flex-col items-center space-y-4">
          <FaHouseUser className="text-4xl text-[#6b493d]" />
          <p className="text-[#6b493d] font-semibold">Animal Rescue</p>
        </div>
        <div className="absolute bottom-0 right-1/4 transform translate-x-1/2 flex flex-col items-center space-y-4">
          <FaSyringe className="text-4xl text-[#6b493d]" />
          <p className="text-[#6b493d] font-semibold">Animal Adoption</p>
        </div>
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-4 ml-52">
          <FaBath className="text-4xl text-[#6b493d]" />
          <p className="text-[#6b493d] font-semibold">Pet Grooming</p>
        </div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-4 mr-52">
          <FaUserNurse className="text-4xl text-[#6b493d]" />
          <p className="text-[#6b493d] font-semibold">Pet Vet</p>
        </div>
      </div>
    </section>
  );
};

export default WhatWeOffer;


// import React, { useRef, useEffect, useState } from "react";
// import DogImage from "../assets/DOG-WWO.png"; 
// import { FaPaw, FaComments, FaUserMd, FaSyringe, FaClinicMedical, FaHandsHelping } from "react-icons/fa";
// import { motion, useInView } from "framer-motion";

// const features = [
//   { icon: <FaPaw />, label: "Post Pet Queries" },
//   { icon: <FaUserMd />, label: "Volunteer Vets Respond" },
//   { icon: <FaComments />, label: "Chat with Users" },
//   { icon: <FaSyringe />, label: "Request / Add Adoption Ads" },
//   { icon: <FaClinicMedical />, label: "Browse NGOs & Clinics" },
//   { icon: <FaHandsHelping />, label: "Animal Rescue Support" },
// ];

// const WhatWeOffer = () => {
//   const ref = useRef(null);
//   const isInView = useInView(ref, { once: true, amount: 0.3 });
//   const [isMobile, setIsMobile] = useState(false);

//   useEffect(() => {
//     const checkMobile = () => setIsMobile(window.innerWidth < 768);
//     checkMobile();
//     window.addEventListener('resize', checkMobile);
//     return () => window.removeEventListener('resize', checkMobile);
//   }, []);

//   // Floating Paw Background Component
//   const FloatingPaws = () => {
//     return (
//       <div className="absolute inset-0 overflow-hidden z-0 opacity-20">
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
//               duration: 6 + Math.random() * 4,
//               repeat: Infinity,
//               delay: i * 0.5,
//               ease: "easeInOut"
//             }}
//             style={{
//               top: `${Math.random() * 100}%`,
//               left: `${Math.random() * 100}%`,
//             }}
//           >
//             <FaPaw className="text-xl" />
//           </motion.div>
//         ))}
//       </div>
//     );
//   };

//   // Desktop orbit animation
//   const orbitVariants = (index, radius) => {
//     const angle = (index * (360 / features.length)) * (Math.PI / 180);
//     const x = Math.cos(angle) * radius;
//     const y = Math.sin(angle) * radius;
    
//     return {
//       hidden: { 
//         opacity: 0, 
//         x: 0, 
//         y: 0,
//         scale: 0.5
//       },
//       visible: {
//         opacity: 1,
//         x: x,
//         y: y,
//         scale: 1,
//         transition: {
//           type: "spring",
//           stiffness: 50,
//           delay: index * 0.1 + 0.5,
//           duration: 0.8
//         }
//       },
//       hover: {
//         scale: 1.1,
//         backgroundColor: "rgba(255, 255, 255, 0.9)",
//         boxShadow: "0 8px 20px -5px rgba(107, 73, 61, 0.3)",
//         transition: { duration: 0.2 }
//       }
//     };
//   };

//   // Mobile animation variants
//   const mobileItemVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: (i) => ({
//       opacity: 1,
//       y: 0,
//       transition: {
//         delay: i * 0.1,
//         duration: 0.4,
//         ease: "easeOut"
//       }
//     }),
//     hover: {
//       scale: 1.05,
//       backgroundColor: "rgba(255, 255, 255, 0.9)",
//       boxShadow: "0 5px 15px -3px rgba(107, 73, 61, 0.2)",
//       transition: { duration: 0.2 }
//     }
//   };

//   return (
//     <section ref={ref} className="relative py-12 md:py-16 bg-[#c9a280] overflow-hidden">
//       {/* Background elements */}
//       <FloatingPaws />
      
//       {/* Subtle spotlight effect */}
//       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-80 md:h-80 bg-amber-200 rounded-full opacity-20 blur-xl"></div>

//       <div className="container mx-auto px-4 relative z-10">
//         {/* Section Header */}
//         <div className="text-center mb-10 md:mb-12">
//           <motion.h2
//             initial={{ opacity: 0, y: -20 }}
//             animate={isInView ? { opacity: 1, y: 0 } : {}}
//             transition={{ duration: 0.6 }}
//             className="text-3xl md:text-4xl font-bold text-[#6b493d] mb-2"
//           >
//             What We Offer
//           </motion.h2>
//           <motion.p
//             initial={{ opacity: 0 }}
//             animate={isInView ? { opacity: 1 } : {}}
//             transition={{ delay: 0.3, duration: 0.6 }}
//             className="text-md md:text-lg text-[#5a3c32]"
//           >
//             Where Love and Care Unite for Every Paw 🐾
//           </motion.p>
//         </div>

//         {/* Mobile Layout */}
//         {isMobile && (
//           <div className="md:hidden flex flex-col items-center">
//             <motion.div
//               initial={{ scale: 0.8, opacity: 0 }}
//               animate={isInView ? { scale: 1, opacity: 1 } : {}}
//               transition={{ duration: 0.5 }}
//               className="mb-8"
//             >
//               <div className="relative">
//                 <div className="absolute -inset-2 bg-amber-200 rounded-full opacity-40 blur-md"></div>
//                 <img
//                   src={DogImage}
//                   alt="Happy Dog"
//                   className="relative w-32 h-32 rounded-full object-cover border-4 border-white shadow-md z-10"
//                 />
//               </div>
//             </motion.div>

//             <div className="grid grid-cols-2 gap-3 w-full max-w-md">
//               {features.map((item, i) => (
//                 <motion.div
//                   key={i}
//                   custom={i}
//                   variants={mobileItemVariants}
//                   initial="hidden"
//                   animate={isInView ? "visible" : ""}
//                   whileHover="hover"
//                   className="flex flex-col items-center justify-center p-3 bg-white/80 rounded-lg shadow-sm border border-white/50 text-center h-28"
//                 >
//                   <div className="text-2xl text-[#6b493d] mb-1">{item.icon}</div>
//                   <p className="text-xs font-medium text-[#6b493d] leading-tight">
//                     {item.label}
//                   </p>
//                 </motion.div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Desktop Layout */}
//         {!isMobile && (
//           <div className="hidden md:flex justify-center items-center relative min-h-[500px]">
//             {/* Central Dog Image */}
//             <motion.div
//               initial={{ scale: 0, rotate: -180 }}
//               animate={isInView ? { scale: 1, rotate: 0 } : {}}
//               transition={{ type: "spring", stiffness: 50, duration: 0.8 }}
//               className="absolute z-20"
//             >
//               <div className="relative">
//                 <div className="absolute -inset-4 bg-amber-200 rounded-full opacity-40 blur-lg"></div>
//                 <img
//                   src={DogImage}
//                   alt="Happy Dog"
//                   className="relative w-64 h-64 rounded-full object-cover border-6 border-white shadow-xl z-30"
//                 />
//               </div>
//             </motion.div>

//             {/* Orbiting Features */}
//             {features.map((item, i) => (
//               <motion.div
//                 key={i}
//                 variants={orbitVariants(i, 180)}
//                 initial="hidden"
//                 animate={isInView ? "visible" : ""}
//                 whileHover="hover"
//                 className="absolute flex flex-col items-center justify-center p-4 bg-white/85 rounded-xl shadow-md border border-white/50 text-center w-36 h-36 z-30"
//               >
//                 <div className="text-3xl text-[#6b493d] mb-2">{item.icon}</div>
//                 <p className="text-sm font-semibold text-[#6b493d] leading-tight">
//                   {item.label}
//                 </p>
//               </motion.div>
//             ))}
//           </div>
//         )}
//       </div>
//     </section>
//   );
// };

// export default WhatWeOffer;