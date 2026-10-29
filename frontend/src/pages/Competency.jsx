import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Loader2, Search, ShieldAlert, TrendingDown } from "lucide-react";
import api from "../lib/api";
import PageHeader from "../components/PageHeader";

// Competency: every member of staff against every practical. Who is signed off,
// who is due or has lapsed, who failed, and where the team loses points. A cell
// opens the run behind it.

const STATUS = {
  competent:   { label: "Competent",   tone: "ok" },
  due:         { label: "Due",         tone: "warn" },
  expired:     { label: "Expired",     tone: "danger" },
  failed:      { label: "Not passed",  tone: "danger" },
  in_progress: { label: "In progress", tone: "muted" },
  not_started: { label: "Not started", tone: "faint" },
};
const ACTION = new Set(["due", "expired", "failed"]);
const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");

export default function Competency() {
  const navigate = useNavigate();
  const [m, setM] = useState(null);
  const [weak, setWeak] = useState(null);
  const [q, setQ] = useState("");
  const [team, setTeam] = useState("");
  const [only, setOnly] = useState("all");      // all | action | <status>

  useEffect(() => {
    api("practicals/competency").then(setM).catch((e) => toast.error(e.message));
    api("practicals/weak-points").then(setWeak).catch((e) => toast.error(e.message));
  }, []);

  const teams = useMemo(() => [...new Set((m?.people || []).map((p) => p.team).filter(Boolean))].sort(), [m]);
  const people = useMemo(() => (m?.people || []).filter((p) => {
    if (q && !`${p.name} ${p.job_title || ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (team && p.team !== team) return false;
    const st = Object.values(p.cells).map((c) => c.status);
    if (only === "action") return st.some((s) => ACTION.has(s));
    if (only !== "all") return st.includes(only);
    return true;
  }), [m, q, team, only]);

  if (!m) return <div className="py-20 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>;
  const c = m.counts || {}, total = Object.values(c).reduce((a, b) => a + b, 0);

  return (
    <div>
      <PageHeader title="Competency" subtitle={`Every member of staff against every 3D practical. "Due" means the certificate runs out within ${m.due_days} days.`} />

      {!m.courses.length ? (
        <div className="card p-8 text-center text-sm text-muted">No published course has a 3D practical yet.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <Tile n={c.competent} of={total} label="Competent" tone="ok" onClick={() => setOnly("competent")} on={only === "competent"} />
            <Tile n={c.due} label={`Due within ${m.due_days} days`} tone="warn" onClick={() => setOnly("due")} on={only === "due"} />
            <Tile n={c.expired} label="Expired" tone="danger" onClick={() => setOnly("expired")} on={only === "expired"} />
            <Tile n={c.failed} label="Not passed" tone="danger" onClick={() => setOnly("failed")} on={only === "failed"} />
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input className="input pl-9" placeholder="Find a person or job title" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a person" />
            </div>
            {teams.length > 0 && (
              <select className="input w-auto" value={team} onChange={(e) => setTeam(e.target.value)} aria-label="Team">
                <option value="">All teams</option>
                {teams.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            <select className="input w-auto" value={only} onChange={(e) => setOnly(e.target.value)} aria-label="Show">
              <option value="all">Everyone</option>
              <option value="action">Needs action (due, expired, not passed)</option>
              {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
            <span className="text-xs text-muted ml-auto">{people.length} of {m.people.length} people</span>
          </div>

          <div className="card overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className="sticky left-0 z-10 bg-surface text-left font-semibold text-[11px] uppercase tracking-wider text-muted px-4 py-3 min-w-[180px]">Staff</th>
                  {m.courses.map((co) => (
                    <th key={co.id} className="text-left font-semibold px-3 py-3 min-w-[132px]" title={co.title}>
                      <span className="block text-[12px] text-content">{co.code}</span>
                      <span className="block text-[10.5px] font-normal text-faint truncate max-w-[150px]">{co.title.replace(co.code, "").trim()}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <th scope="row" className="sticky left-0 z-10 bg-surface text-left font-normal px-4 py-2.5">
                      <span className="block font-semibold text-content">{p.name}</span>
                      <span className="block text-[11px] text-faint">{[p.job_title, p.team].filter(Boolean).join(" · ") || " "}</span>
                    </th>
                    {m.courses.map((co) => <td key={co.id} className="px-2 py-1.5"><Cell c={p.cells[co.id]} onOpen={(sid) => navigate(`/practicals/${sid}`)} /></td>)}
                  </tr>
                ))}
                {!people.length && <tr><td colSpan={m.courses.length + 1} className="px-4 py-8 text-center text-sm text-muted">Nobody matches.</td></tr>}
              </tbody>
            </table>
          </div>

          <h2 className="text-sm font-bold text-content mb-1 flex items-center gap-2"><TrendingDown size={16} className="text-brand" /> Where staff lose points</h2>
          <p className="text-xs text-muted mb-3">The commonest mistakes in each practical's exams, so retraining can go where it is needed.</p>
          {!weak ? <Loader2 className="animate-spin text-muted" /> : (
            <div className="grid lg:grid-cols-2 gap-4">
              {weak.map((w) => <WeakCard key={w.course_id} w={w} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const TONE = {
  ok: { fg: "rgb(var(--ok))", bg: "rgb(var(--ok) / 0.12)" },
  warn: { fg: "rgb(var(--warn))", bg: "rgb(var(--warn) / 0.14)" },
  danger: { fg: "rgb(var(--danger))", bg: "rgb(var(--danger) / 0.12)" },
  muted: { fg: "rgb(var(--muted))", bg: "rgb(var(--surface-2))" },
  faint: { fg: "rgb(var(--faint))", bg: "transparent" },
};

function Tile({ n = 0, of, label, tone, onClick, on }) {
  const t = TONE[tone];
  return (
    <button onClick={onClick} aria-pressed={on}
      className={`text-left rounded-xl border px-4 py-3 transition ${on ? "border-brand ring-1 ring-brand" : "border-line hover:border-faint"}`}>
      <p className="text-2xl font-black tabular-nums" style={{ color: t.fg }}>{n}</p>
      <p className="text-xs text-muted">{label}{of ? ` · ${Math.round((n / of) * 100)}% of ${of} person–practicals` : ""}</p>
    </button>
  );
}

function Cell({ c, onOpen }) {
  if (!c) return null;
  const s = STATUS[c.status], t = TONE[s.tone];
  const detail = c.status === "competent" || c.status === "due" ? (c.until ? `to ${fmt(c.until)}` : "no expiry")
    : c.status === "expired" ? `on ${fmt(c.until)}`
    : c.status === "failed" ? `${c.critical ? "critical error" : `score ${c.score ?? "—"}`}${c.attempts > 1 ? ` · ${c.attempts} tries` : ""}`
    : "";
  const body = (
    <>
      <span className="flex items-center gap-1 text-[12px] font-bold" style={{ color: t.fg }}>
        {c.critical && c.status === "failed" && <ShieldAlert size={12} />}{s.label}{c.status === "due" && c.days != null ? ` · ${c.days} d` : ""}
      </span>
      {detail && <span className="block text-[10.5px] text-muted">{detail}</span>}
    </>
  );
  const cls = "w-full text-left rounded-lg px-2.5 py-1.5 block";
  return c.session_id
    ? <button onClick={() => onOpen(c.session_id)} className={`${cls} hover:ring-1 hover:ring-brand`} style={{ background: t.bg }} title="Open the last exam">{body}</button>
    : <span className={cls} style={{ background: t.bg }}>{body}</span>;
}

function WeakCard({ w }) {
  return (
    <section className="card p-4" aria-label={w.title}>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3 className="font-bold text-content text-sm">{w.code}</h3>
        <span className="text-xs text-muted tabular-nums">{w.exams} exam{w.exams === 1 ? "" : "s"} · {w.passed} passed · {w.clean} clean</span>
      </div>
      {!w.exams ? <p className="text-xs text-faint">No exams taken yet.</p>
        : !w.items.length ? <p className="text-xs text-ok">Every exam so far was clean.</p> : (
        <ol className="flex flex-col gap-2.5">
          {w.items.map((it, i) => (
            <li key={i}>
              <div className="flex items-start justify-between gap-3 text-[13px]">
                <span className="min-w-0">
                  <b className={it.critical ? "text-danger" : "text-content"}>{it.step}</b>
                  {it.critical && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-danger">critical</span>}
                  <span className="block text-muted text-[12px] leading-snug">{it.text}</span>
                </span>
                <span className="text-xs tabular-nums text-muted whitespace-nowrap">{it.runs} of {w.exams}</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-2 mt-1 overflow-hidden" aria-hidden="true">
                <div className="h-full rounded-full" style={{ width: `${Math.max(3, it.pct)}%`, background: it.critical ? "rgb(var(--danger))" : "rgb(var(--warn))" }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
