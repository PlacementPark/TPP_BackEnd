const express = require("express");
const router = express.Router();
const {
   getSkills,
   addSkills,
   getAll,
   bulkUpdate,
   addLocations,
   getLocations,
   addQualifications,
   getQualifications,
   getLanguages,
   addLanguages,
} = require("../controllers/extra");

router.route("/skills").get(getSkills).patch(addSkills);
router.route("/locations").get(getLocations).patch(addLocations);
router.route("/qualifications").get(getQualifications).patch(addQualifications);
router.route("/languages").get(getLanguages).patch(addLanguages);
router.route("/all").get(getAll).post(bulkUpdate);

module.exports = router;
