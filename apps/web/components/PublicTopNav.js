import Link from "next/link";
import LocaleSwitch from "./LocaleSwitch";
import TelegramSubscribePanel from "./TelegramSubscribePanel";
import PushSubscribeButton from "./PushSubscribeButton";

export default function PublicTopNav({ locale, messages, currentPath = "/" }) {
  return (
    <div className="hero-topbar">
      <div className="hero-topbar-left">
        <div className="topnav public-topnav">
          <Link href={"/" + locale}>{messages.nav.dashboard}</Link>
          <Link className="secondary" href={"/" + locale + "/alerts"}>
            {messages.nav.alerts}
          </Link>
          <Link className="secondary" href={"/" + locale + "/map"}>
            {messages.nav.map || "Map"}
          </Link>
          <Link className="secondary" href={"/" + locale + "/methodology"}>
            {messages.nav.methodology}
          </Link>
        </div>

        <div className="hero-topbar-telegram">
          <TelegramSubscribePanel
            messages={messages}
            title={messages.home.subscriptionTitle}
            body={messages.home.subscriptionBody}
            buttonOnly
            compact
          />
          <PushSubscribeButton />
        </div>
      </div>

      <LocaleSwitch
        locale={locale}
        path={currentPath}
        locales={messages.locales}
        className="public-locale-switch hero-topbar-locale"
      />
    </div>
  );
}
