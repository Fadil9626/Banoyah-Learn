import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft, Loader2, CheckCircle2, Circle, FileText, Video, File,
  ChevronRight, Award, RotateCcw, X, Check, ListChecks, AlertTriangle,
  Maximize2, Minimize2,
} from "lucide-react";
import api from "../lib/api";
import LessonContent from "../components/LessonContent";

const ICON = { text: FileText, video: Video, pdf: File };

export default function CoursePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [mode, setMode] = useState("learn"); // learn | quiz | result
  const [activeLesson, setActiveLesson] = useState(0);
  const [result, setResult] = useState(null);
  const [fs, setFs] = useState(false);
  const readerRef = useRef(null);

  // Full-screen reading mode. Uses the native Fullscreen API where available and
  // falls back to a fixed overlay (the conditional classes below) otherwise; the
  // fullscreenchange listener keeps our state in sync when the user presses Esc.
  const toggleFs = () => {
    const el = readerRef.current;
    if (!document.fullscreenElement) el?.requestFullscreen?.().catch(() => setFs(true));
    else document.exitFullscreen?.();
    if (!el?.requestFullscreen) setFs((v) => !v); // no API → pure CSS overlay
  };
  useEffect(() => {
    const onChange = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const load = async () => {
    try {
      const d = await api(`learn/courses/${id}`);
      setData(d);
    } catch (e) { toast.error(e.message); navigate("/learn"); }
  };
  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const done = useMemo(() => new Set((data?.enrollment?.completed_lessons || []).map(Number)), [data]);
  const allLessonsDone = data && data.lessons.length > 0 && data.lessons.every((l) => done.has(l.id));
  const doneCount = data ? data.lessons.filter((l) => done.has(l.id)).length : 0;
  const pct = data && data.lessons.length ? Math.round((doneCount / data.lessons.length) * 100) : 0;

  const markDone = async (lessonId) => {
    try {
      const enr = await api(`learn/courses/${id}/progress`, { method: "POST", body: JSON.stringify({ lesson_id: lessonId }) });
      setData((d) => ({ ...d, enrollment: enr }));
    } catch (e) { toast.error(e.message); }
  };

  if (!data) return <div className="py-20 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>;

  if (mode === "quiz")
    return <Quiz course={data.course} questions={data.questions}
      onCancel={() => setMode("learn")}
      onDone={(r) => { setResult(r); setMode("result"); load(); }} />;

  if (mode === "result")
    return <Result result={result} course={data.course} questions={data.questions}
      onRetry={() => setMode("quiz")} onClose={() => navigate("/learn")}
      onCertificate={(serial) => navigate(`/learn/certificate/${serial}`)} />;

  // ── Learn mode ──
  const lesson = data.lessons[activeLesson];
  return (
    <div>
      <button onClick={() => navigate("/learn")} className="flex items-center gap-1.5 text-sm text-muted hover:text-content mb-4">
        <ArrowLeft size={16} /> My Learning
      </button>
      <h1 className="text-2xl font-black text-content tracking-tight mb-1">{data.course.title}</h1>
      {data.course.description && <p className="text-sm text-muted mb-6 max-w-2xl">{data.course.description}</p>}

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Lesson list */}
        <aside className="card p-2 h-max lg:sticky lg:top-20">
          <div className="px-3 pt-2 pb-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-content">{doneCount} of {data.lessons.length} lessons</span>
              <span className="text-faint tabular-nums">{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, pct)}%`, backgroundImage: "linear-gradient(90deg, rgb(var(--brand)), rgb(var(--brand-2)))" }} />
            </div>
          </div>
          {data.lessons.map((l, i) => {
            const Icon = ICON[l.type] || FileText;
            const isDone = done.has(l.id);
            return (
              <button key={l.id} onClick={() => setActiveLesson(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                  i === activeLesson ? "bg-brand/10 text-brand" : "text-muted hover:bg-surface-2"
                }`}>
                {isDone ? <CheckCircle2 size={16} className="text-ok flex-shrink-0" /> : <Circle size={16} className="flex-shrink-0 opacity-50" />}
                <span className="flex-1 text-sm font-medium truncate">{l.title}</span>
                <Icon size={13} className="flex-shrink-0 opacity-60" />
              </button>
            );
          })}
          <div className="p-2 mt-1 border-t border-line">
            <button onClick={() => setMode("quiz")} disabled={!allLessonsDone || data.can_attempt === false}
              className="btn-brand w-full disabled:opacity-50" title={allLessonsDone ? "" : "Complete all lessons first"}>
              <ListChecks size={16} /> Take quiz
            </button>
            {!allLessonsDone && <p className="text-[11px] text-faint text-center mt-2">Finish all lessons to unlock the quiz.</p>}
            {allLessonsDone && data.attempts_left != null && (
              <p className={`text-[11px] text-center mt-2 ${data.can_attempt === false ? "text-danger" : "text-faint"}`}>
                {data.can_attempt === false ? "No attempts remaining." : `${data.attempts_left} attempt${data.attempts_left === 1 ? "" : "s"} left`}
              </p>
            )}
          </div>
        </aside>

        {/* Lesson content */}
        <section ref={readerRef}
          className={`card flex flex-col ${fs ? "fixed inset-0 z-50 rounded-none overflow-y-auto bg-bg p-6 sm:p-10" : "p-6 lg:p-8 min-h-[320px]"}`}>
         <div className={`flex flex-col flex-1 w-full ${fs ? "max-w-3xl mx-auto" : ""}`}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-faint uppercase tracking-wide">
              Lesson {activeLesson + 1} of {data.lessons.length}
            </span>
            <button onClick={toggleFs} title={fs ? "Exit full screen" : "Full screen"}
              className="text-faint hover:text-content p-1.5 -mr-1 rounded-lg hover:bg-surface-2 transition">
              {fs ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
          <h2 className="text-xl font-bold text-content mb-4">{lesson.title}</h2>

          <div className="flex-1">
            {lesson.type === "text" && <LessonContent body={lesson.body} />}
            {lesson.type === "video" && (
              lesson.media_url
                ? <video src={lesson.media_url} controls className="w-full rounded-xl bg-black" />
                : <Empty label="No video URL set for this lesson." />
            )}
            {lesson.type === "pdf" && (
              lesson.media_url
                ? <a href={lesson.media_url} target="_blank" rel="noreferrer" className="btn-ghost"><File size={16} /> Open PDF</a>
                : <Empty label="No PDF URL set for this lesson." />
            )}
          </div>

          <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-line">
            <button disabled={activeLesson === 0} onClick={() => setActiveLesson((i) => i - 1)} className="btn-ghost disabled:opacity-40">Previous</button>
            <div className="flex items-center gap-2">
              {!done.has(lesson.id) && (
                <button onClick={() => markDone(lesson.id)} className="btn-ghost"><Check size={16} /> Mark complete</button>
              )}
              {activeLesson < data.lessons.length - 1 ? (
                <button onClick={() => { if (!done.has(lesson.id)) markDone(lesson.id); setActiveLesson((i) => i + 1); }} className="btn-brand">
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button onClick={() => { if (!done.has(lesson.id)) markDone(lesson.id); setMode("quiz"); }} disabled={data.lessons.length === 0} className="btn-brand">
                  <ListChecks size={16} /> Go to quiz
                </button>
              )}
            </div>
          </div>
         </div>
        </section>
      </div>
    </div>
  );
}

