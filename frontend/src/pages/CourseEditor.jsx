import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft, Loader2, Save, Trash2, Plus, X, FileText, Video, File,
  ChevronUp, ChevronDown, Check, Globe, PencilLine, HelpCircle,
} from "lucide-react";
import api from "../lib/api";
import { StatusChip } from "./Courses";

const TABS = [
  { key: "details", label: "Details", icon: PencilLine },
  { key: "lessons", label: "Lessons", icon: FileText },
  { key: "quiz", label: "Quiz", icon: HelpCircle },
];
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
    </div>
  );
}

const Count = ({ n }) => <span className="chip bg-surface-2 text-faint ml-1">{n}</span>;

// ── Details ───────────────────────────────────────────────────────────────────
function DetailsTab({ course, onSaved }) {
  const [f, setF] = useState({
    title: course.title, description: course.description || "", category: course.category || "",
    pass_mark: course.pass_mark, validity_months: course.validity_months ?? "",
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
      <button className="btn-brand" onClick={save} disabled={busy}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save changes
      </button>
    </div>
  );
}

// ── Lessons ───────────────────────────────────────────────────────────────────
function LessonsTab({ course, reload }) {
  const [editing, setEditing] = useState(null); // lesson object or {} for new
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

  const remove = async (lesson) => {
    if (!confirm(`Delete lesson "${lesson.title}"?`)) return;
    try { await api(`lessons/${lesson.id}`, { method: "DELETE" }); toast.success("Lesson deleted"); reload(); }
    catch (e) { toast.error(e.message); }
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
            <button onClick={() => remove(l)} className="text-faint hover:text-danger p-2"><Trash2 size={15} /></button>
          </div>
        );
      })}
      <button onClick={() => setEditing({})} className="card w-full p-4 flex items-center justify-center gap-2 text-sm font-semibold text-brand border-dashed hover:bg-surface-2 transition">
        <Plus size={16} /> Add lesson
      </button>

      {editing && <LessonModal courseId={course.id} lesson={editing}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

function LessonModal({ courseId, lesson, onClose, onSaved }) {
  const isNew = !lesson.id;
  const [f, setF] = useState({ title: lesson.title || "", type: lesson.type || "text", body: lesson.body || "", media_url: lesson.media_url || "" });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

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
              <label className="label">Content</label>
              <textarea className="input min-h-[140px] resize-y" value={f.body} onChange={(e) => set("body", e.target.value)} placeholder="Write the lesson content…" />
            </div>
          ) : (
            <div>
              <label className="label">{f.type === "video" ? "Video URL" : "PDF URL"}</label>
              <input className="input font-mono text-xs" value={f.media_url} onChange={(e) => set("media_url", e.target.value)}
                placeholder={f.type === "video" ? "https://…/lesson.mp4" : "https://…/document.pdf"} />
              <p className="text-[11px] text-faint mt-1">Direct media upload + CDN comes with the Media module. For now, paste a hosted URL.</p>
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
  const qs = course.questions;

  const remove = async (q) => {
    if (!confirm("Delete this question?")) return;
    try { await api(`questions/${q.id}`, { method: "DELETE" }); toast.success("Question deleted"); reload(); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Learners must score at least <strong className="text-content">{course.pass_mark}%</strong> to pass and earn a certificate.</p>
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
            <button onClick={() => remove(q)} className="text-faint hover:text-danger p-2"><Trash2 size={15} /></button>
          </div>
        </div>
      ))}
      <button onClick={() => setEditing({})} className="card w-full p-4 flex items-center justify-center gap-2 text-sm font-semibold text-brand border-dashed hover:bg-surface-2 transition">
        <Plus size={16} /> Add question
      </button>

      {editing && <QuestionModal courseId={course.id} question={editing}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
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
