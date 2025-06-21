const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String },
    salary: Number,
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    logoUrl: {
      type: String, 
    },
    logoImage: {
      data: Buffer,
      contentType: String,
    },
  },
  {
    timestamps: true, // includes createdAt and updatedAt
  }
);

module.exports = mongoose.model('Job', jobSchema);
