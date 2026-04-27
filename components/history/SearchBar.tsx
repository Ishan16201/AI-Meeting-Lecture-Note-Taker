"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize with URL param if exists
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Update URL when debounced value changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (debouncedSearchTerm.trim()) {
      params.set("q", debouncedSearchTerm.trim());
    } else {
      params.delete("q");
    }

    // Update URL without page reload
    const newUrl = params.toString() 
      ? `?${params.toString()}` 
      : window.location.pathname;
    
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearchTerm, router, searchParams]);

  const handleClear = () => {
    setSearchTerm("");
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-white/40" />
      </div>
      
      <input
        type="text"
        placeholder="Search meetings..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="block w-full pl-10 pr-10 py-3 bg-white/[0.02] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all duration-200"
      />
      
      {searchTerm && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] rounded"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
