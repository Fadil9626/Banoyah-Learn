import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Award, Search, Download, Loader2, Eye, ShieldCheck, Trash2, AlertTriangle, Copy, ExternalLink, X } from "lucide-react";
import api, { getToken } from "../lib/api";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "valid", label: "Valid" },
  { key: "expired", label: "Expired" },
];

export default function Certificates() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [downloading, setDownloading] = useState(false);
  const [busy, setBusy] = useState(null);      // `${serial}:${action}` currently working
  const [confirm, setConfirm] = useState(null); // row pending revoke confirmation
  const [revoking, setRevoking] = useState(false);
  const [detail, setDetail] = useState(null);   // row open in the detail panel

  const load = () => {
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    api(`reports/register${params}`).then(setRows).catch((e) => { toast.error(e.message); setRows([]); });
  };
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [q]); // eslint-disable-line

  const counts = useMemo(() => {
    const c = { all: 0, valid: 0, expired: 0 };
    (rows || []).forEach((r) => { c.all++; c[r.status === "expired" ? "expired" : "valid"]++; });
    return c;
  }, [rows]);

  const visible = useMemo(
    () => (rows || []).filter((r) => status === "all" || (status === "expired" ? r.status === "expired" : r.status !== "expired")),
    [rows, status]
  );

  const exportCsv = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/reports/certifications.csv", { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `certifications-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error(e.message); }
    finally { setDownloading(false); }
  };

  // Fetch the certificate PDF (admin-scoped) as an object URL.
  const fetchPdfUrl = async (serial) => {
    const res = await fetch(`/api/reports/certificates/${encodeURIComponent(serial)}/pdf`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error("Could not generate the certificate PDF");
    return URL.createObjectURL(await res.blob());
  };

  // View the same certificate PDF, opened inline in a new tab.
  const viewPdf = async (serial) => {
    const win = window.open("", "_blank"); // open synchronously so it isn't blocked
    setBusy(`${serial}:view`);
    try {
      const url = await fetchPdfUrl(serial);
      if (win) win.location = url; else window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) { if (win) win.close(); toast.error(e.message); }
    finally { setBusy(null); }
  };

  const downloadPdf = async (serial) => {
    setBusy(`${serial}:dl`);
    try {
      const url = await fetchPdfUrl(serial);
      const a = document.createElement("a");
      a.href = url; a.download = `certificate-${serial}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  const revoke = async () => {
    if (!confirm) return;
    setRevoking(true);
    try {
      await api(`reports/certificates/${encodeURIComponent(confirm.serial)}`, { method: "DELETE" });
      setRows((rs) => (rs || []).filter((r) => r.serial !== confirm.serial));
      toast.success("Certificate revoked");
      setConfirm(null);
    } catch (e) { toast.error(e.message); }
    finally { setRevoking(false); }
  };

  return (
    <div>
      <PageHeader title="Certificates" subtitle="The organization's certification register.">
        <button onClick={exportCsv} disabled={downloading} className="btn-ghost">
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Export CSV
        </button>
      </PageHeader>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Total issued" value={counts.all} tone="brand" Icon={Award} />
        <Stat label="Valid" value={counts.valid} tone="ok" Icon={ShieldCheck} />
        <Stat label="Expired" value={counts.expired} tone="danger" Icon={Award} />
      </div>

      <div className="card overflow-hidden">
        <div className="p-3 border-b border-line flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[14rem] max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input className="input pl-10" placeholder="Search learner, course or serial…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-surface-2 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatus(f.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  status === f.key ? "bg-surface text-content shadow-sm" : "text-muted hover:text-content"
                }`}
              >
                {f.label}{rows ? ` · ${counts[f.key]}` : ""}
              </button>
            ))}
          </div>
        </div>

        {rows == null ? (
          <div className="py-16 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>
        ) : visible.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-2 grid place-items-center text-faint"><Award size={22} /></div>
            <p className="text-sm text-muted">{rows.length === 0 ? "No certificates issued yet." : "No certificates match this filter."}</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {visible.map((r) => {
              const expired = r.status === "expired";
              return (
                <div key={r.serial} className="flex items-center gap-4 px-5 py-3.5 group hover:bg-surface-2/40 transition-colors">
                  <button onClick={() => setDetail(r)} className="flex items-center gap-4 min-w-0 flex-1 text-left" title="View certificate details">
                    <div className="w-9 h-9 rounded-lg grid place-items-center flex-shrink-0" style={{ backgroundColor: "rgb(var(--warn) / 0.12)", color: "rgb(var(--warn))" }}>
                      <Award size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-content truncate group-hover:text-brand transition-colors">{r.learner}</p>
                      <p className="text-xs text-muted truncate">{r.course}</p>
                    </div>
                  </button>
                  <span className="hidden md:block text-xs font-mono text-faint">{r.serial}</span>
                  <span className="hidden sm:block text-xs text-muted tabular-nums w-10 text-right">{r.score}%</span>
                  <span className="hidden lg:block text-xs text-muted w-24 text-right">
                    {r.certified_until ? new Date(r.certified_until).toLocaleDateString() : "No expiry"}
                  </span>
                  <span className="chip flex-shrink-0" style={{
                    backgroundColor: expired ? "rgb(var(--danger) / 0.14)" : "rgb(var(--ok) / 0.14)",
                    color: expired ? "rgb(var(--danger))" : "rgb(var(--ok))",
                  }}>{expired ? "Expired" : "Valid"}</span>

                  {/* Per-row actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => viewPdf(r.serial)}
                      disabled={busy === `${r.serial}:view`}
                      title="View certificate"
                      className="p-2 rounded-lg text-muted hover:text-content hover:bg-surface-2 transition-colors disabled:opacity-50"
                    >
                      {busy === `${r.serial}:view` ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                    </button>
                    <button
                      onClick={() => downloadPdf(r.serial)}
                      disabled={busy === `${r.serial}:dl`}
                      title="Download PDF"
                      className="p-2 rounded-lg text-muted hover:text-content hover:bg-surface-2 transition-colors disabled:opacity-50"
                    >
                      {busy === `${r.serial}:dl` ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setConfirm(r)}
                        title="Revoke certificate"
                        className="p-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => !revoking && setConfirm(null)}>
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0"
                style={{ backgroundColor: "rgb(var(--danger) / 0.12)", color: "rgb(var(--danger))" }}>
                <AlertTriangle size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-content text-lg">Revoke this certificate?</h3>
                <p className="text-sm text-muted mt-1">
                  This permanently removes <span className="font-semibold text-content">{confirm.learner}</span>'s
                  certificate for <span className="font-semibold text-content">{confirm.course}</span>
                  {" "}(<span className="font-mono">{confirm.serial}</span>). Its verification link will stop working. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-ghost" disabled={revoking} onClick={() => setConfirm(null)}>Cancel</button>
              <button
                onClick={revoke}
                disabled={revoking}
                className="btn text-white"
                style={{ backgroundColor: "rgb(var(--danger))" }}
              >
                {revoking ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4" onClick={() => setDetail(null)}>
          <div className="card w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const expired = detail.status === "expired";
              const tone = expired ? "danger" : "ok";
              return (
                <>
                  <div className="h-1.5" style={{ backgroundColor: `rgb(var(--${tone}))` }} />
                  <div className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl grid place-items-center flex-shrink-0"
                        style={{ backgroundColor: "rgb(var(--warn) / 0.12)", color: "rgb(var(--warn))" }}>
                        <Award size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-content text-lg leading-tight truncate">{detail.learner}</h3>
                        <p className="text-sm text-muted truncate">{detail.course}</p>
                      </div>
                      <span className="chip flex-shrink-0" style={{
                        backgroundColor: expired ? "rgb(var(--danger) / 0.14)" : "rgb(var(--ok) / 0.14)",
                        color: expired ? "rgb(var(--danger))" : "rgb(var(--ok))",
                      }}>{expired ? "Expired" : "Valid"}</span>
                      <button onClick={() => setDetail(null)} className="p-1.5 -mr-2 -mt-1 rounded-lg text-muted hover:text-content hover:bg-surface-2 transition-colors">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 mt-6">
                      <Field label="Email" value={detail.email} />
                      <Field label="Staff / External ID" value={detail.external_id || "—"} />
                      <Field label="Score" value={`${detail.score}%`} />
                      <Field label="Issued" value={detail.issued_at ? new Date(detail.issued_at).toLocaleDateString() : "—"} />
                      <Field label="Valid until" value={detail.certified_until ? new Date(detail.certified_until).toLocaleDateString() : "No expiry"} />
                      <Field label="Status" value={expired ? "Expired" : (detail.days_left == null ? "Valid (no expiry)" : `Valid · ${detail.days_left} days left`)} />
                    </div>

                    <div className="mt-5 pt-5 border-t border-line">
                      <p className="text-xs font-bold uppercase tracking-wider text-faint mb-1.5">Certificate serial</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm font-mono bg-surface-2 rounded-lg px-3 py-2 text-content truncate">{detail.serial}</code>
                        <button
                          onClick={() => { navigator.clipboard?.writeText(detail.serial).then(() => toast.success("Serial copied")); }}
                          title="Copy serial"
                          className="p-2 rounded-lg text-muted hover:text-content hover:bg-surface-2 transition-colors flex-shrink-0"
                        >
                          <Copy size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-6">
                      <button onClick={() => viewPdf(detail.serial)} disabled={busy === `${detail.serial}:view`} className="btn-ghost">
                        {busy === `${detail.serial}:view` ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />} View
                      </button>
                      <button onClick={() => downloadPdf(detail.serial)} disabled={busy === `${detail.serial}:dl`} className="btn-ghost">
                        {busy === `${detail.serial}:dl` ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download
                      </button>
                      <a href={`/verify/${encodeURIComponent(detail.serial)}`} target="_blank" rel="noreferrer" className="btn-ghost">
                        <ExternalLink size={16} /> Verify page
                      </a>
                      {isAdmin && (
                        <button
                          onClick={() => { const r = detail; setDetail(null); setConfirm(r); }}
                          className="btn-ghost ml-auto"
                          style={{ color: "rgb(var(--danger))" }}
                        >
                          <Trash2 size={16} /> Revoke
                        </button>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-wider text-faint">{label}</p>
      <p className="text-sm text-content mt-0.5 truncate" title={value}>{value}</p>
    </div>
  );
}

function Stat({ label, value, tone, Icon }) {
  return (
    <div className="card px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg grid place-items-center flex-shrink-0"
        style={{ backgroundColor: `rgb(var(--${tone}) / 0.12)`, color: `rgb(var(--${tone}))` }}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-black text-content leading-none tabular-nums">{value}</p>
        <p className="text-xs text-muted mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}
