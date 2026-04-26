import Link from "next/link";
import MobileTopBar from "./MobileTopBar";

const SEVERITY_COLOR = {
  critical: "#ef4444",
  warning: "#ff8a3d",
  watch: "#ffc83c"
};

const RELATIVE = {
  en: { today: "Today", yesterday: "Yesterday" },
  ar: { today: "اليوم", yesterday: "أمس" },
  tr: { today: "Bugün", yesterday: "Dün" }
};

const EMPTY_TEXT = {
  en: "No alerts have fired in the recent window.",
  ar: "لا توجد تنبيهات في الفترة الأخيرة.",
  tr: "Son zamanlarda uyarı kaydedilmedi."
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function dateLabel(iso, locale) {
  const r = RELATIVE[locale] || RELATIVE.en;
  if (iso === todayIso()) return r.today;
  if (iso === yesterdayIso()) return r.yesterday;
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale === "ar" ? "ar-EG" : locale, {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function timeOnly(iso) {
  if (!iso) return "--:--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function groupByDate(alerts) {
  const groups = {};
  for (const alert of alerts) {
    const iso = alert.sent_at || alert.created_at;
    const key = iso ? new Date(iso).toISOString().slice(0, 10) : "unknown";
    if (!groups[key]) groups[key] = [];
    groups[key].push(alert);
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

export default function MobileHistoryList({ alerts = [], locale = "en", runDate = "-" }) {
  const grouped = groupByDate(alerts);
  const emptyText = EMPTY_TEXT[locale] || EMPTY_TEXT.en;

  return (
    <div className="m-history">
      <MobileTopBar tab="history" locale={locale} runDate={runDate} showScale={false} />

      {alerts.length === 0 ? (
        <div className="m-history-empty">
          <div className="m-history-empty-icon" aria-hidden="true">🔍</div>
          <p>{emptyText}</p>
        </div>
      ) : (
        <div className="m-history-list">
          {grouped.map(([dateKey, items]) => (
            <section key={dateKey} className="m-history-section">
              <header className="m-history-header">
                <h3>{dateLabel(dateKey, locale)}</h3>
                <span className="m-history-count">{items.length}</span>
              </header>

              {items.map((alert) => {
                const sev = String(alert.severity || "watch").toLowerCase();
                const dotColor = SEVERITY_COLOR[sev] || "#888";
                return (
                  <Link
                    key={alert.alert_id}
                    href={"/" + locale + "/districts/" + alert.district_id}
                    className="m-history-item"
                    data-severity={sev}
                  >
                    <span className="m-history-dot" style={{ backgroundColor: dotColor }} aria-hidden="true" />
                    <div className="m-history-body">
                      <div className="m-history-head">
                        <strong className="m-history-name">{alert.district_name}</strong>
                        <span className="m-history-time">{timeOnly(alert.sent_at)}</span>
                      </div>
                      <span className="m-history-reason">{alert.trigger_reason || "—"}</span>
                    </div>
                    <div className="m-history-badge">
                      <span className="m-history-badge-num">{Number(alert.max_fire_prob || 0).toFixed(2)}</span>
                      <span className="m-history-badge-label">{sev}</span>
                    </div>
                  </Link>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
