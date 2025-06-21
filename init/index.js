const mongoose = require("mongoose");
const userData = require("./userData.js");
const User = require("../models/user.js");
const jobData = require("./jobData.js");
const Job = require("../models/job.js");

const Mongo_URL = "mongodb://127.0.0.1:27017/HireBench";

// Connect to MongoDB and initialize database
async function main() {
  try {
    await mongoose.connect(Mongo_URL);
    console.log("Connected to DB");
    await initDB();
    console.log("Database initialization complete.");
    process.exit();
  } catch (err) {
    console.error("Error initializing DB:", err);
    process.exit(1);
  }
}

// Seed function: create admin user and jobs
async function initDB() {
  // Clear existing data
  await User.deleteMany({});
  await Job.deleteMany({});

  // Create admin user (use passport-local-mongoose to hash password)
  const adminUser = new User({
    username: "uddhav_nagar",
    email: "student@gamil.com",
    role: "admin"
  });
  // Register will handle password hashing
  await User.register(adminUser, "adminpass");

  const adminId = adminUser._id;

  // Prepare jobs array, assigning postedBy and timestamps
  const jobsWithAdmin = jobData.data.map(job => ({
    ...job,
    postedBy: adminId,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  // Insert jobs
  await Job.insertMany(jobsWithAdmin);
}

// Run the script
main();
