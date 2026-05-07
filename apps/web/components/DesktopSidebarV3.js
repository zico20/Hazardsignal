"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Logo + section icons. Inlined so we don't load an icon font.
const Icon = {
  Logo: (p) => (
    <svg viewBox="0 0 64 64" {...p}>
      <defs>
        <linearGradient id="hs-arc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff5a1f" />
          <stop offset="100%" stopColor="#ff8a3d" />
        </linearGradient>
      </defs>
      <path d="M 8 42 A 24 24 0 0 1 56 42" fill="none" stroke="url(#hs-arc)" strokeWidth="3.2" strokeLinecap="round" opacity="0.95" />
      <path d="M 16 42 A 16 16 0 0 1 48 42" fill="none" stroke="url(#hs-arc)" strokeWidth="3.2" strokeLinecap="round" opacity="0.60" />
      <path d="M 23 42 A 9 9 0 0 1 41 42" fill="none" stroke="url(#hs-arc)" strokeWidth="3.2" strokeLinecap="round" opacity="0.30" />
      <circle cx="32" cy="42" r="3.4" fill="#ff8a3d" />
      <circle cx="32" cy="42" r="1.6" fill="#ffffff" opacity="0.95" />
    </svg>
  ),
  Live: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><circle cx="12" cy="12" r="3" fill="currentColor" /><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="10" opacity=".4" /></svg>),
  List: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>),
  Map: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M9 4v16M15 6v14M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" /></svg>),
  Bell: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M6 8a6 6 0 0 1 12 0v5l2 3H4l2-3V8zM10 19a2 2 0 0 0 4 0" /></svg>),
  Book: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4zM5 17a3 3 0 0 1 3-3h11" /></svg>),
  Cog: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4.9a7 7 0 0 0-2.1-1.2L14 3h-4l-.4 2.6a7 7 0 0 0-2.1 1.2L5.1 5.9l-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-.9a7 7 0 0 0 2.1 1.2L10 21h4l.4-2.6a7 7 0 0 0 2.1-1.2l2.4.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" /></svg>)
};

const STORAGE_KEY = "dv3-sidebar-collapsed";

export default function DesktopSidebarV3({
  locale = "en",
  messages,
  currentPath = "/",
  runDate = "-",
  modelName = "RandomForest",
  criticalAlertCount = 0
}) {
  const t = messages?.nav || {};
  const sec = messages?.sections || { monitor: "MONITOR", reference: "REFERENCE", manage: "MANAGE" };

  // Sync collapsed state with the document root via a class so other
  // panels (.dv3-app grid columns) can react via plain CSS without React
  // context. Persisted in localStorage so the choice survives navigation.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "1") setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    const cls = "dv3-collapsed";
    if (collapsed) document.documentElement.classList.add(cls);
    else document.documentElement.classList.remove(cls);
    try { localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0"); } catch {}
  }, [collapsed]);

  const liveLabel = t.live || (locale === "tr" ? "Canlı" : "Live");

  const items = [
    { key: "live", label: liveLabel, href: `/${locale}`, match: "/", icon: Icon.Live, section: 0 },
    { key: "districts", label: t.districts || "Districts", href: `/${locale}/districts`, match: "/districts", icon: Icon.List, section: 0 },
    { key: "alerts", label: t.alerts || "Alerts", href: `/${locale}/alerts`, match: "/alerts", icon: Icon.Bell, section: 0, badge: criticalAlertCount > 0 ? criticalAlertCount : null },
    { key: "method", label: t.methodology || t.method || "Methodology", href: `/${locale}/methodology`, match: "/methodology", icon: Icon.Book, section: 1 },
    { key: "admin", label: t.admin || "Admin", href: `/${locale}/admin`, match: "/admin", icon: Icon.Cog, section: 2 }
  ];
  const sectionLabels = [sec.monitor, sec.reference, sec.manage];

  // Edge handle drag-to-toggle. Mouse-down on the right edge starts a
  // drag; on mouse-up we decide based on the X delta:
  //   - dragged left  ≥ 40px  → collapse
  //   - dragged right ≥ 40px  → expand
  // Smaller deltas are treated as accidental and do nothing.
  const dragRef = useRef({ active: false, startX: 0 });

  function handleMouseDown(e) {
    // Only react to primary button.
    if (e.button !== 0) return;
    dragRef.current = { active: true, startX: e.clientX };
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  }

  useEffect(() => {
    function onMove() { /* no-op; we only act on mouseup */ }
    function onUp(e) {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.startX;
      dragRef.current.active = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (Math.abs(dx) < 40) return; // ignore tiny drags
      if (dx < 0) setCollapsed(true);
      else setCollapsed(false);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <aside className="dv3-sidebar">
      <div
        className="dv3-sidebar-handle"
        onMouseDown={handleMouseDown}
        aria-hidden="true"
      />

      <div className="dv3-brand">
        <div className="dv3-brand-mark"><Icon.Logo /></div>
        <div className="dv3-brand-name">
          <span className="dv3-brand-name-base">Hazard</span>
          <span className="dv3-brand-name-accent">Signal</span>
        </div>
      </div>

      {[0, 1, 2].map((secIdx) => (
        <div key={secIdx}>
          <div className="dv3-nav-section-label">{sectionLabels[secIdx]}</div>
          <nav className="dv3-nav">
            {items.filter((i) => i.section === secIdx).map((it) => {
              const Ico = it.icon;
              const isActive = currentPath === it.match;
              return (
                <Link
                  key={it.key}
                  href={it.href}
                  className={"dv3-nav-item" + (isActive ? " active" : "")}
                  title={it.label}
                >
                  <Ico />
                  <span className="dv3-nav-item-label">{it.label}</span>
                  {it.badge ? <span className="dv3-nav-badge">{it.badge}</span> : null}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      <div className="dv3-sidebar-footer">
        <div>HazardSignal © 2026 · {modelName}</div>
      </div>
    </aside>
  );
}
