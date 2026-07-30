import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../lib/utils';

const SearchBar = ({
  onSearch,
  placeholder = 'Search...',
  className,
  disabled = false,
  dark = false,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => { e.preventDefault(); onSearch(query); };
  const handleClear = () => { setQuery(''); onSearch(''); };
  const handleChange = (e) => { setQuery(e.target.value); onSearch(e.target.value); };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "relative flex items-center transition-all duration-300 ease-out rounded-2xl",
          dark
            ? cn(
                "bg-white/10 backdrop-blur-md border",
                isFocused ? "border-white/40 bg-white/15 shadow-[0_0_0_4px_rgba(255,255,255,0.08)]" : "border-white/15 hover:border-white/25"
              )
            : cn(
                "bg-white border shadow-sm",
                isFocused ? "border-[#a07855] shadow-[0_0_0_4px_rgba(160,120,85,0.12)]" : "border-[#e5d9c8] hover:border-[#a07855]/50 hover:shadow-md"
              ),
          disabled && "opacity-60 cursor-not-allowed",
          className
        )}
      >
        <div className="absolute left-3.5 flex items-center justify-center pointer-events-none">
          <Search size={16} strokeWidth={2.25} className={dark ? "text-white/60" : "text-[#a07855]/60"} />
        </div>
        <input
          type="text"
          disabled={disabled}
          className={cn(
            "w-full bg-transparent border-none rounded-2xl py-3 pl-10 pr-10 outline-none",
            "font-medium text-sm tracking-wide",
            dark ? "text-white placeholder:text-white/50" : "text-[#2c1810] placeholder:text-[#a07855]/55"
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
              "absolute right-2 p-1.5 rounded-full transition-all duration-200 flex items-center justify-center active:scale-90",
              dark ? "text-white/60 hover:text-white hover:bg-white/10" : "text-[#a07855]/70 hover:text-[#a07855] hover:bg-[#f0e6d8]"
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