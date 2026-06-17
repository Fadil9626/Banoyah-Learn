// Media storage abstraction. Today: local disk under backend/uploads. The rest
// of the app only knows ids + /api/media/:id URLs, so swapping this for S3/R2 +
// a CDN later is a localized change (write/read by key, hand back a CDN URL).
const path = require("path");
const fs = require("fs");

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

module.exports = { UPLOAD_DIR, ensureDir, MAX_BYTES, isAllowed, extFor, absPath };
