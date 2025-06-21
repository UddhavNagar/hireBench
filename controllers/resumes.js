const Resume = require("../models/resume");
const Job = require("../models/job")
const {calculateMatchScore,extractResumeText} = require("../utils/resumeScorer"); 

module.exports.listUserResumes = async (req, res) => {
    const resumes = await Resume.find({ owner: req.user._id });
    res.render("resumes/index", { resumes });
}

module.exports.renderNewResumeForm = (req, res, next) => {
  try {
    res.render("resumes/new");
  } catch (e) {
    console.log("Caught rendering error:", e);
    next(e); // Let Express handle it
  }
};

module.exports.createResume = async (req, res) => {
    const resume = new Resume(req.body.resume);
    resume.owner = req.user._id;
    await resume.save();
    req.flash("success", "Resume created successfully!");
    res.redirect(`/resumes/${resume._id}`);
}

module.exports.showResume = async (req, res) => {
    const { resumeId } = req.params;
    const resume = await Resume.findById(resumeId).populate("owner");
    const score = req.query.score;

    if (!resume) {
        req.flash("error", "Resume not found");
        return res.redirect("/resumes");
    }

    const userId = req.user._id;
    const jobs = await Job.find({});
    const isOwner = resume.owner.equals(userId);
    const isRecruiter = req.user.role === "recruiter";
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isRecruiter && !isAdmin) {
        req.flash("error", "You are not authorized to view this resume");
        return res.redirect("/resumes");
    }

    // === New addition: Create a map of jobId -> job ===
    const jobMap = {};
    for (let job of jobs) {
        jobMap[job._id.toString()] = job;
    }

    res.render("resumes/show", {
        resume,
        jobs,
        jobMap, // pass jobMap for scoreMap rendering
        isOwner,
        score
    });
};

module.exports.renderEditResumeForm = async (req, res) => {
    const { resumeId } = req.params;
    const resume = await Resume.findById(resumeId);
    if (!resume || !resume.owner.equals(req.user._id)) {
        req.flash("error", "You are not authorized to edit this resume");
        return res.redirect("/resumes");
    }
    resume.projects = resume.projects || [];
    res.render('resumes/edit', { resume });
}

module.exports.updateResume = async (req, res) => {
    const { resumeId } = req.params;
    const resume = await Resume.findById(resumeId);
    if (!resume || !resume.owner.equals(req.user._id)) {
        req.flash("error", "You are not authorized to update this resume");
        return res.redirect("/resumes");
    }
    await Resume.findByIdAndUpdate(resumeId, req.body.resume);
    req.flash("success", "Resume updated successfully!");
    res.redirect(`/resumes/${resumeId}`);
} 

module.exports.deleteResume = async (req, res) => {
  const { resumeId } = req.params;

  const resume = await Resume.findById(resumeId);
  if (!resume) {
    req.flash("error", "Resume not found.");
    return res.redirect("back");
  }

  await Resume.findByIdAndDelete(resumeId);
  req.flash("success", "Resume deleted successfully!");

  const redirectUrl = req.get("Referer") || "/resumes";
  res.redirect(redirectUrl);
};



module.exports.scoreResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { jobId } = req.body;

    const resume = await Resume.findById(resumeId).populate("owner");
    const job = await Job.findById(jobId);

    if (!resume || !job) {
      req.flash("error", "Invalid resume or job.");
      return res.redirect(`/resumes/${resumeId}`);
    }

    const resumeText = extractResumeText(resume);
    const jobText = job.description || '';
    const score = calculateMatchScore(resumeText, jobText);

    resume.score = score;
    if (!resume.scoreMap) resume.scoreMap = {};
    resume.scoreMap[jobId.toString()] = score;

    await resume.save();

    req.flash("success", `Score calculated: ${score}/100`);
    return res.redirect(`/resumes/${resumeId}`);
  } catch (err) {
    console.error("Scoring Error:", err);
    req.flash("error", "Something went wrong while scoring the resume.");
    return res.redirect("back");
  }
};


module.exports.showScoredResumes = async (req, res) => {
  const resumes = await Resume.find({ score: { $ne: null } })
    .populate("owner")
    .sort({ score: -1 }); // highest score first

  // mark top-scored resume for UI highlighting
  resumes.forEach((resume, index) => {
    resume._isTop = index === 0;
  });

  res.render("resumes/scores", { resumes });
};


