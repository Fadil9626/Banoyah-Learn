import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { BookOpen, Award, Play, RotateCcw, CheckCircle2, Loader2, FileText, HelpCircle, Clock, ClipboardCheck, Calendar, AlertTriangle, Search } from "lucide-react";
import api from "../lib/api";
import PageHeader from "../components/PageHeader";

export default function MyLearning() {
  const [catalog, setCatalog] = useState(null);
  const [certs, setCerts] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [cat, me, mine] = await Promise.all([api("learn/catalog"), api("learn/me"), api("assignments/me")]);
      setCatalog(cat);
      setCerts(me.certificates);
      setAssigned(mine);
    } catch (e) { toast.error(e.message); setCatalog([]); }
  };
  useEffect(() => { load(); }, []);

  const todo = assigned.filter((a) => a.status !== "completed");

  return (
    <div>
      <PageHeader title="My Learning" subtitle="Take courses, pass the assessment, earn your certificate." />

      {todo.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-content mb-3 flex items-center gap-2"><ClipboardCheck size={16} className="text-brand" /> Required for you</h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {todo.map((a) => <AssignedCard key={a.id} a={a} onOpen={() => navigate(`/learn/${a.course_id}`)} />)}
          </div>
        </div>
      )}

      {certs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-content mb-3 flex items-center gap-2"><Award size={16} className="text-warn" /> My certificates</h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {certs.map((c) => <CertCard key={c.id} cert={c} onView={() => navigate(`/learn/certificate/${c.serial}`)} />)}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="text-sm font-bold text-content flex items-center gap-2">
          <BookOpen size={16} className="text-brand" /> Available courses
          {catalog?.length > 0 && <span className="text-faint font-medium">({catalog.length})</span>}
        </h2>
        {catalog?.length > 0 && (
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses…"
              className="pl-9 pr-3 py-2 rounded-xl bg-surface-2 border border-line text-sm w-full sm:w-56 text-content placeholder:text-faint focus:outline-none focus:border-brand/50" />
          </div>
        )}
      </div>
      {catalog == null ? (
        <div className="py-20 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>
      ) : catalog.length === 0 ? (
        <div className="card py-16 text-center text-muted">No published courses yet. Check back soon.</div>
      ) : (() => {
        const filtered = catalog.filter((c) => `${c.title} ${c.category || ""}`.toLowerCase().includes(q.trim().toLowerCase()));
        return filtered.length === 0 ? (
          <div className="card py-12 text-center text-muted text-sm">No courses match "{q}".</div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((c) => <CourseCard key={c.id} course={c} onOpen={() => navigate(`/learn/${c.id}`)} />)}
          </div>
        );
      })()}
    </div>
  );
}

function AssignedCard({ a, onOpen }) {
  const overdue = a.status === "overdue";
  const started = a.progress_pct > 0;
  return (
    <div className="card p-5 flex flex-col" style={overdue ? { borderColor: "rgb(var(--danger) / 0.45)" } : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl grid place-items-center text-brand-fg flex-shrink-0" style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))" }}>
          <ClipboardCheck size={18} />
        </div>
        {a.due_date && (
          <span className="chip" style={{ backgroundColor: overdue ? "rgb(var(--danger) / 0.14)" : "rgb(var(--muted) / 0.14)", color: overdue ? "rgb(var(--danger))" : "rgb(var(--muted))" }}>
            {overdue ? <AlertTriangle size={12} /> : <Calendar size={12} />}
            {overdue ? "Overdue" : `Due ${new Date(a.due_date).toLocaleDateString()}`}
          </span>
        )}
      </div>
      <h3 className="mt-4 font-bold text-content leading-snug line-clamp-2">{a.title}</h3>
      {a.category && <p className="text-xs text-muted mt-1">{a.category}</p>}
      {started && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${a.progress_pct}%`, backgroundImage: "linear-gradient(90deg, rgb(var(--brand)), rgb(var(--brand-2)))" }} />
          </div>
        </div>
      )}
      <button onClick={onOpen} className="mt-4 btn-brand w-full"><Play size={16} /> {started ? "Continue" : "Start"}</button>
    </div>
  );
}

function CourseCard({ course, onOpen }) {
  const passed = course.enrollment_status === "passed";
  const started = !!course.enrollment_status;
  const Btn = passed
    ? { label: "Review", icon: RotateCcw }
    : started ? { label: "Continue", icon: Play } : { label: "Start course", icon: Play };

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl grid place-items-center text-brand-fg flex-shrink-0"
          style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))" }}>
          <BookOpen size={18} />
        </div>
        {passed && <span className="chip" style={{ backgroundColor: "rgb(var(--ok) / 0.14)", color: "rgb(var(--ok))" }}><CheckCircle2 size={12} /> Passed</span>}
      </div>
      <h3 className="mt-4 font-bold text-content leading-snug line-clamp-2">{course.title}</h3>
      {course.category && <p className="text-xs text-muted mt-1">{course.category}</p>}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><FileText size={13} />{course.lesson_count}</span>
        <span className="flex items-center gap-1.5"><HelpCircle size={13} />{course.question_count}</span>
        <span className="ml-auto">Pass {course.pass_mark}%</span>
      </div>

      {started && !passed && (
        <div className="mt-4">
          <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${course.progress_pct || 0}%`, backgroundImage: "linear-gradient(90deg, rgb(var(--brand)), rgb(var(--brand-2)))" }} />
          </div>
          <p className="text-[11px] text-faint mt-1">{course.progress_pct || 0}% complete</p>
        </div>
      )}

      <button onClick={onOpen} className={`mt-4 ${passed ? "btn-ghost" : "btn-brand"} w-full`}>
        <Btn.icon size={16} /> {Btn.label}
      </button>
    </div>
  );
}

function CertCard({ cert, onView }) {
  const expired = cert.certified_until && new Date(cert.certified_until) < new Date();
  return (
    <button onClick={onView} className="card p-5 text-left hover:shadow-glow hover:border-warn/40 transition">
      <div className="flex items-start justify-between">
        <Award size={22} className="text-warn" />
        {cert.certified_until && (
          <span className="chip" style={{ backgroundColor: expired ? "rgb(var(--danger) / 0.14)" : "rgb(var(--muted) / 0.14)", color: expired ? "rgb(var(--danger))" : "rgb(var(--muted))" }}>
            <Clock size={11} /> {expired ? "Expired" : `Valid to ${new Date(cert.certified_until).toLocaleDateString()}`}
          </span>
        )}
      </div>
      <h3 className="mt-3 font-bold text-content leading-snug line-clamp-2">{cert.course_title}</h3>
      <p className="text-xs text-muted mt-1 font-mono">{cert.serial} · {cert.score}%</p>
    </button>
  );
}
