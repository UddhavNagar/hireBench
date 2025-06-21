const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, saveRedirectUrl ,uploadProfileImage} = require("../middleware.js");

const userController = require("../controllers/users");


// GET: Show registration form
router.get("/register", (req, res) => {
    res.render("users/selectRole");
});

// GET: Show Candidate Registration Form
router.get("/register/candidate", (req, res) => {
    res.render("users/register", { role: "candidate" });
});

// GET: Show Recruiter Registration Form
router.get("/register/recruiter", (req, res) => {
    res.render("users/register", { role: "recruiter" });
});

// POST: Register user
router.post("/register", 
    wrapAsync(async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;
        const user = new User({ username, email, role });
        const registeredUser = await User.register(user, password); // password is hashed
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to HireBench!");
            res.redirect("/jobs");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/users/register");
    }
}));

// GET: Show login form
router.get("/login", (req, res) => {
    if (req.query.returnTo) {
        req.session.returnTo = req.query.returnTo;
    }
    res.render("users/login");
});

// POST: Handle login
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/users/login",
    failureFlash: true,
  }),
  async (req, res) => {
    req.flash("success", `Welcome back, ${req.user.username || req.user.email}!`);
    const redirectUrl = req.session.returnTo || "/jobs";
    console.log(req.session.returnTo);
    delete req.session.returnTo;
    req.session.save(() => {
        res.redirect(redirectUrl);
    });
  }
);

// GET: Logout user
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You have been logged out!");
        res.redirect("/users/login");
    });
});

router.get("/profile", isLoggedIn, userController.showProfile);
router.put("/:userId", isLoggedIn, userController.updateProfile);
router.get("/:userId/edit", isLoggedIn, userController.editProfileForm);
router.post("/:userId/profile-image", isLoggedIn, uploadProfileImage, userController.updateProfileImage);
router.get("/:userId/view", userController.viewPublicProfile);

/**
 * DELETE /:userId
 *
 * ⚠️ Important Note:
 * We are NOT using transactions here because:
 * 
 * 1. MongoDB in standalone mode (non-replica set) does NOT support multi-document transactions.
 *    Attempting to use `session.startTransaction()` results in:
 *    "Transaction numbers are only allowed on a replica set member or mongos".
 *
 * 2. Directly deleting associated documents (resumes, jobs, applications) inline may leave
 *    orphaned data if something fails midway (e.g., user is deleted but jobs remain).
 * 
 * ✅ Therefore, our updated approach:
 *    - First deletes the User safely.
 *    - Then we recommend running a background cleanup script that:
 *        - Deletes resumes whose `owner` or `candidate` no longer exists.
 *        - Deletes jobs whose `postedBy` field points to a deleted user.
 *        - Deletes applications where the `job` or `candidate` no longer exists.
 *
 * This approach improves safety, avoids incomplete deletions, and works with standalone MongoDB.
 */


router.delete("/:userId", isLoggedIn, userController.deleteUser);

module.exports = router;
