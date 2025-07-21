import { useState } from 'react';
import { useAdoption } from '../context/AdoptionContext';
import AdoptionList from './AdoptionList';
import CreateAdoptionAdForm from './AdoptionForm';

const AdoptionPage = () => {
  const { loading, error } = useAdoption();
  const [isCreating, setIsCreating] = useState(false);
  const [petFilter, setPetFilter] = useState('all');

  if (loading.all) return (
    <div className="min-h-screen bg-[#e2d6cb]/10">
      <div className="bg-[#8B5A2B] text-white py-12 mb-8 shadow-md">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Find Your Perfect Companion</h1>
            <p className="text-lg mb-8 text-[#e2d6cb]">Connecting loving homes with pets in need</p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto mb-8 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-2xl font-bold text-[#4E3B31] mb-4">Loading available pets...</h2>
          
          {/* Skeleton UI for loading state */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden shadow-lg">
                <div className="h-64 bg-gray-200 animate-pulse"></div>
                <div className="p-5">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  
  if (error.all) return (
    <div className="container mx-auto px-4 py-10">
      <div className="bg-red-100 text-red-700 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p>{error.all}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#e2d6cb]/10 pb-12">
      {/* Hero Section */}
      <div className="bg-[#8B5A2B] text-white py-12 mb-0 shadow-md">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Find Your Perfect Companion</h1>
            <p className="text-lg mb-8 text-[#e2d6cb]">Connecting loving homes with pets in need</p>
            <button 
              onClick={() => setIsCreating(!isCreating)}
              className="px-6 py-3 rounded-lg bg-white text-[#6F4C3E] font-medium shadow-md hover:bg-[#e2d6cb] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            >
              {isCreating ? 'Cancel' : 'Create Adoption Ad'}
            </button>
          </div>
        </div>
      </div>
      {/* Disclaimer Banner - now flush below hero section */}
      <div className="w-full bg-yellow-100 border-b border-yellow-300 py-3 px-4 flex items-center justify-center shadow-sm">
        <span className="text-yellow-900 text-sm font-medium text-center">
          ⚠️ Note: All adoption ads are user-generated. Please verify all information independently. We maintain a neutral stance in all third-party interactions between adopters and pet owners.
        </span>
      </div>
      
      <div className="container mx-auto px-4">
        {/* Form Section */}
        {isCreating && (
          <div className="max-w-3xl mx-auto mb-12 mt-10 bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#e2d6cb]">
            <div className="bg-gradient-to-r from-[#8B5A2B] to-[#4E3B31] text-white py-6 px-8 rounded-t-2xl">
              <h2 className="text-2xl font-bold tracking-tight">Create a New Adoption Advertisement</h2>
            </div>
            <div className="p-8 sm:p-10">
              <CreateAdoptionAdForm />
            </div>
          </div>
        )}
        
        {/* Filter Bar - Optional, can be implemented later */}
        <div className="max-w-6xl mx-auto mb-8 mt-8 bg-white rounded-lg shadow-md p-4 flex flex-wrap items-center justify-between">
          <h2 className="text-2xl font-bold text-[#4E3B31] mb-2 md:mb-0">Available Pets</h2>
          
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-md transition-colors font-medium ${petFilter === 'all' ? 'bg-[#e2d6cb] text-[#6F4C3E]' : 'text-[#8B5A2B] hover:bg-[#e2d6cb]'}`}
              onClick={() => setPetFilter('all')}
            >
              All Pets
            </button>
            <button
              className={`px-4 py-2 rounded-md transition-colors font-medium ${petFilter === 'dog' ? 'bg-[#e2d6cb] text-[#6F4C3E]' : 'text-[#8B5A2B] hover:bg-[#e2d6cb]'}`}
              onClick={() => setPetFilter('dog')}
            >
              Dogs
            </button>
            <button
              className={`px-4 py-2 rounded-md transition-colors font-medium ${petFilter === 'cat' ? 'bg-[#e2d6cb] text-[#6F4C3E]' : 'text-[#8B5A2B] hover:bg-[#e2d6cb]'}`}
              onClick={() => setPetFilter('cat')}
            >
              Cats
            </button>
            <button
              className={`px-4 py-2 rounded-md transition-colors font-medium ${petFilter === 'other' ? 'bg-[#e2d6cb] text-[#6F4C3E]' : 'text-[#8B5A2B] hover:bg-[#e2d6cb]'}`}
              onClick={() => setPetFilter('other')}
            >
              Other Pets
            </button>
          </div>
        </div>
        
        {/* Main Content - Adoption List */}
        <AdoptionList filter={petFilter} />
      </div>
    </div>
  );
};

export default AdoptionPage;
