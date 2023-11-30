var express = require("express");
var router = express.Router();
const isLoggedIn = require("./auth").isLoggedIn;
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const stream = require("stream");
const uploadImage = require("../uploadCloudinary");
const mongoose = require("mongoose");

const User = require("../models/userSchema");
const UserProfile = require("../models/userProfileSchema");
require("dotenv").config();

router.get("/current_user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      isAuthenticated: true,
      user: {
        username: req.user.username,
        email: req.user.email,
      },
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

router.get("/all-users", isLoggedIn, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const users = await UserProfile.find({ user: { $ne: currentUserId } });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Server error");
  }
});

router.get("/userprofile/:username", async (req, res) => {
  const username = req.params.username;

  try {
    const userProfile = await UserProfile.findOne({ username: username });
    if (userProfile) {
      res.json(userProfile);
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// HEADLINE
router.get("/headline/:user?", isLoggedIn, async (req, res) => {
  try {
    const username = req.params.user || req.user.username;
    const userProfile = await UserProfile.findOne({
      username: username,
    }).exec();

    if (!userProfile) {
      return res.status(404).send({ message: "User not found" });
    }

    res.json({
      username: userProfile.username,
      headline: userProfile.headline,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.put("/headline", isLoggedIn, async (req, res) => {
  try {
    const headline = req.body.headline;
    if (!headline) {
      return res.status(400).send({ message: "Headline is required" });
    }

    const userProfile = await UserProfile.findOne({
      user: req.user._id,
    }).exec();

    if (!userProfile) {
      return res.status(404).send({ message: "User profile not found" });
    }

    userProfile.headline = headline;
    await userProfile.save();

    res.json({ username: req.user.username, headline: headline });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// FOLLOWERS

router.get("/followed-users/:user?", isLoggedIn, async (req, res) => {
  try {
    const username = req.params.user || req.user.username;
    const userProfile = await UserProfile.findOne(
      { username: username },
      "followedUsers"
    ).exec();

    if (!userProfile) {
      return res.status(404).send({ message: "User not found" });
    }

    // Find all user profiles that are being followed by the user
    const followedUserProfiles = await UserProfile.find({
      user: { $in: userProfile.followedUsers },
    }).exec();

    res.json({
      username: userProfile.username,
      followedUsers: followedUserProfiles.map((profile) => profile.toJSON()), // Assuming you want to send the entire profile
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/following/:user?", isLoggedIn, async (req, res) => {
  try {
    const username = req.params.user || req.user.username;
    const userProfile = await UserProfile.findOne(
      { username: username },
      "followedUsers"
    ).exec();

    if (!userProfile) {
      return res.status(404).send({ message: "User not found" });
    }

    res.json({
      username: userProfile.username,
      followedUsers: userProfile.followedUsers,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.put("/following/:user?", isLoggedIn, async (req, res) => {
  try {
    const userToAddUsername = req.params.user;
    const userToAdd = await User.findOne(
      {
        username: userToAddUsername,
      },
      "username"
    ).exec();
    const userProfile = await UserProfile.findOne(
      { user: req.user._id },
      "followedUsers"
    ).exec();

    if (!userProfile) {
      return res.status(404).send({ message: "Your user profile not found" });
    }

    if (!userToAdd) {
      return res.status(404).send({ message: "User to add not found" });
    }

    if (!userProfile.followedUsers.includes(userToAdd._id)) {
      userProfile.followedUsers.push(userToAdd._id);
      await userProfile.save();
    }

    res.json({
      username: req.user.username,
      followedUsers: userProfile.followedUsers,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.delete("/following/:user?", isLoggedIn, async (req, res) => {
  try {
    const userToRemoveId = req.params.user;
    const userProfile = await UserProfile.findOne(
      { user: req.user._id },
      "followedUsers"
    ).exec();

    if (!userProfile) {
      return res.status(404).send({ message: "Your user profile not found" });
    }

    userProfile.followedUsers = userProfile.followedUsers.filter(
      (userId) => userId != userToRemoveId
    );
    await userProfile.save();

    res.json({
      username: req.user.username,
      followedUsers: userProfile.followedUsers,
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// PERSONAL INFORMATION
router.get("/email/:user?", isLoggedIn, async (req, res) => {
  const username = req.params.user || req.user.username;
  const userProfile = await UserProfile.findOne(
    { username: username },
    "email"
  ).exec();

  if (!userProfile) {
    return res.status(404).send({ message: "User not found" });
  }

  res.json({ username: userProfile.username, email: userProfile.email });
});

router.put("/email", isLoggedIn, async (req, res) => {
  const newEmail = req.body.email;

  if (!newEmail) {
    return res.status(400).send({ message: "New email address is required" });
  }

  const userProfile = await UserProfile.findOne({ user: req.user._id }).exec();

  if (!userProfile) {
    return res.status(404).send({ message: "User profile not found" });
  }

  userProfile.email = newEmail;
  await userProfile.save();

  res.json({ username: req.user.username, email: newEmail });
});

router.get("/zipcode/:user?", isLoggedIn, async (req, res) => {
  const username = req.params.user || req.user.username;
  const userProfile = await UserProfile.findOne(
    { username: username },
    "zipcode"
  ).exec();

  if (!userProfile) {
    return res.status(404).send({ message: "User not found" });
  }

  res.json({ username: userProfile.username, zipcode: userProfile.zipcode });
});

router.put("/zipcode", isLoggedIn, async (req, res) => {
  const newZipcode = req.body.zipcode;

  if (!newZipcode) {
    return res.status(400).send({ message: "New zipcode is required" });
  }

  const userProfile = await UserProfile.findOne({ user: req.user._id }).exec();

  if (!userProfile) {
    return res.status(404).send({ message: "User profile not found" });
  }

  userProfile.zipcode = newZipcode;
  await userProfile.save();

  res.json({ username: req.user.username, zipcode: newZipcode });
});

router.get("/dob/:user?", isLoggedIn, async (req, res) => {
  const username = req.params.user || req.user.username;
  const userProfile = await UserProfile.findOne(
    { username: username },
    "dob"
  ).exec();

  if (!userProfile) {
    return res.status(404).send({ message: "User not found" });
  }

  const dobInMilliseconds = userProfile.dob.getTime();

  res.json({ username: userProfile.username, dob: dobInMilliseconds });
});

router.get("/avatar/:user?", isLoggedIn, async (req, res) => {
  const username = req.params.user || req.user.username;
  const userProfile = await UserProfile.findOne(
    { username: username },
    "picture"
  ).exec();

  if (!userProfile) {
    return res.status(404).send({ message: "User not found" });
  }

  res.json({ username: userProfile.username, avatar: userProfile.picture });
});

// AVATAR

router.put(
  "/avatar",
  isLoggedIn,
  uploadImage("public_id_field"),
  async (req, res) => {
    if (!req.fileurl || !req.fileid) {
      return res.status(422).send({ message: "Image upload failed" });
    }

    const userProfile = await UserProfile.findOne({
      user: req.user._id,
    }).exec();
    if (!userProfile) {
      return res.status(404).send({ message: "User profile not found" });
    }

    userProfile.avatar = req.fileurl;
    await userProfile.save();

    res.json({ username: req.user.username, avatar: req.fileurl });
  }
);

router.get("/phone/:user?", isLoggedIn, async (req, res) => {
  const username = req.params.user || req.user.username;
  const userProfile = await UserProfile.findOne(
    { username: username },
    "phone"
  ).exec();

  if (!userProfile) {
    return res.status(404).send({ message: "User not found" });
  }

  res.json({ username: userProfile.username, phone: userProfile.phone });
});

router.put("/phone", isLoggedIn, async (req, res) => {
  const newPhoneNumber = req.body.phone;

  if (!newPhoneNumber) {
    return res.status(400).send({ message: "New phone number is required" });
  }

  const userProfile = await UserProfile.findOne({ user: req.user._id }).exec();

  if (!userProfile) {
    return res.status(404).send({ message: "User profile not found" });
  }

  userProfile.phone = newPhoneNumber;
  await userProfile.save();

  res.json({ username: req.user.username, phone: newPhoneNumber });
});

// CHANGE PASSWORD
router.put("/password", isLoggedIn, async (req, res) => {
  const newPassword = req.body.password;

  if (!newPassword) {
    return res.status(400).send({ message: "New password is required" });
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    user.setPassword(newPassword, async (err) => {
      if (err) {
        console.error("Password change error:", err);
        return res
          .status(500)
          .send({ message: "Password change failed", error: err.message });
      }

      await user.save();

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Login after password change error:", loginErr);
          return res
            .status(500)
            .send({ message: "Login failed", error: loginErr.message });
        }
        res.json({ username: user.username, result: "success" });
      });
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(500)
      .send({ message: "Error changing password", error: error.message });
  }
});

module.exports = router;
