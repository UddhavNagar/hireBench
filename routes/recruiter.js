const express = require("express");
const router = express.Router();
const { isLoggedIn, isRecruiter } = require("../middleware");
const Job = require("../models/job");
const Application = require("../models/application");
const wrapAsync = require("../utils/wrapAsync");

// GET /recruiter/dashboard
router.get("/dashboard", 
    isLoggedIn, 
    isRecruiter, 
    wrapAsync(async (req, res) => {
        const jobs = await Job.find({ postedBy: req.user._id });
        const counts = await Promise.all(
          jobs.map(job => Application.countDocuments({ job: job._id }))
        );
        const totalApplications = counts.reduce((sum, c) => sum + c, 0);

        res.render("recruiter/dashboard.ejs", { jobs, totalApplications });
    })
);

// Show all jobs posted by the logged-in recruiter
router.get('/jobs', isRecruiter, async (req, res) => {
  const { search } = req.query;
  const query = { postedBy: req.user._id };

  if (search) {
    query.$or = [
      { title: new RegExp(search, 'i') },
      { company: new RegExp(search, 'i') },
      { location: new RegExp(search, 'i') }
    ];
  }

  const jobs = await Job.find(query);

  const jobsWithCounts = await Promise.all(
    jobs.map(async job => {
      const count = await Application.countDocuments({ job: job._id });
      return { ...job.toObject(), applicationsCount: count };
    })
  );

  res.render('recruiter/jobs', { jobs: jobsWithCounts,search });
});


router.get('/:jobId/applications', isRecruiter, async (req, res) => {
  const { jobId } = req.params;
  const { search, sortScore, status, page = 1 } = req.query;

  const limit = 10;
  const pageNumber = parseInt(page) || 1;
  const skip = (pageNumber - 1) * limit;

  const job = await Job.findOne({ _id: jobId, postedBy: req.user._id }).lean();
  if (!job) {
    return res.status(404).send("Job not found or you're not authorized.");
  }

  // Get all applications for this job
  let applications = await Application.find({ job: jobId })
    .populate('candidate', 'username email')
    .populate('resume', 'score')
    .lean();

  // Filter by search string if provided
  if (search) {
    const searchLower = search.toLowerCase();
    applications = applications.filter(app => {
      const username = app.candidate?.username?.toLowerCase() || '';
      const email = app.candidate?.email?.toLowerCase() || '';
      return username.includes(searchLower) || email.includes(searchLower);
    });
  }

  // Filter by status if provided
  if (status) {
    applications = applications.filter(app => app.status === status);
  }

  // Sort by score if provided
  if (sortScore === 'asc') {
    applications.sort((a, b) => (a.resume?.score || 0) - (b.resume?.score || 0));
  } else if (sortScore === 'desc') {
    applications.sort((a, b) => (b.resume?.score || 0) - (a.resume?.score || 0));
  }

  const totalApplications = applications.length;
  const totalPages = Math.ceil(totalApplications / limit);

  // Paginate final filtered + sorted list
  const paginatedApplications = applications.slice(skip, skip + limit);

  res.render('recruiter/job_applications', {
    job,
    applications: paginatedApplications,
    search,
    sortScore,
    status,
    page: pageNumber,
    totalPages,
    totalApplications
  });
});


// Resume Score Dashboard
router.get('/resumes/scores', isLoggedIn, isRecruiter, async (req, res, next) => {
  try {
    // 1. Find all jobs posted by this recruiter
    const jobs = await Job.find({ owner: req.user._id }).select('_id').lean();
    const jobIds = jobs.map(job => job._id);

    // 2. Find all applications for these jobs
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate({
        path: 'resume',
        match: { score: { $ne: null } } // only scored resumes
      })
      .lean();

    // 3. Extract resumes from applications, filter out nulls (applications w/o resumes or score)
    let resumes = applications
      .map(app => app.resume)
      .filter(resume => resume != null);

    // 4. Sort resumes by score descending
    resumes.sort((a, b) => b.score - a.score);

    // 5. Mark top 10%
    if (resumes.length > 0) {
      const topCount = Math.ceil(resumes.length * 0.1);
      for (let i = 0; i < resumes.length; i++) {
        resumes[i]._isTop = i < topCount;
      }
    }

    res.render('resumes/scores', { resumes });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
