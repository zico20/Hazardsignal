import Link from "next/link";
import DesktopShellV3 from "../../../../components/DesktopShellV3";
import DesktopDistrictDetailV3 from "../../../../components/DesktopDistrictDetailV3";
import { getAlertEvents, getDistrictById, getDistrictHistory, getLatestRun } from "../../../../lib/data";
import { getMessages, normalizeLocale } from "../../../../lib/i18n";

export default async function DistrictPage({ params }) {
  const resolvedParams = await params;
  const locale = normalizeLocale(resolvedParams.lang);
  const districtId = resolvedParams.districtId;
  const messages = getMessages(locale);

  const [district, history, alerts, latestRun] = await Promise.all([
    getDistrictById(districtId),
    getDistrictHistory(districtId),
    getAlertEvents(),
    getLatestRun()
  ]);

  if (!district) {
    return (
      <div className="shell">
        <section className="panel">
          <h2>{messages.common.notFound}</h2>
          <div style={{ marginTop: 14 }}>
            <Link href={"/" + locale} className="button">
              {messages.common.back}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const relatedAlerts = alerts.filter((item) => item.district_id === districtId).slice(0, 20);
  const runDate = latestRun?.run_date || "-";

  return (
    <div className="shell">
      <div className="m-route-desktop-only">
        <DesktopShellV3
          locale={locale}
          messages={messages}
          currentPath="/districts"
          pageTitle={district.district_name}
          pageSub={`Antalya, TR · ${runDate}`}
          runDate={runDate}
          modelName={latestRun?.selected_model || "RandomForest"}
          criticalAlertCount={alerts.filter((a) => a.severity === "Critical").length}
        >
          <DesktopDistrictDetailV3
            locale={locale}
            messages={messages}
            district={district}
            history={history}
            alerts={relatedAlerts}
            threshold={latestRun?.selected_threshold ?? 0.5}
          />
        </DesktopShellV3>
      </div>
    </div>
  );
}
