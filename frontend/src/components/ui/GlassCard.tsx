"use client";

import { cn } from "@/utils/cn";
import { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export default function GlassCard({
  children,
  className,
  hover = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        hover ? "glass-panel-hover" : "glass-panel",
        "rounded-xl p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
