import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Award, Search, Download, Loader2 } from "lucide-react";
import api, { getToken } from "../lib/api";
import PageHeader from "../components/PageHeader";

export default function Certificates() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  const [downloading, setDownloading] = useState(false);

  const load = () => {
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    api(`reports/register${params}`).then(setRows).catch((e) => { toast.error(e.message); setRows([]); });
  };
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [q]); // eslint-disable-line

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

  return (
    <div>
      <PageHeader title="Certificates" subtitle="The organization's certification register.">
        <button onClick={exportCsv} disabled={downloading} className="btn-ghost">
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Export CSV
        </button>
      </PageHeader>

      <div className="card overflow-hidden">
        <div className="p-3 border-b border-line">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input className="input pl-10" placeholder="Search learner, course or serial…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {rows == null ? (
          <div className="py-16 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-2 grid place-items-center text-faint"><Award size={22} /></div>
            <p className="text-sm text-muted">No certificates issued yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {rows.map((r) => {
              const expired = r.status === "expired";
              return (
                <div key={r.serial} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-lg grid place-items-center flex-shrink-0" style={{ backgroundColor: "rgb(var(--warn) / 0.12)", color: "rgb(var(--warn))" }}>
                    <Award size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-content truncate">{r.learner}</p>
                    <p className="text-xs text-muted truncate">{r.course}</p>
                  </div>
                  <span className="hidden md:block text-xs font-mono text-faint">{r.serial}</span>
                  <span className="hidden sm:block text-xs text-muted tabular-nums w-10 text-right">{r.score}%</span>
                  <span className="hidden lg:block text-xs text-muted">
                    {r.certified_until ? new Date(r.certified_until).toLocaleDateString() : "No expiry"}
                  </span>
                  <span className="chip flex-shrink-0" style={{
                    backgroundColor: expired ? "rgb(var(--danger) / 0.14)" : "rgb(var(--ok) / 0.14)",
                    color: expired ? "rgb(var(--danger))" : "rgb(var(--ok))",
                  }}>{expired ? "Expired" : "Valid"}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
