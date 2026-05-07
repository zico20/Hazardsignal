export default function Loading() {
  return (
    <div className="route-loader" role="status" aria-live="polite" aria-label="Loading">
      <div className="route-loader-glow" aria-hidden="true" />
      <div className="route-loader-content">
        <div className="route-loader-mark" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="56" height="56">
            <defs>
              <linearGradient id="hs-arc-loader" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ff5a1f" />
                <stop offset="100%" stopColor="#ff8a3d" />
              </linearGradient>
            </defs>
            <path d="M 8 42 A 24 24 0 0 1 56 42" fill="none" stroke="url(#hs-arc-loader)" strokeWidth="3.2" strokeLinecap="round" opacity="0.95" />
            <path d="M 16 42 A 16 16 0 0 1 48 42" fill="none" stroke="url(#hs-arc-loader)" strokeWidth="3.2" strokeLinecap="round" opacity="0.6" />
            <path d="M 23 42 A 9 9 0 0 1 41 42" fill="none" stroke="url(#hs-arc-loader)" strokeWidth="3.2" strokeLinecap="round" opacity="0.3" />
            <circle cx="32" cy="42" r="3.4" fill="#ff8a3d" />
            <circle cx="32" cy="42" r="1.6" fill="#ffffff" opacity="0.95" />
          </svg>
          <span className="route-loader-ring" />
        </div>
        <span className="route-loader-label">HazardSignal</span>
        <span className="route-loader-sub">Loading…</span>
      </div>
    </div>
  );
}
