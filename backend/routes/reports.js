const express = require("express");
const router = express.Router();
const c = require("../controllers/reportsController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect, requireRole("admin", "instructor", "manager"));

router.get("/summary", c.summary);
router.get("/expiring", c.expiring);
router.get("/assignments", c.assignmentCompliance);
router.get("/register", c.register);
router.get("/certifications.csv", c.exportCsv);
router.get("/certificates/:serial/pdf", c.certificatePdf);
router.delete("/certificates/:serial", requireRole("admin"), c.revoke);

module.exports = router;
