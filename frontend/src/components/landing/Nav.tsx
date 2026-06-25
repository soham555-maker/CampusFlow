"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { Wordmark, EASE } from "./primitives";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "Roles", href: "#roles" },
  { label: "Under the hood", href: "#under-the-hood" },
];

export default function Nav() {
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  return (
    <motion.header
      initial={reduce ? false : { y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:pt-5"
    >
      <nav
        className={[
          "glass-matte glass-sheen flex w-full max-w-5xl items-center justify-between rounded-2xl transition-all duration-300",
          scrolled ? "px-3.5 py-2.5 sm:px-4" : "px-4 py-3 sm:px-5",
        ].join(" ")}
      >
        <Link href="/" className="cursor-pointer" aria-label="CampusFlow home">
          <Wordmark />
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-[13.5px] text-white/65 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden cursor-pointer rounded-xl px-3.5 py-2 text-[13.5px] font-medium text-white/75 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="group inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-[13.5px] font-semibold text-[#0a0a0f] shadow-[0_2px_12px_-2px_rgba(255,255,255,0.35)] transition-all duration-200 hover:bg-white/90"
          >
            Get started
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              fill="none"
            >
              <path
                d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </nav>
    </motion.header>
  );
}
