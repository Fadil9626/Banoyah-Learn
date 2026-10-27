import React from "react";

// How the final mark was made: the sum written out, so nobody has to wonder.
export default function FinalMark({ g }) {
  const part = (label, score, weight) => (
    <div className="rounded-xl bg-surface-2 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wider text-faint">{label} · {weight}%</p>
      <p className="font-mono tabular-nums text-sm mt-0.5">{score} × {weight}% = <b className="text-content">{Math.round(score * weight) / 100}</b></p>
    </div>
  );
  const why = { final: `the final mark is below ${g.finalPass}`, practical: `the practical is below its minimum of ${g.practicalMin}`, critical: "a critical safety error" };
  return (
    <div className="flex flex-col gap-2">
      <div className="grid sm:grid-cols-3 gap-2 items-stretch">
        {g.theory != null && g.weight < 100 && part("Quiz", g.theory, 100 - g.weight)}
        {part("Practical", g.practical, g.weight)}
        <div className={`rounded-xl px-3 py-2.5 border ${g.passed ? "border-ok" : "border-danger"}`}>
          <p className="text-[11px] uppercase tracking-wider text-faint">Final mark · pass at {g.finalPass}</p>
          <p className={`font-mono tabular-nums text-2xl font-black ${g.passed ? "text-ok" : "text-danger"}`}>{g.final}<span className="text-sm text-faint"> / 100</span></p>
        </div>
      </div>
      {!g.passed && g.reasons?.length > 0 && <p className="text-xs text-muted">Not passed because {g.reasons.map((r) => why[r]).join(", and ")}.</p>}
      {g.practicalMin > 0 && g.passed && <p className="text-xs text-faint">The practical also had to reach {g.practicalMin} on its own.</p>}
    </div>
  );
}
