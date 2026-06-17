import React, { useEffect, useState } from "react";
import { Users, BookOpen, Award, TrendingUp, ArrowUpRight } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";

const STATS = [
  { key: "people",       label: "People",            icon: Users,      tint: "brand" },
  { key: "courses",      label: "Courses",           icon: BookOpen,   tint: "ok" },
  { key: "certificates", label: "Certificates issued", icon: Award,    tint: "warn" },
  { key: "completion",   label: "Avg. completion",   icon: TrendingUp, tint: "brand-2" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [people, setPeople] = useState(null);

  useEffect(() => {
    api("users").then((r) => setPeople(r.length)).catch(() => setPeople(0));
  }, []);

  const values = {
    people: people == null ? "—" : people,
    courses: "0",
    certificates: "0",
    completion: "—",
  };

  return (
    <div>
      <PageHeader
        title={`Welcome${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        subtitle="Here's what's happening across your training programme."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ key, label, icon: Icon, tint }) => (
          <div key={key} className="card p-5">
            <div className={`w-10 h-10 rounded-xl grid place-items-center mb-4 bg-${tint}/12 text-${tint}`}
                 style={{ backgroundColor: `rgb(var(--${tint}) / 0.12)`, color: `rgb(var(--${tint}))` }}>
              <Icon size={18} />
            </div>
            <p className="text-3xl font-black text-content tabular-nums">{values[key]}</p>
            <p className="text-xs font-medium text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-6">
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-bold text-content">Getting started</h3>
          <p className="text-sm text-muted mt-1">Build your training programme in a few steps.</p>
          <ol className="mt-5 space-y-3">
            {[
              { n: 1, t: "Add your people", d: "Import learners or add them manually under People.", done: people > 0 },
              { n: 2, t: "Create a course", d: "Add lessons and an assessment. (Coming next)", done: false },
              { n: 3, t: "Issue certificates", d: "Learners who pass get a verifiable certificate.", done: false },
              { n: 4, t: "Connect a system", d: "Share certification status over the API.", done: false },
            ].map((s) => (
              <li key={s.n} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold flex-shrink-0 ${
                  s.done ? "bg-ok text-white" : "bg-surface-2 text-muted"
                }`}>{s.done ? "✓" : s.n}</div>
                <div>
                  <p className="text-sm font-semibold text-content">{s.t}</p>
                  <p className="text-xs text-muted">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="card p-6 flex flex-col">
          <h3 className="font-bold text-content">API access</h3>
          <p className="text-sm text-muted mt-1 flex-1">
            Banoyah Learn is API-first. Other systems read certification status with a
            scoped key — no shared database, no lock-in.
          </p>
          <div className="mt-4 rounded-xl bg-surface-2 border border-line p-3 font-mono text-[11px] text-muted overflow-x-auto">
            <span className="text-ok">GET</span> /api/v1/certifications
            <br />?external_id=staff-4921
          </div>
          <a className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline" href="#">
            View the integration guide <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
