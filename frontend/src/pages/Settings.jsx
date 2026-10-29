import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Mail, BellRing, Loader2, Check, Send, Play, Clock, Building2, Upload, ImageOff, X, Sparkles, FlaskConical, RotateCcw, BadgeCheck } from "lucide-react";
import api from "../lib/api";
import PageHeader from "../components/PageHeader";
import ConfirmDialog from "../components/ConfirmDialog";

const TABS = [
  { key: "org", label: "Organization", icon: Building2 },
  { key: "email", label: "Email", icon: Mail },
  { key: "reminders", label: "Reminders", icon: BellRing },
  { key: "ai", label: "AI", icon: Sparkles },
  { key: "practicals", label: "Practicals", icon: FlaskConical },
];

const ACCENTS = ["#4F46E5", "#7C3AED", "#2563EB", "#059669", "#D97706", "#E11D48", "#0891B2"];

export default function Settings() {
  const [tab, setTab] = useState("org");
  const [data, setData] = useState(null);

  const load = () => api("settings").then(setData).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Your organization, email, reminders, AI, and the clinical figures your practicals use." />
      <div className="flex items-center gap-1 mb-6 border-b border-line overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition shrink-0 whitespace-nowrap ${
              tab === key ? "text-brand border-brand" : "text-muted border-transparent hover:text-content"
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>
      {!data ? <div className="py-16 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>
        : tab === "org" ? <BrandingTab data={data.branding} reload={load} />
        : tab === "email" ? <EmailTab data={data.mail} reload={load} />
        : tab === "ai" ? <AiTab data={data.ai} reload={load} />
        : tab === "practicals" ? <PracticalsTab />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="SMTP host" hint="e.g. smtp.gmail.com"><input className="input" value={f.smtp_host} onChange={(e) => set("smtp_host", e.target.value)} placeholder="smtp.gmail.com" /></Field>
        <Field label="Port" hint="587 (STARTTLS) or 465 (SSL)"><input className="input" type="number" value={f.smtp_port} onChange={(e) => set("smtp_port", e.target.value)} /></Field>
      </div>
      <Row title="Use SSL" desc="On for port 465, off for 587."><Toggle on={f.smtp_secure} onClick={() => set("smtp_secure", !f.smtp_secure)} /></Row>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Username" hint="Usually the full email"><input className="input" value={f.smtp_user} onChange={(e) => set("smtp_user", e.target.value)} placeholder="you@gmail.com" /></Field>
        <Field label="Password" hint={data.smtp_pass_set ? "Saved — leave blank to keep" : "Gmail: use an App Password"}><input className="input" type="password" value={f.smtp_pass} onChange={(e) => set("smtp_pass", e.target.value)} placeholder={data.smtp_pass_set ? "•••••••• (saved)" : "App password"} /></Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

function AiTab({ data, reload }) {
  const providers = data.providers || [];
  const [provider, setProvider] = useState(data.ai_provider || "gemini");
  const [key, setKey] = useState("");
  const [model, setModel] = useState(data.ai_model || "");
  const [baseUrl, setBaseUrl] = useState(data.ai_base_url || "http://localhost:11434");
  const [maxQ, setMaxQ] = useState(data.ai_max_questions ?? 20);
  const [saving, setSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const meta = providers.find((p) => p.value === provider) || {};
  const lockedToEnv = data.ai_key_env; // provider/key forced via .env

  // When switching provider, default the model to that provider's recommended one.
  const pickProvider = (v) => {
    setProvider(v);
    const m = providers.find((p) => p.value === v);
    setModel(m?.defaultModel || "");
    setKey("");
  };

  const save = async (extra = {}) => {
    setSaving(true);
    try {
      const body = { ai_provider: provider, ai_model: model || meta.defaultModel || "", ai_base_url: baseUrl, ai_max_questions: maxQ, ...extra };
      if (key.trim()) body.ai_api_key = key.trim();
      await api("settings/ai", { method: "PUT", body: JSON.stringify(body) });
      setKey("");
      toast.success("AI settings saved");
      reload();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="card p-6 space-y-5 max-w-2xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0" style={{ backgroundColor: "rgb(var(--brand) / 0.12)", color: "rgb(var(--brand))" }}>
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="font-bold text-content">AI quiz generation</h3>
          <p className="text-sm text-muted">Auto-draft quiz questions from a course's lessons. Pick a free provider or a paid one.</p>
        </div>
      </div>

      <div className={`flex items-center gap-2 text-sm rounded-xl px-3.5 py-2.5 border ${data.ai_key_set ? "border-ok/30 bg-ok/10 text-ok" : "border-line bg-surface-2/50 text-muted"}`}>
        {data.ai_key_set
          ? <><Check size={16} /> Ready{data.ai_key_env ? " (configured via server environment)" : ""} — generation is enabled.</>
          : <>Not configured yet — generation is disabled.</>}
      </div>

      <Field label="Provider">
        <select className="input" value={provider} onChange={(e) => pickProvider(e.target.value)} disabled={lockedToEnv}>
          {providers.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </Field>

      {meta.needsKey ? (
        <Field label="API key" hint={lockedToEnv ? "A key is set via the server environment and takes precedence." : meta.keyHint}>
          <input className="input font-mono" type="password" autoComplete="off"
            placeholder={data.ai_key_set ? "•••••••••••••• (leave blank to keep)" : "Paste your API key…"}
            value={key} onChange={(e) => setKey(e.target.value)} disabled={lockedToEnv} />
        </Field>
      ) : (
        <Field label="Ollama server URL" hint={meta.keyHint}>
          <input className="input font-mono" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="http://localhost:11434" />
        </Field>
      )}

      <Field label="Model" hint={`Suggestions for ${meta.label || provider}. You can type any model the provider supports.`}>
        <input className="input" list="ai-models" value={model} onChange={(e) => setModel(e.target.value)} placeholder={meta.defaultModel} />
        <datalist id="ai-models">
          {(meta.models || []).map((m) => <option key={m} value={m} />)}
        </datalist>
      </Field>

      <Field label="Max quiz questions per generation" hint="Upper limit an author can request when generating a quiz with AI (1–50).">
        <input className="input max-w-[140px]" type="number" min="1" max="50" value={maxQ}
          onChange={(e) => setMaxQ(e.target.value)} />
      </Field>

      <div className="flex items-center gap-2">
        <button onClick={() => save()} disabled={saving} className="btn-brand">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save AI settings
        </button>
        {data.ai_key_set && !data.ai_key_env && meta.needsKey && (
          <button onClick={() => setConfirmClear(true)}
            disabled={saving} className="btn-ghost" style={{ color: "rgb(var(--danger))" }}>
            <X size={16} /> Remove key
          </button>
        )}
      </div>

      <ConfirmDialog open={confirmClear} busy={saving} confirmLabel="Remove key" icon={X}
        title="Remove API key"
        message={<>Delete the stored API key? Quiz generation will be disabled until a new key is saved.</>}
        onConfirm={async () => { await save({ ai_clear_key: true }); setConfirmClear(false); }}
        onCancel={() => setConfirmClear(false)} />
    </div>
  );
}

function BrandingTab({ data, reload }) {
  const [f, setF] = useState({ org_name: data.org_name, brand_accent: data.brand_accent, brand_logo: data.brand_logo });
  const [saving, setSaving] = useState(false);
  const ref = useRef();
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const onLogo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpe?g)$/.test(file.type)) return toast.error("Logo must be a PNG or JPEG");
    if (file.size > 900_000) return toast.error("Logo must be under ~900 KB");
    const reader = new FileReader();
    reader.onload = (ev) => set("brand_logo", String(ev.target.result || ""));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api("settings/branding", { method: "PUT", body: JSON.stringify(f) });
      toast.success("Branding saved"); reload();
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Field label="Organization name" hint="Shown on certificates and in emails.">
        <input className="input" value={f.org_name} onChange={(e) => set("org_name", e.target.value)} />
      </Field>

      <div>
        <label className="label">Certificate logo <span className="text-faint font-normal">(PNG or JPEG)</span></label>
        <div className="flex items-center gap-4">
          <div onClick={() => ref.current?.click()}
            className="w-28 h-16 rounded-xl border-2 border-dashed border-line hover:border-brand cursor-pointer grid place-items-center overflow-hidden bg-surface-2/40 flex-shrink-0">
            {f.brand_logo ? <img src={f.brand_logo} alt="logo" className="w-full h-full object-contain" /> : <ImageOff size={20} className="text-faint" />}
          </div>
          <div className="space-y-1.5">
            <button type="button" onClick={() => ref.current?.click()} className="btn-ghost px-3 py-1.5 text-xs"><Upload size={13} /> Upload logo</button>
            {f.brand_logo && <button type="button" onClick={() => set("brand_logo", "")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-faint hover:text-danger"><X size={12} /> Remove</button>}
          </div>
          <input ref={ref} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onLogo} />
        </div>
      </div>

      <div>
        <label className="label">Accent colour</label>
        <div className="flex items-center gap-2 flex-wrap">
          {ACCENTS.map((c) => (
            <button key={c} type="button" onClick={() => set("brand_accent", c)}
              className={`w-8 h-8 rounded-lg transition ${f.brand_accent?.toLowerCase() === c.toLowerCase() ? "ring-2 ring-offset-2 ring-offset-surface" : ""}`}
              style={{ backgroundColor: c, boxShadow: f.brand_accent?.toLowerCase() === c.toLowerCase() ? `0 0 0 2px ${c}` : "none" }} />
          ))}
          <input value={f.brand_accent} onChange={(e) => set("brand_accent", e.target.value)} className="input w-28 ml-1 font-mono text-xs" placeholder="#4F46E5" />
        </div>
      </div>

      {/* Live preview */}
      <div>
        <label className="label">Preview</label>
        <div className="rounded-2xl border border-line overflow-hidden">
          <div className="h-2" style={{ backgroundColor: f.brand_accent }} />
          <div className="p-6 text-center bg-surface">
            {f.brand_logo && <img src={f.brand_logo} alt="" className="h-10 mx-auto mb-3 object-contain" />}
            <p className="text-sm font-extrabold text-content tracking-wide">{(f.org_name || "Organization").toUpperCase()}</p>
            <p className="text-[10px] font-bold tracking-[0.2em] mt-2" style={{ color: f.brand_accent }}>CERTIFICATE OF COMPLETION</p>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-brand">{saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save branding</button>
    </div>
  );
}

// ── Practicals ───────────────────────────────────────────────────────────────
// The clinical figures each 3D practical uses: critical limits, disinfectant
// strengths, contact times. Each practical says what may be set and within what
// range; the lab sets its own and records who signed them off.
function PracticalsTab() {
  const [cards, setCards] = useState(null);
  useEffect(() => { api("settings/practicals").then(setCards).catch((e) => toast.error(e.message)); }, []);
  const replace = (c) => setCards((all) => all.map((x) => (x.key === c.key ? c : x)));
  if (!cards) return <div className="py-16 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>;
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start gap-3 text-[13px] text-muted bg-surface-2/40 border border-line rounded-xl px-4 py-3">
        <FlaskConical size={16} className="flex-shrink-0 mt-0.5" />
        <p>
          Set the figures your laboratory's procedures use. A change applies to practicals <b className="text-content">started after you save</b>; runs already
          under way keep the figures they began with, and each run's record keeps them. Lessons and quiz questions are your own text: if they quote a figure, update them in the course editor too.
        </p>
      </div>
      {cards.map((c) => <PracticalCard key={c.key} card={c} onSaved={replace} />)}
    </div>
  );
}

function PracticalCard({ card, onSaved }) {
  const [f, setF] = useState({ ...card.values });
  const [sign, setSign] = useState({ signed_by: card.signed_by, signed_on: card.signed_on });
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => { setF({ ...card.values }); setSign({ signed_by: card.signed_by, signed_on: card.signed_on }); }, [card]);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const dirty = JSON.stringify(f) !== JSON.stringify(card.values) || sign.signed_by !== card.signed_by || sign.signed_on !== card.signed_on;
  const fmtDate = (d) => (d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "");
  const changedSince = card.signed_on && card.updated_at && card.updated_at.slice(0, 10) > card.signed_on;
  const short = card.title.split(" · ")[0];

  const save = async () => {
    setSaving(true);
    try {
      const c = await api(`settings/practicals/${card.key}`, { method: "PUT", body: JSON.stringify({ values: f, ...sign }) });
      onSaved(c); toast.success(`${short}: saved. New runs use these figures.`);
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };
  const reset = async () => {
    setSaving(true);
    try { onSaved(await api(`settings/practicals/${card.key}`, { method: "DELETE" })); toast.success(`${short}: back to the default figures`); setConfirmReset(false); }
    catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <section className="card p-5 space-y-4" aria-labelledby={`p-${card.key}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id={`p-${card.key}`} className="font-bold text-content">{card.title}</h3>
          <p className="text-xs text-muted mt-0.5">
            {card.courses.length ? <>Used by {card.courses.map((c) => c.title).join(", ")}</> : "Not used by any course yet"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${card.customised ? "border-brand text-brand" : "border-line text-muted"}`}>
            {card.customised ? "Your lab's figures" : "Default figures"}
          </span>
          {card.signed_by && card.signed_on && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 text-ok" style={{ background: "rgb(var(--ok) / 0.12)" }}>
              <BadgeCheck size={12} /> Signed off {fmtDate(card.signed_on)}
            </span>
          )}
          {changedSince && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-warn" style={{ background: "rgb(var(--warn) / 0.12)" }}>Changed since sign-off</span>}
        </div>
      </div>

      <div className="space-y-3">
        {card.fields.map((fd) => <SettingField key={fd.key} fd={fd} value={f[fd.key]} onChange={(v) => set(fd.key, v)} />)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-line pt-4">
        <Field label="Signed off by" hint="Who in the lab approved these figures.">
          <input className="input" value={sign.signed_by} maxLength={80} onChange={(e) => setSign((s) => ({ ...s, signed_by: e.target.value }))} placeholder="e.g. Dr F. Kamara, lab manager" />
        </Field>
        <Field label="Signed off on">
          <input className="input" type="date" value={sign.signed_on} onChange={(e) => setSign((s) => ({ ...s, signed_on: e.target.value }))} />
        </Field>
      </div>
      {card.updated_by && <p className="text-[11px] text-faint">Last changed by {card.updated_by}, {fmtDate(card.updated_at)}.</p>}

      <div className="flex flex-wrap gap-2">
        <button onClick={save} disabled={saving || !dirty} className="btn-brand">{saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save</button>
        {card.customised && <button onClick={() => setConfirmReset(true)} disabled={saving} className="btn-ghost"><RotateCcw size={16} /> Back to defaults</button>}
      </div>

      <ConfirmDialog open={confirmReset} busy={saving} confirmLabel="Use defaults" icon={RotateCcw}
        title="Go back to the default figures?"
        message={<>Your lab's figures and sign-off for {short} are removed. Practicals started after this use the defaults.</>}
        onConfirm={reset} onCancel={() => setConfirmReset(false)} />
    </section>
  );
}

function SettingField({ fd, value, onChange }) {
  const id = `set-${fd.key}`;
  if (fd.type === "bool") return (
    <div className="flex items-center justify-between gap-4 bg-surface-2/50 border border-line rounded-xl px-4 py-3">
      <div><p className="text-sm font-semibold text-content" id={id}>{fd.label}</p>{fd.help && <p className="text-xs text-muted">{fd.help}</p>}</div>
      <Toggle on={!!value} onClick={() => onChange(!value)} />
    </div>
  );
  const dp = fd.type === "number" && fd.step < 1 ? 1 : 0, n = (x) => Number(x).toFixed(dp);
  const range = fd.type === "number" ? `${n(fd.min)}–${n(fd.max)}${fd.unit ? ` ${fd.unit}` : ""}, default ${n(fd.default)}` : fd.type === "text" ? `Default: ${fd.default}` : null;
  return (
    <div>
      <label className="label" htmlFor={id}>{fd.label}</label>
      {fd.type === "choice" ? (
        <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          {fd.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      ) : fd.type === "number" ? (
        <div className="flex items-center gap-2">
          <input id={id} className="input max-w-[160px] tabular-nums" type="number" inputMode="decimal" min={fd.min} max={fd.max} step={fd.step || 1}
            value={value} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
          {fd.unit && <span className="text-sm text-muted">{fd.unit}</span>}
        </div>
      ) : (
        <input id={id} className="input" value={value} maxLength={fd.maxLength || 60} onChange={(e) => onChange(e.target.value)} />
      )}
      <p className="text-[11px] text-faint mt-1">{[fd.help, range].filter(Boolean).join(" · ")}</p>
    </div>
  );
}
