"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import DepthCanvas from "./DepthCanvas";

/**
 * Layered "illusion of depth" atmosphere (far → near):
 *   atmosphere gradient → aurora colour planes → starfield + real halftone
 *   (canvas) → near bokeh → vignette. Each plane parallaxes AND depth-zooms at
 *   its own rate, so they separate as you scroll instead of merging.
 */
export default function Backdrop() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();

  const auroraY = useTransform(scrollY, [0, 2600], [0, reduce ? 0 : 150]);
  const auroraScale = useTransform(scrollY, [0, 2000], [1, reduce ? 1 : 1.16]);
  const bokehY = useTransform(scrollY, [0, 1600], [0, reduce ? 0 : -280]);
  const bokehScale = useTransform(scrollY, [0, 1600], [1, reduce ? 1 : 1.35]);

  // Deep-scroll atmosphere — as the hero planes drift off, a fresh set of
  // colour wells fades and rises into view so the lower page keeps its life.
  const deepFade = useTransform(scrollY, [1500, 3000], [0, 1]);
  const deepRise = useTransform(scrollY, [1500, 4600], [180, reduce ? 180 : -110]);
  const deepScale = useTransform(scrollY, [1500, 4600], [0.92, reduce ? 0.92 : 1.2]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Atmosphere — the void + directional colour */}
      <div className="absolute inset-0 bg-[#0a0712]" />
      <div className="absolute inset-0 bg-[radial-gradient(1200px_760px_at_78%_-8%,rgba(124,58,237,0.34),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(900px_700px_at_10%_94%,rgba(99,102,241,0.2),transparent_62%)]" />

      {/* Aurora colour planes (mid-far) — framer parallax/zoom + CSS drift */}
      <motion.div
        style={{ y: auroraY, scale: auroraScale }}
        className="absolute -left-[8%] top-[0%] h-[58vh] w-[58vh] will-change-transform"
      >
        <div className="animate-aurora h-full w-full rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.4),transparent_60%)] blur-[52px]" />
      </motion.div>
      <motion.div
        style={{ y: auroraY, scale: auroraScale }}
        className="absolute right-[0%] top-[16%] h-[52vh] w-[52vh] will-change-transform"
      >
        <div className="animate-aurora-slow h-full w-full rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.34),transparent_60%)] blur-[56px]" />
      </motion.div>

      {/* Starfield + real halftone (the depth engine) */}
      <DepthCanvas />

      {/* Near bokeh (foreground blur, fastest plane) */}
      <motion.div
        style={{ y: bokehY, scale: bokehScale }}
        className="absolute left-[16%] top-[64%] h-[30vh] w-[30vh] will-change-transform"
      >
        <div className="animate-float h-full w-full rounded-full bg-[radial-gradient(circle,rgba(192,132,252,0.22),transparent_60%)] blur-[62px]" />
      </motion.div>
      <motion.div
        style={{ y: bokehY, scale: bokehScale }}
        className="absolute right-[12%] top-[28%] h-[22vh] w-[22vh] will-change-transform"
      >
        <div className="animate-float-slow h-full w-full rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.2),transparent_60%)] blur-[56px]" />
      </motion.div>

      {/* Deep-scroll atmosphere (hidden at the top, blooms in as you descend) */}
      <motion.div
        aria-hidden="true"
        style={{ opacity: deepFade }}
        className="absolute inset-0 bg-[radial-gradient(1000px_720px_at_50%_120%,rgba(139,92,246,0.2),transparent_60%)]"
      />
      <motion.div
        aria-hidden="true"
        style={{ opacity: deepFade, y: deepRise, scale: deepScale }}
        className="absolute bottom-[-18%] left-1/2 h-[68vh] w-[68vh] -translate-x-1/2 will-change-transform"
      >
        <div className="animate-aurora-slow h-full w-full rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.3),transparent_62%)] blur-[60px]" />
      </motion.div>
      <motion.div
        aria-hidden="true"
        style={{ opacity: deepFade, y: deepRise }}
        className="absolute bottom-[4%] right-[-6%] h-[46vh] w-[46vh] will-change-transform"
      >
        <div className="animate-aurora h-full w-full rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.26),transparent_60%)] blur-[58px]" />
      </motion.div>

      {/* Vignette + nav scrim */}
      <div className="absolute inset-0 bg-[radial-gradient(125%_85%_at_50%_38%,transparent_55%,rgba(5,3,12,0.6))]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent" />
    </div>
  );
}
