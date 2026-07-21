import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import api from "../lib/api";
import LessonContent from "../components/LessonContent";

// A print-optimised, light "document" view of a whole course — cover + every
// lesson (Markdown + diagrams/photos) — so it can be saved as a PDF handout via
// the browser's native print-to-PDF. Forces the light token set regardless of
// the app theme so the PDF looks like a document, not a dark screenshot.
const LIGHT = {
  "--bg": "248 250 252", "--surface": "255 255 255", "--surface-2": "241 245 249",
  "--border": "226 232 240", "--text": "15 23 42", "--muted": "100 116 139",
  "--faint": "148 163 184", "--brand": "79 70 229", "--brand-2": "124 58 237",
  "--brand-fg": "255 255 255", "--ok": "16 185 129", "--warn": "217 119 6", "--danger": "225 29 72",
};

export default function CourseHandout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const printedRef = useRef(false);

  useEffect(() => {
    api(`learn/courses/${id}`).then(setData).catch(() => setErr(true));
  }, [id]);

  // Auto-open the print dialog once, after images have loaded (or a 3.5s cap) so
  // the diagrams/photos are actually captured in the PDF.
  useEffect(() => {
    if (!data || printedRef.current) return;
    printedRef.current = true;
    let cancelled = false;
    const imgs = Array.from(document.querySelectorAll(".handout-doc img"));
    const waits = imgs.map((im) => im.complete ? Promise.resolve()
      : new Promise((res) => { im.onload = res; im.onerror = res; }));
    Promise.race([Promise.all(waits), new Promise((r) => setTimeout(r, 3500))])
      .then(() => { if (!cancelled) window.print(); });
    return () => { cancelled = true; };
  }, [data]);

  if (err) return <div style={{ padding: 40, fontFamily: "system-ui" }}>Couldn't load this course.</div>;
  if (!data) return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><Loader2 className="animate-spin" /></div>;

  const { course, lessons = [] } = data;

  return (
    <div style={{ ...LIGHT, background: "#fff", minHeight: "100vh", color: "rgb(var(--text))" }}>
      <style>{`
        .handout-doc { max-width: 780px; margin: 0 auto; padding: 32px 32px 80px; }
        @media print {
          .no-print { display: none !important; }
          h1, h2, h3 { break-after: avoid; }
          figure, img { break-inside: avoid; }
          @page { margin: 16mm; }
        }
      `}</style>

      {/* Toolbar (screen only) */}
      <div className="no-print" style={{
        position: "sticky", top: 0, zIndex: 10, display: "flex", justifyContent: "space-between",
        alignItems: "center", gap: 12, padding: "12px 20px", background: "#fff", borderBottom: "1px solid #e2e8f0",
      }}>
        <button onClick={() => navigate(-1)} className="btn-ghost"><ArrowLeft size={16} /> Back</button>
        <button onClick={() => window.print()} className="btn-brand"><Printer size={16} /> Print / Save as PDF</button>
      </div>

      <div className="handout-doc">
        {/* Cover */}
        <header style={{ marginBottom: 32, paddingBottom: 20, borderBottom: "2px solid rgb(var(--brand))" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "rgb(var(--brand))" }}>
            Banoyah Learn · Course Handout
          </p>
          <h1 style={{ margin: "10px 0 6px", fontSize: 30, fontWeight: 800, lineHeight: 1.15, color: "rgb(var(--text))" }}>{course.title}</h1>
          {course.category && <p style={{ margin: 0, fontSize: 14, color: "rgb(var(--muted))" }}>{course.category}</p>}
          {course.description && <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6, color: "rgb(var(--muted))" }}>{course.description}</p>}
          <p style={{ marginTop: 14, fontSize: 12, color: "rgb(var(--faint))" }}>
            {lessons.length} lesson{lessons.length === 1 ? "" : "s"} · Pass mark {course.pass_mark}%
          </p>
        </header>

        {/* Lessons */}
        {lessons.map((l, i) => (
          <section key={l.id} style={{ marginBottom: 34 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 800, letterSpacing: ".04em", color: "rgb(var(--brand))" }}>LESSON {i + 1}</p>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "rgb(var(--text))" }}>{l.title}</h2>
            {l.type === "text"
              ? <LessonContent body={l.body} />
              : <p style={{ fontSize: 14, color: "rgb(var(--muted))" }}>
                  {l.type === "video" ? "Video lesson" : "PDF lesson"}{l.media_url ? ` — ${l.media_url}` : ""}
                </p>}
          </section>
        ))}

        <footer className="no-print" style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #e2e8f0", fontSize: 12, color: "rgb(var(--faint))" }}>
          Tip: in the print dialog, choose <strong>“Save as PDF”</strong> as the destination to download this handout.
        </footer>
      </div>
    </div>
  );
}
