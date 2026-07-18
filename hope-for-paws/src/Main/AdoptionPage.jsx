import { useState } from 'react';
import { Link } from 'react-router-dom';
import AdoptionList from './AdoptionList';
import CreateAdoptionAdForm from './AdoptionForm';
const AdoptionPage = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [petFilter, setPetFilter] = useState('all');
  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));

  return (
    <div className="min-h-screen bg-[#e2d6cb]/10 pb-12">
      {/* Hero Section */}
      <div className="bg-[#8B5A2B] text-white py-12 mb-0 shadow-md">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Find Your Perfect Companion</h1>
            <p className="text-lg mb-8 text-[#e2d6cb]">Connecting loving homes with pets in need</p>
            {user ? (
              <button
                onClick={() => setIsCreating(!isCreating)}
                className="px-6 py-3 rounded-lg bg-white text-[#6F4C3E] font-medium shadow-md hover:bg-[#e2d6cb] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              >
                {isCreating ? 'Cancel' : 'Create Adoption Ad'}
              </button>
            ) : (
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-[#6F4C3E] font-medium shadow-md hover:bg-[#e2d6cb] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              >
                Sign in to Post
              </Link>
            )}
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
        
        <div className="mx-auto mb-8 mt-8 flex max-w-6xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e8dcc8] bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-bold text-[#4E3B31]">Available pets</h2>
          <div className="flex flex-wrap gap-2">
            {['all', 'dog', 'cat', 'other'].map((id) => (
              <button
                key={id}
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  petFilter === id
                    ? 'bg-[#6b493d] text-white shadow-sm'
                    : 'border border-[#e8dcc8] bg-[#faf6f0] text-[#6F4C3E] hover:border-[#a07855] hover:bg-[#f5ebe0]'
                }`}
                onClick={() => setPetFilter(id)}
              >
                {id === 'all' ? 'All pets' : id === 'dog' ? 'Dogs' : id === 'cat' ? 'Cats' : 'Other'}
              </button>
            ))}
          </div>
        </div>

        <AdoptionList filter={petFilter} />
      </div>
    </div>
  );
};

export default AdoptionPage;
