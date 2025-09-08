// import React, { useState } from "react";

// const Support = () => {
//   const [openSection, setOpenSection] = useState(null);

//   const toggleSection = (section) => {
//     setOpenSection(openSection === section ? null : section);
//   };

//   return (
//     <section className="bg-white text-center mb-10">
//       {/* Stats Section */}
//       <div className="grid grid-cols-4 mb-10">
//         <div className="text-center bg-[#6b493d] py-10">
//           <h3 className="text-2xl text-white font-bold">0k</h3>
//           <p className="text-sm text-white">ADOPTION</p>
//         </div>
//         <div className="text-center py-10 bg-[#000000]">
//           <h3 className="text-2xl text-white font-bold">0k</h3>
//           <p className="text-sm text-white">RESCUED</p>
//         </div>
//         <div className="text-center py-10 bg-[#a07855]">
//           <h3 className="text-2xl text-white font-bold">0k</h3>
//           <p className="text-sm text-white">CLIENTS</p>
//         </div>
//         <div className="text-center py-10">
//           <h3 className="text-2xl font-bold">4+</h3>
//           <p className="text-sm text-black">SERVICES</p>
//         </div>
//       </div>

//       <h2 className="text-3xl font-bold text-center text-[#6b493d]">Support</h2>

//       {/* Desktop View */}
//       <div className="hidden md:grid grid-cols-3 gap-10 mt-10">
//         <div className="border p-6 rounded-lg">
//           <h3 className="text-xl font-semibold mt-4">ADOPT</h3>
//           <p className="text-sm text-gray-600 mt-2">
//             Provide comfort & care to rescued animals.
//           </p>
//         </div>

//         <div className="border p-6 rounded-lg">
//           <h3 className="text-xl font-semibold mt-4">RESCUE</h3>
//           <p className="text-sm text-gray-600 mt-2">
//             Help homeless animals who need food and medical care.
//           </p>
//         </div>

//         <div className="border p-6 rounded-lg">
//           <h3 className="text-xl font-semibold mt-4">FOSTER</h3>
//           <p className="text-sm text-gray-600 mt-2">
//             Be foster parents to animals in need.
//           </p>
//         </div>
//       </div>

//       {/* Mobile View (Dropdown) */}
//       <div className="md:hidden mt-10">
//         {["ADOPT", "RESCUE", "FOSTER"].map((section, index) => (
//           <div key={index} className="border mb-4 p-4 rounded-lg bg-gray-100">
//             <button
//               className="w-full text-left text-xl font-semibold flex justify-between"
//               onClick={() => toggleSection(section)}
//             >
//               {section}
//               <span>{openSection === section ? "▲" : "▼"}</span>
//             </button>
//             {openSection === section && (
//               <p className="text-sm text-gray-600 mt-2">
//                 {section === "ADOPT"
//                   ? "Provide comfort & care to rescued animals."
//                   : section === "RESCUE"
//                   ? "Help homeless animals who need food and medical care."
//                   : "Be foster parents to animals in need."}
//               </p>
//             )}
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// };

// export default Support;
import React from 'react';

const Support = () => {
  return (
    <section className="bg-white text-center mb-10">
      {/* Stats Section */}
      <div className="grid grid-cols-4 md:grid-cols-4 mb-10">
        <div className="bg-[#6b493d] py-10 text-white">
          <h3 className="text-2xl font-bold">0k</h3>
          <p className="text-sm">ADOPTION</p>
        </div>
        <div className="bg-[#000000] py-10 text-white">
          <h3 className="text-2xl font-bold">50+</h3>
          <p className="text-sm">USERS</p>
        </div>
        <div className="bg-[#a07855] py-10 text-white">
          <h3 className="text-2xl font-bold">30+</h3>
          <p className="text-sm">VETS</p>
        </div>
        <div className="bg-gray-100 py-10 text-black">
          <h3 className="text-2xl font-bold">2</h3>
          <p className="text-sm">SERVICES</p>
        </div>
      </div>

      {/* Heading */}
      <h2 className="text-3xl font-bold text-[#6b493d]">Support</h2>

      {/* Support Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-10">
        {/* ADOPT */}
        <div className="border p-6 rounded-lg mx-auto w-full max-w-xs shadow-md">
          <h3 className="text-xl font-semibold mt-2">ADOPT</h3>
          <p className="text-sm text-gray-600 mt-2">
            Provide comfort & care to rescued animals.
          </p>
        </div>

        {/* RESCUE */}
        <div className="border p-6 rounded-lg mx-auto w-full max-w-xs shadow-md">
          <h3 className="text-xl font-semibold mt-2">RESCUE</h3>
          <p className="text-sm text-gray-600 mt-2">
            Help homeless animals who need food and medical care.
          </p>
        </div>

        {/* FOSTER */}
        <div className="border p-6 rounded-lg mx-auto w-full max-w-xs shadow-md">
          <h3 className="text-xl font-semibold mt-2">FOSTER</h3>
          <p className="text-sm text-gray-600 mt-2">
            Be foster parents to animals in need.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Support;