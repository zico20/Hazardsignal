"use client";

import { Fragment, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, WMSTileLayer, ZoomControl } from "react-leaflet";
import { classFromMaxProb, formatPercent, formatProb, riskBadgeTone, severityColor } from "../lib/format";
import { localizeRiskClass } from "../lib/i18n";

const DEFAULT_CENTER = [36.9, 30.7];

function riskColor(label) {
  switch (label) {
    case "Very High":
      return "#d73027";
    case "High":
      return "#fdae61";
    case "Medium":
      return "#ffffbf";
    case "Low":
      return "#91bfdb";
    default:
      return "#4575b4";
  }
}

// High-risk districts get a radar-pulse halo. Very High pings faster and
// runs a second offset ring so it reads as the most urgent on the map.
function pulseProfile(peakClass) {
  if (peakClass === "Very High") return { rings: 2, color: "#ff5454" };
  if (peakClass === "High")      return { rings: 1, color: "#ff8a3d" };
  return null;
}

function t(messages, key, fallback) {
  return messages?.[key] || fallback;
}

export default function RiskMapClient({ districts, fires, messages, locale = "en", missionState = "monitoring" }) {
  const [showEffis, setShowEffis] = useState(false);

  const legendRows = [
    { label: localizeRiskClass("Low", locale), short: "Low", color: riskColor("Low") },
    { label: localizeRiskClass("Medium", locale), short: "Mod", color: riskColor("Medium") },
    { label: localizeRiskClass("High", locale), short: "High", color: riskColor("High") },
    { label: localizeRiskClass("Very High", locale), short: "V.High", color: riskColor("Very High") },
    { label: "Fire", short: "Fire", color: "#ef4444", hotspot: true }
  ];

  return (
    <div className={["map-shell", "ops-map-shell", "mission-map", "mission-" + missionState].join(" ")}>
      <MapContainer center={DEFAULT_CENTER} zoom={8} scrollWheelZoom zoomControl={false} style={{ minHeight: 520 }} className="ops-map">
        <ZoomControl position="bottomleft" />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showEffis && (
          <WMSTileLayer
            url="https://maps.wild-fire.eu/effis"
            layers="modis.ba.2024,modis.ba.2023"
            format="image/png"
            transparent={true}
            opacity={0.65}
            attribution="© EFFIS / JRC"
          />
        )}
        {districts.map((district) => {
          const peakClass = classFromMaxProb(district.max_fire_prob);
          const baseRadius = 9 + Math.round(Number(district.max_fire_prob) * 10);
          const pulse = pulseProfile(peakClass);
          return (
          <Fragment key={district.district_id}>
            {/* Radar pulse halos for High / Very High districts. Render
                BEFORE the main marker so the rings sit underneath. */}
            {pulse && Array.from({ length: pulse.rings }).map((_, idx) => {
              // react-leaflet 5 silently drops `className` and `interactive`
              // from pathOptions, so we hook the layer's `add` event and
              // mutate the underlying SVG <path> directly. Confirmed via
              // DOM inspection: pathOptions.className doesn't reach the
              // rendered element on its own.
              const pulseClass = `leaflet-pulse-ring${idx === 1 ? " leaflet-pulse-ring-2" : ""}`;
              return (
                <CircleMarker
                  key={`pulse-${idx}`}
                  center={[district.lat, district.lon]}
                  radius={baseRadius}
                  pathOptions={{
                    color: pulse.color,
                    fillColor: pulse.color,
                    fillOpacity: 0,
                    weight: 2,
                    opacity: 0.7
                  }}
                  eventHandlers={{
                    add: (e) => {
                      const path = e.target?._path;
                      if (!path) return;
                      // Replace classes wholesale so we drop the default
                      // `leaflet-interactive` Leaflet adds to every Path.
                      path.setAttribute("class", pulseClass);
                      path.style.pointerEvents = "none";
                    }
                  }}
                />
              );
            })}
          <CircleMarker
            center={[district.lat, district.lon]}
            pathOptions={{
              color: riskColor(peakClass),
              fillColor: riskColor(peakClass),
              fillOpacity: 0.88,
              weight: 2,
              opacity: 0.92
            }}
            radius={baseRadius}
          >
            <Popup className="ops-popup" closeButton={false}>
              <div className="map-popup">
                <div className="map-popup-header">
                  <span className={["badge", riskBadgeTone(peakClass)].join(" ")}>
                    {localizeRiskClass(peakClass, locale)}
                  </span>
                  <strong>{district.district_name}</strong>
                </div>
                <div className="map-popup-grid">
                  <div className="map-popup-metric">
                    <span className="map-popup-label">{t(messages, "maxProb", "Max probability")}</span>
                    <span className="map-popup-value">{formatProb(district.max_fire_prob, locale)}</span>
                  </div>
                  <div className="map-popup-metric">
                    <span className="map-popup-label">{t(messages, "highArea", "High/very-high area")}</span>
                    <span className="map-popup-value">{formatPercent(district.high_or_very_high_area_pct, locale)}</span>
                  </div>
                  <div className="map-popup-metric">
                    <span className="map-popup-label">{t(messages, "hotspots", "Hotspots (24h)")}</span>
                    <span className="map-popup-value">{district.hotspot_count_24h}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
          </Fragment>
          );
        })}
        {fires.map((fire) => (
          <CircleMarker
            key={fire.fire_id}
            center={[fire.lat, fire.lon]}
            pathOptions={{
              color: severityColor("Critical"),
              fillColor: severityColor("Critical"),
              fillOpacity: 0.95,
              weight: 2,
              opacity: 0.95
            }}
            radius={missionState === "incident" ? 8 : 6.5}
          >
            <Popup className="ops-popup" closeButton={false}>
              <div className="map-popup">
                <div className="map-popup-header">
                  <span className="badge critical">{t(messages, "activeFires", "Active fires (24h)")}</span>
                  <strong>{fire.district_name}</strong>
                </div>
                <div className="map-popup-grid">
                  <div className="map-popup-metric">
                    <span className="map-popup-label">{t(messages, "source", "Source")}</span>
                    <span className="map-popup-value">{fire.source || "-"}</span>
                  </div>
                  <div className="map-popup-metric">
                    <span className="map-popup-label">{t(messages, "confidence", "Confidence")}</span>
                    <span className="map-popup-value">{fire.confidence || "-"}</span>
                  </div>
                  <div className="map-popup-metric">
                    <span className="map-popup-label">{t(messages, "detected", "Detected")}</span>
                    <span className="map-popup-value">{fire.detected_at || "-"}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div className="map-overlay-top">
        <div className="map-chip">
          <span className="map-chip-dot forest" />
          {t(messages, "opsView", "Operations map")}
        </div>
        <div className="map-chip secondary">
          {t(messages, "districtRisk", "District risk")}
        </div>
        <button
          className={["map-chip", "map-effis-toggle", showEffis ? "active" : ""].filter(Boolean).join(" ")}
          onClick={() => setShowEffis((v) => !v)}
          title="Toggle EFFIS historical burned areas (2023–2024)"
        >
          🔥 {showEffis ? "Hide fire scars" : "Show fire scars"}
        </button>
      </div>

      <aside className="map-legend-card">
        <div className="map-legend-title">{t(messages, "legendTitle", "Signal legend")}</div>
        <div className="map-legend-list">
          {legendRows.map((entry) => (
            <div className="map-legend-row" key={entry.label}>
              <span
                className={["map-legend-swatch", entry.hotspot ? "hotspot" : ""].filter(Boolean).join(" ")}
                style={{ backgroundColor: entry.color }}
              />
              <span className="map-legend-full">{entry.label}</span>
              <span className="map-legend-short">{entry.short}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

