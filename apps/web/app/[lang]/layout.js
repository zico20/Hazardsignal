import { redirect } from "next/navigation";
import InstallAppHint from "../../components/InstallAppHint";
import MobileBottomNavV2 from "../../components/MobileBottomNavV2";
import ParticleCanvas from "../../components/ParticleCanvas";
import SoftRevealController from "../../components/SoftRevealController";
import SplashScreen from "../../components/SplashScreen";
import { getMessages, normalizeLocale } from "../../lib/i18n";

// Force every [lang] route to be server-rendered on demand. Without this,
// Next.js 15 dev tries static-path generation and crashes its worker on
// child components that use dynamic({ ssr: false }) (e.g. RiskMapShell).
export const dynamic = "force-dynamic";

export default async function LocaleLayout({ children, params }) {
  const { lang } = await params;
  const safeLocale = normalizeLocale(lang);
  const messages = getMessages(safeLocale);

  if (safeLocale !== lang) {
    redirect("/" + safeLocale);
  }

  return (
    <div className="locale-root" lang={safeLocale} dir={messages.dir} data-locale={safeLocale}>
      <SplashScreen />
      <ParticleCanvas />
      <SoftRevealController />
      {children}
      <InstallAppHint messages={messages} />
      <MobileBottomNavV2 locale={safeLocale} />
    </div>
  );
}
