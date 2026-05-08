"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Approximate Antalya province outline (clockwise). Used as a single
// polygon on top of the tiles to wash the land area in a soft accent
// tint. Rough — purely visual; we don't rely on this for any logic.
const ANTALYA_BOUNDARY = [
  [37.10, 29.50],
  [37.25, 30.20],
  [37.30, 30.85],
  [37.20, 31.55],
  [37.20, 32.00],
  [37.00, 32.50],
  [36.60, 32.55],
  [36.30, 32.50],
  [36.22, 31.60],
  [36.22, 30.50],
  [36.15, 30.00],
  [36.10, 29.65],
  [36.30, 29.50],
  [36.80, 29.50]
];

function tierOf(p) {
  if (p == null) return "vlow";
  if (p >= 0.85) return "vhigh";
  if (p >= 0.6) return "high";
  if (p >= 0.4) return "med";
  if (p >= 0.2) return "low";
  return "vlow";
}
function tierColor(p) {
  const t = tierOf(p);
  return { vhigh: "#ef4444", high: "#f59e0b", med: "#b8d96b", low: "#4d9bd6", vlow: "#2563d8" }[t];
}

// Build a divIcon that draws the colored dot + a label pill.
// Done in raw HTML so we can ship a single Leaflet marker per district
// with no extra DOM elements floating outside the map pane.
function buildDistrictIcon(d, isActive) {
  const tier = tierOf(d.max_fire_prob);
  const color = tierColor(d.max_fire_prob);
  const sizeMap = { vhigh: 26, high: 22, med: 18, low: 14, vlow: 12 };
  const size = sizeMap[tier];
  const hasFire = (d.hotspot_count_24h ?? 0) > 0;
  const pct = Math.round((d.max_fire_prob ?? 0) * 100);

  const html = `
    <div class="dv3-leaf-dot${isActive ? " active" : ""}${hasFire ? " has-fire" : ""}" style="
      width:${size}px;height:${size}px;
      background:${color};
      box-shadow:0 0 0 2px rgba(15,15,20,0.5), 0 0 ${hasFire ? 18 : 12}px ${color};
    "></div>
    <div class="dv3-leaf-label">${d.district_name} · ${pct}%</div>
  `;
  return L.divIcon({
    html,
    className: "dv3-leaf-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

function buildFireIcon() {
  const html = `
    <div class="dv3-leaf-fire">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 2c1 4-2 5-2 8a4 4 0 0 0 8 0c0-2-1-3-2-4 1 6-3 8-3 8s2-4-1-6c0-2 1-4 0-6z"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: "dv3-leaf-fire-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
}

// Paints a soft orange wash over the Antalya region by drawing a
// polygon directly with Leaflet (bypassing react-leaflet's Polygon
// component, which sometimes drops add-event hooks in v5). The polygon
// is added to a custom pane positioned above tile labels but below
// markers, with mix-blend-mode applied to the pane element itself.
function AntalyaTint() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const PANE = "antalya-tint";
    let pane = map.getPane(PANE);
    if (!pane) {
      pane = map.createPane(PANE);
      pane.style.zIndex = 350; // above tilePane (200), below overlayPane (400)
      pane.style.mixBlendMode = "overlay";
      pane.style.pointerEvents = "none";
    }
    const poly = L.polygon(ANTALYA_BOUNDARY, {
      pane: PANE,
      color: "#ff5a1f",
      weight: 0,
      fillColor: "#ff5a1f",
      fillOpacity: 0.85,
      interactive: false
    });
    poly.addTo(map);
    return () => {
      poly.remove();
    };
  }, [map]);
  return null;
}

// Listens for clicks on empty map areas (sea, tile background) and
// clears the focused district. Marker clicks don't reach this because
// the marker's own click handler stops Leaflet propagation, so only
// "empty area" clicks fire here.
function MapClickClear({ onClick }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !onClick) return undefined;
    function handler() { onClick(); }
    map.on("click", handler);
    return () => map.off("click", handler);
  }, [map, onClick]);
  return null;
}

// Pans the map to the focused district. Lives inside MapContainer so
// useMap() has access to the map instance.
function FlyToFocus({ districts, focusId }) {
  const map = useMap();
  const focused = districts.find((d) => d.district_id === focusId);
  const lat = focused?.latitude ?? focused?.lat;
  const lon = focused?.longitude ?? focused?.lon;
  useEffect(() => {
    if (lat == null || lon == null) return;
    map.flyTo([lat, lon], Math.max(map.getZoom(), 9), { duration: 0.6 });
  }, [lat, lon, map]);
  return null;
}

export default function DesktopLiveMapV3({
  districts = [],
  fires = [],
  focusId,
  onFocusChange,
  showFires = true
}) {
  const center = [36.9, 31.0];

  // Track the current theme so we can swap tile layers when the user
  // toggles light/dark in the topbar. Topbar dispatches `dv3-theme-change`.
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsLight(document.documentElement.classList.contains("dv3-light"));
    }
    function onThemeChange(e) {
      setIsLight(e.detail?.theme === "light");
    }
    window.addEventListener("dv3-theme-change", onThemeChange);
    return () => window.removeEventListener("dv3-theme-change", onThemeChange);
  }, []);

  const tileBase = isLight
    ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const tileLabels = isLight
    ? "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png";
  const bg = isLight ? "#e8e6df" : "#0a0a0c";

  return (
    <MapContainer
      center={center}
      zoom={8}
      zoomControl={false}
      attributionControl={false}
      scrollWheelZoom
      style={{ width: "100%", height: "100%", background: bg }}
    >
      <TileLayer
        key={isLight ? "light-base" : "dark-base"}
        url={tileBase}
        subdomains="abcd"
        maxZoom={18}
        attribution="&copy; OpenStreetMap, &copy; CARTO"
      />
      <TileLayer
        key={isLight ? "light-labels" : "dark-labels"}
        url={tileLabels}
        subdomains="abcd"
        maxZoom={18}
        pane="shadowPane"
      />

      <AntalyaTint />
      <MapClickClear onClick={() => onFocusChange && onFocusChange(null)} />

      {districts.map((d) => {
        const lat = d.latitude ?? d.lat;
        const lon = d.longitude ?? d.lon;
        if (lat == null || lon == null) return null;
        const icon = buildDistrictIcon(d, focusId === d.district_id);
        return (
          <Marker
            key={d.district_id}
            position={[lat, lon]}
            icon={icon}
            eventHandlers={{
              click: (e) => {
                // Prevent the click from bubbling to the map's click
                // handler, which would immediately clear focus again.
                L.DomEvent.stopPropagation(e);
                if (onFocusChange) onFocusChange(d.district_id);
              }
            }}
          />
        );
      })}

      {showFires && fires.map((f) => {
        const lat = f.latitude ?? f.lat;
        const lon = f.longitude ?? f.lon;
        if (lat == null || lon == null) return null;
        const detected = f.detected_at ? new Date(f.detected_at) : null;
        const detectedLabel = detected && !Number.isNaN(detected.getTime())
          ? detected.toLocaleString(undefined, {
              month: "2-digit", day: "2-digit",
              hour: "2-digit", minute: "2-digit"
            })
          : null;
        return (
          <Marker
            key={f.fire_id || f.id}
            position={[lat, lon]}
            icon={buildFireIcon()}
          >
            <Popup className="dv3-fire-popup" closeButton={false}>
              <div className="dv3-fire-popup-inner">
                <div className="dv3-fire-popup-head">
                  <span className="dv3-fire-popup-dot" />
                  <strong>Active Fire</strong>
                </div>
                {f.district_name && (
                  <div className="dv3-fire-popup-row">
                    <span>District</span><strong>{f.district_name}</strong>
                  </div>
                )}
                {f.source && (
                  <div className="dv3-fire-popup-row">
                    <span>Source</span><strong>{f.source}</strong>
                  </div>
                )}
                {f.confidence && (
                  <div className="dv3-fire-popup-row">
                    <span>Confidence</span><strong>{f.confidence}</strong>
                  </div>
                )}
                {detectedLabel && (
                  <div className="dv3-fire-popup-row">
                    <span>Detected</span><strong>{detectedLabel}</strong>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {focusId && <FlyToFocus districts={districts} focusId={focusId} />}
    </MapContainer>
  );
}
