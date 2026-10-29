import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowLeft, Award, Loader2, RotateCcw, ShieldAlert, Timer, CheckCircle2, XCircle } from "lucide-react";
import api from "../lib/api";
import { createBay, FIRST_VIEW } from "../practical/bay";
import Timeline from "../components/PracticalTimeline";
import FinalMark from "../components/FinalMark";

// The 3D practical. The server runs it: every click goes up as an action and a
// fresh view of the run comes back. This page draws that view and nothing else.

// The camera buttons for each room.
const VIEW_NAMES = {
  phlebotomy: [["patient", "Patient"], ["wide", "Bay"], ["bench", "Bench"], ["rack", "Tubes"]],
  reception: [["nurse", "Nurse"], ["counter", "Counter"], ["close", "Close-up"], ["phone", "Phone"]],
  chemistry: [["bench", "Bench"], ["analyser", "Analyser"], ["qc", "QC chart"], ["phone", "Phone"]],
  haematology: [["bench", "Bench"], ["analyser", "Analyser"], ["stain", "Stain"], ["scope", "Microscope"], ["phone", "Phone"]],
  bloodbank: [["phone", "Phone"], ["bench", "Bench"], ["tile", "Tile"], ["fridge", "Fridge"]],
  spill: [["room", "Room"], ["work", "Work"], ["kit", "Trolley"], ["spill", "Spill"], ["phone", "Phone"]],
};
// What a clean run means, in each room's words.
const CLEAN = {
  phlebotomy: "A clean draw: right patient, right tubes in the right order, labelled at the chair.",
  reception: "A clean check: every sample matched to its form, every fault caught with the right reason.",
  chemistry: "A clean call: checked before it left the lab, the right action for what the checks showed, and every word of the call where it should be.",
  haematology: "A clean call: checked and looked at under the microscope before it left the lab, the right action for what the film showed, and every word of the call where it should be.",
  bloodbank: "A clean issue: grouped, checked against the record, crossmatched, and handed over only when the slip, the label and the request agreed.",
  spill: "A clean clear-up: people first, the area kept clear, protected before you touched it, the right disinfectant left to work, no glass in a hand, and reported.",
};
const STAGE_LABEL = {
  reception: "The specimen reception counter in 3D. Click a sample to pick it up.",
  chemistry: "The chemistry bench in 3D. Click things to check them.",
  haematology: "The haematology bench in 3D. Click things to check or use them.",
  bloodbank: "The blood bank in 3D. Click things to check or use them.",
  spill: "The chemistry lab in 3D, with a blood spill on the floor and the spill trolley. Click things to use them.",
};
const initialsOf = (name) => name.replace(/\(.*\)/, "").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2);
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function PracticalPlayer() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const mode = params.get("mode") === "practice" ? "practice" : "exam";
  const navigate = useNavigate();
  const [run, setRun] = useState(null);          // { session_id, mode, view, rules, course }
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);        // { kind, msg }
  const [camera, setCamera] = useState(null);
  const [kind, setKind] = useState(null);        // which room: the scenario says
  const [selLabel, setSelLabel] = useState(null);
  const [tq, setTq] = useState(null);            // seconds the tourniquet has been on
  const stageRef = useRef(null), bayRef = useRef(null), runRef = useRef(null), tqBase = useRef(null), noteTimer = useRef(0);
  const taskRef = useRef(null), tubesRef = useRef(null), selRef = useRef(null);
  selRef.current = selLabel;
  const queue = useRef(Promise.resolve()), pending = useRef(0);

  const tell = useCallback((n) => {
    clearTimeout(noteTimer.current); setNote(n);
    if (n) noteTimer.current = setTimeout(() => setNote(null), n.kind === "info" ? 3000 : 6500);
  }, []);

  // Apply a fresh view from the server: the bay, the camera, the tourniquet clock.
  const apply = useCallback((r, prev) => {
    runRef.current = r;
    setRun(r);
    const v = r.view, bay = bayRef.current;
    setKind(v.scenario.bay || "phlebotomy");
    bay?.sync(v);
    const was = prev?.view, speaker = v.current?.speaker || v.patient.name, anchor = v.current?.anchor || null;
    if (!was || was.current?.id !== v.current?.id) {
      if (v.current) setTimeout(() => bay?.setView(v.current.view), was ? 450 : 0);
      // On a phone the bay and the answers can't both fit: when the equipment is
      // needed, bring the bay back into view.
      if (was && ["seq", "draw", "inspect", "check"].includes(v.current?.type) && matchMedia("(max-width: 1023px)").matches)
        stageRef.current?.parentElement?.scrollIntoView({ behavior: "smooth", block: "start" });
      // ...and for labelling, the labels.
      if (was && v.current?.type === "label" && matchMedia("(max-width: 1023px)").matches)
        setTimeout(() => taskRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      if (v.current?.say) bay?.say(v.current.say, "patient", speaker, anchor);
    }
    // What you said, then the answer a moment later, as bubbles in the bay.
    if (v.current?.picked && !was?.current?.picked) {
      bay?.say(v.current.picked.text, "you");
      setTimeout(() => bay?.say(v.current.picked.reply, "patient", speaker, anchor), 1100);
    }
    if (v.current?.id === "draw" && v.flags.needle && !was?.flags?.needle) setTimeout(() => bay?.setView("rack"), 500);
    // A new finding shows below the bay; on a phone that is off-screen, so say so.
    const nf = v.findings?.length || 0;
    if (was && nf > (was.findings?.length || 0) && matchMedia("(max-width: 1023px)").matches)
      tell({ kind: "info", msg: `${v.findings[nf - 1].title}: checked. What it shows is below the bay.` });
    tqBase.current = v.tq_elapsed == null ? null : { at: performance.now(), s: v.tq_elapsed };
    setTq(v.tq_elapsed);
  }, []);

  const begin = useCallback(async () => {
    setResult(null); setSelLabel(null); tell(null);
    try {
      const r = await api(`learn/courses/${id}/practical/start`, { method: "POST", body: JSON.stringify({ mode }) });
      apply(r, null);
    } catch (e) { toast.error(e.message); navigate(`/learn/${id}`); }
  }, [id, mode, apply, navigate, tell]);

  // The room is built once the first run says which one it is, and lives as long
  // as the page; runs come and go inside it.
  useEffect(() => {
    if (!kind) return undefined;
    const bay = createBay(stageRef.current, { kind, onPick: pick, onView: setCamera });
    bayRef.current = bay;
    setCamera(FIRST_VIEW[kind]);
    const v = runRef.current?.view;
    if (v) {
      bay.sync(v);
      if (v.current) bay.setView(v.current.view);
      if (v.current?.say) bay.say(v.current.say, "patient", v.current.speaker || v.patient.name, v.current.anchor);
    }
    return () => { bay.dispose(); bayRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);
  useEffect(() => { begin(); }, [begin]);

  // No scroll anchoring while the room is open: a finding added to the panel
  // below must not scroll the room away from under the pointer.
  useEffect(() => {
    const els = [document.documentElement, document.body];
    els.forEach((e) => { e.style.overflowAnchor = "none"; });
    return () => els.forEach((e) => { e.style.overflowAnchor = ""; });
  }, []);

  // Clicks queue up and go to the server one at a time, in the order they were
  // made: a quick second click is neither lost nor applied out of turn.
  // While labelling, a filled tube in the rack takes the label in hand, the same
  // as its button below the bay.
  function pick(obj) {
    const v = runRef.current?.view;
    if (v?.current?.type === "label" && v.patient.tubes.includes(obj) && v.drawn.includes(obj) && !v.labelled[obj]) {
      if (!selRef.current) return tell({ kind: "info", msg: "Pick a label first (below the bay), then tap this tube." });
      return labelTube(obj);
    }
    send({ type: "pick", id: obj });
  }
  function labelTube(t) {
    if (!selRef.current) return tell({ kind: "info", msg: "Pick a label first, then the tube." });
    send({ type: "label", label: selRef.current, tube: t }).then(() => setSelLabel(null));
  }
  function chooseLabel(id) {
    const on = selRef.current !== id;
    setSelLabel(on ? id : null);
    if (on && matchMedia("(max-width: 1023px)").matches) setTimeout(() => tubesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  function send(action) {
    pending.current++; setBusy(true);
    const p = queue.current.then(() => sendNow(action)).finally(() => { if (--pending.current === 0) setBusy(false); });
    queue.current = p.catch(() => {});
    return p;
  }
  async function sendNow(action) {
    const r = runRef.current;
    if (!r || r.view.done) return;
    try {
      const out = await api(`learn/practical/${r.session_id}/act`, { method: "POST", body: JSON.stringify({ action }) });
      const next = { ...r, view: out.view };
      apply(next, r);
      const fb = out.feedback || [];
      const worst = fb.find((f) => f.kind === "crit") || fb.find((f) => f.kind === "warn") || fb[0];
      if (worst) tell(worst);
      if (out.result) setTimeout(() => setResult(out.result), 900);
    } catch (e) { tell({ kind: "info", msg: e.message }); }
  }

  // The tourniquet clock counts on from the server's figure between actions.
  useEffect(() => {
    if (tq == null) return;
    const t = setInterval(() => { const b = tqBase.current; if (b) setTq(b.s + (performance.now() - b.at) / 1000); }, 500);
    return () => clearInterval(t);
  }, [tq == null]); // eslint-disable-line react-hooks/exhaustive-deps

  const v = run?.view, cur = v?.current;
  const initials = v ? initialsOf(cur?.speaker || v.patient.name) : "";

  return (
    <div className="min-h-screen bg-bg text-content flex flex-col">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-6 py-3 border-b border-line">
        <button onClick={() => navigate(`/learn/${id}`)} className="flex items-center gap-1.5 text-sm text-muted hover:text-content">
          <ArrowLeft size={16} /> Course
        </button>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-faint">{v?.scenario.title || "3D practical"}</p>
          <p className="text-sm font-bold truncate">{run?.course?.title}</p>
        </div>
        <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${mode === "exam" ? "bg-brand text-brand-fg" : "bg-surface-2 text-muted border border-line"}`}>
          {mode === "exam" ? "Exam · feedback at the end" : "Practice · feedback as you go"}
        </span>
        {v && (
          <ol className="flex gap-1 overflow-x-auto flex-1 min-w-0 justify-end" aria-label="Steps">
            {v.steps.map((s, i) => {
              const on = !v.done && i === v.step, done = v.done || i < v.step;
              return (
                <li key={s} aria-current={on ? "step" : undefined}
                  className={`flex items-center gap-1.5 whitespace-nowrap text-xs rounded-full border px-2 py-1 ${on ? "border-brand text-content font-bold" : "border-line text-faint"}`}>
                  <span className={`w-4 h-4 rounded-full grid place-items-center text-[10px] ${on ? "bg-brand text-brand-fg" : done ? "bg-brand/15 text-brand" : "bg-surface-2"}`}>{done ? "✓" : i + 1}</span>
                  {s}
                </li>
              );
            })}
          </ol>
        )}
      </header>

      <main className="flex-1 grid lg:grid-cols-[minmax(0,1fr)_340px] gap-4 p-4 sm:p-6 min-h-0">
        <section className="flex flex-col gap-4 min-w-0">
          {/* A fixed height: as the panel below grows, the room must not resize and shift under the pointer. */}
          <div className="relative rounded-2xl overflow-hidden border border-line h-[52vh] lg:h-[62vh] lg:min-h-[420px] lg:max-h-[680px] shrink-0" style={{ background: "#dbe4e2" }}>
            <div ref={stageRef} className="absolute inset-0" aria-label={STAGE_LABEL[kind] || "The phlebotomy bay in 3D. Click equipment to use it."} />
            <div className="absolute top-2.5 right-2.5 flex gap-0.5 p-1 rounded-xl z-10" style={{ background: "rgba(16,28,30,.78)" }} role="group" aria-label="Camera">
              {(VIEW_NAMES[kind] || []).map(([k, label]) => (
                <button key={k} onClick={() => bayRef.current?.setView(k)} aria-pressed={camera === k} disabled={k === "close" && !v?.selected}
                  className="text-xs px-2.5 py-1 rounded-lg disabled:opacity-40" style={camera === k ? { background: "#e5f1ef", color: "#0f2a2c", fontWeight: 700 } : { color: "#e5f1ef" }}>
                  {label}
                </button>
              ))}
            </div>
            {tq != null && (
              <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 text-xs font-bold tabular-nums text-white px-2.5 py-1.5 rounded-full"
                style={{ background: tq > v.tq_limit ? "#b3261e" : tq > v.tq_limit - 15 ? "#b06a12" : "rgba(16,28,30,.85)" }}>
                <Timer size={13} /> Tourniquet on · {mmss(tq)}
              </div>
            )}
            {note && (
              <div role="status" className="fixed lg:absolute left-3 right-3 bottom-3 lg:left-2.5 lg:right-2.5 lg:bottom-2.5 z-30 lg:z-10 mx-auto lg:mx-0 max-w-xl pointer-events-none text-[13px] text-white px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(16,28,30,.93)", borderLeft: `4px solid ${note.kind === "crit" ? "#ff6b5f" : note.kind === "warn" ? "#f0a55c" : "#45bfbd"}` }}>
                {note.kind !== "info" && <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-0.5">{note.kind === "crit" ? "Critical error" : "Points lost"}</p>}
                {note.msg}
              </div>
            )}
            {busy && <Loader2 className="absolute bottom-3 right-3 z-10 animate-spin text-white/80" size={18} />}
          </div>

          <div ref={taskRef} className="card p-4 sm:p-5 flex flex-col gap-3 scroll-mt-3" aria-live="polite">
            {!v ? <Loader2 className="animate-spin text-muted" /> : cur ? (
              <>
                <div className="flex justify-between text-[11px] uppercase tracking-widest text-faint">
                  <span>Step {v.step + 1} of {v.steps.length}</span>
                </div>
                <h2 className="text-lg font-bold">{cur.name}</h2>
                {cur.type === "talk" && (
                  <>
                    {cur.say ? <Say who={cur.speaker || v.patient.name} initials={cur.anchor === "phone" ? "Tel" : initials} text={cur.say} /> : <p className="text-sm text-muted">The patient has gone.</p>}
                    {cur.choices ? (
                      <>
                        <p className="text-xs text-muted">What do you say?</p>
                        <div className="flex flex-col gap-2">
                          {cur.choices.map((c, i) => (
                            <button key={c.id} disabled={busy} onClick={() => send({ type: "say", choice: c.id })}
                              className="grid grid-cols-[24px_1fr] gap-2.5 items-start text-left text-sm rounded-xl border border-line px-3 py-2.5 hover:border-brand transition disabled:opacity-60">
                              <span className="w-6 h-6 rounded-md grid place-items-center text-[11px] font-bold bg-surface-2">{"ABCD"[i]}</span>
                              <span>{c.text}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : cur.picked && (
                      <>
                        <Say who="You" initials="You" text={cur.picked.text} me />
                        <Say who={cur.speaker || v.patient.name} initials={cur.anchor === "phone" ? "Tel" : initials} text={cur.picked.reply} />
                        {cur.picked.leaves && <p className="text-xs text-muted">{v.patient.name} picks up {v.patient.female ? "her" : "his"} bag and leaves.</p>}
                        <button autoFocus disabled={busy} onClick={() => send({ type: "continue" })} className="btn-brand self-start">Continue</button>
                      </>
                    )}
                  </>
                )}
                {(cur.type === "seq" || cur.type === "draw") && (
                  <>
                    <p className="text-[15px]">{cur.task}</p>
                    <p className="text-xs text-muted">Click equipment in the bay to use it. Hover to see what something is; on a phone, tap once to name it and again to use it.</p>
                  </>
                )}
                {cur.type === "inspect" && <Inspect v={v} task={cur.task} busy={busy} send={send} />}
                {cur.type === "check" && (
                  <>
                    <p className="text-[15px]">{cur.task}</p>
                    {cur.clues ? (
                      <div className="flex flex-wrap gap-2">
                        {cur.clues.map((c) => (
                          <button key={c.id} disabled={busy} aria-pressed={v.findings?.some((f) => f.id === c.id)} onClick={() => send({ type: "pick", id: c.id })}
                            className="rounded-xl border border-line px-3 py-2 text-sm hover:border-brand aria-pressed:border-brand aria-pressed:bg-brand/10 disabled:opacity-60">{c.name}</button>
                        ))}
                      </div>
                    ) : <p className="text-xs text-muted">Click things in the bay to check them; what each one shows appears here. On a phone, tap once to name it and again to check it.</p>}
                    <Findings items={v.findings} />
                    <button disabled={busy} onClick={() => send({ type: "continue" })} className="btn-brand self-start">{cur.doneText || "I've checked: decide"}</button>
                  </>
                )}
                {cur.type === "label" && (
                  <>
                    <p className="text-[15px]">{cur.task}</p>
                    {v.flags.gone && <p className="text-xs text-muted">The patient has already gone, so there is no one to check the labels against. Finish anyway to see your record.</p>}
                    <p className="text-xs text-muted">Printed labels: tap one to pick it up</p>
                    <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
                      {v.labels.map((L) => (
                        <button key={L.id} disabled={L.used || busy} aria-pressed={selLabel === L.id}
                          onClick={() => chooseLabel(L.id)}
                          className={`text-left rounded-md px-2.5 py-2 font-mono text-[11.5px] leading-snug flex flex-col disabled:opacity-35 ${selLabel === L.id ? "ring-2 ring-brand" : ""}`}
                          style={{ background: "#ffffff", color: "#1f2522", border: "1px solid #cfc6ad" }}>
                          <b className="text-[12.5px]">{L.name}</b>
                          <span>DOB {L.dob}</span><span>{L.lab}</span><span>{L.short} · {L.test}</span>
                          <span className="h-4 mt-1" style={{ background: "repeating-linear-gradient(90deg,#1f2522 0 2px,transparent 2px 3px,#1f2522 3px 4px,transparent 4px 7px,#1f2522 7px 10px,transparent 10px 11px)" }} />
                        </button>
                      ))}
                    </div>
                    {(() => { const L = v.labels.find((l) => l.id === selLabel); return (
                      <p className={L ? "text-sm font-bold" : "text-xs text-muted"}>{L ? `Now tap the tube for the ${L.test} label: here, or in the rack.` : "Your filled tubes"}</p>
                    ); })()}
                    <div ref={tubesRef} className="flex flex-wrap gap-2">
                      {v.patient.tubes.map((t) => {
                        const done = v.labelled[t];
                        return (
                          <button key={t} disabled={done || busy}
                            onClick={() => labelTube(t)}
                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${done ? "border-ok" : "border-dashed border-line bg-surface-2"}`}>
                            <span className="w-3 h-5 rounded-sm" style={{ background: v.tubes[t].cap, boxShadow: "inset 0 -9px 0 #7a1f1f" }} />
                            {v.tubes[t].name} tube {done && <span className="text-[11px] font-bold text-ok">Labelled</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            ) : <p className="text-sm text-muted">Practical finished.</p>}
          </div>
        </section>

        <aside className="flex flex-col gap-4 min-w-0">
          {v && !v.samples && kind !== "spill" && <RequestForm form={{ ...v.patient, dob: `${v.patient.dob}  (${v.patient.age} y)` }} />}
          {v && kind === "phlebotomy" && <AtTheChair v={v} />}
          {v && kind === "spill" && <AtTheSpill v={v} />}
          {v?.findings?.length > 0 && cur?.type !== "check" && (
            <div className="card p-4 flex flex-col gap-3"><p className="text-sm font-bold">What you checked</p><Findings items={v.findings} /></div>
          )}
          {v?.samples && <SampleForm v={v} />}
          {v?.samples && <AtTheCounter v={v} />}
        </aside>
      </main>

      {result && v && (
        <Result result={result} mode={mode} v={v}
          onAgain={(m) => navigate(`/learn/${id}/practical?mode=${m}`, { replace: true })}
          onRestart={begin}
          onCourse={() => navigate(`/learn/${id}`)}
          onCertificate={(serial) => navigate(`/learn/certificate/${serial}`)} />
      )}
    </div>
  );
}

// What the checks showed: plain notes, a results table, or a QC chart.
function Findings({ items }) {
  if (!items?.length) return <p className="text-xs text-faint">Nothing checked yet.</p>;
  return (
    <div className="flex flex-col gap-3">
      {items.map((f) => (
        <div key={f.id} className="rounded-xl border border-line p-3 flex flex-col gap-1.5">
          <p className="text-[11px] uppercase tracking-wider text-faint">{f.title}</p>
          {f.type === "text" && f.lines.map((l, i) => <p key={i} className="text-sm">{l}</p>)}
          {f.type === "table" && (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] tabular-nums">
                <thead><tr>{f.head.map((h, i) => <th key={i} className="text-left font-semibold text-muted text-[11px] uppercase tracking-wider pr-3 pb-1">{h}</th>)}</tr></thead>
                <tbody>
                  {f.rows.map((r, i) => (
                    <tr key={i} className="border-t border-line">
                      {r.map((c, j) => (
                        <td key={j} className={`py-1 pr-3 ${j === 0 ? "" : "font-mono"} ${c === "CRITICAL" ? "text-danger font-bold" : c === "H" || c === "L" ? "text-warn font-bold" : ""}`}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {f.type === "field" && <FilmField f={f} />}
          {f.type === "tile" && <GroupTile f={f} />}
          {f.type === "qc" && (
            <>
              {f.levels.map((L) => <QcChart key={L.name} level={L} />)}
              <p className="text-xs text-muted">{f.note}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// A grouping tile: a well per reagent. Where the cells react they clump into
// dark red grains on a clear ground; where they don't, the well stays an even
// pink. Forward grouping on the left, reverse on the right.
function GroupTile({ f }) {
  const W = 92;
  const well = (w, i) => {
    let a = (w.seed + 1) * 2654435761 >>> 0;
    const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const cx = W / 2, cy = W / 2, r = 34;
    const grains = w.agg ? Array.from({ length: 22 }, () => { const ang = rnd() * 6.3, d = rnd() * (r - 8); return [cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, 2.5 + rnd() * 5]; }) : [];
    return (
      <figure key={i} className="m-0 flex flex-col items-center gap-1">
        <svg viewBox={`0 0 ${W} ${W}`} className="w-[72px] h-[72px]" role="img" aria-label={`${w.name}: ${w.agg ? "clumped" : "no clumps"}`}>
          <circle cx={cx} cy={cy} r={r + 4} fill="#fbfbf8" stroke="#cfd6da" />
          <circle cx={cx} cy={cy} r={r} fill={w.agg ? "#f6e3e1" : "#e3949b"} />
          {grains.map(([x, y, s], k) => <circle key={k} cx={x} cy={y} r={s} fill="#8d1420" />)}
        </svg>
        <figcaption className="text-[11px] text-muted">{w.name}</figcaption>
      </figure>
    );
  };
  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-2 rounded-xl border border-line px-2 py-2"><span className="sr-only">Forward grouping</span>{f.wells.slice(0, 3).map(well)}</div>
        <div className="flex gap-2 rounded-xl border border-line px-2 py-2"><span className="sr-only">Reverse grouping</span>{f.wells.slice(3).map((w, i) => well(w, i + 3))}</div>
      </div>
      <p className="text-xs text-muted mt-2">{f.note}</p>
    </div>
  );
}

// A field of a stained blood film under oil, drawn from the numbers the server
// sends: red cells, the odd white cell, single platelets, clumps and fibrin.
// The same seed draws the same field every time.
function FilmField({ f }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current, c = cv.getContext("2d"), W = 320, R = W / 2;
    let a = f.seed * 2654435761 >>> 0;
    const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const feather = /Feather/.test(f.title);
    c.clearRect(0, 0, W, W); c.save();
    c.beginPath(); c.arc(R, R, R - 2, 0, 7); c.clip();
    c.fillStyle = f.kind === "thick" ? "#ece4ef" : "#f4eeea"; c.fillRect(0, 0, W, W);
    const dot = (x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
    // Malaria: a ring form is a thin blue ring of cytoplasm with a red chromatin
    // dot; a P. falciparum gametocyte is a banana-shaped crescent.
    const ring = (x, y, r = 4.2) => {
      c.strokeStyle = "#3b5bb5"; c.lineWidth = 1.6; c.beginPath(); c.arc(x, y, r, 0.4, 6.0); c.stroke();
      dot(x + r * Math.cos(0.2), y + r * Math.sin(0.2), 1.9, "#b3123c");
    };
    const banana = (x, y, a) => {
      c.save(); c.translate(x, y); c.rotate(a);
      c.fillStyle = "#6f4ba8"; c.beginPath(); c.ellipse(0, 0, 13, 4.6, 0, 0, 7); c.fill();
      dot(0, 0, 2.6, "#b3123c"); c.restore();
    };
    if (f.kind === "thick") {
      // A thick film: the red cells are lysed, leaving a pale ground, white-cell
      // nuclei, a few platelets, and any parasites.
      for (let i = 0; i < 40; i++) dot(rnd() * W, rnd() * W, 6 + rnd() * 10, "rgba(214,190,214,.35)");
      for (let i = 0; i < (f.wbc || 0); i++) {
        const x = 50 + rnd() * 220, y = 50 + rnd() * 220;
        for (let k = 0; k < 3; k++) dot(x - 7 + k * 7, y + (k % 2 ? 4 : -4), 6, "#5b2a86");
      }
      for (let i = 0; i < 14; i++) dot(20 + rnd() * 280, 20 + rnd() * 280, 1.8, "#8d5aa8");
      for (let i = 0; i < (f.rings || 0); i++) ring(16 + rnd() * 288, 16 + rnd() * 288, 3.2 + rnd() * 1.2);
      for (let i = 0; i < (f.gams || 0); i++) banana(60 + rnd() * 200, 60 + rnd() * 200, rnd() * 3);
      c.restore();
      c.strokeStyle = "#1a1d1f"; c.lineWidth = 4; c.beginPath(); c.arc(R, R, R - 2, 0, 7); c.stroke();
      return;
    }
    // red cells: touching in the body, sparse and without pallor at the feathered edge
    const cells = [];
    for (let i = 0; i < (feather ? 34 : 95); i++) {
      const x = rnd() * W, y = rnd() * W, r = 12 + rnd() * 3;
      dot(x, y, r, feather ? "#e49aa2" : "#e8a6ac");
      if (!feather) dot(x, y, r * 0.42, "#f6d9dc");
      cells.push([x, y, r]);
    }
    // Parasites inside red cells (thin film): rings, two or more to a cell when
    // the density is high, and the odd gametocyte stretched across a cell.
    for (let i = 0; i < (f.rings || 0); i++) {
      const [x, y, r] = cells[Math.floor(rnd() * cells.length)];
      ring(x - r * 0.35, y - r * 0.2);
      if (f.multi && rnd() < 0.6) ring(x + r * 0.35, y + r * 0.3, 3.6);
    }
    for (let i = 0; i < (f.gams || 0); i++) { const [x, y] = cells[Math.floor(rnd() * cells.length)]; banana(x, y, rnd() * 3); }
    for (let i = 0; i < (f.fibrin || 0); i++) {      // fibrin strands
      c.strokeStyle = "rgba(140,80,165,.9)"; c.lineWidth = 2.2; c.beginPath();
      let x = rnd() * W, y = rnd() * W; c.moveTo(x, y);
      for (let k = 0; k < 12; k++) { x += (rnd() - 0.3) * 34; y += (rnd() - 0.5) * 26; c.lineTo(x, y); }
      c.stroke();
    }
    if (rnd() < 0.6) {                               // a neutrophil, now and then
      const x = 60 + rnd() * 200, y = 60 + rnd() * 200;
      dot(x, y, 21, "#dccbe6");
      for (let k = 0; k < 3; k++) dot(x - 8 + k * 8, y + (k % 2 ? 4 : -4), 6.5, "#5b2a86");
    }
    const plt = (x, y, r = 2.6) => { dot(x, y, r, "#7d3c98"); dot(x + r * 0.3, y - r * 0.2, r * 0.45, "#a46cbf"); };
    for (let i = 0; i < (f.singles || 0); i++) plt(30 + rnd() * 260, 30 + rnd() * 260, 2.2 + rnd() * 1.2);
    for (let i = 0; i < (f.giant || 0); i++) plt(60 + rnd() * 200, 60 + rnd() * 200, 6.5);
    for (let i = 0; i < (f.clumps || 0); i++) {             // clumps: a dozen or more platelets heaped together
      const cx = 40 + rnd() * 240, cy = 40 + rnd() * 240, n = 10 + Math.floor(rnd() * 16);
      dot(cx, cy, 11 + n * 0.5, "rgba(186,140,200,.35)");
      for (let k = 0; k < n; k++) { const ang = rnd() * 7, d = rnd() * (6 + n * 0.45); plt(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d, 2.2 + rnd()); }
    }
    c.restore();
    c.strokeStyle = "#1a1d1f"; c.lineWidth = 4; c.beginPath(); c.arc(R, R, R - 2, 0, 7); c.stroke();
  }, [f]);
  return <canvas ref={ref} width="320" height="320" className="w-full max-w-[300px] aspect-square rounded-full bg-black" role="img" aria-label={`${f.title}: a stained blood film under the microscope`} />;
}

// A Levey-Jennings chart: the target, ±2 SD (warning) and ±3 SD (reject).
function QcChart({ level: L }) {
  const w = 300, h = 96, mid = h / 2, sd = 12, x = (i) => 30 + i * ((w - 40) / Math.max(1, L.points.length - 1)), y = (p) => mid - Math.max(-3.8, Math.min(3.8, p)) * sd;
  return (
    <div>
      <p className="text-xs flex justify-between gap-2"><span>{L.name}</span><span className="font-mono">last: {L.last}</span></p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[340px]" role="img" aria-label={`${L.name}: points in SD units, last ${L.points[L.points.length - 1]} SD`}>
        {[[3, "rgb(var(--danger))"], [2, "rgb(var(--warn))"], [0, "currentColor"], [-2, "rgb(var(--warn))"], [-3, "rgb(var(--danger))"]].map(([s, col]) => (
          <g key={s}>
            <line x1="26" x2={w - 6} y1={y(s)} y2={y(s)} stroke={col} strokeOpacity={s ? 0.7 : 0.35} strokeDasharray={Math.abs(s) === 2 ? "4 3" : undefined} />
            <text x="0" y={y(s) + 3.5} fontSize="9" fill="currentColor" opacity=".6">{s > 0 ? `+${s}` : s === 0 ? "0" : s}</text>
          </g>
        ))}
        <polyline fill="none" stroke="rgb(var(--brand))" strokeWidth="1.5" points={L.points.map((p, i) => `${x(i)},${y(p)}`).join(" ")} />
        {L.points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p)} r={Math.abs(p) > 3 ? 4.5 : 3} fill={Math.abs(p) > 3 ? "rgb(var(--danger))" : "rgb(var(--brand))"} />)}
      </svg>
    </div>
  );
}

function Say({ who, initials, text, me }) {
  return (
    <div className="grid grid-cols-[34px_1fr] gap-2.5 items-start">
      <span className={`w-[34px] h-[34px] rounded-full grid place-items-center text-[11px] font-bold ${me ? "bg-brand text-brand-fg" : "bg-surface-2 border border-line"}`}>{initials}</span>
      <div className={`rounded-xl rounded-tl-sm px-3 py-2 text-sm ${me ? "bg-brand/10" : "bg-surface-2"}`}>
        <span className="block text-[11px] text-muted">{who}</span>{text}
      </div>
    </div>
  );
}

// The doctor's request, on paper: the thing everything gets checked against.
function RequestForm({ form: P }) {
  const hand = { fontFamily: '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive', color: "#1d3f8f" };
  const all = P.formTests || ["FBC", "ESR", "FBG", "RBS", "HbA1c", "U&E", "LFT", "Lipids", "PT/INR", "APTT", "Malaria RDT", "HBsAg"];
  return (
    <div className="rounded-md px-4 py-3 text-[12.5px] shadow-card" style={{ background: "#fffdf5", color: "#1f2522", border: "1px solid #cfc6ad" }}>
      <div className="flex justify-between items-baseline gap-2 pb-1.5 mb-2" style={{ borderBottom: "2px solid #1f2522" }}>
        <b className="text-sm">Laboratory request</b><span className="text-[10px] uppercase tracking-widest">{P.clinic}</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 items-baseline">
        {[["Patient", P.name], ["Date of birth", P.dob], ["Sex", P.sex], ["Lab no.", P.lab], ["Requested by", P.doctor]].map(([k, val]) => (
          <React.Fragment key={k}>
            <dt className="text-[10px] uppercase tracking-wider opacity-70">{k}</dt>
            <dd className="m-0 text-[14px]" style={{ ...hand, borderBottom: "1px dotted #cfc6ad" }}>{val}</dd>
          </React.Fragment>
        ))}
      </dl>
      <p className="mt-3 mb-1 text-[10px] uppercase tracking-widest font-bold">Tests requested</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {all.map((t) => (
          <span key={t} className="flex items-center gap-1.5 text-xs">
            <i className="not-italic w-3 h-3 grid place-items-center leading-none" style={{ border: "1.5px solid #1f2522", ...hand, fontSize: 14 }}>{P.ticks.includes(t) ? "✓" : ""}</i>{t}
          </span>
        ))}
      </div>
      <p className="mt-3 mb-1 text-[10px] uppercase tracking-widest font-bold">Clinical notes</p>
      <p className="m-0 text-[14px] leading-snug" style={hand}>{P.notes}</p>
    </div>
  );
}

function AtTheChair({ v }) {
  const f = v.flags, items = [];
  if (f.hands) items.push(["Hands cleaned"]); if (f.gloves) items.push(["Gloves on"]);
  if (f.tq) items.push(["Tourniquet on"]); else if (f.tqDone) items.push(["Tourniquet released", true]);
  if (f.swabbed) items.push(["Site cleaned"]); if (f.needle) items.push(["Needle in the vein"]);
  for (const t of v.drawn) items.push([`${v.tubes[t].name} tube filled${v.labelled[t] ? ", labelled" : ""}`]);
  if (f.sharps) items.push(["Needle in the sharps bin"]); if (f.gauze) items.push(["Gauze on the site"]);
  if (f.gone) items.push(["Patient has left", true]);
  return (
    <div className="card p-4">
      <h3 className="text-sm font-bold mb-2">At the chair</h3>
      {items.length ? (
        <ul className="flex flex-col gap-1 text-[13px]">
          {items.map(([t, off]) => <li key={t} className="flex items-center gap-2"><span className={`w-1.5 h-1.5 rounded-full ${off ? "bg-faint" : "bg-ok"}`} />{t}</li>)}
        </ul>
      ) : <p className="text-xs text-muted">Nothing done yet. What you do shows up here.</p>}
    </div>
  );
}

// The clear-up so far, from what has been used. The second disinfectant is the wipe-down.
const SPILL_DONE = { sign: "Sign out by the spill", spillkit: "Spill kit open", gloves: "Gloves on", apron: "Apron on", goggles: "Eye protection on",
  paper: "Spill covered with paper", forceps: "Glass picked up with forceps", sharps: "Glass in the sharps bin", biobag: "Waste in the clinical-waste bag", sink: "Hands washed" };
function AtTheSpill({ v }) {
  const items = []; let wet = 0;
  for (const k of v.specimen?.used || []) items.push(k === "bleach" ? (wet++ ? "Area wiped again with disinfectant" : "Disinfectant poured over the paper") : SPILL_DONE[k]);
  return (
    <div className="card p-4">
      <h3 className="text-sm font-bold mb-2">At the spill</h3>
      {items.length ? (
        <ul className="flex flex-col gap-1 text-[13px]">
          {items.map((t) => <li key={t} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-ok" />{t}</li>)}
        </ul>
      ) : <p className="text-xs text-muted">Nothing done yet. What you do shows up here.</p>}
    </div>
  );
}

// Reception: pick a sample up, compare its label with its form, look at the tube
// in the bay, then accept it or reject it with the reason ELIMS records.
function Inspect({ v, task, busy, send }) {
  const [reason, setReason] = useState("");
  const sel = v.samples.find((x) => x.id === v.selected);
  useEffect(() => setReason(""), [v.selected]);
  const surnameFirst = (n) => n.split(" ").reverse().join(", ").replace(/^(\S+)/, (m) => m.toUpperCase());
  return (
    <>
      <p className="text-[15px]">{task}</p>
      <div className="flex flex-wrap gap-2">
        {v.samples.map((x) => (
          <button key={x.id} disabled={busy || !!x.decision} aria-pressed={v.selected === x.id}
            onClick={() => send({ type: "inspect", sample: x.id })}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-left disabled:opacity-60 ${v.selected === x.id ? "border-brand ring-1 ring-brand" : "border-line hover:border-faint"}`}>
            <span className="w-3 h-5 rounded-sm flex-shrink-0" style={{ background: x.cap }} />
            <span>
              Sample {x.n}{x.urgent && <b className="ml-1.5 text-[10px] uppercase tracking-wider text-danger">urgent</b>}
              <span className="block text-[11px] text-muted">
                {x.decision ? (x.decision.verdict === "accept" ? "Accepted" : `Rejected: ${x.decision.reason}`) : x.inspected ? "Picked up, not decided" : "Not checked yet"}
              </span>
            </span>
          </button>
        ))}
      </div>
      {sel ? (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-line p-3">
            <p className="text-[11px] uppercase tracking-wider text-faint mb-1.5">Label on sample {sel.n}</p>
            {sel.label ? (
              <div className="rounded-md px-2.5 py-2 font-mono text-[12px] leading-snug" style={{ background: "#ffffff", color: "#1f2522", border: "1px solid #cfc6ad" }}>
                <b className="text-[13px]">{surnameFirst(sel.label.name)}</b>
                <span className="block">DOB {sel.label.dob}</span><span className="block">{sel.label.lab}</span><span className="block">{sel.label.test}</span>
              </div>
            ) : <p className="text-sm font-bold text-danger">There is no label on this tube.</p>}
            <p className="text-[11px] text-muted mt-2">
              {sel.tubeName} tube. Its request form is on the right. In the bay, look at the tube itself: the colour of the serum, any clot, how full it is, and whether it has leaked.
            </p>
          </div>
          <div className="rounded-xl border border-line p-3 flex flex-col gap-2">
            <p className="text-[11px] uppercase tracking-wider text-faint">Your decision on sample {sel.n}</p>
            <button className="btn-brand" disabled={busy} onClick={() => send({ type: "decide", sample: sel.id, verdict: "accept" })}>Accept it</button>
            <label htmlFor="reject-reason" className="text-xs text-muted mt-1">or reject it, with the reason ELIMS will record:</label>
            <select id="reject-reason" className="input text-sm" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">Choose a reason…</option>
              {v.reasons.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button className="btn-ghost text-danger disabled:opacity-50" disabled={busy || !reason}
              onClick={() => send({ type: "decide", sample: sel.id, verdict: "reject", reason })}>Reject it</button>
          </div>
        </div>
      ) : <p className="text-xs text-muted">Click a sample in the bay, or one of the buttons above, to pick it up and look at it.</p>}
    </>
  );
}

// The request form for the sample in your hand.
function SampleForm({ v }) {
  const sel = v.samples.find((x) => x.id === v.selected);
  if (!sel) return (
    <div className="card p-4 text-sm text-muted">
      <p className="font-bold text-content mb-1">Request forms</p>
      {v.current?.type === "inspect" ? "Pick up a sample to see its request form here." : `${v.samples.length} samples from ${v.patient.ward}, each with its own form.`}
    </div>
  );
  return <RequestForm form={{ ...sel.form, clinic: sel.form.ward }} />;
}

function AtTheCounter({ v }) {
  return (
    <div className="card p-4">
      <h3 className="text-sm font-bold mb-2">At the counter</h3>
      <ul className="flex flex-col gap-1.5 text-[13px]">
        {v.samples.map((x) => (
          <li key={x.id} className="flex items-center gap-2">
            <span className="w-2.5 h-4 rounded-sm flex-shrink-0" style={{ background: x.cap }} />
            <span className="flex-1">Sample {x.n} · {x.form.test}{x.urgent ? " · urgent" : ""}</span>
            <span className={`text-[11px] font-semibold ${x.decision ? (x.decision.verdict === "accept" ? "text-ok" : "text-danger") : "text-faint"}`}>
              {x.decision ? (x.decision.verdict === "accept" ? "Accepted" : "Rejected") : "Waiting"}
            </span>
          </li>
        ))}
      </ul>
      {v.flags.gone && <p className="text-[11px] text-faint mt-2">The nurse has gone back to the ward.</p>}
    </div>
  );
}

function Result({ result, mode, v, onAgain, onRestart, onCourse, onCertificate }) {
  const passed = mode === "exam" ? result.passed : result.would_pass;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" style={{ background: "rgba(6,14,14,.6)" }}>
      <div role="dialog" aria-labelledby="practical-verdict" className="card w-full max-w-2xl max-h-[calc(100vh-32px)] overflow-y-auto p-6 flex flex-col gap-4">
        <p className="text-xs text-muted">{v.scenario.bay === "spill" ? "Blood spill, chemistry lab" : v.samples ? `${v.samples.length} samples from ${v.patient.ward}` : `${v.patient.name} · ${v.patient.tests.join(" + ")}`} · {mmss(v.elapsed)} taken{mode === "practice" ? " · practice run" : ""}</p>
        <div className="flex items-center gap-3 flex-wrap">
          {passed ? <CheckCircle2 className="text-ok" size={30} /> : <XCircle className="text-danger" size={30} />}
          <h2 id="practical-verdict" className={`text-3xl font-black ${passed ? "text-ok" : "text-danger"}`}>
            {mode === "exam" ? (passed ? "Passed" : "Not passed") : (passed ? "That would pass" : "That would not pass")}
          </h2>
        </div>
        {result.grading && <FinalMark g={result.grading} />}
        {result.crits.length > 0 && (
          <div className="rounded-xl p-3.5" style={{ background: "rgb(var(--danger) / 0.10)" }}>
            <p className="text-sm font-bold text-danger flex items-center gap-1.5 mb-1.5"><ShieldAlert size={15} /> Critical errors: these fail the attempt whatever the score</p>
            <ul className="list-disc pl-5 text-sm flex flex-col gap-1">{result.crits.map((c, i) => <li key={i}><b>{c.step}:</b> {c.reason}</li>)}</ul>
          </div>
        )}
        {result.deds.length > 0 && (
          <div className="rounded-xl p-3.5" style={{ background: "rgb(var(--warn) / 0.10)" }}>
            <p className="text-sm font-bold text-warn mb-1.5">Points lost</p>
            <ul className="list-disc pl-5 text-sm flex flex-col gap-1">{result.deds.map((d, i) => <li key={i}>{d.delta} · <b>{d.step}:</b> {d.note}</li>)}</ul>
          </div>
        )}
        {!result.crits.length && !result.deds.length && <p className="text-sm">{CLEAN[v.scenario.bay] || CLEAN.phlebotomy}</p>}
        <div>
          <p className="text-sm font-bold">What you did</p>
          <p className="text-xs text-muted mb-2">This is the record your supervisor sees.</p>
          <Timeline log={result.log} />
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === "exam" && passed && result.certificate && <button onClick={() => onCertificate(result.certificate.serial)} className="btn-brand"><Award size={16} /> View certificate</button>}
          {mode === "practice" && <button onClick={onRestart} className="btn-brand"><RotateCcw size={16} /> Practise again</button>}
          {mode === "practice" && <button onClick={() => onAgain("exam")} className="btn-ghost">Take the exam</button>}
          {mode === "exam" && !passed && <button onClick={() => onAgain("practice")} className="btn-brand">Practise first</button>}
          {mode === "exam" && !passed && <button onClick={onRestart} className="btn-ghost"><RotateCcw size={16} /> Retake the exam</button>}
          <button onClick={onCourse} className="btn-ghost">Back to the course</button>
        </div>
      </div>
    </div>
  );
}
