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
    <div className="w-full max-w-xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "relative flex items-center transition-all duration-300 ease-in-out",
          "bg-white rounded-xl border-2 shadow-md",
          "focus-within:ring-2 focus-within:ring-[#a07855]/20 focus-within:border-[#a07855]",
          "hover:shadow-lg hover:border-[#a07855]/60",
          disabled && "opacity-60 cursor-not-allowed",
          isFocused ? "border-[#a07855] shadow-lg" : "border-[#e5d9c8]",
          className
        )}
      >
        <div className="absolute left-3 flex items-center justify-center">
          <Search
            size={16}
            className={cn(
              "transition-colors duration-200",
              disabled ? "text-[#a07855]/40" :
              isFocused ? "text-[#a07855]" : "text-[#a07855]/70"
            )}
          />
        </div>

        <input
          type="text"
          disabled={disabled}
          className={cn(
            "w-full bg-transparent border-none rounded-xl py-2.5 pl-10 pr-10 outline-none",
            "font-medium text-[#2c1810] placeholder:text-[#a07855]/60",
            "text-sm sm:text-base tracking-wide",
            "transition-all duration-200",
            disabled && "cursor-not-allowed",
            "focus:placeholder:text-[#a07855]/40"
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
              "absolute right-2 p-1.5 rounded-lg transition-all duration-200",
              "flex items-center justify-center",
              "hover:bg-[#f0e6d8] active:scale-95",
              disabled
                ? "text-[#a07855]/40"
                : "text-[#a07855]/70 hover:text-[#a07855] hover:shadow-sm"
            )}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </form>
    </div>
  );
};

export default SearchBar;