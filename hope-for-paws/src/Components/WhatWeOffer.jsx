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