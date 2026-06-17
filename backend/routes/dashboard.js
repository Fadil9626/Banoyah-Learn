const express = require("express");
const router = express.Router();
const c = require("../controllers/dashboardController");
const { protect } = require("../middleware/auth");

router.get("/", protect, c.summary);

module.exports = router;
