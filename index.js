// const auth = require("./src/auth");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("express-flash");
const User = require("./models/userSchema");
require("dotenv").config();

var userRouter = require("./routes/profile");
var articleRouter = require("./routes/articles");
var authRouter = require("./routes/auth").router;
var profileRouter = require("./routes/profile");
const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const mongoDBURL = process.env.MONGODB_CONNECTION_STRING;
mongoose
  .connect(mongoDBURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(flash());

app.use(
  session({
    secret: "quang_nguyen_secret_key",
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport and configure it to use sessions
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use("/users", userRouter);
// auth(app);
app.use(articleRouter);
app.use(authRouter);
app.use(profileRouter);
app.use(cors());

// Get the port from the environment, i.e., Heroku sets it
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  const addr = server.address();
  console.log(`Server listening at http://localhost:${addr.port}`);
});

module.exports = app;
