import RiskMapShell from "./RiskMapShell";
import MobileTopBar from "./MobileTopBar";

const SEVERITY_PILL = {
  critical: { label: "CRITICAL", icon: "🔥" },
  warning: { label: "WARNING", icon: "⚠️" },
  watch: { label: "WATCH", icon: "👁" },
  monitoring: { label: "MONITORING", icon: "✅" }
};

function classFromProb(prob) {
  if (prob >= 0.8) return "very-high";
  if (prob >= 0.6) return "high";
  if (prob >= 0.4) return "medium";
  if (prob >= 0.2) return "low";
  return "very-low";
}

function colorFromClass(key) {
  switch (key) {
    case "very-low": return "#4575b4";
    case "low": return "#91bfdb";
    case "medium": return "#ffffbf";
    case "high": return "#fdae61";
    case "very-high": return "#d73027";
    case "fire": return "#ff3131";
    default: return "#4575b4";
  }
}

export default function MobileMapConsole({
  districts = [],
  fires = [],
  messages,
  locale = "en",
  missionState = "monitoring",
  criticalDistricts = 0,
  activeFireDistricts = 0,
  peakProbability = 0,
  runDate = "-"
}) {
  const lead = districts[0] || null;
  const leadProbClass = lead ? classFromProb(Number(lead.max_fire_prob || 0)) : "very-low";
  const leadColor = colorFromClass(leadProbClass);
  const severityKey = (lead?.operational_severity || missionState || "monitoring").toLowerCase();
  const pill = SEVERITY_PILL[severityKey] || SEVERITY_PILL.monitoring;
  const probDisplay = Number(peakProbability || lead?.max_fire_prob || 0).toFixed(2);
  const fireCount = Array.isArray(fires) ? fires.length : 0;

  return (
    <div className="m-live" data-severity={severityKey}>
      <MobileTopBar tab="live" locale={locale} runDate={runDate} showScale={true} />

      <div className="m-live-map">
        <RiskMapShell
          districts={districts}
          fires={fires}
          messages={messages?.map || messages}
          locale={locale}
          missionState={missionState}
        />
      </div>

      <div className="m-live-card">
        <div className="m-live-pill" data-severity={severityKey}>
          <span className="m-live-pill-icon" aria-hidden="true">{pill.icon}</span>
          <span className="m-live-pill-text">{pill.label}</span>
        </div>

        <div className="m-live-headline">
          <div className="m-live-district">
            <strong className="m-live-name">{lead?.district_name || "—"}</strong>
            <span className="m-live-sub">
              {lead?.dominant_risk_class || "—"}
              {lead?.hotspot_count_24h > 0 ? ` · ${lead.hotspot_count_24h} hotspot${lead.hotspot_count_24h === 1 ? "" : "s"}` : ""}
            </span>
          </div>
          <div className="m-live-badge" style={{ backgroundColor: leadColor }} data-class={leadProbClass}>
            <span className="m-live-badge-num">{probDisplay}</span>
            <span className="m-live-badge-label">prob</span>
          </div>
        </div>

        <div className="m-live-metrics">
          <div className="m-live-metric">
            <span className="m-live-metric-label">Active fires</span>
            <strong className="m-live-metric-value">{fireCount}</strong>
          </div>
          <div className="m-live-metric">
            <span className="m-live-metric-label">Critical</span>
            <strong className="m-live-metric-value">{criticalDistricts}</strong>
          </div>
          <div className="m-live-metric">
            <span className="m-live-metric-label">Active districts</span>
            <strong className="m-live-metric-value">{activeFireDistricts}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
