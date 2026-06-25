"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { GraduationCap, Presentation, ShieldCheck, Check } from "lucide-react";
import { Reveal, EASE, SectionGlow } from "./primitives";
import { RoleBoard, type RoleId } from "./mockups";
import { cn } from "@/utils/cn";

const ROLES: {
  id: RoleId;
  label: string;
  icon: typeof GraduationCap;
  title: string;
  copy: string;
  points: string[];
}[] = [
  {
    id: "student",
    label: "Student",
    icon: GraduationCap,
    title: "Your week, always current",
    copy: "Classes, rooms, assignments, and marks update the moment they change — no group-chat archaeology to find out where you're meant to be.",
    points: ["Live timetable & room changes", "Assignments and marks in one place", "Today's next class, front and centre"],
  },
  {
    id: "teacher",
    label: "Teacher",
    icon: Presentation,
    title: "Teach, don't untangle logistics",
    copy: "Your schedule and your classes in a single view, with availability that stays accurate. Move a class and CampusFlow checks the clash before you commit.",
    points: ["Per-class rosters & schedule", "Availability synced automatically", "Reschedule with instant clash checks"],
  },
  {
    id: "admin",
    label: "Admin",
    icon: ShieldCheck,
    title: "Run the campus from one console",
    copy: "Provision rosters, build the master timetable, and let the database catch every overlap at insert time. Role-based access keeps the right data with the right people.",
    points: ["Students, teachers, classrooms CRUD", "Conflicts caught at the DB level", "Row-Level Security on every table"],
  },
];

export default function Roles() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<RoleId>("student");
  const role = ROLES.find((r) => r.id === active)!;

  return (
    <section id="roles" className="relative mx-auto max-w-6xl scroll-mt-28 px-5 py-24 sm:px-8 sm:py-32">
      <SectionGlow className="left-[0%] top-[14%] h-[44vh] w-[44vh] bg-indigo-600/18" />

      <Reveal className="max-w-2xl">
        <h2 className="font-display text-balance text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-white">
          One platform, three points of view
        </h2>
        <p className="mt-4 max-w-xl text-pretty text-[1.02rem] leading-relaxed text-white/60">
          Everyone signs in once and sees exactly what they need — rendered from
          the same source of truth, guarded by their role.
        </p>
      </Reveal>

      <Reveal delay={0.08} className="mt-10">
        <div className="glass-soft glass-sheen rounded-3xl p-2 sm:p-3">
          {/* Segmented control */}
          <div className="flex gap-1.5 rounded-2xl bg-black/20 p-1.5">
            {ROLES.map((r) => {
              const on = r.id === active;
              return (
                <button
                  key={r.id}
                  onClick={() => setActive(r.id)}
                  className={cn(
                    "relative flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-200",
                    on ? "text-white" : "text-white/55 hover:text-white/80"
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="roleSeg"
                      transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
                      className="absolute inset-0 rounded-xl bg-violet-500/22 ring-1 ring-inset ring-violet-400/40"
                    />
                  )}
                  <r.icon className="relative h-4 w-4" />
                  <span className="relative">{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-2 lg:items-center lg:gap-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${active}-copy`}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.34, ease: EASE }}
              >
                <h3 className="font-display text-2xl font-semibold tracking-tight text-white">
                  {role.title}
                </h3>
                <p className="mt-3 text-pretty leading-relaxed text-white/60">
                  {role.copy}
                </p>
                <ul className="mt-6 space-y-3">
                  {role.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-3 text-[14.5px] text-white/80">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-500/20 text-violet-300">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${active}-board`}
                initial={reduce ? false : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.34, ease: EASE }}
                className="glass-matte rounded-2xl p-4 sm:p-5"
              >
                <RoleBoard role={active} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
