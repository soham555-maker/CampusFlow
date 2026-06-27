"use client";

import { cn } from "@/utils/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export type DayTone = "violet" | "indigo" | "amber";

export interface CalendarMark {
  day: number;
  tone?: DayTone;
}

export interface CalendarViewProps {
  monthLabel?: string;
  /** Days in the month (28–31). */
  daysInMonth?: number;
  /** Weekday index (0 = Mon … 6 = Sun) that day 1 falls on. */
  startWeekday?: number;
  /** Day-of-month to highlight as "today". */
  today?: number;
  /** Days that have scheduled classes. */
  marks?: CalendarMark[];
  /** Small caption under the grid, e.g. "3 classes today". */
  caption?: string;
  className?: string;
}

const DOT: Record<DayTone, string> = {
  violet: "bg-violet-300",
  indigo: "bg-indigo-300",
  amber: "bg-amber-300",
};

/**
 * Month calendar over the timetable. Presentational + reusable: pass real
 * marks/today from Supabase in-app, or rely on the sample defaults on the
 * marketing page.
 */
export default function CalendarView({
  monthLabel = "September",
  daysInMonth = 30,
  startWeekday = 0,
  today = 18,
  marks = [
    { day: 4 },
    { day: 9, tone: "indigo" },
    { day: 11 },
    { day: 16, tone: "amber" },
    { day: 18 },
    { day: 19, tone: "indigo" },
    { day: 24 },
    { day: 26, tone: "indigo" },
  ],
  caption = "3 classes today",
  className,
}: CalendarViewProps) {
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const markMap = new Map<number, DayTone>(
    marks.map((m) => [m.day, m.tone ?? "violet"])
  );

  return (
    <div className={cn("glass-frost rounded-2xl p-4 sm:p-5", className)}>
      {/* Header */}
      <div className="mb-3.5 flex items-center justify-between">
        <div className="font-display text-sm font-semibold text-white">
          {monthLabel}
        </div>
        <div className="flex items-center gap-1">
          <span className="grid h-6 w-6 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/10 hover:text-white/80">
            <ChevronLeft className="h-3.5 w-3.5" />
          </span>
          <span className="grid h-6 w-6 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/10 hover:text-white/80">
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {/* Weekday row */}
      <div className="mb-1.5 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-white/35">
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="h-9" />;
          const isToday = d === today;
          const tone = markMap.get(d);
          return (
            <div
              key={i}
              className={cn(
                "relative grid h-9 place-items-center rounded-lg text-[12px] tabular-nums transition-colors",
                isToday
                  ? "bg-violet-500/90 font-semibold text-white shadow-[0_4px_14px_-4px_rgba(139,92,246,0.9)]"
                  : tone
                    ? "bg-white/[0.05] text-white/80"
                    : "text-white/45"
              )}
            >
              {d}
              {tone && !isToday && (
                <span
                  className={cn(
                    "absolute bottom-1 h-1 w-1 rounded-full",
                    DOT[tone]
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {caption && (
        <div className="mt-3.5 flex items-center gap-2 border-t border-white/[0.07] pt-3 text-[11.5px] text-white/55">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_1px_rgba(167,139,250,0.7)]" />
          {caption}
        </div>
      )}
    </div>
  );
}
