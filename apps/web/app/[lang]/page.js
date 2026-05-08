import MobileMapConsole from "../../components/MobileMapConsole";
import DesktopShellV3 from "../../components/DesktopShellV3";
import DesktopHomeV3 from "../../components/DesktopHomeV3";
import {
  getActiveFireDaily,
  getAlertEvents,
  getAlertRules,
  getDistrictRiskDaily,
  getLatestRun,
  getMapConfig,
  getWeatherData,
  deriveOperationalSeverity,
  sortDistrictsForOperations
} from "../../lib/data";
import { getMessages, normalizeLocale } from "../../lib/i18n";
import { deriveMissionState } from "../../lib/mission";
import { getTelegramSubscribeUrl } from "../../lib/publicLinks";

export default async function DashboardPage({ params }) {
  const resolvedParams = await params;
  const locale = normalizeLocale(resolvedParams.lang);
  const messages = getMessages(locale);

  const [latestRun, districtRows, fires, alerts, rules, weather, mapConfig] = await Promise.all([
    getLatestRun(),
    getDistrictRiskDaily(),
    getActiveFireDaily(),
    getAlertEvents(),
    getAlertRules(),
    getWeatherData(),
    getMapConfig()
  ]);

  const districts = sortDistrictsForOperations(districtRows, rules).map((district) => ({
    ...district,
    operational_severity: deriveOperationalSeverity(district, rules)
  }));
  const recentAlerts = alerts.slice(0, 8);
  const missionState = deriveMissionState({ latestRun, districts, fires, alerts: recentAlerts });

  const runDate = latestRun?.run_date || "-";
  const criticalDistricts = latestRun?.critical_districts ?? 0;
  const activeFireDistricts = latestRun?.active_fire_districts ?? 0;
  const peakProbability = districts.reduce((max, district) => Math.max(max, district.max_fire_prob ?? 0), 0);

  return (
    <div className="shell" suppressHydrationWarning>
      <div className="m-route-mobile-only">
        <MobileMapConsole
          districts={districts}
          fires={fires}
          messages={messages}
          locale={locale}
          missionState={missionState}
          criticalDistricts={criticalDistricts}
          activeFireDistricts={activeFireDistricts}
          peakProbability={peakProbability}
          runDate={runDate}
          weather={weather}
        />
      </div>

      <div className="m-route-desktop-only">
        <DesktopShellV3
          telegramUrl={getTelegramSubscribeUrl()}
          locale={locale}
          messages={messages}
          currentPath="/"
          pageTitle={messages.home?.mapTitle || messages.appName}
          pageSub={messages.home?.intro}
          runDate={runDate}
          modelName={latestRun?.selected_model || "RandomForest"}
          criticalAlertCount={recentAlerts.filter((a) => a.severity === "Critical").length}
        >
          <DesktopHomeV3
            locale={locale}
            messages={messages}
            districts={districts}
            fires={fires}
            alerts={recentAlerts}
            weather={weather}
            runDate={runDate}
            legend={mapConfig?.legend || []}
          />
        </DesktopShellV3>
      </div>
    </div>
  );
}
