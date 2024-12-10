const mongoose = require("mongoose");
const Location = require('./location')
const Counter = require("./count");
const candidateSchema = mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Please provide name"],
  },
  mobile: {
    type: [String],
    required: [true, "Please provide Mobile Number"],
    validate: {
      validator: function (val) {
        return val.every((v) => /^[0-9]\d{9}$/.test(v));
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
    unique: true,
  },
  email: {
    type: [String],
   
  },
  candidateId: String,
  homeTown: {
    type: String,
  },
  rate: Number,
  currentCity: {
    type: String,
  },
  qualifications: {
    type: [
      {
        qualification: String,
        YOP: String,
      },
    ],
  },
  languages: {
    type: [
      {
        language: String,
        remarks: String,
        level: {
          type: String,

          default: "Poor",
        },
      },
    ],
  },
  skills: [String],
  experience: {
    type: [
      {
        companyName: String,
        role: String,
        salary: Number,
        startDate: Date,
        endDate: Date,
        experience: Number,
      },
    ],
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
  },
  interviewDate: Date,
  remarks: String,
  interviewStatus: {
    type: String,
  },
  select: {
    type: String,
  },

  EMP_ID: {
    type: String,
    // required: [true, "Need to provide Employee ID"],
  },
  onboardingDate: Date,
  nextTrackingDate: Date,
  billingDate: Date,
  invoiceNumber: String,
  invoiceDate: Date,
  l1Assessment: {
    type: String,
  },
  l2Assessment: {
    type: String,
  },
  assignedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
  },
  createdByEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
  },
});

candidateSchema.pre("save", function (next) {
  if (this.isNew) {
    var doc = this;
    Counter.findByIdAndUpdate(
      { _id: "candidateCounter" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )
      .then(function (count) {
        doc.candidateId = "CAN" + String(count.seq).padStart(7, "0");
        next();
      })
      .catch(function (error) {
        throw error;
      });
  } else {
    next();
  }
});

candidateSchema.pre("insertMany", async function (next, docs) {
  try {
    for (const doc of docs) {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "candidateCounter" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      doc.candidateId = "CAN" + String(counter.seq).padStart(7, "0");
    }
    next();
  } catch (err) {
    throw err;
  }
});

module.exports = new mongoose.model("Candidate", candidateSchema);
