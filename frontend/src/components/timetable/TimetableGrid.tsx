"use client";

import { cn } from "@/utils/cn";
import { useMemo } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const HOUR_START = 8;
const HOUR_END = 18;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const SLOT_HEIGHT_PX = 60; // pixels per hour

export interface TimetableSlot {
  id: string;
  day: string;
  start_time: string; // "HH:MM:SS"
  end_time: string;
  label: string;
  sublabel?: string;
  color?: string;
}

interface TimetableGridProps {
  slots?: TimetableSlot[];
  loading?: boolean;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesFromStart(t: string): number {
  return timeToMinutes(t) - HOUR_START * 60;
}

const SLOT_COLORS = [
  "bg-purple-500/20 border-purple-500/30 text-purple-300",
  "bg-cyan-500/20 border-cyan-500/30 text-cyan-300",
  "bg-blue-500/20 border-blue-500/30 text-blue-300",
  "bg-pink-500/20 border-pink-500/30 text-pink-300",
  "bg-green-500/20 border-green-500/30 text-green-300",
];

export default function TimetableGrid({ slots = [], loading = false }: TimetableGridProps) {
  const slotsByDay = useMemo(() => {
    const map: Record<string, TimetableSlot[]> = {};
    DAYS.forEach((d) => (map[d] = []));
    slots.forEach((s) => {
      if (map[s.day]) map[s.day].push(s);
    });
    return map;
  }, [slots]);

  const hourLabels = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
    const h = HOUR_START + i;
    return `${h.toString().padStart(2, "0")}:00`;
  });

  if (loading) {
    return (
      <div className="glass-panel rounded-xl p-6">
        <div className="flex gap-2">
          {DAYS.map((d) => (
            <div key={d} className="flex-1 space-y-2">
              <div className="h-5 bg-white/5 rounded animate-pulse" />
              <div className="h-40 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl overflow-auto">
      <div className="flex min-w-[700px]">
        {/* Time column */}
        <div className="w-16 shrink-0 pt-10 border-r border-white/5">
          {hourLabels.map((label) => (
            <div
              key={label}
              className="text-[10px] text-gray-500 text-right pr-2 leading-none"
              style={{ height: `${SLOT_HEIGHT_PX}px` }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((day) => (
          <div key={day} className="flex-1 min-w-0 border-r border-white/5 last:border-0">
            {/* Header */}
            <div className="h-10 flex items-center justify-center border-b border-white/5">
              <span className="text-xs font-medium text-gray-400">{day.slice(0, 3)}</span>
            </div>

            {/* Grid */}
            <div
              className="relative"
              style={{ height: `${TOTAL_HOURS * SLOT_HEIGHT_PX}px` }}
            >
              {/* Hour lines */}
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-white/[0.03]"
                  style={{ top: `${i * SLOT_HEIGHT_PX}px` }}
                />
              ))}

              {/* Slots */}
              {slotsByDay[day].map((slot, idx) => {
                const topMinutes = minutesFromStart(slot.start_time);
                const durationMinutes =
                  timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time);
                const top = (topMinutes / 60) * SLOT_HEIGHT_PX;
                const height = (durationMinutes / 60) * SLOT_HEIGHT_PX;
                const colorClass =
                  slot.color ?? SLOT_COLORS[idx % SLOT_COLORS.length];

                return (
                  <div
                    key={slot.id}
                    className={cn(
                      "absolute left-1 right-1 rounded-md border px-2 py-1 overflow-hidden",
                      colorClass
                    )}
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <p className="text-xs font-medium truncate">{slot.label}</p>
                    {slot.sublabel && (
                      <p className="text-[10px] opacity-70 truncate">{slot.sublabel}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
