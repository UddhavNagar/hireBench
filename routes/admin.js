const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Job = require('../models/job');
const Resume = require('../models/resume');
const { isLoggedIn, isAdmin } = require('../middleware');

// GET /admin/dashboard
router.get('/dashboard', isLoggedIn, isAdmin, async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalJobs = await Job.countDocuments();
  const totalResumes = await Resume.countDocuments();
  res.render('admin/dashboard', { totalUsers, totalJobs, totalResumes });
});

router.get('/users', isAdmin, async (req, res) => {
  const users = await User.find({});
  res.render('admin/users', { users });
});

router.get('/jobs', isAdmin, async (req, res) => {
  const jobs = await Job.find({}).populate('postedBy');
  res.render('admin/jobs', { jobs });
});

router.get('/resumes', isAdmin, async (req, res) => {
  const resumes = await Resume.find({}).populate('candidate');
  res.render('admin/resumes', { resumes });
});


module.exports = router;
