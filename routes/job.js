const express = require("express");
const router = express.Router();
exports.router = router;
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, validateJob, isJobOwner,isRecruiterOrAdmin ,uploadLogo} = require("../middleware.js");

const jobController = require("../controllers/jobs.js");
// index route

router
    .route("/")
    .get(wrapAsync(jobController.index))
    .post(
        isLoggedIn,
        isRecruiterOrAdmin,
        validateJob,
        uploadLogo,
        wrapAsync(jobController.createJob)
    );

router.get('/new', 
    isLoggedIn,
    isRecruiterOrAdmin,
    jobController.renderNewForm
);


router
    .route("/:jobId")
    .get(wrapAsync(jobController.showJobDetails))
    .put(
        isLoggedIn,
        isJobOwner,
        isRecruiterOrAdmin,
        validateJob,
        uploadLogo,
        wrapAsync(jobController.updateJob)
    )
    .delete(
        isLoggedIn,
        isRecruiterOrAdmin,
        isJobOwner,
        wrapAsync(jobController.deleteJob)
    );

router.get('/:jobId/edit',
    isLoggedIn, 
    isRecruiterOrAdmin,
    isJobOwner,
    wrapAsync(jobController.renderEditForm)
);
module.exports = router;