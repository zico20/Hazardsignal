"use client";

import { useEffect, useRef } from "react";

const SatIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" stroke="none" />
    <rect x="1.5" y="10.6" width="6" height="2.8" rx="0.4" fill="currentColor" opacity="0.55" stroke="none" />
    <rect x="16.5" y="10.6" width="6" height="2.8" rx="0.4" fill="currentColor" opacity="0.55" stroke="none" />
    <line x1="12" y1="5" x2="12" y2="9" />
    <circle cx="12" cy="4" r="1" fill="currentColor" stroke="none" />
  </svg>
);

// Decorative satellite-orbits visualization with scroll-driven parallax
// + velocity-based tilt. The outer .dv3-orbits applies the scroll
// transform via CSS variables; the inner .dv3-orbits-stage keeps its
// own continuous floating animation, so the two compose nicely.
export default function DesktopSatelliteOrbits() {
  const rootRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const el = rootRef.current;
    if (!el) return undefined;

    let lastScrollY = window.scrollY;
    let velocity = 0;   // px/frame, smoothed (used for tilt only)
    let descent = 0;    // current vertical offset, eased toward target
    let raf;

    function tick() {
      const y = window.scrollY;
      const dy = y - lastScrollY;
      lastScrollY = y;

      // Velocity → tilt (still useful for the "responsive" feel during
      // active scrolling). Smoothed via low-pass filter.
      velocity = velocity * 0.82 + dy * 0.18;
      const tilt = Math.max(-9, Math.min(9, velocity * 0.6));

      // Slow descent: map scroll progress (0..1) to a downward offset
      // capped so the orbits stay fully visible at any scroll position.
      // Lerp toward the target with a small alpha so the descent feels
      // lazy/heavy rather than tracking the cursor 1:1.
      const docScrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, y / docScrollMax));
      const maxDescent = Math.max(0, window.innerHeight - 460);
      const descentTarget = progress * maxDescent;
      descent += (descentTarget - descent) * 0.025; // very lazy follow

      el.style.setProperty("--dv3-orbits-descent", `${descent.toFixed(2)}px`);
      el.style.setProperty("--dv3-orbits-tilt", `${tilt.toFixed(2)}deg`);

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const sats = [
    { key: "era5", label: "ERA5", orbit: 1 },
    { key: "firms", label: "FIRMS", orbit: 2 },
    { key: "sentinel", label: "Sentinel-2", orbit: 3 }
  ];

  return (
    <div className="dv3-orbits" ref={rootRef} aria-hidden="true">
      <div className="dv3-orbits-stage">
        <div className="dv3-orbit-path dv3-orbit-path-1" />
        <div className="dv3-orbit-path dv3-orbit-path-2" />
        <div className="dv3-orbit-path dv3-orbit-path-3" />

        <div className="dv3-earth">
          <svg className="dv3-earth-svg" viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <radialGradient id="dv3-earth-grad" cx="35%" cy="32%" r="75%">
                <stop offset="0%" stopColor="#3da5d9" />
                <stop offset="55%" stopColor="#1d6a96" />
                <stop offset="100%" stopColor="#0c2a45" />
              </radialGradient>
              <clipPath id="dv3-earth-clip">
                <circle cx="50" cy="50" r="48" />
              </clipPath>
            </defs>

            {/* Sphere */}
            <circle cx="50" cy="50" r="48" fill="url(#dv3-earth-grad)" />

            {/* Continents intentionally omitted — only the Antalya pin (the
                orange dot below) remains as the geographic marker. */}

            {/* Wireframe — meridians + parallels. stroke comes from CSS via
                currentColor so light theme can swap white→dark ink. */}
            <g className="dv3-earth-wire" fill="none" stroke="currentColor" strokeWidth="0.4">
              {/* Equator + mid latitudes */}
              <ellipse cx="50" cy="50" rx="48" ry="9" />
              <ellipse cx="50" cy="50" rx="48" ry="22" />
              <ellipse cx="50" cy="50" rx="48" ry="35" />
              {/* Meridians */}
              <ellipse cx="50" cy="50" rx="9" ry="48" />
              <ellipse cx="50" cy="50" rx="22" ry="48" />
              <ellipse cx="50" cy="50" rx="35" ry="48" />
            </g>

            {/* Outer rim highlight */}
            <circle className="dv3-earth-rim" cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.6" />

            {/* Inner shadow on the dark side */}
            <circle cx="50" cy="50" r="48" fill="url(#dv3-earth-shade)" />
            <defs>
              <radialGradient id="dv3-earth-shade" cx="70%" cy="70%" r="65%">
                <stop offset="40%" stopColor="rgba(0,0,0,0)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
              </radialGradient>
            </defs>
          </svg>
          <span className="dv3-earth-pin" />
        </div>

        {sats.map((s) => (
          <div key={s.key} className={`dv3-orbit dv3-orbit-${s.orbit}`}>
            <div className="dv3-sat">
              <SatIcon />
              <span className="dv3-sat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
