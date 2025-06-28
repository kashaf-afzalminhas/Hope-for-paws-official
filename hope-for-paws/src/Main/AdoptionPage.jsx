import React, { useState, useEffect } from 'react';
import { useAdoption } from '../context/AdoptionContext';
import { useAuth } from '../context/AuthContext';
import AdoptionList from './AdoptionList';
import CreateAdoptionAdForm from './AdoptionForm';

const AdoptionPage = () => {
  const { loading, error, fetchAllAdoptionPosts } = useAdoption();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  // Refresh adoption posts when user changes or after successful creation
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchAllAdoptionPosts();
    }
  }, [isAuthenticated, authLoading]);

  // Show loading state while authentication is being initialized
  if (authLoading) {
    return (
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
            <h2 className="text-2xl font-bold text-[#4E3B31] mb-4">Initializing...</h2>
            
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
  }

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
      <div className="bg-[#8B5A2B] text-white py-12 mb-8 shadow-md">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Find Your Perfect Companion</h1>
            <p className="text-lg mb-8 text-[#e2d6cb]">Connecting loving homes with pets in need</p>
            
            {isAuthenticated ? (
              <button 
                onClick={() => setIsCreating(!isCreating)}
                className="px-6 py-3 rounded-lg bg-white text-[#6F4C3E] font-medium shadow-md hover:bg-[#e2d6cb] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              >
                {isCreating ? 'Cancel' : 'Create Adoption Ad'}
              </button>
            ) : (
              <div className="text-center">
                <p className="text-[#e2d6cb] mb-4">Log in to create adoption posts</p>
                <a 
                  href="/login" 
                  className="px-6 py-3 rounded-lg bg-white text-[#6F4C3E] font-medium shadow-md hover:bg-[#e2d6cb] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                >
                  Log In
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        {/* Form Section */}
        {isCreating && isAuthenticated && (
          <div className="max-w-3xl mx-auto mb-12 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-[#4E3B31] text-white py-4 px-6">
              <h2 className="text-xl font-semibold">Create a New Adoption Advertisement</h2>
            </div>
            <div className="p-6">
              <CreateAdoptionAdForm onSuccess={() => {
                setIsCreating(false);
                fetchAllAdoptionPosts(); // Refresh the list after successful creation
              }} />
            </div>
          </div>
        )}
        
        {/* Filter Bar - Optional, can be implemented later */}
        <div className="max-w-6xl mx-auto mb-8 bg-white rounded-lg shadow-md p-4 flex flex-wrap items-center justify-between">
          <h2 className="text-2xl font-bold text-[#4E3B31] mb-2 md:mb-0">Available Pets</h2>
          
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 rounded-md bg-[#e2d6cb] text-[#6F4C3E] hover:bg-[#d6c7b8] transition-colors">
              All Pets
            </button>
            <button className="px-4 py-2 rounded-md text-[#8B5A2B] hover:bg-[#e2d6cb] transition-colors">
              Dogs
            </button>
            <button className="px-4 py-2 rounded-md text-[#8B5A2B] hover:bg-[#e2d6cb] transition-colors">
              Cats
            </button>
            <button className="px-4 py-2 rounded-md text-[#8B5A2B] hover:bg-[#e2d6cb] transition-colors">
              Other Pets
            </button>
          </div>
        </div>
        
        {/* Main Content - Adoption List */}
        <AdoptionList />
      </div>
    </div>
  );
};

export default AdoptionPage;
