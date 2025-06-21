// utils/cleanupOrphanData.js
const Resume = require("../models/resume");
const Job = require("../models/job");
const Application = require("../models/application");
const User = require("../models/user");

async function cleanupOrphanData() {
  try {
    console.log("🧹 Starting orphan data cleanup...");

    const existingUsers = await User.find({}, "_id");
    const validUserIds = new Set(existingUsers.map(u => u._id.toString()));

    const resumes = await Resume.find({});
    for (let resume of resumes) {
      if (!validUserIds.has(resume.candidate?.toString())) {
        console.log("Deleting orphan resume:", resume.title);
        await resume.deleteOne();
      }
    }

    const jobs = await Job.find({});
    for (let job of jobs) {
      if (!validUserIds.has(job.postedBy?.toString())) {
        console.log("Deleting orphan job:", job.title);
        await job.deleteOne();
      }
    }

    const applications = await Application.find({});
    for (let app of applications) {
      const candidateValid = validUserIds.has(app.candidate?.toString());
      const jobExists = await Job.exists({ _id: app.job });
      if (!candidateValid || !jobExists) {
        console.log("Deleting orphan application:", app._id.toString());
        await app.deleteOne();
      }
    }

    console.log("✅ Orphan data cleanup complete.");
  } catch (err) {
    console.error("❌ Cleanup error:", err);
  }
}

module.exports = cleanupOrphanData;
