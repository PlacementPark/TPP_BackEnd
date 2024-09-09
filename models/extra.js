const mongoose = require("mongoose");
const extraSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  data: [String],
});

module.exports = new mongoose.model("Extra", extraSchema);
