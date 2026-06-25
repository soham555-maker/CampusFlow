import { ReactNode } from "react";
import { cn } from "@/utils/cn";
import {
  Check,
  GraduationCap,
  Presentation,
  ShieldCheck,
  CalendarClock,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * Week timetable — the hero's primary panel. A detailed 5-day grid    *
 * mirroring the app's real <TimetableGrid /> slot styling.            *
 * ------------------------------------------------------------------ */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const TIMES = ["09", "10", "11", "12", "13", "14", "15"];

type Slot = {
  day: number;
  start: number;
  span: number;
  title: string;
  room: string;
  tone: "violet" | "indigo" | "soft";
};

const SLOTS: Slot[] = [
  { day: 0, start: 0, span: 1, title: "Data Structures", room: "CS-204", tone: "violet" },
  { day: 0, start: 2, span: 2, title: "OS Lab", room: "Lab-3", tone: "indigo" },
  { day: 1, start: 1, span: 1, title: "DBMS", room: "LH-2", tone: "soft" },
  { day: 1, start: 4, span: 1, title: "Mathematics", room: "LH-1", tone: "violet" },
  { day: 2, start: 0, span: 2, title: "Networks Lab", room: "Lab-1", tone: "indigo" },
  { day: 2, start: 3, span: 1, title: "Ethics", room: "LH-4", tone: "soft" },
  { day: 3, start: 1, span: 2, title: "Capstone", room: "Studio", tone: "violet" },
  { day: 3, start: 5, span: 1, title: "Seminar", room: "Aud", tone: "soft" },
  { day: 4, start: 0, span: 1, title: "DBMS", room: "LH-2", tone: "soft" },
  { day: 4, start: 2, span: 1, title: "Data Structures", room: "CS-204", tone: "violet" },
  { day: 4, start: 4, span: 2, title: "Project", room: "CS-Lab", tone: "indigo" },
];

const TONE: Record<Slot["tone"], string> = {
  violet: "bg-violet-500/[0.24] border-violet-400/40 text-violet-50",
  indigo: "bg-indigo-500/[0.22] border-indigo-400/35 text-indigo-50",
  soft: "bg-white/[0.05] border-white/12 text-white/80",
};

export function WeekTimetable({ className }: { className?: string }) {
  return (
    <div className={cn("glass-frost rounded-2xl p-4 sm:p-5", className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-violet-300" />
          <div>
            <div className="font-display text-[15px] font-semibold leading-none text-white">
              This week
            </div>
            <div className="mt-1 text-[11px] leading-none text-white/45">
              Sep 15 – 19
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-400/14 px-2.5 py-1 text-[11px] font-medium text-violet-200">
          <Check className="h-3 w-3" strokeWidth={3} />
          No clashes
        </span>
      </div>

      <div
        className="relative grid gap-x-1.5"
        style={{
          gridTemplateColumns: "30px repeat(5, minmax(0, 1fr))",
          gridTemplateRows: "20px repeat(7, 38px)",
        }}
      >
        {/* Day headers */}
        {DAYS.map((d, i) => (
          <div
            key={d}
            className="flex items-end justify-center pb-1 text-[11px] font-medium text-white/50"
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            {d}
          </div>
        ))}

        {/* Time labels + row hairlines */}
        {TIMES.map((t, i) => (
          <div key={t} className="contents">
            <div
              className="pr-1.5 text-right text-[9.5px] tabular-nums text-white/35"
              style={{ gridColumn: 1, gridRow: i + 2, alignSelf: "start" }}
            >
              {t}
            </div>
            <div
              className="border-t border-white/[0.06]"
              style={{ gridColumn: "2 / -1", gridRow: i + 2 }}
            />
          </div>
        ))}

        {/* Class slots */}
        {SLOTS.map((s, i) => (
          <div
            key={i}
            className={cn(
              "m-0.5 flex flex-col justify-center overflow-hidden rounded-lg border px-1.5 py-1",
              TONE[s.tone]
            )}
            style={{
              gridColumn: s.day + 2,
              gridRow: `${s.start + 2} / span ${s.span}`,
            }}
          >
            <span className="truncate text-[10.5px] font-semibold leading-tight">
              {s.title}
            </span>
            <span className="truncate text-[9px] leading-tight opacity-70">
              {s.room}
            </span>
          </div>
        ))}

        {/* "Now" indicator */}
        <div
          className="pointer-events-none relative"
          style={{ gridColumn: "2 / -1", gridRow: 5 }}
        >
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-violet-400/70" />
          <div className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-300 shadow-[0_0_8px_2px_rgba(167,139,250,0.7)]" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Notification chip — iOS-style toast for the floating hero layer.    *
 * ------------------------------------------------------------------ */

export interface NotifProps {
  icon: typeof CalendarClock;
  title: string;
  sub: string;
  time?: string;
  tone?: "violet" | "amber";
  className?: string;
}

export function NotificationChip({
  icon: Icon,
  title,
  sub,
  time,
  tone = "violet",
  className,
}: NotifProps) {
  return (
    <div className={cn("glass-frost flex items-center gap-3 rounded-2xl px-3.5 py-3", className)}>
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
          tone === "amber"
            ? "bg-amber-400/15 text-amber-300"
            : "bg-violet-500/22 text-violet-200"
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-semibold leading-tight text-white">
            {title}
          </span>
          {time && (
            <span className="shrink-0 text-[10px] leading-tight text-white/40">
              {time}
            </span>
          )}
        </div>
        <div className="truncate text-[11.5px] leading-tight text-white/55">{sub}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Per-role board — used by the interactive role switcher             *
 * ------------------------------------------------------------------ */

export type RoleId = "student" | "teacher" | "admin";

function Row({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
      {children}
    </div>
  );
}

export function RoleBoard({ role }: { role: RoleId }) {
  if (role === "student") {
    return (
      <div className="space-y-2.5">
        <Row>
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-500/20 text-violet-200">
            <GraduationCap className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="text-[12.5px] font-medium text-white">Next · Data Structures</div>
            <div className="text-[11px] text-white/50">10:00 · Room CS-204</div>
          </div>
          <span className="ml-auto rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/60">
            in 25m
          </span>
        </Row>
        <Row>
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          <div className="text-[12.5px] text-white/80">DBMS assignment due Friday</div>
          <span className="ml-auto text-[11px] text-white/45">2 left</span>
        </Row>
        <Row>
          <span className="h-2 w-2 rounded-full bg-violet-400" />
          <div className="text-[12.5px] text-white/80">Marks posted · Networks quiz</div>
          <span className="ml-auto text-[11px] font-medium text-violet-300">18 / 20</span>
        </Row>
      </div>
    );
  }
  if (role === "teacher") {
    return (
      <div className="space-y-2.5">
        <Row>
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-500/20 text-violet-200">
            <Presentation className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="text-[12.5px] font-medium text-white">3 classes today</div>
            <div className="text-[11px] text-white/50">DS · OS Lab · Capstone</div>
          </div>
          <span className="ml-auto rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/60">
            5h teaching
          </span>
        </Row>
        <Row>
          <span className="h-2 w-2 rounded-full bg-violet-400" />
          <div className="text-[12.5px] text-white/80">Free 13:00–15:00</div>
          <span className="ml-auto text-[11px] text-white/45">availability synced</span>
        </Row>
        <Row>
          <CalendarClock className="h-3.5 w-3.5 text-violet-300" />
          <div className="text-[12.5px] text-white/80">Reschedule OS Lab → Lab-2</div>
          <span className="ml-auto text-[11px] font-medium text-violet-300">no clash</span>
        </Row>
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { n: "1,240", l: "Students" },
          { n: "86", l: "Teachers" },
          { n: "52", l: "Classrooms" },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-2"
          >
            <div className="font-display text-base font-semibold text-white">{s.n}</div>
            <div className="text-[10.5px] text-white/50">{s.l}</div>
          </div>
        ))}
      </div>
      <Row>
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-500/20 text-violet-200">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div className="text-[12.5px] text-white/80">Row-Level Security · all tables</div>
        <Check className="ml-auto h-4 w-4 text-violet-300" />
      </Row>
      <Row>
        <span className="h-2 w-2 rounded-full bg-amber-300" />
        <div className="text-[12.5px] text-white/80">7 clashes caught this term</div>
        <span className="ml-auto text-[11px] text-white/45">at insert time</span>
      </Row>
    </div>
  );
}
