"use client";

import {
  CalendarRange,
  GitPullRequestClosed,
  ScanLine,
  Map,
  MonitorPlay,
  Lock,
} from "lucide-react";
import { ReactNode } from "react";
import { Reveal, SectionGlow } from "./primitives";

/** Only forward-looking features get a pill; everything else is simply available. */
function StatusPill({ status }: { status: "live" | "roadmap" }) {
  if (status === "live") return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-400/12 px-2.5 py-1 text-[10.5px] font-medium text-violet-200 ring-1 ring-inset ring-violet-300/15">
      On the roadmap
    </span>
  );
}

function Tile({
  className,
  icon: Icon,
  title,
  desc,
  status,
  children,
  delay = 0,
}: {
  className?: string;
  icon: typeof CalendarRange;
  title: string;
  desc: string;
  status: "live" | "roadmap";
  children?: ReactNode;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className={className}>
      <div className="glass-soft glass-sheen group flex h-full flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.06] hover:shadow-[0_22px_46px_-26px_rgba(139,92,246,0.7)]">
        <div className="mb-4 flex items-center justify-between">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-400/25 transition-colors duration-300 group-hover:bg-violet-500/25">
            <Icon className="h-[19px] w-[19px]" />
          </span>
          <StatusPill status={status} />
        </div>
        <h3 className="font-display text-lg font-semibold tracking-tight text-white">
          {title}
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-white/65">{desc}</p>
        {children && <div className="mt-5 flex-1">{children}</div>}
      </div>
    </Reveal>
  );
}

/* Flagship visual — an overlap that the constraint rejects. */
function OverlapVisual() {
  return (
    <div className="relative rounded-xl border border-white/[0.07] bg-black/20 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-violet-400/35 bg-violet-500/20 px-3 py-2.5">
          <div className="text-[12px] font-semibold text-violet-50">OS Lab</div>
          <div className="text-[10.5px] text-violet-100/70">Lab-3 · 11:00–13:00</div>
        </div>
        <div className="relative rounded-lg border border-dashed border-amber-300/50 bg-amber-400/[0.07] px-3 py-2.5">
          <div className="text-[12px] font-semibold text-amber-100/90">Workshop</div>
          <div className="text-[10.5px] text-amber-100/60">Lab-3 · 12:00–14:00</div>
          <div className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-[#1a1205]">
            <GitPullRequestClosed className="h-3 w-3" strokeWidth={2.5} />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-400/[0.08] px-3 py-2 font-mono text-[11px] text-amber-200/90">
        <span className="text-amber-300">✕</span>
        conflicting_class · insert rejected at DB
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section
      id="features"
      className="relative mx-auto max-w-6xl scroll-mt-28 px-5 py-24 sm:px-8 sm:py-28"
    >
      <SectionGlow className="right-[4%] top-[8%] h-[46vh] w-[46vh] bg-violet-600/20" />

      <Reveal className="max-w-2xl">
        <h2 className="font-display text-balance text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-white">
          Everything a campus runs on, in one calm surface
        </h2>
        <p className="mt-4 max-w-xl text-pretty text-[1.02rem] leading-relaxed text-white/65">
          Some of it ships today; some is on a roadmap we’re honest about.
          Either way, it’s one coherent system — not a drawer of disconnected
          tools.
        </p>
      </Reveal>

      <div className="mt-12 grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Tile
          className="lg:col-span-3 lg:row-span-2"
          icon={GitPullRequestClosed}
          title="Conflict-free by construction"
          desc="Overlapping bookings can't even be inserted. Postgres EXCLUDE constraints with int4range reject clashes at the database itself — not in a nightly report after the damage is done."
          status="live"
          delay={0}
        >
          <OverlapVisual />
        </Tile>

        <Tile
          className="lg:col-span-3"
          icon={CalendarRange}
          title="A timetable that renders reality"
          desc="Variable-length slots, absolute-positioned and accurate to the minute — the exact grid students, teachers, and admins all act on."
          status="live"
          delay={0.05}
        />

        <Tile
          className="lg:col-span-3"
          icon={Lock}
          title="Secure, role-based access"
          desc="Roles resolve server-side and Row-Level Security guards every table, so people only ever read and write the rows that are theirs."
          status="live"
          delay={0.1}
        />

        <Tile
          className="lg:col-span-2"
          icon={ScanLine}
          title="OCR timetable ingestion"
          desc="Drop in a PDF or photo of a printed timetable and lift it straight into structured, conflict-checked slots."
          status="roadmap"
          delay={0.05}
        />

        <Tile
          className="lg:col-span-2"
          icon={Map}
          title="Live campus map"
          desc="An interactive map that reads the live timetable to show which rooms are occupied right now."
          status="roadmap"
          delay={0.1}
        />

        <Tile
          className="lg:col-span-2"
          icon={MonitorPlay}
          title="Virtual classroom"
          desc="Announcements, assignments, and grading in the same place the schedule already lives."
          status="roadmap"
          delay={0.15}
        />
      </div>
    </section>
  );
}
