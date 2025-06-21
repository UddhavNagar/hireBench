const ExpressError = require("./utils/ExpressError.js");
const { jobSchema } = require("./schema.js");  // ✅ Correct import
const Job = require("./models/job.js");
const Resume = require("./models/resume");
const upload = require("./utils/uploadConfig");

module.exports.uploadLogo = upload.single("logoImage");
module.exports.uploadProfileImage = upload.single("profileImage")


module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    if (req.method === "GET") {
      req.session.returnTo = req.originalUrl;
    }
    req.flash("error", "You must be logged in first!");
    return res.redirect("/users/login");
  }
  next();
};


module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.validateJob = (req, res, next) => {
  // Validate the flat object
  const { error } = jobSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const msg = error.details.map(el => el.message).join(", ");
    throw new ExpressError(400, msg);
  }
  next();
};


module.exports.isJobOwner = async (req, res, next) => {
  const { jobId } = req.params;
  const job = await Job.findById(jobId);
  
  if (!job) {
    req.flash("error", "Job not found.");
    return res.redirect("/jobs");
  }

  // Let admin bypass this check
  if (req.user.role === "admin") {
    return next();
  }

  // Only recruiter must be the owner
  if (!job.postedBy.equals(req.user._id)) {
    req.flash("error", "You are not the owner of this job.");
    return res.redirect(`/jobs/${jobId}`);
  }

  next();
};


module.exports.isRecruiterOrAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "Please login first.");
    return res.redirect("/login");
  }

  const { role } = req.user;
  if (role === 'admin' || role === 'recruiter') {
    return next();
  }

  req.flash("error", "You do not have permission to perform this action.");
  res.redirect("/jobs");
};



module.exports.isResumeOwner = async (req, res, next) => {
  const { resumeId } = req.params;
  const resume = await Resume.findById(resumeId);

  if (!resume) {
    req.flash("error", "Resume not found.");
    return res.redirect(req.get('Referrer') || "/");
  }

  const isOwner = resume.owner.equals(req.user._id);
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    req.flash("error", "You do not have permission to delete this resume.");
    return res.redirect("back");
  }

  next();
};


module.exports.isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  req.flash('error', 'You do not have permission to access this page');
  res.redirect('/');
};

module.exports.isRecruiter = (req, res, next) => {
    if (req.user && req.user.role === "recruiter") {
        return next();
    }
    req.flash("error", "You must be a recruiter to access this page.");
    return res.redirect("/login");
};

