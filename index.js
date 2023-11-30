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
const UserProfile = require("./models/userProfileSchema");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

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

const allowedOrigins = [
  "http://localhost:3001",
  "https://alluring-steel.surge.sh",
];

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, cb) => {
      let user = await User.findOne({
        thirdPartyId: profile.id,
        authType: "google",
      });
      if (!user) {
        user = new User({
          username: profile.displayName,
          email: profile.emails[0].value,
          authType: "google",
          thirdPartyId: profile.id,
        });
        await user.save();
      }
      const userProfileExists = await UserProfile.findOne({ user: user._id });
      if (!userProfileExists) {
        const newUserProfile = new UserProfile({
          user: user._id,
          username: profile.displayName,
          zipcode: 10000,
          phone: 1231231234,
          email: profile.emails[0].value,
          headline: "Hello from Google",
          followedUsers: [],
          avatar: profile.photos[0].value,
          dob: "",
          // Add other fields as needed
        });

        await newUserProfile.save();
      }

      return cb(null, user);
    }
  )
);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use("/users", userRouter);
// auth(app);
app.use(articleRouter);
app.use(authRouter);
app.use(profileRouter);

// Get the port from the environment, i.e., Heroku sets it
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  const addr = server.address();
  console.log(`Server listening at http://localhost:${addr.port}`);
});

module.exports = app;
