const express = require("express");
const router = express.Router();
const {
   addRemarks,
   getCandidateRemarks,
   getCompanyRemarks,
} = require("../controllers/remarks");

router.route("/").post(addRemarks);
router.route("/candidate/:candidateId").get(getCandidateRemarks);
router.route("/company/companyId").get(getCompanyRemarks);
module.exports = router;
