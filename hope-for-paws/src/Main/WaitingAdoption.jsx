// // import React from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import { AdoptionProvider } from './AdoptionContext';
// // import AdoptionPosts from './AdoptionPosts';

// // const WaitingAdoption = () => {
// //   const navigate = useNavigate();

// //   const handleSeeMore = () => {
// //     navigate('/adoptionpage');
// //   };

// //   return (
// //     <AdoptionProvider>
// //       <section className="py-10 bg-[#f5f3ed]">
// //         <div className="text-center mb-6">
// //           <h2 className="text-3xl font-bold text-[#6b493d] flex items-center justify-center">
// //             Waiting Adoption
// //             <button className="ml-3 p-2 bg-[#6b493d] text-white rounded-full hover:bg-[#54392b]">
// //               {/* Paw Icon as SVG */}
// //               {/* Paw Icon as SVG */}
// //             <svg
// //               xmlns="http://www.w3.org/2000/svg"
// //               className="h-6 w-6"
// //               fill="none"
// //               viewBox="0 0 24 24"
// //               stroke="currentColor"
// //             >
// //               <path
// //                 strokeLinecap="round"
// //                 strokeLinejoin="round"
// //                 strokeWidth="2"
// //                 d="M5.75 12.5a2.75 2.75 0 01-2.75-2.75M5.75 12.5a2.75 2.75 0 00-2.75 2.75M5.75 12.5A2.75 2.75 0 007.5 15.25M5.75 12.5a2.75 2.75 0 012.75-2.75M5.75 12.5A2.75 2.75 0 007.5 12.5m6.5-1.75a2.75 2.75 0 012.75 2.75M12 12.5a2.75 2.75 0 00-2.75-2.75M12 12.5a2.75 2.75 0 01-2.75 2.75M12 12.5A2.75 2.75 0 019.5 15.25m4.5-3.75a2.75 2.75 0 012.75-2.75M12 12.5a2.75 2.75 0 01-2.75 2.75M12 12.5A2.75 2.75 0 0115.25 15.25M18.25 12.5a2.75 2.75 0 00-2.75-2.75M18.25 12.5A2.75 2.75 0 0015.5 12.5m0 0a2.75 2.75 0 012.75 2.75M18.25 12.5a2.75 2.75 0 012.75 2.75"
// //               />
// //             </svg>
// //             </button>
// //           </h2>
// //         </div>
// //         <div className="flex justify-center">
// //           <AdoptionPosts onEdit={() => {}} />
// //         </div>
// //         <div className="text-center mt-4">
// //           <button
// //             onClick={handleSeeMore}
// //             className="bg-brown-600 text-white px-4 py-2 rounded hover:bg-brown-800"
// //           >
// //             See More
// //           </button>
// //         </div>
// //       </section>
// //     </AdoptionProvider>
// //   );
// // };

// // export default WaitingAdoption;

  
// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// // import { AdoptionProvider } from './AdoptionContext';
// // import AdoptionPosts from './AdoptionPosts';

// const WaitingAdoption = () => {
//   const navigate = useNavigate();

//   const handleSeeMore = () => {
//     navigate('/adoptionpage');
//   };

//   return (
//     <AdoptionProvider>
//       <section className="py-10 bg-[#f5f3ed] h-[550px] overflow-hidden flex flex-col justify-between">
//         <div className="text-center mb-4">
//           <h2 className="text-3xl font-bold text-[#6b493d] flex items-center justify-center">
//             Waiting Adoption
//             <button className="ml-3 p-2 bg-[#6b493d] text-white rounded-full hover:bg-[#54392b]">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-6 w-6"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M5.75 12.5a2.75 2.75 0 01-2.75-2.75M5.75 12.5a2.75 2.75 0 00-2.75 2.75M5.75 12.5A2.75 2.75 0 007.5 15.25M5.75 12.5a2.75 2.75 0 012.75-2.75M5.75 12.5A2.75 2.75 0 007.5 12.5m6.5-1.75a2.75 2.75 0 012.75 2.75M12 12.5a2.75 2.75 0 00-2.75-2.75M12 12.5a2.75 2.75 0 01-2.75 2.75M12 12.5A2.75 2.75 0 009.5 15.25m4.5-3.75a2.75 2.75 0 012.75-2.75M12 12.5a2.75 2.75 0 01-2.75 2.75M12 12.5A2.75 2.75 0 0115.25 15.25M18.25 12.5a2.75 2.75 0 00-2.75-2.75M18.25 12.5A2.75 2.75 0 0115.5 12.5m0 0a2.75 2.75 0 012.75 2.75M18.25 12.5a2.75 2.75 0 012.75 2.75"
//                 />
//               </svg>
//             </button>
//           </h2>
//         </div>
//         <div className="flex justify-center overflow-hidden ml-12">
//           <AdoptionPosts onEdit={() => {}} />
//         </div>
//         <div className="text-center mt-2">
//           <button
//             onClick={handleSeeMore}
//             className="bg-[#6b493d] text-white px-4 py-2 rounded hover:bg-[#54392b]"
//           >
//             See More
//           </button>
//         </div>
//       </section>
//     </AdoptionProvider>
//   );
// };

// export default WaitingAdoption;