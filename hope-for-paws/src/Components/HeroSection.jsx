// src/components/HeroSection.jsx
import React from 'react';
import CatImage from '../assets/DOG1.png';

const HeroSection = () => {
  return (
    <section className="bg-[#c9a280] w-full relative overflow-hidden">
      <div className="container mx-auto px-4 pt-16 md:pt-20">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="w-full md:w-1/2 text-left pb-12 md:pb-16 md:pl-6 lg:pl-16 xl:pl-24 z-10">
            <h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              <span className="text-black">Adopt.</span> 
              <span className="text-[#6b493d] italic"> Don't Shop.</span>
            </h1>
            <p 
              className="text-xl sm:text-2xl font-bold text-[#a07855]"
              style={{ fontFamily: '"Poppins", sans-serif' }}
            >
              Find your new best friend today.
            </p>
          </div>
          
          <div className="w-full md:w-1/2 mt-8 md:mt-0 flex justify-center md:justify-end z-10">
            <img 
              src={CatImage} 
              alt="Adopt a Dog" 
              className="w-2/3 md:w-3/4 lg:w-2/3 xl:w-1/2 object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;