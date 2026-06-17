require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const migrate = require("./db/migrate");

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// API routes
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "banoyah-learn", time: new Date().toISOString() }));

app.use("/api/verify", require("./routes/verify")); // public — no auth

app.use("/api/auth", require("./routes/auth"));
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
    app.listen(PORT, () => console.log(`✅ Banoyah Learn API running on port ${PORT}`));
    require("./lib/scheduler").start();
  })
  .catch((e) => {
    console.error("❌ Startup failed (migrations):", e.message);
    process.exit(1);
  });
