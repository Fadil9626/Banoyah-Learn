// Admin management of API consumer keys (issue / revoke / delete).
const express = require("express");
const router = express.Router();
const c = require("../controllers/apiConsumersController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect, requireRole("admin"));

router.get("/", c.list);
router.post("/", c.create);
router.post("/:id/revoke", c.revoke);
router.delete("/:id", c.remove);

module.exports = router;
