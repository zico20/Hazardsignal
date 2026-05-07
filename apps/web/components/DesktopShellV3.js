import DesktopSidebarV3 from "./DesktopSidebarV3";
import DesktopTopbarV3 from "./DesktopTopbarV3";

// Server component shell for the new desktop layout (v3).
// Wraps the page content in a sidebar + topbar grid. Mobile is rendered
// separately via `m-route-mobile-only` blocks in each page — this shell
// only renders inside `m-route-desktop-only` so it does not affect mobile.
export default function DesktopShellV3({
  locale,
  messages,
  currentPath,
  pageTitle,
  pageSub,
  runDate,
  modelName,
  criticalAlertCount = 0,
  children
}) {
  return (
    <div className="dv3-app">
      <DesktopSidebarV3
        locale={locale}
        messages={messages}
        currentPath={currentPath}
        runDate={runDate}
        modelName={modelName}
        criticalAlertCount={criticalAlertCount}
      />
      <main className="dv3-main">
        <DesktopTopbarV3
          locale={locale}
          messages={messages}
          currentPath={currentPath}
          pageTitle={pageTitle}
          pageSub={pageSub}
          runDate={runDate}
        />
        <div className="dv3-page">{children}</div>
      </main>
    </div>
  );
}
