if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const wrapAsync = require("./utils/wrapAsync.js");
const session = require("express-session");
const flash = require("connect-flash");
const Message = require('./models/message');
const MongoStore = require('connect-mongo');


const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user");

const jobRouter = require("./routes/job.js")
const userRouter = require("./routes/user.js")
const resumeRouter = require("./routes/resume.js");
const adminRouter = require("./routes/admin.js")
const applicationRouter = require("./routes/application.js");
const recruiterRouter = require("./routes/recruiter.js");
const candidateRouter = require('./routes/candidate');
const aboutRouter = require('./routes/about');
const contactRouter = require('./routes/contact');
const messageRouter = require('./routes/message');
const analyticsRouter = require('./routes/analytics');

const DB_URL =  process.env.MONGO_URI;


main().then(()=>{
    console.log("connected to DB");
}).catch((err)=>{     
    console.log(err);
});
async function main(){
    await mongoose.connect(DB_URL)
}

app.use(methodOverride('_method'));
app.engine('ejs',ejsMate);
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,"public")));
 

const store = MongoStore.create({
    mongoUrl: DB_URL,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24*3600,  // in seconds
});

store.on("error",()=>{
    console.log("Error in Mongo Session Store");
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave:false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7*24*60*60*1000,  // number of millisecond
        maxAge : 7*24*60*60*1000,
        httpOnly: true,
    }
}

app.use(session(sessionOptions));
app.use(flash());//must before routes

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy({ usernameField: 'email' }, User.authenticate()));

app.use((req, res, next) => {
  if (!req.isAuthenticated() && req.method === "GET") {
    req.session.returnTo = req.originalUrl;
  }
  next();
});


app.use(async (req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.unreadCount = 0;

  try {
    if (req.user && (req.user.role === 'recruiter' || req.user.role === 'candidate')) {
      res.locals.unreadCount = await Message.countDocuments({
        receiver: req.user._id,
        isRead: false
      });
    }
  } catch (err) {
    console.error("Error counting unread messages:", err);
  }

  next();
});


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", wrapAsync( async (req, res) => {
    res.render("home.ejs");
}));
app.use("/jobs",jobRouter);   // use jobRouter in place of /jobs  to add modularity
app.use("/users",userRouter);
app.use('/resumes', resumeRouter);
app.use('/admin', adminRouter);
app.use('/applications', applicationRouter);
app.use("/recruiter", recruiterRouter);
app.use('/candidate', candidateRouter);
app.use('/about', aboutRouter);
app.use('/contact', contactRouter);
app.use("/messages",messageRouter);
app.use("/analytics",analyticsRouter);


// Catch-all 404 handler
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// Error handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error("Caught error:", err); // Log full stack
  try {
    res.status(err.statusCode || 500).render("error.ejs", { message: err.message || "Something went wrong!" });
  } catch (e) {
    res.status(500).send("Error rendering error page.");
  }
});


// Start server
app.listen(8080,()=>{
    console.log("hireBench at port 8080");
});