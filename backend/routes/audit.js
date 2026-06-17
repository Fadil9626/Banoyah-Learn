const express = require("express");
const router = express.Router();
const c = require("../controllers/auditController");
const { protect, requireRole } = require("../middleware/auth");

router.get("/", protect, requireRole("admin"), c.list);

module.exports = router;
