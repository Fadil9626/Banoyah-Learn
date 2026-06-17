// By-id routes for lessons and quiz questions (org ownership verified in the
// controller via a join to the parent course). Mounted at /api, so guards are
// applied per-route — a non-matching path (e.g. /api/health) falls through
// instead of being blocked by router-level middleware.
const express = require("express");
const router = express.Router();
const c = require("../controllers/coursesController");
const { protect, requireRole } = require("../middleware/auth");

const guard = [protect, requireRole("admin", "instructor")];

router.patch("/lessons/:id", ...guard, c.updateLesson);
router.delete("/lessons/:id", ...guard, c.deleteLesson);
router.patch("/questions/:id", ...guard, c.updateQuestion);
router.delete("/questions/:id", ...guard, c.deleteQuestion);

module.exports = router;
