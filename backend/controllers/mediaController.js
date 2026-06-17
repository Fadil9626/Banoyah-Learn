const crypto = require("crypto");
const fs = require("fs");
const multer = require("multer");
const pool = require("../config/db");
const media = require("../lib/media");

media.ensureDir();

// Multer disk storage — files land in uploads/ named <uuid><ext>.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, media.UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, crypto.randomUUID() + media.extFor(file.mimetype, file.originalname)),
});
const uploader = multer({
  storage,
  limits: { fileSize: media.MAX_BYTES },
  fileFilter: (_req, file, cb) =>
    media.isAllowed(file.mimetype) ? cb(null, true) : cb(new Error("Unsupported file type")),
}).single("file");

// ── POST /api/media ──────────────────────────────────────────────────────────
// Upload a lesson media file (admin/instructor). Returns { id, url, ... }.
const upload = (req, res) => {
  uploader(req, res, async (err) => {
    if (err) {
      const msg = err.code === "LIMIT_FILE_SIZE"
        ? `File too large (max ${Math.round(media.MAX_BYTES / 1024 / 1024)} MB)` : err.message;
      return res.status(400).json({ message: msg });
    }
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    try {
      const id = req.file.filename.split(".")[0];
      await pool.query(
        `INSERT INTO media (id, org_id, filename, mime, size, storage_path, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, req.user.org_id, req.file.originalname, req.file.mimetype, req.file.size, req.file.filename, req.user.id]
      );
      return res.status(201).json({
        id, url: `/api/media/${id}`, filename: req.file.originalname,
        mime: req.file.mimetype, size: req.file.size,
      });
    } catch (e) {
      fs.unlink(req.file.path, () => {}); // roll back the file if the row fails
      return res.status(500).json({ message: e.message });
    }
  });
};

// ── GET /api/media/:id ───────────────────────────────────────────────────────
// Public stream by unguessable id (so <video>/<embed> can load it without an auth
// header). Express handles Range requests, so video seeking works.
const serve = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT mime, storage_path, filename FROM media WHERE id=$1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    const m = rows[0];
    const file = media.absPath(m.storage_path);
    if (!fs.existsSync(file)) return res.status(404).json({ message: "File missing" });
    if (m.mime) res.setHeader("Content-Type", m.mime);
    res.setHeader("Cache-Control", "private, max-age=86400");
    return res.sendFile(file);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

module.exports = { upload, serve };
