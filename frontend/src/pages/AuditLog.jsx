import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Search, Loader2, ScrollText } from "lucide-react";
import api from "../lib/api";
import PageHeader from "../components/PageHeader";

const ACTION_META = {
  "user.login":       { label: "Signed in",            tint: "brand-2" },
  "user.create":      { label: "Added person",         tint: "brand" },
  "user.import":      { label: "Imported people",      tint: "brand" },
  "course.publish":   { label: "Published course",     tint: "ok" },
  "course.unpublish": { label: "Unpublished course",   tint: "muted" },
  "assignment.create":{ label: "Assigned course",      tint: "brand" },
  "certificate.issue":{ label: "Issued certificate",   tint: "ok" },
  "apikey.create":    { label: "Created API key",      tint: "warn" },
  "apikey.revoke":    { label: "Revoked API key",      tint: "danger" },
  "settings.email":   { label: "Updated email",        tint: "warn" },
  "settings.reminders":{ label: "Updated reminders",   tint: "warn" },
  "settings.branding":{ label: "Updated branding",     tint: "warn" },
};
const meta = (a) => ACTION_META[a] || { label: a, tint: "muted" };

const LIMIT = 50;

export default function AuditLog() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [actions, setActions] = useState([]);
  const [action, setAction] = useState("");
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPage = (reset) => {
    setLoading(true);
    const off = reset ? 0 : offset;
    const params = new URLSearchParams({ limit: LIMIT, offset: off });
    if (action) params.set("action", action);
    if (q.trim()) params.set("q", q.trim());
    api(`audit?${params}`)
      .then((d) => {
        setRows(reset ? d.rows : (r) => [...r, ...d.rows]);
        setTotal(d.total);
        setActions(d.actions);
        setOffset(off + d.rows.length);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  // Reload from the top whenever the filter or search changes.
  useEffect(() => { const t = setTimeout(() => fetchPage(true), 200); return () => clearTimeout(t); }, [action, q]); // eslint-disable-line

  const detailText = (r) => {
    if (!r.details) return "";
    const d = r.details;
    if (r.action === "user.import") return `${d.created} created, ${d.skipped} skipped${d.errors ? `, ${d.errors} errors` : ""}`;
    if (r.action === "assignment.create") return `${d.assigned} ${d.assigned === 1 ? "person" : "people"}${d.due_date ? ` · due ${d.due_date}` : ""}`;
    if (r.action === "certificate.issue") return `${d.score}% · ${d.serial}`;
    if (r.action === "user.create") return d.role;
    return "";
  };

  return (
    <div>
      <PageHeader title="Audit log" subtitle="A record of who did what across your organization." />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input className="input pl-10" placeholder="Search actor or target…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">All actions</option>
          {actions.map((a) => <option key={a} value={a}>{meta(a).label}</option>)}
        </select>
        <span className="text-xs text-muted tabular-nums ml-auto">{total} {total === 1 ? "entry" : "entries"}</span>
      </div>

      <div className="card overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="py-16 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-2 grid place-items-center text-faint"><ScrollText size={22} /></div>
            <p className="text-sm text-muted">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {rows.map((r) => {
              const m = meta(r.action);
              const det = detailText(r);
              return (
                <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="chip flex-shrink-0" style={{ backgroundColor: `rgb(var(--${m.tint}) / 0.14)`, color: `rgb(var(--${m.tint}))` }}>{m.label}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-content truncate">
                      <span className="font-semibold">{r.actor_name || "—"}</span>
                      {r.target && <span className="text-muted"> · {r.target}</span>}
                    </p>
                    {det && <p className="text-xs text-faint truncate">{det}</p>}
                  </div>
                  {r.ip && <span className="hidden lg:block text-[11px] font-mono text-faint">{r.ip}</span>}
                  <span className="text-xs text-muted whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        )}

        {rows.length < total && (
          <div className="p-3 border-t border-line text-center">
            <button onClick={() => fetchPage(false)} disabled={loading} className="btn-ghost">
              {loading ? <Loader2 size={16} className="animate-spin" /> : `Load more (${total - rows.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
