"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "hs_splash_seen";
const VISIBLE_MS = 2000;
const FADE_MS = 500;

export default function SplashScreen() {
  const [stage, setStage] = useState("init");

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    try {
      if (sessionStorage.getItem(SESSION_KEY)) {
        setStage("hidden");
        return undefined;
      }
    } catch (_) {
      // ignore storage errors (e.g. private mode)
    }

    setStage("visible");

    const fadeTimer = setTimeout(() => setStage("exiting"), VISIBLE_MS);
    const hideTimer = setTimeout(() => {
      setStage("hidden");
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch (_) {
        // ignore
      }
    }, VISIBLE_MS + FADE_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (stage === "hidden") return null;

  return (
    <div
      className={["splash-screen", stage === "exiting" ? "exiting" : ""].filter(Boolean).join(" ")}
      aria-hidden="true"
      suppressHydrationWarning
    >
      <div className="splash-glow" suppressHydrationWarning />
      <div className="splash-content" suppressHydrationWarning>
        <div className="splash-mark" suppressHydrationWarning>
          <svg viewBox="0 0 64 64" width="44" height="44">
            <defs>
              <linearGradient id="hs-arc-splash" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff5a1f" />
                <stop offset="100%" stopColor="#ff8a3d" />
              </linearGradient>
            </defs>
            <path d="M 8 42 A 24 24 0 0 1 56 42" fill="none" stroke="url(#hs-arc-splash)" strokeWidth="3.2" strokeLinecap="round" opacity="0.95" />
            <path d="M 16 42 A 16 16 0 0 1 48 42" fill="none" stroke="url(#hs-arc-splash)" strokeWidth="3.2" strokeLinecap="round" opacity="0.6" />
            <path d="M 23 42 A 9 9 0 0 1 41 42" fill="none" stroke="url(#hs-arc-splash)" strokeWidth="3.2" strokeLinecap="round" opacity="0.3" />
            <circle cx="32" cy="42" r="3.4" fill="#ff8a3d" />
            <circle cx="32" cy="42" r="1.6" fill="#ffffff" opacity="0.95" />
          </svg>
        </div>
        <h1 className="splash-title">HazardSignal</h1>
        <p className="splash-tagline">Daily wildfire signals</p>
      </div>
    </div>
  );
}
