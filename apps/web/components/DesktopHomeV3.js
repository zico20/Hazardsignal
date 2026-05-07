"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Leaflet uses window — load only on the client.
const DesktopLiveMapV3 = dynamic(() => import("./DesktopLiveMapV3"), {
  ssr: false,
  loading: () => <div className="dv3-map-loading">Loading map…</div>
});

function tierOf(p) {
  if (p == null) return "vlow";
  if (p >= 0.85) return "vhigh";
  if (p >= 0.6) return "high";
  if (p >= 0.4) return "med";
  if (p >= 0.2) return "low";
  return "vlow";
}
function focusTier(p) {
  if (p >= 0.85) return "critical";
  if (p >= 0.7) return "warning";
  return "watch";
}
// Derive risk-class label from max_fire_prob. Supabase rows sometimes
// have stale or null `dominant_risk_class`; deriving keeps the UI
// consistent with the probability the user actually sees.
function riskClassFromProb(p, locale = "en") {
  const RISK_LABELS = {
    en: { vhigh: "Very High", high: "High", med: "Medium", low: "Low", vlow: "Very Low" },
    tr: { vhigh: "Çok Yüksek", high: "Yüksek", med: "Orta", low: "Düşük", vlow: "Çok Düşük" }
  };
  const set = RISK_LABELS[locale] || RISK_LABELS.en;
  return set[tierOf(p)];
}

const TempIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M14 4a2 2 0 1 0-4 0v9a4 4 0 1 0 4 0V4z" /></svg>);
const DropIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" /></svg>);
const WindIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M3 8h12a3 3 0 1 0-3-3M3 16h15a3 3 0 1 1-3 3M3 12h18" /></svg>);
const ArrowIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
const SearchIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>);

const DEFAULT_LEGEND_ROWS = [
  { class: "Very Low",  color: "#2563d8" },
  { class: "Low",       color: "#4d9bd6" },
  { class: "Medium",    color: "#b8d96b" },
  { class: "High",      color: "#f59e0b" },
  { class: "Very High", color: "#ef4444" }
];

