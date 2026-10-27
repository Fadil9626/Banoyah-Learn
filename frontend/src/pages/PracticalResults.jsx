import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Loader2, ShieldAlert, CheckCircle2, XCircle, Clock, MessageSquareText } from "lucide-react";
import api from "../lib/api";
import PageHeader from "../components/PageHeader";

// Every 3D practical sat in the org (a manager sees their team), newest first.
// Filters live in the URL so a filtered list can be bookmarked or sent on.
const STATUSES = [["", "All"], ["passed", "Passed"], ["failed", "Not passed"], ["critical", "Critical error"], ["open", "In progress"]];

export default function PracticalResults() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "", mode = params.get("mode") || "all", course = params.get("course_id") || "";
  const [rows, setRows] = useState(null);

  useEffect(() => {
    setRows(null);
    const q = new URLSearchParams({ mode, ...(status && { status }), ...(course && { course_id: course }) });
    api(`practicals/results?${q}`).then(setRows).catch((e) => { toast.error(e.message); setRows([]); });
  }, [status, mode, course]);

  const set = (k, v) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); setParams(p, { replace: true }); };
  const courses = useMemo(() => [...new Map((rows || []).map((r) => [r.course_id, r.course])).entries()], [rows]);
  const fmt = (d) => d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
  const took = (r) => r.finished_at ? `${Math.max(1, Math.round((new Date(r.finished_at) - new Date(r.started_at)) / 60000))} min` : "";

  return (
    <div>
      <PageHeader title="Practical results" subtitle="Every 3D practical, with the full record of what was done. Open one to review it." />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1 p-1 rounded-xl bg-surface-2 border border-line" role="group" aria-label="Result">
          {STATUSES.map(([k, label]) => (
            <button key={k || "all"} onClick={() => set("status", k)} aria-pressed={status === k}
              className={`text-xs px-3 py-1.5 rounded-lg ${status === k ? "bg-surface text-content font-bold shadow-card" : "text-muted"}`}>{label}</button>
          ))}
        </div>
        <select className="input w-auto text-sm" value={mode} onChange={(e) => set("mode", e.target.value === "all" ? "" : e.target.value)} aria-label="Mode">
          <option value="all">Exams and practice</option><option value="exam">Exams only</option><option value="practice">Practice runs only</option>
        </select>
        {courses.length > 1 || course ? (
          <select className="input w-auto text-sm" value={course} onChange={(e) => set("course_id", e.target.value)} aria-label="Course">
            <option value="">All courses</option>
            {courses.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
          </select>
        ) : null}
      </div>

      <div className="card overflow-hidden">
        {!rows ? <div className="py-16 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>
          : !rows.length ? <p className="p-8 text-sm text-muted text-center">No practicals match. Results appear here as soon as someone finishes one.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-muted bg-surface-2">
                    {["Staff", "Course", "Scenario", "Result", "Final mark", "Finished", ""].map((h) => <th key={h} className="text-left font-semibold px-4 py-2.5">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} onClick={() => navigate(`/practicals/${r.id}`)} className="border-t border-line hover:bg-surface-2 cursor-pointer align-top">
                      <td className="px-4 py-3"><p className="font-semibold text-content">{r.learner}</p><p className="text-xs text-faint">{[r.job_title, r.team].filter(Boolean).join(" · ")}</p></td>
                      <td className="px-4 py-3 text-muted">{r.course}</td>
                      <td className="px-4 py-3 text-muted">{r.patient}</td>
                      <td className="px-4 py-3"><Verdict r={r} /></td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {r.final_score ?? r.score ?? "—"}
                        {r.final_score != null && <span className="block text-[11px] text-faint font-sans">practical {r.score}{r.theory_score != null ? ` · quiz ${r.theory_score}` : ""}</span>}
                      </td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{fmt(r.finished_at)}<span className="block text-xs text-faint">{took(r)}</span></td>
                      <td className="px-4 py-3 text-faint">{r.reviewed_at && <MessageSquareText size={15} aria-label="Reviewed" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

export function Verdict({ r }) {
  if (!r.finished_at) return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted"><Clock size={14} /> {r.mode === "practice" ? "Practice run, in progress" : "Exam in progress"}</span>;
  if (r.mode === "practice") return (
    <span className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-muted">Practice run{r.critical ? " · critical error" : ""}</span>
      <span className="text-[11px] text-faint">Doesn't count towards the certificate</span>
    </span>
  );
  if (r.passed) return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ok"><CheckCircle2 size={14} /> Passed</span>;
  return (
    <span className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-danger">
        {r.critical ? <ShieldAlert size={14} /> : <XCircle size={14} />} {r.abandoned ? "Walked away" : r.critical ? "Critical error" : "Not passed"}
      </span>
      {r.first_critical && <span className="text-xs text-muted max-w-xs">{r.first_critical}</span>}
    </span>
  );
}
