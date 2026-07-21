import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft, Loader2, Save, Trash2, Plus, X, FileText, Video, File,
  ChevronUp, ChevronDown, Check, Globe, PencilLine, HelpCircle, Upload,
  ClipboardCheck, UserPlus, Calendar, Sparkles,
} from "lucide-react";
import api, { getToken } from "../lib/api";
import { StatusChip } from "./Courses";
import ConfirmDialog from "../components/ConfirmDialog";
import LessonContent from "../components/LessonContent";

const TABS = [
  { key: "details", label: "Details", icon: PencilLine },
  { key: "lessons", label: "Lessons", icon: FileText },
  { key: "quiz", label: "Quiz", icon: HelpCircle },
  { key: "people", label: "Assignments", icon: ClipboardCheck },
];

const ASSIGN_STATUS = {
  completed:   { label: "Completed",   bg: "rgb(var(--ok) / 0.14)",     fg: "rgb(var(--ok))" },
  in_progress: { label: "In progress", bg: "rgb(var(--brand) / 0.14)",  fg: "rgb(var(--brand))" },
  overdue:     { label: "Overdue",     bg: "rgb(var(--danger) / 0.14)", fg: "rgb(var(--danger))" },
  not_started: { label: "Not started", bg: "rgb(var(--muted) / 0.14)",  fg: "rgb(var(--muted))" },
};
const LESSON_ICON = { text: FileText, video: Video, pdf: File };

export default function CourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [tab, setTab] = useState("details");
  const [busy, setBusy] = useState(false);

  const load = () => api(`courses/${id}`).then(setCourse).catch((e) => { toast.error(e.message); navigate("/courses"); });
  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const togglePublish = async () => {
    setBusy(true);
    try {
      const next = course.status === "published" ? "draft" : "published";
      const updated = await api(`courses/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      setCourse((c) => ({ ...c, status: updated.status }));
      toast.success(next === "published" ? "Course published" : "Moved to draft");
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  if (!course) return <div className="py-20 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate("/courses")} className="flex items-center gap-1.5 text-sm text-muted hover:text-content mb-4">
        <ArrowLeft size={16} /> Courses
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-content tracking-tight truncate">{course.title}</h1>
            <StatusChip status={course.status} />
          </div>
          <p className="text-sm text-muted mt-1">
            {course.lessons.length} lesson{course.lessons.length === 1 ? "" : "s"} ·{" "}
            {course.questions.length} question{course.questions.length === 1 ? "" : "s"} ·{" "}
            pass mark {course.pass_mark}%
          </p>
        </div>
        <button className={course.status === "published" ? "btn-ghost" : "btn-brand"} onClick={togglePublish} disabled={busy}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : course.status === "published" ? <><PencilLine size={16} /> Unpublish</> : <><Globe size={16} /> Publish</>}
        </button>
      </div>

      <div className="flex items-center gap-1 mb-6 border-b border-line">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition ${
              tab === key ? "text-brand border-brand" : "text-muted border-transparent hover:text-content"
            }`}>
            <Icon size={15} /> {label}
            {key === "lessons" && course.lessons.length > 0 && <Count n={course.lessons.length} />}
            {key === "quiz" && course.questions.length > 0 && <Count n={course.questions.length} />}
          </button>
        ))}
      </div>

      {tab === "details" && <DetailsTab course={course} onSaved={(c) => setCourse((p) => ({ ...p, ...c }))} />}
      {tab === "lessons" && <LessonsTab course={course} reload={load} />}
      {tab === "quiz" && <QuizTab course={course} reload={load} />}
      {tab === "people" && <AssignmentsTab course={course} />}
    </div>
  );
}

const Count = ({ n }) => <span className="chip bg-surface-2 text-faint ml-1">{n}</span>;

