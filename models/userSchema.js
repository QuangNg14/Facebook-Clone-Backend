const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
  },
});

UserSchema.plugin(passportLocalMongoose, {
  usernameField: "username",
});

module.exports = mongoose.model("User", UserSchema);
