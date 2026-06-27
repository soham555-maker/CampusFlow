"use client";

import { cn } from "@/utils/cn";
import { motion } from "framer-motion";

interface Tab {
  id: string;
  label: string;
  icon?: React.ElementType;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex gap-1 glass-panel rounded-xl p-1", className)}>
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
              active ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/[0.03]"
            )}
          >
            {active && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-white/[0.06] rounded-lg border border-white/10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {Icon && <Icon size={15} />}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    active
                      ? "bg-purple-500/20 text-purple-300"
                      : "bg-white/5 text-gray-500"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
