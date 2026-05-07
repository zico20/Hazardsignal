"use client";

import { useState } from "react";

const PlusIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M12 5v14M5 12h14" /></svg>);
const CheckIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><path d="m5 12 5 5 9-11" /></svg>);
const SendIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>);

function deriveAvatar(name) {
  if (!name) return "?";
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function DesktopAdminV3({
  initialRules = {},
  initialSubscribers = [],
  districts = [],
  user = "ops@hazardsignal.com"
}) {
  const [tab, setTab] = useState("subs");

  // Subscribers
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ channel_type: "telegram", chat_id: "", district_scope: "all" });
  const [addBusy, setAddBusy] = useState(false);

  // Rules
  const [rules, setRules] = useState({
    probability_watch_min: initialRules.probability_watch_min ?? 0.4,
    probability_warning_min: initialRules.probability_warning_min ?? 0.7,
    high_or_very_high_area_pct_min: initialRules.high_or_very_high_area_pct_min ?? 5,
    hotspot_count_critical_min: initialRules.hotspot_count_critical_min ?? 1
  });
  const [rulesBusy, setRulesBusy] = useState(false);
  const [rulesSaved, setRulesSaved] = useState(false);

  // Test alert
  const [testForm, setTestForm] = useState({
    district: districts[0]?.district_id || "manavgat",
    severity: "Critical",
    message: "Manual escalation — fire crew dispatched."
  });
  const [testSent, setTestSent] = useState(false);

  async function handleAddSubscriber(e) {
    e.preventDefault();
    if (addBusy) return;
    setAddBusy(true);
    try {
      const res = await fetch("/api/admin/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm)
      });
      const data = await res.json();
      if (data?.subscriber) {
        setSubscribers((prev) => [data.subscriber, ...prev]);
        setAddForm({ channel_type: "telegram", chat_id: "", district_scope: "all" });
        setAddOpen(false);
      }
    } finally {
      setAddBusy(false);
    }
  }

  async function handleSaveRules() {
    if (rulesBusy) return;
    setRulesBusy(true);
    try {
      const res = await fetch("/api/admin/alert-rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rules)
      });
      const data = await res.json();
      if (data?.rules) setRules(data.rules);
      setRulesSaved(true);
      setTimeout(() => setRulesSaved(false), 2400);
    } finally {
      setRulesBusy(false);
    }
  }

  async function handleSendTest() {
    if (testSent) return;
    try {
      await fetch("/api/admin/alerts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ districtId: testForm.district })
      });
    } catch {}
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2400);
  }

  return (
    <div className="dv3-admin-grid dv3-page-pad">
      <aside className="dv3-admin-side">
        <div className="dv3-rail-eyebrow" style={{ padding: "0 14px 8px" }}>Console</div>
        <button type="button" className={tab === "subs" ? "active" : ""} onClick={() => setTab("subs")}>Subscribers</button>
        <button type="button" className={tab === "rules" ? "active" : ""} onClick={() => setTab("rules")}>Alert rules</button>
        <button type="button" className={tab === "test" ? "active" : ""} onClick={() => setTab("test")}>Test alert</button>
        <div className="dv3-admin-user">
          Logged in as <strong>{user}</strong>
        </div>
      </aside>

      <div>
        {tab === "subs" && (
          <div className="dv3-panel">
            <div className="dv3-panel-h">
              <div>
                <div className="dv3-panel-eyebrow">Telegram</div>
                <div className="dv3-panel-title" style={{ marginTop: 4 }}>Telegram subscribers</div>
              </div>
              <button type="button" className="dv3-btn-primary" onClick={() => setAddOpen((v) => !v)}>
                <PlusIcon style={{ width: 14, height: 14 }} /> Add subscriber
              </button>
            </div>

            {addOpen && (
              <form className="dv3-admin-add-form" onSubmit={handleAddSubscriber}>
                <div className="dv3-form-row">
                  <label>Channel</label>
                  <select
                    value={addForm.channel_type}
                    onChange={(e) => setAddForm({ ...addForm, channel_type: e.target.value })}
                  >
                    <option value="telegram">Telegram</option>
                  </select>
                </div>
                <div className="dv3-form-row">
                  <label>Chat ID</label>
                  <input
                    value={addForm.chat_id}
                    onChange={(e) => setAddForm({ ...addForm, chat_id: e.target.value })}
                    placeholder="-100123456789"
                    required
                  />
                </div>
                <div className="dv3-form-row">
                  <label>District scope</label>
                  <input
                    value={addForm.district_scope}
                    onChange={(e) => setAddForm({ ...addForm, district_scope: e.target.value })}
                    placeholder="all or district id"
                  />
                </div>
                <div style={{ display: "flex", gap: 10, gridColumn: "span 2" }}>
                  <button type="submit" className="dv3-btn-primary" disabled={addBusy}>
                    <CheckIcon style={{ width: 14, height: 14 }} /> {addBusy ? "Saving…" : "Save subscriber"}
                  </button>
                  <button type="button" className="dv3-btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
                </div>
              </form>
            )}

            <div>
              {subscribers.length === 0 ? (
                <div className="dv3-detail-empty" style={{ padding: 32 }}>No subscribers yet.</div>
              ) : subscribers.map((s) => {
                const display = s.label || s.chat_id || s.subscriber_id || "—";
                const sub = s.district_scope || "all";
                const joined = s.created_at ? String(s.created_at).slice(0, 10) : "";
                return (
                  <div key={s.subscriber_id || s.chat_id} className="dv3-subscriber-row">
                    <div className="dv3-sub-avatar">{deriveAvatar(display)}</div>
                    <div>
                      <div className="dv3-sub-name">{display}</div>
                      <div className="dv3-sub-meta">{s.chat_id}{joined ? ` · joined ${joined}` : ""}</div>
                    </div>
                    <span className="dv3-sub-tag">{sub}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "rules" && (
          <div className="dv3-panel">
            <div className="dv3-panel-h">
              <div>
                <div className="dv3-panel-eyebrow">Thresholds</div>
                <div className="dv3-panel-title" style={{ marginTop: 4 }}>Alert thresholds</div>
              </div>
              <button
                type="button"
                className="dv3-btn-primary"
                onClick={handleSaveRules}
                disabled={rulesBusy}
              >
                {rulesSaved ? <CheckIcon style={{ width: 14, height: 14 }} /> : <CheckIcon style={{ width: 14, height: 14 }} />}
                {rulesBusy ? "Saving…" : rulesSaved ? "Saved" : "Save changes"}
              </button>
            </div>
            <div className="dv3-rules-grid">
              <div className="dv3-form-row">
                <label>Watch — min probability</label>
                <input
                  type="number"
                  step="0.01"
                  value={rules.probability_watch_min}
                  onChange={(e) => setRules({ ...rules, probability_watch_min: parseFloat(e.target.value) })}
                />
              </div>
              <div className="dv3-form-row">
                <label>Warning — min probability</label>
                <input
                  type="number"
                  step="0.01"
                  value={rules.probability_warning_min}
                  onChange={(e) => setRules({ ...rules, probability_warning_min: parseFloat(e.target.value) })}
                />
              </div>
              <div className="dv3-form-row">
                <label>Warning — min high-risk area %</label>
                <input
                  type="number"
                  step="0.5"
                  value={rules.high_or_very_high_area_pct_min}
                  onChange={(e) => setRules({ ...rules, high_or_very_high_area_pct_min: parseFloat(e.target.value) })}
                />
              </div>
              <div className="dv3-form-row">
                <label>Critical — min hotspots (24h)</label>
                <input
                  type="number"
                  step="1"
                  value={rules.hotspot_count_critical_min}
                  onChange={(e) => setRules({ ...rules, hotspot_count_critical_min: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>
            <div className="dv3-divider" />
            <div className="dv3-admin-footnote">
              Threshold changes apply on the next daily run at 08:00 Europe/Istanbul.
            </div>
          </div>
        )}

        {tab === "test" && (
          <div className="dv3-panel">
            <div className="dv3-panel-h">
              <div>
                <div className="dv3-panel-eyebrow">Outbound</div>
                <div className="dv3-panel-title" style={{ marginTop: 4 }}>Send a test alert</div>
              </div>
            </div>
            <div className="dv3-rules-grid">
              <div className="dv3-form-row">
                <label>District</label>
                <select
                  value={testForm.district}
                  onChange={(e) => setTestForm({ ...testForm, district: e.target.value })}
                >
                  {districts.map((d) => (
                    <option key={d.district_id} value={d.district_id}>{d.district_name}</option>
                  ))}
                </select>
              </div>
              <div className="dv3-form-row">
                <label>Severity</label>
                <select
                  value={testForm.severity}
                  onChange={(e) => setTestForm({ ...testForm, severity: e.target.value })}
                >
                  <option>Watch</option>
                  <option>Warning</option>
                  <option>Critical</option>
                </select>
              </div>
              <div className="dv3-form-row" style={{ gridColumn: "span 2" }}>
                <label>Message</label>
                <textarea
                  rows="4"
                  value={testForm.message}
                  onChange={(e) => setTestForm({ ...testForm, message: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="button" className="dv3-btn-primary" onClick={handleSendTest}>
                {testSent ? (
                  <><CheckIcon style={{ width: 14, height: 14 }} /> Sent</>
                ) : (
                  <><SendIcon style={{ width: 14, height: 14 }} /> Send test alert</>
                )}
              </button>
              <button type="button" className="dv3-btn-secondary">Preview</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
