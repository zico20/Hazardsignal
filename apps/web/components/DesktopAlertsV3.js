"use client";

import { useState, useMemo } from "react";

const SearchIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>);

function shortDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  // Locale-aware short format: "5/7/2026, 12:03" (no trailing colon).
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function DesktopAlertsV3({ locale = "en", messages, alerts = [] }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    let arr = alerts;
    if (filter !== "all") {
      arr = arr.filter((a) => (a.severity || "").toLowerCase() === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter((a) => (a.district_name || "").toLowerCase().includes(q));
    }
    return arr;
  }, [alerts, filter, search]);

  const t = messages?.alerts || {};
  const home = messages?.home || {};

  return (
    <div className="dv3-page-pad">
      <div className="dv3-toolbar">
        <div className="dv3-search-box dv3-toolbar-search">
          <SearchIcon />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search || "Search by district…"}
          />
        </div>
        {[
          { k: "all",      l: t.all || "All" },
          { k: "critical", l: t.critical || "Critical" },
          { k: "warning",  l: t.warning || "Warning" },
          { k: "watch",    l: t.watch || "Watch" }
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
        <div className="dv3-toolbar-count">{rows.length} {messages?.common?.of || "of"} {alerts.length}</div>
      </div>

      <div className="dv3-alerts-table-wrap">
        <table className="dv3-alerts-table">
          <thead>
            <tr>
              <th>{t.status || "Severity"}</th>
              <th>{home.district || "District"}</th>
              <th>{messages?.common?.note || "Trigger"}</th>
              <th className="dv3-th-num">{t.maxProb || home.maxProb || "Probability"}</th>
              <th className="dv3-th-num">{t.highArea || home.highArea || "Area"}</th>
              <th className="dv3-th-num">{t.hotspots || home.hotspots || "Hotspots"}</th>
              <th>{t.sentAt || "Sent"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="dv3-table-empty">—</td>
              </tr>
            ) : rows.map((a) => (
              <tr key={a.alert_id || a.id}>
                <td>
                  <span className="dv3-sev-tag" data-sev={a.severity}>{a.severity}</span>
                </td>
                <td className="dv3-td-name">{a.district_name}</td>
                <td className="dv3-td-reason">{a.trigger_reason || a.reason || ""}</td>
                <td className="dv3-th-num">{Math.round((a.max_fire_prob ?? 0) * 100)}%</td>
                <td className="dv3-th-num">{(a.high_or_very_high_area_pct ?? 0).toFixed(1)}%</td>
                <td className="dv3-th-num">{a.hotspot_count_24h ?? 0}</td>
                <td className="dv3-td-time">{shortDateTime(a.sent_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
