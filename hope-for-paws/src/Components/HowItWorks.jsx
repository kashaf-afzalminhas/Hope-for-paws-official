// // src/components/HowItWorks.jsx
// import React from 'react';

// const HowItWorks = () => {
//   return (
//     <section className="py-12 md:py-16 bg-[#f5f3ed]">
//       <h2 className="text-3xl md:text-4xl font-bold text-center text-[#6b493d] mb-8 md:mb-10">
//         How It Works
//       </h2>

//       {/* Mobile & Tablet Layout (stacked) */}
//       <div className="md:hidden px-4 mt-8">
//         <div className="flex flex-col items-center space-y-12">
//           {/* Step 1 */}
//           <div className="flex flex-col items-center">
//             <div className="w-10 h-10 rounded-full bg-[#6b493d] flex justify-center items-center">
//               <span className="text-white font-bold">1</span>
//             </div>
//             <p className="mt-4 font-semibold text-[#6b493d] text-center">Find Your Pet</p>
//             <p className="text-sm text-[#6b493d] text-center">Select a pet from our adoption list.</p>
//           </div>

//           {/* Vertical Line */}
//           <div className="w-1 h-8 bg-[#6b493d]"></div>

//           {/* Step 2 */}
//           <div className="flex flex-col items-center">
//             <div className="w-10 h-10 rounded-full bg-[#6b493d] flex justify-center items-center">
//               <span className="text-white font-bold">2</span>
//             </div>
//             <p className="mt-4 font-semibold text-[#6b493d] text-center">Know Your Pet</p>
//             <p className="text-sm text-[#6b493d] text-center">Schedule a visit with the chosen one.</p>
//           </div>

//           {/* Vertical Line */}
//           <div className="w-1 h-8 bg-[#6b493d]"></div>

//           {/* Step 3 */}
//           <div className="flex flex-col items-center">
//             <div className="w-10 h-10 rounded-full bg-[#6b493d] flex justify-center items-center">
//               <span className="text-white font-bold">3</span>
//             </div>
//             <p className="mt-4 font-semibold text-[#6b493d] text-center">Take Your Pet Home</p>
//             <p className="text-sm text-[#6b493d] text-center">Follow the adoption process.</p>
//           </div>
//         </div>
//       </div>

//       {/* Desktop Layout (horizontal) */}
//       <div className="hidden md:block">
//         <div className="flex flex-col items-center space-y-14 mx-auto max-w-5xl mt-10 md:mt-16">
//           <div className="flex items-center justify-center space-x-4 lg:space-x-16">
//             {/* Step 1 */}
//             <div className="flex flex-col items-center">
//               <div className="w-10 h-10 rounded-full bg-[#6b493d] flex justify-center items-center">
//                 <span className="text-white font-bold">1</span>
//               </div>
//               <p className="mt-4 font-semibold text-[#6b493d] text-center">Find Your Pet</p>
//               <p className="text-sm text-[#6b493d] text-center">Select a pet from our adoption list.</p>
//             </div>

//             {/* Horizontal Line */}
//             <div className="h-1 w-16 lg:w-24 bg-[#6b493d]"></div>

//             {/* Step 2 */}
//             <div className="flex flex-col items-center">
//               <div className="w-10 h-10 rounded-full bg-[#6b493d] flex justify-center items-center">
//                 <span className="text-white font-bold">2</span>
//               </div>
//               <p className="mt-4 font-semibold text-[#6b493d] text-center">Know Your Pet</p>
//               <p className="text-sm text-[#6b493d] text-center">Schedule a visit with the chosen one.</p>
//             </div>

//             {/* Horizontal Line */}
//             <div className="h-1 w-16 lg:w-24 bg-[#6b493d]"></div>

//             {/* Step 3 */}
//             <div className="flex flex-col items-center">
//               <div className="w-10 h-10 rounded-full bg-[#6b493d] flex justify-center items-center">
//                 <span className="text-white font-bold">3</span>
//               </div>
//               <p className="mt-4 font-semibold text-[#6b493d] text-center">Take Your Pet Home</p>
//               <p className="text-sm text-[#6b493d] text-center">Follow the adoption process.</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default HowItWorks;

import React from "react";
import { motion } from "framer-motion";

const steps = [
  {
    id: 1,
    title: "Find Your Pet",
    description: "Browse our adoption list and discover your perfect companion.",
  },
  {
    id: 2,
    title: "Know Your Pet",
    description: "Schedule a fun meet-and-greet to connect with your chosen pet.",
  },
  {
    id: 3,
    title: "Take Your Pet Home",
    description: "Complete the adoption process and welcome them into your family.",
  },
];

const HowItWorks = () => {
  return (
    <section className="relative py-16 bg-[#f5f3ed] overflow-hidden">
      {/* Animated background shapes */}
      <motion.div
        className="absolute -top-20 -left-20 w-72 h-72 bg-[#6b493d]/10 rounded-full blur-3xl"
        animate={{ x: [0, 40, -40, 0], y: [0, 30, -30, 0] }}
        transition={{ repeat: Infinity, duration: 12 }}
      />
      <motion.div
        className="absolute bottom-0 -right-20 w-80 h-80 bg-[#6b493d]/5 rounded-full blur-3xl"
        animate={{ x: [0, -40, 40, 0], y: [0, -20, 20, 0] }}
        transition={{ repeat: Infinity, duration: 10 }}
      />

      <h2 className="relative text-4xl md:text-5xl font-extrabold text-center text-[#6b493d] mb-14 tracking-wide">
        How It Works
      </h2>

      {/* Mobile Layout (vertical cards) */}
      <div className="md:hidden px-6 flex flex-col gap-10">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            className="bg-white rounded-2xl shadow-lg p-6 text-center border border-[#6b493d]/10"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.3, duration: 0.6, ease: "easeOut" }}
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-[#6b493d] flex justify-center items-center shadow-md">
              <span className="text-white font-bold text-lg">{step.id}</span>
            </div>
            <h3 className="mt-4 font-semibold text-[#6b493d] text-xl">
              {step.title}
            </h3>
            <p className="text-sm text-[#6b493d]/80 mt-2">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Desktop Layout (timeline style) */}
      <div className="hidden md:flex justify-center mt-20">
        <motion.div
          className="relative flex items-center justify-between w-full max-w-5xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.4 } },
          }}
        >
          {/* Connecting line */}
          <motion.div
            className="absolute top-1/2 left-0 right-0 h-1 bg-[#6b493d]/30 -z-10"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />

          {steps.map((step) => (
            <motion.div
              key={step.id}
              className="flex flex-col items-center group relative bg-white rounded-xl shadow-lg p-6 w-64 border border-[#6b493d]/10 hover:shadow-xl hover:scale-105 transition-all duration-300"
              variants={{
                hidden: { opacity: 0, y: 50 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="w-14 h-14 rounded-full bg-[#6b493d] flex justify-center items-center shadow-md group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-lg">{step.id}</span>
              </div>
              <h3 className="mt-4 font-semibold text-[#6b493d] text-xl">
                {step.title}
              </h3>
              <p className="text-sm text-[#6b493d]/80 mt-2 text-center">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;