const express = require("express");
const router = express.Router();
const c = require("../controllers/assignmentsController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect);

// Learner: my assigned courses.
router.get("/me", c.mine);

// Staff: manage assignments.
router.get("/course/:courseId", requireRole("admin", "instructor"), c.listForCourse);
router.post("/", requireRole("admin", "instructor"), c.assign);
router.delete("/:id", requireRole("admin", "instructor"), c.remove);

module.exports = router;
