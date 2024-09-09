const express = require("express");
const router = express.Router();

const { status } = require("../controllers/status");
router.route("/").get(status);
module.exports = router;