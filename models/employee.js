const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Counter = require("./count");
const employeeSchema = mongoose.Schema({
  employeeId: String,
  name: String,
  password: {
    type: String,
  },
  email: { type: String, unique: true },
  employeeType: {
    type: String,
  },
  mobile: { type: [String], unique: true },
  parentMobile: String,
  gender: {
    type: String,
    enum: {
      values: ["Male", "Female", "Other"],
    },
    default:"Male",
  },
  currentAddress: String,
  permanentAddress: String,
  DOB: Date,
  DOJ: Date,
  documentation: {
    type: Boolean,
    default: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
});

employeeSchema.pre("save", async function () {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

employeeSchema.methods.createJWT = function () {
  return jwt.sign(
    {
      userid: this._id,
      userMail: this.email,
      employeeType: this.employeeType,
      status: this.status,
      name: this.name,
    },
    process.env.SECRET,
    {
      expiresIn: "12h",
    }
  );
};

employeeSchema.methods.checkPassword = async function (providedPassword) {
  const match = await bcrypt.compare(providedPassword, this.password);
  return match;
};

employeeSchema.pre("insertMany", async function (next, docs) {
  for (const doc of docs) {
    if (!doc.password) {
      const salt = await bcrypt.genSalt(10);
      doc.password = await bcrypt.hash("TPP@Pass", salt);
      
      
    }
  }
  next();
});

module.exports = new mongoose.model("Employee", employeeSchema);
