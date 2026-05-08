import Link from "next/link";

function tierOf(p) {
  if (p == null) return "vlow";
  if (p >= 0.85) return "vhigh";
  if (p >= 0.6) return "high";
  if (p >= 0.4) return "med";
  if (p >= 0.2) return "low";
  return "vlow";
}
function tierColor(p) {
  return { vhigh: "#ef4444", high: "#f59e0b", med: "#b8d96b", low: "#4d9bd6", vlow: "#2563d8" }[tierOf(p)];
}
function focusTier(p) {
  if (p >= 0.85) return "critical";
  if (p >= 0.7) return "warning";
  return "watch";
}
function fmtCoord(v) {
  return v != null ? Number(v).toFixed(2) : "—";
}
function riskClassFromProb(p, locale = "en") {
  const RISK = {
    en: { vhigh: "Very High", high: "High", med: "Medium", low: "Low", vlow: "Very Low" },
    tr: { vhigh: "Çok Yüksek", high: "Yüksek", med: "Orta", low: "Düşük", vlow: "Çok Düşük" }
  };
  return (RISK[locale] || RISK.en)[tierOf(p)];
}

const ArrowBack = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M19 12H5M11 18l-6-6 6-6" /></svg>);
const CheckIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><path d="m5 12 5 5 9-11" /></svg>);
const SendIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>);

// Build the history chart inline as SVG so we don't need a heavy charting
// dep. Mirrors the design's pattern: gridlines + dashed threshold + area
// + line + dots + x-axis date labels.
function HistoryChart({ history, threshold, color }) {
  if (!history || history.length === 0) {
    return <div className="dv3-chart-empty">—</div>;
  }
  const w = 600, h = 220, pad = 30;
  const len = history.length;
  const xs = history.map((_, i) => pad + (i / Math.max(1, len - 1)) * (w - pad * 2));
  const ys = history.map((p) => h - pad - (p.max_fire_prob ?? 0) * (h - pad * 2));
  const linePath = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ");
  const areaPath = linePath + ` L ${xs[xs.length - 1]} ${h - pad} L ${pad} ${h - pad} Z`;
  const tY = h - pad - (threshold ?? 0.5) * (h - pad * 2);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id={`dv3-area-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((p) => (
        <g key={p}>
          <line x1={pad} y1={h - pad - p * (h - pad * 2)} x2={w - pad} y2={h - pad - p * (h - pad * 2)} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 4" />
          <text x={pad - 6} y={h - pad - p * (h - pad * 2) + 3} fontSize="9" fill="#76767f" textAnchor="end" fontFamily="IBM Plex Mono, monospace">{Math.round(p * 100)}</text>
        </g>
      ))}
      <line x1={pad} y1={tY} x2={w - pad} y2={tY} stroke="#ff5a1f" strokeDasharray="4 4" opacity="0.6" />
      <text x={w - pad} y={tY - 4} fontSize="9" fill="#ff5a1f" textAnchor="end" fontFamily="IBM Plex Mono, monospace">
        THRESHOLD {Math.round((threshold ?? 0.5) * 100)}%
      </text>
      <path d={areaPath} fill={`url(#dv3-area-${color.replace("#", "")})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r={i === xs.length - 1 ? 5 : 2.5} fill={color} stroke="#111114" strokeWidth={i === xs.length - 1 ? 2 : 0} />
      ))}
      {history.filter((_, i) => i % 3 === 0).map((p, idx) => {
        const realIdx = idx * 3;
        const date = (p.run_date || p.date || "").slice(5);
        return (
          <text key={p.run_date || p.date || idx} x={xs[realIdx]} y={h - 8} fontSize="9" fill="#76767f" textAnchor="middle" fontFamily="IBM Plex Mono, monospace">
            {date}
          </text>
        );
      })}
    </svg>
  );
}

