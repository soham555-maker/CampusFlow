"use client";

import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/utils/cn";
import { ReactNode, useRef, type MouseEvent } from "react";

/* Easing — exponential ease-out, no bounce. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Reveal — fades/lifts children into view once. Degrades to an instant,
 * already-visible render when the user prefers reduced motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 20,
  once = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once, margin: "-72px" }}
      transition={{ duration: 0.72, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Parallax — drifts a decorative child as it crosses the viewport. `speed` is
 * the total travel in px (positive = moves up on scroll). Static under reduced
 * motion.
 */
export function Parallax({
  children,
  className,
  speed = 60,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);
  return (
    <motion.div ref={ref} style={{ y: reduce ? 0 : y }} className={className}>
      {children}
    </motion.div>
  );
}

/** A soft, blurred colour well placed behind a section so colour follows the scroll. */
export function SectionGlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -z-10 rounded-full blur-[90px]",
        className
      )}
    />
  );
}

/**
 * useTilt — pointer-driven 3D tilt for a scene. Returns spring-smoothed
 * rotateX/rotateY motion values and the handlers to wire to the container.
 * Caller decides whether to attach (skip on touch / reduced motion).
 */
export function useTilt(max = 6) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const springX = useSpring(rx, { stiffness: 140, damping: 18, mass: 0.6 });
  const springY = useSpring(ry, { stiffness: 140, damping: 18, mass: 0.6 });

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5; // -0.5 … 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * max * 2);
    rx.set(-py * max * 2);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return { rotateX: springX as MotionValue<number>, rotateY: springY as MotionValue<number>, onMove, onLeave };
}

/** CampusFlow mark — a timetable frame with one scheduled (violet) slot. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="2.6" y="2.6" width="18.8" height="18.8" rx="5.2" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.55" />
      <path d="M2.6 9.2H21.4" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.32" />
      <rect x="6" y="11.6" width="5.1" height="6.4" rx="1.7" fill="#a78bfa" />
      <rect x="13" y="11.6" width="5.1" height="3.1" rx="1.3" fill="currentColor" fillOpacity="0.32" />
    </svg>
  );
}

/** Wordmark — mark + name, used in nav and footer. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Logo className="h-7 w-7 text-white" />
      <span className="font-display text-[1.18rem] font-semibold tracking-tight text-white">
        CampusFlow
      </span>
    </span>
  );
}

const FACTS = [
  { value: "3", label: "roles, one login" },
  { value: "0", label: "double-bookings, by design" },
  { value: "RLS", label: "on every table" },
];

/** Structural facts (honest — no fabricated traction), as a divided glass strip. */
export function FactsStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "glass-soft glass-sheen flex flex-col divide-y divide-white/[0.08] overflow-hidden rounded-2xl sm:flex-row sm:divide-x sm:divide-y-0",
        className
      )}
    >
      {FACTS.map((f) => (
        <div key={f.label} className="flex-1 px-6 py-5">
          <div className="font-display text-3xl font-semibold tracking-tight text-white">
            {f.value}
          </div>
          <div className="mt-1 text-sm leading-snug text-white/60">{f.label}</div>
        </div>
      ))}
    </div>
  );
}