export default function DesktopHomeV3({
  locale = "en",
  messages,
  districts = [],
  fires = [],
  alerts = [],
  weather,
  runDate = "-",
  legend = []
}) {
  const sorted = useMemo(
    () => [...districts].sort((a, b) => (b.max_fire_prob ?? 0) - (a.max_fire_prob ?? 0)),
    [districts]
  );
  const [focusId, setFocusId] = useState(sorted[0]?.district_id || null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [layers, setLayers] = useState({ risk: true, fires: true, weather: true });

  const visibleDistricts = useMemo(() => {
    let arr = sorted;
    if (filter === "critical") arr = arr.filter((d) => (d.max_fire_prob ?? 0) >= 0.7);
    if (filter === "high")     arr = arr.filter((d) => (d.max_fire_prob ?? 0) >= 0.6);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter((d) => (d.district_name || "").toLowerCase().includes(q));
    }
    return arr;
  }, [sorted, filter, search]);

  const focus = visibleDistricts.find((d) => d.district_id === focusId) || visibleDistricts[0] || sorted[0];

  const weatherTemp = weather?.current?.temp_c;
  const weatherHum = weather?.current?.humidity_pct;
  const weatherWind = weather?.current?.wind_speed_kmh;
  const weatherDir = weather?.current?.wind_direction || "";

  const t = messages?.home || {};
  const mapMsg = messages?.map || {};
  const legendRows = legend.length ? legend.map((l) => ({ class: l.class, color: l.color })) : DEFAULT_LEGEND_ROWS;

  return (
    <div className="dv3-home-grid">
      {/* HERO MAP — real Leaflet with CARTO dark tiles */}
      <div className="dv3-hero-card">
        <div className="dv3-map-canvas">
          <DesktopLiveMapV3
            districts={layers.risk ? visibleDistricts : []}
            fires={layers.fires ? fires : []}
            focusId={focusId}
            onFocusChange={setFocusId}
          />
        </div>

        <div className="dv3-hero-overlay-top">
          <div className="dv3-live-tag">
            <span className="dv3-live-pulse"></span>
            {messages?.common?.live || "LIVE"}
          </div>
        </div>

        {layers.weather && (weatherTemp != null || weatherHum != null || weatherWind != null) && (
          <div className="dv3-weather-chips">
            {weatherTemp != null && (
              <div className="dv3-w-chip"><TempIcon />{weatherTemp}°<span className="dv3-w-unit">C</span></div>
            )}
            {weatherHum != null && (
              <div className="dv3-w-chip"><DropIcon />{weatherHum}<span className="dv3-w-unit">%</span></div>
            )}
            {weatherWind != null && (
              <div className="dv3-w-chip"><WindIcon />{weatherWind}<span className="dv3-w-unit">km/h {weatherDir}</span></div>
            )}
          </div>
        )}

        {focus && (
          <div className="dv3-focus-sheet">
            <div className="dv3-focus-info">
              <h2>{focus.district_name}</h2>
              <span className="dv3-focus-class">
                {riskClassFromProb(focus.max_fire_prob, locale)}
                {focus.high_or_very_high_area_pct != null ? ` · ${(focus.high_or_very_high_area_pct).toFixed(1)}% ${t.highArea || "high-risk area"}` : ""}
                {focus.hotspot_count_24h != null ? ` · ${focus.hotspot_count_24h} ${t.hotspots || "hotspots"}` : ""}
              </span>
              <Link
                className="dv3-btn-secondary"
                style={{ marginTop: 14, display: "inline-flex" }}
                href={`/${locale}/districts/${focus.district_id}`}
              >
                District <ArrowIcon style={{ width: 12, height: 12 }} />
              </Link>
            </div>
            <div className="dv3-focus-prob" data-tier={focusTier(focus.max_fire_prob ?? 0)}>
              <div className="dv3-pct">{Math.round((focus.max_fire_prob ?? 0) * 100)}%</div>
              <div className="dv3-lbl">{t.maxProb || "MAX %"}</div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT RAIL — search + filters + layers + legend */}
      <aside className="dv3-rail">
        <div className="dv3-search-box">
          <SearchIcon />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={mapMsg.search || "Search district…"}
          />
        </div>

        <div>
          <div className="dv3-rail-eyebrow">{mapMsg.filter || "FILTER"}</div>
          <div className="dv3-chips">
            {[
              { k: "all",      l: mapMsg.all || "All" },
              { k: "critical", l: mapMsg.criticalOnly || mapMsg.critical || "Critical only" },
              { k: "high",     l: "High+" }
            ].map((c) => (
              <button
                key={c.k}
                type="button"
                className={"dv3-chip" + (filter === c.k ? " active" : "")}
                onClick={() => setFilter(c.k)}
              >
                {c.l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="dv3-rail-eyebrow">{mapMsg.layers || "LAYERS"}</div>
          {[
            { k: "risk",    l: mapMsg.layerRisk    || "Risk surface" },
            { k: "fires",   l: mapMsg.layerFires   || "Active fires" },
            { k: "weather", l: mapMsg.layerWeather || "Weather" }
          ].map((lyr) => (
            <label key={lyr.k} className="dv3-layer-row">
              <span>{lyr.l}</span>
              <span className={"dv3-toggle" + (layers[lyr.k] ? " is-on" : "")}>
                <input
                  type="checkbox"
                  checked={!!layers[lyr.k]}
                  onChange={(e) => setLayers({ ...layers, [lyr.k]: e.target.checked })}
                />
                <span className="dv3-toggle-track"><span className="dv3-toggle-thumb" /></span>
              </span>
            </label>
          ))}
        </div>

        <div>
          <div className="dv3-rail-eyebrow">{mapMsg.legend || "RISK LEGEND"}</div>
          <div className="dv3-legend-strip">
            {legendRows.map((l, i) => (
              <div key={i} style={{ background: l.color }} />
            ))}
          </div>
          <div className="dv3-legend-axis"><span>0%</span><span>50%</span><span>100%</span></div>
          <div className="dv3-legend-list">
            {legendRows.map((l, i) => (
              <div key={i} className="dv3-legend-row">
                <span className="dv3-legend-swatch" style={{ background: l.color }} />
                <span>{l.class}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dv3-rail-source">
          <div>{mapMsg.sources || "Source: NASA FIRMS · Sentinel-2 · ERA5"}</div>
          <div>{(mapMsg.updated || "Updated")} {runDate}</div>
        </div>
      </aside>
    </div>
  );
}
