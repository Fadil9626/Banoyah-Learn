// Media storage abstraction. Today: local disk under backend/uploads. The rest
// of the app only knows ids + /api/media/:id URLs, so swapping this for S3/R2 +
// a CDN later is a localized change (write/read by key, hand back a CDN URL).
const path = require("path");
const fs = require("fs");
const pool = require("../config/db");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

// Ensure the upload directory exists at startup.
function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  return UPLOAD_DIR;
}

// Limits + allowed types for lesson media.
const MAX_BYTES = 300 * 1024 * 1024; // 300 MB
const ALLOWED = [/^video\//, /^image\//, /^application\/pdf$/];
const isAllowed = (mime) => ALLOWED.some((re) => re.test(mime || ""));

const extFor = (mime, original) => {
  const fromName = path.extname(original || "");
  if (fromName) return fromName.toLowerCase();
  if (mime === "application/pdf") return ".pdf";
  if (mime?.startsWith("video/")) return "." + mime.split("/")[1];
  if (mime?.startsWith("image/")) return "." + mime.split("/")[1];
  return "";
};

const absPath = (storagePath) => path.join(UPLOAD_DIR, storagePath);

// Best-effort plain-text extraction from a PDF media file (used to feed lesson
// PDFs to the AI quiz generator). Returns "" when the file isn't a readable PDF
// or holds no extractable text (e.g. a scanned/image-only PDF). The id is taken
// from a lesson's /api/media/:id URL; org-scoped so cross-tenant reads can't happen.
async function extractPdfText(mediaId, orgId, maxChars = 8000) {
  if (!mediaId) return "";
  const { rows } = await pool.query(
    "SELECT mime, storage_path FROM media WHERE id=$1 AND org_id=$2", [mediaId, orgId]
  );
  if (!rows.length) return "";
  const m = rows[0];
  if (!/pdf/i.test(m.mime || "")) return "";
  const file = absPath(m.storage_path);
  if (!fs.existsSync(file)) return "";

  // pdfjs-dist is ESM — dynamic import from CommonJS. The legacy build runs in Node.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(file));
  const pdf = await pdfjs.getDocument({ data, isEvalSupported: false, useSystemFonts: true }).promise;
  let text = "";
  const pages = Math.min(pdf.numPages, 50); // guard against huge documents
  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str).join(" ") + "\n";
    if (text.length > maxChars) break;
  }
  try { await pdf.cleanup(); await pdf.destroy(); } catch { /* ignore */ }
  text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return text.length > maxChars ? text.slice(0, maxChars) + "\n…(truncated)" : text;
}

module.exports = { UPLOAD_DIR, ensureDir, MAX_BYTES, isAllowed, extFor, absPath, extractPdfText };
