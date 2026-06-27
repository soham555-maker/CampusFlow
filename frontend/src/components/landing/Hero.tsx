"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { CalendarCheck, Clock, MapPin } from "lucide-react";
import { EASE, useTilt } from "./primitives";
import { WeekTimetable, NotificationChip } from "./mockups";
import CalendarView from "@/components/timetable/CalendarView";

export default function Hero() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();

  // 3D tilt + parallax run only on the lg two-column layout. Stacked layouts
  // stay flat and static.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const active = isDesktop && !reduce;

  const tilt = useTilt(5);

  // Depth: the big week panel is the base (furthest back of the cards); the
  // smaller calendar and chips stack in front of it, and so parallax faster.
  const yWeek = useTransform(scrollY, [0, 700], [0, active ? -32 : 0]);
  const rotWeek = useTransform(scrollY, [0, 700], [active ? -9 : 0, active ? -2 : 0]);
  const yCal = useTransform(scrollY, [0, 700], [0, active ? -92 : 0]);
  const rotCal = useTransform(scrollY, [0, 700], [active ? 14 : 0, active ? 5 : 0]);
  const yChip1 = useTransform(scrollY, [0, 700], [0, active ? 88 : 0]);
  const yChip2 = useTransform(scrollY, [0, 700], [0, active ? -104 : 0]);
  const yChip3 = useTransform(scrollY, [0, 700], [0, active ? 60 : 0]);
  const yGlow = useTransform(scrollY, [0, 700], [0, active ? 40 : 0]);
  const fade = useTransform(scrollY, [160, 700], [1, 0.18]);

  const containerV = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };
  const itemV = {
    hidden: reduce ? {} : { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
  };

  return (
    <section className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-center px-5 pb-20 pt-32 sm:px-8 lg:pt-28">
      <div className="grid items-center gap-x-10 gap-y-16 lg:grid-cols-[1.04fr_0.96fr]">
        {/* ---- Copy ---- */}
        <motion.div variants={containerV} initial="hidden" animate="show">
          <motion.div variants={itemV}>
            <span className="glass-soft inline-flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3.5 text-[12.5px] text-white/75">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
              </span>
              Campus management platform
            </span>
          </motion.div>

          <motion.h1
            variants={itemV}
            className="font-display mt-5 text-balance font-semibold leading-[0.98] tracking-[-0.03em] text-white"
            style={{ fontSize: "clamp(2.7rem, 6vw, 4.6rem)" }}
          >
            The whole campus,
            <br className="hidden sm:block" /> finally in{" "}
            <span className="relative whitespace-nowrap text-violet-300">
              sync
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M2 9C40 4 160 3 198 7" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.7" />
              </svg>
            </span>
            .
          </motion.h1>

          <motion.p
            variants={itemV}
            className="mt-6 max-w-[34rem] text-pretty text-[1.05rem] leading-relaxed text-white/70"
          >
            CampusFlow unifies timetables, classrooms, and people into one
            platform that refuses to double-book — a single source of truth for
            students, teachers, and admins.
          </motion.p>

          <motion.div variants={itemV} className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="group inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-violet-500 px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_34px_-8px_rgba(139,92,246,0.95)] transition-all duration-200 hover:bg-violet-400 hover:shadow-[0_16px_42px_-8px_rgba(139,92,246,1)]"
            >
              Create your account
              <svg viewBox="0 0 16 16" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none">
                <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="glass-soft inline-flex cursor-pointer items-center rounded-2xl px-6 py-3.5 text-[15px] font-medium text-white/85 transition-colors duration-200 hover:text-white"
            >
              Sign in
            </Link>
          </motion.div>
        </motion.div>

        {/* ---- 3D product scene ---- */}
        <motion.div
          style={{ perspective: 1500, opacity: active ? fade : 1 }}
          className="relative mx-auto mt-2 w-full max-w-md lg:mt-0 lg:max-w-none"
        >
          <motion.div
            onMouseMove={active ? tilt.onMove : undefined}
            onMouseLeave={active ? tilt.onLeave : undefined}
            style={{
              rotateX: active ? tilt.rotateX : 0,
              rotateY: active ? tilt.rotateY : 0,
              transformStyle: "preserve-3d",
            }}
            className="relative"
          >
            {/* Far layer — violet glow tied into the scene (background relation) */}
            <motion.div
              aria-hidden="true"
              style={{ y: yGlow, z: active ? -150 : 0 }}
              className="absolute left-[6%] top-[8%] h-[86%] w-[86%] rounded-[40%] bg-[radial-gradient(circle,rgba(139,92,246,0.42),transparent_64%)] blur-[46px]"
            />

            {/* Week timetable — LARGEST, sits at the back as the base panel */}
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
              style={{ y: yWeek, rotateY: rotWeek, rotateX: active ? 6 : 0, rotateZ: active ? -3.5 : 0, z: active ? -44 : 0 }}
              className="relative w-full lg:w-[86%]"
            >
              <WeekTimetable />
            </motion.div>

            {/* Month calendar — smaller, layered in front (desktop only) */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.34 }}
              style={{ y: yCal, rotateY: rotCal, rotateX: active ? 9 : 0, rotateZ: active ? 6.5 : 0, z: active ? 48 : 0 }}
              className="absolute right-[-8%] -top-[12%] hidden w-[46%] lg:block"
            >
              <CalendarView caption="" className="!p-3.5" />
            </motion.div>

            {/* Notification chips — smallest, frontmost */}
            <motion.div
              style={{ y: yChip1, z: active ? 96 : 0, rotateZ: active ? -5 : 0 }}
              className="absolute -bottom-3 left-[-4%] w-[14.5rem] max-w-[76%] lg:left-[-9%]"
            >
              <div className="animate-float">
                <NotificationChip icon={CalendarCheck} title="Class booked" sub="DBMS · LH-2 · 10:00" time="now" />
              </div>
            </motion.div>

            <motion.div
              style={{ y: yChip2, z: active ? 96 : 0, rotateZ: active ? 4.5 : 0 }}
              className="absolute top-[40%] left-[-10%] hidden w-[13.75rem] lg:block"
            >
              <div className="animate-float-slow">
                <NotificationChip icon={Clock} title="Assignment pending" sub="OS Lab · due Friday" time="2d" tone="amber" />
              </div>
            </motion.div>

            <motion.div
              style={{ y: yChip3, z: active ? 96 : 0, rotateZ: active ? -2.5 : 0 }}
              className="absolute bottom-[24%] right-[-4%] w-[12.5rem] max-w-[64%] lg:right-[2%]"
            >
              <div className="animate-float">
                <NotificationChip icon={MapPin} title="Room changed" sub="CS-204 → CS-301" time="5m" />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
