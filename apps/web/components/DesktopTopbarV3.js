"use client";

import { useRouter } from "next/navigation";
import { buildLocalePath } from "../lib/i18n";

export default function DesktopTopbarV3({
  locale = "en",
  messages,
  currentPath = "/",
  pageTitle,
  pageSub,
  runDate
}) {
  const router = useRouter();
  const runLabel = messages?.common?.run || messages?.home?.lastRun || "Run";

  function switchLocale(next) {
    const path = buildLocalePath(next, currentPath);
    router.push(path);
  }

  const langs = ["EN", "TR"];

  return (
    <header className="dv3-topbar">
      <div>
        <div className="dv3-topbar-title">{pageTitle || messages?.home?.mapTitle || ""}</div>
        <div className="dv3-topbar-sub">ANTALYA, TR</div>
      </div>
      <div className="dv3-topbar-spacer"></div>

      <div className="dv3-run-pill">
        <span className="dv3-run-dot"></span>
        <span>{runLabel}: {runDate || "-"}</span>
      </div>

      <div className="dv3-lang-switch">
        {langs.map((l) => {
          const code = l.toLowerCase();
          return (
            <button
              key={l}
              type="button"
              className={code === locale ? "active" : ""}
              onClick={() => switchLocale(code)}
            >
              {l}
            </button>
          );
        })}
      </div>
    </header>
  );
}
