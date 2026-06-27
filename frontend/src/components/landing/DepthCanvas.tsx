"use client";

import { useEffect, useRef } from "react";

/**
 * The depth engine. One fixed canvas paints two distinct layers so they read as
 * depth rather than merging:
 *   • a true halftone plane — dots whose RADIUS grows toward tonal pools
 *     (impossible in CSS), pre-rendered once then parallaxed + depth-zoomed.
 *   • a multi-band starfield — sharp far → larger near particles that twinkle,
 *     drift, and stream upward at per-band rates (wrapped = infinite).
 * Respects prefers-reduced-motion (static frame) and pauses when hidden.
 */
type Star = {
  x: number;
  y: number;
  r: number;
  a: number;
  tw: number;
  ph: number;
  band: 0 | 1 | 2;
  dx: number;
};

export default function DepthCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = ref.current;
    if (!canvasEl) return;
    const ctx2d = canvasEl.getContext("2d");
    if (!ctx2d) return;
    const htEl = document.createElement("canvas");
    const htCtx = htEl.getContext("2d");
    if (!htCtx) return;

    // Locked non-null aliases so the render closures below stay null-free.
    const canvas = canvasEl;
    const g = ctx2d;
    const ht = htEl;
    const htg = htCtx;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let W = 0;
    let H = 0;
    let stars: Star[] = [];
    let scrollY = window.scrollY;
    let raf = 0;

    const FAR = "#8b7bd6";
    const NEAR = "#cdbcff";

    function buildStars() {
      const count = Math.min(230, Math.max(70, Math.round((W * H) / 12500)));
      stars = [];
      for (let i = 0; i < count; i++) {
        const roll = Math.random();
        const band: 0 | 1 | 2 = roll < 0.62 ? 0 : roll < 0.88 ? 1 : 2;
        stars.push({
          x: Math.random(),
          y: Math.random(),
          r:
            band === 0
              ? Math.random() * 0.6 + 0.4
              : band === 1
                ? Math.random() * 0.9 + 0.7
                : Math.random() * 1.3 + 1.1,
          a:
            band === 0
              ? Math.random() * 0.35 + 0.18
              : band === 1
                ? Math.random() * 0.45 + 0.3
                : Math.random() * 0.45 + 0.45,
          tw: Math.random() * 0.0015 + 0.0005,
          ph: Math.random() * Math.PI * 2,
          band,
          dx: (Math.random() * 2 - 1) * 0.0035,
        });
      }
    }

    function buildHalftone() {
      ht.width = W;
      ht.height = H;
      htg.clearRect(0, 0, W, H);
      const maxSide = Math.max(W, H);
      const pools = [
        { x: 0.8 * W, y: 0.04 * H, rad: 0.46 * maxSide, s: 1.0 },
        { x: 0.1 * W, y: 0.8 * H, rad: 0.42 * maxSide, s: 0.78 },
        { x: 0.54 * W, y: 0.42 * H, rad: 0.52 * maxSide, s: 0.4 },
      ];
      const S = W < 640 ? 19 : 23;
      const maxR = S * 0.46;
      for (let gy = 0; gy <= H; gy += S) {
        for (let gx = 0; gx <= W; gx += S) {
          let tone = 0;
          for (let k = 0; k < pools.length; k++) {
            const p = pools[k];
            const ddx = gx - p.x;
            const ddy = gy - p.y;
            const d = Math.sqrt(ddx * ddx + ddy * ddy);
            const f = d < p.rad ? 1 - d / p.rad : 0;
            tone += f * f * p.s;
          }
          const ex = Math.min(gx, W - gx) / (0.16 * W);
          const ey = Math.min(gy, H - gy) / (0.16 * H);
          const edge = Math.max(0, Math.min(1, ex)) * Math.max(0, Math.min(1, ey));
          tone = Math.min(1, tone) * edge;
          if (tone > 0.05) {
            const r = tone * maxR;
            htg.beginPath();
            htg.arc(gx, gy, r, 0, Math.PI * 2);
            htg.fillStyle = `rgba(167,139,250,${0.05 + tone * 0.4})`;
            htg.fill();
          }
        }
      }
    }

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
      buildHalftone();
      if (reduce) draw(0);
    }

    function draw(t: number) {
      g.clearRect(0, 0, W, H);
      const sp = Math.min(scrollY / (H * 1.3), 1);

      // Halftone plane — parallax up + depth zoom, fading as the fold leaves.
      const cx = W * 0.5;
      const cy = H * 0.5;
      g.save();
      g.globalAlpha = Math.max(0, 0.95 - sp * 0.55);
      g.translate(cx, cy - scrollY * 0.18);
      g.scale(1 + sp * 0.14, 1 + sp * 0.14);
      g.drawImage(ht, -cx, -cy);
      g.restore();

      // Starfield — per-band parallax (wrapped), depth-zoom on radius, twinkle.
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const rate = s.band === 0 ? 0.05 : s.band === 1 ? 0.12 : 0.2;
        const rZoom = 1 + sp * (s.band === 0 ? 0.15 : s.band === 1 ? 0.3 : 0.5);
        let px = s.x * W + (reduce ? 0 : s.dx * t);
        px = ((px % W) + W) % W;
        let py = s.y * H - scrollY * rate;
        py = ((py % H) + H) % H;
        const alpha = reduce ? s.a : s.a * (0.5 + 0.5 * Math.sin(t * s.tw + s.ph));
        g.globalAlpha = alpha;
        g.fillStyle = s.band === 2 ? NEAR : FAR;
        g.beginPath();
        g.arc(px, py, s.r * rZoom, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    }

    function loop(t: number) {
      draw(t);
      raf = requestAnimationFrame(loop);
    }

    function onScroll() {
      scrollY = window.scrollY;
    }
    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!reduce && !raf) {
        raf = requestAnimationFrame(loop);
      }
    }

    resize();
    if (reduce) draw(0);
    else raf = requestAnimationFrame(loop);

    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    />
  );
}
