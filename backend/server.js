require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const migrate = require("./db/migrate");
const pool = require("./config/db");
const scheduler = require("./lib/scheduler");

const app = express();

// Behind nginx/pm2 — trust the first proxy hop so req.ip (used by the rate
// limiters below) is the real client, not 127.0.0.1.
app.set("trust proxy", 1);

// Security headers. CSP is intentionally OFF for now: the SPA relies on inline
// style attributes and data: URIs (QR codes, logos), so a default CSP would
// white-screen it — enabling a tuned CSP needs a dedicated browser-tested pass.
// Everything else (clickjacking/X-Frame-Options, MIME-sniffing, HSTS, …) applies.
app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Brute-force protection on the sensitive public surfaces.
// Auth: only FAILED requests count (skipSuccessfulRequests), so a normal
// login → 2FA → status flow is never throttled, but password guessing is.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 30, skipSuccessfulRequests: true,
  standardHeaders: "draft-7", legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a few minutes and try again." },
});
// Verify: public certificate lookups — cap per IP to stop serial enumeration.
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 100,
  standardHeaders: "draft-7", legacyHeaders: false,
  message: { error: "Too many verification requests. Please try again shortly." },
});

// API routes
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "banoyah-learn", time: new Date().toISOString() }));

app.use("/api/verify", verifyLimiter, require("./routes/verify")); // public — no auth

app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/users", require("./routes/users"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/learn", require("./routes/learn"));
app.use("/api/api-consumers", require("./routes/apiConsumers"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/media", require("./routes/media"));
app.use("/api/assignments", require("./routes/assignments"));
app.use("/api/audit", require("./routes/audit"));
app.use("/api/webhooks", require("./routes/webhooks"));
app.use("/api/v1", require("./routes/v1"));
app.use("/api", require("./routes/authoring"));

// Serve the built frontend if present (single-origin deploy).
const dist = path.join(__dirname, "../frontend/dist");
app.use(express.static(dist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(dist, "index.html"), (err) => err && next());
});

const PORT = process.env.PORT || 5300;

migrate()
  .then(() => {
    const server = app.listen(PORT, () => console.log(`✅ Banoyah Learn API running on port ${PORT}`));
    scheduler.start();

    // Graceful shutdown: on a container SIGTERM (scale-down/redeploy) or Ctrl-C,
    // stop the reminder loop, let in-flight requests drain, close the DB pool,
    // then exit. A hard timeout guarantees we don't hang the orchestrator.
    let shuttingDown = false;
    const shutdown = (signal) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.info(`${signal} received — shutting down gracefully…`);
      scheduler.stop();
      server.close(async () => {
        try { await pool.end(); } catch (e) { console.error("Pool close error:", e.message); }
        console.log("HTTP server closed. Bye.");
        process.exit(0);
      });
      setTimeout(() => { console.error("Forced shutdown after timeout."); process.exit(1); }, 10_000).unref();
    };
    ["SIGTERM", "SIGINT"].forEach((s) => process.on(s, () => shutdown(s)));
  })
  .catch((e) => {
    console.error("❌ Startup failed (migrations):", e.message);
    process.exit(1);
  });
