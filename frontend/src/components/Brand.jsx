import React from "react";
import { GraduationCap } from "lucide-react";

// The product mark — gradient tile + wordmark. `compact` shows only the tile.
export default function Brand({ compact = false, size = 36 }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex items-center justify-center rounded-xl text-white shadow-glow"
        style={{
          width: size, height: size,
          backgroundImage: "linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))",
        }}
      >
        <GraduationCap size={size * 0.55} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="font-extrabold text-content tracking-tight">Banoyah <span className="text-brand">Learn</span></p>
          <p className="text-[10px] font-medium text-faint -mt-0.5">Training & Certification</p>
        </div>
      )}
    </div>
  );
}
