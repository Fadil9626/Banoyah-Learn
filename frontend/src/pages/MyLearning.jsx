import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { BookOpen, Award, Play, RotateCcw, CheckCircle2, Loader2, FileText, HelpCircle, Clock } from "lucide-react";
import api from "../lib/api";
import PageHeader from "../components/PageHeader";

export default function MyLearning() {
  const [catalog, setCatalog] = useState(null);
  const [certs, setCerts] = useState([]);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [cat, me] = await Promise.all([api("learn/catalog"), api("learn/me")]);
      setCatalog(cat);
      setCerts(me.certificates);
    } catch (e) { toast.error(e.message); setCatalog([]); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader title="My Learning" subtitle="Take courses, pass the assessment, earn your certificate." />

      {certs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-content mb-3 flex items-center gap-2"><Award size={16} className="text-warn" /> My certificates</h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {certs.map((c) => <CertCard key={c.id} cert={c} onView={() => navigate(`/learn/certificate/${c.serial}`)} />)}
          </div>
        </div>
      )}

      <h2 className="text-sm font-bold text-content mb-3 flex items-center gap-2"><BookOpen size={16} className="text-brand" /> Available courses</h2>
      {catalog == null ? (
        <div className="py-20 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>
      ) : catalog.length === 0 ? (
        <div className="card py-16 text-center text-muted">No published courses yet. Check back soon.</div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {catalog.map((c) => <CourseCard key={c.id} course={c} onOpen={() => navigate(`/learn/${c.id}`)} />)}
        </div>
      )}
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
