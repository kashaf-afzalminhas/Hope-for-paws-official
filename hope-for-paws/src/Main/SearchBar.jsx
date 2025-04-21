import React, { useState } from 'react';

const SearchBar = ({ onSearch, placeholder }) => {
  const [query, setQuery] = useState('');

  // Handle input change and trigger search
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);  // Call the onSearch prop passed from the parent component
  };

  return (
    <div className="flex justify-center w-full p-4 bg-white shadow-sm">
  <input
    type="text"
    className="w-1/2 max-w-lg px-4 py-2 border border-brown-500 rounded-lg shadow-sm focus:outline-none"
    placeholder={placeholder || 'Search...'}
    value={query}
    onChange={handleInputChange}
  />

      {/* Optional: Search Results Dropdown (if needed) */}
      {/* Uncomment the following block if you want to show a list of search results */}
      {/* 
      {query && searchResults.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto z-10">
          {searchResults.map((result, index) => (
            <div key={index} className="p-2 hover:bg-gray-100">
              {result.name} {/* Adjust this to display relevant properties 
            </div>
          ))}
        </div>
      )}
      */}
    </div>
  );
};

export default SearchBar;
