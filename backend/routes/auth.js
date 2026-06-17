const express = require("express");
const router = express.Router();
const c = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.get("/status",     c.status);
router.post("/bootstrap", c.bootstrap);
router.post("/login",     c.login);
router.get("/me", protect, c.me);

module.exports = router;
