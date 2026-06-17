const express = require("express");
const router = express.Router();
const c = require("../controllers/usersController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect);

router.get("/", c.list);
router.post("/",       requireRole("admin", "instructor"), c.create);
router.patch("/:id",   requireRole("admin", "instructor"), c.update);

module.exports = router;
