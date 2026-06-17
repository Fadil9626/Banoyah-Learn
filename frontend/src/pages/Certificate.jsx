import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowLeft, Printer, Download, Loader2, GraduationCap, ShieldCheck } from "lucide-react";
import api, { getToken } from "../lib/api";

const fmt = (iso) => iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "long" }) : null;

export default function Certificate() {
  const { serial } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api(`learn/certificates/${serial}`).then(setCert).catch((e) => { toast.error(e.message); navigate("/learn"); });
  }, [serial]); // eslint-disable-line

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/learn/certificates/${serial}/pdf`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error("Could not generate the PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `certificate-${serial}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error(e.message); }
    finally { setDownloading(false); }
  };

  if (!cert) return <div className="py-20 grid place-items-center text-muted"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5 print:hidden">
        <button onClick={() => navigate("/learn")} className="flex items-center gap-1.5 text-sm text-muted hover:text-content">
          <ArrowLeft size={16} /> My Learning
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="btn-ghost"><Printer size={16} /> Print</button>
          <button onClick={downloadPdf} disabled={downloading} className="btn-brand">
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download PDF
          </button>
        </div>
      </div>

      {/* Certificate */}
      <div id="cert" className="relative rounded-2xl overflow-hidden border border-line bg-surface shadow-card">
        <div className="h-2.5" style={{ backgroundImage: "linear-gradient(90deg, rgb(var(--brand)), rgb(var(--brand-2)))" }} />
        <div className="p-10 sm:p-14 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl grid place-items-center text-brand-fg" style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--brand)), rgb(var(--brand-2)))" }}>
              <GraduationCap size={20} />
            </div>
            <span className="font-extrabold text-content tracking-tight">{cert.org_name}</span>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.25em] text-faint">Certificate of Completion</p>
          <p className="text-sm text-muted mt-6">This certifies that</p>
          <h1 className="text-3xl sm:text-4xl font-black text-content mt-2 tracking-tight">{cert.learner_name}</h1>
          <p className="text-sm text-muted mt-6">has successfully completed</p>
          <h2 className="text-xl font-bold text-brand mt-1">{cert.course_title}</h2>

          <div className="flex items-center justify-center gap-1.5 mt-6 text-sm text-content">
            <ShieldCheck size={16} className="text-ok" /> Passed with a score of <strong>{cert.score}%</strong>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 mt-10 pt-8 border-t border-line text-left">
            <Field label="Issued" value={fmt(cert.issued_at)} />
            <Field label="Valid until" value={fmt(cert.certified_until) || "No expiry"} />
            <Field label="Serial" value={cert.serial} mono />
          </div>
        </div>
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
