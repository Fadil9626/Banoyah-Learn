import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Mail, BellRing, Loader2, Check, Send, Play, Clock } from "lucide-react";
import api from "../lib/api";
import PageHeader from "../components/PageHeader";

const TABS = [
  { key: "email", label: "Email", icon: Mail },
  { key: "reminders", label: "Reminders", icon: BellRing },
];

export default function Settings() {
  const [tab, setTab] = useState("email");
  const [data, setData] = useState(null);

  const load = () => api("settings").then(setData).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Email delivery and re-certification reminders." />
      <div className="flex items-center gap-1 mb-6 border-b border-line">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === key ? "text-brand border-brand" : "text-muted border-transparent hover:text-content"
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>
      {!data ? <div className="py-16 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>
        : tab === "email" ? <EmailTab data={data.mail} reload={load} />
        : <RemindersTab data={data.reminders} runtime={data.runtime} reload={load} />}
    </div>
  );
}

function Toggle({ on, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? "bg-ok" : "bg-surface-2 border border-line"}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

const Row = ({ title, desc, children }) => (
  <div className="flex items-center justify-between gap-4 bg-surface-2/50 border border-line rounded-xl px-4 py-3">
    <div><p className="text-sm font-semibold text-content">{title}</p><p className="text-xs text-muted">{desc}</p></div>
    {children}
  </div>
);

function EmailTab({ data, reload }) {
  const [f, setF] = useState({ ...data, smtp_pass: "" });
  const [saving, setSaving] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const body = { ...f }; if (!body.smtp_pass) delete body.smtp_pass;
      await api("settings/mail", { method: "PUT", body: JSON.stringify(body) });
      toast.success("Email settings saved"); reload();
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };
  const sendTest = async () => {
    if (!testTo.trim()) return toast.error("Enter a recipient");
    setTesting(true);
    try { await api("settings/mail/test", { method: "POST", body: JSON.stringify({ to: testTo.trim(), smtp_pass: f.smtp_pass || undefined }) }); toast.success(`Test sent to ${testTo.trim()}`); }
    catch (e) { toast.error(e.message); } finally { setTesting(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Row title="Enable outbound email" desc="Required to send re-certification reminders.">
        <Toggle on={f.mail_enabled} onClick={() => set("mail_enabled", !f.mail_enabled)} />
      </Row>
      <div className="grid grid-cols-2 gap-4">
        <Field label="SMTP host" hint="e.g. smtp.gmail.com"><input className="input" value={f.smtp_host} onChange={(e) => set("smtp_host", e.target.value)} placeholder="smtp.gmail.com" /></Field>
        <Field label="Port" hint="587 (STARTTLS) or 465 (SSL)"><input className="input" type="number" value={f.smtp_port} onChange={(e) => set("smtp_port", e.target.value)} /></Field>
      </div>
      <Row title="Use SSL" desc="On for port 465, off for 587."><Toggle on={f.smtp_secure} onClick={() => set("smtp_secure", !f.smtp_secure)} /></Row>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Username" hint="Usually the full email"><input className="input" value={f.smtp_user} onChange={(e) => set("smtp_user", e.target.value)} placeholder="you@gmail.com" /></Field>
        <Field label="Password" hint={data.smtp_pass_set ? "Saved — leave blank to keep" : "Gmail: use an App Password"}><input className="input" type="password" value={f.smtp_pass} onChange={(e) => set("smtp_pass", e.target.value)} placeholder={data.smtp_pass_set ? "•••••••• (saved)" : "App password"} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="From address" hint="Defaults to username"><input className="input" value={f.mail_from} onChange={(e) => set("mail_from", e.target.value)} placeholder="you@gmail.com" /></Field>
        <Field label="From name" hint="Shown as the sender"><input className="input" value={f.mail_from_name} onChange={(e) => set("mail_from_name", e.target.value)} /></Field>
      </div>
      <button onClick={save} disabled={saving} className="btn-brand">{saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save settings</button>

      <div className="border-t border-line pt-6">
        <Field label="Send a test email" hint="Verifies the settings above. Uses the password typed here if unsaved.">
          <div className="flex gap-2">
            <input className="input" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" />
            <button onClick={sendTest} disabled={testing} className="btn-brand flex-shrink-0">{testing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send test</button>
          </div>
        </Field>
      </div>
    </div>
  );
}

function RemindersTab({ data, runtime, reload }) {
  const [f, setF] = useState({ ...data });
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    try { await api("settings/reminders", { method: "PUT", body: JSON.stringify(f) }); toast.success("Reminder settings saved"); reload(); }
    catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };
  const runNow = async () => {
    setRunning(true);
    try { const s = await api("settings/reminders/run", { method: "POST" }); toast.success(`Done — ${s.reminders + s.assignment_reminders} reminder(s), ${s.assignment_overdue} overdue, ${s.expired} expiry`); reload(); }
    catch (e) { toast.error(e.message); } finally { setRunning(false); }
  };
  const fmt = (iso) => iso ? new Date(iso).toLocaleString() : "—";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted"><Clock size={14} /> Last run: {fmt(runtime?.last_run)}</div>
          <button onClick={runNow} disabled={running} className="btn-brand">{running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} Run now</button>
        </div>
        {runtime?.last_summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {[
              ["Cert reminders", runtime.last_summary.reminders],
              ["Expiry notices", runtime.last_summary.expired],
              ["Due reminders", runtime.last_summary.assignment_reminders],
              ["Overdue notices", runtime.last_summary.assignment_overdue],
              ["Emailed", runtime.last_summary.emailed],
            ].map(([l, v]) => (
              <div key={l} className="bg-surface-2/60 border border-line rounded-xl px-4 py-3"><p className="text-2xl font-black text-content tabular-nums">{v ?? 0}</p><p className="text-xs text-muted">{l}</p></div>
            ))}
          </div>
        )}
      </div>

      <Row title="Enable reminders" desc="Email learners before their certificates expire."><Toggle on={f.reminder_enabled} onClick={() => set("reminder_enabled", !f.reminder_enabled)} /></Row>
      <Field label="Reminder thresholds (days before expiry)" hint="Comma-separated, e.g. 30,7,1 — one email each time a learner crosses a threshold.">
        <input className="input" value={f.reminder_days} onChange={(e) => set("reminder_days", e.target.value)} placeholder="30,7,1" />
      </Field>
      <Field label="Check interval (minutes)" hint="How often to scan. Minimum 30; default 720 (twice daily).">
        <input className="input" type="number" value={f.reminder_interval_min} onChange={(e) => set("reminder_interval_min", e.target.value)} />
      </Field>
      <div className="flex items-center gap-3 text-[11px] text-muted bg-surface-2/40 border border-line rounded-xl px-4 py-3">
        <BellRing size={14} className="flex-shrink-0" /> Reminders require email to be enabled and configured on the Email tab.
      </div>
      <button onClick={save} disabled={saving} className="btn-brand">{saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save settings</button>
    </div>
  );
}

function Field({ label, hint, children }) {
  return <div><label className="label">{label}</label>{children}{hint && <p className="text-[11px] text-faint mt-1">{hint}</p>}</div>;
}
