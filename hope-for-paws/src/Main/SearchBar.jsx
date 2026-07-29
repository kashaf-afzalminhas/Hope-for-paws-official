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
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "relative flex items-center transition-all duration-300 ease-out",
          "bg-white rounded-2xl border shadow-sm",
          isFocused
            ? "border-[#a07855] shadow-[0_0_0_4px_rgba(160,120,85,0.12)]"
            : "border-[#e5d9c8] hover:border-[#a07855]/50 hover:shadow-md",
          disabled && "opacity-60 cursor-not-allowed",
          className
        )}
      >
        <div className="absolute left-3.5 flex items-center justify-center pointer-events-none">
          <Search
            size={16}
            strokeWidth={2.25}
            className={cn(
              "transition-colors duration-200",
              disabled ? "text-[#a07855]/40" :
              isFocused ? "text-[#a07855]" : "text-[#a07855]/60"
            )}
          />
        </div>

        <input
          type="text"
          disabled={disabled}
          className={cn(
            "w-full bg-transparent border-none rounded-2xl py-2.5 pl-10 pr-10 outline-none",
            "font-medium text-[#2c1810] placeholder:text-[#a07855]/55",
            "text-sm tracking-wide",
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
              "absolute right-2 p-1.5 rounded-full transition-all duration-200",
              "flex items-center justify-center",
              "hover:bg-[#f0e6d8] active:scale-90",
              disabled ? "text-[#a07855]/40" : "text-[#a07855]/70 hover:text-[#a07855]"
            )}
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </form>
    </div>
  );
};

export default SearchBar;