const mongoose = require("mongoose");
const Counter = require("./count");
const { optional } = require("joi");
const roleSchema = new mongoose.Schema({
  roleId: String,
  status: {
    type: Boolean,
    default: true,
  },
  role: {
    type: String,
    default: "",
  },
  designation: {
    type: String,
    default: "",
  },
  happens:String,
  processType: {
    type: String,
    
    
  },
  experience: {
    type: String,
    
  },
  mandatorySkills: {
    type: [String],
    default: [],
  },
  optionalSkills: {
    type: [String],
    default: [],
  },
  qualification: {
    type: [String],
    default: [],
  },
  shift: {
    type: String,
    default: "",
  },
  salary: {
    type: String,
    default: "",
  },
  cabFacility: {
    type: String,
    
  },
  location: {
    type: [String],
    default: [],
  },
  area: {
    type: String,
    default: "",
  },
  bond: {
    type: String,
    default: 0,
  },
  ageCriteria: {
    type: String,
    default: "",
  },
  processWorkType:String,
  period: {
    type: String,
    
    
  },
  otherDocs: {
    type: String,
    default: "",
  },
  originalJD: {
    type: String,
    default: "",
  },
  faqs: {
    type: String,
    default: "",
  },
  rejectionReasons: {
    type: [String],
    default: [],
  },
  billingTerm:Number,
  endTrackingDate:Number,
  industry:String,
  aboutCompany:String

});
roleSchema.pre("save", function (next) {
  if ("invalid" == this.name) {
    return next(new Error("#sadpanda"));
  }
  next();
});
roleSchema.pre("save", function (next) {
  if (this.isNew) {
    var doc = this;
    Counter.findByIdAndUpdate(
      { _id: "roleCounter" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )
      .then(function (count) {
        doc.roleId = "ROL" + String(count.seq).padStart(5, "0");
        next();
      })
      .catch(function (error) {
        throw error;
      });
  } else {
    next();
  }
});
module.exports = new mongoose.model("Role", roleSchema);
