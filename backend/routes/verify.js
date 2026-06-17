// Public certificate verification — no authentication.
const express = require("express");
const router = express.Router();
const c = require("../controllers/verifyController");

router.get("/:serial", c.verify);

module.exports = router;
