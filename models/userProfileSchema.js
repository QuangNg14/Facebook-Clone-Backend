const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  headline: {
    default: "Hello",
    type: String,
  },
  followedUsers: {
    type: [mongoose.Schema.Types.ObjectId], // Array of ObjectIds
    ref: "User", // Reference to 'User' model
  },
  phone: {
    type: Number,
    required: true,
  },
  zipcode: {
    type: Number,
    required: true,
  },
  dob: {
    type: String,
    default: "128999122000",
  },
  avatar: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("UserProfile", UserProfileSchema);
