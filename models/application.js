const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resume",
    required: true
  },
  score: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ["Pending", "Shortlisted", "Interview", "Rejected"],
    default: "Pending"
  },
  note: String,
  message: String,
  appliedAt: { type: Date, default: Date.now }
  },{ timestamps: true }
); 


module.exports = mongoose.model("Application", applicationSchema);
