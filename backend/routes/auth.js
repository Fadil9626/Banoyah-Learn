const express = require("express");
const router = express.Router();
const c = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// Public
router.get("/status", c.status);
router.post("/bootstrap", c.bootstrap);
router.post("/login", c.login);
router.post("/forgot", c.forgot);
router.post("/reset", c.resetPassword);

// Authenticated
router.get("/me", protect, c.me);
router.put("/profile", protect, c.updateProfile);
router.put("/password", protect, c.changePassword);
router.post("/2fa/start", protect, c.start2fa);
router.post("/2fa/enable", protect, c.enable2fa);
router.post("/2fa/disable", protect, c.disable2fa);

module.exports = router;
