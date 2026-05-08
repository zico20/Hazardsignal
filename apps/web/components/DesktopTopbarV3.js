"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildLocalePath } from "../lib/i18n";
import DesktopPushToggleV3 from "./DesktopPushToggleV3";

const THEME_KEY = "dv3-theme";
const THEME_EVENT = "dv3-theme-change";
const SunIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" /></svg>);
const MoonIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 14a8 8 0 1 1-10-10 6 6 0 0 0 10 10z" /></svg>);

export default function DesktopTopbarV3({
  locale = "en",
  messages,
  currentPath = "/",
  pageTitle,
  pageSub,
  runDate
}) {
  const router = useRouter();
  const runLabel = messages?.common?.run || messages?.home?.lastRun || "Run";

  // Theme is persisted on the html element (`dv3-light` class) + localStorage.
  // We dispatch a custom event so other client islands (Leaflet map) can
  // swap tiles without prop-drilling.
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light") {
        setTheme("light");
        document.documentElement.classList.add("dv3-light");
      }
    } catch {}
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") document.documentElement.classList.add("dv3-light");
    else document.documentElement.classList.remove("dv3-light");
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme: next } }));
  }

  function switchLocale(next) {
    const path = buildLocalePath(next, currentPath);
    router.push(path);
  }

  const langs = ["EN", "TR"];

  return (
    <header className="dv3-topbar">
      <div>
        <div className="dv3-topbar-title">{pageTitle || messages?.home?.mapTitle || ""}</div>
        <div className="dv3-topbar-sub">ANTALYA, TR</div>
      </div>
      <div className="dv3-topbar-spacer"></div>

      <div className="dv3-run-pill">
        <span className="dv3-run-dot"></span>
        <span>{runLabel}: {runDate || "-"}</span>
      </div>

      <div className="dv3-lang-switch">
        {langs.map((l) => {
          const code = l.toLowerCase();
          return (
            <button
              key={l}
              type="button"
              className={code === locale ? "active" : ""}
              onClick={() => switchLocale(code)}
            >
              {l}
            </button>
          );
        })}
      </div>

      <DesktopPushToggleV3 />

      <button
        type="button"
        className="dv3-theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
    </header>
  );
}
