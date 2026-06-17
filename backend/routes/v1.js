// Public v1 API — consumed by other systems with an X-API-Key. Read-only.
const express = require("express");
const router = express.Router();
const c = require("../controllers/publicApiController");
const { apiKeyAuth, requireScope } = require("../middleware/apiKey");

router.use(apiKeyAuth);

router.get("/certifications", requireScope("certifications:read"), c.certifications);
router.get("/certifications/:serial", requireScope("certifications:read"), c.verify);
router.get("/courses", requireScope("certifications:read"), c.courses);

module.exports = router;