export default function DesktopDistrictDetailV3({
  locale = "en",
  messages,
  district,
  history = [],
  alerts = [],
  threshold = 0.5
}) {
  const t = messages?.district || {};
  const home = messages?.home || {};
  const navMsg = messages?.nav || {};
  const sevMsg = messages?.alerts || {};
  const color = tierColor(district.max_fire_prob);
  const pct = Math.round((district.max_fire_prob ?? 0) * 100);

  return (
    <div className="dv3-district-page dv3-page-pad">
      <Link href={`/${locale}/districts`} className="dv3-btn-secondary" style={{ marginBottom: 18 }}>
        <ArrowBack style={{ width: 12, height: 12 }} />
        {t.back || (navMsg.districts || "All districts")}
      </Link>

      <div className="dv3-district-head">
        <div>
          <h1 className="dv3-district-name">{district.district_name}</h1>
          <div className="dv3-district-region">
            {fmtCoord(district.lat ?? district.latitude)}°N, {fmtCoord(district.lon ?? district.longitude)}°E · Antalya, TR
          </div>
        </div>
        <div className="dv3-focus-prob" data-tier={focusTier(district.max_fire_prob ?? 0)}>
          <div className="dv3-pct">{pct}%</div>
          <div className="dv3-lbl">{home.maxProb || "MAX %"}</div>
        </div>
      </div>

      <div className="dv3-detail-grid">
        <div className="dv3-panel dv3-detail-metric">
          <span className="dv3-metric-label">{t.maxProb || "Max probability"}</span>
          <span className="dv3-metric-value" style={{ color }}>{pct}%</span>
          <span className="dv3-metric-sub">Threshold: {Math.round((threshold ?? 0.5) * 100)}%</span>
        </div>
        <div className="dv3-panel dv3-detail-metric">
          <span className="dv3-metric-label">{t.area || home.highArea || "High-risk area"}</span>
          <span className="dv3-metric-value">{(district.high_or_very_high_area_pct ?? 0).toFixed(1)}%</span>
          <span className="dv3-metric-sub">of district area</span>
        </div>
        <div className="dv3-panel dv3-detail-metric">
          <span className="dv3-metric-label">{t.hotspots || home.hotspots || "Hotspots"}</span>
          <span className="dv3-metric-value">{district.hotspot_count_24h ?? 0}</span>
          <span className="dv3-metric-sub">FIRMS detections</span>
        </div>
        <div className="dv3-panel dv3-detail-metric">
          <span className="dv3-metric-label">{t.class || "Risk class"}</span>
          <span className="dv3-metric-value" style={{ fontSize: "1.6rem", color }}>{riskClassFromProb(district.max_fire_prob, locale)}</span>
          <span className="dv3-metric-sub">Mean risk: {Math.round((district.mean_risk ?? 0) * 100)}%</span>
        </div>

        <div className="dv3-panel dv3-detail-chart">
          <div className="dv3-panel-h">
            <div>
              <div className="dv3-panel-eyebrow">{t.history || "14-day history"}</div>
              <div className="dv3-panel-title" style={{ marginTop: 4 }}>Probability over time</div>
            </div>
          </div>
          <div className="dv3-chart-area">
            <HistoryChart history={history} threshold={threshold} color={color} />
          </div>
        </div>

        <div className="dv3-panel dv3-detail-alerts">
          <div className="dv3-panel-h">
            <div>
              <div className="dv3-panel-eyebrow">{t.related || "Alerts in this district"}</div>
              <div className="dv3-panel-title" style={{ marginTop: 4 }}>{alerts.length} active</div>
            </div>
          </div>
          {alerts.length === 0 ? (
            <div className="dv3-detail-empty">
              <CheckIcon style={{ width: 32, height: 32, color: "var(--dv3-ok)", marginBottom: 8 }} />
              <div>{t.noAlerts || "No active alerts"}</div>
            </div>
          ) : (
            <div className="dv3-alerts-feed">
              {alerts.slice(0, 1).map((a) => (
                <div key={a.alert_id || a.id} className="dv3-alert-card" data-sev={a.severity}>
                  <div className="dv3-alert-bar" />
                  <div></div>
                  <div className="dv3-alert-info">
                    <div className="dv3-alert-dist">{a.severity} — {Math.round((a.max_fire_prob ?? 0) * 100)}%</div>
                    <div className="dv3-alert-reason">{a.trigger_reason || a.reason || ""}</div>
                    <div className="dv3-alert-meta">{a.sent_at ? new Date(a.sent_at).toLocaleString() : ""}</div>
                  </div>
                  <span className="dv3-sev-tag" data-sev={a.severity}>{a.severity}</span>
                </div>
              ))}
            </div>
          )}

          <div className="dv3-divider" />
          <Link
            href={`/${locale}/alerts`}
            className="dv3-btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            <SendIcon style={{ width: 14, height: 14 }} />
            Show Me All Alerts
          </Link>
        </div>
      </div>
    </div>
  );
}
