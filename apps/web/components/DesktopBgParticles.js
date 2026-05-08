"use client";

import { useEffect, useRef } from "react";

// Floating dust particles for the V3 desktop main area. Sits inside
// `.dv3-main` so the sidebar isn't covered. Vivid orange dust drifting
// over the warm gradient backdrop. Pauses for prefers-reduced-motion
// users and detaches the rAF on unmount.
export default function DesktopBgParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let raf;

    let lastW = 0;
    let lastH = 0;
    function resize() {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth || window.innerWidth;
      const h = parent?.clientHeight || window.innerHeight;
      // Bail if dimensions haven't actually changed — prevents
      // ResizeObserver / scroll-induced infinite loops.
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.width / (window.devicePixelRatio || 1);
    const H = () => canvas.height / (window.devicePixelRatio || 1);

    const COUNT = 140;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      r: Math.random() * 1.8 + 0.6,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      opacity: Math.random() * 0.7 + 0.25,
      // Hues spread across warm range: red (0) → orange (20) → amber (40)
      hue: 12 + Math.random() * 30,
      sat: 85 + Math.random() * 15,
      light: 55 + Math.random() * 15,
      twinkleOffset: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.005 + Math.random() * 0.012
    }));

    let t = 0;
    function frame() {
      const w = W();
      const h = H();
      ctx.clearRect(0, 0, w, h);
      t += 1;
      particles.forEach((p) => {
        // Twinkle: opacity oscillates around its base
        const twinkle = Math.sin(t * p.twinkleSpeed + p.twinkleOffset) * 0.25;
        const alpha = Math.max(0.05, Math.min(1, p.opacity + twinkle));

        // Soft glow halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${alpha * 0.18})`;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light + 10}%, ${alpha})`;
        ctx.fill();

        p.x += p.dx;
        p.y += p.dy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      });
      raf = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="dv3-bg-particles" aria-hidden="true" />;
}
