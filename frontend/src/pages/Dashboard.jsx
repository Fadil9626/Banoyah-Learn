import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, BookOpen, Award, Clock, AlertTriangle, ClipboardCheck, CheckCircle2,
  Loader2, Play, ArrowRight, Activity, ShieldCheck, Calendar,
} from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";

const ACTION_LABEL = {
  "user.login": "signed in", "user.create": "added a person", "user.import": "imported people",
  "user.password_change": "changed their password", "user.password_reset": "reset a password",
  "course.publish": "published", "course.unpublish": "unpublished", "assignment.create": "assigned a course",
  "certificate.issue": "earned a certificate for", "apikey.create": "created an API key",
  "apikey.revoke": "revoked an API key", "webhook.create": "added a webhook", "webhook.delete": "removed a webhook",
  "settings.email": "updated email settings", "settings.reminders": "updated reminders", "settings.branding": "updated branding",
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => { api("dashboard").then(setData).catch(() => setData({ role: user?.role })); }, []); // eslint-disable-line

  const hi = user?.name ? `, ${user.name.split(" ")[0]}` : "";
  if (!data) return <div className="py-20 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>;

  return data.role === "learner"
    ? <LearnerDash data={data} hi={hi} navigate={navigate} />
    : <StaffDash data={data} hi={hi} navigate={navigate} />;
}

function Stat({ icon: Icon, tint, value, label, sub, onClick, progress }) {
  return (
    <button onClick={onClick} disabled={!onClick}
      className={`card p-5 text-left ${onClick ? "hover:border-brand/40 hover:shadow-glow transition" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl grid place-items-center" style={{ backgroundColor: `rgb(var(--${tint}) / 0.12)`, color: `rgb(var(--${tint}))` }}>
          <Icon size={18} />
        </div>
        {onClick && <ArrowRight size={15} className="text-faint mt-1" />}
      </div>
      <p className="text-3xl font-black text-content tabular-nums mt-4">{value}</p>
      <p className="text-xs font-medium text-muted mt-1">{label}</p>
      {sub && <p className="text-[11px] text-faint mt-0.5">{sub}</p>}
      {progress != null && (
        <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden mt-3">
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, Math.min(100, progress))}%`, backgroundColor: `rgb(var(--${tint}))` }} />
        </div>
      )}
    </button>
  );
}

// ── Learner ─────────────────────────────────────────────────────────────────
function LearnerDash({ data, hi, navigate }) {
  const s = data.stats;
  return (
    <div>
      <PageHeader title={`Welcome${hi}`} subtitle="Your training at a glance." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={ClipboardCheck} tint="brand" value={s.todo} label="To do" sub="assigned & not done" onClick={() => navigate("/learn")} />
        <Stat icon={Play} tint="brand-2" value={s.in_progress} label="In progress" onClick={() => navigate("/learn")} />
        <Stat icon={CheckCircle2} tint="ok" value={s.completed} label="Completed" />
        <Stat icon={Award} tint="warn" value={s.certificates} label="Certificates" onClick={() => navigate("/learn")} />
      </div>

      <div className="card p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-content flex items-center gap-2"><ClipboardCheck size={16} className="text-brand" /> Required for you</h3>
          <button onClick={() => navigate("/learn")} className="text-sm font-semibold text-brand flex items-center gap-1">My Learning <ArrowRight size={14} /></button>
        </div>
        {data.required.length === 0 ? (
          <div className="py-8 text-center text-muted text-sm">🎉 Nothing outstanding. You're all caught up.</div>
        ) : (
          <div className="space-y-2">
            {data.required.map((r) => (
              <button key={r.course_id} onClick={() => navigate(`/learn/${r.course_id}`)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-2 transition text-left">
                <div className="w-8 h-8 rounded-lg grid place-items-center text-brand-fg flex-shrink-0" style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))" }}><BookOpen size={15} /></div>
                <span className="flex-1 text-sm font-semibold text-content truncate">{r.title}</span>
                {r.due_date && (
                  <span className="chip" style={{ backgroundColor: r.overdue ? "rgb(var(--danger) / 0.14)" : "rgb(var(--muted) / 0.14)", color: r.overdue ? "rgb(var(--danger))" : "rgb(var(--muted))" }}>
                    {r.overdue ? <AlertTriangle size={11} /> : <Calendar size={11} />}{r.overdue ? "Overdue" : new Date(r.due_date).toLocaleDateString()}
                  </span>
                )}
                <ArrowRight size={15} className="text-faint" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Staff / admin ───────────────────────────────────────────────────────────
function StaffDash({ data, hi, navigate }) {
  const t = data.totals;
  const certRate = t.people ? Math.round((t.certified_people / t.people) * 100) : 0;
  const compliance = t.assigned_total ? Math.round((t.assigned_done / t.assigned_total) * 100) : null;
  // Routine sign-ins are noise on a dashboard — they belong in the Audit log.
  const recent = (data.recent || []).filter((r) => r.action !== "user.login");
  return (
    <div>
      <PageHeader title={`Welcome${hi}`} subtitle="Here's how your training programme is doing." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Users} tint="brand" value={`${certRate}%`} label="Workforce certified" sub={`${t.certified_people} of ${t.people}`} progress={certRate} onClick={() => navigate("/reporting")} />
        <Stat icon={ClipboardCheck} tint="brand-2" value={compliance == null ? "—" : `${compliance}%`} label="Training compliance"
          sub={t.assigned_overdue ? `${t.assigned_overdue} overdue` : "required courses"} progress={compliance ?? 0} onClick={() => navigate("/reporting")} />
        <Stat icon={Award} tint="ok" value={t.certificates} label="Certificates issued" onClick={() => navigate("/certificates")} />
        <Stat icon={Clock} tint="warn" value={t.expiring_soon} label="Expiring in 30 days" onClick={() => navigate("/reporting")} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-6">
        {/* Recent activity */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-bold text-content flex items-center gap-2 mb-4"><Activity size={16} className="text-brand" /> Recent activity</h3>
          {recent.length === 0 ? (
            <div className="py-8 text-center text-muted text-sm">No recent activity yet.</div>
          ) : (
            <div className="space-y-3">
              {recent.map((r, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand mt-2 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-content">
                      <span className="font-semibold">{r.actor_name || "Someone"}</span>{" "}
                      <span className="text-muted">{ACTION_LABEL[r.action] || r.action}</span>
                      {r.target && <span className="font-medium"> {r.target}</span>}
                    </p>
                    <p className="text-[11px] text-faint">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Getting started / quick links */}
        <div className="card p-6">
          <h3 className="font-bold text-content mb-4">Quick actions</h3>
          <div className="space-y-2">
            {[
              { label: "Add or import people", to: "/people", icon: Users },
              { label: "Create a course", to: "/courses", icon: BookOpen },
              { label: "View compliance", to: "/reporting", icon: ShieldCheck },
              { label: "Connect a system", to: "/api-access", icon: ArrowRight },
            ].map((q) => (
              <button key={q.to} onClick={() => navigate(q.to)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-2 transition text-left">
                <q.icon size={16} className="text-muted" />
                <span className="flex-1 text-sm font-semibold text-content">{q.label}</span>
                <ArrowRight size={15} className="text-faint" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
