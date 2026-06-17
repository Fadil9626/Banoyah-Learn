const express = require("express");
const router = express.Router();
const c = require("../controllers/webhooksController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect, requireRole("admin"));

router.get("/", c.list);
router.post("/", c.create);
router.delete("/:id", c.remove);
router.post("/:id/test", c.test);

module.exports = router;
