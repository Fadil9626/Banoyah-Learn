import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Plus, BookOpen, X, Loader2, FileText, HelpCircle, ChevronRight } from "lucide-react";
import api from "../lib/api";
import PageHeader from "../components/PageHeader";

export default function Courses() {
  const [rows, setRows] = useState(null);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const load = () => api("courses").then(setRows).catch((e) => { toast.error(e.message); setRows([]); });
  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader title="Courses" subtitle="Author lessons and assessments for your team.">
        <button className="btn-brand" onClick={() => setCreating(true)}><Plus size={16} /> New course</button>
      </PageHeader>

      {rows == null ? (
        <div className="py-20 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="card py-20 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-2 grid place-items-center text-faint"><BookOpen size={22} /></div>
          <div>
            <p className="font-semibold text-content">No courses yet</p>
            <p className="text-sm text-muted">Create your first course to start building training.</p>
          </div>
          <button className="btn-brand" onClick={() => setCreating(true)}><Plus size={16} /> New course</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((c) => (
            <button key={c.id} onClick={() => navigate(`/courses/${c.id}`)}
              className="card p-5 text-left hover:shadow-glow hover:border-brand/40 transition group">
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl grid place-items-center text-brand-fg flex-shrink-0"
                  style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))" }}>
                  <BookOpen size={18} />
                </div>
                <StatusChip status={c.status} />
              </div>
              <h3 className="mt-4 font-bold text-content leading-snug line-clamp-2">{c.title}</h3>
              {c.category && <p className="text-xs text-muted mt-1">{c.category}</p>}
              <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5"><FileText size={13} />{c.lesson_count} lesson{c.lesson_count == 1 ? "" : "s"}</span>
                <span className="flex items-center gap-1.5"><HelpCircle size={13} />{c.question_count} question{c.question_count == 1 ? "" : "s"}</span>
                <span className="ml-auto text-faint group-hover:text-brand transition"><ChevronRight size={16} /></span>
              </div>
            </button>
          ))}
        </div>
      )}

      {creating && <CreateModal onClose={() => setCreating(false)}
        onCreated={(c) => navigate(`/courses/${c.id}`)} />}
    </div>
  );
}

export function StatusChip({ status }) {
  const published = status === "published";
  return (
    <span className="chip" style={{
      backgroundColor: published ? "rgb(var(--ok) / 0.14)" : "rgb(var(--muted) / 0.14)",
      color: published ? "rgb(var(--ok))" : "rgb(var(--muted))",
    }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "currentColor" }} />
      {published ? "Published" : "Draft"}
    </span>
  );
}

function CreateModal({ onClose, onCreated }) {
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ title: "", description: "", category: "", pass_mark: 70, validity_months: "" });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const created = await api("courses", { method: "POST", body: JSON.stringify(f) });
      toast.success("Course created");
      onCreated(created);
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-content text-lg">New course</h3>
          <button className="text-faint hover:text-content" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Lab Biosafety Level 2" autoFocus />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[80px] resize-y" value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="What this course covers…" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="label">Category</label>
              <input className="input" value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="Safety" />
            </div>
            <div>
              <label className="label">Pass mark %</label>
              <input className="input" type="number" min="0" max="100" value={f.pass_mark} onChange={(e) => set("pass_mark", e.target.value)} />
            </div>
            <div>
              <label className="label">Valid (months)</label>
              <input className="input" type="number" min="0" value={f.validity_months} onChange={(e) => set("validity_months", e.target.value)} placeholder="∞" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-brand flex-1" disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : "Create course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
