const mongoose = require("mongoose");
const { roleSchema } = require("./role");
const Counter = require('./count')

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, "Please Provide Company Name"],
  },
  companyId: String,
  HR: [{
    HRName: {
      type: String,
    },
    HRMobile: {
      type: [String],
      validate: [
        (value) => {
          return value.length != 10;
        },
        "Cannot have more than 10 Mobile Numbers",
      ],
      unique: true,
    },
    HREmail: {
      type: String,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide valid Email",
      ],
    },
    HRDesignation:String,
    HRLocation:String
  }],

  about: {
    type: String,
    default: "",
  },
  companyType: String,
  remarks: {
    type: String,
    default: "",
  },
  response: {
    type: String,
    default: "No Response",
  },
  empanelled: {
    type: Boolean,
    default: false,
  },
  paymentTerms:Number,
  roles: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
  },
});

companySchema.pre("save", function (next) {
  if (this.isNew) {
    var doc = this;
    Counter
      .findByIdAndUpdate(
        { _id: "companyCounter" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      )
      .then(function (count) {
        doc.companyId = "COM" + String(count.seq).padStart(5, "0");
        next();
      })
      .catch(function (error) {
        throw error;
      });
  } else {
    next();
  }
});

companySchema.pre("insertMany", async function(next,docs){
  try{
    for( const doc of docs){
      const counter = await Counter.findByIdAndUpdate(
        { _id: "companyCounter" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      )
      doc.companyId = "COM" + String(counter.seq).padStart(5, "0");
    }
    next()
  }catch(err){
    throw err
  }
})

module.exports = new mongoose.model("Company", companySchema);
