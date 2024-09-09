const express = require("express");
const router = express.Router();
const { getSkills,addSkills } = require("../controllers/skill");

router.route("/").get(getSkills).post(addSkills);

module.exports = router;
