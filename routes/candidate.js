const express = require("express");
const router = express.Router();

const {
  getAllCandidates,
  getCandidate,
  addCandidate,
  deleteCandidate,
  updateCandidate,
  getAssessmentCounts,
  bulkInsert,searchCandidate,getPotentialLeads,assignRecruiter,assignSearch,checkNumber,getAllByClass
} = require("../controllers/candidate");

router.route("/").get(getAllCandidates).post(addCandidate);
router
  .route("/:id")
  .get(getCandidate)
  .patch(updateCandidate)
  .delete(deleteCandidate);
router.route("/values/counts").get(getAssessmentCounts);
router.route("/bulkinsert").post(bulkInsert)
router.route("/search").post(searchCandidate)
router.route("/candidate/potentialleads").post(getPotentialLeads)
router.route("/candidate/assign").post(assignRecruiter).get(assignSearch)
router.route("/candidate/assignSearch").post(assignSearch);
router.route('/mobile/:number').get(checkNumber)
router.route("/data/:type").get(getAllByClass);
module.exports = router;
