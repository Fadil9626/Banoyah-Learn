import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowLeft, Loader2, ShieldAlert, Save } from "lucide-react";
import api from "../lib/api";
import { Verdict } from "./PracticalResults";
import Timeline from "../components/PracticalTimeline";
import FinalMark from "../components/FinalMark";

// One practical, as the supervisor reviews it: the verdict, what went wrong,
// the second-by-second record, and a note for the file.
export default function PracticalResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [r, setR] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api(`practicals/results/${id}`).then((d) => { setR(d); setNote(d.review_note || ""); })
      .catch((e) => { toast.error(e.message); navigate("/practicals"); });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setSaving(true);
    try {
      const out = await api(`practicals/results/${id}/review`, { method: "PATCH", body: JSON.stringify({ note }) });
      setR((x) => ({ ...x, review_note: out.review_note, reviewer: out.reviewer, reviewed_at: out.reviewed_at }));
      toast.success("Note saved");
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  if (!r) return <div className="py-20 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>;
  const when = (d) => d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted hover:text-content mb-4"><ArrowLeft size={16} /> Practical results</button>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs text-faint uppercase tracking-widest">{r.mode === "exam" ? "Exam" : "Practice run"} · {r.scenario}</p>
          <h1 className="text-2xl font-black text-content tracking-tight mt-1">{r.learner}</h1>
          <p className="text-sm text-muted">{[r.job_title, r.team, r.email].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="text-right">
          <Verdict r={r} />
          <p className="text-2xl font-black font-mono tabular-nums mt-1">{r.final_score ?? r.score ?? "—"}<span className="text-sm text-faint"> / 100</span></p>
          <p className="text-xs text-faint">{r.final_score != null ? "final mark" : "practical"} · pass at {r.pass_mark}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-5 text-sm">
        <Fact label="Course" value={r.course} />
        <Fact label="Scenario" value={r.subject || "—"} />
        <Fact label="Taken" value={`${when(r.started_at)}${r.finished_at ? ` · ${Math.max(1, Math.round((new Date(r.finished_at) - new Date(r.started_at)) / 60000))} min` : " · not finished"}`} />
      </div>

      {r.grading && <div className="mb-5"><FinalMark g={r.grading} /></div>}

      {r.crits.length > 0 && (
        <div className="rounded-xl p-4 mb-4" style={{ background: "rgb(var(--danger) / 0.10)" }}>
          <p className="text-sm font-bold text-danger flex items-center gap-1.5 mb-1.5"><ShieldAlert size={15} /> Critical errors</p>
          <ul className="list-disc pl-5 text-sm flex flex-col gap-1 text-content">{r.crits.map((c, i) => <li key={i}><b>{c.step}:</b> {c.reason}</li>)}</ul>
        </div>
      )}
      {r.deds.length > 0 && (
        <div className="rounded-xl p-4 mb-4" style={{ background: "rgb(var(--warn) / 0.10)" }}>
          <p className="text-sm font-bold text-warn mb-1.5">Points lost</p>
          <ul className="list-disc pl-5 text-sm flex flex-col gap-1 text-content">{r.deds.map((d, i) => <li key={i}>{d.delta} · <b>{d.step}:</b> {d.note}</li>)}</ul>
        </div>
      )}

      <h2 className="text-base font-bold text-content mt-6 mb-2">What they did</h2>
      <Timeline log={r.log} />

      <h2 className="text-base font-bold text-content mt-6 mb-2">Supervisor's note</h2>
      <div className="card p-4">
        <label htmlFor="review-note" className="text-xs text-muted">What you discussed or decided, for the file. The learner does not see it.</label>
        <textarea id="review-note" className="input mt-2 min-h-[90px]" value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Talked through passive identification. Supervised re-take at the bench on Friday." />
        <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
          <p className="text-xs text-faint">{r.reviewed_at ? `Last saved by ${r.reviewer || "a supervisor"}, ${when(r.reviewed_at)}` : "No note yet."}</p>
          <button onClick={save} disabled={saving} className="btn-brand">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save note</button>
        </div>
      </div>
    </div>
  );
}

const Fact = ({ label, value }) => (
  <div className="card px-4 py-3">
    <p className="text-[11px] uppercase tracking-wider text-faint">{label}</p>
    <p className="text-content mt-0.5">{value}</p>
  </div>
);
