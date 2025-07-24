// import React, { useState } from 'react';
// import { Search, X } from 'lucide-react';
// import { cn } from '../lib/utils';

// const SearchBar = ({
//   onSearch,
//   placeholder = 'Search...',
//   className,
//   disabled = false,
// }) => {
//   const [query, setQuery] = useState('');

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onSearch(query);
//   };

//   const handleClear = () => {
//     setQuery('');
//     onSearch('');
//   };

//   const handleChange = (e) => {
//     const value = e.target.value;
//     setQuery(value);
//     // Trigger search on each change for real-time filtering
//     onSearch(value);
//   };

//   return (
//     <form 
//       onSubmit={handleSubmit} 
//       className={cn(
//         "relative flex items-center transition-all duration-200",
//         "bg-gray-50 rounded-full border border-gray-300",
//         "focus-within:ring-2 focus-within:ring-highlight focus-within:border-transparent",
//         "hover:border-gray-400",
//         disabled && "opacity-60 cursor-not-allowed",
//         className
//       )}
//     >
//       <Search 
//         size={18} 
//         className={cn(
//           "absolute left-4",
//           disabled ? "text-gray-400" : "text-gray-500"
//         )} 
//       />
      
//       <input
//         type="text"
//         disabled={disabled}
//         className={cn(
//           "w-full bg-transparent border-none rounded-full py-3 pl-11 pr-10 outline-none",
//           "font-body text-gray-800 placeholder-gray-400",
//           "text-sm md:text-base",
//           disabled && "cursor-not-allowed"
//         )}
//         placeholder={placeholder}
//         value={query}
//         onChange={handleChange}
//       />
      
//       {query && (
//         <button
//           type="button"
//           onClick={handleClear}
//           disabled={disabled}
//           className={cn(
//             "absolute right-3 p-1 rounded-full transition-colors",
//             disabled ? "text-gray-400" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
//           )}
//           aria-label="Clear search"
//         >
//           <X size={18} />
//         </button>
//       )}
//     </form>
//   );
// };

// export default SearchBar;

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../lib/utils';

const SearchBar = ({
  onSearch,
  placeholder = 'Search...',
  className,
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn(
        "relative flex items-center transition-all duration-200",
        "bg-[#fff7f0] rounded-xl border",
        "focus-within:ring-2 focus-within:ring-[#a07855]/30",
        disabled && "opacity-60 cursor-not-allowed",
        isFocused ? "border-[#a07855]/60 ring-2 ring-[#a07855]/10" : "border-[#e5d9c8]",
        className
      )}
    >
      <div className="absolute left-4 flex items-center justify-center">
        <Search 
          size={18} 
          className={cn(
            "transition-colors",
            disabled ? "text-[#a07855]/40" : 
            isFocused ? "text-[#a07855]" : "text-[#a07855]/60"
          )} 
        />
      </div>
      
      <input
        type="text"
        disabled={disabled}
        className={cn(
          "w-full bg-transparent border-none rounded-xl py-3.5 pl-11 pr-10 outline-none",
          "font-body text-[#2c1810] placeholder:text-[#a07855]/60",
          "text-base tracking-tight",
          disabled && "cursor-not-allowed"
        )}
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      
      {query && (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className={cn(
            "absolute right-3 p-1.5 rounded-lg transition-all",
            "flex items-center justify-center",
            disabled 
              ? "text-[#a07855]/40" 
              : "text-[#a07855]/60 hover:text-[#a07855] hover:bg-[#f0e6d8] active:scale-95"
          )}
          aria-label="Clear search"
        >
          <X size={18} />
        </button>
      )}
    </form>
  );
};

export default SearchBar;