import AdminLogoutButton from "../../../components/AdminLogoutButton";
import DesktopShellV3 from "../../../components/DesktopShellV3";
import DesktopAdminV3 from "../../../components/DesktopAdminV3";
import { requireAdminPage } from "../../../lib/adminAuth";
import {
  getAlertEvents,
  getAlertRules,
  getDistrictRiskDaily,
  getLatestRun,
  getSubscribers
} from "../../../lib/data";
import { getMessages, normalizeLocale } from "../../../lib/i18n";

export const metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminPage({ params }) {
  const { lang } = await params;
  const locale = normalizeLocale(lang);
  const messages = getMessages(locale);

  await requireAdminPage(locale);

  const [initialRules, initialSubscribers, latestRun, alerts, districts] = await Promise.all([
    getAlertRules(),
    getSubscribers(),
    getLatestRun(),
    getAlertEvents(),
    getDistrictRiskDaily()
  ]);

  return (
    <div className="shell">
      <div className="m-route-desktop-only">
        <DesktopShellV3
          locale={locale}
          messages={messages}
          currentPath="/admin"
          pageTitle={messages.admin?.title || "Admin"}
          pageSub={messages.admin?.intro || ""}
          runDate={latestRun?.run_date || "-"}
          modelName={latestRun?.selected_model || "RandomForest"}
          criticalAlertCount={alerts.filter((a) => a.severity === "Critical").length}
        >
          <div className="dv3-page-pad" style={{ paddingBottom: 24 }}>
            <div className="dv3-admin-toolbar">
              <AdminLogoutButton locale={locale} label={messages.admin.logout} />
            </div>
          </div>
          <DesktopAdminV3
            initialRules={initialRules}
            initialSubscribers={initialSubscribers}
            districts={districts}
          />
        </DesktopShellV3>
      </div>
    </div>
  );
}
