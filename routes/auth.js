// routes/authRoutes.js
const express = require("express");
const passport = require("passport");
const User = require("../models/userSchema");
const UserProfile = require("../models/userProfileSchema");
const router = express.Router();
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;
const md5 = require("md5");
const sessionUser = {};
const cookieKey = "sid";

function isLoggedIn(req, res, next) {
  const sessionKey = req.cookies[cookieKey];
  const user = sessionUser[sessionKey];

  if (user) {
    req.user = user;
    next();
  } else {
    res.status(401).send("User is not authenticated");
  }
}

// Registration endpoint
router.post("/register", async (req, res) => {
  User.register(
    new User({ username: req.body.username }),
    req.body.password,
    async (err, user) => {
      if (err) {
        console.error("Registration error:", err);
        return res.status(400).send(err.message);
      }

      const userProfile = new UserProfile({
        user: user._id,
        username: req.body.username,
        email: req.body.email,
        phone: req.body.phone,
        zipcode: req.body.zipcode,
        headline: "Hello",
        followedUsers: [],
        avatar: "",
        dob: "128999122000",
      });

      userProfile
        .save()
        .then((profile) => {
          req.login(user, (loginErr) => {
            if (loginErr) {
              console.error("Login after registration error:", loginErr);
              return res.status(500).send(loginErr.message);
            }
            res.status(201).json({
              username: user.username,
              result: "success",
              id: user._id,
            });
          });
        })
        .catch((err) => {
          console.error("Profile creation error:", err);
          return res.status(400).send(err.message);
        });
    }
  );
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).send({
        message: "Authentication failed due to an error.",
        error: err,
      });
    }
    if (!user) {
      return res
        .status(401)
        .send({ message: "Authentication failed.", error: info.message });
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res
          .status(500)
          .send({ message: "Login failed due to an error.", error: loginErr });
      }
      const mySecretMessage = "This is secret message";
      const sessionKey = md5(
        mySecretMessage + new Date().getTime() + user.username
      );
      sessionUser[sessionKey] = user;

      res.cookie(cookieKey, sessionKey, {
        maxAge: 3600 * 1000,
        httpOnly: true,
        sameSite: "None",
        secure: true,
      });
      return res.json({ username: user.username, result: "success" });
    });
  })(req, res, next);
});

router.put("/logout", (req, res) => {
  const sessionKey = req.cookies[cookieKey];
  if (sessionKey) {
    delete sessionUser[sessionKey];
    res.clearCookie(cookieKey);
  }

  if (req.logout) {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      if (req.session) {
        req.session.destroy(function (err) {
          if (err) {
            console.error("Session destruction error after logout", err);
          }
        });
      }
    });
  }
  return res.json({ result: "logout success" });
});

router.get("/main", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send("You must be logged in to view this page");
  }
  // res.send("Welcome to your dashboard, " + req.user.email);
  res.redirect("http://localhost:3001/main");
});

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    if (req.user) {
      const mySecretMessage = "This is secret message";
      const sessionKey = md5(
        mySecretMessage + new Date().getTime() + req.user.username
      );
      sessionUser[sessionKey] = req.user;

      res.cookie(cookieKey, sessionKey, {
        maxAge: 3600 * 1000,
        httpOnly: true,
        sameSite: "None",
        secure: true,
      });

      res.redirect("http://localhost:3001/main");
    } else {
      res.redirect("http://localhost:3001/login");
    }
  }
);

module.exports.router = router;
module.exports.isLoggedIn = isLoggedIn;
