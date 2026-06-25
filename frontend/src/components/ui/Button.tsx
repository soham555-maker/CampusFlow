"use client";

import { cn } from "@/utils/cn";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const sizeClass = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  }[size];

  const variantClass = {
    primary: "btn-primary",
    ghost: "btn-ghost",
    danger:
      "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors",
  }[variant];

  return (
    <button
      className={cn(
        variantClass,
        sizeClass,
        "font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
