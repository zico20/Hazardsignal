"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";

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
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
        <path d="M12 2c1 4-2 5-2 8a4 4 0 0 0 8 0c0-2-1-3-2-4 1 6-3 8-3 8s2-4-1-6c0-2 1-4 0-6z"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: "dv3-leaf-fire-icon",
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
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

  return (
    <MapContainer
      center={center}
      zoom={8}
      zoomControl={false}
      attributionControl={false}
      scrollWheelZoom
      style={{ width: "100%", height: "100%", background: "#0a0a0c" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={18}
        attribution="&copy; OpenStreetMap, &copy; CARTO"
      />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={18}
        pane="shadowPane"
      />

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
              click: () => onFocusChange && onFocusChange(d.district_id)
            }}
          />
        );
      })}

      {showFires && fires.map((f) => {
        const lat = f.latitude ?? f.lat;
        const lon = f.longitude ?? f.lon;
        if (lat == null || lon == null) return null;
        return (
          <Marker
            key={f.fire_id || f.id}
            position={[lat, lon]}
            icon={buildFireIcon()}
          />
        );
      })}

      {focusId && <FlyToFocus districts={districts} focusId={focusId} />}
    </MapContainer>
  );
}
