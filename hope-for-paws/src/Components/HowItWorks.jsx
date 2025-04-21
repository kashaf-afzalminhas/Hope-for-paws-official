// src/components/HowItWorks.jsx
import React from 'react';

const HowItWorks = () => {
  return (
    <section className="py-12 md:py-16 bg-[#f5f3ed]">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-[#6b493d] mb-8 md:mb-10">
        How It Works
      </h2>

      {/* Mobile & Tablet Layout (stacked) */}
      <div className="md:hidden px-4 mt-8">
        <div className="flex flex-col items-center space-y-12">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-[#6b493d] flex justify-center items-center">
              <span className="text-white font-bold">1</span>
            </div>
            <p className="mt-4 font-semibold text-[#6b493d] text-center">Find Your Pet</p>
            <p className="text-sm text-[#6b493d] text-center">Select a pet from our adoption list.</p>
          </div>

          {/* Vertical Line */}
          <div className="w-1 h-8 bg-[#6b493d]"></div>

          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-[#6b493d] flex justify-center items-center">
              <span className="text-white font-bold">2</span>
            </div>
            <p className="mt-4 font-semibold text-[#6b493d] text-center">Know Your Pet</p>
            <p className="text-sm text-[#6b493d] text-center">Schedule a visit with the chosen one.</p>
          </div>

          {/* Vertical Line */}
          <div className="w-1 h-8 bg-[#6b493d]"></div>

          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-[#6b493d] flex justify-center items-center">
              <span className="text-white font-bold">3</span>
            </div>
            <p className="mt-4 font-semibold text-[#6b493d] text-center">Take Your Pet Home</p>
            <p className="text-sm text-[#6b493d] text-center">Follow the adoption process.</p>
          </div>
        </div>
      </div>

      {/* Desktop Layout (horizontal) */}
      <div className="hidden md:block">
        <div className="flex flex-col items-center space-y-14 mx-auto max-w-5xl mt-10 md:mt-16">
          <div className="flex items-center justify-center space-x-4 lg:space-x-16">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#6b493d] flex justify-center items-center">
                <span className="text-white font-bold">1</span>
              </div>
              <p className="mt-4 font-semibold text-[#6b493d] text-center">Find Your Pet</p>
              <p className="text-sm text-[#6b493d] text-center">Select a pet from our adoption list.</p>
            </div>

            {/* Horizontal Line */}
            <div className="h-1 w-16 lg:w-24 bg-[#6b493d]"></div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#6b493d] flex justify-center items-center">
                <span className="text-white font-bold">2</span>
              </div>
              <p className="mt-4 font-semibold text-[#6b493d] text-center">Know Your Pet</p>
              <p className="text-sm text-[#6b493d] text-center">Schedule a visit with the chosen one.</p>
            </div>

            {/* Horizontal Line */}
            <div className="h-1 w-16 lg:w-24 bg-[#6b493d]"></div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#6b493d] flex justify-center items-center">
                <span className="text-white font-bold">3</span>
              </div>
              <p className="mt-4 font-semibold text-[#6b493d] text-center">Take Your Pet Home</p>
              <p className="text-sm text-[#6b493d] text-center">Follow the adoption process.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;