import React from "react";
import { Sparkles } from "lucide-react";
import PageHeader from "../components/PageHeader";

export default function Placeholder({ title, subtitle, blurb }) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="card p-12 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-2xl grid place-items-center text-brand-fg shadow-glow"
          style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))" }}>
          <Sparkles size={22} />
        </div>
        <p className="font-bold text-content">Coming next</p>
        <p className="text-sm text-muted max-w-md">{blurb}</p>
      </div>
    </div>
  );
}
