import React from "react";

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// The second-by-second record of a 3D practical: what was said and picked up,
// and what each mistake cost. Learners see it at the end; supervisors review it.
export default function Timeline({ log }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-[12.5px]">
        <thead><tr className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted">
          {["Time", "Step", "Action", "Points"].map((h) => <th key={h} className="text-left font-semibold px-2.5 py-1.5">{h}</th>)}
        </tr></thead>
        <tbody>
          {log.map((r, i) => (
            <tr key={i} className="border-t border-line align-top" style={r.critical ? { background: "rgb(var(--danger) / 0.08)" } : undefined}>
              <td className="px-2.5 py-1.5 font-mono tabular-nums whitespace-nowrap">{mmss(r.t)}</td>
              <td className="px-2.5 py-1.5 whitespace-nowrap">{r.step}</td>
              <td className="px-2.5 py-1.5">{r.what}{r.critical && <b className="text-danger"> · CRITICAL</b>}</td>
              <td className={`px-2.5 py-1.5 font-mono tabular-nums ${r.delta < 0 ? "text-danger" : ""}`}>{r.delta || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
