const express = require('express');
const router = express.Router();
const Application = require('../models/application.js'); 
const Resume = require('../models/resume.js'); 
const {isLoggedIn} = require("../middleware.js");

router.get('/dashboard',
  isLoggedIn, 
  async (req, res) => {
  try {
    const userId = req.user._id;
    const applicationCount = await Application.countDocuments({ candidate: userId});
    const lastResume = await Resume.findOne({ candidate: userId }).sort({ updatedAt: -1 });
    console.log(lastResume);

    res.render('candidate/dashboard', {
      currentUser: req.user,
      applicationCount,
      lastResumeUploadDate: lastResume ? lastResume.updatedAt.toDateString() : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
