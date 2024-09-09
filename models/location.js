const mongoose = require("mongoose");
const locationSchema = new mongoose.Schema({
    name:String
})

module.exports = new mongoose.model("Location",locationSchema)