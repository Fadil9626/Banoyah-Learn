// Learner-facing routes — any authenticated user (learner / instructor / admin)
// can take published courses. All access is scoped to the caller and their org.
const express = require("express");
const router = express.Router();
const c = require("../controllers/learnController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/catalog", c.catalog);
router.get("/me", c.myLearning);
router.get("/certificates/:serial", c.getCertificate);
router.get("/certificates/:serial/pdf", c.downloadCertificate);
router.get("/courses/:id", c.getForLearner);
router.post("/courses/:id/enroll", c.enroll);
router.post("/courses/:id/progress", c.markProgress);
router.post("/courses/:id/submit", c.submitQuiz);

module.exports = router;