// ── Details ───────────────────────────────────────────────────────────────────
function DetailsTab({ course, onSaved }) {
  const [f, setF] = useState({
    title: course.title, description: course.description || "", category: course.category || "",
    pass_mark: course.pass_mark, validity_months: course.validity_months ?? "",
    shuffle_questions: !!course.shuffle_questions, max_attempts: course.max_attempts ?? 0,
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      const updated = await api(`courses/${course.id}`, { method: "PATCH", body: JSON.stringify(f) });
      onSaved(updated);
      toast.success("Saved");
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="card p-6 space-y-4 max-w-2xl">
      <div>
        <label className="label">Title</label>
        <input className="input" value={f.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input min-h-[100px] resize-y" value={f.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Category</label>
          <input className="input" value={f.category} onChange={(e) => set("category", e.target.value)} />
        </div>
        <div>
          <label className="label">Pass mark %</label>
          <input className="input" type="number" min="0" max="100" value={f.pass_mark} onChange={(e) => set("pass_mark", e.target.value)} />
        </div>
        <div>
          <label className="label">Validity (months)</label>
          <input className="input" type="number" min="0" value={f.validity_months} onChange={(e) => set("validity_months", e.target.value)} placeholder="Never expires" />
        </div>
      </div>

      {/* Quiz options */}
      <div className="pt-4 mt-1 border-t border-line space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-faint flex items-center gap-1.5"><HelpCircle size={12} /> Quiz options</p>
        <button type="button" onClick={() => set("shuffle_questions", !f.shuffle_questions)}
          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-surface-2/50 border border-line hover:bg-surface-2 transition text-left">
          <span>
            <span className="block text-sm font-semibold text-content">Shuffle questions</span>
            <span className="block text-xs text-muted">Randomize the order for each attempt.</span>
          </span>
          <span className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${f.shuffle_questions ? "bg-ok" : "bg-line"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${f.shuffle_questions ? "translate-x-5" : ""}`} />
          </span>
        </button>
        <div className="max-w-[12rem]">
          <label className="label">Max attempts</label>
          <input className="input" type="number" min="0" value={f.max_attempts} onChange={(e) => set("max_attempts", e.target.value)} placeholder="0" />
          <p className="text-[11px] text-faint mt-1">0 = unlimited until passed.</p>
        </div>
      </div>

      <button className="btn-brand" onClick={save} disabled={busy}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save changes
      </button>
    </div>
  );
}

// ── Lessons ───────────────────────────────────────────────────────────────────
function LessonsTab({ course, reload }) {
  const [editing, setEditing] = useState(null); // lesson object or {} for new
  const [confirmDel, setConfirmDel] = useState(null); // lesson pending delete
  const [busy, setBusy] = useState(false);
  const lessons = course.lessons;

  const move = async (idx, dir) => {
    const next = [...lessons];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    try {
      await api(`courses/${course.id}/lessons/reorder`, { method: "PATCH", body: JSON.stringify({ ids: next.map((l) => l.id) }) });
      reload();
    } catch (e) { toast.error(e.message); }
  };

  const remove = async () => {
    setBusy(true);
    try { await api(`lessons/${confirmDel.id}`, { method: "DELETE" }); toast.success("Lesson deleted"); setConfirmDel(null); reload(); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      {lessons.length === 0 && (
        <div className="card p-10 text-center text-muted">No lessons yet — add the first one below.</div>
      )}
      {lessons.map((l, i) => {
        const Icon = LESSON_ICON[l.type] || FileText;
        return (
          <div key={l.id} className="card p-4 flex items-center gap-3">
            <div className="flex flex-col">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-faint hover:text-content disabled:opacity-30"><ChevronUp size={15} /></button>
              <button onClick={() => move(i, 1)} disabled={i === lessons.length - 1} className="text-faint hover:text-content disabled:opacity-30"><ChevronDown size={15} /></button>
            </div>
            <div className="w-9 h-9 rounded-lg bg-surface-2 grid place-items-center text-muted flex-shrink-0"><Icon size={16} /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-content truncate">{l.title}</p>
              <p className="text-xs text-faint capitalize">{l.type}{l.type !== "text" && l.media_url ? ` · ${l.media_url}` : ""}</p>
            </div>
            <button onClick={() => setEditing(l)} className="btn-ghost px-3 py-1.5 text-xs"><PencilLine size={13} /> Edit</button>
            <button onClick={() => setConfirmDel(l)} className="text-faint hover:text-danger p-2"><Trash2 size={15} /></button>
          </div>
        );
      })}
      <button onClick={() => setEditing({})} className="card w-full p-4 flex items-center justify-center gap-2 text-sm font-semibold text-brand border-dashed hover:bg-surface-2 transition">
        <Plus size={16} /> Add lesson
      </button>

      {editing && <LessonModal courseId={course.id} lesson={editing}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}

      <ConfirmDialog open={!!confirmDel} busy={busy}
        title="Delete lesson"
        message={confirmDel ? <>This permanently removes <strong className="text-content">“{confirmDel.title}”</strong> and its content. This can’t be undone.</> : null}
        onConfirm={remove} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}

function LessonModal({ courseId, lesson, onClose, onSaved }) {
  const isNew = !lesson.id;
  const [f, setF] = useState({ title: lesson.title || "", type: lesson.type || "text", body: lesson.body || "", media_url: lesson.media_url || "" });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const fileRef = useRef();
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/media", { method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      set("media_url", data.url);
      toast.success(`Uploaded ${data.filename}`);
    } catch (err) { toast.error(err.message); }
    finally { setUploading(false); }
  };
  const isUploaded = f.media_url?.startsWith("/api/media/");

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isNew) await api(`courses/${courseId}/lessons`, { method: "POST", body: JSON.stringify(f) });
      else await api(`lessons/${lesson.id}`, { method: "PATCH", body: JSON.stringify(f) });
      toast.success(isNew ? "Lesson added" : "Lesson saved");
      onSaved();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-content text-lg">{isNew ? "Add lesson" : "Edit lesson"}</h3>
          <button className="text-faint hover:text-content" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Introduction" autoFocus />
          </div>
          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {["text", "video", "pdf"].map((t) => {
                const Icon = LESSON_ICON[t];
                return (
                  <button type="button" key={t} onClick={() => set("type", t)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold capitalize transition ${
                      f.type === t ? "border-brand bg-brand/10 text-brand" : "border-line text-muted hover:text-content"
                    }`}>
                    <Icon size={15} /> {t}
                  </button>
                );
              })}
            </div>
          </div>
          {f.type === "text" ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Content</label>
                <div className="flex gap-1 p-0.5 rounded-lg bg-surface-2 text-xs font-semibold">
                  {[["write", "Write"], ["preview", "Preview"]].map(([k, l]) => {
                    const on = (k === "preview") === preview;
                    return (
                      <button type="button" key={k} onClick={() => setPreview(k === "preview")}
                        className={`px-2.5 py-1 rounded-md transition ${on ? "bg-brand/15 text-brand" : "text-muted hover:text-content"}`}>{l}</button>
                    );
                  })}
                </div>
              </div>
              {preview ? (
                <div className="input min-h-[140px] overflow-y-auto max-h-[45vh] bg-surface-2/40">
                  {f.body.trim() ? <LessonContent body={f.body} /> : <p className="text-faint text-sm">Nothing to preview yet.</p>}
                </div>
              ) : (
                <textarea className="input min-h-[140px] resize-y font-mono text-[13px] leading-relaxed" value={f.body}
                  onChange={(e) => set("body", e.target.value)} placeholder="Write the lesson content… Markdown supported." />
              )}
              <p className="text-[11px] text-faint mt-1">
                Markdown supported — <code className="font-mono">## heading</code>, <code className="font-mono">- list</code>, <code className="font-mono">**bold**</code>, and images <code className="font-mono">![caption](/lessons/name.jpg)</code>.
              </p>
            </div>
          ) : (
            <div>
              <label className="label">{f.type === "video" ? "Video" : "PDF"}</label>
              {/* Upload */}
              <input ref={fileRef} type="file" className="hidden" onChange={onFile}
                accept={f.type === "video" ? "video/*" : "application/pdf"} />
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="btn-ghost flex-shrink-0">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploading ? "Uploading…" : "Upload file"}
                </button>
                {isUploaded && (
                  <span className="chip flex items-center gap-1.5" style={{ backgroundColor: "rgb(var(--ok) / 0.14)", color: "rgb(var(--ok))" }}>
                    <Check size={12} /> Uploaded
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 my-2 text-[11px] text-faint">
                <span className="h-px flex-1 bg-line" /> or paste a URL <span className="h-px flex-1 bg-line" />
              </div>
              <input className="input font-mono text-xs" value={f.media_url} onChange={(e) => set("media_url", e.target.value)}
                placeholder={f.type === "video" ? "https://…/lesson.mp4" : "https://…/document.pdf"} />
              <p className="text-[11px] text-faint mt-1">Uploads are stored on the server (max 300&nbsp;MB). Or paste any hosted/CDN URL.</p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-brand flex-1" disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : isNew ? "Add lesson" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Quiz ──────────────────────────────────────────────────────────────────────
function QuizTab({ course, reload }) {
  const [editing, setEditing] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null); // question pending delete
  const [busy, setBusy] = useState(false);
  const qs = course.questions;

  const remove = async () => {
    setBusy(true);
    try { await api(`questions/${confirmDel.id}`, { method: "DELETE" }); toast.success("Question deleted"); setConfirmDel(null); reload(); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">Learners must score at least <strong className="text-content">{course.pass_mark}%</strong> to pass and earn a certificate.</p>
        <button onClick={() => setGenerating(true)} className="btn-ghost flex-shrink-0 whitespace-nowrap"
          style={{ color: "rgb(var(--brand))" }}>
          <Sparkles size={15} /> Generate with AI
        </button>
      </div>
      {qs.length === 0 && <div className="card p-10 text-center text-muted">No questions yet — add the first one below.</div>}
      {qs.map((q, i) => (
        <div key={q.id} className="card p-4">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-surface-2 grid place-items-center text-xs font-bold text-muted flex-shrink-0">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-content">{q.prompt}</p>
              <ul className="mt-2 space-y-1">
                {q.options.map((o, oi) => (
                  <li key={oi} className={`text-xs flex items-center gap-2 ${oi === q.correct_index ? "text-ok font-semibold" : "text-muted"}`}>
                    {oi === q.correct_index ? <Check size={13} /> : <span className="w-[13px]" />}{o}
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={() => setEditing(q)} className="btn-ghost px-3 py-1.5 text-xs"><PencilLine size={13} /> Edit</button>
            <button onClick={() => setConfirmDel(q)} className="text-faint hover:text-danger p-2"><Trash2 size={15} /></button>
          </div>
        </div>
      ))}
      <button onClick={() => setEditing({})} className="card w-full p-4 flex items-center justify-center gap-2 text-sm font-semibold text-brand border-dashed hover:bg-surface-2 transition">
        <Plus size={16} /> Add question
      </button>

      {editing && <QuestionModal courseId={course.id} question={editing}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {generating && <GenerateModal courseId={course.id}
        onClose={() => setGenerating(false)} onSaved={() => { setGenerating(false); reload(); }} />}

      <ConfirmDialog open={!!confirmDel} busy={busy}
        title="Delete question"
        message={confirmDel ? <>This permanently removes the question <strong className="text-content">“{confirmDel.prompt}”</strong>. This can’t be undone.</> : null}
        onConfirm={remove} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}

// AI question generation: draft → review/edit → add the batch.
function GenerateModal({ courseId, onClose, onSaved }) {
  const [count, setCount] = useState(5);
  const [stage, setStage] = useState("setup"); // setup | review
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState([]);

  const generate = async () => {
    setLoading(true);
    try {
      const { questions } = await api(`courses/${courseId}/questions/generate`, {
        method: "POST", body: JSON.stringify({ count }),
      });
      setDrafts(questions.map((q) => ({ ...q, keep: true })));
      setStage("review");
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const patch = (i, fields) => setDrafts((ds) => ds.map((d, idx) => (idx === i ? { ...d, ...fields } : d)));
  const setOpt = (i, oi, v) => setDrafts((ds) => ds.map((d, idx) => idx === i ? { ...d, options: d.options.map((o, j) => (j === oi ? v : o)) } : d));

  const save = async () => {
    const chosen = drafts.filter((d) => d.keep).map(({ prompt, options, correct_index }) => ({
      prompt, options: options.map((o) => o.trim()).filter(Boolean), correct_index,
    })).filter((d) => d.prompt.trim() && d.options.length >= 2);
    if (!chosen.length) return toast.error("Select at least one valid question");
    setLoading(true);
    try {
      const { added } = await api(`courses/${courseId}/questions/bulk`, {
        method: "POST", body: JSON.stringify({ questions: chosen }),
      });
      toast.success(`${added} question${added === 1 ? "" : "s"} added`);
      onSaved();
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const keepCount = drafts.filter((d) => d.keep).length;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => !loading && onClose()}>
      <div className="card w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-line">
          <div className="w-9 h-9 rounded-xl grid place-items-center flex-shrink-0"
            style={{ backgroundColor: "rgb(var(--brand) / 0.12)", color: "rgb(var(--brand))" }}>
            <Sparkles size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-content text-lg leading-tight">Generate quiz with AI</h3>
            <p className="text-xs text-muted">Drafts from your lesson content — review before adding. Nothing is saved until you confirm.</p>
          </div>
          <button onClick={onClose} disabled={loading} className="p-1.5 rounded-lg text-muted hover:text-content hover:bg-surface-2"><X size={16} /></button>
        </div>

        {stage === "setup" ? (
          <div className="p-6">
            <label className="label">How many questions?</label>
            <div className="flex items-center gap-2 mt-1">
              {[3, 5, 8, 10].map((n) => (
                <button key={n} onClick={() => setCount(n)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    count === n ? "border-brand text-brand bg-brand/10" : "border-line text-muted hover:text-content"}`}>
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted mt-4">The AI reads this course's lessons — including the text inside attached PDFs — and drafts multiple-choice questions grounded in that material. You'll be able to edit or drop any of them.</p>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
              <button onClick={generate} disabled={loading} className="btn-brand">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <><Sparkles size={16} /> Generate</>}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {drafts.map((d, i) => (
                <div key={i} className={`card p-4 transition-opacity ${d.keep ? "" : "opacity-50"}`}>
                  <div className="flex items-start gap-2">
                    <button onClick={() => patch(i, { keep: !d.keep })} title={d.keep ? "Exclude" : "Include"}
                      className={`mt-0.5 w-5 h-5 rounded border-2 grid place-items-center flex-shrink-0 ${d.keep ? "border-ok bg-ok text-white" : "border-line text-transparent"}`}>
                      <Check size={13} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <textarea className="input text-sm font-semibold min-h-[44px] resize-y" value={d.prompt}
                        onChange={(e) => patch(i, { prompt: e.target.value })} />
                      <div className="mt-2 space-y-1.5">
                        {d.options.map((o, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <button onClick={() => patch(i, { correct_index: oi })} title="Mark correct"
                              className={`w-5 h-5 rounded-full border-2 grid place-items-center flex-shrink-0 ${
                                d.correct_index === oi ? "border-ok bg-ok text-white" : "border-line text-transparent hover:border-faint"}`}>
                              <Check size={12} />
                            </button>
                            <input className="input py-1.5 text-sm" value={o} onChange={(e) => setOpt(i, oi, e.target.value)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 p-4 border-t border-line">
              <span className="text-xs text-muted">{keepCount} of {drafts.length} selected · tap the green circle to set the correct answer</span>
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={() => setStage("setup")} disabled={loading}>Back</button>
                <button onClick={save} disabled={loading || !keepCount} className="btn-brand">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add {keepCount} question{keepCount === 1 ? "" : "s"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QuestionModal({ courseId, question, onClose, onSaved }) {
  const isNew = !question.id;
  const [prompt, setPrompt] = useState(question.prompt || "");
  const [options, setOptions] = useState(question.options?.length ? [...question.options] : ["", ""]);
  const [correct, setCorrect] = useState(question.correct_index ?? 0);
  const [busy, setBusy] = useState(false);

  const setOpt = (i, v) => setOptions((o) => o.map((x, k) => (k === i ? v : x)));
  const addOpt = () => setOptions((o) => [...o, ""]);
  const delOpt = (i) => setOptions((o) => {
    const next = o.filter((_, k) => k !== i);
    if (correct >= next.length) setCorrect(Math.max(0, next.length - 1));
    return next;
  });

  const save = async (e) => {
    e.preventDefault();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) return toast.error("Provide at least two options");
    setBusy(true);
    try {
      const body = JSON.stringify({ prompt, options: opts, correct_index: Math.min(correct, opts.length - 1) });
      if (isNew) await api(`courses/${courseId}/questions`, { method: "POST", body });
      else await api(`questions/${question.id}`, { method: "PATCH", body });
      toast.success(isNew ? "Question added" : "Question saved");
      onSaved();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-content text-lg">{isNew ? "Add question" : "Edit question"}</h3>
          <button className="text-faint hover:text-content" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Question</label>
            <textarea className="input min-h-[70px] resize-y" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="What is…?" autoFocus />
          </div>
          <div>
            <label className="label">Options <span className="text-faint font-normal">— tap the circle to mark the correct answer</span></label>
            <div className="space-y-2">
              {options.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button type="button" onClick={() => setCorrect(i)} title="Mark correct"
                    className={`w-6 h-6 rounded-full border-2 grid place-items-center flex-shrink-0 transition ${
                      correct === i ? "border-ok bg-ok text-white" : "border-line text-transparent hover:border-faint"
                    }`}><Check size={13} /></button>
                  <input className="input" value={o} onChange={(e) => setOpt(i, e.target.value)} placeholder={`Option ${i + 1}`} />
                  {options.length > 2 && <button type="button" onClick={() => delOpt(i)} className="text-faint hover:text-danger p-1.5"><X size={15} /></button>}
                </div>
              ))}
            </div>
            <button type="button" onClick={addOpt} className="mt-2 text-sm font-semibold text-brand flex items-center gap-1.5"><Plus size={14} /> Add option</button>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-brand flex-1" disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : isNew ? "Add question" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Assignments ────────────────────────────────────────────────────────────────
function AssignmentsTab({ course }) {
  const [rows, setRows] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null); // assignment pending removal
  const [busy, setBusy] = useState(false);

  const load = () => api(`assignments/course/${course.id}`).then(setRows).catch((e) => { toast.error(e.message); setRows([]); });
  useEffect(() => { load(); }, [course.id]); // eslint-disable-line

  const unassign = async () => {
    setBusy(true);
    try { await api(`assignments/${confirmDel.id}`, { method: "DELETE" }); toast.success("Unassigned"); setConfirmDel(null); load(); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const overdueCount = (rows || []).filter((r) => r.status === "overdue").length;
  const doneCount = (rows || []).filter((r) => r.status === "completed").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {rows == null ? "…" : rows.length === 0 ? "No one is assigned yet."
            : <>{rows.length} assigned · <span className="text-ok font-semibold">{doneCount} completed</span>{overdueCount > 0 && <> · <span className="text-danger font-semibold">{overdueCount} overdue</span></>}</>}
        </p>
        <button className="btn-brand" onClick={() => setAssigning(true)}><UserPlus size={16} /> Assign people</button>
      </div>

      {rows == null ? (
        <div className="card py-12 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="card py-12 text-center text-muted">Assign this course to people to make it required training.</div>
      ) : (
        <div className="card divide-y divide-line">
          {rows.map((a) => {
            const s = ASSIGN_STATUS[a.status] || ASSIGN_STATUS.not_started;
            return (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold text-brand-fg flex-shrink-0" style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))" }}>
                  {a.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-content truncate">{a.name}</p>
                  <p className="text-xs text-muted truncate">{a.email}</p>
                </div>
                {a.due_date && (
                  <span className={`text-xs flex items-center gap-1 ${a.status === "overdue" ? "text-danger" : "text-muted"}`}>
                    <Calendar size={12} /> {new Date(a.due_date).toLocaleDateString()}
                  </span>
                )}
                <span className="chip flex-shrink-0" style={{ backgroundColor: s.bg, color: s.fg }}>{s.label}</span>
                <button onClick={() => setConfirmDel(a)} className="text-faint hover:text-danger p-1.5"><X size={15} /></button>
              </div>
            );
          })}
        </div>
      )}

      {assigning && <AssignModal courseId={course.id} onClose={() => setAssigning(false)} onDone={() => { setAssigning(false); load(); }} />}

      <ConfirmDialog open={!!confirmDel} busy={busy} confirmLabel="Remove" icon={X}
        title="Remove assignment"
        message={confirmDel ? <>Remove <strong className="text-content">{confirmDel.name}</strong> from this course? Their progress on it will be discarded.</> : null}
        onConfirm={unassign} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}

function AssignModal({ courseId, onClose, onDone }) {
  const [people, setPeople] = useState(null);
  const [picked, setPicked] = useState(new Set());
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { api("users").then(setPeople).catch((e) => { toast.error(e.message); setPeople([]); }); }, []);

  const toggle = (id) => setPicked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const learners = (people || []).filter((p) => p.role === "learner");
  const allLearnersPicked = learners.length > 0 && learners.every((l) => picked.has(l.id));
  const toggleAllLearners = () => setPicked((s) => {
    const n = new Set(s);
    if (allLearnersPicked) learners.forEach((l) => n.delete(l.id));
    else learners.forEach((l) => n.add(l.id));
    return n;
  });

  const submit = async () => {
    if (!picked.size) return toast.error("Pick at least one person");
    setBusy(true);
    try {
      const r = await api("assignments", { method: "POST", body: JSON.stringify({ course_id: courseId, user_ids: [...picked], due_date: due || null }) });
      toast.success(`Assigned to ${r.assigned} ${r.assigned === 1 ? "person" : "people"}`);
      onDone();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-6 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-content text-lg">Assign people</h3>
          <button className="text-faint hover:text-content" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="mb-3">
          <label className="label">Due date <span className="text-faint font-normal">(optional)</span></label>
          <input type="date" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">People</label>
          {learners.length > 0 && (
            <button onClick={toggleAllLearners} className="text-xs font-semibold text-brand">
              {allLearnersPicked ? "Clear learners" : "Select all learners"}
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1">
          {people == null ? (
            <div className="py-8 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>
          ) : people.length === 0 ? (
            <p className="text-sm text-muted py-6 text-center">No people yet — add them under People.</p>
          ) : people.map((p) => (
            <button key={p.id} onClick={() => toggle(p.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface-2 transition text-left">
              <span className={`w-5 h-5 rounded-md border-2 grid place-items-center flex-shrink-0 ${picked.has(p.id) ? "border-brand bg-brand text-white" : "border-line"}`}>
                {picked.has(p.id) && <Check size={12} />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-content truncate">{p.name}</span>
                <span className="block text-xs text-faint truncate capitalize">{p.role}{p.job_title ? ` · ${p.job_title}` : ""}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-3 pt-4">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-brand flex-1" onClick={submit} disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : `Assign${picked.size ? ` (${picked.size})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