const Empty = ({ label }) => <div className="text-sm text-faint bg-surface-2 rounded-xl p-6 text-center">{label}</div>;

// ── Quiz ──────────────────────────────────────────────────────────────────────
function Quiz({ course, questions, onCancel, onDone }) {
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const answered = Object.keys(answers).length;

  const submit = async () => {
    setBusy(true);
    try {
      const r = await api(`learn/courses/${course.id}/submit`, { method: "POST", body: JSON.stringify({ answers }) });
      onDone(r);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black text-content">{course.title} — Quiz</h1>
        <button onClick={onCancel} className="text-faint hover:text-content"><X size={20} /></button>
      </div>
      <p className="text-sm text-muted mb-5">Score at least <strong className="text-content">{course.pass_mark}%</strong> to pass. {answered}/{questions.length} answered.</p>

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={q.id} className="card p-5">
            <p className="font-semibold text-content mb-3"><span className="text-faint mr-2">{qi + 1}.</span>{q.prompt}</p>
            <div className="space-y-2">
              {q.options.map((o, oi) => {
                const selected = answers[q.id] === oi;
                return (
                  <button key={oi} onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition ${
                      selected ? "border-brand bg-brand/10 text-content" : "border-line text-muted hover:border-faint"
                    }`}>
                    <span className={`w-5 h-5 rounded-full border-2 grid place-items-center flex-shrink-0 ${selected ? "border-brand bg-brand" : "border-faint"}`}>
                      {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                    </span>
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {answered < questions.length && (
        <div className="mt-6 flex items-center gap-2 text-xs text-warn rounded-xl px-3.5 py-2.5" style={{ backgroundColor: "rgb(var(--warn) / 0.10)" }}>
          <AlertTriangle size={14} className="flex-shrink-0" />
          {questions.length - answered} question{questions.length - answered === 1 ? "" : "s"} unanswered — they'll be marked wrong.
        </div>
      )}
      <div className="flex gap-3 mt-4">
        <button onClick={onCancel} className="btn-ghost flex-1">Back to lessons</button>
        <button onClick={submit} disabled={busy} className="btn-brand flex-1">
          {busy ? <Loader2 size={16} className="animate-spin" /> : (answered < questions.length ? "Submit anyway" : "Submit quiz")}
        </button>
      </div>
    </div>
  );
}

// ── Result ────────────────────────────────────────────────────────────────────
function Result({ result, course, questions, onRetry, onClose, onCertificate }) {
  const { passed, score, pass_mark, correct, total, review, attempts_left } = result;
  const noAttempts = attempts_left === 0;
  return (
    <div className="max-w-lg mx-auto pt-6">
      <div className="text-center">
        <div className={`w-20 h-20 rounded-3xl grid place-items-center mx-auto ${passed ? "text-ok" : "text-danger"}`}
          style={{ backgroundColor: passed ? "rgb(var(--ok) / 0.12)" : "rgb(var(--danger) / 0.12)" }}>
          {passed ? <Award size={40} /> : <RotateCcw size={36} />}
        </div>
        <h1 className="text-2xl font-black text-content mt-5">{passed ? "Congratulations!" : "Not quite there"}</h1>
        <p className="text-muted mt-1">
          You scored <strong className="text-content">{score}%</strong> ({correct}/{total}) · pass mark {pass_mark}%
        </p>
        <div className="h-2 rounded-full bg-surface-2 overflow-hidden mt-6 max-w-xs mx-auto">
          <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: passed ? "rgb(var(--ok))" : "rgb(var(--danger))" }} />
        </div>
        {!passed && attempts_left != null && (
          <p className={`text-xs mt-3 ${noAttempts ? "text-danger" : "text-muted"}`}>
            {noAttempts ? "No attempts remaining." : `${attempts_left} attempt${attempts_left === 1 ? "" : "s"} left`}
          </p>
        )}
      </div>

      {/* Answer review */}
      {review && questions?.length > 0 && (
        <div className="mt-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-faint mb-3">Review</p>
          <div className="space-y-3">
            {questions.map((q, qi) => {
              const r = review[q.id] || {};
              return (
                <div key={q.id} className="card p-4">
                  <div className="flex items-start gap-2">
                    {r.correct ? <Check size={16} className="text-ok mt-0.5 flex-shrink-0" /> : <X size={16} className="text-danger mt-0.5 flex-shrink-0" />}
                    <p className="text-sm font-semibold text-content">{q.prompt}</p>
                  </div>
                  <ul className="mt-2 space-y-1 pl-6">
                    {q.options.map((o, oi) => {
                      const isCorrect = oi === r.correct_index;
                      const isChosen = oi === r.chosen;
                      return (
                        <li key={oi} className={`text-xs flex items-center gap-2 ${isCorrect ? "text-ok font-semibold" : isChosen ? "text-danger" : "text-muted"}`}>
                          {isCorrect ? <Check size={12} /> : isChosen ? <X size={12} /> : <span className="w-3" />}
                          {o}{isChosen && !isCorrect ? " (your answer)" : ""}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5 mt-8">
        {passed && result.certificate && (
          <button onClick={() => onCertificate(result.certificate.serial)} className="btn-brand">
            <Award size={16} /> View certificate
          </button>
        )}
        {!passed && !noAttempts && <button onClick={onRetry} className="btn-brand"><RotateCcw size={16} /> Try again</button>}
        <button onClick={onClose} className="btn-ghost">Back to My Learning</button>
      </div>
    </div>
  );
}
