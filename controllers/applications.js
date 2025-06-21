const Application = require("../models/application");
const Job = require("../models/job");
const {calculateMatchScore,extractResumeText} = require("../utils/resumeScorer"); 

module.exports.createApplication = async (req, res) => {
  const { jobId } = req.params;
  const { resume, message } = req.body;

  const job = await Job.findById(jobId); // ✅ First get the job
  if (!job) {
    req.flash("error", "Job not found.");
    return res.redirect("/jobs");
  }

  const resumeText = extractResumeText(resume);
  const jobText = job.description || '';
  const score = calculateMatchScore(resumeText, jobText);

  const application = new Application({
    job: jobId,
    candidate: req.user._id,
    resume,
    message,
    score,
  });

  await application.save();
  req.flash("success", "Applied to job successfully!");
  res.redirect(`/applications/${application._id}`);
};


module.exports.listMyApplications = async (req, res) => {
  const { status } = req.query;

   const filter = { candidate: req.user._id };
  if (status && status !== "") {
    filter.status = status;
  }

  const applications = await Application.find(filter)
    .populate("job")
    .populate("resume")
    .sort({ createdAt: -1 });

  res.render("applications/index", { applications, selectedStatus: status || "" });
};

module.exports.listReceivedApplications = async (req, res) => {
  const recruiterId = req.user._id;
  const { search, sortScore, status, page = 1 } = req.query;

  const limit = 10;
  const pageNumber = parseInt(page) || 1;
  const skip = (pageNumber - 1) * limit;

  // Find all jobs posted by this recruiter
  const jobs = await Job.find({ postedBy: recruiterId });
  const jobIds = jobs.map(job => job._id);

  // Find all applications to those jobs
  let applications = await Application.find({ job: { $in: jobIds } })
    .populate("candidate", "username email")
    .populate("job", "title")
    .populate("resume", "score")
    .lean();

  // Apply search filter (case-insensitive)
  if (search) {
    const q = search.toLowerCase();
    applications = applications.filter(app => {
      const title = app.job?.title?.toLowerCase() || "";
      const name = app.candidate?.username?.toLowerCase() || "";
      const email = app.candidate?.email?.toLowerCase() || "";
      return title.includes(q) || name.includes(q) || email.includes(q);
    });
  }

  // Apply status filter if provided
  if (status) {
    applications = applications.filter(app => app.status === status);
  }

  // Sort by score
  if (sortScore === 'asc') {
    applications.sort((a, b) => (a.resume?.score || 0) - (b.resume?.score || 0));
  } else if (sortScore === 'desc') {
    applications.sort((a, b) => (b.resume?.score || 0) - (a.resume?.score || 0));
  }

  const totalApplications = applications.length;
  const totalPages = Math.ceil(totalApplications / limit);
  const paginatedApplications = applications.slice(skip, skip + limit);

  res.render("recruiter/applications", {
    applications: paginatedApplications,
    search,
    sortScore,
    status,
    page: pageNumber,
    totalPages,
    totalApplications
  });
};


module.exports.showApplicationDetails = async (req, res) => {
  const { applicationId } = req.params;
  const application = await Application.findById(applicationId)
    .populate("job")
    .populate("candidate")
    .populate("resume");

  if (!application) {
    req.flash("error", "Application not found.");
    return res.redirect("/jobs");
  }

  res.render("applications/show", { application });
};

module.exports.deleteApplication = async (req, res) => {
  const { applicationId } = req.params;
  await Application.findByIdAndDelete(applicationId);
  req.flash("success", "Application withdrawn successfully.");
  res.redirect("/applications/my");
};

module.exports.manage = async (req, res) => {
  const { jobId } = req.params;
  const applications = await Application.find({ job: jobId })
    .populate("candidate")
    .populate("resume");

  res.render("applications/manage", { applications });
};