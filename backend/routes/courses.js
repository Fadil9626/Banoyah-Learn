const express = require("express");
const router = express.Router();
const c = require("../controllers/coursesController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect);
const authoring = requireRole("admin", "instructor");

// Courses
router.get("/", c.listCourses);
router.get("/:id", c.getCourse);
router.post("/", authoring, c.createCourse);
router.patch("/:id", authoring, c.updateCourse);
router.delete("/:id", authoring, c.deleteCourse);
router.patch("/:id/status", authoring, c.setStatus);

// Lessons (nested create + reorder)
router.post("/:id/lessons", authoring, c.addLesson);
router.patch("/:id/lessons/reorder", authoring, c.reorderLessons);

// Quiz questions (nested create)
router.post("/:id/questions", authoring, c.addQuestion);
router.post("/:id/questions/generate", authoring, c.generateQuestions);
router.post("/:id/questions/bulk", authoring, c.addQuestionsBulk);

module.exports = router;
