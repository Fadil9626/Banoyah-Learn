const express = require("express");
const router = express.Router();
const c = require("../controllers/settingsController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect, requireRole("admin"));

router.get("/", c.get);
router.put("/mail", c.updateMail);
router.post("/mail/test", c.testMail);
router.put("/reminders", c.updateReminders);
router.post("/reminders/run", c.runReminders);

module.exports = router;
