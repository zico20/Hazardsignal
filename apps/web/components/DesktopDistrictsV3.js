"use client";

import { useState, useMemo } from "react";
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
function riskClassFromProb(p, locale = "en") {
  const RISK = {
    en: { vhigh: "Very High", high: "High", med: "Medium", low: "Low", vlow: "Very Low" },
    tr: { vhigh: "Çok Yüksek", high: "Yüksek", med: "Orta", low: "Düşük", vlow: "Çok Düşük" }
  };
  return (RISK[locale] || RISK.en)[tierOf(p)];
}

export default function DesktopDistrictsV3({ locale = "en", messages, districts = [] }) {
  const [sort, setSort] = useState("risk");

  const sorted = useMemo(() => {
    const arr = [...districts];
    if (sort === "risk") arr.sort((a, b) => (b.max_fire_prob ?? 0) - (a.max_fire_prob ?? 0));
    if (sort === "name") arr.sort((a, b) => (a.district_name || "").localeCompare(b.district_name || ""));
    if (sort === "area") arr.sort((a, b) => (b.high_or_very_high_area_pct ?? 0) - (a.high_or_very_high_area_pct ?? 0));
    return arr;
  }, [districts, sort]);

  const t = messages?.home || {};
  const navMsg = messages?.nav || {};

  return (
    <div className="dv3-page-pad">
      <div className="dv3-toolbar">
        <span className="dv3-rail-eyebrow" style={{ marginBottom: 0 }}>
          {districts.length} {(navMsg.districts || "districts").toLowerCase()} · {messages?.common?.sortedBy || "sorted by"}
        </span>
        {[
          { k: "risk", l: t.maxProb || "Risk" },
          { k: "name", l: t.district || "Name" },
          { k: "area", l: t.highArea || "Area" }
        ].map((s) => (
          <button
            key={s.k}
            type="button"
            className={"dv3-chip" + (sort === s.k ? " active" : "")}
            onClick={() => setSort(s.k)}
          >
            {s.l}
          </button>
        ))}
      </div>

      <div className="dv3-districts-grid">
        {sorted.map((d) => {
          const color = tierColor(d.max_fire_prob);
          const pct = Math.round((d.max_fire_prob ?? 0) * 100);
          return (
            <Link
              key={d.district_id}
              href={`/${locale}/districts/${d.district_id}`}
              className="dv3-district-card"
            >
              <div className="dv3-dc-head">
                <div>
                  <div className="dv3-dc-name">{d.district_name}</div>
                  <div className="dv3-dc-class">
                    {riskClassFromProb(d.max_fire_prob, locale)}
                    {(d.hotspot_count_24h ?? 0) > 0 ? ` · ${d.hotspot_count_24h} ${t.hotspots || "hotspots"}` : ""}
                  </div>
                </div>
                <span
                  className="dv3-dc-swatch"
                  style={{ background: color, boxShadow: `0 0 16px ${color}55` }}
                />
              </div>
              <div className="dv3-dc-stats">
                <div>
                  <div className="dv3-dc-pct" style={{ color }}>{pct}%</div>
                  <div className="dv3-dc-label">{t.maxProb || "MAX PROBABILITY"}</div>
                </div>
                <div className="dv3-dc-area">
                  <div className="dv3-dc-area-val">{(d.high_or_very_high_area_pct ?? 0).toFixed(1)}%</div>
                  <div className="dv3-dc-label">{t.highArea || "HIGH AREA"}</div>
                </div>
              </div>
              <div className="dv3-dc-bar">
                <div style={{ width: `${pct}%`, background: color }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
