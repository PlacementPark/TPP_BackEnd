const mongoose = require("mongoose");
const skillSchema = new mongoose.Schema({
  name: String,
});

module.exports = new mongoose.model("Skill", skillSchema);
