import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Plus, Plug, Loader2, X, Copy, Check, Trash2, Ban, KeyRound, ShieldAlert, Terminal,
  Webhook, Send,
} from "lucide-react";
import api from "../lib/api";
import PageHeader from "../components/PageHeader";
import ConfirmDialog from "../components/ConfirmDialog";

const EVENT_LABEL = {
  "certification.completed": "Certification completed",
  "certification.expired": "Certification expired",
  "assignment.overdue": "Assignment overdue",
};

export default function ApiAccess() {
  const [rows, setRows] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState(null); // { name, key } shown once
  const [confirm, setConfirm] = useState(null); // { kind: "revoke"|"delete", c }
  const [busy, setBusy] = useState(false);

  const load = () => api("api-consumers").then(setRows).catch((e) => { toast.error(e.message); setRows([]); });
  useEffect(() => { load(); }, []);

  const runConfirm = async () => {
    const { kind, c } = confirm;
    setBusy(true);
    try {
      if (kind === "revoke") { await api(`api-consumers/${c.id}/revoke`, { method: "POST" }); toast.success("Key revoked"); }
      else { await api(`api-consumers/${c.id}`, { method: "DELETE" }); toast.success("Deleted"); }
      setConfirm(null); load();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="API access" subtitle="Let other systems read certification status with a scoped key.">
        <button className="btn-brand" onClick={() => setCreating(true)}><Plus size={16} /> New key</button>
      </PageHeader>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Keys */}
        <div className="card overflow-hidden h-max">
          {rows == null ? (
            <div className="py-16 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>
          ) : rows.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-2 grid place-items-center text-faint"><Plug size={22} /></div>
              <div>
                <p className="font-semibold text-content">No API keys yet</p>
                <p className="text-sm text-muted">Create a key to connect HMS, eLIMS or Remedy.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {rows.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-4">
                  <div className={`w-9 h-9 rounded-lg grid place-items-center flex-shrink-0 ${c.is_active ? "bg-brand/12 text-brand" : "bg-surface-2 text-faint"}`}>
                    <KeyRound size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-content truncate">{c.name}</p>
                    <p className="text-xs text-faint font-mono">{c.key_prefix}…••••</p>
                  </div>
                  <div className="hidden sm:block text-right">
                    <p className="text-[11px] text-faint">Last used</p>
                    <p className="text-xs text-muted">{c.last_used_at ? new Date(c.last_used_at).toLocaleDateString() : "never"}</p>
                  </div>
                  {c.is_active
                    ? <span className="chip" style={{ backgroundColor: "rgb(var(--ok) / 0.14)", color: "rgb(var(--ok))" }}>Active</span>
                    : <span className="chip" style={{ backgroundColor: "rgb(var(--danger) / 0.14)", color: "rgb(var(--danger))" }}>Revoked</span>}
                  {c.is_active && <button onClick={() => setConfirm({ kind: "revoke", c })} title="Revoke" className="text-faint hover:text-warn p-2"><Ban size={15} /></button>}
                  <button onClick={() => setConfirm({ kind: "delete", c })} title="Delete" className="text-faint hover:text-danger p-2"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Docs />
      </div>

      <Webhooks />

      {creating && <CreateModal onClose={() => setCreating(false)}
        onCreated={(c) => { setCreating(false); setNewKey(c); load(); }} />}
      {newKey && <RevealModal data={newKey} onClose={() => setNewKey(null)} />}

      <ConfirmDialog open={!!confirm} busy={busy}
        title={confirm?.kind === "revoke" ? "Revoke API key" : "Delete API key"}
        confirmLabel={confirm?.kind === "revoke" ? "Revoke" : "Delete"}
        icon={confirm?.kind === "revoke" ? Ban : Trash2}
        message={confirm ? (confirm.kind === "revoke"
          ? <>Revoke <strong className="text-content">“{confirm.c.name}”</strong>? Any system using this key will stop working immediately.</>
          : <>Permanently delete <strong className="text-content">“{confirm.c.name}”</strong>? This can’t be undone.</>) : null}
        onConfirm={runConfirm} onCancel={() => setConfirm(null)} />
    </div>
  );
}

function Webhooks() {
  const [eps, setEps] = useState(null);
  const [events, setEvents] = useState([]);
  const [adding, setAdding] = useState(false);
  const [secret, setSecret] = useState(null);
  const [testing, setTesting] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null); // endpoint pending delete
  const [busy, setBusy] = useState(false);

  const load = () => api("webhooks").then((d) => { setEps(d.endpoints); setEvents(d.available_events); }).catch((e) => { toast.error(e.message); setEps([]); });
  useEffect(() => { load(); }, []);

  const del = async () => {
    setBusy(true);
    try { await api(`webhooks/${confirmDel.id}`, { method: "DELETE" }); toast.success("Deleted"); setConfirmDel(null); load(); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };
  const test = async (ep) => {
    setTesting(ep.id);
    try { const r = await api(`webhooks/${ep.id}/test`, { method: "POST" }); r.ok ? toast.success(`Delivered (HTTP ${r.status})`) : toast.error(`Endpoint returned ${r.status || "no response"}`); load(); }
    catch (e) { toast.error(e.message); }
    finally { setTesting(null); }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-content flex items-center gap-2"><Webhook size={16} className="text-brand" /> Webhooks</h2>
        <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setAdding(true)}><Plus size={14} /> Add endpoint</button>
      </div>
      <p className="text-xs text-muted mb-3">Get a signed POST when events happen — no polling. Verify <code className="font-mono text-content">X-Learn-Signature</code> = HMAC-SHA256(body, secret).</p>

      <div className="card overflow-hidden">
        {eps == null ? (
          <div className="py-12 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>
        ) : eps.length === 0 ? (
          <div className="py-12 text-center text-muted text-sm">No webhook endpoints yet.</div>
        ) : (
          <div className="divide-y divide-line">
            {eps.map((ep) => (
              <div key={ep.id} className="flex items-center gap-3 px-5 py-4">
                <div className="w-9 h-9 rounded-lg grid place-items-center flex-shrink-0 bg-brand/12 text-brand"><Webhook size={16} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-content truncate font-mono">{ep.url}</p>
                  <p className="text-xs text-muted truncate">{(ep.events || []).map((e) => EVENT_LABEL[e] || e).join(" · ")}</p>
                </div>
                {ep.last_status != null && (
                  <span className="chip hidden sm:inline-flex" style={{ backgroundColor: ep.last_status >= 200 && ep.last_status < 300 ? "rgb(var(--ok) / 0.14)" : "rgb(var(--danger) / 0.14)", color: ep.last_status >= 200 && ep.last_status < 300 ? "rgb(var(--ok))" : "rgb(var(--danger))" }}>
                    {ep.last_status || "no resp"}
                  </span>
                )}
                <button onClick={() => test(ep)} disabled={testing === ep.id} title="Send test" className="text-faint hover:text-brand p-2">{testing === ep.id ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}</button>
                <button onClick={() => setConfirmDel(ep)} title="Delete" className="text-faint hover:text-danger p-2"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {adding && <AddWebhook events={events} onClose={() => setAdding(false)} onCreated={(d) => { setAdding(false); setSecret(d); load(); }} />}
      {secret && <SecretModal data={secret} onClose={() => setSecret(null)} />}

      <ConfirmDialog open={!!confirmDel} busy={busy}
        title="Delete webhook endpoint"
        message={confirmDel ? <>Stop delivering events to <strong className="text-content break-all">{confirmDel.url}</strong>? This can’t be undone.</> : null}
        onConfirm={del} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}

function AddWebhook({ events, onClose, onCreated }) {
  const [url, setUrl] = useState("");
  const [picked, setPicked] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const toggle = (e) => setPicked((s) => { const n = new Set(s); n.has(e) ? n.delete(e) : n.add(e); return n; });

  const save = async (ev) => {
    ev.preventDefault();
    if (!picked.size) return toast.error("Select at least one event");
    setBusy(true);
    try { onCreated(await api("webhooks", { method: "POST", body: JSON.stringify({ url, events: [...picked] }) })); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-content text-lg">Add webhook endpoint</h3>
          <button className="text-faint hover:text-content" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Endpoint URL</label>
            <input className="input font-mono text-xs" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-system.example.com/hooks/learn" autoFocus />
          </div>
          <div>
            <label className="label">Events</label>
            <div className="space-y-1.5">
              {events.map((e) => (
                <button type="button" key={e} onClick={() => toggle(e)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-2 transition text-left">
                  <span className={`w-5 h-5 rounded-md border-2 grid place-items-center flex-shrink-0 ${picked.has(e) ? "border-brand bg-brand text-white" : "border-line"}`}>{picked.has(e) && <Check size={12} />}</span>
                  <span className="text-sm text-content">{EVENT_LABEL[e] || e}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-brand flex-1" disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SecretModal({ data, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(data.secret); setCopied(true); toast.success("Copied"); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="card w-full max-w-lg p-6">
        <h3 className="font-bold text-content text-lg flex items-center gap-2"><Webhook size={18} className="text-brand" /> Endpoint created</h3>
        <div className="mt-4 flex items-start gap-2 rounded-xl p-3 text-sm" style={{ backgroundColor: "rgb(var(--warn) / 0.12)", color: "rgb(var(--warn))" }}>
          <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
          <span>Save this signing secret now — it won't be shown again. Use it to verify the <code className="font-mono">X-Learn-Signature</code> header.</span>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-2 border border-line p-3">
          <code className="flex-1 font-mono text-xs text-content break-all">{data.secret}</code>
          <button onClick={copy} className="btn-ghost px-3 py-2 flex-shrink-0">{copied ? <Check size={15} className="text-ok" /> : <Copy size={15} />}</button>
        </div>
        <button onClick={onClose} className="btn-brand w-full mt-5">Done</button>
      </div>
    </div>
  );
}

function Docs() {
  const base = `${window.location.origin}/api/v1`;
  return (
    <div className="card p-5 h-max">
      <div className="flex items-center gap-2 mb-3"><Terminal size={16} className="text-brand" /><h3 className="font-bold text-content">Integration</h3></div>
      <p className="text-sm text-muted">Send your key in the <code className="text-content font-mono text-xs">X-API-Key</code> header. Read-only.</p>
      <div className="mt-4 space-y-3 text-[11px]">
        <Endpoint method="GET" path="/certifications?external_id=staff-4921" note="Is this person certified?" />
        <Endpoint method="GET" path="/certifications/:serial" note="Verify one certificate" />
        <Endpoint method="GET" path="/courses" note="Published course catalog" />
      </div>
      <div className="mt-4 rounded-xl bg-surface-2 border border-line p-3 font-mono text-[10.5px] text-muted overflow-x-auto leading-relaxed">
        curl {base}/certifications?external_id=staff-4921 \<br />
        &nbsp;&nbsp;-H "X-API-Key: blk_…"
      </div>
      <p className="text-[11px] text-faint mt-3">
        <code className="font-mono">external_id</code> is the person's ID in your system — set it on each learner under Staff.
      </p>
    </div>
  );
}

const Endpoint = ({ method, path, note }) => (
  <div className="flex items-start gap-2">
    <span className="chip flex-shrink-0" style={{ backgroundColor: "rgb(var(--ok) / 0.14)", color: "rgb(var(--ok))" }}>{method}</span>
    <div className="min-w-0">
      <p className="font-mono text-content truncate">{path}</p>
      <p className="text-faint">{note}</p>
    </div>
  </div>
);

function CreateModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { onCreated(await api("api-consumers", { method: "POST", body: JSON.stringify({ name }) })); }
    catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-content text-lg">New API key</h3>
          <button className="text-faint hover:text-content" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Consumer name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="HMS production" autoFocus />
            <p className="text-[11px] text-faint mt-1">A label so you know which system uses this key.</p>
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-brand flex-1" disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : "Create key"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RevealModal({ data, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(data.key); setCopied(true); toast.success("Copied"); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="card w-full max-w-lg p-6">
        <h3 className="font-bold text-content text-lg flex items-center gap-2"><KeyRound size={18} className="text-brand" /> Key created — {data.name}</h3>
        <div className="mt-4 flex items-start gap-2 rounded-xl p-3 text-sm" style={{ backgroundColor: "rgb(var(--warn) / 0.12)", color: "rgb(var(--warn))" }}>
          <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
          <span>Copy this key now — for security it won't be shown again.</span>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-2 border border-line p-3">
          <code className="flex-1 font-mono text-xs text-content break-all">{data.key}</code>
          <button onClick={copy} className="btn-ghost px-3 py-2 flex-shrink-0">{copied ? <Check size={15} className="text-ok" /> : <Copy size={15} />}</button>
        </div>
        <button onClick={onClose} className="btn-brand w-full mt-5">Done</button>
      </div>
    </div>
  );
}
