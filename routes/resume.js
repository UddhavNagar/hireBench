const express = require("express");
const router = express.Router();
const Resume = require("../models/resume");
const { isLoggedIn,isResumeOwner } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync"); 

const resumeController = require("../controllers/resumes");

router
  .route("/")
  .get(
    isLoggedIn,
    wrapAsync(resumeController.listUserResumes) 
  )
  .post(
    isLoggedIn,
    wrapAsync(resumeController.createResume) 
  );

router.get(
  "/new",
  isLoggedIn,
  wrapAsync(resumeController.renderNewResumeForm) 
);

router.get("/scores", 
  isLoggedIn, 
  wrapAsync(resumeController.showScoredResumes)
);

router.post(
  "/:resumeId/score",
  isLoggedIn,
  wrapAsync(resumeController.scoreResume)
);

router.get(
  "/:resumeId/edit",
  isLoggedIn,
  wrapAsync(resumeController.renderEditResumeForm) 
);

router
  .route("/:resumeId")
  .get(
    isLoggedIn,
    wrapAsync(resumeController.showResume) 
  )
  .put(
    isLoggedIn,
    wrapAsync(resumeController.updateResume) 
  )
  .delete(
    isLoggedIn,
    isResumeOwner,
    wrapAsync(resumeController.deleteResume) 
  );


module.exports = router;
