const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

// Brand palette (matches the app's indigo→violet).
const BRAND = "#4F46E5";
const BRAND2 = "#7C3AED";
const INK = "#0F172A";
const MUTED = "#64748B";
const LINE = "#CBD5E1";

// Stream a landscape A4 certificate PDF for `cert` to the writable `out`
// (an Express response). `cert` carries: serial, score, issued_at,
// certified_until, course_title, learner_name, org_name, verify_url,
// brand_accent, brand_logo.
async function certificatePDF(cert, out) {
  const accent = /^#[0-9a-fA-F]{6}$/.test(cert.brand_accent || "") ? cert.brand_accent : BRAND;

  // Pre-render the verification QR before we touch the stream so a QR failure
  // never leaves a half-written response.
  let qrBuf = null;
  if (cert.verify_url) {
    try {
      qrBuf = await QRCode.toBuffer(cert.verify_url, {
        errorCorrectionLevel: "M", margin: 0, width: 320,
        color: { dark: INK, light: "#FFFFFF" },
      });
    } catch { /* no QR — certificate still renders */ }
  }

  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0, info: {
    Title: `Certificate ${cert.serial || ""}`.trim(),
    Author: cert.org_name || "Banoyah Learn",
    Subject: cert.course_title || "Certificate of Completion",
  }});
  doc.pipe(out);

  const W = doc.page.width;   // 841.89
  const H = doc.page.height;  // 595.28
  const cx = W / 2;

  // ── Backdrop & frame ───────────────────────────────────────────────────────
  doc.rect(0, 0, W, H).fill("#FFFFFF");

  // Accent band across the very top.
  doc.rect(0, 0, W, 13).fill(accent);
  doc.rect(0, 13, W, 3).fill(BRAND2);

  // Double border.
  const bo = 26;                 // outer border inset
  const bi = 32;                 // inner border inset
  doc.lineWidth(2).strokeColor(accent).rect(bo, bo, W - bo * 2, H - bo * 2).stroke();
  doc.lineWidth(0.75).strokeColor(LINE).rect(bi, bi, W - bi * 2, H - bi * 2).stroke();

  // Decorative corner brackets just inside the inner border.
  const o = bi + 10, L = 22;
  doc.lineWidth(2).strokeColor(accent);
  const bracket = (pts) => { doc.moveTo(pts[0], pts[1]).lineTo(pts[2], pts[3]).lineTo(pts[4], pts[5]).stroke(); };
  bracket([o, o + L, o, o, o + L, o]);                                   // top-left
  bracket([W - o - L, o, W - o, o, W - o, o + L]);                       // top-right
  bracket([o, H - o - L, o, H - o, o + L, H - o]);                       // bottom-left
  bracket([W - o - L, H - o, W - o, H - o, W - o, H - o - L]);           // bottom-right

  // ── Header: logo + organization ────────────────────────────────────────────
  let y = 52;
  let hasLogo = false;
  if (cert.brand_logo && /^data:image\/(png|jpe?g);base64,/.test(cert.brand_logo)) {
    try {
      const buf = Buffer.from(cert.brand_logo.split(",")[1], "base64");
      const lw = 120, lh = 46;
      doc.image(buf, cx - lw / 2, y, { fit: [lw, lh], align: "center", valign: "center" });
      y += lh + 12;
      hasLogo = true;
    } catch { /* bad image — skip the logo */ }
  }
  if (!hasLogo) y = 66;

  doc.fillColor(INK).font("Helvetica-Bold").fontSize(14)
    .text((cert.org_name || "").toUpperCase(), 0, y, { width: W, align: "center", characterSpacing: 2.5 });

  // ── Title with flanking rules ──────────────────────────────────────────────
  y += 38;
  const title = "CERTIFICATE OF COMPLETION";
  doc.font("Helvetica-Bold").fontSize(13);
  const tw = doc.widthOfString(title, { characterSpacing: 4 });
  doc.fillColor(accent).text(title, 0, y, { width: W, align: "center", characterSpacing: 4 });
  const ruleY = y + 7, gap = tw / 2 + 22, ruleLen = 58;
  doc.lineWidth(1).strokeColor(accent);
  doc.moveTo(cx - gap - ruleLen, ruleY).lineTo(cx - gap, ruleY).stroke();
  doc.moveTo(cx + gap, ruleY).lineTo(cx + gap + ruleLen, ruleY).stroke();
  // small diamonds at the outer ends of the rules
  const diamond = (dx) => { doc.save().translate(dx, ruleY).rotate(45).rect(-2.5, -2.5, 5, 5).fill(accent).restore(); };
  diamond(cx - gap - ruleLen - 6); diamond(cx + gap + ruleLen + 6);

  // ── Recipient ──────────────────────────────────────────────────────────────
  y += 34;
  doc.fillColor(MUTED).font("Helvetica").fontSize(12)
    .text("This is to certify that", 0, y, { width: W, align: "center" });

  y += 22;
  doc.fillColor(INK).font("Times-Bold").fontSize(36)
    .text(cert.learner_name || "", 0, y, { width: W, align: "center" });

  // Underline flourish sized to the name.
  doc.font("Times-Bold").fontSize(36);
  const nameW = Math.min(W - 160, doc.widthOfString(cert.learner_name || "") + 80);
  const uY = doc.y + 4;
  doc.lineWidth(0.75).strokeColor(LINE).moveTo(cx - nameW / 2, uY).lineTo(cx + nameW / 2, uY).stroke();

  y = uY + 14;
  doc.fillColor(MUTED).font("Helvetica").fontSize(12)
    .text("has successfully completed", 0, y, { width: W, align: "center" });

  y += 20;
  doc.fillColor(accent).font("Times-Bold").fontSize(21)
    .text(cert.course_title || "", 80, y, { width: W - 160, align: "center" });

  y = doc.y + 12;
  doc.fillColor(INK).font("Helvetica").fontSize(11.5)
    .text(`Awarded with a score of ${cert.score}%`, 0, y, { width: W, align: "center" });

  // Validity pill.
  y = doc.y + 10;
  const pill = (cert.certified_until ? `Valid until ${fmtDate(cert.certified_until)}` : "No expiry").toUpperCase();
  doc.font("Helvetica-Bold").fontSize(8.5);
  const pw = doc.widthOfString(pill, { characterSpacing: 1 }) + 26, ph = 19;
  const px = cx - pw / 2;
  doc.save().roundedRect(px, y, pw, ph, ph / 2).fillColor(accent).fillOpacity(0.10).fill().restore();
  doc.roundedRect(px, y, pw, ph, ph / 2).lineWidth(0.8).strokeColor(accent).stroke();
  doc.fillColor(accent).font("Helvetica-Bold").fontSize(8.5)
    .text(pill, px, y + 5.5, { width: pw, align: "center", characterSpacing: 1 });

  // ── Footer: date · QR seal · serial ────────────────────────────────────────
  const lineY = H - 92;
  const blockW = 220;

  const block = (value, label, x) => {
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(12)
      .text(value || "—", x, lineY - 20, { width: blockW, align: "center" });
    doc.lineWidth(0.8).strokeColor(LINE).moveTo(x + 22, lineY).lineTo(x + blockW - 22, lineY).stroke();
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8)
      .text(label.toUpperCase(), x, lineY + 7, { width: blockW, align: "center", characterSpacing: 1.5 });
  };
  block(fmtDate(cert.issued_at), "Date of Issue", bo + 30);
  block(cert.serial, "Certificate Serial", W - bo - 30 - blockW);

  // Center QR "seal".
  if (qrBuf) {
    const qs = 74, qx = cx - qs / 2, qy = lineY - 64;
    doc.save().roundedRect(qx - 7, qy - 7, qs + 14, qs + 14, 8)
      .fillColor("#FFFFFF").fill()
      .roundedRect(qx - 7, qy - 7, qs + 14, qs + 14, 8).lineWidth(1).strokeColor(accent).stroke().restore();
    doc.image(qrBuf, qx, qy, { width: qs, height: qs });
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7)
      .text("SCAN TO VERIFY", cx - 60, qy + qs + 8, { width: 120, align: "center", characterSpacing: 1 });
  }

  // Verification URL line at the very bottom.
  if (cert.verify_url) {
    doc.fillColor(MUTED).font("Helvetica").fontSize(7.5)
      .text(`Verify the authenticity of this certificate at ${cert.verify_url}`, bo, H - bo - 16, {
        width: W - bo * 2, align: "center",
      });
  }

  doc.end();
}

module.exports = { certificatePDF };
