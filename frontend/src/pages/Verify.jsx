import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShieldCheck, ShieldX, ShieldAlert, Loader2, GraduationCap } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "long" }) : null);

// Public certificate page reached by scanning a certificate's QR code. Shows the
// FULL certificate (so it reads as the real thing) plus a verification stamp that
// confirms it's genuine / valid / expired. No auth — uses the public /api/verify.
export default function Verify() {
  const { serial } = useParams();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    fetch(`/api/verify/${encodeURIComponent(serial)}`)
      .then(async (r) => ({ status: r.status, data: await r.json().catch(() => ({})) }))
      .then(({ status, data }) => setState({ loading: false, status, data }))
      .catch(() => setState({ loading: false, status: 0, data: { found: false } }));
  }, [serial]);

  const { loading, data } = state;
  const accent = data && /^#[0-9a-fA-F]{6}$/.test(data.brand_accent || "") ? data.brand_accent : "#4F46E5";
  const found = data?.found;
  const valid = data?.valid;

  const stamp = !found
    ? { c: "var(--danger)", Icon: ShieldX, title: "Certificate not found", note: "No certificate matches this serial." }
    : valid
      ? { c: "var(--ok)", Icon: ShieldCheck, title: "Genuine & valid", note: "This certificate is authentic and currently valid." }
      : { c: "var(--warn)", Icon: ShieldAlert, title: "Genuine — expired", note: "This certificate is authentic but has expired." };

  return (
    <div className="min-h-full bg-bg flex flex-col">
      <header className="h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl grid place-items-center text-white" style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))" }}>
            <GraduationCap size={18} />
          </div>
          <span className="font-extrabold text-content tracking-tight">Banoyah <span className="text-brand">Learn</span></span>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 grid place-items-center px-4 pb-16 pt-2">
        {loading ? (
          <Loader2 className="animate-spin text-muted" />
        ) : !found ? (
          <div className="card w-full max-w-md overflow-hidden">
            <div className="h-2" style={{ backgroundColor: "rgb(var(--danger))" }} />
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl grid place-items-center mx-auto" style={{ backgroundColor: "rgb(var(--danger) / 0.12)", color: "rgb(var(--danger))" }}>
                <ShieldX size={32} />
              </div>
              <h1 className="text-xl font-black text-content mt-4">{stamp.title}</h1>
              <p className="text-sm text-muted mt-1">{stamp.note}</p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl">
            {/* Verification stamp */}
            <div className="flex items-center justify-center gap-2 mx-auto mb-4 px-4 py-2 rounded-full w-fit text-sm font-semibold"
              style={{ backgroundColor: `rgb(${stamp.c} / 0.12)`, color: `rgb(${stamp.c})` }}>
              <stamp.Icon size={16} /> {stamp.title}
            </div>

            {/* The certificate itself */}
            <div className="relative rounded-2xl overflow-hidden border border-line bg-surface shadow-card">
              <div className="h-2.5" style={{ backgroundColor: accent }} />
              <div className="p-7 sm:p-14 text-center">
                <div className="flex flex-col items-center justify-center gap-2.5 mb-7 sm:mb-8">
                  {data.brand_logo
                    ? <img src={data.brand_logo} alt="" className="h-11 sm:h-12 object-contain mb-1" />
                    : <div className="w-9 h-9 rounded-xl grid place-items-center text-white" style={{ backgroundColor: accent }}><GraduationCap size={20} /></div>}
                  <span className="font-extrabold text-content tracking-tight">{data.org}</span>
                </div>

                <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] sm:tracking-[0.25em]" style={{ color: accent }}>Certificate of Completion</p>
                <p className="text-sm text-muted mt-6">This certifies that</p>
                <h1 className="text-2xl sm:text-4xl font-black text-content mt-2 tracking-tight break-words">{data.learner}</h1>
                <p className="text-sm text-muted mt-6">has successfully completed</p>
                <h2 className="text-lg sm:text-xl font-bold mt-1 break-words" style={{ color: accent }}>{data.course}</h2>

                <div className="flex items-center justify-center gap-1.5 mt-6 text-sm text-content">
                  <ShieldCheck size={16} className="text-ok" /> Passed with a score of <strong>{data.score}%</strong>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-10 gap-y-3 mt-9 sm:mt-10 pt-7 sm:pt-8 border-t border-line text-left">
                  <Field label="Issued" value={fmt(data.issued_at)} />
                  <Field label="Valid until" value={fmt(data.certified_until) || "No expiry"} />
                  <Field label="Serial" value={data.serial} mono />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-faint">{label}</p>
      <p className={`text-sm text-content mt-0.5 ${mono ? "font-mono" : "font-semibold"}`}>{value}</p>
    </div>
  );
}
