const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    role: {
      type: String,
      enum: ['admin', 'candidate', 'recruiter'],
      default: 'candidate',
      required: true
    },

    // ✅ Common Profile Fields
    fullName: String,
    phone: String,
    bio: String,
    location: String,
    profileImage: {
      type: String,
    },

    // ✅ Recruiter-Specific Fields
    company: String,
    designation: String,

    // ✅ Candidate-Specific Fields
    linkedin: String,
    github: String,
    portfolio: String,
  },
  {
    timestamps: true
  }
);

// Use email as the login field
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', userSchema);
