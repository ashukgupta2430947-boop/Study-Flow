const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema({
  name: String,
  duration: String,
  color: String,
  topics: [String]
});

module.exports = mongoose.model("Subject", SubjectSchema);