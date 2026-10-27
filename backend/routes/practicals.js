// Staff side of the 3D practicals: which scenarios a course can use, and the
// results to review. Managers see their own team only.
const express = require("express");
const router = express.Router();
const c = require("../controllers/practicalController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect);

router.get("/scenarios", requireRole("admin", "instructor"), c.scenarios);
router.get("/results", requireRole("admin", "instructor", "manager"), c.results);
router.get("/results/:id", requireRole("admin", "instructor", "manager"), c.resultDetail);
router.patch("/results/:id/review", requireRole("admin", "instructor", "manager"), c.review);

module.exports = router;
