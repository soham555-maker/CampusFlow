"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

interface FilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  className?: string;
}

export default function FilterDropdown({
  value,
  onChange,
  options,
  placeholder = "Filter…",
  className,
}: FilterDropdownProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "input-glass h-9 text-sm appearance-none pr-8 cursor-pointer",
          !value && "text-gray-500"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0a0a0f]">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
      />
    </div>
  );
}
