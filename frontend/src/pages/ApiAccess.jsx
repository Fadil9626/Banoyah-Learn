import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Plus, Plug, Loader2, X, Copy, Check, Trash2, Ban, KeyRound, ShieldAlert, Terminal,
} from "lucide-react";
import api from "../lib/api";
import PageHeader from "../components/PageHeader";

export default function ApiAccess() {
  const [rows, setRows] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState(null); // { name, key } shown once

  const load = () => api("api-consumers").then(setRows).catch((e) => { toast.error(e.message); setRows([]); });
  useEffect(() => { load(); }, []);

  const revoke = async (c) => {
    if (!confirm(`Revoke "${c.name}"? Systems using this key will stop working immediately.`)) return;
    try { await api(`api-consumers/${c.id}/revoke`, { method: "POST" }); toast.success("Key revoked"); load(); }
    catch (e) { toast.error(e.message); }
  };
  const del = async (c) => {
    if (!confirm(`Delete "${c.name}" permanently?`)) return;
    try { await api(`api-consumers/${c.id}`, { method: "DELETE" }); toast.success("Deleted"); load(); }
    catch (e) { toast.error(e.message); }
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
                  {c.is_active && <button onClick={() => revoke(c)} title="Revoke" className="text-faint hover:text-warn p-2"><Ban size={15} /></button>}
                  <button onClick={() => del(c)} title="Delete" className="text-faint hover:text-danger p-2"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Docs />
      </div>

      {creating && <CreateModal onClose={() => setCreating(false)}
        onCreated={(c) => { setCreating(false); setNewKey(c); load(); }} />}
      {newKey && <RevealModal data={newKey} onClose={() => setNewKey(null)} />}
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
        <code className="font-mono">external_id</code> is the person's ID in your system — set it on each learner under People.
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
