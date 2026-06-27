"use client";

import { Database, ShieldCheck, Workflow, Users, CalendarX2, Lock } from "lucide-react";
import { Reveal, SectionGlow } from "./primitives";

const PILLARS = [
  {
    icon: Database,
    title: "Guaranteed at the database",
    copy: "Double-booking isn't checked in app code that can be bypassed — it's a Postgres EXCLUDE constraint. A clashing row simply can't exist.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    copy: "Row-Level Security guards every table, and roles resolve through an auth_role() function server-side. The client never decides what it may read.",
  },
  {
    icon: Workflow,
    title: "The right engine for each job",
    copy: "Next.js handles the UI and simple CRUD over @supabase/ssr; FastAPI takes the heavy logic — conflict checks today, OCR next.",
  },
];

/* Faithful, lightly-trimmed version of the real schema constraint. */
const CODE: { t: string; c?: "kw" | "op" | "fn" | "com" | "str" }[][] = [
  [{ t: "-- a room can't host two classes at once", c: "com" }],
  [{ t: "ALTER TABLE ", c: "kw" }, { t: "timetable_slots" }],
  [{ t: "  ADD CONSTRAINT ", c: "kw" }, { t: "no_classroom_overlap" }],
  [{ t: "  EXCLUDE USING ", c: "kw" }, { t: "gist", c: "fn" }, { t: " (" }],
  [{ t: "    classroom_id " }, { t: "WITH ", c: "kw" }, { t: "=", c: "op" }, { t: "," }],
  [{ t: "    term_id      " }, { t: "WITH ", c: "kw" }, { t: "=", c: "op" }, { t: "," }],
  [{ t: "    day          " }, { t: "WITH ", c: "kw" }, { t: "=", c: "op" }, { t: "," }],
  [
    { t: "    int4range", c: "fn" },
    { t: "(start_min, end_min) " },
    { t: "WITH ", c: "kw" },
    { t: "&&", c: "op" },
  ],
  [{ t: "  );" }],
];

const TOKEN: Record<string, string> = {
  kw: "text-violet-300",
  op: "text-amber-300",
  fn: "text-sky-300",
  com: "text-white/35 italic",
  str: "text-violet-300",
};

const STACK = ["Next.js", "FastAPI", "Supabase", "PostgreSQL", "TypeScript"];

const FACTS = [
  { icon: Users, value: "3", label: "roles, one login" },
  { icon: CalendarX2, value: "0", label: "double-bookings" },
  { icon: Lock, value: "RLS", label: "on every table" },
];

export default function UnderTheHood() {
  return (
    <section
      id="under-the-hood"
      className="relative mx-auto max-w-6xl scroll-mt-28 px-5 py-24 sm:px-8 sm:py-28"
    >
      <SectionGlow className="right-[2%] top-[20%] h-[46vh] w-[46vh] bg-fuchsia-600/14" />

      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Narrative */}
        <div>
          <Reveal>
            <span className="text-[12.5px] font-medium uppercase tracking-[0.18em] text-violet-300/80">
              Under the hood
            </span>
            <h2 className="font-display mt-3 text-balance text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-white">
              Built like infrastructure, not a demo
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-[1.02rem] leading-relaxed text-white/65">
              CampusFlow leans on the database to make whole classes of bugs
              impossible. Here's the part you can't see — and shouldn't have to
              think about.
            </p>
          </Reveal>

          <div className="mt-9 space-y-7">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={0.06 * (i + 1)}>
                <div className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-400/20">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-[1.05rem] font-semibold tracking-tight text-white">
                      {p.title}
                    </h3>
                    <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-white/58">
                      {p.copy}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Code panel + structural facts */}
        <div>
          <Reveal delay={0.12}>
            <div className="glass-matte glass-sheen overflow-hidden rounded-2xl">
              <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <span className="ml-2 font-mono text-[12px] text-white/45">
                  timetable_slots.sql
                </span>
              </div>
              <pre className="overflow-x-auto px-5 py-5 font-mono text-[12.5px] leading-[1.7]">
                <code>
                  {CODE.map((line, li) => (
                    <div key={li} className="flex">
                      <span className="mr-4 w-4 shrink-0 select-none text-right text-white/20">
                        {li + 1}
                      </span>
                      <span className="text-white/80">
                        {line.map((tok, ti) => (
                          <span key={ti} className={tok.c ? TOKEN[tok.c] : ""}>
                            {tok.t}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </code>
              </pre>
              <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] px-5 py-4">
                {STACK.map((s) => (
                  <span
                    key={s}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11.5px] text-white/65"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Structural facts — honest "stats", redesigned as spec cards */}
          <Reveal delay={0.18}>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {FACTS.map((f) => (
                <div key={f.label} className="glass-frost rounded-xl p-3.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-400/20">
                    <f.icon className="h-4 w-4" />
                  </span>
                  <div className="mt-2.5 font-display text-2xl font-semibold tracking-tight text-white">
                    {f.value}
                  </div>
                  <div className="mt-0.5 text-[11.5px] leading-snug text-white/55">
                    {f.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
