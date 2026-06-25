"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/utils/cn";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-glass pl-9 pr-8 h-9 text-sm"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
