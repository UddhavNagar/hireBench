// utils/resumeScorer.js
function extractResumeText(resume) {
  const skills = resume.skills?.join(" ") || "";
  const education = resume.education?.map(e => `${e.degree} ${e.field}`).join(" ") || "";
  const experience = resume.experience?.map(e => `${e.role} ${e.description}`).join(" ") || "";
  const summary = resume.summary || "";

  return [skills, education, experience, summary].join(" ").toLowerCase();
}


function calculateMatchScore(resumeText, jobDesc) {
  const resumeContent = (resumeText || "").toLowerCase();
  const jobDescription = (jobDesc || "").toLowerCase();

  const resumeWords = new Set(resumeContent.split(/\W+/));
  const jobWords = new Set(jobDescription.split(/\W+/));

  if (jobWords.size === 0) return 0;

  const matched = [...jobWords].filter(word => resumeWords.has(word));
  return Math.round((matched.length / jobWords.size) * 100);
}

module.exports = {
  extractResumeText,
  calculateMatchScore
};
