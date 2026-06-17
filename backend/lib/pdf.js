const PDFDocument = require("pdfkit");

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

// Brand palette (matches the app's indigo→violet).
const BRAND = "#4F46E5";
const BRAND2 = "#7C3AED";
const INK = "#0F172A";
const MUTED = "#64748B";

// Stream a landscape A4 certificate PDF for `cert` to the writable `out`
// (an Express response). `cert` carries: serial, score, issued_at,
// certified_until, course_title, learner_name, org_name.
function certificatePDF(cert, out) {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
  doc.pipe(out);

  const W = doc.page.width;   // 841.89
  const H = doc.page.height;  // 595.28
  const accent = /^#[0-9a-fA-F]{6}$/.test(cert.brand_accent || "") ? cert.brand_accent : BRAND;

  // Accent bar across the top.
  doc.rect(0, 0, W, 14).fill(accent);
  doc.rect(0, 14, W, 4).fill(BRAND2);

  // Inner double border.
  const m = 36;
  doc.lineWidth(2).strokeColor(accent).rect(m, m + 8, W - m * 2, H - m * 2 - 8).stroke();
  doc.lineWidth(0.75).strokeColor("#CBD5E1").rect(m + 6, m + 14, W - m * 2 - 12, H - m * 2 - 20).stroke();

  const cx = W / 2;
  let y = 62;

  // Optional organization logo (PNG/JPEG data URI), centered above the name.
  if (cert.brand_logo && /^data:image\/(png|jpe?g);base64,/.test(cert.brand_logo)) {
    try {
      const buf = Buffer.from(cert.brand_logo.split(",")[1], "base64");
      const lw = 90, lh = 50;
      doc.image(buf, cx - lw / 2, y, { fit: [lw, lh], align: "center", valign: "center" });
      y += lh + 12;
    } catch { /* bad image — skip the logo, keep the certificate */ }
  } else {
    y = 78;
  }

  // Organization name.
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(15)
    .text((cert.org_name || "").toUpperCase(), 0, y, { width: W, align: "center", characterSpacing: 2 });

  y += 44;
  doc.fillColor(accent).font("Helvetica-Bold").fontSize(11)
    .text("CERTIFICATE OF COMPLETION", 0, y, { width: W, align: "center", characterSpacing: 4 });

  y += 46;
  doc.fillColor(MUTED).font("Helvetica").fontSize(12)
    .text("This is to certify that", 0, y, { width: W, align: "center" });

  y += 26;
  doc.fillColor(INK).font("Times-Bold").fontSize(38)
    .text(cert.learner_name || "", 0, y, { width: W, align: "center" });

  y += 56;
  doc.fillColor(MUTED).font("Helvetica").fontSize(12)
    .text("has successfully completed", 0, y, { width: W, align: "center" });

  y += 24;
  doc.fillColor(accent).font("Times-Bold").fontSize(22)
    .text(cert.course_title || "", 60, y, { width: W - 120, align: "center" });

  y += 42;
  doc.fillColor(INK).font("Helvetica").fontSize(12)
    .text(`Passed with a score of ${cert.score}%`, 0, y, { width: W, align: "center" });

  // Footer: issued / valid until / serial.
  const fy = H - 120;
  doc.lineWidth(0.75).strokeColor("#E2E8F0").moveTo(m + 60, fy).lineTo(W - m - 60, fy).stroke();

  const col = (label, value, x, w, align) => {
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8)
      .text(label.toUpperCase(), x, fy + 16, { width: w, align, characterSpacing: 1 });
    doc.fillColor(INK).font("Helvetica").fontSize(11)
      .text(value || "—", x, fy + 30, { width: w, align });
  };
  const third = (W - m * 2 - 120) / 3;
  col("Issued", fmtDate(cert.issued_at), m + 60, third, "left");
  col("Valid until", fmtDate(cert.certified_until) || "No expiry", m + 60 + third, third, "center");
  col("Serial", cert.serial, m + 60 + third * 2, third, "right");

  // Verification line.
  if (cert.verify_url) {
    doc.fillColor(MUTED).font("Helvetica").fontSize(8)
      .text(`Verify the authenticity of this certificate at ${cert.verify_url}`, m + 60, fy + 56, { width: W - (m + 60) * 2, align: "center" });
  }

  doc.end();
}

module.exports = { certificatePDF };
