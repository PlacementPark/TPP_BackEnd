const mongoose = require("mongoose");
const company = require("./company");

const remarksSchema = mongoose.Schema(
   {
      candidateId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Candidate",
      },
      employeeId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Employee",
      },
      companyId:{
         type: mongoose.Schema.Types.ObjectId,
         ref: "Company",
      },
      remarks: String,
   },
   {
      timestamps: true,
   }
);

module.exports = new mongoose.model("Remarks", remarksSchema);
