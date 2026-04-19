"use client";

import { useEffect, useState } from "react";

const RISK = {
  low:      { color: "#3FB066" },
  moderate: { color: "#D4A820" },
  high:     { color: "#FF7A18" },
  veryHigh: { color: "#FF4422" },
  extreme:  { color: "#E52211" }
};

function pickRisk(p) {
  if (p == null) return "low";
  if (p < 0.2) return "low";
  if (p < 0.4) return "moderate";
  if (p < 0.6) return "high";
  if (p < 0.8) return "veryHigh";
  return "extreme";
}

function formatTimeAgo(ts) {
  if (!ts) return null;
  const then = new Date(ts).getTime();
  if (Number.isNaN(then)) return null;
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}M AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}H AGO`;
  return `${Math.floor(hrs / 24)}D AGO`;
}

function RiskGauge({ riskKey, size = 140, thickness = 8, score }) {
  const color = RISK[riskKey]?.color ?? "#FF4422";
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const sweep = 0.75;
  const trackDash = `${circ * sweep} ${circ}`;
  const scoreNorm = Math.max(0, Math.min(100, score ?? 0)) / 100;
  const filledLen = circ * sweep * scoreNorm;
  const filledDash = `${filledLen} ${circ - filledLen + circ * (1 - sweep)}`;

  return (
    <svg width={size} height={size} style={{ overflow: "visible" }}>
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(255,255,255,0.05)" strokeWidth={thickness}
        strokeDasharray={trackDash}
        transform={`rotate(135 ${cx} ${cy})`}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={thickness}
        strokeDasharray={filledDash}
        transform={`rotate(135 ${cx} ${cy})`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 600ms ease, stroke 300ms ease" }}
      />
    </svg>
  );
}

function Sparkline({ values, color = "#FF6B2B", width = 90, height = 22 }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 0.001);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} className="dhv2-spark-svg">
      <polyline fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" points={points} />
    </svg>
  );
}

export default function DesktopHeroV2({
  missionState = "monitoring",
  missionTitle,
  missionBody,
  focusLabel,
  peakProbability = 0,
  highRiskArea = 0,
  criticalDistricts = 0,
  activeFireDistricts = 0,
  hotspotCount = 0,
  selectedThresholdRaw = 0.5,
  runDate,
  latestRun,
  weather,
  districts = [],
  totalDistricts = 19
}) {
  const [timeAgo, setTimeAgo] = useState(() =>
    formatTimeAgo(latestRun?.finished_at || latestRun?.started_at)
  );

  useEffect(() => {
    const ts = latestRun?.finished_at || latestRun?.started_at;
    setTimeAgo(formatTimeAgo(ts));
    const id = setInterval(() => setTimeAgo(formatTimeAgo(ts)), 60000);
    return () => clearInterval(id);
  }, [latestRun]);

  const riskKey = pickRisk(peakProbability);
  const thresholdPct = Math.round((selectedThresholdRaw ?? 0.5) * 100);
  const areaPct = Math.round((highRiskArea ?? 0) * 10) / 10;

  const tomorrowMod = weather?.tomorrow?.risk_modifier;
  let tomorrowLabel = "-";
  let tomorrowTone = "flat";
  if (typeof tomorrowMod === "number") {
    if (tomorrowMod > 1.15) { tomorrowLabel = "High ↗"; tomorrowTone = "up"; }
    else if (tomorrowMod < 0.9) { tomorrowLabel = "Low ↘"; tomorrowTone = "down"; }
    else { tomorrowLabel = "Similar →"; tomorrowTone = "flat"; }
  }

  const windDir = weather?.current?.wind_direction || "N";
  const temp = weather?.current?.temp_c;
  const humidity = weather?.current?.humidity_pct;
  const wind = weather?.current?.wind_speed_kmh;

  const probSeries = [...districts]
    .sort((a, b) => (b.max_fire_prob ?? 0) - (a.max_fire_prob ?? 0))
    .slice(0, 10)
    .map(d => d.max_fire_prob ?? 0);

  const reversedSeries = [...probSeries].reverse();
  const criticalSeries = [...districts]
    .slice(0, 10)
    .map(d => (d.operational_severity === "critical" ? 1 : d.operational_severity === "warning" ? 0.6 : 0.2));
  const fireSeries = [...districts]
    .slice(0, 10)
    .map(d => Math.min(1, (d.hotspot_count_24h ?? 0) / 3));

  return (
    <div className="dhv2-wrap">
      {/* Top row: brand on left, location + weather tiles on right */}
      <div className="dhv2-top">
        <div className="dhv2-brand">
          <span className="dhv2-eyebrow">
            <span className="dhv2-eyebrow-dot" />
            OPERATIONAL HAZARD PLATFORM
          </span>
          <h1 className="dhv2-wordmark">
            <span className="dhv2-word-primary">Hazard</span>
            <em className="dhv2-word-accent">Signal</em>
          </h1>
          <p className="dhv2-subtitle">
            Daily wildfire signals for Antalya with a mobile-first operational view.
          </p>
        </div>

        <div className="dhv2-top-right">
          <div className="dhv2-loc-pill">
            <span className="dhv2-loc-pin">📍</span>
            <span className="dhv2-loc-name">Antalya, TR</span>
            <span className="dhv2-loc-sep">·</span>
            <span className="dhv2-loc-coord">36.9°N · 30.7°E</span>
          </div>

          <div className="dhv2-wtiles">
            <div className="dhv2-wt">
              <div className="dhv2-wt-label">TEMP</div>
              <div className="dhv2-wt-value">{temp ?? "-"}<span className="dhv2-wt-unit">°C</span></div>
            </div>
            <div className="dhv2-wt">
              <div className="dhv2-wt-label">HUMIDITY</div>
              <div className="dhv2-wt-value">{humidity ?? "-"}<span className="dhv2-wt-unit">%</span></div>
            </div>
            <div className="dhv2-wt">
              <div className="dhv2-wt-label">WIND</div>
              <div className="dhv2-wt-value">{wind ?? "-"}<span className="dhv2-wt-unit"> km/h {windDir} ↑</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle: Mission card + Outlook card */}
      <div className="dhv2-mid">
        <section className={["dhv2-mission", "dhv2-mission-" + missionState].join(" ")}>
          <div className="dhv2-mission-head">
            <div className="dhv2-tabs">
              <span className={["dhv2-tab", missionState === "monitoring" ? "active" : ""].filter(Boolean).join(" ")}>MONITORING</span>
              <span className={["dhv2-tab", missionState === "escalation" ? "active" : ""].filter(Boolean).join(" ")}>ESCALATION</span>
              <span className={["dhv2-tab", missionState === "incident" ? "active" : ""].filter(Boolean).join(" ")}>INCIDENT</span>
            </div>
            <div className="dhv2-mission-mode">MISSION MODE</div>
          </div>

          <div className="dhv2-mission-body">
            <div className="dhv2-gauge-wrap">
              <RiskGauge riskKey={riskKey} size={140} thickness={8} score={areaPct} />
              <div className="dhv2-gauge-center">
                <div className="dhv2-gauge-value">{areaPct}<span className="dhv2-gauge-pct">%</span></div>
                <div className="dhv2-gauge-label">HIGH-RISK AREA</div>
              </div>
            </div>

            <div className="dhv2-mission-text">
              <h3 className="dhv2-mission-title">{missionTitle}</h3>
              {missionBody && <p className="dhv2-mission-desc">{missionBody}</p>}
              {focusLabel && (
                <div className="dhv2-focus-pill">
                  <span className="dhv2-focus-dot" />
                  Priority focus · {focusLabel}
                </div>
              )}
            </div>
          </div>

          <div className="dhv2-mission-foot">
            <div className="dhv2-foot-item">
              <span className="dhv2-foot-dot" />
              Monitoring {totalDistricts} districts
            </div>
            <div className="dhv2-foot-sep">·</div>
            <div className="dhv2-foot-item">
              Peak probability {Math.round((peakProbability ?? 0) * 100)}%
            </div>
            <div className="dhv2-foot-sep">·</div>
            <div className="dhv2-foot-item">
              Updated {timeAgo || "—"}
            </div>
          </div>
        </section>

        <section className="dhv2-outlook">
          <div className="dhv2-outlook-head">OUTLOOK &amp; ALERTS</div>

          <div className="dhv2-orow">
            <div className="dhv2-orow-left">
              <div className="dhv2-orow-title">Tomorrow</div>
              <div className="dhv2-orow-sub">FORECASTED RISK</div>
            </div>
            <div className={["dhv2-orow-value", "tone-" + tomorrowTone].join(" ")}>{tomorrowLabel}</div>
          </div>

          <div className="dhv2-orow">
            <div className="dhv2-orow-left">
              <div className="dhv2-orow-title">Hotspots</div>
              <div className="dhv2-orow-sub">SATELLITE · LAST 12H</div>
            </div>
            <div className="dhv2-orow-value">{hotspotCount}</div>
          </div>

          <div className="dhv2-orow">
            <div className="dhv2-orow-left">
              <div className="dhv2-orow-title">Active fires</div>
              <div className="dhv2-orow-sub">DISTRICTS CONFIRMED</div>
            </div>
            <div className="dhv2-orow-value">{activeFireDistricts}</div>
          </div>

          <div className="dhv2-orow">
            <div className="dhv2-orow-left">
              <div className="dhv2-orow-title">Last run</div>
              <div className="dhv2-orow-sub">PIPELINE · {timeAgo || "-"}</div>
            </div>
            <div className="dhv2-orow-value tone-up">{runDate}</div>
          </div>
        </section>
      </div>

      {/* Bottom: 4 stat tiles with sparklines */}
      <div className="dhv2-stats">
        <div className="dhv2-stile">
          <div className="dhv2-stile-label">LAST RUN DATE</div>
          <div className="dhv2-stile-value">{runDate}</div>
          <div className="dhv2-stile-sub">Daily pipeline, 06:00 UTC+3</div>
          <div className="dhv2-stile-spark">
            <Sparkline values={probSeries} color="#FF8A3D" />
          </div>
        </div>

        <div className="dhv2-stile">
          <div className="dhv2-stile-label">SELECTED THRESHOLD</div>
          <div className="dhv2-stile-value">{thresholdPct}<span className="dhv2-stile-unit">%</span></div>
          <div className="dhv2-stile-sub">Probability cutoff for alerting</div>
          <div className="dhv2-stile-spark">
            <Sparkline values={reversedSeries} color="rgba(255, 255, 255, 0.3)" />
          </div>
        </div>

        <div className="dhv2-stile">
          <div className="dhv2-stile-label">CRITICAL DISTRICTS</div>
          <div className="dhv2-stile-value">{criticalDistricts}</div>
          <div className="dhv2-stile-sub">Out of {totalDistricts} monitored districts</div>
          <div className="dhv2-stile-spark">
            <Sparkline values={criticalSeries} color="rgba(255, 255, 255, 0.3)" />
          </div>
        </div>

        <div className="dhv2-stile">
          <div className="dhv2-stile-label">DISTRICTS WITH ACTIVE FIRES</div>
          <div className="dhv2-stile-value">{activeFireDistricts}</div>
          <div className="dhv2-stile-sub">Confirmed by ground reports</div>
          <div className="dhv2-stile-spark">
            <Sparkline values={fireSeries} color="#3FB066" />
          </div>
        </div>
      </div>
    </div>
  );
}
