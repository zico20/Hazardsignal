import Link from "next/link";
import MobileAboutContent from "../../../components/MobileAboutContent";
import DesktopShellV3 from "../../../components/DesktopShellV3";
import { getLatestRun, getDistrictRiskDaily, getAlertEvents } from "../../../lib/data";
import { getMessages, normalizeLocale } from "../../../lib/i18n";

export default async function AboutPage({ params }) {
  const resolvedParams = await params;
  const locale = normalizeLocale(resolvedParams.lang);
  const messages = getMessages(locale);
  const [latestRun, districts, alerts] = await Promise.all([
    getLatestRun(),
    getDistrictRiskDaily(),
    getAlertEvents()
  ]);

  const stats = {
    districts: districts.length,
    alerts30d: alerts.filter((a) => {
      const t = a.sent_at ? new Date(a.sent_at).getTime() : 0;
      return t && Date.now() - t < 30 * 86400000;
    }).length,
    runDate: latestRun?.run_date || "-"
  };

  return (
    <div className="shell">
      <div className="m-route-mobile-only">
        <MobileAboutContent locale={locale} runDate={latestRun?.run_date || "-"} stats={stats} />
      </div>

      <div className="m-route-desktop-only">
        <DesktopShellV3
          locale={locale}
          messages={messages}
          currentPath="/about"
          pageTitle="About HazardSignal"
          pageSub={`${stats.districts} districts · ${stats.alerts30d} alerts in 30d`}
          runDate={stats.runDate}
          modelName={latestRun?.selected_model || "RandomForest"}
          criticalAlertCount={alerts.filter((a) => a.severity === "Critical").length}
        >
          <div className="dv3-page-pad" style={{ maxWidth: 720, margin: "0 auto" }}>
            <h1 className="dv3-method-h1">About HazardSignal</h1>
            <p className="dv3-method-lede">
              HazardSignal is an operational platform delivering daily wildfire-risk signals for the Antalya region.
            </p>
            <p>
              <Link className="dv3-btn-secondary" href={"/" + locale + "/methodology"}>
                Read the methodology →
              </Link>
            </p>
          </div>
        </DesktopShellV3>
      </div>
    </div>
  );
}
