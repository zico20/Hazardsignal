"use client";

import { useEffect, useState } from "react";

const BellIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 0 1 12 0v5l2 3H4l2-3V8z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>);
const BellOffIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 0 1 9.6-4.8" /><path d="M18 13V8" /><path d="M6 13v-5" /><path d="M4 16l2-3" /><path d="M20 16H8" /><path d="M10 19a2 2 0 0 0 4 0" /><path d="M2 2l20 20" /></svg>);

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// Compact icon-only push subscription toggle for the V3 topbar.
// Same wire-up as PushSubscribeButton, but rendered as a single square
// button so it sits flush next to the theme toggle.
export default function DesktopPushToggleV3() {
  const [state, setState] = useState("idle"); // idle | loading | subscribed | unsupported
  const [vapidKey, setVapidKey] = useState(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    fetch("/api/push/vapid-public-key")
      .then((r) => r.json())
      .then((data) => {
        if (data.publicKey) setVapidKey(data.publicKey);
        else setState("unsupported");
      })
      .catch(() => setState("unsupported"));
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => { if (sub) setState("subscribed"); });
    });
  }, []);

  async function subscribe() {
    if (!vapidKey) return;
    setState("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState("idle"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub)
      });
      setState("subscribed");
    } catch {
      setState("idle");
    }
  }

  async function unsubscribe() {
    setState("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint })
        });
        await sub.unsubscribe();
      }
      setState("idle");
    } catch {
      setState("subscribed");
    }
  }

  const isOn = state === "subscribed";
  const isReady = state !== "unsupported" && !!vapidKey;
  const disabled = state === "loading" || !isReady;

  let title;
  if (state === "unsupported") title = "Push notifications not supported";
  else if (!vapidKey)          title = "Push notifications not configured";
  else if (isOn)               title = "Disable push alerts";
  else                          title = "Enable push alerts";

  return (
    <button
      type="button"
      className={"dv3-push-toggle" + (isOn ? " is-on" : "")}
      onClick={!disabled ? (isOn ? unsubscribe : subscribe) : undefined}
      disabled={disabled}
      aria-pressed={isOn}
      aria-label={title}
      title={title}
    >
      {isOn ? <BellIcon /> : <BellOffIcon />}
    </button>
  );
}
