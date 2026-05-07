import Link from "next/link";
import AdminLoginForm from "../../../../components/AdminLoginForm";
import { isAdminAuthenticated, isAdminConfigured } from "../../../../lib/adminAuth";
import { getMessages, normalizeLocale } from "../../../../lib/i18n";
import { redirect } from "next/navigation";

export const metadata = {
  robots: {
    index: false,
    follow: false
  }
};

const Logo = (p) => (
  <svg viewBox="0 0 64 64" {...p}>
    <defs>
      <linearGradient id="hs-arc-login" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#ff5a1f" />
        <stop offset="100%" stopColor="#ff8a3d" />
      </linearGradient>
    </defs>
    <path d="M 8 42 A 24 24 0 0 1 56 42" fill="none" stroke="url(#hs-arc-login)" strokeWidth="3.2" strokeLinecap="round" opacity="0.95" />
    <path d="M 16 42 A 16 16 0 0 1 48 42" fill="none" stroke="url(#hs-arc-login)" strokeWidth="3.2" strokeLinecap="round" opacity="0.6" />
    <path d="M 23 42 A 9 9 0 0 1 41 42" fill="none" stroke="url(#hs-arc-login)" strokeWidth="3.2" strokeLinecap="round" opacity="0.3" />
    <circle cx="32" cy="42" r="3.4" fill="#ff8a3d" />
    <circle cx="32" cy="42" r="1.6" fill="#fff" opacity="0.95" />
  </svg>
);

export default async function AdminLoginPage({ params }) {
  const { lang } = await params;
  const locale = normalizeLocale(lang);
  const messages = getMessages(locale);

  if (await isAdminAuthenticated()) {
    redirect(`/${locale}/admin`);
  }

  return (
    <div className="dv3-login-page">
      <div className="dv3-login-card">
        <div className="dv3-login-brand">
          <div className="dv3-brand-mark"><Logo /></div>
          <div className="dv3-brand-name">
            <span className="dv3-brand-name-base">Hazard</span>
            <span className="dv3-brand-name-accent">Signal</span>
          </div>
        </div>

        <div className="dv3-login-eyebrow">{messages.admin.loginEyebrow}</div>
        <h1 className="dv3-login-title">{messages.admin.loginTitle}</h1>
        <p className="dv3-login-intro">{messages.admin.loginIntro}</p>

        <div className="dv3-login-form-wrap">
          {isAdminConfigured() ? (
            <AdminLoginForm locale={locale} labels={messages.admin} />
          ) : (
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: "1.1rem" }}>{messages.admin.configMissingTitle}</h2>
              <p style={{ color: "var(--dv3-muted)", margin: 0 }}>{messages.admin.configMissingBody}</p>
            </div>
          )}
        </div>

        <Link href={`/${locale}`} className="dv3-login-back">← Back to live operations</Link>
      </div>
    </div>
  );
}
