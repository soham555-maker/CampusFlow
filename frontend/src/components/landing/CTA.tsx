"use client";

import Link from "next/link";
import { Reveal } from "./primitives";

export default function CTA() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <Reveal>
        <div className="glass-matte glass-sheen relative overflow-hidden rounded-[2rem] px-7 py-14 text-center sm:px-12 sm:py-20">
          {/* internal violet glow */}
          <div
            aria-hidden="true"
            className="animate-aurora pointer-events-none absolute left-1/2 top-0 h-[120%] w-[70%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.32),transparent_64%)] blur-[34px]"
          />
          <div className="relative">
            <h2 className="font-display mx-auto max-w-2xl text-balance text-[clamp(2rem,4.5vw,3.4rem)] font-semibold leading-[1.04] tracking-[-0.025em] text-white">
              Bring your whole campus into sync
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-pretty text-[1.05rem] leading-relaxed text-white/65">
              One login for students, teachers, and admins — and a schedule that
              can’t contradict itself. Create an account and see it move.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="group inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-violet-500 px-7 py-4 text-[15px] font-semibold text-white shadow-[0_12px_34px_-10px_rgba(139,92,246,0.9)] transition-all duration-200 hover:bg-violet-400"
              >
                Create your account
                <svg viewBox="0 0 16 16" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none">
                  <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex cursor-pointer items-center rounded-2xl border border-white/15 px-7 py-4 text-[15px] font-medium text-white/85 transition-colors duration-200 hover:border-white/25 hover:text-white"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
