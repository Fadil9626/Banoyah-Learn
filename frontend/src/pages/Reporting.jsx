import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Users, ShieldCheck, Clock, AlertTriangle, Download, Loader2, BookOpen, ClipboardCheck, CheckCircle2 } from "lucide-react";
import api, { getToken } from "../lib/api";
import PageHeader from "../components/PageHeader";

export default function Reporting() {
  const [data, setData] = useState(null);
  const [expiring, setExpiring] = useState(null);
  const [comp, setComp] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api("reports/summary").then(setData).catch((e) => toast.error(e.message));
    api("reports/expiring?days=30").then(setExpiring).catch(() => setExpiring([]));
    api("reports/assignments").then(setComp).catch(() => setComp(null));
  }, []);

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

  if (!data) return <div className="py-20 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>;

  const t = data.totals;
  const certRate = t.people ? Math.round((t.certified_people / t.people) * 100) : 0;

  return (
    <div>
      <PageHeader title="Reporting" subtitle="Workforce certification & compliance at a glance.">
        <button onClick={exportCsv} disabled={downloading} className="btn-ghost">
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Export CSV
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Users} tint="brand" value={`${certRate}%`} label="Workforce certified" sub={`${t.certified_people} of ${t.people} people`} />
        <Stat icon={ShieldCheck} tint="ok" value={t.certificates} label="Certificates issued" />
        <Stat icon={Clock} tint="warn" value={t.expiring_soon} label="Expiring in 30 days" />
        <Stat icon={AlertTriangle} tint="danger" value={t.expired} label="Expired" />
      </div>

      {/* Per-course */}
      <h2 className="text-sm font-bold text-content mt-8 mb-3 flex items-center gap-2"><BookOpen size={16} className="text-brand" /> By course</h2>
      <div className="card overflow-hidden">
        {data.by_course.length === 0 ? (
          <div className="py-12 text-center text-muted">No published courses yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-faint border-b border-line">
                <th className="px-5 py-3">Course</th>
                <th className="px-3 py-3 text-right">Enrolled</th>
                <th className="px-3 py-3 text-right">Passed</th>
                <th className="px-3 py-3 text-right">Certificates</th>
                <th className="px-3 py-3 text-right">Avg score</th>
                <th className="px-5 py-3 w-40">Completion</th>
              </tr>
            </thead>
            <tbody>
              {data.by_course.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-semibold text-content">{c.title}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted">{c.enrolled}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted">{c.passed}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted">{c.certificates}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted">{c.avg_score == null ? "—" : `${c.avg_score}%`}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${c.completion}%`, backgroundImage: "linear-gradient(90deg, rgb(var(--brand)), rgb(var(--brand-2)))" }} />
                      </div>
                      <span className="text-xs tabular-nums text-muted w-9 text-right">{c.completion}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Required training */}
      {comp && comp.totals.total > 0 && (() => {
        const compRate = comp.totals.total ? Math.round((comp.totals.completed / comp.totals.total) * 100) : 0;
        return (
          <>
            <h2 className="text-sm font-bold text-content mt-8 mb-3 flex items-center gap-2"><ClipboardCheck size={16} className="text-brand" /> Required training</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat icon={ClipboardCheck} tint="brand" value={`${compRate}%`} label="Training compliance" sub={`${comp.totals.completed} of ${comp.totals.total} assignments`} />
              <Stat icon={Users} tint="brand-2" value={comp.totals.total} label="Assignments" />
              <Stat icon={CheckCircle2} tint="ok" value={comp.totals.completed} label="Completed" />
              <Stat icon={AlertTriangle} tint="danger" value={comp.totals.overdue} label="Overdue" />
            </div>

            <div className="card overflow-hidden mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-faint border-b border-line">
                    <th className="px-5 py-3">Course</th>
                    <th className="px-3 py-3 text-right">Assigned</th>
                    <th className="px-3 py-3 text-right">Completed</th>
                    <th className="px-3 py-3 text-right">Overdue</th>
                    <th className="px-5 py-3 w-40">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {comp.by_course.map((c) => (
                    <tr key={c.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-3 font-semibold text-content">{c.title}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted">{c.assigned}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted">{c.completed}</td>
                      <td className="px-3 py-3 text-right tabular-nums" style={{ color: c.overdue ? "rgb(var(--danger))" : "rgb(var(--muted))" }}>{c.overdue}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${c.completion}%`, backgroundImage: "linear-gradient(90deg, rgb(var(--brand)), rgb(var(--brand-2)))" }} />
                          </div>
                          <span className="text-xs tabular-nums text-muted w-9 text-right">{c.completion}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {comp.overdue.length > 0 && (
              <div className="card overflow-hidden mt-4">
                <div className="px-5 py-3 border-b border-line text-xs font-bold text-danger flex items-center gap-2"><AlertTriangle size={14} /> Overdue people</div>
                <div className="divide-y divide-line max-h-80 overflow-y-auto">
                  {comp.overdue.map((o, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-content truncate">{o.learner}</p>
                        <p className="text-xs text-muted truncate">{o.course}{o.external_id ? ` · ${o.external_id}` : ""}</p>
                      </div>
                      <span className="text-xs text-muted hidden sm:block">due {new Date(o.due_date).toLocaleDateString()}</span>
                      <span className="chip" style={{ backgroundColor: "rgb(var(--danger) / 0.14)", color: "rgb(var(--danger))" }}>{o.days_overdue}d overdue</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Expiring soon */}
      <h2 className="text-sm font-bold text-content mt-8 mb-3 flex items-center gap-2"><Clock size={16} className="text-warn" /> Expiring & expired</h2>
      <div className="card overflow-hidden">
        {expiring == null ? (
          <div className="py-10 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>
        ) : expiring.length === 0 ? (
          <div className="py-12 text-center text-muted">Nothing expiring in the next 30 days. 🎉</div>
        ) : (
          <div className="divide-y divide-line">
            {expiring.map((c) => (
              <div key={c.serial} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-content truncate">{c.learner}</p>
                  <p className="text-xs text-muted truncate">{c.course}{c.external_id ? ` · ${c.external_id}` : ""}</p>
                </div>
                <span className="text-xs text-muted hidden sm:block">{new Date(c.certified_until).toLocaleDateString()}</span>
                {c.status === "expired"
                  ? <span className="chip" style={{ backgroundColor: "rgb(var(--danger) / 0.14)", color: "rgb(var(--danger))" }}>Expired {Math.abs(c.days_left)}d ago</span>
                  : <span className="chip" style={{ backgroundColor: "rgb(var(--warn) / 0.14)", color: "rgb(var(--warn))" }}>{c.days_left}d left</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, tint, value, label, sub }) {
  return (
    <div className="card p-5">
      <div className="w-10 h-10 rounded-xl grid place-items-center mb-4" style={{ backgroundColor: `rgb(var(--${tint}) / 0.12)`, color: `rgb(var(--${tint}))` }}>
        <Icon size={18} />
      </div>
      <p className="text-3xl font-black text-content tabular-nums">{value}</p>
      <p className="text-xs font-medium text-muted mt-1">{label}</p>
      {sub && <p className="text-[11px] text-faint mt-0.5">{sub}</p>}
    </div>
  );
}
