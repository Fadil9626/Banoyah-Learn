import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShieldCheck, ShieldX, ShieldAlert, Loader2, GraduationCap } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "long" }) : null);

export default function Verify() {
  const { serial } = useParams();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    // Plain fetch — this page is public, no auth token involved.
    fetch(`/api/verify/${encodeURIComponent(serial)}`)
      .then(async (r) => ({ status: r.status, data: await r.json().catch(() => ({})) }))
      .then(({ status, data }) => setState({ loading: false, status, data }))
      .catch(() => setState({ loading: false, status: 0, data: { found: false } }));
  }, [serial]);

  const { loading, data } = state;
  const accent = data && /^#[0-9a-fA-F]{6}$/.test(data.brand_accent || "") ? data.brand_accent : "#4F46E5";
  const found = data?.found;
  const valid = data?.valid;

  const tone = !found ? { c: "var(--danger)", Icon: ShieldX, title: "Certificate not found", note: "We couldn't find a certificate with this serial." }
    : valid ? { c: "var(--ok)", Icon: ShieldCheck, title: "Valid certificate", note: "This certificate is genuine and currently valid." }
    : { c: "var(--warn)", Icon: ShieldAlert, title: "Expired certificate", note: "This certificate was genuine but has since expired." };

  return (
    <div className="min-h-full bg-bg flex flex-col">
      <header className="h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl grid place-items-center text-white" style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))" }}>
            <GraduationCap size={18} />
          </div>
          <span className="font-extrabold text-content tracking-tight">Banoyah <span className="text-brand">Learn</span></span>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 grid place-items-center px-4 pb-16">
        {loading ? (
          <Loader2 className="animate-spin text-muted" />
        ) : (
          <div className="card w-full max-w-md overflow-hidden">
            <div className="h-2" style={{ backgroundColor: found ? accent : "rgb(var(--danger))" }} />
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl grid place-items-center mx-auto" style={{ backgroundColor: `rgb(${tone.c} / 0.12)`, color: `rgb(${tone.c})` }}>
                <tone.Icon size={32} />
              </div>
              <h1 className="text-xl font-black text-content mt-4">{tone.title}</h1>
              <p className="text-sm text-muted mt-1">{tone.note}</p>

              {found && (
                <>
                  <div className="mt-6 flex flex-col items-center gap-1.5">
                    {data.brand_logo && <img src={data.brand_logo} alt="" className="h-9 object-contain mb-1" />}
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{data.org}</p>
                  </div>
                  <div className="mt-6 text-left space-y-3 border-t border-line pt-6">
                    <Row label="Awarded to" value={data.learner} />
                    <Row label="Course" value={data.course} />
                    <Row label="Score" value={`${data.score}%`} />
                    <Row label="Issued" value={fmt(data.issued_at)} />
                    <Row label="Valid until" value={fmt(data.certified_until) || "No expiry"} />
                    <Row label="Serial" value={data.serial} mono />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-bold uppercase tracking-wider text-faint">{label}</span>
      <span className={`text-sm text-content text-right ${mono ? "font-mono" : "font-semibold"}`}>{value}</span>
    </div>
  );
}
