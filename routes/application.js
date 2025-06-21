const express = require("express");
const router = express.Router();
const { isLoggedIn, isRecruiter } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync");
const Application = require("../models/application");
const applicationController = require("../controllers/applications");

// Redirect to "My Applications"
router.get("/", (req, res) => {
  res.redirect("/applications/my");
});

// Create new application (Candidate)
router.post("/:jobId",
  isLoggedIn,
  wrapAsync(applicationController.createApplication)
);

// View my applications (Candidate)
router.get("/my",
  isLoggedIn,
  wrapAsync(applicationController.listMyApplications)
);

// View received applications for recruiter's jobs
router.get("/received",
  isRecruiter,
  wrapAsync(applicationController.listReceivedApplications)
);

// View application details (either user type, depending on control in controller)
router.get("/:applicationId",
  isLoggedIn,
  wrapAsync(applicationController.showApplicationDetails)
);

// Delete application (Candidate)
router.delete("/:applicationId",
  isLoggedIn,
  wrapAsync(applicationController.deleteApplication)
);

// Update status of application (Recruiter)
router.put("/:id/status",
  isRecruiter,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { status, note } = req.body;

    const application = await Application.findByIdAndUpdate(id, { status, note });

    if (!application || !application.job || !application.job._id) {
      req.flash("error", "Invalid application or job");
      return res.redirect("back");
    }

    res.redirect(`/recruiter/${application.job._id}/applications`);
  })
);

module.exports = router;
