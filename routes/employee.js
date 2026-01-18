const express = require("express");
const router = express.Router();

const {
   getAllEmployees,
   getEmployee,
   addEmployee,
   updateEmployee,
   deleteEmployee,
   bulkInsert,
   getEmployeeCounts,
   getEmployeesByType,
   updatePassword,
   checkId,
   checkNumber,
   checkMail,
   searchEmployee,
} = require("../controllers/employee");

router.route("/").get(getAllEmployees).post(addEmployee);
router
  .route("/:id")
  .get(getEmployee)
  .patch(updateEmployee)
  .delete(deleteEmployee);
  router.route("/bulkinsert").post(bulkInsert)
  router.route("/counts/counts").get(getEmployeeCounts)
  router.route("/employeeType/:type").get(getEmployeesByType)
  router.route("/:id/password").patch(updatePassword)
router.route("/id/:id").get(checkId);
router.route("/mobile/:number").get(checkNumber);
router.route("/search").post(searchEmployee);
router.route("/mail/:email").get(checkMail);
module.exports = router;
