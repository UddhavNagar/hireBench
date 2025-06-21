const User = require("../models/user");
const Job = require("../models/job");
const Resume = require("../models/resume");
const Application = require("../models/application");
const cleanupOrphanData = require("../utils/cleanupOrphanData");

module.exports.showProfile = async (req, res, next) => {
  try {
    let userToShow;
    if (req.user.role === "admin" && req.query.userId) {
      userToShow = await User.findById(req.query.userId);
      if (!userToShow) {
        req.flash("error", "User not found.");
        return res.redirect("/admin/users");
      }
    } else {
      userToShow = req.user;
    }
    res.render("users/profile", { user: userToShow });
  } catch (err) {
    next(err);
  }
};

module.exports.updateProfile = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    req.flash("error", "User not found.");
    return res.redirect("/users/profile");
  }

  const {
    fullName,
    phone,
    location,
    bio,
    company,
    designation,
    linkedin,
    github,
    portfolio,
  } = req.body;

  user.fullName = fullName;
  user.phone = phone;
  user.location = location;
  user.bio = bio;

  if (user.role === "recruiter") {
    user.company = company;
    user.designation = designation;
  } else if (user.role === "candidate") {
    user.linkedin = linkedin;
    user.github = github;
    user.portfolio = portfolio;
  }

  await user.save();
  req.flash("success", "Profile updated successfully.");
  res.redirect("/users/profile");
};

module.exports.editProfileForm = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    req.flash("error", "User not found.");
    return res.redirect("/users/profile");
  }
  res.render("users/edit", { user });
};

module.exports.updateProfileImage = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);

  if (!user) {
    req.flash("error", "User not found");
    return res.redirect("/users/profile");
  }

  if (req.file) {
    const imageBuffer = req.file.buffer;
    const imageType = req.file.mimetype.split("/")[1];
    const base64Image = `data:${req.file.mimetype};base64,${imageBuffer.toString("base64")}`;
    user.profileImage = base64Image;
  }

  await user.save();
  req.flash("success", "Profile image updated!");
  res.redirect("/users/profile");
};

module.exports.viewPublicProfile = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/");
    }
    res.render("users/public", { user });
  } catch (err) {
    console.error(err);
    req.flash("error", "Invalid user ID or server error");
    res.redirect("/");
  }
};


module.exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Validate login
    if (!req.user) {
      req.flash("error", "You must be logged in.");
      return res.redirect("/");
    }

    const user = await User.findById(userId);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/");
    }

    const isSelf = req.user._id.equals(userId);
    const isAdmin = req.user.role === "admin";

    if (!isSelf && !isAdmin) {
      req.flash("error", "You do not have permission to delete this account.");
      return res.redirect("/");
    }

    // ✅ Reason for this deletion structure:
    // Transactions are only supported on replica sets/mongos — standalone MongoDB doesn't support it.
    // Direct deletion with cascading is unreliable, so we manually clean up dependent data before deleting the user.
    // After deletion, we also clean up orphaned data (jobs, resumes, applications with no valid user).

    if (user.role === "candidate") {
      console.log("Candidate Deletion for:", user.username, user._id);

      const resumes = await Resume.find({ candidate: user._id });
      console.log("Resumes to delete:", resumes.map(r => r.title));

      const applications = await Application.find({ candidate: user._id });
      console.log("Applications to delete (IDs):", applications.map(a => a._id));

      await Resume.deleteMany({ candidate: user._id });
      await Application.deleteMany({ candidate: user._id });

    } else if (user.role === "recruiter") {
      console.log("Recruiter Deletion for:", user.username, userId);

      const jobs = await Job.find({ postedBy: userId });
      console.log("Jobs to delete:", jobs.map(j => j.title));

      const jobIds = jobs.map(j => j._id);
      const jobApps = await Application.find({ job: { $in: jobIds } });
      console.log("Applications to delete (job‑linked IDs):", jobApps.map(a => a._id));

      await Application.deleteMany({ job: { $in: jobIds } });
      await Job.deleteMany({ postedBy: userId });
    }

    await user.deleteOne();
    console.log("Deleted user:", user.username, user.email);

    // 🧹 Automatically clean up orphaned data
    await cleanupOrphanData();

    if (isSelf) {
      await req.logout(() => {
        req.flash("success", "Your account and all related data have been deleted.");
        return res.redirect("/");
      });
    } else {
      req.flash("success", "User and all related data deleted successfully.");
      res.redirect("/admin/users");
    }

  } catch (err) {
    console.error("Error during deletion:", err);
    next(err);
  }
};