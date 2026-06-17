const express = require("express");
const router = express.Router();
const c = require("../controllers/auditController");
const { protect, requireRole } = require("../middleware/auth");

router.get("/", protect, requireRole("admin"), c.list);
router.get("/verify", protect, requireRole("admin"), c.verify);

module.exports = router;
