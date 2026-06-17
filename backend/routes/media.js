const express = require("express");
const router = express.Router();
const c = require("../controllers/mediaController");
const { protect, requireRole } = require("../middleware/auth");

// Upload is staff-only; serving is public (by unguessable id) so media elements
// can load without an auth header.
router.post("/", protect, requireRole("admin", "instructor"), c.upload);
router.get("/:id", c.serve);

module.exports = router;
