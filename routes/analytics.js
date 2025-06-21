const express = require("express");
const router = express.Router();
const Job = require("../models/job");
const Resume = require("../models/resume");

router.get("/", async (req, res) => {
  const selectedSkill = req.query.skill || null;

  const skillSet = [
    'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Next.js',
    'Node.js', 'Express', 'MongoDB', 'SQL', 'PostgreSQL', 'MySQL',
    'Python', 'Django', 'Flask', 'Java', 'Spring Boot',
    'HTML', 'CSS', 'SASS', 'Tailwind', 'Bootstrap',
    'C++', 'C#', 'Go', 'Rust',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD',
    'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning',
    'NLP', 'Pandas', 'NumPy', 'Scikit-learn', 'Data Science',
    'Git', 'GraphQL', 'REST API'
  ];

  const jobs = await Job.find({});
  const skillCountMap = {};
  const skillToJobsMap = {};

  jobs.forEach(job => {
    const description = job.description?.toLowerCase() || "";
    skillSet.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (description.includes(skillLower)) {
        skillCountMap[skill] = (skillCountMap[skill] || 0) + 1;
        if (!skillToJobsMap[skill]) skillToJobsMap[skill] = [];
        skillToJobsMap[skill].push(job);
      }
    });
  });

  const jobSkills = Object.entries(skillCountMap)
    .map(([skill, count]) => ({ _id: skill, count }))
    .sort((a, b) => b.count - a.count);

  const resumeSkills = await Resume.aggregate([
    { $unwind: "$skills" },
    { $group: { _id: "$skills", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const jobsForSkill = selectedSkill && skillToJobsMap[selectedSkill]
    ? skillToJobsMap[selectedSkill]
    : [];
  const totalResumes = await Resume.countDocuments();
  const totalSkills = await Resume.aggregate([
    { $project: { skillCount: { $size: "$skills" } } },
    { $group: { _id: null, avg: { $avg: "$skillCount" } } }
  ]);

  const avgSkillsPerResume = totalSkills.length > 0 ? totalSkills[0].avg.toFixed(2) : 0;
  const topResumeSkills = await Resume.aggregate([
    { $match: { score: { $gte: 70 } } },
    { $unwind: "$skills" },
    { $group: { _id: "$skills", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);


  res.render("analytics/index", {
    jobSkills,
    resumeSkills,
    selectedSkill,
    jobsForSkill,
    skillSet,
    avgSkillsPerResume,
    topResumeSkills
  });
});

module.exports = router;
