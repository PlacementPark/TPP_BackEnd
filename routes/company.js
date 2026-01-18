const express = require("express");
const router = express.Router();

const {
   getAllCompanies,
   addCompany,
   getRoles,
   addCompanyRoles,
   deleteCompany,
   getCompanyUseType,
   getCompanyCounts,
   bulkInsert,
   getCompany,
   getRole,
   updateRole,
   editCompany,
   checkNumber,
   deleteRole,
   getCompanyAndRoleNamesForCandidate,
   exportSelectedCompaniesExcel,
   searchCompany,
} = require("../controllers/company");

router.route("/").get(getAllCompanies).post(addCompany);
router.route("/:id/roles").get(getRoles);
router.route("/:id").patch(addCompanyRoles).delete(deleteCompany);
router.route("/company/:id").get(getCompany).patch(editCompany);
router.route("/companyType").get(getCompanyUseType);
router.route("/candidateCompanyType").get(getCompanyAndRoleNamesForCandidate);
router.route("/counts").get(getCompanyCounts);
router.route("/bulkinsert").post(bulkInsert);
router
   .route("/:companyId/role/:roleId")
   .get(getRole)
   .patch(updateRole)
   .delete(deleteRole);
router.route("/excelExport").post(exportSelectedCompaniesExcel);
router.route("/mobile/:number").get(checkNumber);
router.route("/search").post(searchCompany);
module.exports = router;
