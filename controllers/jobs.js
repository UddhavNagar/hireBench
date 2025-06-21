const Job = require("../models/job");
const Application = require("../models/application");
const Resume = require("../models/resume");

module.exports.index = async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;

  const query = search
    ? {
        $or: [
          { title: new RegExp(search, "i") },
          { company: new RegExp(search, "i") },
          { location: new RegExp(search, "i") },
        ],
      }
    : {};

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Total jobs for pagination count
  const totalJobs = await Job.countDocuments(query);

  // Paginated jobs
  const allJobs = await Job.find(query)
    .skip(skip)
    .limit(parseInt(limit));

  let appliedJobIds = [];

  if (req.user && req.user.role === "candidate") {
    const applications = await Application.find({ candidate: req.user._id }).select("job");
    appliedJobIds = applications.map(app => app.job.toString());
  }

  const totalPages = Math.ceil(totalJobs / limit);

  res.render("jobs/index.ejs", {
    allJobs,
    appliedJobIds,
    search,
    currentPage: parseInt(page),
    totalPages
  });
};

module.exports.renderNewForm = (req, res) => {
    res.render("jobs/new.ejs");
}

module.exports.createJob = async (req, res) => {
  const { title, company, location, salary, description } = req.body.job;

  const newJob = new Job({
    title,
    company,
    location,
    salary,
    description,
    postedBy: req.user._id,
  });

  if (req.file) {
    newJob.logoImage = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };
  }

  await newJob.save();
  req.flash("success", "New job created");
  res.redirect("/jobs");
};


module.exports.updateJob = async (req, res) => {
  const { title, company, location, salary, description } = req.body.job;

  const updateData = {
    title,
    company,
    location,
    salary,
    description,
    updatedAt: new Date()
  };

  if (req.file) {
    updateData.logoImage = {
      data: req.file.buffer,
      contentType: req.file.mimetype
    };
  }

  await Job.findByIdAndUpdate(req.params.jobId, updateData);
  req.flash("success", "Job updated");
  res.redirect(`/jobs/${req.params.jobId}`);
};



module.exports.showJobDetails = async (req, res) => {
  const { jobId } = req.params;
  const job = await Job.findById(jobId).populate("postedBy");
  if (!job) {
    req.flash("error", "This Job does not exist");
    return res.redirect("/jobs");
  }

  let resumes = [];
  let hasApplied = false;

  if (req.user && req.user.role === "candidate") {
    resumes = await Resume.find({ owner: req.user._id });
    const application = await Application.findOne({
      job: jobId,
      candidate: req.user._id,
    });
    hasApplied = !!application;
  }

  res.render("jobs/show", { job, resumes, hasApplied , originalUrl: req.originalUrl });
};

module.exports.renderEditForm = async (req, res) => {
  const { jobId } = req.params;
  const job = await Job.findById(jobId);
  if (!job) {
    req.flash("error", "This Job does not exist");
    return res.redirect("/jobs");
  }
  res.render("jobs/edit", { job });
};


module.exports.deleteJob =  async (req, res) => {
  await Job.findByIdAndDelete(req.params.jobId);
  req.flash("success", "Job deleted");

  // Redirect back to where the user came from, or fallback
  const redirectUrl = req.get("Referer") || "/jobs";
  res.redirect(redirectUrl);
};

