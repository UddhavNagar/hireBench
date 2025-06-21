// init/seed.js
const mongoose = require("mongoose");
const User = require("../models/user");
const Job = require("../models/job");
const Resume = require("../models/resume");
const Application = require("../models/application");
const { calculateMatchScore, extractResumeText } = require("../utils/resumeScorer");

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

const MONGO_URL = "mongodb://127.0.0.1:27017/HireBench";

async function seed() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✔ Connected to DB");

    await Promise.all([
      User.deleteMany({}),
      Job.deleteMany({}),
      Resume.deleteMany({}),
      Application.deleteMany({}),
    ]);
    console.log("✔ Cleared all collections");

    // 1. Admin
    console.log("➡ Registering admin...");
    try {
      const admin = new User({
        username: "uddhav_nagar",
        email: "student@gmail.com",
        role: "admin",
      });
      await User.register(admin, "adminpass");
      console.log("✔ Admin created");
    } catch (e) {
      console.error("❌ Admin registration failed:", e.message);
    }

    // 2. Recruiters
    const recruiterEmails = [
      "recruiter1@hirebench.com",
      "recruiter2@hirebench.com",
      "recruiter3@hirebench.com",
      "pooja@hirebench.com",
    ];
    const recruiters = [];
    console.log("➡ Registering recruiters...");
    for (const email of recruiterEmails) {
      try {
        const user = new User({
          username: email.split("@")[0],
          email,
          role: "recruiter",
        });
        await User.register(user, email);
        console.log("   ✔", email);
        recruiters.push(user);
      } catch (e) {
        console.error("   ❌", email, e.message);
      }
    }
    console.log(`✔ ${recruiters.length}/${recruiterEmails.length} recruiters registered`);

    // 3. Candidates
    const candidateEmails = [
      "pravin@gmail.com",
      "alice@gmail.com",
      "bob@gmail.com",
      "carol@yahoo.com",
      "dave@yahoo.com",
      "eve@outlook.com",
    ];
    const candidates = [];
    console.log("➡ Registering candidates...");
    for (const email of candidateEmails) {
      try {
        const user = new User({
          username: email.split("@")[0],
          email,
          role: "candidate",
        });
        await User.register(user, email);
        console.log("   ✔", email);
        candidates.push(user);
      } catch (e) {
        console.error("   ❌", email, e.message);
      }
    }
    console.log(`✔ ${candidates.length}/${candidateEmails.length} candidates registered`);

    // 4. Jobs
    console.log("➡ Creating jobs...");
    const titles = [
      "Full Stack Developer", "Frontend Engineer", "Backend Developer",
      "DevOps Engineer", "Data Scientist", "Mobile App Developer",
      "UI/UX Designer", "Product Manager", "QA Engineer",
      "Cloud Architect", "Machine Learning Engineer", "Business Analyst",
      "Security Analyst", "Database Administrator", "Technical Writer",
    ];
    const sampleJobs = titles.map((title, i) => {
      let skillsDesc = "";

      if (title.toLowerCase().includes("frontend")) skillsDesc = "React HTML CSS JavaScript";
      else if (title.toLowerCase().includes("backend")) skillsDesc = "Node.js Express MongoDB";
      else if (title.toLowerCase().includes("full stack")) skillsDesc = "React Node.js Express MongoDB";
      else if (title.toLowerCase().includes("devops")) skillsDesc = "AWS Docker CI/CD Jenkins";
      else if (title.toLowerCase().includes("data")) skillsDesc = "Python Machine Learning Pandas";
      else if (title.toLowerCase().includes("mobile")) skillsDesc = "React Native Flutter Android";
      else if (title.toLowerCase().includes("ui/ux")) skillsDesc = "Figma AdobeXD Sketch";
      else if (title.toLowerCase().includes("qa")) skillsDesc = "Selenium Cypress Testing";
      else if (title.toLowerCase().includes("cloud")) skillsDesc = "AWS Azure GCP Terraform";
      else skillsDesc = "General software development skills";

      return {
        title,
        company: `Company${i + 1}`,
        location: ["Remote", "Bangalore", "Hyderabad", "Delhi"][i % 4],
        description: `We are hiring a ${title}. Must have experience with ${skillsDesc}.`,
        postedBy: recruiters[i % recruiters.length]?._id,
        salary: 700000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    let createdJobs = [];
    try {
      createdJobs = await Job.insertMany(sampleJobs);
      console.log(`✔ ${createdJobs.length} jobs created`);
    } catch (e) {
      console.error("❌ Jobs creation failed:", e.message);
    }

    // 5. Resumes
    console.log("➡ Creating resumes...");
    const sampleResumes = [];
    for (const cand of candidates) {
      for (let j = 1; j <= 2; j++) {
        sampleResumes.push({
          title: `${cand.username}_resume_${j}`,
          summary: "This is a summary.",
          skills: ["JavaScript", "Node.js", "React"],
          education: [{ institution: "Institute", degree: "BTech", field: "CSE", startYear: 2020, endYear: 2024 }],
          experience: [{ company: "XYZ Corp", role: "Intern", startDate: new Date("2023-06-01"), endDate: new Date("2023-08-31"), description: "Did work" }],
          fileUrl: `https://example.com/resumes/${cand.username}_resume_${j}.pdf`,
          owner: cand._id,
          candidate: cand._id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    let createdResumes = [];
    try {
      createdResumes = await Resume.insertMany(sampleResumes);
      console.log(`✔ ${createdResumes.length} resumes created`);
    } catch (e) {
      console.error("❌ Resumes creation failed:", e.message);
    }

    // 6. Applications
    console.log("➡ Creating applications...");
    const sampleApps = [];
    for (const cand of candidates) {
      const theirResumes = createdResumes.filter((r) => r.owner.equals(cand._id));
      const shuffledJobs = [...createdJobs].sort(() => 0.5 - Math.random());
      for (let k = 0; k < 3; k++) {
        const job = shuffledJobs[k];
        const resume = theirResumes[k % theirResumes.length];

        const resumeText = extractResumeText(resume); // text from resume.skills, etc.
        const jobText = job?.description || '';

        const score = calculateMatchScore(resumeText, jobText);

        sampleApps.push({
          job: job?._id,
          candidate: cand._id,
          resume: resume?._id,
          message: "Looking forward to this role.",
          appliedAt: new Date(),
          score,
        });
      }
    }
    try {
      const createdApps = await Application.insertMany(sampleApps);
      console.log(`✔ ${createdApps.length} applications created`);
    } catch (e) {
      console.error("❌ Applications creation failed:", e.message);
    }

    console.log("🎉 Seeding Complete!");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
}

seed();
